---
name: spring-boot
description: Patterns for Spring Boot REST APIs, services, JPA repositories, and AWS Cognito security. Use when implementing controllers, services, database operations, or authentication features.
---

# Spring Boot Skill

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
}
```

## Detailed References

| Task | Reference |
|------|-----------|
| REST endpoints, validation, pagination | [references/controllers.md](references/controllers.md) |
| Business logic, transactions, exceptions | [references/services.md](references/services.md) |
| JPA queries, entities, relationships | [references/repositories.md](references/repositories.md) |
| AWS Cognito JWT authentication | [references/security-cognito.md](references/security-cognito.md) |

## Project Conventions

- Constructor injection only (never field injection)
- `@Transactional` on services, not controllers
- DTOs for API boundaries (never expose entities)
- MapStruct for entity/DTO conversions
