# GasTrack Frontend

Angular 21 **zoneless**, TypeScript strict, Tailwind 4, Bun. Standalone em tudo, signals para
estado, `OnPush` em todo componente.

> Antes de mexer em domínio, leia [ARCHITECTURE.md](https://github.com/IFCE/gastrack-backend/blob/homologacao/ARCHITECTURE.md). Regras que
> atravessam back e front estão em [CONVENTIONS.md](https://github.com/IFCE/gastrack-backend/blob/homologacao/CONVENTIONS.md). Os dois moram no
> repositório do backend de propósito: são fonte única, e uma cópia aqui divergiria.
>
> As guidelines detalhadas de Angular e TypeScript continuam em `.cursor/rules/guidelines/` —
> este arquivo é o índice, não a cópia delas.

## Comandos

```bash
bun start        # dev em http://localhost:4200
bun run test     # unitários (Vitest, watch)
bun run test:ci  # unitários, execução única
bun run e2e      # Playwright
bun run lint     # ESLint
bun run lint:all # ESLint + Stylelint + CSpell
bun run build    # build de produção
bun run ci:all   # lint + testes
```

## Estrutura

```
src/app/
├── core/        # services de API, auth, interceptors, guards, constantes
├── features/    # por domínio: admin, analytics, cylinders, equipment…
├── layouts/     # dashboard, sidebar, breadcrumb
├── models/      # tipos alinhados aos DTOs do backend
└── shared/      # components/ui, validators, utils, pipes
```

Aliases: `@core`, `@shared`, `@models`, `@layouts`, `@features`, `@env`.

## Regras não-negociáveis

```typescript
@Component({
  standalone: true, // sempre
  changeDetection: ChangeDetectionStrategy.OnPush, // sempre
})
export class FooComponent {
  private readonly service = inject(FooService); // inject(), nunca construtor
}
```

- **Nunca `any`.** Use `unknown` + narrowing, ou genérico. `catch (error: unknown)`.
- **Estado em signal.** Writable privado, readonly público, `computed` para derivado.
- **Erro de API sempre tipado** — `extractApiErrorMessage(error)`, nunca `error.message` solto.
  Mensagem nova a exibir entra em `KNOWN_BACKEND_MESSAGES_PT_BR`, nunca traduzida no componente.

## Reuso antes de criar

| Precisa de       | Olhe primeiro           |
| ---------------- | ----------------------- |
| Componente de UI | `shared/components/ui/` |
| Validator        | `shared/validators/`    |
| Service de API   | `core/services/`        |
| Tipo             | `models/`               |

## Guidelines detalhadas

Em `.cursor/rules/guidelines/`:

| Pasta              | Conteúdo                                   |
| ------------------ | ------------------------------------------ |
| `code/angular/`    | componentes, services, signals, princípios |
| `code/typescript/` | tipos e style guide                        |
| `architecture/`    | estrutura do projeto, design system        |
| `testing/`         | testes em geral e específicos de Angular   |
| `git/`             | mensagem de commit, pull request           |

## Cálculo mora no servidor

Faixa de nível, fórmula, limite: chegam prontos da API. Constante de negócio chumbada no cliente
diverge do backend em silêncio — ver [CONVENTIONS.md §8](https://github.com/IFCE/gastrack-backend/blob/homologacao/CONVENTIONS.md).

Campo `effective…` numa resposta é **derivado**: use para exibir. O campo de mesmo assunto sem o
prefixo é o valor **gravado**, e é o que o formulário reenvia — §1 do CONVENTIONS.

## Nomenclatura

| Tipo    | Padrão                           | Exemplo                                   |
| ------- | -------------------------------- | ----------------------------------------- |
| Seletor | `app-` + kebab-case              | `app-line-cylinders`                      |
| Service | PascalCase + `Service`           | `RefillService`                           |
| Guard   | camelCase + `Guard`              | `roleGuard`                               |
| Arquivo | kebab-case.tipo.ts               | `line-cylinders.component.ts`             |
| Teste   | `should_Behavior_When_Condition` | `should_KeepValue_When_RequestOmitsField` |
