# EcoScan

**Fotografe um resíduo. Descubra o material e como descartá-lo.**

MVP web da Global Solution 2 da FIAP, **CitizenTech: Tecnologia a Serviço do Cidadão**. Ajuda cidadãos com dúvidas sobre resíduos domésticos, estudantes e iniciativas de educação ambiental a reconhecer materiais e consultar orientações práticas. Sem cadastro, banco externo ou armazenamento de fotografias pelo aplicativo.

O problema é a dificuldade cotidiana de separar materiais e conhecer suas exceções. A combinação de entrada visual, linguagem acessível, revisão humana e indicadores individuais é a proposta de valor; não se reivindica ineditismo ou impacto ambiental já comprovado.

## Executar

### Testar em outro computador

```powershell
git clone https://github.com/EspanholHS/EcoScan.git
cd EcoScan
npm ci
Copy-Item .env.example .env.local
```

Preencha `GEMINI_API_KEY` no arquivo `.env.local` com sua própria chave do Google AI Studio. A chave usada no desenvolvimento não acompanha o repositório. Não compartilhe esse arquivo nem coloque a chave em componentes ou variáveis `NEXT_PUBLIC_`.

Para testar e gravar o vídeo, use a versão de produção:

```powershell
npm run build -- --webpack
npm run start
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Essa opção evita os recursos de depuração do modo de desenvolvimento que podem conflitar com a política de segurança do navegador. O Webpack também evita a falha de processo do Turbopack observada neste ambiente Windows.

Envie uma fotografia, clique em **Analisar fotografia**, confira o destino e as três dicas, abra **Identificação e ajustes** se necessário e consulte **Meu histórico**. Use uma pilha para demonstrar o encaminhamento especial e uma garrafa para a reciclagem comum. Cada computador/navegador começa com seu próprio histórico vazio; fotografias e registros locais não acompanham o clone.

### Desenvolvimento local

Requisitos: Node.js **22.13+** (24 LTS recomendado) e npm. Versões reproduzíveis em `package-lock.json`.

```powershell
npm ci
Copy-Item .env.example .env.local
# Preencha GEMINI_API_KEY no .env.local, exclusivamente no servidor.
npm run dev
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Na instalação já configurada, preserve o `.env.local` existente.

```powershell
npm run check  # ESLint, TypeScript e testes
npm run build
npm run start  # prévia do build de produção
npm run format
node scripts/check-gemini.mjs # diagnóstico opcional, usa rede e não imprime a chave
```

## Gemini

