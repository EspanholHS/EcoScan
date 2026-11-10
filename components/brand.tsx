import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 27 : 34}
      height={small ? 27 : 34}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 4H8a4 4 0 0 0-4 4v6M22 4h6a4 4 0 0 1 4 4v6M32 22v6a4 4 0 0 1-4 4h-6M14 32H8a4 4 0 0 1-4-4v-6"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="m11 20 6-9h8l-6 9h-8Zm0 0h8l-2 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header({
  active = "scanner",
  immersive = false,
}: {
  active?: "scanner" | "dashboard";
  immersive?: boolean;
}) {
  return (
    <header className={`site-header${immersive ? " immersive-header" : ""}`}>
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="EcoScan, início">
          <BrandMark />
          <span>
            eco<span className="brand-light">scan</span>
            <sup>®</sup>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          <Link
            href="/"
            className={active === "scanner" ? "nav-active" : ""}
            aria-current={active === "scanner" ? "page" : undefined}
          >
            Scanner
          </Link>
          <Link
            href="/dashboard"
            className={active === "dashboard" ? "nav-active" : ""}
            aria-current={active === "dashboard" ? "page" : undefined}
          >
            Meu histórico
            <span className="nav-dot" />
          </Link>
        </nav>
        <Link className="header-about" href="/#como-funciona">
          Como funciona
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/">
        <BrandMark small />
        <span>ecoscan</span>
      </Link>
      <span>Tecnologia a serviço de novos ciclos.</span>
      <div>
        <span>CitizenTech</span>
        <span>ODS 11 & 12</span>
        <span className="footer-fiap">FIAP · GS2</span>
      </div>
    </footer>
  );
}
