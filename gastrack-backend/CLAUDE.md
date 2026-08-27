# GasTrack Backend

Spring Boot 4 com autenticação AWS Cognito. Java 21, PostgreSQL, Flyway, DynamoDB para leituras.

> Antes de mexer em domínio, leia `ARCHITECTURE.md`. Regras que atravessam back e front estão
> em `CONVENTIONS.md` — este arquivo cobre só o que é específico do backend.

## Comandos

```bash
mvn spring-boot:run          # dev na porta 8080
mvn test                     # suíte completa
mvn test jacoco:report       # cobertura em target/site/jacoco/
mvn verify                   # testes + verificação de cobertura
mvn clean package            # JAR
```

Swagger em http://localhost:8080/swagger-ui.html

## Estrutura

Pacote raiz: **`com.gastrack`**.

```
src/main/java/com/gastrack/
├── configuration/    # SecurityConfiguration, Swagger, JPA, DynamoDb, Scheduling, thresholds
├── controller/       # REST em /api/v1/* e /auth/*
├── dto/              # records de request/response, por domínio
├── exceptions/       # GlobalExceptionHandler (@ControllerAdvice)
├── mapper/           # MapStruct — interface, ou classe abstrata quando precisa injetar
├── model/            # entidades JPA
├── repository/       # Spring Data JPA + repository/dynamodb/
├── security/cognito/ # filtro JWT, CognitoService
├── service/          # interface + impl/, mais policies de domínio
└── utils/            # constantes, acesso a mensagens
```

## Estilo

### Injeção
```java
@Service
@RequiredArgsConstructor   // construtor, obrigatório
public class CylinderServiceImpl {
    private final CylinderRepository repo;   // nunca @Autowired em campo
}
```

### Transações
- `@Transactional` em **service**, nunca em controller
- `@Transactional(readOnly = true)` para consulta
- **Nunca** em volta de laço que faz chamada de rede — ver `CONVENTIONS.md` §4

### DTOs
- Toda entrada e saída de API passa por DTO; entidade não vaza
- `@Valid` no `@RequestBody`
- MapStruct para conversão — atenção ao §6 do `CONVENTIONS.md` sobre `expression`

### Policies de domínio
Invariante compartilhada por mais de um service vira componente em `service/`, injetado por
quem precisa. Exemplo: `GasLinePolicy` (gás único por manifold).

## Testes — TDD é obrigatório

Ciclo **RED → GREEN → REFACTOR**. Nome no padrão:

```java
void should_ExpectedBehavior_When_Condition()
void should_ThrowException_When_UserNotFound()
```

| Anotação | Uso |
|---|---|
| `@ExtendWith(MockitoExtension.class)` | services |
| `@WebMvcTest` | controllers |
| `@SpringBootTest` + `@ActiveProfiles("test")` | repositories e integração |

Cobertura mínima de 80% em código novo (JaCoCo verifica).

**Cuidado com mock que esconde constraint.** `when(repo.save(any())).thenAnswer(...)` aceita
entidade que o banco recusaria. Quando a regra é do schema (`NOT NULL`, `UNIQUE`), asserte o
campo no captor — foi assim que um insert quebrado passou verde.

## Migrations

- Uma migration nova para cada mudança; **nunca** editar as já aplicadas
- Não apaga dado: aborta com `RAISE EXCEPTION` e a query de diagnóstico — `CONVENTIONS.md` §7
- Numeração sequencial em `src/main/resources/db/migration/`

## Segurança

- `@PreAuthorize` no controller, `TenantSecurityService.validateCompanyAccess` no service,
  filtro por empresa na query. As três camadas, sempre.
- `Equipment` e logs de ping são **globais** — não filtrados por tenant, por decisão
- Nunca comitar `.env`, credencial ou ID de pool

## Job de sincronização

`GasPointReadingSyncJob` traz a última leitura do DynamoDB para a linha de gás a cada 60s.
Desligável por `gastrack.reading-sync.enabled` (falso nos testes). Detalhes em
`ARCHITECTURE.md` §4.

## Skills disponíveis

Em `.claude/skills/`:

| Skill | Para quê |
|---|---|
| `gastrack-review` | Review multiagente de mudanças, backend e frontend |
| `spring-boot` | Controllers, services, repositories, segurança |
| `java-patterns` | SOLID e clean code |
| `testing` | JUnit 5, Mockito, fluxo TDD |
| `deploy` | Deploy manual por SSH |
| `debug-prod` | Logs, banco e containers em produção |

## Nunca

- Editar migration já aplicada
- Expor entidade em resposta de API
- Injeção em campo
- Pular o ciclo TDD
- Comitar segredo
