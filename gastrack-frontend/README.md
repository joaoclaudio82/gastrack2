# GasTrack - Sistema de Gerenciamento de Gás

![Status](https://img.shields.io/badge/status-active-success.svg)
![Angular](https://img.shields.io/badge/Angular-21-red.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-cyan.svg)

Sistema SaaS moderno para gerenciamento completo de distribuição de gás, desenvolvido com Angular 21, utilizando as mais recentes práticas de desenvolvimento incluindo zoneless change detection, arquitetura modular com lazy loading, e design system profissional com Tailwind CSS.

## ✨ Características Principais

- 🎯 **Gestão Completa de Gás** - CRUD de cilindros, controle de estoque e rastreamento
- 👥 **Gerenciamento de Clientes** - Cadastro completo com histórico e preferências
- 📦 **Pedidos e Entregas** - Sistema completo de pedidos com rastreamento
- 📊 **Relatórios e Analytics** - Dashboards interativos com métricas em tempo real
- 🔐 **Autenticação Robusta** - JWT com refresh token e controle de acesso baseado em roles
- 🎨 **Design System Moderno** - Interface consistente e profissional com Tailwind CSS
- ⚡ **Performance Otimizada** - Zoneless change detection para menor bundle size
- 🧪 **Totalmente Testado** - TDD com Vitest (unit) e Playwright (E2E)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20.19+, 22.12+ ou 24.0+
- Bun (opcional, mas recomendado para melhor performance)

### Instalação

```sh
# Clone o repositório
git clone https://github.com/seu-usuario/gastrack.git
cd gastrack

# Instale as dependências
npm install
# ou com bun
bun install

# Inicie o servidor de desenvolvimento
npm start
# ou com bun
bun start
```

Acesse `http://localhost:4200` no seu navegador.

## 📚 Tech Stack

| Categoria           | Tecnologia                                      |
| ------------------- | ----------------------------------------------- |
| **Framework**       | Angular 21 (zoneless, standalone components)    |
| **Linguagem**       | TypeScript 5.9 (strict mode)                    |
| **Estilização**     | Tailwind CSS 4 + Design System próprio          |
| **Estado**          | Angular Signals                                 |
| **Testing**         | Vitest + jsdom (unit), Playwright (E2E)         |
| **Linting**         | ESLint (strict-type-checked), Stylelint, CSpell |
| **Formatação**      | Prettier                                        |
| **Package Manager** | npm / Bun                                       |
| **Git Hooks**       | Husky + Commitlint + Lint-staged                |

## 🏗️ Arquitetura do Projeto

```
src/app/
├── core/                          # Singleton services (importar uma vez)
│   ├── auth/
│   │   ├── services/              # AuthService, TokenService
│   │   ├── guards/                # authGuard, roleGuard, guestGuard
│   │   └── interceptors/          # jwt.interceptor, error.interceptor
│   ├── services/                  # ConfigService, NotificationService
│   └── providers/                 # provideCoreServices()
│
├── shared/                        # Componentes reutilizáveis
│   ├── components/ui/             # Button, Input, Card, Modal, Toast
│   ├── pipes/                     # Truncate, SafeHtml
│   ├── directives/                # ClickOutside, HasRole
│   └── validators/                # CustomValidators
│
├── layouts/                       # Layouts da aplicação
│   ├── auth-layout/               # Layout para login/register
│   └── dashboard-layout/          # Header, Sidebar, Breadcrumb
│
├── features/                      # Feature modules (lazy loaded)
│   ├── auth/                      # Login, Register, Forgot Password
│   ├── dashboard/                 # Dashboard principal
│   ├── gas-management/            # CRUD de cilindros de gás
│   ├── customers/                 # Gestão de clientes
│   ├── orders/                    # Pedidos e entregas
│   ├── inventory/                 # Controle de estoque
│   ├── reports/                   # Relatórios e analytics
│   └── settings/                  # Configurações
│
├── models/                        # Interfaces e types
│   ├── auth.model.ts
│   ├── gas.model.ts
│   ├── customer.model.ts
│   └── order.model.ts
│
└── environments/                  # Dev/Prod configs
```

## 📋 Scripts Disponíveis

### Desenvolvimento

```sh
npm start     # Inicia servidor de desenvolvimento
npm run build # Build de produção
npm run watch # Build em modo watch
```

### Testes

```sh
npm test           # Testes unitários em watch mode
npm run test:ci    # Testes unitários uma vez (CI)
npm run test:build # Build de testes com dump de arquivos
```

### E2E (Playwright)

```sh
npm run e2e        # Rodar testes E2E
npm run e2e:ui     # Abrir Playwright UI
npm run e2e:headed # Testes com browser visível
npm run e2e:debug  # Modo debug
npm run e2e:report # Ver relatório HTML
```

**Primeira vez:** `bunx playwright install` (instala browsers). Ver [docs/testing.md](./docs/testing.md) para o fluxo completo.

### Linting e Formatação

```sh
npm run lint          # Lint JavaScript/TypeScript/HTML/JSON
npm run lint:style    # Lint CSS/SCSS
npm run lint:spelling # Verificar ortografia
npm run lint:tsc:app  # Type check da aplicação
npm run lint:tsc:spec # Type check dos testes
npm run lint:tsc:all  # Type check completo
npm run lint:format   # Verificar formatação
npm run lint:all      # Executar todos os linters
npm run format        # Formatar todos os arquivos
```

### CI/CD

```sh
npm run ci:all # Executar lint + testes (CI)
npm run shove  # Backup rápido: add + commit + push
```

## 🎨 Design System

### Paleta de Cores

```css
/* Cores primárias - Azul Gás */
--color-primary: #2563eb; /* blue-600 */
--color-primary-dark: #1d4ed8; /* blue-700 */

/* Status */
--color-success: #10b981; /* emerald-500 */
--color-warning: #f59e0b; /* amber-500 */
--color-danger: #ef4444; /* red-500 */
--color-info: #3b82f6; /* blue-500 */
```

### Componentes UI

Todos os componentes seguem padrões consistentes:

- **Variantes**: `primary`, `secondary`, `danger`, `outline`, `ghost`
- **Tamanhos**: `sm`, `md`, `lg`
- **Estados**: `hover`, `focus`, `disabled`, `loading`

## 🧪 Testes

O projeto usa **testes unitários** (Angular) e **testes E2E** (Playwright). O fluxo completo (comandos, quando rodar, CI) está em **[docs/testing.md](./docs/testing.md)**.

### Resumo do fluxo

- **Pre-commit:** lint (ESLint, Stylelint, Prettier) nos arquivos staged
- **Pre-push:** `ci:all` (lint + testes unitários)
- **Antes de PR:** `bun run test:all` (lint + unit + E2E)
- **CI (Pull Request):** dois jobs em paralelo — lint + unit e E2E (Playwright)

### TDD

1. **Red**: Escreva o teste ANTES do código
2. **Green**: Implemente o mínimo para passar
3. **Refactor**: Melhore sem quebrar testes

## 📝 Convenções de Código

### Naming Conventions

| Tipo               | Convenção            | Exemplo                 |
| ------------------ | -------------------- | ----------------------- |
| Component selector | `app-` + kebab-case  | `app-gas-card`          |
| Directive selector | `app` + camelCase    | `appHighlight`          |
| Service            | PascalCase + Service | `GasService`            |
| Guard              | camelCase + Guard    | `authGuard`             |
| Model/Interface    | PascalCase           | `Gas`, `Customer`       |
| Arquivo            | kebab-case.type.ts   | `gas-card.component.ts` |

### Path Aliases

```typescript
import { AuthService } from '@core/auth';
import { ButtonComponent } from '@shared/components/ui';
import { Gas } from '@models/gas.model';
import { environment } from '@env';
```

## 🔒 Segurança

### Headers de Segurança

Configurados no `index.html`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Autenticação

- JWT com refresh token
- Guards de rota para proteção
- Role-based access control (RBAC)
- Interceptors para adicionar tokens automaticamente

### Proteção XSS

- Sanitização automática do Angular
- Uso criterioso do pipe SafeHtml
- Validação de dados no backend

## 🔄 Git Workflow

### Conventional Commits

```
feat(gas): adicionar listagem de cilindros
fix(auth): corrigir refresh token
refactor(shared): extrair componente de loading
test(orders): adicionar testes de pedidos
docs: atualizar README
chore: atualizar dependências
```

### Pre-commit Hooks

Automaticamente executados:

- ✅ Prettier formata código
- ✅ ESLint verifica código
- ✅ Stylelint verifica CSS
- ✅ CSpell verifica ortografia

## 🚫 Regras Críticas

### ❌ NÃO FAZER

- Usar `any`
- Duplicar código/constantes
- Commitar sem testes
- Ignorar erros de lint
- Usar Zone.js
- Criar componentes não-standalone
- Usar constructor injection

### ✅ FAZER

- Escrever testes primeiro (TDD)
- Usar tipagem estrita
- Manter single source of truth
- Usar Signals para reatividade
- Rodar `npm run ci:all` antes de PRs
- Seguir conventional commits
- Usar standalone components
- Componentizar tudo
- Usar Tailwind para styling

## 🛠️ Configuração de IDE

### VS Code (Recomendado)

Extensões recomendadas:

- Angular Language Service
- ESLint
- Prettier
- Stylelint
- Code Spell Checker
- EditorConfig

As extensões serão sugeridas automaticamente ao abrir o projeto.

### Configurações

- Formatação ao salvar habilitada
- Auto-save com delay de 3 segundos
- TypeScript do workspace
- Prettier como formatador padrão

## 📖 Documentação Adicional

- **[docs/testing.md](./docs/testing.md)** — Setup completo do fluxo de testes (unit + E2E, comandos, CI)
- **[CLAUDE.md](./CLAUDE.md)** — Padrões de código, arquitetura e guidelines

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feat/amazing-feature`)
3. Commit suas mudanças seguindo conventional commits
4. Push para a branch (`git push origin feat/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Rafael Jonker** - _Desenvolvimento Inicial_

## 🙏 Agradecimentos

- Angular Team pelo excelente framework
- Comunidade Angular pela documentação e suporte
- Extreme Angular template como base inicial

---

Desenvolvido com ❤️ e ☕ por Rafael Jonker
