package com.gastrack.mapper;

import com.gastrack.dto.UserResponse;
import com.gastrack.model.Company;
import com.gastrack.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regressão: /users/me não devolvia a empresa do usuário, então o front tentava tirá-la do claim
 * {@code custom:company_id} do ID token — claim que nenhum fluxo grava no Cognito. Resultado:
 * ADMIN abria "Novo Ponto de Gás" e o select de contrato ficava vazio, sem erro na tela.
 *
 * <p>A empresa é do banco: quem responde é o /me.
 */
class UserMapperCompanyTest {

    private final UserMapper mapper = new UserMapperImpl();

    @Test
    @DisplayName("should_ExposeCompany_When_UserBelongsToOne")
    void should_ExposeCompany_When_UserBelongsToOne() {
        User user = User.builder()
            .id(7L)
            .email("admin@empresa.com")
            .firstName("Marcelo")
            .lastName("Antonio")
            .company(Company.builder().id(42L).name("Empresa Teste Marcelo").build())
            .build();

        UserResponse response = mapper.toResponse(user);

        assertThat(response.getCompanyId()).isEqualTo(42L);
        assertThat(response.getCompanyName()).isEqualTo("Empresa Teste Marcelo");
    }

    @Test
    @DisplayName("should_LeaveCompanyNull_When_UserHasNone")
    void should_LeaveCompanyNull_When_UserHasNone() {
        User user = User.builder().id(1L).email("super@gastrack.com").build();

        UserResponse response = mapper.toResponse(user);

        assertThat(response.getCompanyId()).isNull();
        assertThat(response.getCompanyName()).isNull();
    }
}
