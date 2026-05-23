import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { inspectOptionalSecret, MAP_PROVIDER_ENV_NAMES } from '../config/provider-env';
import { evaluateSourceRequirement } from '../sources/source-requirements';
import { SOURCE_REGISTRY, SourceRegistryEntry } from '../sources/source-registry';

@Injectable()
export class IngestionService {
  constructor(private readonly config?: ConfigService) {}

  accessRequirements() {
    const sources = SOURCE_REGISTRY
      .map((source) => ({ source, requirement: this.evaluate(source) }))
      .filter(({ source, requirement }) => ['requires_credentials', 'requires_legal_agreement'].includes(source.access.status) || requirement.requiredEnv.length > 0)
      .map(({ source, requirement }) => ({
        sourceId: source.id,
        name: source.name,
        accessStatus: source.access.status,
        reason: source.access.notes,
        homepageUrl: source.homepageUrl,
        legalRequirement: requirement.legalRequirement,
        credentialRequirement: requirement.credentialRequirement,
        preflightStatus: requirement.preflightStatus,
        requiredEnv: requirement.requiredEnv,
        missingEnv: requirement.missingEnv,
        configuredEnv: requirement.configuredEnv,
        operatorAction: requirement.operatorAction,
        productionUse: requirement.productionUse
      }));

    return {
      status: 'ok',
      count: sources.length,
      sources,
      note: 'Only source metadata and required environment variable names are returned. Secret values are never exposed.'
    };
  }

  readiness() {
    const sources = SOURCE_REGISTRY.map((source) => {
      const requirement = this.evaluate(source);
      return {
        sourceId: source.id,
        name: source.name,
        jurisdiction: source.jurisdiction,
        category: source.category,
        accessStatus: source.access.status,
        homepageUrl: source.homepageUrl,
        connectorKinds: source.connectorKinds,
        capabilities: source.capabilities,
        preflightStatus: requirement.preflightStatus,
        canAttemptLiveProbe: requirement.canAttemptLiveProbe,
        canStartIngestion: requirement.canStartIngestion,
        requiredEnv: requirement.requiredEnv,
        missingEnv: requirement.missingEnv,
        configuredEnv: requirement.configuredEnv,
        legalRequirement: requirement.legalRequirement,
        credentialRequirement: requirement.credentialRequirement,
        operatorAction: requirement.operatorAction,
        productionUse: requirement.productionUse,
        env: requirement.env
      };
    });

    const summary = {
      total: sources.length,
      byPreflightStatus: this.countBy(sources, (source) => source.preflightStatus),
      readyForProbe: sources.filter((source) => source.canAttemptLiveProbe).length,
      readyForIngestion: sources.filter((source) => source.canStartIngestion).length,
      blockedByEnv: sources.filter((source) => source.missingEnv.length > 0).length,
      mapProviders: MAP_PROVIDER_ENV_NAMES.map((envName) => inspectOptionalSecret(envName, this.readEnv(envName)))
    };

    return {
      status: summary.blockedByEnv > 0 ? 'action_required' : 'ok',
      generatedAt: new Date().toISOString(),
      summary,
      blockers: sources.filter((source) => source.missingEnv.length > 0 || ['requires_credentials', 'requires_legal_agreement'].includes(source.preflightStatus)),
      sources,
      note: 'Readiness exposes env names, statuses, and actions only. Secret values are never returned.'
    };
  }

  private evaluate(source: SourceRegistryEntry) {
    return evaluateSourceRequirement(source, (envName) => this.readEnv(envName));
  }

  private readEnv(envName: string): unknown {
    return this.config?.get<string>(envName) ?? process.env[envName];
  }

  private countBy<T>(items: T[], getter: (item: T) => string): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = getter(item);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }
}
