# EcoScan: partículas interativas e regiões de conteúdo

## Simulação

`components/hero/particle-sculpture.ts` substitui o modelo sólido da revisão anterior. São 128 × 128 partículas, com posição e velocidade armazenadas em texturas float alternadas pelo `GPUComputationRenderer`. Duas passagens de cálculo integram forças elásticas, amortecimento, repulsão e impulso do cursor. Subpassos de até 1/90 s mantêm a integração estável; o delta do frame é limitado a 50 ms.

Os volumes de embalagem e ciclo são gerados uma vez, com semente determinística. As partículas preservam sua identidade na transformação. A renderização usa point sprites com normal esférica e iluminação do volume: um draw call para a escultura. Não há atualização JavaScript por partícula em cada frame. A velocidade influencia o brilho.

`scene.ts` projeta o cursor por um raio da câmera e converte a interseção para coordenadas locais da escultura. O efeito acompanha o objeto mesmo quando a câmera e sua posição mudam. Controles de interface não acionam repulsão. A saída do ponteiro desativa a força; as molas recompõem a forma. A pausa congela a simulação e o tempo ambiente.

## Narrativa e background

`spatial-timeline.ts` mantém câmera, posição, escala e planos de texto sincronizados. `timeline.ts` controla os quatro estados semânticos. A roda avança uma timeline virtual, sem deslocar verticalmente o documento. As partículas respondem com inércia ao volume-alvo; câmera e texto continuam funções determinísticas do progresso.

`atmosphere.ts` mantém rastros autônomos em três velocidades e correntes amplas, sem vídeo ou assets remotos. O fundo continua durante a leitura dos capítulos; pausa interrompe o movimento.

## Correção da sobreposição

A área de conteúdo termina antes de `--controls-reserve`, definido entre 150 e 195 pixels conforme a altura útil. A máscara impede que os planos ampliados em perspectiva atravessem o upload. As instruções distribuem sua altura disponível em três linhas e compactam espaçamentos em janelas mais baixas. Isso substitui a combinação anterior de texto com altura livre e botão fixo sobre a mesma região.

## Recursos

DPR limitado a 1,25. Aba oculta, pausa e cena fora da área visível interrompem o loop. Ao desmontar, geometrias, materiais, texturas, render targets da simulação, renderizador e eventos são liberados. Não há ambiente de refração ou transmissão do antigo modelo PET. `prefers-reduced-motion` e leitura simples removem a cena; scanner e resultados seguem em layout convencional.

## Verificação desta rodada

- Build de produção, ESLint, TypeScript e 28 testes passaram. Os dois testes novos verificam volumes finitos, tridimensionais, determinísticos e identidade entre formas.
- Browser: partículas exibidas, repulsão localizada observada, transformação para ciclo observada, iluminação do volume refinada e console sem erros/avisos capturados.
- Como funciona inspecionado em 1920 × 1080, 1536 × 864 e 1280 × 720. Em 1536 × 864, último texto terminou em y=656 e upload começou em y=695. Em 1280 × 720, o texto terminou em y=551 e upload começou em y=581; uma revisão posterior reduziu ainda mais os espaçamentos internos dessa altura.
- Resultado em 1280 × 720: último texto em y=521, upload em y=581. `scrollY` permaneceu zero nas medições.
- A versão final de iluminação foi vista no navegador em FullHD, sem erros no console.
- A reabertura posterior da prévia foi bloqueada pela permissão salva/política do navegador, mesmo após autorização explícita na conversa. A última tentativa de captura e revisão visual adicional ficou impedida. As capturas antigas em `test-results` representam revisões anteriores, não esta escultura granular.
- Não houve benchmark de FPS, nova chamada ao Gemini ou alteração de configuração de movimento do sistema nesta rodada. Os testes matemáticos não equivalem a benchmark de GPU.

