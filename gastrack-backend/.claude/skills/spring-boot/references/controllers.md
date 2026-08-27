# Spring Boot Controllers

## Estrutura Basica

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all users")
    public ResponseEntity<PageResponse<UserResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
            userService.findAll(PageRequest.of(page, size))
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create new user")
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user")
    public ResponseEntity<UserResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

## Validacao de Input

```java
@Getter @Setter
public class CreateUserRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 chars")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Role is required")
    private UserRole role;
}
```

## Response Status Codes

| Status | Quando Usar |
|--------|-------------|
| `200 OK` | GET, PUT, PATCH sucesso |
| `201 Created` | POST sucesso |
| `204 No Content` | DELETE sucesso |
| `400 Bad Request` | Validacao falhou |
| `401 Unauthorized` | Nao autenticado |
| `403 Forbidden` | Sem permissao |
| `404 Not Found` | Recurso nao encontrado |
| `409 Conflict` | Recurso ja existe |

## Paginacao

```java
@GetMapping
public ResponseEntity<PageResponse<UserResponse>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "DESC") Sort.Direction direction) {

    Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
    return ResponseEntity.ok(userService.findAll(pageable));
}
```

## Path Variables vs Query Params

```java
// Path variable - identificador do recurso
@GetMapping("/{id}")
public ResponseEntity<User> findById(@PathVariable Long id)

// Query params - filtros e opcoes
@GetMapping
public ResponseEntity<List<User>> search(
    @RequestParam(required = false) String name,
    @RequestParam(required = false) UserRole role)
```

## Swagger/OpenAPI Annotations

```java
@Operation(
    summary = "Create user",
    description = "Creates a new user in the system"
)
@ApiResponses({
    @ApiResponse(responseCode = "201", description = "User created"),
    @ApiResponse(responseCode = "400", description = "Invalid request"),
    @ApiResponse(responseCode = "409", description = "User already exists")
})
@PostMapping
public ResponseEntity<UserResponse> create(...)
```

## Regras

1. **Nunca** coloque logica de negocio no controller
2. **Sempre** use `@Valid` em `@RequestBody`
3. **Sempre** retorne `ResponseEntity<T>`
4. **Nunca** exponha entidades diretamente (use DTOs)
5. **Sempre** documente com Swagger annotations
