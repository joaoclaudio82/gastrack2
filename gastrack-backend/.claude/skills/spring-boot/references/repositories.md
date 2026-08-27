# Spring Data JPA Repositories

## Interface Basica

```java
public interface UserRepository extends JpaRepository<User, Long> {

    // Derived query methods
    Optional<User> findByEmail(String email);
    Optional<User> findByCognitoSub(String cognitoSub);
    List<User> findByRole(UserRole role);
    boolean existsByEmail(String email);

    // Query with multiple conditions
    List<User> findByRoleAndActiveTrue(UserRole role);
}
```

## Entity Example

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_cognito_sub", columnList = "cognito_sub", unique = true)
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cognito_sub", unique = true, nullable = false, length = 36)
    private String cognitoSub;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Column(nullable = false)
    private boolean active = true;
}
```

## Custom Queries

### JPQL
```java
@Query("SELECT u FROM User u WHERE u.role = :role AND u.active = true")
List<User> findActiveUsersByRole(@Param("role") UserRole role);

@Query("SELECT u FROM User u WHERE u.email LIKE %:domain%")
List<User> findByEmailDomain(@Param("domain") String domain);
```

### Native SQL
```java
@Query(value = "SELECT * FROM users WHERE created_at > :date", nativeQuery = true)
List<User> findRecentUsers(@Param("date") LocalDateTime date);
```

### Modifying Queries
```java
@Modifying
@Query("UPDATE User u SET u.active = false WHERE u.id = :id")
int deactivateUser(@Param("id") Long id);

@Modifying
@Query("DELETE FROM User u WHERE u.active = false AND u.updatedAt < :date")
int deleteInactiveUsersBefore(@Param("date") LocalDateTime date);
```

## Pagination

```java
// In repository
Page<User> findByRole(UserRole role, Pageable pageable);

// In service
public PageResponse<UserResponse> findByRole(UserRole role, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<User> users = userRepository.findByRole(role, pageable);
    return pageMapper.toResponse(users.map(userMapper::toResponse));
}
```

## Specifications (Dynamic Queries)

```java
public interface UserRepository extends JpaRepository<User, Long>,
                                        JpaSpecificationExecutor<User> { }

// Usage
public List<User> search(UserSearchCriteria criteria) {
    return userRepository.findAll((root, query, cb) -> {
        List<Predicate> predicates = new ArrayList<>();

        if (criteria.getName() != null) {
            predicates.add(cb.like(root.get("name"), "%" + criteria.getName() + "%"));
        }
        if (criteria.getRole() != null) {
            predicates.add(cb.equal(root.get("role"), criteria.getRole()));
        }
        if (criteria.getActive() != null) {
            predicates.add(cb.equal(root.get("active"), criteria.getActive()));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    });
}
```

## Relationships

### ManyToOne
```java
@Entity
public class Order {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
```

### OneToMany
```java
@Entity
public class User {
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();
}
```

## Best Practices

1. **Sempre** use `FetchType.LAZY` para relacionamentos
2. **Evite** N+1 queries - use `@EntityGraph` ou `JOIN FETCH`
3. **Crie indices** para colunas usadas em WHERE frequentemente
4. **Use** `existsBy*` ao inves de `findBy*` para verificacoes
5. **Prefira** derived queries para queries simples
