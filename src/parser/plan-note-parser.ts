import { createHash } from 'crypto';
import { inflateSync } from 'zlib';

export type PlanNoteWarningCode =
  | 'not_pdf'
  | 'encrypted_pdf'
  | 'unsupported_stream_filter'
  | 'empty_text'
  | 'low_text_coverage'
  | 'no_sections_detected';

export interface PlanNoteWarning {
  code: PlanNoteWarningCode;
  message: string;
}

export interface NormalizedPlanTerm {
  key: string;
  label: string;
  sourceText: string;
}

export interface PlanNoteRule {
  key: string;
  label: string;
  value: string;
  unit?: string;
  sourceText: string;
}

export interface PlanNoteSection {
  title: string;
  normalizedTitle: string;
  text: string;
  terms: NormalizedPlanTerm[];
  rules: PlanNoteRule[];
}

export interface PlanNoteSourceMetadata {
  sourceName?: string;
  byteLength: number;
  sha256: string;
  pageCount: number | null;
  extractionMethod: 'pdf-content-stream';
  extractedTextLength: number;
}

export interface ParsedPlanNotePdf {
  status: 'ok' | 'partial' | 'invalid_input';
  text: string;
  sections: PlanNoteSection[];
  terms: NormalizedPlanTerm[];
  metadata: PlanNoteSourceMetadata;
  warnings: PlanNoteWarning[];
}

interface TermPattern {
  key: string;
  label: string;
  pattern: RegExp;
}

const TERM_PATTERNS: TermPattern[] = [
  { key: 'plan_notes', label: 'Plan notları', pattern: /\bplan\s*not(?:u|ları|lari)?\b/iu },
  { key: 'residential_area', label: 'Konut alanı', pattern: /konut\s+alan[ıi]/iu },
  { key: 'commercial_area', label: 'Ticaret alanı', pattern: /ticaret\s+alan[ıi]|\bticari\b/iu },
  { key: 'mixed_use', label: 'Karma kullanım', pattern: /karma\s+kullan[ıi]m|konut\s*\+\s*ticaret/iu },
  { key: 'social_facility', label: 'Sosyal donatı alanı', pattern: /sosyal\s+donat[ıi]/iu },
  { key: 'park_area', label: 'Park/yeşil alan', pattern: /\bpark\b|yeşil\s+alan|yesil\s+alan/iu },
  { key: 'floor_area_ratio', label: 'Emsal / KAKS', pattern: /\bemsal\b|\bkaks\b|\be\s*[:=]\s*\d/iu },
  { key: 'site_coverage_ratio', label: 'TAKS', pattern: /\btaks\b/iu },
  { key: 'max_height', label: 'Azami yükseklik', pattern: /\bh\s*max\b|\byençok\s+y[üu]kseklik\b|\bazami\s+y[üu]kseklik\b/iu },
  { key: 'setback', label: 'Çekme mesafesi', pattern: /çekme\s+mesafesi|cekme\s+mesafesi|yap[ıi]\s+yaklaşma|yapi\s+yaklasma/iu },
  { key: 'subdivision', label: 'İfraz', pattern: /[iİ]fraz/iu },
  { key: 'amalgamation', label: 'Tevhid', pattern: /\btevhid\b/iu },
  { key: 'public_dedication', label: 'Terk', pattern: /\bterk\b/iu },
  { key: 'municipality_approval', label: 'Belediye onayı', pattern: /\bbelediye\b|\bonay[ıi]\b/iu }
];