Obtenha uma chave no [Google AI Studio](https://aistudio.google.com/apikey) e configure:

| Variável         | Uso                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | Obrigatória para analisar. Nunca recebe prefixo `NEXT_PUBLIC_`.                                                                                      |
| `GEMINI_MODEL`   | Padrão `gemini-2.5-flash`, multimodal, validado nesta implementação. Pode ser substituído por modelo compatível com `generateContent` e JSON Schema. |
| `APP_ORIGIN`     | Opcional em desenvolvimento. Em produção, use a origem exata, como `https://seu-ecoscan.vercel.app`, sem barra final.                                |

Sem chave, a navegação e o dashboard continuam disponíveis; a análise mostra indisponibilidade, sem resultados falsos. A presença da chave em `/api/status` não garante saldo, quota ou disponibilidade do provedor. Uma análise usa **uma chamada multimodal**, sem retries automáticos.

O navegador aceita JPG, PNG e WebP até 12 MB e 25 megapixels. Prepara JPEG de até 1600 px e 2 MB, removendo metadados. O servidor limita o corpo a 3 MB, verifica a decodificação com Sharp e reencoda em memória. Não usa Files API nem grava fotos em disco. Uma câmera compatível pode ser acionada pelo seletor nativo do celular; em desktop, esse controle pode abrir o seletor de arquivos. HEIC deve ser convertido para JPG.

## Arquitetura e quatro tecnologias

```text
Fotografia → preparação no navegador → POST /api/analyze
  → validação de origem, tamanho, imagem e limites
  → Gemini: características visuais + interpretação contextual
  → JSON validado com Zod no servidor
  → regras de orientação por categoria/risco na interface
  → resultado → revisão da categoria → localStorage
  → dashboard: agregações, distribuição e evolução temporal
```

| Área exigida            | Participação efetiva                                                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visão Computacional     | Gemini recebe pixels e reconhece objeto, material provável, sinais de contaminação e risco.                                                                                                              |
| Inteligência Artificial | Interpreta o contexto visual, ambiguidades e observações. Os dados alimentam regras verificáveis de orientação, evitando instruções livres para resíduos perigosos.                                      |
| Análise de Dados        | Agregações reais por categoria final, período, correções, volume e tempo de resposta. Séries adaptam a hora/dia/mês e incluem intervalos vazios.                                                         |
| Cloud Computing         | Next.js pronto para Vercel: páginas hospedadas e rota Node.js serverless faz a chamada segura ao Gemini. **Só pode ser declarado como nuvem efetivamente demonstrada após publicar e validar o deploy.** |

Stack: Next.js App Router, React, TypeScript, Tailwind CSS 4, CSS próprio, Recharts, Zod, Sharp e ícones Lucide. A home utiliza um palco Three.js persistente com materiais procedurais e uma timeline de scroll reversível, coordenando cenário, tipografia e atmosfera. Figtree variável pré-carregada localmente na experiência; Manrope e Instrument Serif nas áreas funcionais. Inclui pausa de ambiente, leitura simples e apresentação em fluxo normal para `prefers-reduced-motion`. A análise da foto usa uma bancada convencional. Arquitetura e verificações em [docs/MOTION.md](docs/MOTION.md); pesquisa visual em [docs/HERO.md](docs/HERO.md).

### Organização

```text
app/                 páginas, layout, estilos, metadados e API
components/          scanner, ficha de resultado, dashboard, gráficos, marca e espécimes SVG
lib/domain.ts        schemas, correção e cálculo de indicadores
lib/guidance.ts      regras por categoria/risco, fontes e instrução do modelo
lib/history.ts       histórico versionado e exportação local
lib/image.ts         preparação da fotografia no navegador
lib/server/          validação, limites e cliente REST Gemini
tests/               testes de contratos, imagens, métricas e falhas
docs/                validação acadêmica, demonstração e estado verificado
```

## Dados, segurança e limites

- Chave apenas no servidor; `.env.local` ignorado pelo Git. Não há autenticação ou banco de dados.
- Foto só em memória enquanto usada. **A foto é transmitida ao Google** para análise; os [termos do Gemini](https://ai.google.dev/gemini-api/terms) regem o tratamento do provedor. Não fotografe pessoas ou informações pessoais.
- `localStorage` guarda até os 1.000 registros mais recentes: identificador, instante, resultado textual, categorias original/final, correção e duração. Nunca inclui a foto. Limpar dados do navegador remove o histórico; não há sincronização. Exportação JSON permite guardar uma cópia local; não há importação no MVP.
- Demonstração é um conjunto separado em memória, explicitamente simulado. Não é gravada nem mesclada às métricas reais.
- Limites básicos: 6 tentativas/minuto por identidade, 40/hora e 2 simultâneas **por instância**; identidade é hash transitório, não persistido. Em Vercel utiliza o cabeçalho encaminhado pela plataforma. Esses limites não são globais, não substituem proteção de borda e podem ser reiniciados com a instância. Ausência de `Origin` permite clientes HTTP; validação de origem reduz chamadas cruzadas do navegador, não autentica clientes.
- Timeout de 40 s no provedor, 55 s no cliente e duração máxima de função de 60 s. Sem mensagens brutas do provedor ou logs de chave/fotografia.
- Não há confiança numérica ou certificação de composição. Vários resíduos diferentes ou imagem não reconhecível pedem nova foto e não entram no histórico. Ambiguidade de um único objeto é registrada com ressalva.
- Correção recalcula indicadores e orientações por categoria. Alertas de risco continuam vigentes. Correção não mede acurácia: isso exige rótulos manuais independentes.
- Orientações são gerais; aceitação municipal varia. Não há pontos de coleta inventados, estimativa de CO₂, peso reciclado ou garantia de segurança química.

## Deploy na Vercel

1. Coloque o projeto em um repositório Git de sua escolha, sem `.env.local` ou `test-results/`.
2. Importe na Vercel como Next.js, usando Node.js 24. Build: `npm run build`; instalação: `npm ci`; saída padrão do Next.js.
3. Cadastre `GEMINI_API_KEY` e `GEMINI_MODEL` nas variáveis server-side do ambiente desejado. Configure `APP_ORIGIN` com o domínio definitivo. Para previews de domínios diferentes, configure a origem correspondente ou omita essa variável para conferir o host da requisição.
4. Faça o deploy e teste envio, resultado, correção e histórico no domínio HTTPS. Configure os controles de consumo do provedor e proteção de borda conforme a exposição.

Nada foi publicado automaticamente. Não é necessário criar serviços de banco. O histórico continua local após o deploy; não é armazenamento em nuvem. Consulte a [documentação de funções Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## ODS e referências

Contribuição proposta: educação ambiental e melhor informação na separação, relacionadas à [meta 11.6](https://brasil.un.org/pt-br/sdgs/11), sobre gestão de resíduos urbanos, e à [meta 12.5](https://brasil.un.org/pt-br/sdgs/12), sobre prevenção, redução, reciclagem e reutilização. Impacto ainda precisa ser validado.

Base enxuta de descarte: [MMA: reciclagem](https://www.gov.br/mma/pt-br/assuntos/educacao-ambiental/glossario-ea/o-que-e-reciclagem), [Ibama: pilhas e baterias](https://www.gov.br/ibama/pt-br/assuntos/emissoes-e-residuos/residuos/pilhas-e-baterias) e [Prefeitura de Belo Horizonte: materiais e exceções](https://prefeitura.pbh.gov.br/slu/informacoes/reciclavel/levs). A referência municipal sustenta exemplos de exceções, sem generalizar disponibilidade para outros municípios. Regras editoriais revisadas em 07/11/2026.

Referência técnica: [imagens no Gemini](https://ai.google.dev/gemini-api/docs/image-understanding) e [saídas estruturadas](https://ai.google.dev/gemini-api/docs/structured-output). Referência de qualidade de execução: [Vitalis main](https://github.com/EspanholHS/vitalis-website/tree/532e8d39bb4ee51b8d2be113d0835636754d1393), estudada sem modificações ou cópia de identidade.

[Protocolo de validação](docs/VALIDACAO.md) · [Fluxo de demonstração](docs/DEMONSTRACAO.md) · [Estado das verificações](docs/VERIFICACAO.md).
