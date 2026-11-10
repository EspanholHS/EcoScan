"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownToLine,
  ScanLine,
  X,
  FlaskConical,
  ArrowRight,
  RotateCcw,
  Trash2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import {
  CATEGORY,
  CATEGORIES,
  correctRecord,
  statistics,
  temporalData,
  type Category,
} from "@/lib/domain";
import {
  clearHistory,
  exportHistory,
  saveRecord,
  useHistory,
} from "@/lib/history";
import { demoRecords } from "@/lib/demo";
import { Result } from "./result";

const CategoryChart = dynamic(
  () => import("./charts").then((m) => m.CategoryChart),
  { ssr: false, loading: () => <div className="chart-skeleton" /> },
);
const TimelineChart = dynamic(
  () => import("./charts").then((m) => m.TimelineChart),
  { ssr: false, loading: () => <div className="chart-skeleton" /> },
);
type Period = "all" | "7" | "30";

export function Dashboard() {
  const history = useHistory();
  const [demo, setDemo] = useState(false);
  const simulated = useMemo(() => demoRecords(), []);
  const [period, setPeriod] = useState<Period>("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const sourceRecords = demo ? simulated : history.records;
  const records = sourceRecords.filter((r) => {
    if (period === "all") return true;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - Number(period) + 1);
    return new Date(r.createdAt) >= start;
  });
  const stats = statistics(records);
  const diversity = stats.categories.filter((c) => c.count > 0).length;
  const timeline = temporalData(records);
  const rows = records.filter(
    (r) => category === "all" || r.finalCategory === category,
  );
  const selectedRecord = sourceRecords.find((r) => r.id === selected);

  function toggleDemo() {
    setDemo((v) => !v);
    setSelected(null);
    setNotice("");
    setConfirmClear(false);
  }

  return (
    <div className="dashboard page-width">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">ECOSCAN / MEMÓRIA DOS MATERIAIS</span>
          <h1>
            Seu histórico.
            <br />
            <em>Novos ciclos.</em>
          </h1>
          <p>Cada material reconhecido, uma escolha mais consciente.</p>
        </div>
        <Link className="button button-primary" href="/">
          Nova identificação
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="dashboard-toolbar">
        <div className="data-origin">
          <span className={`status-dot ${demo ? "demo-dot" : ""}`} />
          {demo ? "DADOS SIMULADOS" : "SEUS DADOS · NESTE NAVEGADOR"}
        </div>
        <div className="toolbar-actions">
          <button className="text-button demo-toggle" onClick={toggleDemo}>
            {demo ? (
              <>
                <X size={14} />
                Sair da demonstração
              </>
            ) : (
              <>
                <FlaskConical size={15} />
                Explorar demonstração
              </>
            )}
          </button>
          <label className="period-control">
            <span className="sr-only">Período das métricas</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              <option value="all">Todo o período</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
            </select>
          </label>
        </div>
      </div>
      {demo ? (
        <div className="demo-banner">
          <FlaskConical size={18} />
          <p>
            <strong>Você está explorando uma demonstração.</strong> Estes
            registros são simulados, não representam análises reais e não
            alteram seu histórico.
          </p>
          <button onClick={toggleDemo} aria-label="Fechar demonstração">
            <X size={17} />
          </button>
        </div>
      ) : null}
      {history.error ? (
        <div className="notice history-error" role="alert">
          {history.error}
        </div>
      ) : null}
      {!history.ready ? (
        <div className="dashboard-loading" role="status">
          Carregando seu histórico…
        </div>
      ) : sourceRecords.length === 0 ? (
        <section className="dashboard-empty">
          <div className="empty-illustration" aria-hidden="true">
            <div className="empty-ring" />
            <ScanLine size={49} strokeWidth={0.8} />
            <span className="empty-coordinate">OBS. / 001</span>
          </div>
          <span className="eyebrow">O PRIMEIRO REGISTRO É SEU</span>
          <h2>
            Todo ciclo tem
            <br />
            <em>um começo.</em>
          </h2>
          <p>
            Suas identificações vão ganhar forma aqui.
            <br />
            Fotografe um resíduo para começar seu histórico.
          </p>
          <Link href="/" className="button button-primary">
            Fazer minha primeira análise
            <ArrowUpRight size={17} />
          </Link>
          <button onClick={toggleDemo} className="text-button">
            Ou conheça o painel com dados simulados
            <ArrowRight size={15} />
          </button>
          <div className="empty-privacy">
            <ShieldCheck size={14} />
            Sem fotos armazenadas. Sem dados pessoais.
          </div>
        </section>
      ) : (
        <>
          <section
            className="metrics-ledger"
            aria-label="Indicadores do período"
          >
            <div>
              <span className="metric-index">01 / VOLUME</span>
              <strong>
                {stats.total.toLocaleString("pt-BR")}
                <span>{stats.total === 1 ? "análise" : "análises"}</span>
              </strong>
              <p>
                {demo
                  ? "Identificações simuladas"
                  : "Identificações registradas"}
              </p>
            </div>
            <div>
              <span className="metric-index">02 / DIVERSIDADE</span>
              <strong>
                {diversity}
                <span>{diversity === 1 ? "material" : "materiais"}</span>
              </strong>
              <p>Categorias no período</p>
            </div>
            <div>
              <span className="metric-index">03 / REVISÃO HUMANA</span>
              <strong>
                {stats.corrected}
                <span>
                  {stats.correctionRate.toFixed(1).replace(".", ",")}%
                </span>
              </strong>
              <p>Classificações corrigidas</p>
            </div>
            <div>
              <span className="metric-index">04 / RESPOSTA</span>
              <strong>
                {(stats.averageMs / 1000).toFixed(1).replace(".", ",")}
                <span>segundos</span>
              </strong>
              <p>Tempo médio no servidor</p>
            </div>
          </section>
          {records.length ? (
            <section className="dashboard-charts">
              <article>
                <header className="chart-header">
                  <div>
                    <span className="eyebrow">COMPOSIÇÃO DOS REGISTROS</span>
                    <h2>Um retrato dos materiais.</h2>
                  </div>
                  <span className="chart-count">
                    {stats.total} {stats.total === 1 ? "REGISTRO" : "REGISTROS"}
                  </span>
                </header>
                <CategoryChart data={stats.categories} />
                <div className="chart-footnote">
                  Categorias finais, incluindo suas correções.
                </div>
                <div className="sr-only">
                  {stats.categories.map((c) => (
                    <p key={c.key}>
                      {c.label}: {c.count}
                    </p>
                  ))}
                </div>
              </article>
              <article>
                <header className="chart-header">
                  <div>
                    <span className="eyebrow">AO LONGO DO TEMPO</span>
                    <h2>O ritmo das descobertas.</h2>
                  </div>
                  <span className="chart-count">
                    POR{" "}
                    {timeline.unit === "hour"
                      ? "HORA"
                      : timeline.unit === "month"
                        ? "MÊS"
                        : "DIA"}
                  </span>
                </header>
                <TimelineChart data={timeline.points} />
                <div className="chart-footnote">
                  Identificações por{" "}
                  {timeline.unit === "hour"
                    ? "hora"
                    : timeline.unit === "month"
                      ? "mês"
                      : "dia"}
                  . Intervalos sem registros aparecem como zero.
                </div>
              </article>
            </section>
          ) : (
            <div className="period-empty">
              <p>Nenhuma análise neste período.</p>
              <button className="text-button" onClick={() => setPeriod("all")}>
                Ver todo o período
                <ArrowUpRight size={15} />
              </button>
            </div>
          )}
          <section className="history-section">
            <div className="history-heading">
              <div>
                <span className="eyebrow">MEMÓRIA DOS MATERIAIS</span>
                <h2>Seu histórico.</h2>
              </div>
              <label className="category-filter">
                <span className="sr-only">Filtrar histórico por categoria</span>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as Category | "all");
                    setVisibleCount(10);
                  }}
                >
                  <option value="all">Todos os materiais</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY[c].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="history-table-wrap">
              <table className="history-table">
                <caption className="sr-only">
                  Identificações do período. Selecione um objeto para ver os
                  detalhes e corrigir sua categoria.
                </caption>
                <thead>
                  <tr>
                    <th>OBJETO IDENTIFICADO</th>
                    <th>MATERIAL</th>
                    <th>DATA</th>
                    <th>CLASSIFICAÇÃO</th>
                    <th>
                      <span className="sr-only">Detalhes</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, visibleCount).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <button
                          onClick={() =>
                            setSelected(selected === r.id ? null : r.id)
                          }
                          className="history-object"
                        >
                          <span
                            className="material-initial"
                            style={{ color: CATEGORY[r.finalCategory].color }}
                          >
                            {CATEGORY[r.finalCategory].short}
                          </span>
                          <span className="history-object-text">
                            {r.analysis.object}
                            <small className="history-mobile-meta">
                              {new Date(r.createdAt).toLocaleDateString(
                                "pt-BR",
                                { day: "2-digit", month: "short" },
                              )}
                              {r.corrected ? " · Corrigida" : ""}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>{CATEGORY[r.finalCategory].label}</td>
                      <td>
                        {new Date(r.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                        <span className="history-time">
                          {new Date(r.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            r.corrected ? "row-corrected" : "row-original"
                          }
                        >
                          {r.corrected ? (
                            <RotateCcw size={12} />
                          ) : (
                            <span className="tiny-dot" />
                          )}
                          {r.corrected ? "Corrigida" : "Original da IA"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="row-open"
                          onClick={() =>
                            setSelected(selected === r.id ? null : r.id)
                          }
                          aria-label={`Ver detalhes de ${r.analysis.object}`}
                          aria-expanded={selected === r.id}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length ? (
                <p className="table-empty">Nenhum registro para este filtro.</p>
              ) : null}
            </div>
            {rows.length > visibleCount ? (
              <button
                className="text-button load-more"
                onClick={() => setVisibleCount((v) => v + 10)}
              >
                Mostrar mais registros
                <ChevronDown size={15} />
              </button>
            ) : null}
            {selectedRecord ? (
              <div className="history-detail">
                <div className="history-detail-header">
                  <span className="eyebrow">
                    FICHA DO MATERIAL{demo ? " · SIMULAÇÃO" : ""}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => setSelected(null)}
                  >
                    <X size={15} />
                    Fechar detalhes
                  </button>
                </div>
                <Result
                  record={selectedRecord}
                  saved={!demo}
                  demo={demo}
                  onCorrect={(c) => {
                    if (!demo) {
                      const ok = saveRecord(correctRecord(selectedRecord, c));
                      setNotice(
                        ok
                          ? "Categoria atualizada. Os indicadores já refletem a correção."
                          : "Não foi possível salvar a correção neste navegador.",
                      );
                    } else
                      setNotice(
                        "A correção está disponível nos seus registros reais. A demonstração permanece simulada.",
                      );
                  }}
                />
              </div>
            ) : null}
          </section>
        </>
      )}
      {notice ? (
        <p className="dashboard-notice" role="status">
          {notice}
        </p>
      ) : null}
      <div className="dashboard-bottom">
        <p>
          <ShieldCheck size={15} />
          Histórico local, sem fotografias. Limpar os dados do navegador também
          remove seus registros.
        </p>
        {!demo && (history.records.length > 0 || history.error) ? (
          <div>
            {history.records.length ? (
              <button
                className="text-button"
                onClick={() => exportHistory(history.records)}
              >
                <ArrowDownToLine size={14} />
                Exportar registros
              </button>
            ) : null}
            <button
              className="text-button delete-button"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 size={14} />
              Limpar histórico
            </button>
          </div>
        ) : null}
      </div>
      {confirmClear ? (
        <div className="clear-confirm" role="alert">
          <p>
            Apagar todos os registros deste navegador? Esta ação não pode ser
            desfeita.
          </p>
          <button
            className="button button-secondary"
            onClick={() => setConfirmClear(false)}
          >
            Cancelar
          </button>
          <button
            className="button button-danger"
            onClick={() => {
              const ok = clearHistory();
              setConfirmClear(false);
              setSelected(null);
              setNotice(
                ok
                  ? "Histórico apagado deste navegador."
                  : "Não foi possível acessar o armazenamento do navegador.",
              );
            }}
          >
            Apagar registros
          </button>
        </div>
      ) : null}
      <p className="metric-limitation">
        As métricas descrevem o uso do EcoScan. Correções não medem a precisão
        da IA. Não representam volume reciclado ou impacto ambiental comprovado.
      </p>
    </div>
  );
}