const SECTION_HEADING_PATTERN = /^(?:\d+(?:\.\d+)*[.)-]?\s*)?([A-ZÇĞİÖŞÜ0-9][A-ZÇĞİÖŞÜ0-9\s/()'’-]{3,}|Plan\s+Not(?:u|ları|lari)|Genel\s+H[üu]k[üu]mler|Uygulama\s+H[üu]k[üu]mleri)\s*:?$/u;

export function parsePlanNotePdfBytes(pdfBytes: Buffer | Uint8Array, options: { sourceName?: string } = {}): ParsedPlanNotePdf {
  const bytes = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);
  const warnings: PlanNoteWarning[] = [];
  const metadata: PlanNoteSourceMetadata = {
    sourceName: options.sourceName,
    byteLength: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    pageCount: estimatePageCount(bytes),
    extractionMethod: 'pdf-content-stream',
    extractedTextLength: 0
  };

  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    warnings.push({ code: 'not_pdf', message: 'Input bytes do not start with a PDF header.' });
    return buildResult('', metadata, warnings, 'invalid_input');
  }

  const source = bytes.toString('latin1');
  if (/\/Encrypt\b/.test(source)) {
    warnings.push({ code: 'encrypted_pdf', message: 'PDF appears encrypted; text extraction may be incomplete.' });
  }

  const extraction = extractTextFromPdfSource(source, warnings);
  const text = normalizeWhitespace(extraction);
  metadata.extractedTextLength = text.length;

  if (!text) {
    warnings.push({ code: 'empty_text', message: 'No embedded text was extracted. Scanned/image-only PDFs need OCR outside this parser foundation.' });
  } else if (text.length < 80 && bytes.length > 1500) {
    warnings.push({ code: 'low_text_coverage', message: 'Extracted text is short relative to PDF size; parsing may be incomplete.' });
  }

  return buildResult(text, metadata, warnings);
}

export function parsePlanNoteText(text: string, metadata?: Partial<PlanNoteSourceMetadata>): ParsedPlanNotePdf {
  const normalizedText = normalizeWhitespace(text);
  const warnings: PlanNoteWarning[] = [];
  const sourceMetadata: PlanNoteSourceMetadata = {
    byteLength: metadata?.byteLength ?? Buffer.byteLength(text),
    sha256: metadata?.sha256 ?? createHash('sha256').update(text).digest('hex'),
    pageCount: metadata?.pageCount ?? null,
    extractionMethod: 'pdf-content-stream',
    extractedTextLength: normalizedText.length,
    sourceName: metadata?.sourceName
  };
  if (!normalizedText) warnings.push({ code: 'empty_text', message: 'No text was provided for parsing.' });
  return buildResult(normalizedText, sourceMetadata, warnings);
}

function buildResult(
  text: string,
  metadata: PlanNoteSourceMetadata,
  warnings: PlanNoteWarning[],
  forcedStatus?: ParsedPlanNotePdf['status']
): ParsedPlanNotePdf {
  const sections = splitSections(text);
  if (text && sections.length === 0) {
    warnings.push({ code: 'no_sections_detected', message: 'Text was extracted, but no plan-note section headings were detected.' });
  }
  const terms = findTerms(text);
  return {
    status: forcedStatus ?? (warnings.length ? 'partial' : 'ok'),
    text,
    sections,
    terms,
    metadata,
    warnings
  };
}

function extractTextFromPdfSource(source: string, warnings: PlanNoteWarning[]): string {
  const chunks: string[] = [];
  const streamPattern = /(\d+)\s+\d+\s+obj([\s\S]*?)stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamPattern.exec(source)) !== null) {
    const dictionary = match[2] ?? '';
    let streamContent = Buffer.from(match[3] ?? '', 'latin1');
    if (/\/Filter\s*\/FlateDecode\b/.test(dictionary)) {
      try {
        streamContent = inflateSync(streamContent);
      } catch {
        warnings.push({ code: 'unsupported_stream_filter', message: `Could not inflate PDF stream object ${match[1]}.` });
        continue;
      }
    } else if (/\/Filter\b/.test(dictionary)) {
      warnings.push({ code: 'unsupported_stream_filter', message: `PDF stream object ${match[1]} uses an unsupported filter.` });
      continue;
    }
    chunks.push(extractTextOperators(streamContent.toString('latin1')));
  }

  return chunks.join('\n');
}

function extractTextOperators(content: string): string {
  const tokens: string[] = [];
  const textObjectPattern = /BT([\s\S]*?)ET/g;
  let textObject: RegExpExecArray | null;
  while ((textObject = textObjectPattern.exec(content)) !== null) {
    const body = textObject[1] ?? '';
    const stringPattern = /\((?:\\.|[^\\)])*\)\s*Tj|\[(.*?)\]\s*TJ|'\s*\((?:\\.|[^\\)])*\)|"\s*[^\(]*\((?:\\.|[^\\)])*\)/g;
    let match: RegExpExecArray | null;
    while ((match = stringPattern.exec(body)) !== null) {
      const value = match[0];
      const strings = value.match(/\((?:\\.|[^\\)])*\)/g) ?? [];
      for (const raw of strings) tokens.push(decodePdfLiteralString(raw.slice(1, -1)));
      if (/\]\s*TJ$/.test(value)) tokens.push(' ');
    }
  }
  return tokens.join('\n');
}

