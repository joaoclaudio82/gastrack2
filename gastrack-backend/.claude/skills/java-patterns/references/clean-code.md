# Clean Code Practices

## Naming

### Classes - Substantivos
```java
// BOM
User, OrderService, PaymentProcessor, EmailValidator

// RUIM
DoStuff, Manager, Helper, Data
```

### Methods - Verbos
```java
// BOM
createUser(), validateEmail(), calculateTotal(), isActive()

// RUIM
userData(), process(), doIt()
```

### Variables - Descritivas
```java
// BOM
int elapsedTimeInDays;
List<Customer> activeCustomers;
boolean isEligibleForDiscount;

// RUIM
int d;
List<Customer> list;
boolean flag;
```

### Booleans - Prefixos
```java
boolean isActive;
boolean hasPermission;
boolean canDelete;
boolean shouldNotify;
```

## Methods

### Tamanho
- **Max 20 linhas**
- Se maior, extraia metodos

### Uma Coisa
```java
// BOM - Faz uma coisa
public User findById(Long id) {
    return repository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}

// RUIM - Faz muitas coisas
public User findByIdAndNotify(Long id) {
    User user = repository.findById(id).orElseThrow();
    emailService.send(user.getEmail(), "You were looked up");
    auditService.log("User " + id + " accessed");
    return user;
}
```

### Parametros
- **Max 3 parametros**
- Mais? Use objeto

```java
// RUIM
void createUser(String name, String email, String phone, String address, int age)

// BOM
void createUser(CreateUserRequest request)
```

### Return Early
```java
// BOM - Return early
public double calculateDiscount(User user) {
    if (user == null) {
        return 0;
    }
    if (!user.isPremium()) {
        return 0;
    }
    return user.getPurchaseTotal() * 0.1;
}

// RUIM - Nested conditions
public double calculateDiscount(User user) {
    double discount = 0;
    if (user != null) {
        if (user.isPremium()) {
            discount = user.getPurchaseTotal() * 0.1;
        }
    }
    return discount;
}
```

## Comments

### Quando Comentar
- **WHY**, nunca WHAT
- Regras de negocio complexas
- Decisoes nao obvias

```java
// RUIM - Comenta o obvio
// Incrementa contador
counter++;

// BOM - Explica o porque
// Cognito requires username in email format for this user pool configuration
String username = user.getEmail();
```

### Quando NAO Comentar
```java
// RUIM - Codigo deve ser auto-explicativo
// Check if user is active
if (user.getStatus() == 1) { }

// BOM - Codigo auto-explicativo
if (user.isActive()) { }
```

## DRY - Don't Repeat Yourself

```java
// RUIM - Duplicacao
void validateUser(User user) {
    if (user.getEmail() == null || user.getEmail().isBlank()) {
        throw new ValidationException("Email required");
    }
}

void validateAdmin(Admin admin) {
    if (admin.getEmail() == null || admin.getEmail().isBlank()) {
        throw new ValidationException("Email required");
    }
}

// BOM - Extraido
void validateEmail(String email, String fieldName) {
    if (email == null || email.isBlank()) {
        throw new ValidationException(fieldName + " required");
    }
}
```

## Magic Numbers

```java
// RUIM
if (user.getAge() >= 18) { }
if (retryCount < 3) { }

// BOM
private static final int MINIMUM_AGE = 18;
private static final int MAX_RETRIES = 3;

if (user.getAge() >= MINIMUM_AGE) { }
if (retryCount < MAX_RETRIES) { }
```

## Error Handling

### Specific Exceptions
```java
// RUIM
throw new Exception("User not found");

// BOM
throw new UserNotFoundException(userId);
```

### Don't Return Null
```java
// RUIM
public User findById(Long id) {
    return repository.findById(id).orElse(null);
}

// BOM
public Optional<User> findById(Long id) {
    return repository.findById(id);
}

// Ou lance exception
public User findById(Long id) {
    return repository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}
```

## Code Smells to Avoid

1. **Long Methods** - Extraia em metodos menores
2. **Large Classes** - Separe responsabilidades
3. **Duplicate Code** - Extraia para metodos/classes
4. **Dead Code** - Delete codigo nao usado
5. **Comments Explaining Bad Code** - Reescreva o codigo
6. **Global State** - Use dependency injection
7. **Feature Envy** - Mova logica para classe apropriada
