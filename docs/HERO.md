# Hero: matéria em transformação

Rodada concentrada na hero, 07/11/2026.

## Diagnóstico anterior

A ilustração vetorial confinada a um card não sustentava a escala do título. O tratamento editorial era previsível, os elementos pareciam justapostos e a ausência de mudanças reais de luz e perspectiva deixava a experiência estática. Acrescentar partículas a essa composição não resolveria o problema.

## Referências estudadas

- [Lusion v3 no Awwwards](https://www.awwwards.com/sites/lusion-v3) e [site ao vivo](https://lusion.co/): objetos com presença física, reação ao cursor e continuidade entre tipografia e cena. A página do Awwwards identifica interações reativas e animação de scroll entre seus destaques. Não foram copiados assets, layout ou código.
- [Igloo Inc no Awwwards](https://www.awwwards.com/sites/igloo-inc): materialidade como identidade e profundidade construída por luz. A página de apresentação foi inspecionada; o site ao vivo utiliza uma interface em canvas e não forneceu conteúdo textual útil para análise. A observação não foi usada para alegar métricas de desempenho.
- [Vitalis main](https://github.com/EspanholHS/vitalis-website/tree/532e8d39bb4ee51b8d2be113d0835636754d1393): revisão da cena de cápsula, iluminação, materiais físicos e progressão contínua de câmera. Repositório consultado exclusivamente como referência.
- [Figtree](https://fonts.google.com/specimen/Figtree): contraste com a direção editorial anterior, curvas abertas e escala expressiva, hospedada localmente e aplicada somente à hero.

## Direção e implementação

Uma única composição aberta, sem o antigo card do laboratório. Título “O futuro muda de forma.”, campo luminoso mineral e três resíduos modelados proceduralmente: garrafa plástica, lata de alumínio e papel dobrado. A cena é ilustrativa, explicitamente separada da análise real.

Three.js é carregado por importação dinâmica. Geometrias, texturas e iluminação são produzidas pelo projeto, sem modelos remotos. Selecionar um material reorganiza a posição e a escala dos objetos por interpolação. Há entrada de câmera, luz que acompanha o cursor, pequena resposta ao scroll e movimento ambiente lento. Enviar uma fotografia substitui o estudo visual pela prévia real e interrompe a animação 3D.

Proteções: limite de densidade de pixels, pausa quando a cena sai da área visível ou a aba fica oculta, controle manual de pausa, respeito a `prefers-reduced-motion`, fallback vetorial sem WebGL2 e descarte de geometrias, materiais, texturas, observadores e contexto ao desmontar.

## Escopo preservado

`Hero` recebe ações e estado do scanner existente. Chamada Gemini, regras de classificação, resultado, localStorage e dashboard mantêm sua implementação. A nova folha de estilos é um CSS Module, sem aplicar a nova direção visual às demais seções.

## Verificação da rodada

- Iterações no navegador: composição inicial, revisão de iluminação e superfícies, ajuste de legendas, adaptação a telas baixas e revisão móvel.
- Prévia com fotografia pública, processamento Gemini real e resultado funcional verificados; resposta observada em cerca de 4,6 s no servidor. O teste é funcional, não uma medição representativa de latência.
- Larguras de 320, 390, 1280 e 1440 px inspecionadas. Em 1280 × 720, o botão principal terminou em aproximadamente 613 px, visível antes da dobra. Em 320 px, a largura do documento permaneceu dentro do viewport.
- Troca de materiais e controle de pausa verificados por interação. `prefers-reduced-motion` é tratado em CSS e pelo controlador WebGL; não foram alteradas preferências do sistema do usuário.
- ESLint, TypeScript e 17 testes existentes aprovados. Build de produção aprovado. Auditoria npm sem vulnerabilidades reportadas. A chave Gemini não foi encontrada no bundle do cliente.
- Versão de produção observada sem erros ou avisos no console. Não foi realizado benchmark de FPS nem teste em celular físico; as verificações móveis utilizaram viewport do navegador desktop.
