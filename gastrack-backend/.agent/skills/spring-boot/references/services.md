# Spring Boot Services

## Interface + Implementation Pattern

### Interface
```java
public interface UserService {
    UserResponse findById(Long id);
    PageResponse<UserResponse> findAll(Pageable pageable);
    UserResponse create(CreateUserRequest request);
    UserResponse update(Long id, UpdateUserRequest request);
    void delete(Long id);
}
```

### Implementation
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        log.debug("Finding user by id: {}", id);
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findAll(Pageable pageable) {
        log.debug("Finding all users with pageable: {}", pageable);
        Page<User> page = userRepository.findAll(pageable);
        return PageResponse.<UserResponse>builder()
            .content(page.map(userMapper::toResponse).getContent())
            .pageNumber(page.getNumber())
            .pageSize(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .build();
    }

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        log.info("Creating user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        User user = userMapper.toEntity(request);
        User saved = userRepository.save(user);

        log.info("User created with id: {}", saved.getId());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        log.info("Updating user: {}", id);

        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));

        userMapper.updateEntity(request, user);
        User updated = userRepository.save(user);

        return userMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Deleting user: {}", id);

        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }

        userRepository.deleteById(id);
    }
}
```

## Transactions

### Regras
- `@Transactional` em services, NUNCA em controllers
- `@Transactional(readOnly = true)` para queries (performance)
- Default: rollback em RuntimeException

### Exemplos
```java
// Read-only query
@Transactional(readOnly = true)
public UserResponse findById(Long id) { }

// Write operation
@Transactional
public UserResponse create(CreateUserRequest request) { }

// Custom rollback
@Transactional(rollbackFor = Exception.class)
public void riskyOperation() { }

// No rollback for specific exception
@Transactional(noRollbackFor = EmailException.class)
public void sendAndSave() { }
```

## Validation in Service

```java
@Override
@Transactional
public UserResponse create(CreateUserRequest request) {
    // Business validation
    validateEmailUniqueness(request.getEmail());
    validatePasswordStrength(request.getPassword());

    // Create entity
    User user = userMapper.toEntity(request);
    return userMapper.toResponse(userRepository.save(user));
}

private void validateEmailUniqueness(String email) {
    if (userRepository.existsByEmail(email)) {
        throw new UserAlreadyExistsException(email);
    }
}
```

## Exception Handling

```java
// Custom exception
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long id) {
        super("User not found with id: " + id);
    }
}

// Usage in service
public UserResponse findById(Long id) {
    return userRepository.findById(id)
        .map(userMapper::toResponse)
        .orElseThrow(() -> new UserNotFoundException(id));
}
```

## Logging Best Practices

```java
@Slf4j
@Service
public class UserServiceImpl {

    public UserResponse create(CreateUserRequest request) {
        log.info("Creating user with email: {}", request.getEmail());
        // ...
        log.info("User created with id: {}", saved.getId());
        return response;
    }

    public UserResponse findById(Long id) {
        log.debug("Finding user by id: {}", id);  // Debug for reads
        // ...
    }
}
```

## Regras

1. Sempre use interface + implementation
2. `@Transactional` em todos os metodos publicos
3. `readOnly = true` para queries
4. Valide regras de negocio no service
5. Log operacoes importantes (info) e debug para reads
