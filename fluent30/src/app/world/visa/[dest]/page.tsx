"use client";
// The visa check of the first world map is replaced by level-adapted missions (any destination is
// open at any level). Old links redirect to the destination page.
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LEGACY_DEST } from "@/lib/atlas/legacy";

export default function VisaRedirect() {
  const { dest } = useParams<{ dest: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/world/${LEGACY_DEST[dest] ?? dest}`);
  }, [dest, router]);
  return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;
}
