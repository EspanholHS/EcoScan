# Estado de verificação

Verificação em 07/11/2026. Este documento distingue testes automatizados, execução real e pontos ainda não demonstrados.

- ESLint e TypeScript: aprovados na primeira rodada completa.
- Testes automatizados: 17/17 aprovados; cobrem schemas, imagens, métricas, correções, risco, origem, limites, ausência de credenciais, timeout e falhas do provedor. Respostas simuladas existem apenas no isolamento desses testes.
- Build Next.js de produção: aprovado. Home e dashboard estáticos; status e análise executados no servidor.
- Auditoria de dependências após correções: zero vulnerabilidades reportadas pelo npm.
- Credencial Gemini: aceita pela listagem oficial de modelos (HTTP 200). A chave não é exibida neste documento nem no repositório.
- Navegador, versão de produção: envio de fotografia, prévia, processamento real Gemini, resultado, correção, atualização de métricas, restauração da categoria e persistência após recarregar verificados. Fotografia não aparece na ficha reaberta do histórico.
- Análise real observada: fotografia pública de garrafa identificada como plástico, 3,1 s no servidor. É um teste funcional isolado, não uma medição de acurácia ou latência representativa. Houve uma resposta estruturada inválida durante a verificação, tratada pela interface sem criar registro; o orçamento de saída/raciocínio foi ajustado para reduzir truncamentos.
- Referência da foto de teste: [Flasche eingedellt.jpg](https://commons.wikimedia.org/wiki/File:Flasche_eingedellt.jpg), Mona Hitzenauer, CC0. Arquivo temporário de QA ignorado pelo Git; não faz parte dos assets do app ou do armazenamento das fotos dos usuários.
- Demonstração: painel de 24 registros simulados explicitamente identificado, separado do histórico real. Sem erros ou avisos no console do navegador na rodada observada.
- Endpoint final com a API real: HTTP 200 e `identified/plastico` para a garrafa em 3.463 ms; HTTP 200 e `unrecognized` para uma imagem neutra sem objeto em 2.536 ms. Esses testes HTTP não escrevem no histórico do navegador.
- Revisão visual: home, resultado e dashboard inspecionados em desktop; scanner e histórico verificados em viewport móvel. Histórico móvel adaptado para evitar tabela com rolagem horizontal na página. Estado vazio verificado em outra origem local, sem apagar registros. Primeiro foco por Tab aciona o link de pular ao conteúdo.
- Verificação literal do bundle `.next/static`: a chave configurada não foi encontrada nos arquivos do cliente. `.env.local` e os arquivos temporários de QA estão ignorados pelo Git.
- Captura por câmera física em celular e teste com tecnologias assistivas reais: não executados. A verificação móvel utilizou o navegador desktop com viewport reduzido.
- Deploy Vercel: não executado. Cloud Computing permanece preparado, sem alegação de publicação já validada.
- Piloto acadêmico com 30 fotos, medição de acurácia e teste com usuários: ainda não executados.
