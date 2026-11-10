import { Header } from "@/components/brand";
import { Scanner } from "@/components/scanner";
import { ArrowUpRight } from "lucide-react";
import { SOURCES } from "@/lib/guidance";

export default function Home() {
  return (
    <div className="experience-shell">
      <Header immersive />
      <main id="conteudo">
        <Scanner />
        <details className="experience-info">
          <summary>Sobre o EcoScan +</summary>
          <section className="experience-notes" aria-label="Sobre o EcoScan">
            <div className="notes-accordions">
              <details>
                <summary>
                  O que a fotografia pode nos dizer?<span>+</span>
                </summary>
                <p>
                  A identificação é uma interpretação visual, não um teste de
                  composição. Materiais parecidos podem ser confundidos. Você
                  pode corrigir a categoria e consultar as regras locais antes
                  do descarte.
                </p>
              </details>
              <details>
                <summary>
                  O que acontece com a minha imagem?<span>+</span>
                </summary>
                <p>
                  Ao analisar, a foto é preparada no navegador e enviada ao
                  servidor e à API Gemini do Google para processamento. O
                  EcoScan não grava a foto em disco nem no histórico. O Google
                  aplica seus próprios termos de tratamento de dados; evite
                  incluir pessoas ou informações pessoais.
                </p>
                <a
                  href="https://ai.google.dev/gemini-api/terms"
                  target="_blank"
                  rel="noreferrer"
                >
                  Termos da API Gemini
                  <ArrowUpRight size={13} />
                </a>
              </details>
              <details>
                <summary>
                  De onde vêm as orientações?<span>+</span>
                </summary>
                <p>
                  Combinamos a interpretação da IA com uma base enxuta de
                  orientações gerais. A aceitação de cada material depende da
                  infraestrutura local.
                </p>
                {SOURCES.map((s) => (
                  <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
                    {s.name}
                    <ArrowUpRight size={13} />
                  </a>
                ))}
              </details>
            </div>
          </section>
        </details>
      </main>
    </div>
  );
}
