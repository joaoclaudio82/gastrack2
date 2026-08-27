package com.gastrack.repository;

import com.gastrack.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserInvitationRepositoryTest {

    @Autowired
    private UserInvitationRepository invitationRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private UserRepository userRepository;

    private Company testCompany;
    private User testAdmin;
    private UserInvitation testInvitation;

    @BeforeEach
    void setUp() {
        // Create test company
        testCompany = companyRepository.save(Company.builder()
            .name("Test Company")
            .slug("test-company-" + UUID.randomUUID().toString().substring(0, 8))
            .cnpj("11.111.111/1111-11")
            .active(true)
            .build());

        // Create test admin user
        testAdmin = userRepository.save(User.builder()
            .cognitoSub(UUID.randomUUID().toString())
            .email("admin-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com")
            .username("testadmin")
            .role(UserRole.ADMIN)
            .company(testCompany)
            .active(true)
            .build());

        // Create test invitation
        testInvitation = UserInvitation.builder()
            .email("invited@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .token(UUID.randomUUID().toString())
            .status(InvitationStatus.PENDING)
            .cognitoUsername("invited@test.com")
            .expiresAt(LocalDateTime.now().plusDays(7))
            .createdBy(testAdmin)
            .build();
    }

    @Test
    void should_SaveInvitation_When_ValidData() {
        UserInvitation saved = invitationRepository.save(testInvitation);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getEmail()).isEqualTo("invited@test.com");
        assertThat(saved.getRole()).isEqualTo(UserRole.USER);
        assertThat(saved.getStatus()).isEqualTo(InvitationStatus.PENDING);
    }

    @Test
    void should_FindByToken_When_Exists() {
        UserInvitation saved = invitationRepository.save(testInvitation);

        Optional<UserInvitation> found = invitationRepository.findByToken(saved.getToken());

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("invited@test.com");
    }

    @Test
    void should_ReturnEmpty_When_TokenNotExists() {
        Optional<UserInvitation> found = invitationRepository.findByToken("nonexistent-token");

        assertThat(found).isEmpty();
    }

    @Test
    void should_FindByEmailAndStatus_When_Exists() {
        invitationRepository.save(testInvitation);

        Optional<UserInvitation> found = invitationRepository.findByEmailAndStatus(
            "invited@test.com", InvitationStatus.PENDING);

        assertThat(found).isPresent();
        assertThat(found.get().getRole()).isEqualTo(UserRole.USER);
    }

    @Test
    void should_FindPendingByEmail_When_Exists() {
        invitationRepository.save(testInvitation);

        Optional<UserInvitation> found = invitationRepository.findPendingByEmail("invited@test.com");

        assertThat(found).isPresent();
    }

    @Test
    void should_ReturnEmpty_When_InvitationNotPending() {
        testInvitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(testInvitation);

        Optional<UserInvitation> found = invitationRepository.findPendingByEmail("invited@test.com");

        assertThat(found).isEmpty();
    }

    @Test
    void should_ReturnTrue_When_PendingInvitationExists() {
        invitationRepository.save(testInvitation);

        boolean exists = invitationRepository.existsPendingByEmail("invited@test.com");

        assertThat(exists).isTrue();
    }

    @Test
    void should_ReturnFalse_When_NoPendingInvitation() {
        boolean exists = invitationRepository.existsPendingByEmail("nonexistent@test.com");

        assertThat(exists).isFalse();
    }

    @Test
    void should_FindByCompanyId_WithPagination() {
        // Create multiple invitations
        for (int i = 1; i <= 5; i++) {
            UserInvitation invitation = UserInvitation.builder()
                .email("user" + i + "@test.com")
                .role(UserRole.USER)
                .company(testCompany)
                .token(UUID.randomUUID().toString())
                .status(InvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .createdBy(testAdmin)
                .build();
            invitationRepository.save(invitation);
        }

        Page<UserInvitation> invitations = invitationRepository.findByCompanyId(
            testCompany.getId(), PageRequest.of(0, 3));

        assertThat(invitations.getContent()).hasSize(3);
        assertThat(invitations.getTotalElements()).isEqualTo(5);
    }

    @Test
    void should_FindByCompanyIdAndStatus_WithPagination() {
        // Create pending invitation
        invitationRepository.save(testInvitation);

        // Create accepted invitation
        UserInvitation acceptedInvitation = UserInvitation.builder()
            .email("accepted@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .token(UUID.randomUUID().toString())
            .status(InvitationStatus.ACCEPTED)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .createdBy(testAdmin)
            .build();
        invitationRepository.save(acceptedInvitation);

        Page<UserInvitation> pendingInvitations = invitationRepository.findByCompanyIdAndStatus(
            testCompany.getId(), InvitationStatus.PENDING, PageRequest.of(0, 10));

        assertThat(pendingInvitations.getContent()).hasSize(1);
        assertThat(pendingInvitations.getContent().get(0).getEmail()).isEqualTo("invited@test.com");
    }

    @Test
    void should_FindExpiredPendingInvitations() {
        // Create expired invitation
        UserInvitation expiredInvitation = UserInvitation.builder()
            .email("expired@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .token(UUID.randomUUID().toString())
            .status(InvitationStatus.PENDING)
            .expiresAt(LocalDateTime.now().minusDays(1))
            .createdBy(testAdmin)
            .build();
        invitationRepository.save(expiredInvitation);

        // Create valid invitation
        invitationRepository.save(testInvitation);

        List<UserInvitation> expired = invitationRepository.findExpiredPendingInvitations(LocalDateTime.now());

        assertThat(expired).hasSize(1);
        assertThat(expired.get(0).getEmail()).isEqualTo("expired@test.com");
    }

    @Test
    void should_MarkExpiredInvitations() {
        // Create expired invitation
        UserInvitation expiredInvitation = UserInvitation.builder()
            .email("expired@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .token(UUID.randomUUID().toString())
            .status(InvitationStatus.PENDING)
            .expiresAt(LocalDateTime.now().minusDays(1))
            .createdBy(testAdmin)
            .build();
        invitationRepository.save(expiredInvitation);

        int updated = invitationRepository.markExpiredInvitations(LocalDateTime.now());

        assertThat(updated).isEqualTo(1);

        Optional<UserInvitation> found = invitationRepository.findByToken(expiredInvitation.getToken());
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(InvitationStatus.EXPIRED);
    }

    @Test
    void should_CountPendingByCompanyId() {
        // Create multiple pending invitations
        invitationRepository.save(testInvitation);
        invitationRepository.save(UserInvitation.builder()
            .email("user2@test.com")
            .role(UserRole.USER)
            .company(testCompany)
            .token(UUID.randomUUID().toString())
            .status(InvitationStatus.PENDING)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .createdBy(testAdmin)
            .build());

        long count = invitationRepository.countPendingByCompanyId(testCompany.getId());

        assertThat(count).isEqualTo(2);
    }

    @Test
    void should_FindByIdAndCompanyId_When_Exists() {
        UserInvitation saved = invitationRepository.save(testInvitation);

        Optional<UserInvitation> found = invitationRepository.findByIdAndCompanyId(
            saved.getId(), testCompany.getId());

        assertThat(found).isPresent();
    }

    @Test
    void should_ReturnEmpty_When_CompanyIdDoesNotMatch() {
        UserInvitation saved = invitationRepository.save(testInvitation);

        Optional<UserInvitation> found = invitationRepository.findByIdAndCompanyId(
            saved.getId(), 999L);

        assertThat(found).isEmpty();
    }
}
