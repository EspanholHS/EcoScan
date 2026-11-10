# Recomendações por objeto — 10/11/2026

O resultado prioriza uma ação e até três dicas. O Gemini identifica o tipo de objeto e o estado visível; regras do aplicativo escolhem as dicas. Os campos opcionais `itemType` e `visibleState` preservam a leitura dos registros antigos. Dados históricos sem esses campos usam as regras de categoria e de risco existentes.

Pilhas têm destino e cuidados próprios, preservados mesmo após correção de categoria. Vazamento ou dano visível muda a ação para contato prévio com o receptor. Garrafas plásticas de bebida têm preparação adaptada à sujeira e ao amassamento; incerteza, correção de material e risco têm prioridade sobre essas dicas.

## Teste real

- Fotografia pública: [AA battery.png](https://commons.wikimedia.org/wiki/File:AA_battery.png), MrDolomite, CC BY-SA 3.0; cópia sem alterações em `test-results/pilha-aa.png`, somente para teste.
- Gemini identificou `Pilha AA`, `hazard: battery`, `itemType: portable_battery` e `visibleState: intact` em chamada real pelo backend e novamente por upload na interface.
- Interface: identificação em 3,5 s, ação para ponto de coleta de pilhas, três dicas, fonte e localizador; registro salvo no navegador da prévia isolada na porta 3005. Nenhum registro foi criado no histórico da porta 3004.
- Correção para metal preservou o encaminhamento de pilha; categoria original restaurada após o teste.
- Evidência local: `test-results/pilha-resultado.jpg` e `test-results/battery-live-result.json` (ignorados pelo Git).
- Lint, TypeScript, 33 testes e build com Webpack passaram.

## Fontes e limites

- [Ibama: pilhas e baterias](https://www.gov.br/ibama/pt-br/assuntos/emissoes-e-residuos/residuos/pilhas-e-baterias).
- [Green Eletron: cuidados com pilhas usadas](https://greeneletron.org.br/blog/5-erros-comuns-ao-armazenar-e-descartar-pilhas-e-baterias-usadas/).
- [Recicla Sampa: garrafas PET](https://www.reciclasampa.com.br/artigo/garrafas-pet--recicle-de-forma-correta).

O localizador é um link externo indicado pelo site da Green Eletron; sua consulta pelo mecanismo de pesquisa expirou. Não foi validado um endereço ou recebimento específico. A fotografia não comprova carga restante, segurança interna nem composição química. Uma foto de pilha intacta é um teste funcional, não uma medição da precisão geral do modelo. Danos e vazamentos foram cobertos por testes de regras, sem fotografia real desses casos.
