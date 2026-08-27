---
name: testing
description: JUnit 5, Mockito, and TDD practices for Spring Boot. Use when writing tests, setting up mocks, or following test-driven development workflow.
---

# Testing Skill

## TDD Cycle

```
RED → GREEN → REFACTOR → repeat
```

1. **RED**: Write failing test
2. **GREEN**: Minimum code to pass
3. **REFACTOR**: Improve while green

## Test Naming Convention

```java
void should_ExpectedBehavior_When_Condition()

// Examples
void should_ReturnUser_When_ValidIdProvided()
void should_ThrowException_When_UserNotFound()
void should_CreateUser_When_ValidRequest()
```

## Test Structure (AAA)

```java
@Test
void should_CreateUser_When_ValidRequest() {
    // Arrange
    CreateUserRequest request = new CreateUserRequest("test@test.com");
    when(repository.save(any())).thenReturn(testUser);

    // Act
    UserResponse result = service.create(request);

    // Assert
    assertNotNull(result);
    assertEquals("test@test.com", result.getEmail());
}
```

## Annotations Quick Reference

| Annotation | Use For |
|------------|---------|
| `@WebMvcTest(Controller.class)` | Controller tests |
| `@DataJpaTest` | Repository tests |
| `@ExtendWith(MockitoExtension.class)` | Service unit tests |
| `@SpringBootTest` | Integration tests |

## Coverage

- **80%+** on new code (JaCoCo enforced)
- Excluded: DTOs, configs, models, utils, mappers

## Detailed References

| Topic | Reference |
|-------|-----------|
| JUnit 5 assertions, parameterized tests | [references/junit5.md](references/junit5.md) |
| Mockito mocks, stubs, verification | [references/mockito.md](references/mockito.md) |
