# Vai de Lista — documentação do projeto

**Vai de Lista** é um aplicativo mobile-first para criar listas de compras, registrar preços durante a compra, acompanhar o total em tempo real e comparar preços com compras anteriores.

**Slogan:** Anotou. Comprou. Economizou.

**Personalidade da marca:** jovem, criativa, prática e irreverente. A identidade visual combina a sensação acolhedora de um caderno de compras com uma interface moderna e objetiva. O nome oficial deve aparecer de forma consistente em títulos, cabeçalhos, metadados e textos da interface.

## Stack definida

- React 19 + TypeScript + Vite
- Neon PostgreSQL (acesso exclusivo pela API)
- Better Auth (e-mail/senha, duas contas autorizadas)
- Bootstrap + CSS Modules com design tokens
- React Router

## Como usar esta documentação com seu agente

**Não peça para implementar tudo de uma vez.** Execute uma etapa por vez, na ordem abaixo. Ao final de cada etapa, peça ao agente para:

1. resumir o que foi implementado;
2. listar arquivos criados/alterados;
3. executar lint, typecheck e testes disponíveis;
4. corrigir erros antes de avançar;
5. não antecipar funcionalidades de etapas futuras.

## Documentos

| Documento                                  | Conteúdo                                     |
| ------------------------------------------ | -------------------------------------------- |
| `docs/00-visao-geral.md`                   | Objetivo, escopo e requisitos                |
| `docs/01-design-ux-ui.md`                  | Direção visual e especificação das telas     |
| `docs/02-arquitetura.md`                   | Estrutura técnica, pastas e padrões          |
| `docs/03-modelagem-postgres.md`            | Banco de dados, SQL inicial e segurança      |
| `docs/04-regras-de-negocio.md`             | Cálculos, comparação de preços e estados     |
| `docs/05-plano-de-implementacao.md`        | Etapas incrementais e prompts                |
| `docs/06-qualidade-e-checklist.md`         | Clean code, refactoring, acessibilidade e QA |
| `docs/07-prompt-visual-alta-fidelidade.md` | Prompt completo para reproduzir o design     |

## Princípios inegociáveis

- Mobile first; desktop é adaptação, não prioridade.
- Uma ação principal clara por tela.
- Nunca perder silenciosamente dados digitados.
- Valores monetários armazenados como `numeric` no banco e manipulados com precisão decimal.
- Comparações devem indicar claramente período, data e unidade/quantidade comparada.
- Não inventar histórico: se não houver preço anterior comparável, mostrar isso explicitamente.
- Componentes pequenos, tipados, reutilizáveis e com responsabilidades claras.
