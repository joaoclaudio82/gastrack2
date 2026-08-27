# Critérios de review

Cada área lê **sua** seção. As convenções completas estão em `gastrack-backend/CONVENTIONS.md` e
`gastrack-backend/ARCHITECTURE.md` — o agente lê de lá, isto aqui é o que direciona o olhar.

Todo item nasceu de um bug real. Quando algum deixar de fazer sentido, remova.

---

## dominio

Invariantes do domínio de gás. `ARCHITECTURE.md` §2 e §3.

- **Nível e pressão pertencem à linha, nunca ao cilindro.** Um sensor mede a saída combinada do
  manifold; a carga de um casco não é mensurável. DTO, tela ou cálculo que prometa "% do botijão"
  está inventando dado.
- **Valor derivado lido pelo método, não pela coluna.** `getEffectiveCapacityLiters()` e
  `getEffectiveFullTankPressureBar()`, não `getCapacityLiters()` — o campo cru é fallback.
- **`connected` ≠ `active`.** `active` = não aposentado do inventário. `connected` = válvula
  aberta. Só o conectado entra na soma de volume.
- **Gás único por linha.** Cilindros do mesmo manifold carregam o mesmo `GasType`. Todo caminho
  que cria ou move cilindro precisa passar pela validação — inclusive a troca de botijão.
- **Troca aposenta um casco, o informado.** Aposentar todos derruba um banco de 3 × 50 L para 50 L.
- Fórmula alterada? A conta bate com `ARCHITECTURE.md` §3 e tem teste com número explícito?

## persistencia

- **Migration não apaga dado.** Encontrou estado impeditivo → `RAISE EXCEPTION` com a query de
  diagnóstico. Coluna nova com `DEFAULT` que preserva o comportamento anterior.
- **Migration já aplicada não se edita.**
- **Fetch acompanha paginação.** `JOIN FETCH` de coleção com `Pageable` faz paginação em memória
  (`HHH000104`). Paginado usa `@BatchSize`.
- **`@BatchSize` na coleção não alcança os `@ManyToOne` de dentro dela.** Se a resposta lê campos
  do objeto apontado, a classe alvo também precisa da anotação.
- Consulta nova filtra por empresa? Índice acompanha a coluna que passou a ser filtrada?
- Entidade acessada fora de transação (job, thread) — a query traz o que vai ser lido?

## api

- **Entidade não vaza.** Toda entrada e saída em DTO; `@Valid` no `@RequestBody`.
- **Campo derivado não compartilha nome com campo gravável.** O formulário lê a resposta e a
  reenvia; nome igual faz o calculado sobrescrever o armazenado.
- **MapStruct: `expression` é sempre avaliada**, inclusive com o request omitindo o campo.
  `NullValuePropertyMappingStrategy.IGNORE` não a suprime. Em `updateEntity`, use
  `ignore = true` e decida no service.
- Campo novo na resposta quebra fixture de teste? Todas foram atualizadas com valor coerente,
  não só para compilar?
- Query param novo é `required = false` e ausência significa "sem filtro"?

## tenant

- **Três camadas, sempre:** `@PreAuthorize` (papel) → `validateCompanyAccess` (empresa) →
  filtro na query.
- **Filtro pelo caminho direto** (`company_id`), não derivando de relação.
- Papel novo alcança recurso global (`Equipment`, logs de ping)? Isso expõe hardware entre
  empresas — é decisão explícita ou descuido?
- Consulta ao DynamoDB respeita o piso de tempo da posse atual? ESP reaproveitado entre
  empresas não pode mostrar leitura da anterior.

## ingestao

- **Transação não envolve chamada de rede.** `@Transactional` num laço com HTTP segura conexão
  do pool. Pior: `@Transactional` interno que falha marca a externa como rollback-only, e o
  `catch` que "isola o item" vira ilusão — o commit final descarta tudo.
- **Timestamp de domínio em UTC dos dois lados** — quem grava e quem compara. `LocalDateTime.now()`
  puro depende do fuso da JVM e passa despercebido em container UTC.
- **A leitura só avança.** Dado mais velho que o persistido não sobrescreve.
- Falha de uma linha isola de verdade, ou derruba o ciclo?
- Filtro do DynamoDB é aplicado depois do `limit` — pedir 1 item pode devolver vazio.

## frontend

- `standalone`, `OnPush`, `inject()`. Sem `any` — `unknown` + narrowing.
- **Erro de API tipado**: `extractApiErrorMessage`, nunca `error.message` sobre `unknown`.
- **Regra de negócio não se duplica no cliente.** Faixa, limite e fórmula vêm da API.
- Componente usa o campo `effective…` para exibir, e o campo cru só no formulário de edição?
- Navegação passa parâmetro que a tela de destino realmente lê?
- Item de menu removido ou adicionado tem caminho alternativo coerente? Rota órfã sem link é
  funcionalidade invisível.
- Estado em signal; `computed` para derivado.

## testes

- **Bug corrigido tem teste que reproduz o bug.** Sem ele, a correção não durou.
- **Mock pode esconder constraint do banco.** `when(repo.save(any())).thenAnswer(...)` aceita
  entidade que o schema recusaria — quando a regra é `NOT NULL` ou `UNIQUE`, asserte o campo
  no captor.
- Fixture atualizada com valor **coerente**, não só para compilar. Fixture que usa relógio local
  onde a produção usa UTC esconde bug de fuso.
- Nome no padrão `should_ExpectedBehavior_When_Condition`.
- Teste novo falharia se a lógica fosse removida? Se passa dos dois jeitos, não testa nada.
