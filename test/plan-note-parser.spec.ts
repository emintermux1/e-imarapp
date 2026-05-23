import { deflateSync } from 'zlib';
import { parsePlanNotePdfBytes, parsePlanNoteText } from '../src/parser/plan-note-parser';

function buildSyntheticPdf(lines: string[], options: { flate?: boolean } = {}): Buffer {
  const textOps = lines
    .map((line, index) => `${index === 0 ? '72 760 Td' : '0 -18 Td'} (${escapePdfString(line)}) Tj`)
    .join('\n');
  const rawStream = Buffer.from(`BT\n/F1 12 Tf\n${textOps}\nET`, 'latin1');
  const streamBytes = options.flate ? deflateSync(rawStream) : rawStream;
  const filter = options.flate ? '/Filter /FlateDecode\n' : '';
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamBytes.length}\n${filter}>>\nstream\n${streamBytes.toString('latin1')}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function escapePdfString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

describe('plan note parser', () => {
  it('extracts structured plan-note sections and metadata from local PDF bytes', () => {
    const pdf = buildSyntheticPdf([
      'PLAN NOTLARI',
      '1. GENEL HUKUMLER',
      'Konut Alani icin Emsal: 1.50 ve TAKS: 0.40 uygulanir.',
      'Hmax: 12.50 m ve cekme mesafesi 5 m olacaktir.'
    ]);

    const result = parsePlanNotePdfBytes(pdf, { sourceName: 'synthetic-plan-note.pdf' });

    expect(result.status).toBe('ok');
    expect(result.metadata.sourceName).toBe('synthetic-plan-note.pdf');
    expect(result.metadata.byteLength).toBe(pdf.length);
    expect(result.metadata.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.metadata.pageCount).toBe(1);
    expect(result.text).toContain('PLAN NOTLARI');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]).toMatchObject({ title: '1. GENEL HUKUMLER', normalizedTitle: '1_genel_hukumler' });
    expect(result.sections[0]?.terms.map((term) => term.key)).toEqual(expect.arrayContaining(['residential_area', 'floor_area_ratio', 'site_coverage_ratio', 'max_height', 'setback']));
    expect(result.sections[0]?.rules).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'floor_area_ratio', value: '1.50' }),
      expect.objectContaining({ key: 'site_coverage_ratio', value: '0.40' }),
      expect.objectContaining({ key: 'max_height', value: '12.50', unit: 'm' }),
      expect.objectContaining({ key: 'setback', value: '5', unit: 'm' })
    ]));
    expect(result.warnings).toEqual([]);
  });

  it('supports flate-compressed PDF content streams', () => {
    const pdf = buildSyntheticPdf(['PLAN NOTLARI', 'Ticaret Alani Emsal: 2.00'], { flate: true });

    const result = parsePlanNotePdfBytes(pdf);

    expect(result.status).toBe('ok');
    expect(result.terms.map((term) => term.key)).toEqual(expect.arrayContaining(['commercial_area', 'floor_area_ratio']));
    expect(result.sections[0]?.rules).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'floor_area_ratio', value: '2.00' })]));
  });

  it('normalizes Turkish zoning terms from extracted text without official claims', () => {
    const result = parsePlanNoteText([
      'Plan Notları',
      'Uygulama Hükümleri',
      'Konut alanı ve sosyal donatı alanı ayrılmıştır.',
      'İfraz, tevhid ve kamuya terk işlemleri belediye onayı ile yapılır.'
    ].join('\n'));

    expect(result.status).toBe('ok');
    expect(result.sections[0]?.normalizedTitle).toBe('uygulama_hukumleri');
    expect(result.terms.map((term) => term.key)).toEqual(expect.arrayContaining(['residential_area', 'social_facility', 'subdivision', 'amalgamation', 'public_dedication', 'municipality_approval']));
    expect(JSON.stringify(result)).not.toMatch(/resmi|official/i);
  });

  it('returns warnings when PDF parsing is incomplete', () => {
    const emptyPdf = buildSyntheticPdf([]);

    const result = parsePlanNotePdfBytes(emptyPdf);

    expect(result.status).toBe('partial');
    expect(result.sections).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'empty_text' })]));
  });

  it('rejects non-PDF bytes with source metadata and warning', () => {
    const result = parsePlanNotePdfBytes(Buffer.from('not a pdf'));

    expect(result.status).toBe('invalid_input');
    expect(result.metadata.byteLength).toBe(9);
    expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'not_pdf' })]));
  });
});
