"use client";
import { useEffect, useState } from "react";
import { fetchStatus, type ServiceStatus } from "@/lib/api";

export function useStatus(): ServiceStatus | null {
  const [s, setS] = useState<ServiceStatus | null>(null);
  useEffect(() => {
    let alive = true;
    fetchStatus().then((x) => alive && setS(x));
    return () => {
      alive = false;
    };
  }, []);
  return s;
}
