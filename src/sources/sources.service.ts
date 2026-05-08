import { Injectable, NotFoundException } from '@nestjs/common';
import { SOURCE_REGISTRY } from './source-registry';

@Injectable()
export class SourcesService {
  list() {
    return { status: 'ok', count: SOURCE_REGISTRY.length, sources: SOURCE_REGISTRY };
  }

  get(id: string) {
    const source = SOURCE_REGISTRY.find((entry) => entry.id === id);
    if (!source) throw new NotFoundException(`Source '${id}' is not registered.`);
    return source;
  }
}
