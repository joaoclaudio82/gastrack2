# Compatibilidade endereço ↔ contrato na criação do kit (Issue #62)

**Data:** 2026-06-16
**Branch:** `fix/onboarding-endereco-contrato-compat` (base: `origin/integracao/prs-abertos`)
**Prioridade:** P0

## Problema

No wizard de onboarding os passos são, em ordem:

```
1. Empresa → 2. Endereço → 3. Contrato → 4. Kit → ...
```

O passo **Endereço** (2) e o passo **Contrato** (3) são independentes e nunca validam
suas escolhas entre si. O backend, porém, exige que o endereço do kit esteja em
`contract.allowedAddressIds` (`EquipmentKitServiceImpl.java:459`, validação correta).

Quando o usuário escolhe um endereço fora dos `allowedAddressIds` do contrato selecionado,
o wizard avança normalmente até o passo Kit (4), onde:

1. o select de endereço do `kit-form` (que só lista os endereços permitidos do contrato)
   não exibe o endereço pré-selecionado; e
2. a criação do kit falha no backend com **"Address is not enabled for this contract"**.

## Decisão de produto

**Auto-incluir + fallback bloqueante.** É a única estratégia que satisfaz o critério de
aceite (_"é impossível chegar ao step Kit com combinação inválida"_) sem adicionar atrito
ao caso comum, e é consistente com o padrão já existente no código
(`kit-form.component.ts:474`, que auto-inclui endereços recém-criados nos permitidos do
contrato).

- Se o endereço **já** está permitido → segue sem chamada extra (idempotente).
- Se **não** está → tenta habilitá-lo no contrato (`PUT /contracts/:id/addresses` via
  `ContractService.updateAddresses`, enviando a união dos ids). Em caso de sucesso, atualiza
  o estado com o contrato retornado e **notifica explicitamente** que o endereço foi
  habilitado.
- Se o `PUT` **falhar** → **não** avança (não emite `completed`); a causa real da API é
  exibida pelo `errorInterceptor`, mantendo o usuário no passo Contrato para ajustar.

Rejeitadas: "sempre bloquear" (atrito desnecessário, contraria padrão existente) e
"auto-incluir sem fallback" (não garante o invariante quando o `PUT` falha).

## Local do conserto

O passo **Contrato (3)** é o primeiro momento em que `selectedAddress` e `contract`
coexistem no estado. É ali, ao confirmar/criar o contrato, que detectamos e resolvemos a
incompatibilidade — antes de chegar ao passo Kit. Combinado com a cascata de reset do #73
(`OnboardingStateService` limpa downstream quando o id de endereço/contrato muda), o
invariante "endereço ∈ allowedAddressIds do contrato" passa a valer sempre que se entra no
passo Kit.

## Componentes e mudanças

### 1. `models/contract.model.ts` — helper puro (novo)

```typescript
/** Retorna os allowedAddressIds com o endereço garantido presente (deduplicado). */
export function withAllowedAddress(
  allowedAddressIds: readonly number[],
  addressId: number,
): number[];
```

Função pura, testável isoladamente. Reutiliza o padrão de merge já presente no `kit-form`.

### 2. `steps/step-contract.component.ts` — reconciliação

Método privado:

```typescript
private ensureAddressEnabled(contract: Contract): Observable<Contract>
```

- `selectedAddress` ausente → `of(contract)` (defensivo; não deve ocorrer no fluxo).
- endereço já em `allowedAddressIds` → `of(contract)`.
- caso contrário → `contractService.updateAddresses(contract.id, { addressIds: withAllowedAddress(...) })`,
  com notificação de sucesso explícita.

Tanto `confirmSelection()` (contrato existente, incl. ativação de DRAFT) quanto
`createContract()` (novo contrato) roteiam o contrato resultante por `ensureAddressEnabled`
antes de `setContract` + `completed.emit()`. Em erro: `submitting=false`, **sem** `completed.emit()`.

### 3. `steps/step-kit.component.ts` — verificação

Nenhuma mudança funcional necessária: o `kit-form` já restringe o select de endereço aos
permitidos do contrato (`filteredAddressOptions`, baseado em `contractAddresses()`), e o
invariante garantido no passo Contrato torna o `preselectedAddressId` sempre válido. Será
verificado por inspeção e coberto indiretamente.

## Fluxo de dados

```
confirmSelection / createContract
  → (DRAFT? updateStatus)
  → ensureAddressEnabled(contract)
       ├─ permitido        → of(contract)
       └─ não permitido    → updateAddresses(union) → contrato atualizado (+ notificação)
  → setContract(contract)          [id igual ⇒ não limpa downstream]
  → completed.emit()               [só em sucesso]
  (erro em updateAddresses ⇒ bloqueia: errorInterceptor mostra causa, sem completed)
```

## Tratamento de erros

- Erro no `updateAddresses`/`updateStatus`: a causa real é exibida pelo `errorInterceptor`
  (padrão do projeto); o componente apenas reseta `submitting` e **não** avança.
- `setContract` com o mesmo id não dispara a cascata de limpeza (correto: endereço + contrato
  seguem válidos), apenas atualiza `allowedAddressIds` no estado.

## Testes (Vitest, `should_X_When_Y`)

**`contract.model` (helper):**

- `should_AppendAddress_When_NotPresent`
- `should_NotDuplicate_When_AlreadyPresent`

**`step-contract` (componente):**

- `should_Advance_When_AddressAlreadyAllowed` (sem `updateAddresses`)
- `should_EnableAddressAndAdvance_When_AddressNotAllowed` (`updateAddresses` chamado com a união; notifica; `completed` emitido)
- `should_NotAdvance_When_EnableAddressFails` (sem `completed`)
- `should_EnableAddressAfterActivation_When_DraftContract`
- `should_EnableAddress_When_CreatingNewContract`

## Não-regressões

- Preservar a cascata de reset do #73.
- Standalone + OnPush + signals; sem `any`; mensagens PT-BR acentuadas.
