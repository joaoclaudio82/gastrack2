# Testes Unitários - AWS Cognito Integration

## Resumo

Este documento descreve os testes unitários completos criados para o módulo de integração com AWS Cognito do projeto Spring Boot.

## Estatísticas

- **Total de Testes**: 69
- **Taxa de Sucesso**: 100%
- **Classes Testadas**: 4
- **Tempo de Execução**: ~4 segundos

## Arquivos de Teste Criados

### 1. CognitoServiceTest (18 testes)

**Localização**: `/src/test/java/com/gastrack/security/cognito/CognitoServiceTest.java`

**Descrição**: Testes para a classe `CognitoService` que gerencia operações com AWS Cognito.

**Abordagem**:
- Usa JUnit 5 com `@ExtendWith(MockitoExtension.class)`
- Testa a construção e validação de DTOs
- Foca em testar as estruturas de dados e a inicialização do serviço

**Testes Implementados**:
- ✅ `should_CreateCognitoService_When_PropertiesProvided`
- ✅ `should_HaveCorrectProperties_When_ServiceCreated`
- ✅ `should_BuildValidSignUpRequest_When_ValidDataProvided`
- ✅ `should_BuildValidLoginRequest_When_ValidCredentialsProvided`
- ✅ `should_BuildValidConfirmRequest_When_ValidCodeProvided`
- ✅ `should_BuildValidRefreshRequest_When_ValidTokenProvided`
- ✅ `should_BuildValidResetPasswordRequest_When_ValidDataProvided`
- ✅ `should_BuildSignUpResponse_When_ValidDataProvided`
- ✅ `should_BuildConfirmResponse_When_ValidDataProvided`
- ✅ `should_BuildAuthResponse_When_ValidTokensProvided`
- ✅ `should_ValidateRequestFields_When_BuildingSignUpRequest`
- ✅ `should_ValidateRequestFields_When_BuildingLoginRequest`
- ✅ `should_ValidateRequestFields_When_BuildingConfirmRequest`
- ✅ `should_ValidateRequestFields_When_BuildingRefreshRequest`
- ✅ `should_ValidateRequestFields_When_BuildingResetPasswordRequest`
- ✅ `should_UseBuilderPattern_When_CreatingRequests`
- ✅ `should_AllowEmptyConstructor_When_CreatingDTOs`
- ✅ `should_AllowSetters_When_CreatingDTOs`

---

### 2. CognitoAuthControllerTest (18 testes)

**Localização**: `/src/test/java/com/gastrack/security/cognito/CognitoAuthControllerTest.java`

**Descrição**: Testes para o controller REST `CognitoAuthController` que expõe endpoints de autenticação.

**Abordagem**:
- Usa MockMvc standalone com `@ExtendWith(MockitoExtension.class)`
- Testa todos os endpoints HTTP
- Valida requests, responses e códigos de status HTTP
- Testa validações de Bean Validation

**Testes Implementados**:
- ✅ `should_Return200AndSignUpResponse_When_ValidSignUpRequest`
- ✅ `should_Return400_When_SignUpRequestMissingUsername`
- ✅ `should_Return400_When_SignUpRequestInvalidEmail`
- ✅ `should_Return400_When_SignUpRequestPasswordTooShort`
- ✅ `should_Return200AndConfirmResponse_When_ValidConfirmRequest`
- ✅ `should_Return400_When_ConfirmRequestMissingConfirmationCode`
- ✅ `should_Return200AndAuthResponse_When_ValidLoginRequest`
- ✅ `should_Return400_When_LoginRequestMissingPassword`
- ✅ `should_Return200AndAuthResponse_When_ValidRefreshTokenRequest`
- ✅ `should_Return400_When_RefreshTokenRequestMissingRefreshToken`
- ✅ `should_Return200AndSuccessMessage_When_ValidForgotPasswordRequest`
- ✅ `should_Return200AndSuccessMessage_When_ValidResetPasswordRequest`
- ✅ `should_Return400_When_ResetPasswordRequestMissingConfirmationCode`
- ✅ `should_Return400_When_ResetPasswordRequestNewPasswordTooShort`
- ✅ `should_Return200AndSuccessMessage_When_ValidLogoutRequest`
- ✅ `should_Return200AndSuccessMessage_When_ValidResendCodeRequest`
- ✅ `should_Return400_When_SignUpRequestUsernameExceedsMaxLength`
- ✅ `should_Return400_When_SignUpRequestUsernameBelowMinLength`

