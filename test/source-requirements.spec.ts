import { evaluateSourceRequirement, requirementForSource } from '../src/sources/source-requirements';
import { SOURCE_REGISTRY } from '../src/sources/source-registry';

describe('source requirement readiness', () => {
  it('keeps TKGM blocked until legal/session references are configured', () => {
    const tkgm = SOURCE_REGISTRY.find((source) => source.id === 'tkgm-parsel-sorgu')!;
    const requirement = evaluateSourceRequirement(tkgm, () => undefined);

    expect(requirement.preflightStatus).toBe('requires_legal_agreement');
    expect(requirement.requiredEnv).toEqual(['TKGM_LEGAL_AGREEMENT_REF', 'TKGM_SESSION_REF']);
    expect(requirement.missingEnv).toEqual(requirement.requiredEnv);
    expect(requirement.canStartIngestion).toBe(false);
    expect(JSON.stringify(requirement)).not.toMatch(/actual-token|session-value/i);
  });

  it('allows protected sources to probe only after refs are present', () => {
    const tkgm = SOURCE_REGISTRY.find((source) => source.id === 'tkgm-parsel-sorgu')!;
    const requirement = evaluateSourceRequirement(tkgm, (envName) => `${envName}-configured`);

    expect(requirement.preflightStatus).toBe('ready_for_probe');
    expect(requirement.missingEnv).toEqual([]);
    expect(requirement.configuredEnv).toEqual(['TKGM_LEGAL_AGREEMENT_REF', 'TKGM_SESSION_REF']);
    expect(requirement.canAttemptLiveProbe).toBe(true);
    expect(requirement.canStartIngestion).toBe(false);
    expect(JSON.stringify(requirement)).not.toContain('TKGM_SESSION_REF-configured');
  });

  it('classifies commercial map providers without exposing configured values', () => {
    const mapbox = SOURCE_REGISTRY.find((source) => source.id === 'mapbox-maps-api')!;
    const missing = evaluateSourceRequirement(mapbox, () => undefined);
    const ready = evaluateSourceRequirement(mapbox, () => 'pk.public-placeholder');

    expect(missing.preflightStatus).toBe('requires_credentials');
    expect(missing.requiredEnv).toEqual(['MAPBOX_ACCESS_TOKEN']);
    expect(ready.preflightStatus).toBe('ready_for_probe');
    expect(ready.configuredEnv).toEqual(['MAPBOX_ACCESS_TOKEN']);
    expect(JSON.stringify(ready)).not.toContain('pk.public-placeholder');
  });

  it('keeps public municipal portals in method-contract discovery mode', () => {
    const pendik = SOURCE_REGISTRY.find((source) => source.id === 'pendik-keos-imar')!;
    const definition = requirementForSource(pendik);
    const requirement = evaluateSourceRequirement(pendik, () => undefined);

    expect(definition.requiredEnv).toEqual([]);
    expect(requirement.preflightStatus).toBe('needs_method_contract');
    expect(requirement.canAttemptLiveProbe).toBe(true);
    expect(requirement.canStartIngestion).toBe(false);
  });
});
