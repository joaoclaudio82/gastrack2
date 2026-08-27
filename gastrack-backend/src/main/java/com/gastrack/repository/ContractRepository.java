package com.gastrack.repository;

import com.gastrack.model.Contract;
import com.gastrack.model.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    Page<Contract> findByCompanyId(Long companyId, Pageable pageable);

    Page<Contract> findByCompanyIdAndActive(Long companyId, Boolean active, Pageable pageable);

    Page<Contract> findByCompanyIdAndStatus(Long companyId, ContractStatus status, Pageable pageable);

    Page<Contract> findByActive(Boolean active, Pageable pageable);

    List<Contract> findByCompanyIdAndStatus(Long companyId, ContractStatus status);

    @Query("SELECT c FROM Contract c WHERE c.company.id = :companyId AND c.status = :status AND c.active = true")
    List<Contract> findActiveContractsByCompanyAndStatus(
        @Param("companyId") Long companyId,
        @Param("status") ContractStatus status
    );

    @Query("SELECT COUNT(ek) FROM EquipmentKit ek WHERE ek.contract.id = :contractId AND ek.active = true")
    long countActiveKitsByContractId(@Param("contractId") Long contractId);

    @Query("""
        SELECT c FROM Contract c
        WHERE c.active = true
          AND (:companyId IS NULL OR c.company.id = :companyId)
          AND (:status IS NULL OR c.status = :status)
          AND (CAST(:search AS string) IS NULL
               OR LOWER(c.contractNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
               OR LOWER(c.company.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
    """)
    Page<Contract> search(
        @Param("companyId") Long companyId,
        @Param("status") ContractStatus status,
        @Param("search") String search,
        Pageable pageable);

    @Query("SELECT c FROM Contract c LEFT JOIN FETCH c.allowedAddresses WHERE c.id = :id")
    Optional<Contract> findByIdWithAddresses(@Param("id") Long id);

    @Query("""
        SELECT DISTINCT c FROM Contract c
        JOIN c.allowedAddresses a
        WHERE a.id = :addressId
    """)
    List<Contract> findByAllowedAddressId(@Param("addressId") Long addressId);

    long countByActiveTrue();

    long countByCompanyIdAndActiveTrue(Long companyId);

    List<Contract> findByCompanyIdAndActiveTrue(Long companyId);
}
