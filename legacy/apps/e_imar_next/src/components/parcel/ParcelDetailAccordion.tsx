'use client';

import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { StatusBadge } from '@/components/data/StatusBadge';
import { ParcelQuickFactsCard } from './ParcelQuickFactsCard';
import { PotentialSummaryCard } from './PotentialSummaryCard';
import { EmsalShareCard } from './EmsalShareCard';
import { ProvenanceBlock } from './ProvenanceBlock';
import type { ParcelWorkflowView } from '@/lib/utils/parcel';

interface ParcelDetailAccordionProps {
  view: ParcelWorkflowView;
  defaultOpen?: string[];
}

export function ParcelDetailAccordion({
  view,
  defaultOpen = ['general', 'potential', 'emsal', 'provenance'],
}: ParcelDetailAccordionProps) {
  return (
    <Accordion type="multiple" defaultValue={defaultOpen}>
      <AccordionItem
        id="general"
        title="Genel bilgiler"
        description="Ada/parsel, alan, zoning, plan başlığı"
        trailing={view.parcelStatus ? <StatusBadge status={view.parcelStatus} size="xs" /> : null}
      >
        <div className="space-y-3">
          <ParcelQuickFactsCard parcel={view.selectedParcel} />
        </div>
      </AccordionItem>

      <AccordionItem
        id="potential"
        title="Yapılaşma potansiyeli"
        description="Backend potansiyel özeti"
        trailing={view.potentialStatus ? <StatusBadge status={view.potentialStatus} size="xs" /> : null}
      >
        <PotentialSummaryCard
          potential={view.potential}
          status={view.potentialStatus}
          nextActions={view.potentialSummary?.nextActions}
        />
      </AccordionItem>

      <AccordionItem
        id="emsal"
        title="Emsal / pay hesabı"
        description="Backend tarafından döndürülen emsalShare"
        trailing={view.emsalStatus ? <StatusBadge status={view.emsalStatus} size="xs" /> : null}
      >
        <EmsalShareCard share={view.emsalShare} status={view.emsalStatus} />
      </AccordionItem>

      <AccordionItem
        id="plan-history"
        title="Plan değişim geçmişi"
        description="Time-machine modülü hazır olduğunda burada görünecek"
        trailing={<StatusBadge status="not_ready" size="xs" />}
      >
        <ReadinessGate
          status="not_ready"
          notReadyTitle="Sprint 2 — plan tarihçesi"
          notReadyDescription="Plan değişim geçmişi modülü Sprint 2'de aktif edilecek."
          nextActions={['Time-machine bağlantısı için Sprint 2 ingestion modülünü bekleyin.']}
        >
          <div />
        </ReadinessGate>
      </AccordionItem>

      <AccordionItem
        id="risk"
        title="Risk göstergeleri"
        description="Detaylı doğal afet ve plan riski"
        trailing={<StatusBadge status="not_ready" size="xs" />}
      >
        <ReadinessGate
          status="not_ready"
          notReadyTitle="Sprint 2 — risk paneli"
          notReadyDescription="Detaylı risk göstergeleri Sprint 2'de bağlanacak."
          nextActions={['Doğal afet katmanı ve risk skoru için Sprint 2 backend yayını bekleniyor.']}
        >
          <div />
        </ReadinessGate>
      </AccordionItem>

      <AccordionItem
        id="provenance"
        title="Kaynak ve provenance"
        description="Verinin nereden ve ne zaman geldiği"
      >
        <ProvenanceBlock provenance={view.provenance} />
      </AccordionItem>
    </Accordion>
  );
}
