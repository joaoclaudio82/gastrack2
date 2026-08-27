# Setup de Testes - GasTrack Frontend

Este documento descreve o fluxo completo de testes do frontend: **testes unitários** (Angular) e **testes E2E** (Playwright), incluindo comandos, quando rodar e o que acontece na CI.

---

## Visão geral

| Tipo     | Ferramenta   | Onde roda          | Quando rodar                  |
| -------- | ------------ | ------------------ | ----------------------------- |
| **Unit** | Angular Test | `ng test`          | Desenvolvimento, pre-push, CI |
| **E2E**  | Playwright   | `playwright test`  | Antes de PR, CI no GitHub     |
| **Lint** | ESLint, etc. | `lint-staged` / CI | Pre-commit (staged), CI       |

O pipeline completo (lint + unit + E2E) é executado em **Pull Requests** e pode ser rodado localmente com `bun run test:all`.

---

## Comandos

### Testes unitários

```sh
bun test        # Modo watch (re-executa ao alterar arquivos)
bun run test:ci # Uma execução, sem watch (ideal para CI)
```

- Configuração: `angular.json` → `test` (builder `@angular/build:unit-test`), `tsconfig.spec.json`.
- Arquivos: `src/**/*.spec.ts`.

### Testes E2E (Playwright)

```sh
bun run e2e        # Rodar todos os testes E2E (sobe o app automaticamente)
bun run e2e:ui     # Interface gráfica do Playwright
bun run e2e:headed # Browser visível
bun run e2e:debug  # Modo debug
bun run e2e:report # Abrir relatório HTML após a execução
```

**Primeira vez (ou após instalar Playwright):**

```sh
bunx playwright install
# Ou só Chromium (ex.: em CI):
bunx playwright install --with-deps chromium
```

- Configuração: `playwright.config.ts`.
- Testes: pasta `e2e/` (ex.: `e2e/auth/login.spec.ts`, `e2e/dashboard/`, `e2e/navigation/`).
- O Playwright sobe o servidor de desenvolvimento (`bun start`) antes dos testes; em CI não reutiliza servidor existente.

### Pipeline completo (local)

```sh
bun run test:all # lint:all + test:ci + e2e (tudo em sequência)
```

Use antes de abrir ou atualizar um PR para garantir o mesmo que a CI.

### Lint e CI

```sh
bun run lint:all # TypeScript, ESLint, Stylelint, Prettier
bun run ci:all   # lint:all + test:ci (sem E2E; roda no pre-push)
```

---

## Quando rodar o quê

| Momento         | O que roda                                                    | Observação                           |
| --------------- | ------------------------------------------------------------- | ------------------------------------ |
| **Pre-commit**  | Lint-staged (ESLint, Stylelint, Prettier) nos arquivos staged | Não roda testes                      |
| **Pre-push**    | `ci:all` (lint + testes unitários)                            | E2E não roda no hook (mais demorado) |
| **Antes de PR** | `bun run test:all`                                            | Recomendado: lint + unit + E2E       |
| **CI (PR)**     | Job `validate-code`: lint + unit; job `e2e`: Playwright       | Dois jobs em paralelo no GitHub      |

---

## Estrutura dos testes E2E

```
e2e/
├── auth/
│   ├── login.spec.ts
│   └── forgot-password.spec.ts
├── dashboard/
│   └── dashboard.spec.ts
├── navigation/
│   ├── header.spec.ts
│   └── sidebar.spec.ts
└── utils/
    └── auth.ts          # mockAuth() para testes autenticados
```

- **Sem autenticação:** testes de redirecionamento para login e exibição da tela de auth.
- **Com autenticação:** uso de `mockAuth(page, { user: { ... } })` em `e2e/utils/auth.ts` para injetar tokens no `localStorage` e testar dashboard, header e sidebar como usuário logado.

Convenções (ver também CLAUDE.md):

- Preferir `getByRole()`, `getByLabel()`, `getByText()`.
- Evitar `data-testid` a menos que seja necessário.
- Nomes e comentários em português nos specs.

---

## CI no GitHub (Pull Request)

No evento `pull_request` são executados dois jobs em paralelo:

1. **validate-code** (workflow reutilizável)
   - Checkout, Node 22, Bun, `bun install --frozen-lockfile`
   - `bun run ci:all` → lint + testes unitários

2. **e2e**
   - Checkout, Node 22, Bun, `bun install --frozen-lockfile`
   - `bunx playwright install --with-deps chromium`
   - `bun run e2e`

O PR só fica verde se **lint + unit** e **E2E** passarem.

---

## Resumo rápido

- **Desenvolvimento:** `bun test` (unit em watch); quando for testar fluxos na UI: `bun run e2e`.
- **Antes de commitar:** pre-commit (lint) e pre-push (lint + unit) rodam sozinhos.
- **Antes de abrir/atualizar PR:** rode `bun run test:all` (lint + unit + E2E).
- **CI:** em todo PR rodam automaticamente lint + unit (job validate-code) e E2E (job e2e).

Para convenções de código e TDD, veja [CLAUDE.md](../CLAUDE.md). Para scripts e lint, veja o [README](../README.md).
