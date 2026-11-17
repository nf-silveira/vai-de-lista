# 06 — Clean code, refactoring, UX e qualidade

## Clean code
- Funções pequenas, com nome que descreve intenção.
- Uma função deve ter uma responsabilidade predominante.
- Evitar booleanos ambíguos e condicionais profundamente aninhadas.
- Preferir early return quando melhorar legibilidade.
- Tipos explícitos para entidades, DTOs e resultados de serviços.
- Não espalhar strings de status/unidade: centralizar unions/constantes.
- Não capturar erros e ignorá-los.
- Não usar `any`, `@ts-ignore` ou casts sem justificativa documentada.
- Não duplicar lógica de preço/data em componentes.

## Refactoring
Refatorar quando houver duplicação real, componente difícil de testar ou responsabilidades misturadas. Antes de refatorar:
1. identificar comportamento atual;
2. criar/ajustar testes;
3. fazer alteração pequena;
4. executar testes e build;
5. comparar comportamento.
Não fazer refactor amplo junto com feature nova sem necessidade.

## UX mobile-first
- Testar 320px, 360px, 390px e 430px.
- Botões principais com área de toque mínima de 44×44px.
- Não esconder ações essenciais em hover.
- Inputs numéricos com `inputMode="decimal"` e máscara/formatação cuidadosa.
- Não usar `alert()`/`confirm()` nativos como experiência principal.
- Manter foco e contexto após salvar/editar.
- Confirmar exclusões irreversíveis.
- Evitar teclado cobrindo botão Salvar; modal deve rolar.
- Navegação inferior não pode cobrir conteúdo: adicionar padding inferior.
- Preferir texto direto e rótulos familiares.

## Acessibilidade
- HTML semântico.
- Labels associados aos campos.
- Contraste adequado.
- Foco de teclado visível.
- `aria-label` para botões compostos só por ícone.
- `aria-live="polite"` para total atualizado e feedback relevante.
- Não depender somente de cor para indicar aumento/queda.

## Testes mínimos
- Cálculo de subtotal e total.
- Item sem preço.
- Quantidade zero/negativa inválida.
- Preço zero e percentual sem divisão por zero.
- Comparação de unidades compatíveis/incompatíveis.
- Limites de datas de 7 dias e mês anterior.
- Finalização idempotente.
- RLS para isolamento de usuário.
- Estados de loading, erro e vazio.

## Checklist antes de cada entrega
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Sem erros no console.
- [ ] Sem `any` ou suppressions injustificadas.
- [ ] Sem segredos no frontend.
- [ ] Mobile testado com teclado aberto.
- [ ] Ações destrutivas confirmadas.
- [ ] Total e comparação explicam os dados usados.
