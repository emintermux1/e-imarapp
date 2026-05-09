import { buildParcelReport } from '../src/website/parcel-report';

describe('buildParcelReport', () => {
  it('renders truthful unavailable values and disclaimer when data is missing', () => {
    const report = buildParcelReport({
      query: { type: 'ada_parsel', ada: '12', parselNo: '7' },
      parcelWorkflow: { status: 'not_ready', parcelQuery: { status: 'not_ready', parcels: [] } },
      municipalWorkflow: { status: 'source_not_found', provenance: [] },
    });

    expect(report.status).toBe('ok');
    expect(report.disclaimer).toContain('resmi belge değildir');
    expect(report.sections[0].fields.find((field) => field.label === 'Ada')?.value).toBe('12');
    expect(report.sections[1].fields.find((field) => field.label === 'TAKS')?.value).toBe('unavailable');
    expect(report.printableHtml).toContain('unavailable');
    expect(report.printableHtml).toContain('Bu çıktı resmi belge değildir');
  });
});
