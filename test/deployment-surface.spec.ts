import * as fs from 'fs';
import * as path from 'path';

const root = path.resolve(__dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('production surface documentation and deploy config', () => {
  it('points Vercel at the canonical Next.js web app and keeps Git deploys enabled', () => {
    const config = JSON.parse(read('vercel.json'));

    expect(config.github?.enabled).toBe(true);
    expect(config.framework).toBe('nextjs');
    expect(config.installCommand).toContain('apps/e_imar_web');
    expect(config.buildCommand).toContain('apps/e_imar_web');
    expect(config.outputDirectory).toBe('apps/e_imar_web/.next');
    expect(JSON.stringify(config)).not.toMatch(/legacy\/apps|apps\/web-next|apps\/e_imar_next|frontend\//);
  });

  it('documents that public domains require verification before being called live', () => {
    const deployment = read('docs/deployment.md');
    const readme = read('README.md');

    expect(deployment).toContain('Do not claim `e-imarapp.vercel.app`');
    expect(deployment).toContain('curl -fsS https://<domain>/healthz');
    expect(deployment).toContain('curl -i https://<domain>/readyz');
    expect(readme).toContain('unverified until a Vercel deployment and `/healthz` response are checked');
  });

  it('documents production data behavior when live public sources are unavailable', () => {
    const deployment = read('docs/deployment.md');
    const readme = read('README.md');

    for (const expected of ['public_metadata', 'fallback', 'protected', 'source_not_found', 'not_ready', 'unavailable']) {
      expect(deployment).toContain(expected);
    }
    expect(deployment).toContain('must not be described as live production data');
    expect(readme).toContain('not official parcel,\nzoning, plan, or municipality facts');
  });

  it('documents Flutter as a legacy prototype rather than a production mobile deploy', () => {
    const deployment = read('docs/deployment.md');
    const mobileReadme = read('legacy/apps/e_imar_mobile/README.md');
    const workflow = read('.github/workflows/mobile-flutter.yml');

    expect(deployment).toContain('compile-checked prototype');
    expect(mobileReadme).toContain('legacy/prototype surface');
    expect(mobileReadme).toContain('not the production mobile app');
    expect(workflow).toContain('legacy/apps/e_imar_mobile');
    expect(workflow).not.toContain('</');
  });
});
