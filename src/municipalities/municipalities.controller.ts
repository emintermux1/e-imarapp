import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConnectorKind, SourceMetadata } from '../connectors/connector.types';
import { DiscoveryService } from '../connectors/discovery.service';

interface MunicipalitySummary {
  id: string;
  name: string;
  sourceCount: number;
  sources: Pick<SourceMetadata, 'id' | 'name' | 'homepageUrl' | 'connectorKinds' | 'access'>[];
}

@ApiTags('municipalities')
@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get()
  listMunicipalities(): MunicipalitySummary[] {
    const grouped = new Map<string, SourceMetadata[]>();
    for (const source of this.discovery.listSources()) {
      if (source.jurisdiction !== 'municipal' || !source.municipalityName) {
        continue;
      }
      const existing = grouped.get(source.municipalityName) ?? [];
      existing.push(source);
      grouped.set(source.municipalityName, existing);
    }

    return [...grouped.entries()].map(([name, sources]) => ({
      id: this.slugify(name),
      name,
      sourceCount: sources.length,
      sources: sources.map(({ id, name, homepageUrl, connectorKinds, access }) => ({
        id,
        name,
        homepageUrl,
        connectorKinds,
        access
      }))
    }));
  }

  @Get(':id/connectors')
  listConnectors(@Param('id') id: string) {
    const municipality = this.listMunicipalities().find((candidate) => candidate.id === id);
    if (!municipality) {
      return {
        municipalityId: id,
        connectors: [],
        issue: 'No registered real seed source exists for this municipality yet.'
      };
    }

    return {
      municipalityId: id,
      connectors: municipality.sources.flatMap((source) =>
        source.connectorKinds.map((kind: ConnectorKind) => ({
          sourceId: source.id,
          sourceName: source.name,
          kind,
          homepageUrl: source.homepageUrl,
          access: source.access
        }))
      )
    };
  }

  private slugify(value: string): string {
    return value
      .toLocaleLowerCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
