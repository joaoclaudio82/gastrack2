---
name: java-patterns
description: SOLID principles and Clean Code practices for Java. Use when designing classes, refactoring code, or reviewing architecture decisions.
---

# Java Patterns Skill

## SOLID Quick Reference

### S - Single Responsibility
Each class has ONE reason to change.
```java
// Separate concerns
class UserService { }     // Business logic
class EmailService { }    // Email sending
class AuditService { }    // Logging/audit
```

### O - Open/Closed
Open for extension, closed for modification.
```java
interface PaymentProcessor {
    void process(Payment payment);
}
class CreditCardProcessor implements PaymentProcessor { }
class PixProcessor implements PaymentProcessor { }
```

### D - Dependency Inversion
Depend on abstractions, not implementations.
```java
private final UserRepository repository;  // Interface, not impl
```

## Clean Code Quick Reference

### Naming
- Classes: nouns (`User`, `OrderService`)
- Methods: verbs (`createUser`, `validateEmail`)
- Booleans: `isActive`, `hasPermission`, `canDelete`

### Methods
- Max 20 lines
- Max 3 parameters (use object for more)
- Do ONE thing

### Comments
- Code should be self-documenting
- Comment WHY, not WHAT

## Detailed References

| Topic | Reference |
|-------|-----------|
| SOLID principles with examples | [references/solid.md](references/solid.md) |
| Clean code practices | [references/clean-code.md](references/clean-code.md) |
