# 05 — Plano de implementação incremental

**Instrução:** implementar somente uma etapa por vez. Não iniciar a próxima sem aprovação e sem a etapa atual passar nas verificações.

## Etapa 1 — Fundação do projeto e sistema visual
**Objetivo:** preparar a base sem implementar regras complexas.

Prompt para o agente:
> Leia `README.md` e os documentos `00`, `01`, `02` e `06`. Analise o repositório antes de alterar qualquer arquivo. Configure ou ajuste React + TypeScript + Vite, Bootstrap, React Icons e CSS tokens. Crie a estrutura de pastas definida em `02-arquitetura.md`. Implemente layout mobile-first com cabeçalho, área de conteúdo e navegação inferior (Lista, Histórico, Comparar, Ajustes), usando dados estáticos. Reproduza fielmente a direção visual de `01-design-ux-ui.md` e `07-prompt-visual-alta-fidelidade.md`. Não conecte banco nem autenticação ainda. Não implemente funcionalidades futuras. Garanta responsividade, estados de foco e alvos de toque. Execute lint/typecheck/build e informe os resultados.

Critérios de aceite:
- Aplicação inicia sem erro.
- Layout utilizável em 360px.
- Navegação visual funciona entre telas placeholder.
- Tokens CSS centralizados; sem CSS duplicado desnecessário.

## Etapa 2 — Lista ativa com dados locais
Prompt:
> Implemente a feature de lista ativa usando inicialmente um repositório mock/local tipado. Permita criar lista, adicionar/editar/excluir item, alterar quantidade/unidade/preço, marcar coletado e atualizar total em tempo real. Siga `04-regras-de-negocio.md`. Não implemente histórico ou comparação ainda. Separe componentes, hooks, serviços e funções puras. Inclua testes para totalização e validação. Não use `any`.

Aceite:
- Total muda ao alterar quantidade/preço ou excluir item.
- Itens sem preço são sinalizados e não entram no total conhecido.
- Edição mantém os dados corretos.
- Exclusão tem confirmação/desfazer.

## Etapa 3 — Neon, Better Auth e persistência
Prompt:
> Integre o banco à feature existente sem reescrever a interface. Leia `03-modelagem-postgres.md`; confira o schema real e mantenha as migrations em `scripts/`. Toda escrita passa pela API (`server/`), com sessão do Better Auth validada antes da query; o cliente nunca acessa o banco. Implemente serviços no frontend e tratamento de loading/erro. Nunca exponha `DATABASE_URL` no bundle. Teste CRUD da lista e itens, incluindo requisição sem sessão.

Aceite:
- Criar, ler, atualizar e excluir dados da lista compartilhada autenticada.
- Requisição sem sessão recebe `401`; payload inválido recebe `400`.
- Erros de rede não apagam o estado digitado.
- Chaves secretas não aparecem no bundle.

## Etapa 4 — Finalização e histórico
Prompt:
> Implemente a finalização de compras e a tela Histórico. Ao finalizar, preservar os dados da compra e gerar registros de preço de forma idempotente, conforme `03` e `04`. Criar tela de detalhes da compra. Impedir finalização duplicada. Não implementar comparação ainda.

Aceite:
- Lista finalizada aparece no histórico.
- Detalhes exibem os valores registrados na compra.
- Repetir a ação não duplica registros de preço.
- Lista ativa permanece separada do histórico.

## Etapa 5 — Comparação de preços
Prompt:
> Implemente a busca/seleção de produto e comparação com compra anterior, últimos 7 dias e mês-calendário anterior. Seguir estritamente `04-regras-de-negocio.md`. Comparar somente observações compatíveis e exibir datas, quantidades, unidades, preço anterior, preço atual, diferença em reais e percentual. Criar estados sem histórico e unidades incompatíveis. Não inventar valores.

Aceite:
- Variações de aumento/queda corretas.
- Percentual não divide por zero.
- Comparações incompatíveis são bloqueadas ou claramente marcadas.
- Períodos e datas são explícitos.

## Etapa 6 — Polimento, acessibilidade e robustez
Prompt:
> Faça uma revisão de UX, acessibilidade, performance e clean code. Teste telas pequenas, teclado virtual, loading, erro, vazio, confirmação de exclusão e estados de sincronização. Refatore duplicações reais sem criar abstrações desnecessárias. Verifique RLS, idempotência, precisão monetária e logs. Corrija problemas encontrados sem adicionar funcionalidades não solicitadas.

Aceite:
- Checklist de `06-qualidade-e-checklist.md` aprovado.
- Build, lint, typecheck e testes passam.
- Nenhuma ação principal sem feedback.
- Nenhuma falha conhecida de segurança documentada como resolvida sem evidência.

## Regra para toda etapa
Ao concluir, o agente deve parar e entregar: resumo, arquivos alterados, decisões técnicas, comandos executados, testes e pendências. Só continuar após autorização explícita.
