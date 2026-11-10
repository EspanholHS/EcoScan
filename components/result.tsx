"use client";

import {
  ArrowUpRight,
  Check,
  CircleHelp,
  ScanLine,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import {
  CATEGORY,
  CATEGORIES,
  type AnalysisRecord,
  type Category,
} from "@/lib/domain";
import { guidance } from "@/lib/guidance";

export function Result({
  record,
  preview,
  onCorrect,
  onReset,
  saved,
  demo = false,
}: {
  record: AnalysisRecord;
  preview?: string;
  onCorrect: (category: Category) => void;
  onReset?: () => void;
  saved: boolean;
  demo?: boolean;
}) {
  const rule = guidance(record.analysis, record.finalCategory);
  const specialCare =
    record.analysis.hazard !== "none" ||
    record.analysis.itemType === "portable_battery";
  const uncertain =
    record.analysis.status === "ambiguous" ||
    Boolean(record.analysis.uncertainty);
  return (
    <section className="result-layout" aria-label="Resultado da análise">
      <div className="result-visual">
        <div className="lab-topline">
          <span>
            <ScanLine size={14} />
            {demo ? "EXEMPLO DEMONSTRATIVO" : "FOTOGRAFIA ANALISADA"}
          </span>
          <span>01 / 01</span>
        </div>
        <div className="result-image">
          {preview ? (
            <Image
              src={preview}
              alt={`Fotografia analisada: ${record.analysis.object}`}
              fill
              unoptimized
              sizes="(max-width: 760px) 90vw, 40vw"
            />
          ) : (
            <div className="no-photo">
              <ScanLine size={40} strokeWidth={1} />
              <p>
                {demo
                  ? "Exemplo sem fotografia."
                  : "Fotografia não armazenada."}
              </p>
              <span>
                {demo
                  ? "Dados simulados para explorar o painel."
                  : "Somente a identificação faz parte do histórico."}
              </span>
            </div>
          )}
          <div className="image-corners" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="result-photo-footer">
          <span>
            {demo ? "SIMULAÇÃO · SEM ANÁLISE DE IA" : "LEITURA VISUAL · GEMINI"}
          </span>
          <span>
            {(record.durationMs / 1000).toFixed(1).replace(".", ",")}s
          </span>
        </div>
      </div>
      <div className="result-information">
        <div className="result-status">
          <Check size={14} />
          <span>
            {demo ? "IDENTIFICAÇÃO SIMULADA" : "IDENTIFICAÇÃO CONCLUÍDA"}
          </span>
        </div>
        <h2 tabIndex={-1} id="result-title">
          {record.analysis.object}
        </h2>
        <div className="result-category">
          <span
            className="category-chip"
            style={
              {
                "--category-color": CATEGORY[record.finalCategory].color,
              } as React.CSSProperties
            }
          >
            <i />
            {CATEGORY[record.finalCategory].label}
          </span>
          {record.corrected ? (
            <span className="corrected-label">
              {demo
                ? "Correção simulada"
                : `IA: ${CATEGORY[record.originalCategory].label} · corrigida por você`}
            </span>
          ) : null}
        </div>
        {uncertain ? (
          <div className="notice uncertainty">
            <CircleHelp size={18} />
            <p>
              {record.analysis.uncertainty ||
                "O material não pôde ser determinado com clareza. Confira a categoria antes de descartar."}
            </p>
          </div>
        ) : null}
        <div className="disposal">
          <span className="eyebrow">DESTINO RECOMENDADO</span>
          <h3>{rule.destination}</h3>
          <ol>
            {rule.steps.map((step, i) => (
              <li key={step}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
        {specialCare ? (
          <div className="notice caution">
            <TriangleAlert size={17} />
            <p>
              {record.analysis.hazard === "battery" ||
              record.analysis.itemType === "portable_battery"
                ? "A foto não revela carga restante ou danos internos."
                : rule.caution}
            </p>
          </div>
        ) : null}
        {"collection" in rule && rule.collection ? (
          <a
            className="source-link"
            href={rule.collection.url}
            target="_blank"
            rel="noreferrer"
          >
            {rule.collection.label}
            <ArrowUpRight size={13} />
          </a>
        ) : null}
        <details className="result-details">
          <summary>Identificação e ajustes</summary>
          <div className="result-details-content">
            <p className="result-material">
              Material provável · {record.analysis.material}
            </p>
            <p className="visual-observation">{record.analysis.observation}</p>
            {!specialCare ? (
              <p className="result-detail-caution">{rule.caution}</p>
            ) : null}
            <a
              className="source-link"
              href={rule.source.url}
              target="_blank"
              rel="noreferrer"
            >
              Fonte · {rule.source.name}
              <ArrowUpRight size={13} />
            </a>
            <div className="correction-field">
              <label htmlFor={`category-${record.id}`}>
                {demo
                  ? "Categoria do exemplo demonstrativo."
                  : "Corrigir categoria"}
              </label>
              <select
                id={`category-${record.id}`}
                value={record.finalCategory}
                disabled={demo}
                onChange={(e) => onCorrect(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option value={c} key={c}>
                    {CATEGORY[c].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </details>
        <div className="result-actions">
          <span className="saved-note" role="status">
            {demo
              ? "Demonstração · não salva"
              : saved
                ? "Salvo neste navegador"
                : "Não foi possível salvar neste navegador"}
          </span>
          {onReset ? (
            <button className="text-button" onClick={onReset}>
              <RotateCcw size={15} />
              Nova análise
              <ArrowUpRight size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
