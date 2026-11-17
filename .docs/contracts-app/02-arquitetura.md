# 02 — Arquitetura e padrões técnicos

## Stack
React, TypeScript, Vite, Supabase JS, Bootstrap (grid/utilitários/componentes pontuais), CSS próprio e React Icons. Não adicionar biblioteca sem justificar o benefício.

## Organização sugerida
```text
src/
  app/
    App.tsx
    router.tsx
    providers/
  components/
    Button/
    ConfirmDialog/
    EmptyState/
    FormField/
    PriceBadge/
    BottomNavigation/
  features/
    shopping-lists/
      components/
      hooks/
      services/
      types/
      utils/
      pages/
    history/
      components/
      hooks/
      services/
      types/
      pages/
    price-comparison/
      components/
      hooks/
      services/
      types/
      pages/
  lib/
    supabase/
      client.ts
      database.types.ts
  styles/
    tokens.css
    global.css
  utils/
    currency.ts
    dates.ts
  main.tsx
```

## Regras de arquitetura
- Componentes de apresentação não devem consultar Supabase diretamente.
- Acesso a dados fica em `services` ou repositórios tipados.
- Hooks coordenam estado e casos de uso; não concentram regras de negócio extensas.
- Regras de cálculo ficam em funções puras testáveis.
- Evitar componentes gigantes; extrair quando houver responsabilidade distinta ou repetição real.
- Não criar abstrações genéricas prematuras.
- Não usar `any`; modelar tipos e validar dados externos.
- Tratar `null` explicitamente.
- Não duplicar estado derivável: total deve ser calculado a partir dos itens, não armazenado em estado paralelo no frontend.

## Estado e sincronização
- Começar com estado local por feature e serviços assíncronos.
- Atualizações otimistas somente quando houver estratégia de rollback.
- Exibir loading, erro e vazio em cada tela.
- Não assumir que a chamada ao Supabase sempre terá sucesso.
- Não armazenar dados sensíveis em localStorage. Se for necessário rascunho offline, documentar o escopo e implementar estratégia própria.

## Formatação monetária
- Exibir em `pt-BR` com `Intl.NumberFormat`.
- Não usar `parseFloat` como única garantia de precisão monetária.
- Preferir armazenar preço como `numeric(12,2)` no banco; no frontend, centralizar conversão/aritmética e testar arredondamento.
- Nunca concatenar strings de moeda para calcular.

## Convenções
- Componentes e tipos: PascalCase.
- Variáveis/funções: camelCase.
- Constantes globais: UPPER_SNAKE_CASE apenas quando fizer sentido.
- Um componente por arquivo quando facilitar leitura.
- Imports organizados; remover código morto e dependências não utilizadas.
- CSS por componente/feature ou módulos; tokens compartilhados em `styles/tokens.css`.
