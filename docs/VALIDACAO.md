# Protocolo acadêmico enxuto

## Objetivo e amostra

Avaliar classificação, tempo e clareza com **30 fotografias independentes**: aproximadamente 4 de cada uma das 7 categorias, mais 2 casos ambíguos. Incluir embalagens sujas, material composto, vidro/plástico semelhante e resíduos especiais. Separadamente, testar imagens sem resíduo, vários objetos, arquivo inválido, falha de rede e indisponibilidade do provedor.

Antes de analisar, conferir manualmente o objeto e a categoria, consultando rótulos, fabricante e as fontes de orientação. Um segundo avaliador deve revisar os rótulos duvidosos. Se a composição não puder ser confirmada, marcar a limitação em vez de inventar um gabarito. Não incluir rostos ou dados pessoais.

## Procedimento

1. Registrar ID da foto, gabarito, fonte da conferência e presença de risco.
2. Enviar cada foto uma vez, com o mesmo modelo e rede. Registrar primeira resposta, duração no servidor e tempo percebido entre clique e resultado. Erros e repetições devem permanecer na planilha de avaliação, mesmo que não entrem no dashboard.
3. Conferir a categoria **original**, antes de corrigi-la. Registrar resultado como correto, incorreto, inconclusivo ou rejeitado.
4. Aplicar correções pela interface e exportar o histórico JSON. Correções não devem alterar o gabarito ou apagar a predição original.
5. Com 5 usuários voluntários, pedir uma identificação e perguntar, em escala de 1 a 5, se a orientação deixa claro o próximo passo. Registrar também erros de interpretação e tempo para concluir. Nenhum dado pessoal é necessário.

## Indicadores

| Indicador                    | Cálculo / coleta                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Acerto original de categoria | Predições originais iguais ao gabarito / casos com gabarito válido. Informar também o número de inconclusivos e rejeições. |
| Cobertura                    | Fotos que produziram identificação / fotos válidas enviadas.                                                               |
| Correção                     | Registros cuja categoria final difere da original / registros identificados. É revisão humana, não acurácia.               |
| Latência                     | Mediana e p95 da duração das 30 chamadas; separar tempo de servidor de tempo percebido, que inclui preparo e rede.         |
| Clareza                      | Distribuição e média das 5 avaliações; registrar comentários sem identificação pessoal.                                    |
| Robustez                     | Resultado observado em cada caso de erro; verificar que não gerou registro falso.                                          |

Tabela de coleta sugerida: `foto_id, categoria_gabarito, fonte_gabarito, categoria_original, categoria_final, status, servidor_ms, percebido_ms, tentativa, observacao`. Os dados não precisam estar dentro do app.

## Metas propostas, ainda não medidas

Hipóteses para o piloto: pelo menos 80% de acerto de categoria nos casos com gabarito válido, mediana de resposta percebida abaixo de 10 s e pelo menos 4/5 em clareza média. São critérios de investigação, não resultados ou garantias. Revise os limiares após o primeiro piloto, registrando a alteração.

O dashboard mede uso, composição e revisão dos registros. Não mede redução de resíduos, reciclagem efetiva ou CO₂. Para demonstrar impacto, seria necessário um estudo posterior comparando decisões antes/depois e verificando o descarte real com serviço local ou cooperativa.

Implementação piloto possível: turma, condomínio ou instituição de ensino; validação com educadores e cooperativas. Expansão dependeria de resultados, revisão das orientações e avaliação de custo de API. Para o MVP, a sustentabilidade operacional vem do escopo pequeno, uma chamada por análise e ausência de infraestrutura de contas/banco.
