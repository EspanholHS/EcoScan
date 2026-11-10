"use client";

import { useSyncExternalStore } from "react";
import { HISTORY_KEY, historySchema, type AnalysisRecord } from "./domain";

type Snapshot = { records: AnalysisRecord[]; error: string; ready: boolean };
const SERVER: Snapshot = { records: [], error: "", ready: false };
let cached: Snapshot = SERVER;
let lastRaw: string | null | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): Snapshot {
  if (typeof window === "undefined") return SERVER;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw === lastRaw && cached.ready) return cached;
    lastRaw = raw;
    if (raw === null) return (cached = { records: [], error: "", ready: true });
    const parsed = historySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error("invalid history");
    return (cached = { records: parsed.data.records, error: "", ready: true });
  } catch {
    if (cached.error) return cached;
    return (cached = {
      records: [],
      error:
        "Não foi possível acessar o histórico deste navegador. Dados existentes foram preservados. Permita o armazenamento local ou limpe o histórico para recomeçar.",
      ready: true,
    });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === HISTORY_KEY || event.key === null) {
      lastRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(records: AnalysisRecord[], force = false) {
  const current = getSnapshot();
  if (current.error && !force) return false;
  try {
    const data = historySchema.parse({
      version: 1,
      records: records.slice(0, 1000),
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
    lastRaw = undefined;
    cached = SERVER;
    listeners.forEach((fn) => fn());
    return true;
  } catch {
    return false;
  }
}

export function saveRecord(record: AnalysisRecord) {
  const records = getSnapshot().records;
  const exists = records.some((r) => r.id === record.id);
  return write(
    exists
      ? records.map((r) => (r.id === record.id ? record : r))
      : [record, ...records],
  );
}

export function clearHistory() {
  return write([], true);
}
export function useHistory() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
}

export function exportHistory(records: AnalysisRecord[]) {
  const blob = new Blob([JSON.stringify({ version: 1, records }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ecoscan-historico.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