**Endpoints Testados**:
- `POST /auth/signup` - Registro de usuário
- `POST /auth/confirm` - Confirmação de cadastro
- `POST /auth/login` - Login
- `POST /auth/refresh` - Renovação de token
- `POST /auth/forgot-password` - Esqueci a senha
- `POST /auth/reset-password` - Resetar senha
- `POST /auth/logout` - Logout
- `POST /auth/resend-code` - Reenviar código

---

### 3. CognitoJwtAuthenticationFilterTest (14 testes)

**Localização**: `/src/test/java/com/gastrack/security/cognito/CognitoJwtAuthenticationFilterTest.java`

**Descrição**: Testes para o filtro de autenticação JWT `CognitoJwtAuthenticationFilter`.

**Abordagem**:
- Usa Mockito para mockar dependências (JwtDecoder, HttpServletRequest, etc.)
- Testa o fluxo de autenticação JWT
- Valida extração de claims do token
- Testa tratamento de erros

**Testes Implementados**:
- ✅ `should_AuthenticateUser_When_ValidJwtTokenProvided`
- ✅ `should_ExtractUsernameFromCognitoUsername_When_ClaimPresent`
- ✅ `should_ExtractUsernameFromEmail_When_CognitoUsernameNotPresent`
- ✅ `should_ExtractUsernameFromSubject_When_OtherClaimsNotPresent`
- ✅ `should_AssignDefaultRole_When_NoGroupsInToken`
- ✅ `should_ConvertGroupsToUppercaseRoles_When_GroupsProvided`
- ✅ `should_ContinueWithoutAuthentication_When_NoAuthorizationHeader`
- ✅ `should_ContinueWithoutAuthentication_When_HeaderDoesNotStartWithBearer`
- ✅ `should_NotSetAuthentication_When_SecurityContextAlreadyHasAuthentication`
- ✅ `should_ContinueWithoutAuthentication_When_JwtDecodingFails`
- ✅ `should_HandleExpiredToken_When_JwtDecodingThrowsException`
- ✅ `should_StripBearerPrefix_When_ProcessingToken`
- ✅ `should_SetAuthenticationDetails_When_ValidTokenProcessed`
- ✅ `should_ExtractUsernameFromUsernameClaim_When_Available`

**Cenários Testados**:
- Autenticação bem-sucedida com token válido
- Extração de username de diferentes claims (cognito:username, username, email, subject)
- Conversão de grupos Cognito para roles Spring Security
- Tratamento de tokens inválidos/expirados
- Fluxo sem cabeçalho Authorization
- Validação do prefixo Bearer

---

### 4. CognitoPropertiesTest (19 testes)

**Localização**: `/src/test/java/com/gastrack/security/cognito/CognitoPropertiesTest.java`

**Descrição**: Testes para a classe de configuração `CognitoProperties`.

**Abordagem**:
- Testes unitários simples sem mocks
- Valida getters, setters e métodos auxiliares
- Testa construção de URLs AWS Cognito

**Testes Implementados**:
- ✅ `should_SetAndGetRegion_When_PropertyProvided`
- ✅ `should_SetAndGetUserPoolId_When_PropertyProvided`
- ✅ `should_SetAndGetClientId_When_PropertyProvided`
- ✅ `should_SetAndGetClientSecret_When_PropertyProvided`
- ✅ `should_SetAndGetDomain_When_PropertyProvided`
- ✅ `should_BuildCorrectJwkUrl_When_RegionAndUserPoolIdProvided`
- ✅ `should_BuildCorrectIssuerUri_When_RegionAndUserPoolIdProvided`
- ✅ `should_BuildCorrectTokenUrl_When_DomainAndRegionProvided`
- ✅ `should_BuildCorrectAuthorizeUrl_When_DomainAndRegionProvided`
- ✅ `should_BuildCorrectUserInfoUrl_When_DomainAndRegionProvided`
- ✅ `should_BuildCorrectUrls_When_DifferentRegionProvided`
- ✅ `should_UpdateJwkUrl_When_RegionIsChanged`
- ✅ `should_UpdateIssuerUri_When_UserPoolIdIsChanged`
- ✅ `should_UpdateTokenUrl_When_DomainIsChanged`
- ✅ `should_BuildUrlsWithCorrectFormat_When_AllPropertiesSet`
- ✅ `should_HandleMultipleRegions_When_BuildingUrls`
- ✅ `should_ReturnConsistentUrls_When_CalledMultipleTimes`
- ✅ `should_AllowNullValues_When_PropertiesNotSet`
- ✅ `should_BuildUrlsWithNullValues_When_PropertiesNotSet`

