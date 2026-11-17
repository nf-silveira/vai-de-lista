# 01 — Direção visual e especificação UX/UI

## Conceito
**Caderno de compras digital.** Papel creme, linhas horizontais muito suaves, separadores delicados, pequenos detalhes que lembram uma folha pautada e tipografia legível. Não simular papel a ponto de prejudicar contraste ou acessibilidade.

## Paleta sugerida
- Fundo geral: `#F5F0E6` (papel claro).
- Superfície/cartões: `#FFFCF5`.
- Texto principal: `#30291F`.
- Texto secundário: `#756B5E`.
- Linhas/bordas: `#E7DDCC`.
- Azul de ação/links: `#2868C7`.
- Verde de sucesso/economia: `#2F8B57`.
- Vermelho para exclusão/aumento: `#C94B45`.
- Amarelo suave para total/destaque: `#F5D98A`.

Use cores semânticas consistentemente. Não dependa apenas da cor: acompanhe variações com texto e ícones.

## Tipografia e textura
- Fonte sans-serif muito legível (ex.: Inter ou system-ui); títulos podem ter um toque mais editorial, mas evite fontes manuscritas em campos e valores.
- Linhas de caderno discretas no fundo de áreas específicas, não atrás de todo texto pequeno.
- Cantos arredondados de 12–16px.
- Sombras leves e curtas; evitar aparência de dashboard corporativo.
- Ícones via `react-icons`, com tamanho e peso consistentes.

## Layout mobile
- Largura de referência: 360–430px.
- Área segura respeitada em aparelhos com notch.
- Conteúdo em coluna única.
- Barra inferior fixa com 4 destinos: Lista, Histórico, Comparar, Ajustes.
- Botões e alvos de toque com pelo menos 44px de altura/largura.
- Total da compra em uma faixa/card de destaque que permaneça visível na tela da lista, sem cobrir o conteúdo.
- Campos numéricos devem abrir teclado numérico decimal.
- Respeitar `100dvh`, safe areas e rolagem vertical natural.

## Tela 1 — Lista ativa
Hierarquia:
1. Cabeçalho: ícone de cestinha, título “Minha lista” e data.
2. Ação secundária para editar nome da lista.
3. Card de total com rótulo “Total até agora” e valor em destaque.
4. Campo de adicionar produto: nome do produto; botão de adicionar evidente. Quantidade e preço podem ficar em formulário expandido para reduzir fricção.
5. Lista de itens em linhas tipo caderno:
   - círculo/checkbox grande para marcar coletado;
   - nome do produto em destaque;
   - quantidade e preço unitário em texto secundário;
   - valor subtotal alinhado à direita;
   - menu/ícone para editar e excluir.
6. Estado vazio com ilustração/ícone simples e chamada “Adicione o primeiro produto”.
7. Ação “Finalizar compra” ao fim ou em posição fixa contextual, com confirmação/resumo.

Ao marcar item como comprado, aplicar check visual e texto secundário discreto, mas não apagar o preço nem remover o item do total. O total inclui todos os itens com preço informado; a regra deve ser uniforme e explicada.

## Tela 2 — Adicionar/editar item
- Abrir como bottom sheet ou modal adaptado ao mobile.
- Campos: nome (obrigatório), quantidade (padrão 1), unidade (un, kg, g, L, ml, pacote etc.), preço unitário (opcional enquanto a pessoa ainda não encontrou o produto).
- Mostrar prévia do subtotal quando quantidade e preço estiverem válidos.
- Botão principal “Salvar item”; botão secundário “Cancelar”.
- Validação inline, sem alert genérico do navegador.

## Tela 3 — Histórico
- Título “Histórico”.
- Filtro por período: Tudo, 7 dias, 30 dias, intervalo personalizado (pode ficar para etapa posterior).
- Cards por compra com data, nome da lista, quantidade de itens e total.
- Toque abre detalhes da compra.
- Busca por nome de lista/produto pode ser adicionada em etapa posterior.
- Lista vazia com explicação de que compras finalizadas aparecerão ali.

## Tela 4 — Detalhes da compra
- Data, nome da lista, total e quantidade de itens no topo.
- Itens e preços registrados, preservando o retrato daquela compra.
- Ações: editar metadados (quando permitido), duplicar como nova lista e excluir com confirmação.
- Evitar editar silenciosamente registros históricos de preço; se houver edição, registrar que o valor foi corrigido ou manter trilha de auditoria.

## Tela 5 — Comparar preços
- Busca/seleção de produto.
- Mostrar o preço mais recente e referências disponíveis:
  - compra anterior;
  - últimos 7 dias;
  - mês anterior (mesmo intervalo de calendário ou comparação definida no produto).
- Resultado em painel: “R$ 0,50 mais barato (−7,1%)” ou “R$ 1,20 mais caro (+8,3%)”.
- Mostrar datas exatas, preço, quantidade e unidade em cada referência.
- Se não houver dados, texto “Ainda não há compras suficientes para comparar este produto”.
- Comparar preço por unidade equivalente. Ex.: R$/kg com R$/kg; não comparar diretamente pacote de 500g com pacote de 1kg sem normalização.

## Tela 6 — Confirmação de exclusão/finalização
- Confirmação clara, nome da lista e impacto da ação.
- Excluir lista: ação destrutiva em vermelho, opção cancelar com destaque equivalente.
- Finalizar compra: apresentar total e quantidade de itens; confirmar antes de arquivar.

## Estados e feedback
- Loading: skeletons discretos.
- Erro: mensagem útil e botão tentar novamente.
- Offline/instabilidade: não descartar formulário; avisar que não foi possível sincronizar.
- Sucesso: feedback breve, sem modal desnecessário.
- Desabilitar botão durante submissão para evitar duplicidade.

## Acessibilidade
- Contraste WCAG AA sempre que possível.
- Inputs com label real, não apenas placeholder.
- Foco visível e ordem de tabulação lógica.
- Botões com nome acessível; ícones decorativos com `aria-hidden`.
- Status de preço comunicado por texto, não só verde/vermelho.
