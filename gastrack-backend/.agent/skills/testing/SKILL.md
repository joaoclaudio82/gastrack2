---
name: Testing
description: JUnit 5, Mockito, and TDD practices for Spring Boot
version: 1.0.0
---

# Testing Skill

## Quando Usar

| Tarefa | Reference |
|--------|-----------|
| Escrever testes JUnit 5 | `references/junit5.md` |
| Usar Mockito para mocks | `references/mockito.md` |

## Quick Reference

### Test Naming
```java
void should_ExpectedBehavior_When_Condition()

// Exemplos
void should_ReturnUser_When_ValidIdProvided()
void should_ThrowException_When_UserNotFound()
void should_CreateUser_When_ValidRequest()
```

### Test Structure (AAA)
```java
@Test
void should_CreateUser_When_ValidRequest() {
    // Arrange - Setup data and mocks
    CreateUserRequest request = new CreateUserRequest("test@test.com");
    when(repository.save(any())).thenReturn(testUser);

    // Act - Execute
    UserResponse result = service.create(request);

    // Assert - Verify
    assertNotNull(result);
    assertEquals("test@test.com", result.getEmail());
}
```

### Test Annotations

| Annotation | Uso |
|------------|-----|
| `@WebMvcTest` | Controllers |
| `@DataJpaTest` | Repositories |
| `@ExtendWith(MockitoExtension.class)` | Services (unit) |
| `@SpringBootTest` | Integration |

## Coverage Requirements

- **80%+** em codigo novo
- Verificar: `mvn test jacoco:report`

## TDD Cycle

1. **RED**: Escreva teste que falha
2. **GREEN**: Codigo minimo para passar
3. **REFACTOR**: Melhore mantendo verde

**Para detalhes, leia a reference especifica.**
