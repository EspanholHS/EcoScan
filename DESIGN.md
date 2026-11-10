# EcoScan: matéria em partículas

## Direção atual — 08/11/2026

Desktop FullHD é o enquadramento principal. A área útil também considera zoom do navegador e escala do Windows: os textos e os controles ocupam regiões separadas, inclusive em 1536 × 864 e 1280 × 720 CSS pixels.

Referências: [Igloo](https://www.igloo.inc/) e o [estudo dos criadores, Abeto](https://www.awwwards.com/igloo-inc-case-study.html), consultados no navegador, para volumes granulares interativos. O estudo explica partículas que se reorganizam em formas e mudam de aparência conforme a velocidade. DozFX permanece como referência do fundo de rastros, e Noddal para a continuidade espacial. Código e volumes do EcoScan são próprios.

## Composição e interação

A garrafa sólida foi substituída por 16.384 partículas com aparência esférica. A forma inicial é uma embalagem; no resultado, as mesmas partículas recompõem um ciclo. O cursor exerce repulsão localizada e impulso, com giro, amortecimento e retorno à forma. A iluminação considera tanto cada esfera quanto o volume completo, evitando uma silhueta uniformemente branca.

O palco permanece fixo. A roda e os atalhos percorrem quatro momentos: início, como funciona, exemplo de resultado e começar. A escultura ocupa o centro no início e no encerramento; nos momentos de leitura abre espaço para o texto. O upload permanece central, numa faixa inferior reservada.

## Hierarquia e áreas reservadas

Os planos de conteúdo terminam antes da faixa de controles. As três instruções de uso dividem a altura restante em linhas; fonte e espaçamento se ajustam à altura útil. Os planos em transição são recortados na fronteira dessa área para impedir que a ampliação em perspectiva atravesse os botões. O conteúdo final permanece inteiro e legível.

Figtree local, títulos marfim, fundo verde quase preto, partículas em verde mineral e ação principal em verde claro. O background continua animado independentemente de scroll e cursor.

## Acesso ao produto

Enviar fotografia abre a bancada convencional. Scanner, resultados e histórico mantêm seus contratos. Pausa, navegação por teclado, leitura simples e preferência por movimento reduzido permanecem disponíveis. O modo de leitura desmonta o WebGL e apresenta o conteúdo em fluxo normal.

## Histórico: continuidade visual

A rota `/dashboard` usa um tema escuro isolado em `app/dashboard/dashboard.css`, com a mesma fonte Figtree, tons minerais, botão iluminado e rastros sutis contínuos da abertura. O painel mantém fluxo normal de leitura para permitir explorar gráficos, tabela e detalhes. Movimento de fundo é somente CSS e para com `prefers-reduced-motion`.

A composição inclui estado vazio, demonstração identificada, filtros, indicadores com algarismos tabulares, gráficos adaptados ao fundo escuro, tabela responsiva e ficha do material. Os avisos de incerteza e as correções usam contraste próprio. As regras são limitadas ao contêiner do histórico para preservar a cena do scanner.

Verificação de 08/11/2026: estados vazio e demonstração vistos em desktop e celular (429 px); filtros de período e categoria exercitados; ficha aberta/fechada; navegação de volta ao scanner confirmada. Sem novos erros ou avisos de console em produção. Build, lint, TypeScript e 28 testes passaram. Não houve criação, alteração, exportação ou exclusão de registros reais durante a validação; a correção real permanece coberta pelos testes existentes.