function decodePdfLiteralString(raw: string): string {
  const bytes: number[] = [];
  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];
    if (char !== '\\') {
      bytes.push(char.charCodeAt(0) & 0xff);
      continue;
    }
    const next = raw[++index];
    if (next === undefined) break;
    if (/[0-7]/.test(next)) {
      let octal = next;
      for (let count = 0; count < 2 && /[0-7]/.test(raw[index + 1] ?? ''); count++) octal += raw[++index];
      bytes.push(parseInt(octal, 8));
      continue;
    }
    const escapes: Record<string, number | undefined> = { n: 10, r: 13, t: 9, b: 8, f: 12, '(': 40, ')': 41, '\\': 92 };
    const mapped = escapes[next];
    if (mapped !== undefined) bytes.push(mapped);
  }

  const buffer = Buffer.from(bytes);
  if (buffer.length >= 2 && ((buffer[0] === 0xfe && buffer[1] === 0xff) || (buffer[0] === 0xff && buffer[1] === 0xfe))) {
    return buffer.toString('utf16le').replace(/^\uFFFE?/, '');
  }
  return buffer.toString('latin1');
}

function splitSections(text: string): PlanNoteSection[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (isSectionHeading(line)) {
      if (current && current.lines.length) sections.push(current);
      current = { title: cleanHeading(line), lines: [] };
      continue;
    }
    if (!current && TERM_PATTERNS.some((term) => term.pattern.test(line))) {
      current = { title: 'Plan notları', lines: [] };
    }
    current?.lines.push(line);
  }
  if (current && current.lines.length) sections.push(current);

  return sections.map((section) => {
    const sectionText = section.lines.join('\n');
    return {
      title: section.title,
      normalizedTitle: normalizeTurkishText(section.title),
      text: sectionText,
      terms: findTerms(`${section.title}\n${sectionText}`),
      rules: extractRules(sectionText)
    };
  });
}

function isSectionHeading(line: string): boolean {
  if (line.length > 90) return false;
  return SECTION_HEADING_PATTERN.test(line) || /^\d+(?:\.\d+)*[.)-]\s+\S+/.test(line);
}

function cleanHeading(line: string): string {
  return line.replace(/\s*:\s*$/, '').trim();
}

function findTerms(text: string): NormalizedPlanTerm[] {
  const found = new Map<string, NormalizedPlanTerm>();
  for (const term of TERM_PATTERNS) {
    const match = text.match(term.pattern);
    if (match?.[0]) found.set(term.key, { key: term.key, label: term.label, sourceText: match[0] });
  }
  return Array.from(found.values());
}

function extractRules(text: string): PlanNoteRule[] {
  const rules: PlanNoteRule[] = [];
  const patterns: Array<{ key: string; label: string; pattern: RegExp; unit?: string }> = [
    { key: 'floor_area_ratio', label: 'Emsal / KAKS', pattern: /\b(?:emsal|kaks|e)\s*[:=]?\s*(\d+(?:[,.]\d+)?)/giu },
    { key: 'site_coverage_ratio', label: 'TAKS', pattern: /\btaks\s*[:=]?\s*(\d+(?:[,.]\d+)?)/giu },
    { key: 'max_height', label: 'Azami yükseklik', pattern: /\b(?:h\s*max|yençok\s+y[üu]kseklik|azami\s+y[üu]kseklik)\s*[:=]?\s*(\d+(?:[,.]\d+)?)\s*(m|metre)?/giu, unit: 'm' },
    { key: 'setback', label: 'Çekme mesafesi', pattern: /\b(?:çekme\s+mesafesi|cekme\s+mesafesi|yap[ıi]\s+yaklaşma|yapi\s+yaklasma)\D{0,20}(\d+(?:[,.]\d+)?)\s*(m|metre)?/giu, unit: 'm' }
  ];

  for (const rulePattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = rulePattern.pattern.exec(text)) !== null) {
      rules.push({
        key: rulePattern.key,
        label: rulePattern.label,
        value: (match[1] ?? '').replace(',', '.'),
        unit: match[2] ?? rulePattern.unit,
        sourceText: match[0].trim()
      });
    }
  }
  return rules;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/[\t\f ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeTurkishText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function estimatePageCount(bytes: Buffer): number | null {
  const source = bytes.toString('latin1');
  const matches = source.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : null;
}
