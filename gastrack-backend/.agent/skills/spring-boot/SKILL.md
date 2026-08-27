---
name: Spring Boot
description: Patterns for Spring Boot REST APIs, services, JPA, security
version: 1.0.0
---

# Spring Boot Skill

## Quando Usar

| Tarefa | Reference |
|--------|-----------|
| Criar REST endpoints | `references/controllers.md` |
| Implementar services | `references/services.md` |
| Trabalhar com JPA | `references/repositories.md` |
| Configurar security | `references/security-cognito.md` |

## Quick Reference

### Controller Pattern
```java
@RestController
@RequestMapping("/api/v1/resource")
@RequiredArgsConstructor
public class ResourceController {
    private final ResourceService service;

    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody Request req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(req));
    }
}
```

### Service Pattern
```java
@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {
    private final ResourceRepository repository;
    private final ResourceMapper mapper;

    @Override
    @Transactional
    public Response create(Request request) {
        Entity entity = mapper.toEntity(request);
        return mapper.toResponse(repository.save(entity));
    }
}
```

### Repository Pattern
```java
public interface ResourceRepository extends JpaRepository<Entity, Long> {
    Optional<Entity> findByUniqueField(String field);
    List<Entity> findByStatus(Status status);
}
```

## Convencoes do Projeto

- Constructor injection (nunca field injection)
- `@Transactional` em services, nao controllers
- DTOs para API boundaries
- MapStruct para conversoes

**Para detalhes, leia a reference especifica.**
