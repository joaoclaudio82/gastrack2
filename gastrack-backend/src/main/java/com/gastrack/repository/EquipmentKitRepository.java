package com.gastrack.repository;

import com.gastrack.model.EquipmentKit;
import com.gastrack.model.KitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentKitRepository extends JpaRepository<EquipmentKit, Long> {

    Optional<EquipmentKit> findByKitCode(String kitCode);

    boolean existsByKitCode(String kitCode);

    Page<EquipmentKit> findByContractId(Long contractId, Pageable pageable);

    Page<EquipmentKit> findByContractIdAndActive(Long contractId, Boolean active, Pageable pageable);

    List<EquipmentKit> findByContractIdAndActive(Long contractId, Boolean active);

    Page<EquipmentKit> findByAddressId(Long addressId, Pageable pageable);

    Page<EquipmentKit> findByActive(Boolean active, Pageable pageable);

    @Query("SELECT k FROM EquipmentKit k WHERE k.contract.company.id = :companyId AND k.active = true")
    Page<EquipmentKit> findActiveByCompanyId(@Param("companyId") Long companyId, Pageable pageable);

    @Query("SELECT k FROM EquipmentKit k WHERE k.contract.company.id = :companyId")
    Page<EquipmentKit> findByCompanyId(@Param("companyId") Long companyId, Pageable pageable);

    @Query("SELECT k FROM EquipmentKit k WHERE k.contract.company.id = :companyId AND k.status = :status AND k.active = true")
    Page<EquipmentKit> findByCompanyIdAndStatus(
        @Param("companyId") Long companyId,
        @Param("status") KitStatus status,
        Pageable pageable
    );

    @Query("SELECT COUNT(k) FROM EquipmentKit k WHERE k.contract.id = :contractId AND k.active = true")
    long countActiveByContractId(@Param("contractId") Long contractId);

    @Query("""
        SELECT k FROM EquipmentKit k
        WHERE k.active = true
          AND (:companyId IS NULL OR k.contract.company.id = :companyId)
          AND (:contractId IS NULL OR k.contract.id = :contractId)
          AND (:status IS NULL OR k.status = :status)
    """)
    Page<EquipmentKit> search(
        @Param("companyId") Long companyId,
        @Param("contractId") Long contractId,
        @Param("status") KitStatus status,
        Pageable pageable);

    long countByActiveTrue();

    @Query("SELECT COUNT(k) FROM EquipmentKit k WHERE k.contract.company.id = :companyId AND k.active = true")
    long countActiveByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT k FROM EquipmentKit k WHERE k.contract.company.id = :companyId AND k.active = true")
    List<EquipmentKit> findActiveByCompanyIdList(@Param("companyId") Long companyId);
}
