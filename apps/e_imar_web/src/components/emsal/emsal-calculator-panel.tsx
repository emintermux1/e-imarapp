"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton
} from "@/components/ui/dialog";
import { EmsalDialogContent } from "./emsal-dialog-content";
import type { ParcelProps } from "@/types/parcel";
import { adaParselText } from "@/lib/format";

export function EmsalCalculatorPanel({
  open,
  onOpenChange,
  parcel
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parcel?: ParcelProps;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="p-0 max-w-[1180px]">
        <DialogHeader>
          <div className="flex flex-col gap-0.5">
            <DialogTitle>Emsal & Yapılaşma Hesabı</DialogTitle>
            <DialogDescription>
              {parcel
                ? `Ada/Parsel ${adaParselText(parcel.ada, parcel.parsel)} · ${parcel.mahalle}, ${parcel.ilce} / ${parcel.il}`
                : "Bağımsız hesaplama modu — parsel seçili değil."}
            </DialogDescription>
          </div>
          <DialogCloseButton />
        </DialogHeader>
        <div className="overflow-y-auto">
          <EmsalDialogContent parcel={parcel} embed />
        </div>
      </DialogContent>
    </Dialog>
  );
}
