"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  Check,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  Pause,
  Play,
  ShieldCheck,
  Upload,
  X,
  BookOpen,
} from "lucide-react";
import type { HeroMotion, MaterialKind, SceneController } from "./scene";
import { approach, CHAPTERS, journeyFrame } from "./timeline";
import { spatialFrame } from "./spatial-timeline";
import { HowItWorks } from "./how-it-works";
import { journeyPalette } from "./palette";
import styles from "./hero.module.css";

function subscribe(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const snapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function compactSubscribe(callback: () => void) {
  const query = window.matchMedia("(max-height: 600px) and (max-width: 900px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const compactSnapshot = () =>
  window.matchMedia("(max-height: 600px) and (max-width: 900px)").matches;
type HeroProps = {
  photo: { preview: string; name: string } | null;
  stage: "idle" | "preparing" | "ready" | "analyzing" | "result";
  configured: boolean | null;
  error: string;
  onUpload: () => void;
  onCamera: () => void;
  onRemove: () => void;
  onAnalyze: () => void;
  onFile: (file?: File) => void;
  onMultiple: () => void;
};

export function Hero({
  photo,
  stage,
  configured,
  error,
  onUpload,
  onCamera,
  onRemove,
  onAnalyze,
  onFile,
  onMultiple,
}: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneHost = useRef<HTMLDivElement>(null);
  const chapters = useRef<(HTMLDivElement | null)[]>([]);
  const chapterButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const controller = useRef<SceneController | null>(null);
  const motion = useRef<HeroMotion>({
    x: 0,
    y: 0,
    scroll: 0,
    material: "plastic",
    focused: false,
    pointerActive: false,
  });
  const targetProgress = useRef(0);
  const animateProgress = useRef<() => void>(() => {});
  const geometry = useRef({ start: 0, travel: 1 });
  const checkpoint = useRef(0);
  const restore = useRef(false);
  const [material, setMaterial] = useState<MaterialKind>("plastic");
  const [activeChapter, setActiveChapter] = useState(0);
  const [sceneState, setSceneState] = useState("loading");
  const [paused, setPaused] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribe, snapshot, () => false);
  const compact = useSyncExternalStore(
    compactSubscribe,
    compactSnapshot,
    () => false,
  );
  const simple = reading || reducedMotion || compact;
  const previousSimple = useRef(simple);
  const busy = stage === "preparing" || stage === "analyzing";
  const functional = Boolean(photo);
  useEffect(() => {
    if (simple || functional || paused || activeChapter !== 0) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setMaterial((current) =>
        current === "plastic"
          ? "metal"
          : current === "metal"
            ? "paper"
            : "plastic",
      );
    }, 6000);
    return () => window.clearInterval(timer);
  }, [simple, functional, paused, activeChapter, material]);
  const remember = (action: () => void) => {
    checkpoint.current = motion.current.scroll;
    action();
  };

  useEffect(() => {
    if (simple || functional || snapshot()) return;
    let cancelled = false;
    const host = sceneHost.current;
    if (!host) return;
    import("./scene")
      .then(({ mountMaterialScene }) => {
        if (cancelled) return;
        try {
          controller.current = mountMaterialScene(
            host,
            motion.current,
            () => {
              if (!cancelled) setSceneState("ready");
            },
            () => {
              if (!cancelled) setSceneState("fallback");
            },
          );
          controller.current.setPaused(
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          );
        } catch {
          setSceneState("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setSceneState("fallback");
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [simple, functional]);

  useEffect(() => {
    motion.current.material = material;
    motion.current.focused = functional;
    controller.current?.setPaused(paused || simple || functional);
    controller.current?.refresh();
  }, [material, paused, simple, functional, sceneState]);

  useLayoutEffect(() => {
    const node = root.current,
      stageNode = stageRef.current;
    if (!node || !stageNode) return;
    const shell = node.closest<HTMLElement>(".experience-shell");
    let frame = 0;
    let active = -1;
    let lastTime = performance.now();
    const update = () => {
      frame = 0;
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const p =
        simple || functional
          ? 0
          : approach(motion.current.scroll, targetProgress.current, dt);
      motion.current.scroll = p;
      const pose = journeyFrame(p, false);
      const depth = spatialFrame(p);
      node.style.setProperty("--progress", String(p));
      chapters.current.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = simple ? "1" : String(pose.alpha[i]);
        el.style.transform = simple
          ? "none"
          : `perspective(1400px) translate3d(0,0,${depth.textZ[i]}px) rotateX(${depth.textTilt[i]}deg)`;
        el.style.filter =
          simple || pose.alpha[i] === 0
            ? "none"
            : `blur(${depth.textBlur[i]}px)`;
      });
      if (active !== pose.active) {
        active = pose.active;
        setActiveChapter(active);
        node.dataset.chapter = String(active);
        chapters.current.forEach((el, i) => {
          if (!el) return;
          el.inert = functional || (!simple && i !== active);
          if (el.inert) el.setAttribute("aria-hidden", "true");
          else el.removeAttribute("aria-hidden");
        });
        chapterButtons.current.forEach((button, i) => {
          if (i === active) button?.setAttribute("aria-current", "step");
          else button?.removeAttribute("aria-current");
        });
      }
      if (paused || simple) controller.current?.refresh();
      if (
        !simple &&
        !functional &&
        Math.abs(targetProgress.current - p) > 0.00001
      )
        frame = requestAnimationFrame(update);
    };
    if (!simple && !functional) {
      const palette = journeyPalette(1);
      shell?.style.setProperty("--paper", palette.paperCSS);
      shell?.style.setProperty("--ink", palette.inkCSS);
      shell?.style.setProperty("--muted", palette.mutedCSS);
      shell?.style.setProperty("--accent", palette.accentCSS);
      shell?.style.setProperty("--line", palette.lineCSS);
    }
    const measure = () => {
      cancelAnimationFrame(frame);
      update();
    };
    const schedule = () => {
      if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(update);
      }
    };
    animateProgress.current = schedule;
    const wheel = (event: WheelEvent) => {
      if (
        simple ||
        functional ||
        event.ctrlKey ||
        (event.target instanceof Element &&
          event.target.closest(".experience-info"))
      )
        return;
      event.preventDefault();
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      targetProgress.current = Math.max(
        0,
        Math.min(1, targetProgress.current + delta / 4200),
      );
      if (!frame) schedule();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (
        simple ||
        functional ||
        (event.target as HTMLElement)?.closest("button,input,select,a,textarea")
      )
        return;
      const step =
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === " "
          ? 0.12
          : event.key === "ArrowUp" || event.key === "PageUp"
            ? -0.12
            : 0;
      if (!step && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      targetProgress.current =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? 1
            : Math.max(0, Math.min(1, targetProgress.current + step));
      schedule();
    };
    const oldOverflow = document.documentElement.style.overflow;
    if (!simple && !functional)
      document.documentElement.style.overflow = "hidden";
    const shouldRestore = restore.current;
    const modeChanged = previousSimple.current !== simple;
    previousSimple.current = simple;
    measure();
    if (functional || simple)
      window.scrollTo({ top: geometry.current.start, behavior: "instant" });
    else if (restore.current && !simple) {
      restore.current = false;
      targetProgress.current = checkpoint.current;
      motion.current.scroll = checkpoint.current;
    }
    measure();
    if (functional)
      node
        .querySelector<HTMLElement>("[data-workbench]")
        ?.focus({ preventScroll: true });
    else if (simple && modeChanged)
      chapters.current[0]
        ?.querySelector<HTMLElement>("h1")
        ?.focus({ preventScroll: true });
    else if (shouldRestore)
      chapterButtons.current[journeyFrame(motion.current.scroll).active]?.focus(
        { preventScroll: true },
      );
    const resize = () => measure();
    const explain = () => {
      if (window.location.hash === "#como-funciona" && !simple && !functional) {
        targetProgress.current = CHAPTERS[1].progress;
        schedule();
      }
    };
    const explainClick = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href="/#como-funciona"]')
          : null;
      if (!link || functional) return;
      event.preventDefault();
      if (simple) chapters.current[1]?.scrollIntoView({ behavior: "instant" });
      else {
        targetProgress.current = CHAPTERS[1].progress;
        schedule();
      }
    };
    explain();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    observer.observe(stageNode);
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", keyboard);
    window.addEventListener("resize", resize);
    window.addEventListener("hashchange", explain);
    document.addEventListener("click", explainClick);
    return () => {
      animateProgress.current = () => {};
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keyboard);
      document.documentElement.style.overflow = oldOverflow;
      window.removeEventListener("resize", resize);
      window.removeEventListener("hashchange", explain);
      document.removeEventListener("click", explainClick);
      ["--paper", "--ink", "--muted", "--line", "--accent"].forEach((key) =>
        shell?.style.removeProperty(key),
      );
    };
  }, [simple, functional, paused]);

  const goTo = (index: number) => {
    if (simple) {
      chapters.current[index]?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
      return;
    }
    targetProgress.current = CHAPTERS[index].progress;
    animateProgress.current();
  };

  return (
    <section
      ref={root}
      className={styles.journey}
      aria-label="Do objeto ao próximo ciclo"
      data-scene={sceneState}
      data-simple={simple}
      data-functional={functional}
      data-paused={paused}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (busy) return;
        checkpoint.current = motion.current.scroll;
        if (e.dataTransfer.files.length > 1) onMultiple();
        else onFile(e.dataTransfer.files[0]);
      }}
    >
      <span
        id="como-funciona"
        className={styles.processAnchor}
        aria-hidden="true"
      />
      <div
        ref={stageRef}
        className={styles.stage}
        onPointerMove={(e) => {
          if (e.pointerType === "touch" || simple || paused) return;
          const r = e.currentTarget.getBoundingClientRect();
          motion.current.pointerActive = !(e.target as Element).closest(
            "button,a,input,summary",
          );
          motion.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
          motion.current.y = ((e.clientY - r.top) / r.height) * 2 - 1;
        }}
        onPointerLeave={() => {
          motion.current.pointerActive = false;
          motion.current.x = 0;
          motion.current.y = 0;
        }}
      >
        <div ref={sceneHost} className={styles.scene} aria-hidden="true" />
        <div className={styles.fallback} aria-hidden="true">
          <svg viewBox="0 0 400 400" fill="none">
            {Array.from({ length: 240 }, (_, i) => {
              const a = i * 2.399963,
                r = 92 + 24 * Math.sin(i * 1.17);
              return (
                <circle
                  key={i}
                  cx={Number((200 + Math.cos(a) * r).toFixed(5))}
                  cy={Number((200 + Math.sin(a) * r).toFixed(5))}
                  r={2 + (i % 3) * 0.6}
                  fill={i % 3 === 0 ? "#cbdba8" : "#71866b"}
                />
              );
            })}
          </svg>{" "}
        </div>
        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.halo} aria-hidden="true" />
        <div className={styles.topline}>
          <span>
            <i /> Matéria em movimento
          </span>
          <span>UM ESTUDO SOBRE NOVOS COMEÇOS</span>
        </div>

        <div className={styles.chapterMask}>
          <div
            ref={(el) => {
              chapters.current[0] = el;
            }}
            className={`${styles.chapter} ${styles.opening}`}
          >
            <span className={styles.eyebrow}>01 / UM NOVO OLHAR</span>
            <h1 id="eco-hero-title" tabIndex={-1}>
              <span className={styles.brandTitle}>
                Eco<span>Scan</span>
              </span>
            </h1>
            <p>
              O que parece um fim pode ser um começo.
              <br className={styles.desktopBreak} /> Fotografe um resíduo.
              Descubra o material
              <br className={styles.desktopBreak} /> e o caminho para o próximo
              ciclo.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.primary}
                onClick={() => remember(onUpload)}
                disabled={busy}
              >
                Identificar um resíduo <ArrowUpRight size={21} />
              </button>
              <button className={styles.textButton} onClick={() => goTo(1)}>
                Explore o ciclo <ArrowDown size={15} />
              </button>
              <button
                className={styles.cameraShortcut}
                onClick={() => remember(onCamera)}
                disabled={busy}
                aria-label="Usar câmera"
              >
                <Camera size={17} />
              </button>
            </div>
            <small className={styles.trust}>
              <ShieldCheck size={13} /> Sem cadastro. Sem fotografias no
              histórico.
            </small>
          </div>
        </div>
        <div className={styles.chapterMask}>
          <div
            ref={(el) => {
              chapters.current[1] = el;
            }}
            className={`${styles.chapter} ${styles.recognize}`}
            aria-hidden="true"
            inert
          >
            <HowItWorks />
          </div>
        </div>
        <div className={styles.chapterMask}>
          <div
            ref={(el) => {
              chapters.current[2] = el;
            }}
            className={`${styles.chapter} ${styles.transform}`}
            aria-hidden="true"
            inert
          >
            <span className={styles.eyebrow}>03 / O QUE VOCÊ RECEBE</span>
            <h2>
              Da dúvida à <span>decisão.</span>
            </h2>
            <p>
              Material, preparo e próximo destino. Uma leitura que ajuda a agir,
              com espaço para revisar a identificação.
            </p>
            <div className={styles.resultSheet}>
              <div className={styles.resultSheetTop}>
                <span>EXEMPLO ILUSTRATIVO</span>
                <span>01 / PET</span>
              </div>
              <h3>Garrafa de plástico.</h3>
              <dl>
                <div>
                  <dt>Reconheça</dt>
                  <dd>Identificação do objeto e da categoria do material.</dd>
                </div>
                <div>
                  <dt>Prepare</dt>
                  <dd>Cuidados para separar e encaminhar o resíduo.</dd>
                </div>
                <div>
                  <dt>Encaminhe</dt>
                  <dd>
                    Orientação de destino e referências para consultar as regras
                    locais.
                  </dd>
                </div>
              </dl>
              <p>
                Você pode corrigir a categoria. O histórico guarda o resultado,
                sem armazenar a fotografia.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.chapterMask}>
          <div
            ref={(el) => {
              chapters.current[3] = el;
            }}
            className={`${styles.chapter} ${styles.begin}`}
            aria-hidden="true"
            inert
          >
            <span className={styles.eyebrow}>04 / AGORA, É COM VOCÊ</span>
            <h2>
              Comece <span>aqui.</span>
            </h2>
            <p>
              Transforme a dúvida em uma escolha consciente.
              <br className={styles.desktopBreak} /> O próximo começo está nas
              suas mãos.
            </p>
            <button
              className={styles.primary}
              onClick={() => remember(onUpload)}
              disabled={busy}
            >
              Identificar meu resíduo <ArrowUpRight size={21} />
            </button>
            <div className={styles.finalNote}>
              <span>IDENTIFICAR → ENTENDER → ENCAMINHAR</span>
              <p>
                Seu histórico acompanha as escolhas. Sua imagem não fica
                armazenada nele.
              </p>
            </div>
          </div>
        </div>
        {!functional && !simple && activeChapter === 0 && (
          <nav
            className={styles.objectPicker}
            aria-label="Objeto de partículas"
          >
            {(
              [
                ["plastic", "Garrafa"],
                ["metal", "Latinha"],
                ["paper", "Papel"],
              ] as const
            ).map(([kind, label], index) => (
              <button
                key={kind}
                aria-pressed={material === kind}
                onClick={() => setMaterial(kind)}
              >
                <span>0{index + 1}</span>
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className={styles.dock} data-dock>
          <div className={styles.dockTitle}>
            <span className={styles.dockSymbol}>
              <Upload size={18} strokeWidth={1.4} />
            </span>
            <div>
              <h2>Um objeto. Uma fotografia.</h2>
              <p>Arraste uma imagem ou escolha como começar.</p>
            </div>
          </div>
          <div className={styles.dockActions}>
            <button
              className={styles.photoButton}
              onClick={() => remember(onUpload)}
              disabled={busy}
            >
              <span className={styles.photoButtonIcon}>
                <ImagePlus size={17} aria-hidden="true" />
              </span>
              <span className={styles.photoButtonLabel}>Enviar fotografia</span>
              <ArrowUpRight
                className={styles.photoButtonArrow}
                size={17}
                aria-hidden="true"
              />
            </button>
            <button
              onClick={() => remember(onCamera)}
              disabled={busy}
              aria-label="Fotografar resíduo com a câmera"
            >
              <Camera size={17} />
              <span>Câmera</span>
            </button>
          </div>
          <div className={styles.dockMeta}>
            <span>JPG, PNG OU WEBP · ATÉ 12 MB</span>
            <span>
              {configured === true ? (
                <>
                  <Check size={11} /> Pronto para analisar
                </>
              ) : configured === false ? (
                "Análise indisponível"
              ) : (
                "Verificando IA…"
              )}
            </span>
          </div>
        </div>

        {functional && photo && (
          <div
            className={styles.workbench}
            data-workbench
            tabIndex={-1}
            aria-label="Analisar a sua fotografia"
          >
            <div className={styles.workIntro}>
              <span className={styles.eyebrow}>DO OBJETO AO PRÓXIMO CICLO</span>
              <h1>
                Um novo olhar <span>começa aqui.</span>
              </h1>
              <p>
                Confira o enquadramento. Um objeto por vez, com boa luz e sem
                informações pessoais.
              </p>
              <div className={styles.workActions}>
                <button
                  className={styles.primary}
                  onClick={onAnalyze}
                  disabled={busy || configured === false}
                >
                  {busy ? (
                    <LoaderCircle className={styles.spin} size={18} />
                  ) : (
                    <ArrowUpRight size={20} />
                  )}{" "}
                  {stage === "preparing"
                    ? "Preparando imagem…"
                    : stage === "analyzing"
                      ? "Reconhecendo material…"
                      : "Analisar fotografia"}
                </button>
                <button
                  className={styles.textButton}
                  onClick={onUpload}
                  disabled={busy}
                >
                  <ImagePlus size={16} /> Trocar fotografia
                </button>
              </div>
              <p className={styles.privacy}>
                <ShieldCheck size={16} /> Ao analisar, a foto é enviada ao
                servidor e à API Gemini do Google. Não a guardamos no histórico.
                Evite pessoas e dados pessoais.
              </p>
              {error && (
                <div className={styles.error} role="alert">
                  <CircleAlert size={18} />
                  {error}
                </div>
              )}
              <button
                className={styles.returnButton}
                onClick={() => {
                  restore.current = true;
                  onRemove();
                }}
                disabled={busy}
              >
                <X size={15} /> Voltar à experiência
              </button>
            </div>
            <div className={styles.photoFrame} aria-busy={busy}>
              <div className={styles.photoHeading}>
                <span>SUA FOTOGRAFIA</span>
                <span>
                  {stage === "analyzing"
                    ? "EM ANÁLISE"
                    : "PRONTA PARA UM NOVO OLHAR"}
                </span>
              </div>
              <div className={styles.photoImage}>
                <Image
                  src={photo.preview}
                  alt={`Fotografia selecionada: ${photo.name}`}
                  fill
                  unoptimized
                  sizes="(max-width:760px) 90vw, 42vw"
                  style={{ objectFit: "contain" }}
                />
                {stage === "analyzing" && <div className={styles.scanLine} />}
              </div>
              <div className={styles.photoFooter}>
                <span>{photo.name}</span>
                <span>01 / 01</span>
              </div>
            </div>
          </div>
        )}
        {error && !functional && (
          <div className={styles.floatingError} role="alert">
            <CircleAlert size={17} />
            {error}
          </div>
        )}

        <div className={styles.bottomline}>
          <span className={styles.scrollHint}>
            <ArrowDown size={15} />
            <span>Role para transformar</span>
          </span>
          <nav
            className={styles.chapterNav}
            aria-label="Momentos da experiência"
          >
            {CHAPTERS.map((c, i) => (
              <button
                key={c.name}
                ref={(el) => {
                  chapterButtons.current[i] = el;
                }}
                onClick={() => goTo(i)}
                aria-label={`0${i + 1} ${c.name}`}
                aria-current={i === 0 ? "step" : undefined}
              >
                <span>0{i + 1}</span>
                <i />
                <span>{c.name}</span>
              </button>
            ))}
          </nav>
          <div className={styles.motionControls}>
            <button
              onClick={() => {
                if (!reading) checkpoint.current = motion.current.scroll;
                else restore.current = true;
                setReading(!reading);
              }}
              disabled={reducedMotion || compact}
              aria-pressed={simple}
              title={simple ? "Explorar com movimento" : "Ler sem animação"}
            >
              <BookOpen size={14} />
              <span>{simple ? "Modo leitura" : "Leitura simples"}</span>
            </button>
            <button
              onClick={() => setPaused(!paused)}
              disabled={simple}
              aria-pressed={paused || simple}
              aria-label={
                paused
                  ? "Retomar movimento ambiente"
                  : "Pausar movimento ambiente"
              }
            >
              {paused || simple ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
        {dragging && (
          <div className={styles.dropOverlay}>
            <Upload size={38} />
            <strong>Um novo ciclo começa aqui.</strong>
            <span>Solte uma fotografia para continuar.</span>
          </div>
        )}
        <span className="sr-only" role="status">
          {stage === "analyzing"
            ? "Analisando a imagem. Aguarde o resultado."
            : stage === "preparing"
              ? "Preparando imagem."
              : ""}
        </span>
      </div>
    </section>
  );
}
