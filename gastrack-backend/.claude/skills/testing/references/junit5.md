# JUnit 5 Testing

## Basic Test Structure

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class UserServiceTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        // Runs before each test
        userService = new UserService();
    }

    @AfterEach
    void tearDown() {
        // Runs after each test
    }

    @Test
    @DisplayName("Should return user when valid ID provided")
    void should_ReturnUser_When_ValidIdProvided() {
        // Test implementation
    }
}
```

## Assertions

### Basic Assertions
```java
// Equality
assertEquals(expected, actual);
assertEquals(expected, actual, "Custom message");

// Boolean
assertTrue(condition);
assertFalse(condition);

// Null
assertNull(object);
assertNotNull(object);

// Same instance
assertSame(expected, actual);
assertNotSame(expected, actual);
```

### Collection Assertions
```java
// Size
assertEquals(3, list.size());

// Contains
assertTrue(list.contains(element));

// Empty
assertTrue(list.isEmpty());

// Using AssertJ (recommended)
assertThat(list)
    .hasSize(3)
    .contains(element)
    .doesNotContain(other);
```

### Exception Assertions
```java
@Test
void should_ThrowException_When_UserNotFound() {
    // Assert exception is thrown
    UserNotFoundException exception = assertThrows(
        UserNotFoundException.class,
        () -> service.findById(999L)
    );

    // Verify exception message
    assertEquals("User not found with id: 999", exception.getMessage());
}

// Assert no exception
assertDoesNotThrow(() -> service.findById(1L));
```

## Controller Tests

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    void should_ReturnUser_When_ValidId() throws Exception {
        // Arrange
        UserResponse response = UserResponse.builder()
            .id(1L)
            .email("test@test.com")
            .build();
        when(userService.findById(1L)).thenReturn(response);

        // Act & Assert
        mockMvc.perform(get("/api/v1/users/1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.email").value("test@test.com"));
    }

    @Test
    void should_Return404_When_UserNotFound() throws Exception {
        when(userService.findById(999L))
            .thenThrow(new UserNotFoundException(999L));

        mockMvc.perform(get("/api/v1/users/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void should_CreateUser_When_ValidRequest() throws Exception {
        // Arrange
        CreateUserRequest request = new CreateUserRequest("test@test.com", "Test");
        UserResponse response = UserResponse.builder().id(1L).build();
        when(userService.create(any())).thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void should_Return400_When_InvalidRequest() throws Exception {
        CreateUserRequest request = new CreateUserRequest("", "");  // Invalid

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }
}
```

## Repository Tests

```java
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void should_FindUser_When_EmailExists() {
        // Arrange
        User user = User.builder()
            .email("test@test.com")
            .name("Test User")
            .cognitoSub("sub-123")
            .role(UserRole.USER)
            .build();
        entityManager.persistAndFlush(user);

        // Act
        Optional<User> found = userRepository.findByEmail("test@test.com");

        // Assert
        assertTrue(found.isPresent());
        assertEquals("test@test.com", found.get().getEmail());
    }

    @Test
    void should_ReturnEmpty_When_EmailNotExists() {
        Optional<User> found = userRepository.findByEmail("notfound@test.com");

        assertTrue(found.isEmpty());
    }
}
```

## Parameterized Tests

```java
@ParameterizedTest
@ValueSource(strings = {"", " ", "   "})
void should_ThrowException_When_BlankEmail(String email) {
    assertThrows(ValidationException.class,
        () -> validator.validateEmail(email));
}

@ParameterizedTest
@CsvSource({
    "test@test.com, true",
    "invalid-email, false",
    "'', false"
})
void should_ValidateEmail(String email, boolean expected) {
    assertEquals(expected, validator.isValidEmail(email));
}

@ParameterizedTest
@MethodSource("provideUsersForTest")
void should_ProcessUser(User user, boolean expectedResult) {
    assertEquals(expectedResult, service.process(user));
}

private static Stream<Arguments> provideUsersForTest() {
    return Stream.of(
        Arguments.of(activeUser(), true),
        Arguments.of(inactiveUser(), false)
    );
}
```

## Test Lifecycle

```java
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LifecycleTest {

    @BeforeAll
    void setUpOnce() {
        // Runs once before all tests
    }

    @BeforeEach
    void setUp() {
        // Runs before each test
    }

    @Test
    void test1() { }

    @Test
    void test2() { }

    @AfterEach
    void tearDown() {
        // Runs after each test
    }

    @AfterAll
    void tearDownOnce() {
        // Runs once after all tests
    }
}
```

## Conditional Tests

```java
@Test
@EnabledOnOs(OS.LINUX)
void should_RunOnlyOnLinux() { }

@Test
@DisabledIf("isProductionEnvironment")
void should_NotRunInProduction() { }

@Test
@EnabledIfEnvironmentVariable(named = "CI", matches = "true")
void should_RunOnlyInCI() { }
```
