---
name: Java Patterns
description: SOLID principles and Clean Code patterns for Java
version: 1.0.0
---

# Java Patterns Skill

## Quando Usar

| Tarefa | Reference |
|--------|-----------|
| Aplicar SOLID principles | `references/solid.md` |
| Clean code practices | `references/clean-code.md` |

## Quick Reference

### Single Responsibility (S)
Cada classe tem UMA razao para mudar.

```java
// Separar concerns
class UserService { }     // Business logic
class EmailService { }    // Email sending
class AuditService { }    // Logging/audit
```

### Open/Closed (O)
Aberto para extensao, fechado para modificacao.

```java
interface AuthStrategy {
    AuthResponse authenticate(AuthRequest request);
}

class CognitoAuth implements AuthStrategy { }
class JwtAuth implements AuthStrategy { }
```

### Dependency Inversion (D)
Dependa de abstracoes, nao de implementacoes.

```java
// Service depende da interface
private final UserRepository repository;  // Interface

// Nao da implementacao concreta
// private final UserRepositoryImpl repository;  // ERRADO
```

## Clean Code Highlights

### Method Size
- Max 20 linhas
- Faz UMA coisa

### Naming
- Classes: substantivos (User, OrderService)
- Metodos: verbos (createUser, validateEmail)
- Variaveis: descritivos (customerOrder, not co)

### Comments
- Codigo auto-explicativo > comentarios
- Comente WHY, nao WHAT

**Para detalhes, leia a reference especifica.**