Referência primária: [Igloo Inc: Case Study, Abeto](https://www.awwwards.com/igloo-inc-case-study.html). A inspeção direta do site mostrou sua cena inicial; o conteúdo sobre partículas foi confirmado no estudo dos autores. O vídeo incorporado não pôde ser reproduzido fora da página por restrição de privacidade.

## Evolução da expressividade

A mesma simulação GPU agora recebe pesos contínuos para embalagem PET, lata com bordas e tampas, e folha curva. O seletor altera esses pesos a partir do estado corrente, sem reiniciar partículas ao clicar rapidamente. A distância até a forma-alvo controla uma dispersão transitória. Cursor aplica força mais ampla e impulso com menor amortecimento; o canal alfa da textura de velocidade acumula a influência cromática e a dissipa gradualmente.

Na passagem de progresso 0,10 a 0,32, um envelope senoidal expande e torce o volume antes de recompô-lo ao lado das instruções. O envelope depende do scroll, enquanto a resposta das molas preserva inércia. Build, lint, TypeScript e 28 testes passaram nesta evolução. As novas formas e shaders ainda precisam de conferência visual: a permissão persistente do navegador impediu a retomada da inspeção na rodada anterior. Não considerar a compilação TypeScript como validação do shader em GPU.

## Validação e refinamento de 08/11/2026 (continuação)

- Como funciona agora recebe três órbitas tubulares inclinadas. O alvo é interpolado das mesmas partículas do objeto selecionado, com expansão durante a passagem; a etapa seguinte continua formando o ciclo. O peso das órbitas é função do progresso, portanto também acompanha o retorno.
- Movimento orgânico acelerado moderadamente, com agitação residual ligada à influência anterior do cursor. A cor depende da proximidade do cursor, não da velocidade global da transformação. Seu alcance é maior que o da repulsão para alcançar a borda deslocada; a dissipação permanece amortecida.
- SVG de fallback arredondado a cinco casas para evitar diferenças de hidratação entre runtimes.
- Navegador integrado acessou a cena e mostrou garrafa, lata, papel, órbitas e ciclo. Foram exercitados seletor por teclado, alternância rápida, arrasto sobre a escultura, atalhos da narrativa e scroll nos dois sentidos. A deformação localizada foi observada. Essas inspeções não constituem medição de FPS.
- Áreas CSS verificadas: 1920×1080, 1280×720 e 1535×864 (viewport compensado pelo zoom). Limite inferior do terceiro item / início do upload: aproximadamente 862/912, 546/582 e 684/696 pixels, respectivamente. Sem sobreposição nesses estados estabilizados; scrollY permaneceu zero.
- Produção em 127.0.0.1:3002: sem novos erros/avisos capturados na navegação; histórico vazio e demonstração com 24 registros funcionaram. Leitura simples ativada com sucesso. A preferência do sistema por movimento reduzido não foi alterada nem emulada nesta rodada.
- Build, lint, TypeScript e 28 testes passaram. O teste do contrato Gemini usa provedor isolado; não houve nova fotografia enviada ao serviço real, teste de câmera ou benchmark de desempenho. Chave e backend preservados.
- O modo de desenvolvimento apresenta aviso de CSP por tentativa de eval de depuração do React; a política não foi relaxada. O aviso não ocorreu em produção.

## Histórico em movimento e navegação (08/11/2026)

`HistoryAtmosphere` acrescenta uma escultura de três órbitas em Canvas 2D com 300 partículas, arcos e rastros; posição/iluminação acompanham o cursor com amortecimento. DPR limitado a 1,25, suspensão com aba oculta, cancelamento do RAF e remoção dos observadores ao desmontar. Controle de pausa e `prefers-reduced-motion` interrompem a animação. A cena é decorativa e não participa das métricas.

IntersectionObserver revela blocos e registros conforme entram no viewport; MutationObserver registra os elementos adicionados pela demonstração e pelos detalhes. Foco por teclado torna conteúdo imediatamente legível. O gráfico temporal tem revelação progressiva; linhas, indicadores e órbitas do estado vazio recebem efeitos de interação e movimento.

`RouteTransition`, mantida no layout raiz, cobre a troca entre `/` e `/dashboard` com a marca e órbitas. Preserva cliques modificados, links externos e navegação na mesma rota. A troca aguarda o evento de conclusão da cobertura, com fallback de 1,1 s; uma proteção de 8 s libera a camada se a navegação falhar. A preferência por movimento reduzido mantém navegação direta.

Verificações: produção acessada nos dois sentidos; fase da passagem voltou a idle após a chegada; pausa do histórico confirmada e nenhum bloco permaneceu invisível; demonstração e entrada dos gráficos exercitadas. Layout móvel sem overflow horizontal e console sem novos erros/avisos. Build, lint, TypeScript e os 28 testes existentes passaram. Não houve benchmark de FPS nem emulação da preferência do sistema; a revisão visual não mede estabilidade quadro a quadro da transição.

## Ajuste da navegação para uma passagem discreta

A passagem com marca e órbitas foi substituída por fade de conteúdo: saída de 140 ms e chegada de 300 ms, com deslocamento de apenas 3 px. Cabeçalho e navegação permanecem visíveis. A troca ocorre após a saída; a chegada começa após a montagem e dois frames, sem uma tela intermediária. Movimento reduzido mantém a navegação direta. Cliques modificados, destinos externos e a rota já aberta seguem o comportamento padrão.

O teste de um dissolve nativo com capturas apresentou timeout de atualização do DOM no navegador e foi removido da implementação final. A versão final usa apenas CSS e o ciclo de navegação do App Router. Navegação nos dois sentidos concluída em produção, sem novos erros/avisos na aba de validação final. Build, lint, TypeScript e 28 testes passaram durante esta revisão.

## Continuidade real entre telas

Substituído o fade sequencial por uma superfície temporária da tela anterior, inerte e fora da árvore acessível. Ela copia os canvases (o WebGL é redesenhado sincronamente no evento `ecoscan:capture-surface`) e preserva o enquadramento de scroll. A página de destino é montada por baixo; a cópia antiga se dissolve em 1150 ms somente quando a nova página está pronta. Ao voltar para o scanner, aguarda o estado da cena por até 1600 ms. A opacidade da página nova permanece íntegra, evitando a queda de luminância de dois fades simultâneos. As entradas individuais dos elementos do histórico são suspensas durante essa passagem.

Não há tela intermediária, deslocamento de layout ou uso de `startViewTransition`. A superfície é removida ao concluir, com proteção de oito segundos e limpeza ao desmontar/mudar a preferência de movimento. Navegação com movimento reduzido permanece direta.

Verificado no navegador: nos dois sentidos a rota muda enquanto a superfície antiga ainda está presente; canvas copiado presente na captura da hero; conclusão remove a superfície e a cena do scanner está ready. Sem novos erros/avisos capturados. Build, lint, TypeScript e 28 testes passaram. A qualidade subjetiva da suavidade permanece sujeita à avaliação do usuário e não houve benchmark de FPS.

## Transição simples pelas partículas

A pedido do usuário, a sobreposição de telas foi removida. A navegação agora dispara `ecoscan:route-particles`: a escultura GPU gira e dispersa seus próprios pontos por aproximadamente 700 ms. Um fade escuro começa em 520 ms, a rota troca em 820 ms e o fade é liberado após a chegada. A volta usa um giro leve da atmosfera orbital do histórico. Não há cópia de DOM/canvas nem captura nativa de telas. Movimento reduzido mantém a navegação direta; o controle de pausa da cena mantém sua simulação pausada.

Build, lint, TypeScript e 28 testes passaram; navegador abriu a cena GPU sem erro de shader e concluiu as rotas nos dois sentidos, sem novos avisos/erros capturados. A qualidade subjetiva da animação curta depende da avaliação do usuário; não houve benchmark de FPS.
