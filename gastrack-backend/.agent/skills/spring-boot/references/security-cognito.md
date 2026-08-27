# AWS Cognito Security Integration

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client App    │ --> │  GasTrack API   │ --> │  AWS Cognito    │
│                 │     │                 │     │                 │
│ 1. Login        │     │ 2. Validate JWT │     │ 3. User Pool    │
│ 4. Access Token │ <-- │                 │ <-- │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Configuration

### CognitoProperties
```java
@ConfigurationProperties(prefix = "aws.cognito")
@Validated
@Getter @Setter
public class CognitoProperties {

    @NotBlank
    private String region;

    @NotBlank
    private String userPoolId;

    @NotBlank
    private String clientId;

    private String clientSecret;

    public String getJwkSetUri() {
        return String.format(
            "https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json",
            region, userPoolId
        );
    }

    public String getIssuerUri() {
        return String.format(
            "https://cognito-idp.%s.amazonaws.com/%s",
            region, userPoolId
        );
    }
}
```

### application.yml
```yaml
aws:
  cognito:
    region: ${AWS_COGNITO_REGION:us-east-1}
    user-pool-id: ${AWS_COGNITO_USER_POOL_ID}
    client-id: ${AWS_COGNITO_CLIENT_ID}
    client-secret: ${AWS_COGNITO_CLIENT_SECRET:}
```

## Security Configuration

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final CognitoJwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

## JWT Authentication Filter

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class CognitoJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtDecoder;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null) {
            try {
                Jwt jwt = jwtDecoder.decode(token);
                Authentication auth = createAuthentication(jwt);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (JwtException e) {
                log.warn("Invalid JWT token: {}", e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
```

## CognitoService

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CognitoService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final CognitoProperties properties;

    public CognitoAuthResponse login(CognitoLoginRequest request) {
        try {
            InitiateAuthResponse response = cognitoClient.initiateAuth(
                InitiateAuthRequest.builder()
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .clientId(properties.getClientId())
                    .authParameters(Map.of(
                        "USERNAME", request.getUsername(),
                        "PASSWORD", request.getPassword(),
                        "SECRET_HASH", calculateSecretHash(request.getUsername())
                    ))
                    .build()
            );

            return mapToAuthResponse(response.authenticationResult());
        } catch (NotAuthorizedException e) {
            throw new CognitoAuthException("Invalid credentials");
        }
    }

    public CognitoSignUpResponse signUp(CognitoSignUpRequest request) {
        SignUpResponse response = cognitoClient.signUp(
            SignUpRequest.builder()
                .clientId(properties.getClientId())
                .username(request.getUsername())
                .password(request.getPassword())
                .secretHash(calculateSecretHash(request.getUsername()))
                .userAttributes(
                    AttributeType.builder().name("email").value(request.getEmail()).build(),
                    AttributeType.builder().name("name").value(request.getName()).build()
                )
                .build()
        );

        return CognitoSignUpResponse.builder()
            .userSub(response.userSub())
            .confirmed(response.userConfirmed())
            .build();
    }

    public CognitoAuthResponse refreshToken(String refreshToken) {
        InitiateAuthResponse response = cognitoClient.initiateAuth(
            InitiateAuthRequest.builder()
                .authFlow(AuthFlowType.REFRESH_TOKEN_AUTH)
                .clientId(properties.getClientId())
                .authParameters(Map.of("REFRESH_TOKEN", refreshToken))
                .build()
        );

        return mapToAuthResponse(response.authenticationResult());
    }
}
```

## Auth Controller

```java
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class CognitoAuthController {

    private final CognitoService cognitoService;

    @PostMapping("/signup")
    public ResponseEntity<CognitoSignUpResponse> signUp(
            @Valid @RequestBody CognitoSignUpRequest request) {
        return ResponseEntity.ok(cognitoService.signUp(request));
    }

    @PostMapping("/login")
    public ResponseEntity<CognitoAuthResponse> login(
            @Valid @RequestBody CognitoLoginRequest request) {
        return ResponseEntity.ok(cognitoService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<CognitoAuthResponse> refresh(
            @Valid @RequestBody CognitoRefreshRequest request) {
        return ResponseEntity.ok(cognitoService.refreshToken(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        cognitoService.logout();
        return ResponseEntity.ok().build();
    }
}
```

## Testing

```java
@WebMvcTest(CognitoAuthController.class)
class CognitoAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CognitoService cognitoService;

    @Test
    void should_ReturnAuthResponse_When_ValidLogin() throws Exception {
        CognitoAuthResponse response = CognitoAuthResponse.builder()
            .accessToken("token")
            .expiresIn(3600)
            .build();

        when(cognitoService.login(any())).thenReturn(response);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username": "test@test.com", "password": "Pass123!"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("token"));
    }
}
```
