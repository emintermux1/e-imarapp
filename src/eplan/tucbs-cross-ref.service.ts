import { Injectable } from '@nestjs/common';

@Injectable()
export class TucbsCrossRefService {
  discoverCapabilities() {
    return {
      status: 'not_ready',
      sourceId: 'tucbs-public-api',
      note: 'Use connector discovery to probe public TUCBS WMS/WFS/API capabilities before ingestion.'
    };
  }
}
