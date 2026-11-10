import styles from "./how-it-works.module.css";

const steps = [
  {
    number: "01",
    title: "Fotografe um resíduo.",
    description:
      "Boa luz, fundo simples e um objeto por vez. Envie uma imagem ou use a câmera para começar.",
    detail: "JPG, PNG ou WebP · até 12 MB",
    icon: "photo",
  },
  {
    number: "02",
    title: "Entenda o material.",
    description:
      "A IA interpreta as pistas da fotografia. Confira a identificação e corrija a categoria quando necessário.",
    detail: "Uma interpretação visual, sujeita a revisão",
    icon: "scan",
  },
  {
    number: "03",
    title: "Dê o próximo passo.",
    description:
      "Veja como preparar e encaminhar o resíduo. Confirme a coleta na sua região e acompanhe suas escolhas no histórico.",
    detail: "O resultado fica no histórico. A fotografia, não.",
    icon: "cycle",
  },
] as const;

function StepIcon({ kind }: { kind: (typeof steps)[number]["icon"] }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {kind === "photo" ? (
        <>
          <path d="M9 16V9h7M32 9h7v7M39 32v7h-7M16 39H9v-7" />
          <rect x="16" y="16" width="16" height="16" rx="3" />
          <circle cx="24" cy="24" r="4" />
        </>
      ) : kind === "scan" ? (
        <>
          <path d="M11 19v-8h8M29 11h8v8M37 29v8h-8M19 37h-8v-8M7 24h34" />
          <path d="m19 29 4 3 8-8M19 17h10" />
        </>
      ) : (
        <>
          <path d="M35 17a13 13 0 0 0-23 1M12 18v-8M12 18h8M13 31a13 13 0 0 0 23-1M36 30v8M36 30h-8" />
          <path d="m21 24 3 3 5-6" />
        </>
      )}
    </svg>
  );
}

/** Content stays in document order; the parent owns the scroll-driven stage. */
export function HowItWorks() {
  return (
    <div className={styles.content}>
      <header className={styles.heading}>
        <span className={styles.kicker}>DO OBJETO À ESCOLHA</span>
        <h2 className={styles.title}>Como funciona.</h2>
        <p className={styles.intro}>
          Uma fotografia abre o caminho. Você entende o material e decide o que
          fazer com ele.
        </p>
      </header>
      <ol className={styles.steps} aria-label="Três passos para usar o EcoScan">
        {steps.map((step) => (
          <li className={styles.step} key={step.number}>
            <span className={styles.number} aria-hidden="true">
              {step.number}
            </span>
            <div className={styles.copy}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <small>{step.detail}</small>
            </div>
            <span className={styles.icon}>
              <StepIcon kind={step.icon} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
