# SOLID Principles

## S - Single Responsibility Principle

> Cada classe deve ter apenas UMA razao para mudar.

### Problema
```java
// RUIM - Multiplas responsabilidades
public class UserService {
    public void saveUser(User user) { }
    public void sendWelcomeEmail(User user) { }  // Email concern
    public void logUserActivity(User user) { }   // Audit concern
    public void validateUserData(User user) { }  // Validation concern
}
```

### Solucao
```java
// BOM - Responsabilidades separadas
public class UserService {
    private final EmailService emailService;
    private final AuditService auditService;
    private final UserValidator validator;

    public void saveUser(User user) {
        validator.validate(user);
        repository.save(user);
        emailService.sendWelcome(user);
        auditService.log("User created: " + user.getId());
    }
}

public class EmailService {
    public void sendWelcome(User user) { }
}

public class AuditService {
    public void log(String message) { }
}
```

## O - Open/Closed Principle

> Aberto para extensao, fechado para modificacao.

### Problema
```java
// RUIM - Precisa modificar para adicionar novo tipo
public class PaymentProcessor {
    public void process(Payment payment) {
        if (payment.getType().equals("CREDIT_CARD")) {
            processCreditCard(payment);
        } else if (payment.getType().equals("PIX")) {
            processPix(payment);
        } else if (payment.getType().equals("BOLETO")) {
            // Precisa modificar classe existente!
            processBoleto(payment);
        }
    }
}
```

### Solucao
```java
// BOM - Extensivel via novas implementacoes
public interface PaymentProcessor {
    void process(Payment payment);
    PaymentType getSupportedType();
}

@Service
public class CreditCardProcessor implements PaymentProcessor {
    public void process(Payment payment) { /* ... */ }
    public PaymentType getSupportedType() { return PaymentType.CREDIT_CARD; }
}

@Service
public class PixProcessor implements PaymentProcessor {
    public void process(Payment payment) { /* ... */ }
    public PaymentType getSupportedType() { return PaymentType.PIX; }
}

// Nova implementacao sem modificar codigo existente
@Service
public class BoletoProcessor implements PaymentProcessor {
    public void process(Payment payment) { /* ... */ }
    public PaymentType getSupportedType() { return PaymentType.BOLETO; }
}
```

## L - Liskov Substitution Principle

> Subtipos devem ser substituiveis por seus tipos base.

### Problema
```java
// RUIM - Quadrado nao se comporta como Retangulo
public class Rectangle {
    protected int width, height;

    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int getArea() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w) {
        this.width = w;
        this.height = w;  // Quebra expectativa!
    }
}
```

### Solucao
```java
// BOM - Abstracoes corretas
public interface Shape {
    int getArea();
}

public class Rectangle implements Shape {
    private final int width, height;
    public Rectangle(int w, int h) { this.width = w; this.height = h; }
    public int getArea() { return width * height; }
}

public class Square implements Shape {
    private final int side;
    public Square(int s) { this.side = s; }
    public int getArea() { return side * side; }
}
```

## I - Interface Segregation Principle

> Muitas interfaces especificas > uma interface generica.

### Problema
```java
// RUIM - Interface muito grande
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
}

// Robo nao come nem dorme!
public class Robot implements Worker {
    public void work() { /* ok */ }
    public void eat() { /* ??? */ }
    public void sleep() { /* ??? */ }
}
```

### Solucao
```java
// BOM - Interfaces segregadas
public interface Workable {
    void work();
}

public interface Feedable {
    void eat();
}

public interface Restable {
    void sleep();
}

public class Human implements Workable, Feedable, Restable {
    public void work() { }
    public void eat() { }
    public void sleep() { }
}

public class Robot implements Workable {
    public void work() { }  // So implementa o que faz sentido
}
```

## D - Dependency Inversion Principle

> Dependa de abstracoes, nao de implementacoes concretas.

### Problema
```java
// RUIM - Depende de classe concreta
public class OrderService {
    private final MySqlDatabase database;  // Acoplado ao MySQL!

    public OrderService() {
        this.database = new MySqlDatabase();
    }
}
```

### Solucao
```java
// BOM - Depende de abstracao
public class OrderService {
    private final OrderRepository repository;  // Interface

    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }
}

// Implementacoes podem variar
public interface OrderRepository extends JpaRepository<Order, Long> { }

// Em testes, pode usar mock
// Em producao, Spring injeta implementacao JPA
```
