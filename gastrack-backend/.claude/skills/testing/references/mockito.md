# Mockito Testing

## Setup

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    // Tests...
}
```

## Creating Mocks

### Annotation-based
```java
@Mock
private UserRepository repository;

@Spy
private UserValidator validator;  // Real object with spy capabilities

@InjectMocks
private UserService service;  // Mocks injected automatically
```

### Programmatic
```java
UserRepository repository = mock(UserRepository.class);
UserValidator validator = spy(new UserValidator());
```

## Stubbing (when/thenReturn)

### Basic Stubbing
```java
// Return value
when(repository.findById(1L)).thenReturn(Optional.of(user));

// Return empty
when(repository.findById(999L)).thenReturn(Optional.empty());

// Return for any argument
when(repository.save(any(User.class))).thenReturn(savedUser);

// Throw exception
when(repository.findById(999L))
    .thenThrow(new UserNotFoundException(999L));

// Multiple calls - different returns
when(repository.count())
    .thenReturn(1L)
    .thenReturn(2L)
    .thenReturn(3L);
```

### Argument Matchers
```java
// Any value
when(service.findById(anyLong())).thenReturn(user);

// Any object of type
when(repository.save(any(User.class))).thenReturn(user);

// Specific values
when(repository.findByEmail(eq("test@test.com"))).thenReturn(Optional.of(user));

// Custom matcher
when(repository.findByEmail(argThat(email -> email.contains("@"))))
    .thenReturn(Optional.of(user));
```

### Void Methods
```java
// Do nothing (default)
doNothing().when(repository).delete(any());

// Throw exception
doThrow(new RuntimeException()).when(repository).delete(any());

// Call real method
doCallRealMethod().when(spy).someMethod();
```

## Verification

### Basic Verification
```java
// Was called
verify(repository).save(any(User.class));

// Was called with specific argument
verify(repository).save(argThat(user ->
    user.getEmail().equals("test@test.com")));

// Was called N times
verify(repository, times(2)).findById(anyLong());

// Was never called
verify(repository, never()).delete(any());

// At least/at most
verify(repository, atLeastOnce()).findById(anyLong());
verify(repository, atMost(3)).findById(anyLong());
```

### Verification Order
```java
InOrder inOrder = inOrder(repository, mapper);
inOrder.verify(repository).findById(1L);
inOrder.verify(mapper).toResponse(any());
```

### Capturing Arguments
```java
@Captor
ArgumentCaptor<User> userCaptor;

@Test
void should_SaveUserWithCorrectData() {
    // Act
    service.create(request);

    // Capture
    verify(repository).save(userCaptor.capture());

    // Assert captured value
    User captured = userCaptor.getValue();
    assertEquals("test@test.com", captured.getEmail());
}
```

## Service Test Example

```java
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private UserResponse testResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .email("test@test.com")
            .name("Test User")
            .build();

        testResponse = UserResponse.builder()
            .id(1L)
            .email("test@test.com")
            .build();
    }

    @Test
    void should_ReturnUser_When_ValidIdProvided() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userMapper.toResponse(testUser)).thenReturn(testResponse);

        // Act
        UserResponse result = userService.findById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("test@test.com", result.getEmail());

        verify(userRepository).findById(1L);
        verify(userMapper).toResponse(testUser);
    }

    @Test
    void should_ThrowException_When_UserNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UserNotFoundException.class,
            () -> userService.findById(999L));

        verify(userRepository).findById(999L);
        verify(userMapper, never()).toResponse(any());
    }

    @Test
    void should_CreateUser_When_ValidRequest() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest("new@test.com", "New User");

        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userMapper.toEntity(request)).thenReturn(testUser);
        when(userRepository.save(testUser)).thenReturn(testUser);
        when(userMapper.toResponse(testUser)).thenReturn(testResponse);

        // Act
        UserResponse result = userService.create(request);

        // Assert
        assertNotNull(result);
        verify(userRepository).existsByEmail("new@test.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void should_ThrowException_When_EmailAlreadyExists() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest("existing@test.com", "User");
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        // Act & Assert
        assertThrows(UserAlreadyExistsException.class,
            () -> userService.create(request));

        verify(userRepository).existsByEmail("existing@test.com");
        verify(userRepository, never()).save(any());
    }
}
```

## Best Practices

1. **Mock apenas dependencias** - nao mock o objeto sendo testado
2. **Nao over-mock** - se precisa mockar muita coisa, repense o design
3. **Verifique interacoes importantes** - nao tudo
4. **Use `@InjectMocks`** - deixe Mockito injetar os mocks
5. **Prefira `when/thenReturn`** - mais legivel que `doReturn/when`
6. **Use argument captors** - quando precisa verificar argumentos complexos
