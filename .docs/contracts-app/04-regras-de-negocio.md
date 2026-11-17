# 04 — Regras de negócio

## Totalização
Para cada item:
- Se `unit_price` for nulo, subtotal ainda não é conhecido.
- Se houver preço: `subtotal = quantity × unit_price`.
- Total exibido = soma dos subtotais conhecidos.
- Exibir também quantos itens ainda estão sem preço, para não dar a impressão de que o total é definitivo.

Exemplo: 2 unidades × R$ 4,50 = R$ 9,00.

## Quantidade e unidade
- Quantidade padrão: 1.
- Unidades iniciais: un, kg, g, L, ml, pacote, caixa, dúzia.
- Não converter unidades incompatíveis automaticamente.
- Para comparar preços, normalizar apenas quando a conversão for segura e conhecida.

## Preço comparável
- Preferência: comparar preço por unidade equivalente (R$/kg, R$/L, R$/un).
- Se não for possível normalizar, comparar somente quando unidade e quantidade de referência forem equivalentes.
- Mostrar aviso quando a comparação for aproximada ou não puder ser feita.
- Não misturar preço total do pacote com preço unitário sem explicar.

## Janelas temporais
Definições do MVP:
- **Última semana**: registros entre agora e os 7 dias anteriores.
- **Mês anterior**: mês-calendário imediatamente anterior ao mês da compra atual.
- **Compra anterior**: registro mais recente anterior ao preço atual.
Sempre exibir as datas usadas na comparação. Considerar timezone local do usuário para apresentar datas.

## Variação
`difference = currentPrice - previousPrice`
`percentage = (difference / previousPrice) × 100`, quando `previousPrice > 0`.
- Diferença negativa: mais barato.
- Diferença positiva: mais caro.
- Diferença zero: mesmo preço.
- Se preço anterior for zero, não calcular percentual; exibir apenas diferença absoluta e texto apropriado.
Arredondar para 2 casas na apresentação, sem perder precisão no dado original.

## Histórico
- Somente listas finalizadas entram como compras concluídas.
- Lista ativa pode ser recuperada e continuar editável.
- Finalização não deve criar registros de preço duplicados.
- Uma compra deve preservar nome do produto, quantidade, unidade, preço unitário e data da compra.
- Excluir uma lista concluída não deve apagar `price_records` por cascata.

## Edição e exclusão
- Itens de lista ativa podem ser editados/excluídos.
- Exclusão de item exige confirmação leve (ou desfazer por alguns segundos).
- Exclusão de lista exige confirmação explícita.
- Histórico deve ser tratado como registro. Se permitir corrigir preço, preservar o registro anterior ou registrar auditoria; não sobrescrever silenciosamente.
- Botão de finalizar deve prevenir duplo clique.

## Dados insuficientes
Quando não houver histórico comparável, explicar por quê:
- “Primeira vez que você registra este produto.”
- “Não há registro nos últimos 7 dias.”
- “Não foi possível comparar: unidades diferentes.”
Nunca mostrar economia/aumento sem duas observações comparáveis.
