package com.gastrack.repository;

import com.gastrack.model.Company;
import com.gastrack.model.User;
import com.gastrack.model.UserRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceUnitUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regressão: `/users/me` passou a devolver `companyName`, e o mapeamento roda no controller —
 * fora da transação, com `open-in-view: false`. `User.company` é LAZY, então o proxy chegava
 * morto: `LazyInitializationException` e 500 para todo usuário **com** empresa. Quem não tinha
 * empresa recebia 200, o que fez o defeito passar despercebido no deploy.
 *
 * <p>Ler o id de um proxy não o inicializa — por isso o TenantFilter, que só usa `getId()`,
 * nunca quebrou. Quem estoura é o `getName()`.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryCompanyFetchTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void should_FetchCompany_When_FindingUserByCognitoSub() {
        Company company = companyRepository.save(Company.builder()
            .name("Empresa Fetch")
            .slug("empresa-fetch")
            .cnpj("11.222.333/0001-44")
            .active(true)
            .build());

        userRepository.save(User.builder()
            .cognitoSub("sub-com-empresa")
            .email("com-empresa@teste.com")
            .username("com-empresa@teste.com")
            .firstName("Teste")
            .lastName("Fetch")
            .role(UserRole.ADMIN)
            .company(company)
            .active(true)
            .build());

        entityManager.flush();
        entityManager.clear();

        Optional<User> found = userRepository.findByCognitoSub("sub-com-empresa");

        assertThat(found).isPresent();
        PersistenceUnitUtil util = entityManager.getEntityManagerFactory().getPersistenceUnitUtil();
        assertThat(util.isLoaded(found.get(), "company"))
            .as("company precisa vir carregada: quem mapeia a resposta roda fora da sessão")
            .isTrue();
        assertThat(found.get().getCompany().getName()).isEqualTo("Empresa Fetch");
    }

    @Test
    void should_FindUser_When_ThereIsNoCompany() {
        userRepository.save(User.builder()
            .cognitoSub("sub-sem-empresa")
            .email("sem-empresa@teste.com")
            .username("sem-empresa@teste.com")
            .firstName("Super")
            .lastName("Admin")
            .role(UserRole.SUPER_ADMIN)
            .active(true)
            .build());

        entityManager.flush();
        entityManager.clear();

        Optional<User> found = userRepository.findByCognitoSub("sub-sem-empresa");

        assertThat(found).isPresent();
        assertThat(found.get().getCompany()).isNull();
    }
}
