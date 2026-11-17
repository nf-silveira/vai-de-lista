# Vai de Lista — visão geral

**Slogan:** Anotou. Comprou. Economizou.

# 00 — Visão geral do produto

## Objetivo
Criar um aplicativo simples e agradável para registrar uma compra enquanto a pessoa percorre o mercado. A experiência deve lembrar um caderno de anotações: acolhedora, familiar e rápida, sem parecer uma planilha complexa.

## Público e contexto de uso
- Uso predominante em celular, com uma mão e em ambiente de mercado.
- A pessoa adiciona os produtos à lista antes ou durante a compra.
- Ao encontrar cada produto, informa o preço observado/pago.
- O total é atualizado automaticamente.
- A pessoa consulta compras anteriores para entender se o preço subiu ou caiu.

## Funcionalidades do MVP
1. Criar uma lista com nome opcional e data.
2. Adicionar item com nome, quantidade e preço unitário.
3. Marcar item como coletado/comprado.
4. Atualizar automaticamente subtotal do item e total da lista.
5. Editar e excluir itens individualmente.
6. Editar nome/data e excluir uma lista inteira, com confirmação.
7. Finalizar compra e manter a lista no histórico.
8. Consultar listas anteriores e abrir seus detalhes.
9. Comparar o preço atual com o último preço registrado, com a semana anterior e com o mês anterior quando houver dados comparáveis.
10. Exibir variação em reais e percentual, indicando se ficou mais caro ou barato.

## Fora do escopo inicial
- Integração com supermercados, encartes ou APIs de preço.
- Leitura automática de código de barras.
- Compartilhamento colaborativo em tempo real.
- Controle financeiro completo, orçamento familiar ou recomendações automatizadas.
- Preço médio nacional/regional.

## Fluxo principal
1. Abrir a aba **Lista**.
2. Criar uma lista ou continuar a lista em andamento.
3. Adicionar produtos.
4. Durante a compra, preencher preço e quantidade e marcar os produtos coletados.
5. Conferir o total sempre visível.
6. Finalizar a compra.
7. Encontrar a lista em **Histórico** e comparar preços em compras futuras.

## Navegação principal
- **Lista**: lista ativa e total.
- **Histórico**: compras finalizadas e listas anteriores.
- **Comparar**: consulta de variações de preços.
- **Configurações**: preferências básicas e conta, se houver autenticação.

## Critérios de sucesso
- Adicionar um item deve exigir poucos campos e poucos toques.
- O total deve ser compreensível e atualizar sem recarregar a página.
- O usuário deve distinguir preço atual, preço anterior e período comparado.
- Ações destrutivas devem pedir confirmação.
- A interface deve continuar funcional em telas pequenas e com teclado virtual aberto.
