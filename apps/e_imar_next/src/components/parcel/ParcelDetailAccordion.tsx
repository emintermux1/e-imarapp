'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { ReadinessGate } from '@/components/data/ReadinessGate';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ParcelQuickFactsCard } from './ParcelQuickFactsCard';
import { PotentialSummaryCard } from './PotentialSummaryCard';
import { EmsalShareCard } from './EmsalShareCard';
import { ProvenanceBlock } from './ProvenanceBlock';
import { useUIStore } from '@/lib/store/ui-store';
import type { ParcelWorkflowView } from '@/lib/utils/parcel';

interface ParcelDetailAccordionProps {
  view: ParcelWorkflowView;
  defaultOpen?: string[];
}

function pickPlanNote(view: ParcelWorkflowView): string | null {
  const candidates: unknown[] = [];
  const raw = view.selectedParcel?.raw ?? {};
  for (const key of [
    'planNote',
    'plan_note',
    'planAciklamasi',
    'planAciklama',
    'plan_aciklamasi',
    'planNotu',
    'plan_notu',
  ]) {
    if (raw[key]) candidates.push(raw[key]);
  }
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return null;
}

export function ParcelDetailAccordion({
  view,
  defaultOpen = ['general', 'potential', 'emsal', 'provenance'],
}: ParcelDetailAccordionProps) {
  const router = useRouter();
  const setPendingPlanNote = useUIStore((s) => s.setPendingPlanNote);
  const planNote = pickPlanNote(view);
  return (
    <>
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
          description="Time machine ile karşılaştırın"
        >
          <div className="space-y-2">
            <p className="m-0 text-[13px] text-text-secondary">
              Bu parselin plan revizyonlarını yan yana karşılaştırmak için time machine modülünü açın.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push('/time-machine')}
            >
              Time machine&apos;i aç
            </Button>
          </div>
        </AccordionItem>

        <AccordionItem
          id="risk"
          title="Risk göstergeleri"
          description="Detaylı doğal afet ve plan riski"
          trailing={<StatusBadge status="not_ready" size="xs" />}
        >
          <ReadinessGate
            status="not_ready"
            notReadyTitle="Sprint 3 — risk paneli"
            notReadyDescription="Detaylı risk göstergeleri Sprint 3'te bağlanacak."
            nextActions={['Doğal afet katmanı ve risk skoru için Sprint 3 backend yayını bekleniyor.']}
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

      <div className="border-t border-border-subtle bg-bg-subtle/30 px-4 py-3">
        <Button
          size="sm"
          variant="primary"
          fullWidth
          leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}
          onClick={() => {
            if (planNote) setPendingPlanNote(planNote);
            router.push('/plan-explain');
          }}
        >
          Plan notunu açıkla
        </Button>
        <p className="m-0 mt-1.5 text-[11px] text-text-muted">
          {planNote
            ? 'Plan notu açıklayıcı sayfasına aktarılacak.'
            : 'Açıklayıcı sayfasında plan notunu yapıştırabilirsiniz.'}
        </p>
      </div>
    </>
  );
}
