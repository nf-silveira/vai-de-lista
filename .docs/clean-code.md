Aja como um Engenheiro de Software Sênior especialista em React, TypeScript e Clean Code.

O meu objetivo é refatorar um componente React (`.tsx`) existente para aplicar as melhores práticas de mercado, garantindo legibilidade, performance, tipagem estrita e facilidade de manutenção futura.

Por favor, analise novamente o código desse projeto e reescreva-o aplicando rigorosamente as seguintes diretrizes:

1. SEPARAÇÃO DE RESPONSABILIDADES (SEPARATION OF CONCERNS):
- Se o componente contiver lógica complexa de estado, manipulação de dados ou efeitos colaterais (`useEffect`), extraia essa lógica para um Custom Hook isolado.
- Deixe o componente visual focado primariamente na renderização da UI.
2. CÓDIGO LIMPO E RENDERIZAÇÃO:
- Simplifique a renderização condicional. Elimine ternários complexos ou aninhados dentro do JSX. Use Guard Clauses antes do retorno principal se necessário.
- Elimine estados (`useState`) redundantes. Certifique-se de que qualquer valor que possa ser calculado a partir de props ou outros estados seja transformado em Estado Derivado.
- Mantenha funções pequenas e com responsabilidade única.
3. TYPESCRIPT E BOAS PRÁTICAS REACT:
- Declare o componente usando funções nomeadas simples (ex: `export function ComponentName()`), evitando o uso do tipo `React.FC`.
- Aplique desestruturação de Props diretamente nos parâmetros da função, definindo valores padrão (Default Parameters) para props opcionais de forma nativa.
- Tipifique rigidamente todas as Props com interfaces claras. Use Union Types estritos para propriedades que aceitam apenas valores específicos (ex: variant: 'primary' | 'secondary').
- Use tipagem nativa do React para eventos e manipuladores (ex: `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent`).
- Siga a convenção de nomenclatura: prefixo "on" para eventos nas props (ex: `onClick`) e prefixo "handle" para as funções manipuladoras internas (ex: `handleClick`).
4. FORMATO DA ENTREGA:
- Forneça o código do componente refatorado de forma limpa.
- Se houver necessidade de criar um Custom Hook, separe-o claramente do componente.
- Explique brevemente quais foram as principais melhorias feitas e o porquê de cada alteração em tópicos diretos.
- Por fim, atualize o Readme conforme houve necessidade.

Ao concluir realize o commit na branch develop, push e posteriormente o merge na branch main. Siga essa recomendação de commit no idioma inglês:
O commit deve seguir o padrão Conventional Commits 1.0.0.   Use o formato: <emoji> <type>[optional scope]: <description>  Em seguida, liste as alterações em formato bullet list (- item), de forma clara e técnica.   Seja específico com nomes de variáveis, funções ou arquivos, quando possível.   "Exemplo" esperado:  ✨ feat(admin): add user role validation - created `validateUserRole()` to check admin privileges - updated `UserController.ts` to include new middleware - added unit tests for role validation.