**URLs Testadas**:
- JWK URL: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json`
- Issuer URI: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}`
- Token URL: `https://{domain}.auth.{region}.amazoncognito.com/oauth2/token`
- Authorize URL: `https://{domain}.auth.{region}.amazoncognito.com/oauth2/authorize`
- UserInfo URL: `https://{domain}.auth.{region}.amazoncognito.com/oauth2/userInfo`

---

## Padrões de Nomenclatura

Todos os testes seguem o padrão de nomenclatura:

```
should_ExpectedBehavior_When_StateUnderTest
```

**Exemplos**:
- `should_Return200_When_ValidRequest`
- `should_ThrowException_When_InvalidData`
- `should_ExtractUsername_When_ClaimPresent`

## Tecnologias Utilizadas

- **JUnit 5**: Framework de testes
- **Mockito**: Mocking de dependências
- **AssertJ**: Assertions fluentes
- **MockMvc**: Testes de controllers
- **Spring Test**: Suporte para testes Spring

## Estrutura dos Testes

Todos os testes seguem a estrutura AAA (Arrange-Act-Assert):

```java
@Test
@DisplayName("should_DoSomething_When_Condition")
void should_DoSomething_When_Condition() {
    // Given (Arrange)
    // Setup test data

    // When (Act)
    // Execute the code under test

    // Then (Assert)
    // Verify the results
}
```

## Cobertura de Código

Para gerar relatório de cobertura:

```bash
mvn clean test jacoco:report
```

Relatório disponível em: `target/site/jacoco/index.html`

## Executando os Testes

### Executar todos os testes Cognito:
```bash
mvn test -Dtest="Cognito*Test"
```

### Executar teste específico:
```bash
mvn test -Dtest=CognitoServiceTest
mvn test -Dtest=CognitoAuthControllerTest
mvn test -Dtest=CognitoJwtAuthenticationFilterTest
mvn test -Dtest=CognitoPropertiesTest
```

### Executar método de teste específico:
```bash
mvn test -Dtest=CognitoServiceTest#should_BuildValidSignUpRequest_When_ValidDataProvided
```

## Boas Práticas Aplicadas

1. **Testes Isolados**: Cada teste é independente e não depende de outros
2. **Nomenclatura Clara**: Nomes descritivos que explicam o comportamento esperado
3. **One Assert Per Test**: Cada teste valida um comportamento específico
4. **Arrange-Act-Assert**: Estrutura clara e consistente
5. **Mocks Adequados**: Uso correto de mocks apenas para dependências externas
6. **DisplayName**: Descrições legíveis para melhor documentação
7. **Fast Tests**: Testes rápidos que executam em poucos segundos
8. **No Side Effects**: Testes não alteram estado global

## Melhorias Futuras

- [ ] Adicionar testes de integração com banco H2
- [ ] Adicionar testes end-to-end com TestContainers
- [ ] Aumentar cobertura para 90%+
- [ ] Adicionar testes de performance
- [ ] Adicionar testes de segurança

## Manutenção

Ao adicionar novas funcionalidades:

1. Escreva os testes ANTES do código (TDD)
2. Siga o padrão de nomenclatura existente
3. Mantenha a estrutura AAA
4. Execute todos os testes antes de commitar
5. Atualize este README se necessário

---

**Última Atualização**: 2025-12-15
**Autor**: Claude AI
**Versão**: 1.0.0
