"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  correctRecord,
  responseSchema,
  type AnalysisRecord,
  type Category,
} from "@/lib/domain";
import { prepareImage } from "@/lib/image";
import { saveRecord } from "@/lib/history";
import { Hero } from "./hero/hero";
import { Result } from "./result";

type Photo = Awaited<ReturnType<typeof prepareImage>>;
type Stage = "idle" | "preparing" | "ready" | "analyzing" | "result";

export function Scanner() {
  const [stage, setStage] = useState<Stage>("idle");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const operation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const resultContainer = useRef<HTMLDivElement>(null);
  const busy = stage === "preparing" || stage === "analyzing";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setConfigured(data.configured === true))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.preview);
    },
    [photo],
  );
  useEffect(
    () => () => {
      operation.current++;
      request.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (stage === "result") {
      resultContainer.current
        ?.querySelector<HTMLElement>("#result-title")
        ?.focus({ preventScroll: true });
      resultContainer.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    }
  }, [stage]);

  async function selectFile(file?: File) {
    if (!file || busy) return;
    const id = ++operation.current;
    setError("");
    setStage("preparing");
    setRecord(null);
    try {
      const prepared = await prepareImage(file);
      if (id !== operation.current) {
        URL.revokeObjectURL(prepared.preview);
        return;
      }
      setPhoto(prepared);
      setStage("ready");
    } catch (e) {
      if (id === operation.current) {
        setError(
          e instanceof Error ? e.message : "Não foi possível abrir a imagem.",
        );
        setStage(photo ? "ready" : "idle");
      }
    } finally {
      if (input.current) input.current.value = "";
      if (camera.current) camera.current.value = "";
    }
  }

  function reset() {
    operation.current++;
    request.current?.abort();
    setPhoto(null);
    setRecord(null);
    setError("");
    setStage("idle");
  }

  async function analyze() {
    if (!photo || busy) return;
    const id = ++operation.current;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 55000);
    setError("");
    setStage("analyzing");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo.base64, mimeType: photo.mimeType }),
        signal: controller.signal,
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(
          typeof json.error?.message === "string"
            ? json.error.message
            : "Não foi possível concluir a análise.",
        );
      const validated = responseSchema.safeParse(json);
      if (!validated.success)
        throw new Error(
          "O serviço retornou uma identificação incompleta. Tente novamente com outra fotografia.",
        );
      const data = validated.data;
      if (id !== operation.current) return;
      if (["multiple", "unrecognized"].includes(data.analysis.status)) {
        setError(data.analysis.observation + " " + data.analysis.uncertainty);
        setStage("ready");
        return;
      }
      const newRecord: AnalysisRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        analysis: data.analysis,
        originalCategory: data.analysis.category,
        finalCategory: data.analysis.category,
        corrected: false,
        durationMs: data.durationMs,
      };
      setSaved(saveRecord(newRecord));
      setRecord(newRecord);
      setStage("result");
    } catch (e) {
      if (id === operation.current) {
        setError(
          e instanceof Error && e.name === "AbortError"
            ? "A análise foi interrompida ou demorou demais. Você pode tentar novamente."
            : e instanceof Error
              ? e.message
              : "Verifique a conexão e tente novamente.",
        );
        setStage("ready");
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  function correct(category: Category) {
    if (record) {
      const updated = correctRecord(record, category);
      setRecord(updated);
      setSaved(saveRecord(updated));
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Selecionar fotografia do resíduo"
        tabIndex={-1}
        onChange={(e) => selectFile(e.target.files?.[0])}
      />
      <input
        ref={camera}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        aria-label="Fotografar resíduo com a câmera"
        tabIndex={-1}
        onChange={(e) => selectFile(e.target.files?.[0])}
      />
      {stage === "result" && record ? (
        <div className="result-page page-width" ref={resultContainer}>
          <div className="result-page-heading">
            <span className="eyebrow">DO RECONHECIMENTO À AÇÃO</span>
            <Link href="/dashboard">
              Ver meu histórico
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <Result
            record={record}
            preview={photo?.preview}
            onCorrect={correct}
            saved={saved}
            onReset={reset}
          />
        </div>
      ) : (
        <Hero
          photo={photo}
          stage={stage}
          configured={configured}
          error={error}
          onUpload={() => input.current?.click()}
          onCamera={() => camera.current?.click()}
          onRemove={reset}
          onAnalyze={analyze}
          onFile={selectFile}
          onMultiple={() => setError("Envie uma fotografia por vez.")}
        />
      )}
    </>
  );
}
