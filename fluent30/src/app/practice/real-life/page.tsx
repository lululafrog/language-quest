"use client";
import { Suspense } from "react";
import { PageHeader, SectionHeader } from "@/components/ui";
import { ImportPanel } from "@/components/reallife/ImportPanel";
import { CaptureList } from "@/components/reallife/CaptureList";

export default function RealLifePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Real Life English" subtitle="Ta vie devient ton cours : importe ce que tu croises en anglais, on t'explique tout." back="/practice" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface-2" />}>
        <ImportPanel />
      </Suspense>
      <SectionHeader title="Mes imports" subtitle="Privés, sur ton appareil" />
      <CaptureList />
    </div>
  );
}
