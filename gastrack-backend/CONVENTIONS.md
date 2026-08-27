# Convenções — GasTrack

Regras que **atravessam** backend e frontend, ou que custaram um bug para descobrir.

As convenções de stack ficam onde já estão: `gastrack-backend/CLAUDE.md` (Spring, JPA, testes) e
`gastrack-frontend/.cursor/rules/guidelines/` (Angular, TypeScript, Tailwind). Este documento
não as repete — se está aqui, é porque vale para os dois lados ou não cabia em nenhum deles.

Invariantes de domínio estão em [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Valor derivado nunca compartilha nome com valor gravável

Se a resposta expõe um número **calculado** e o request grava um número **armazenado**, os dois
precisam de nomes diferentes. Formulário de edição lê a resposta e a reenvia; nome igual faz o
calculado sobrescrever o armazenado sem ninguém pedir.

```java
// ERRADO — a resposta devolve a soma dos cilindros nesse campo, e o request grava a coluna
record PontoGasResponse(BigDecimal capacityLiters) {}   // = 150 (derivado)
record PontoGasRequest (BigDecimal capacityLiters) {}   // grava na coluna → vira 150

// CERTO — cru e derivado em campos distintos
record PontoGasResponse(
    BigDecimal capacityLiters,           // valor gravado, é o que o form reenvia
    BigDecimal effectiveCapacityLiters   // derivado, é o que a tela mostra
) {}
```

> Custo real: salvar uma linha só para renomear o local envenenava o fallback de 5 L com 150 L.

> Desfecho: o fallback do `PontoGas` foi removido (V49) — sem valor gravável, o par cru/derivado
> deixou de existir e a colisão não é mais possível **nesse** caso. A regra continua valendo para
> qualquer outro campo calculado que a resposta exponha.

## 2. Guard de invariante mora onde todos os chamadores passam

Uma regra de negócio replicada em dois services é uma regra que uma hora falta num terceiro
caminho. Extraia para um componente e injete.

Sintoma: você está prestes a copiar um `validate…` para outra classe. Pare e extraia.

> Custo real: a validação de gás único por manifold estava no cadastro de cilindro. A troca de
> botijão cria cilindro por outro caminho e passou meses sem a checagem.

## 3. Timestamp de domínio é UTC, dos dois lados

Quem grava e quem compara usam o mesmo relógio: `LocalDateTime.now(ZoneOffset.UTC)`.
`LocalDateTime.now()` puro depende do fuso da JVM e passa despercebido em container UTC.

```java
// ERRADO — grava em hora local, compara em UTC
pontoGas.setLastReadingAt(LocalDateTime.now());
LocalDateTime.ofEpochSecond(ts, 0, ZoneOffset.UTC).isAfter(pontoGas.getLastReadingAt());

// CERTO
pontoGas.setLastReadingAt(LocalDateTime.now(ZoneOffset.UTC));
```

Vale também para as fixtures de teste — foi um teste com `now()` local que denunciou o bug.

## 4. Transação não envolve chamada de rede

`@Transactional` num laço que faz HTTP (DynamoDB, IoT, Cognito) segura conexão do pool o
tempo todo. Pior: um `@Transactional` interno que falhe marca a transação externa como
*rollback-only*, e um `catch` que "isola o item com problema" vira ilusão — o commit final
descarta tudo.

Laço sem transação; cada item com a sua. Quando o item precisa de entidade carregada, passe
**id** e carregue dentro da transação.

## 5. Escolha de fetch acompanha a paginação

| Situação | Ferramenta |
|---|---|
| Consulta de **lista** que precisa de coleção | `JOIN FETCH` |
| Consulta **paginada** que precisa de coleção | `@BatchSize` na coleção |
| Relação `@ManyToOne` LAZY lida em massa | `@BatchSize` **na classe alvo** |

`JOIN FETCH` de coleção com `Pageable` faz o Hibernate paginar em memória (`HHH000104`) —
carrega a tabela inteira. `@BatchSize` na coleção **não** alcança os `@ManyToOne` de dentro
dela; se a resposta lê campos do objeto apontado, ele também precisa da anotação.

## 6. MapStruct: `expression` ignora o `NullValuePropertyMappingStrategy`

`NullValuePropertyMappingStrategy.IGNORE` só suprime propriedades nulas de mapeamento
**direto**. Uma `expression` é sempre avaliada — inclusive quando o request omitiu o campo.

```java
// ERRADO em updateEntity — campo ausente no request vira true e sobrescreve o estado
@Mapping(target = "connected", expression = "java(request.connected() == null || request.connected())")

// CERTO — o mapper ignora, o service decide
@Mapping(target = "connected", ignore = true)
```
```java
if (request.connected() != null) {
    cylinder.setConnected(request.connected());
}
```

Em `toEntity` (criação) a expression é aceitável: não há estado anterior para destruir.

## 7. Migration não apaga dado; ela aborta

Encontrou estado que impede a mudança? `RAISE EXCEPTION` com a query de diagnóstico na
mensagem. Decidir o destino do dado é humano.

```sql
DO $$
DECLARE orphans BIGINT;
BEGIN
    SELECT COUNT(*) INTO orphans FROM cylinders WHERE company_id IS NULL;
    IF orphans > 0 THEN
        RAISE EXCEPTION 'V45 abortada: % cilindro(s) sem company_id. Rode: SELECT id, serial_number FROM cylinders WHERE company_id IS NULL;', orphans;
    END IF;
END $$;
```

Coluna nova sempre com `DEFAULT` que **preserva o comportamento anterior** — a migration não
deve mudar nenhum número já existente.

## 8. Regra de negócio tem um dono só

Threshold, fórmula, limite: definidos no backend e **enviados** ao cliente. Constante duplicada
nos dois lados bate hoje e diverge amanhã, em silêncio.

```ts
// ERRADO — mesmas faixas do CylinderThresholdsConfiguration, chumbadas
if (ratio >= 0.8) return 'full';

// CERTO — vieram junto com a linha
const { critical, low, normal } = this.pontoGas().thresholds;
```

## 9. Erro de API é tipado, sempre

Nunca `error.message` sobre um `unknown`. Use `extractApiErrorMessage(error)`; mensagem nova do
backend a exibir entra em `KNOWN_BACKEND_MESSAGES_PT_BR`, nunca traduzida no componente.

## 10. Tenant se valida em três camadas

`@PreAuthorize` (papel) → `validateCompanyAccess` (empresa) → filtro na query. As três, sempre.
A query filtra pelo caminho direto (`company_id`), não derivando de relação.

## 11. O token diz quem é; o banco diz a que pertence

Identidade (`sub`, e-mail, nome) vem do ID token. **Vínculo** — empresa, papel efetivo, permissão —
vem do banco, por request: `TenantFilter` resolve pelo `sub` e o front lê de `GET /users/me`.

O ID token do Cognito **não carrega a empresa**: nenhum fluxo grava `custom:company_id`, e ler
esse claim devolve `undefined` sem erro nenhum. Um ADMIN abria "Novo Ponto de Gás" e o select de
contrato ficava vazio, calado, porque `currentCompanyId()` era nulo. O e2e não pegou: ele fabrica
o token com o claim.

Precisa do vínculo no cliente? Expõe no DTO e busca na API. Copiar para o token cria uma segunda
verdade que envelhece — é por isso que o backend já sobrescreve o papel do token com o do banco
(`updateSecurityContextWithRole`).

## 12. O teste que fica é o que falha se a lógica quebrar

Lógica não-trivial deixa **um** teste executável: o menor que quebra se a regra sumir. Nome no
padrão `should_ExpectedBehavior_When_Condition`. Bug corrigido ganha teste que reproduz o bug —
sem ele, a correção não durou.

---

## Contrato entre backend e frontend

| Assunto | Regra |
|---|---|
| Nome de rota | plural, kebab-case: `/api/v1/gas-points`, `/api/v1/cylinders` |
| Paginação | `page`, `pageSize`, `sortBy`, `sortOrder` |
| Filtro opcional | query param `required = false`; ausência = sem filtro |
| Erro | corpo tratado pelo `@ControllerAdvice`; o front lê com `extractApiErrorMessage` |
| Campo derivado | prefixo `effective…` ou nome próprio; nunca o nome do campo gravável |
| Booleano de estado | nome descreve o estado, não a negação (`connected`, não `disconnected`) |
| Data | ISO-8601 em UTC |

## O que NÃO simplificar

Validação em fronteira de confiança, isolamento multi-tenant, tratamento de erro que evita
perda de dado, acessibilidade básica, e qualquer coisa que o usuário pediu explicitamente.
