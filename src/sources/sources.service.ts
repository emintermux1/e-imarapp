import { Injectable, NotFoundException } from '@nestjs/common';
import { SOURCE_REGISTRY, SourceAccessStatus } from './source-registry';
import { summarizeSources, toMunicipalitySummary } from './source-coverage';

@Injectable()
export class SourcesService {
  list() {
    return { status: 'ok', count: SOURCE_REGISTRY.length, sources: SOURCE_REGISTRY };
  }

  summary() {
    return { status: 'ok', sourceCoverage: summarizeSources(SOURCE_REGISTRY) };
  }

  municipalities(filters: { province?: string; vendor?: string; accessStatus?: SourceAccessStatus }) {
    const normalizedProvince = filters.province?.toLocaleLowerCase('tr-TR');
    const normalizedVendor = filters.vendor?.toLocaleLowerCase('tr-TR');
    const sources = SOURCE_REGISTRY.filter((source) => {
      if (source.jurisdiction !== 'municipal') return false;
      if (normalizedProvince && source.metadata?.province?.toLocaleLowerCase('tr-TR') !== normalizedProvince) return false;
      if (normalizedVendor && source.metadata?.vendor?.toLocaleLowerCase('tr-TR') !== normalizedVendor) return false;
      if (filters.accessStatus && source.access.status !== filters.accessStatus) return false;
      return true;
    }).map(toMunicipalitySummary);

    return { status: 'ok', count: sources.length, municipalities: sources };
  }

  get(id: string) {
    const source = SOURCE_REGISTRY.find((entry) => entry.id === id);
    if (!source) throw new NotFoundException(`Source '${id}' is not registered.`);
    return source;
  }
}
