# 07 — Prompt visual de alta fidelidade para o agente

Use este prompt na Etapa 1 e consulte-o novamente durante o polimento. A imagem de referência gerada nesta conversa deve ser anexada ao agente como referência visual.

---

Você é um engenheiro frontend sênior com forte experiência em UX/UI mobile-first. Construa a interface de um aplicativo chamado **Vai de Lista**, um caderno digital inteligente para organizar compras de supermercado. Use o slogan **“Anotou. Comprou. Economizou.”** quando houver espaço adequado, sem competir com as ações principais.

### Identidade da marca
- Nome oficial: **Vai de Lista** (não usar “Minha Lista de Compras” como nome do produto).
- Personalidade: jovem, criativa, irreverente, acolhedora e prática.
- Slogan: **Anotou. Comprou. Economizou.**
- Conceito: sacola ou carrinho de compras combinado com checklist, de forma simples e reconhecível.
- Paleta: base creme, verde como cor de ação/organização, amarelo para destaques pontuais, terracota como acento e cinza escuro para textos.
- A marca deve ser legível em telas pequenas; evitar excesso de elementos decorativos.

## Resultado visual esperado
Reproduza a linguagem visual da referência: interface clara, calorosa e organizada, inspirada em papel de caderno. Fundo creme, cartões quase brancos, linhas horizontais finas, detalhes em azul e verde, amarelo suave para destacar o total. A sensação deve ser de anotar no próprio caderno, mas com acabamento moderno e digital. Não transforme em dashboard administrativo, não use tema escuro como padrão e não exagere em gradientes, sombras ou ilustrações.

## Tecnologia e restrições
- React + TypeScript.
- Bootstrap para grid/utilitários e componentes quando fizer sentido.
- CSS próprio para fidelidade visual; React Icons para ícones.
- Não usar Tailwind.
- Mobile first; desktop deve apenas expandir o conteúdo com limites de largura.
- Componentes reutilizáveis, tipados e pequenos.
- Nesta etapa, usar dados mockados; não conectar backend ainda.

## Shell da aplicação
- Fundo geral `#F5F0E6`.
- Conteúdo central com largura confortável; no desktop, limitar largura e manter aparência de app.
- Cabeçalho compacto com ícone de carrinho/cestinha e título.
- Navegação inferior fixa no celular com quatro opções: Lista, Histórico, Comparar, Ajustes.
- Item ativo da navegação em azul, com ícone e rótulo.
- Garantir safe-area inferior e padding do conteúdo para a barra não cobrir informações.

## Tela Lista
- Cabeçalho com a marca “Vai de Lista”, título contextual da lista ativa e data em texto secundário.
- Card amarelo suave com “Total até agora” e valor monetário grande, de leitura imediata.
- Área de adicionar item com campo “Nome do produto” e botão com ícone de mais.
- Itens como linhas de caderno, com divisor fino.
- Cada linha: checkbox circular grande, nome do produto, detalhe de quantidade/unidade, campo/valor de preço e ações editar/excluir.
- Itens marcados ficam visualmente concluídos, mas continuam no cálculo.
- Botão principal verde “Adicionar item” ou “Finalizar compra”, conforme contexto.
- O total deve continuar fácil de localizar durante a rolagem, sem sobrepor os itens.

## Tela Histórico
- Título “Histórico”.
- Cards de compras com data, quantidade de itens, nome da lista e total em reais.
- Hierarquia visual clara; cartões com borda delicada e ícone de cesta.
- Ao tocar, abrir detalhes da compra.
- Filtros simples e fáceis de tocar.

## Tela Comparar
- Título “Comparar preços”.
- Produto selecionado em cartão destacado com nome e unidade.
- Blocos de comparação para “Última compra”, “Últimos 7 dias” e “Mês anterior”, somente quando houver dados.
- Mostrar preço e data de cada observação.
- Resultado em painel: seta para baixo e verde para mais barato; seta para cima e vermelho para mais caro; igualdade com neutro.
- Exibir diferença absoluta e percentual.
- Estado vazio amigável quando não houver histórico.

## Detalhes da lista
- Cabeçalho com data, total e quantidade de itens.
- Ações “Editar lista” e “Excluir lista” claramente distintas.
- Relação de itens com preço, quantidade e estado coletado.
- Confirmação antes de excluir.

## Componentes e microinterações
- Botões com estados hover, active, focus e disabled.
- Inputs com labels visíveis e borda clara.
- Modais/bottom sheets confortáveis no celular.
- Feedback de sucesso discreto.
- Skeletons e estados vazios coerentes com a identidade visual.
- Transições curtas e suaves, sem animações excessivas.

## Regras de fidelidade
- Priorizar legibilidade sobre textura.
- Não usar fonte manuscrita em preços, campos ou textos pequenos.
- Não comprimir linhas; cada item deve ter área de toque generosa.
- Não colocar ações só em hover.
- Não usar emoji como substituto de ícones da interface; usar React Icons.
- Não inventar gráficos ou métricas que não foram especificados.
- O design deve parecer consistente entre todas as telas.

## Entrega da etapa
Implemente somente o shell e telas estáticas navegáveis. Informe como executar. Não implemente CRUD, Supabase, histórico real ou comparação real nesta etapa.
