package com.gastrack.repository;

import com.gastrack.model.KitInstallation;
import com.gastrack.model.KitOperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface KitInstallationRepository extends JpaRepository<KitInstallation, Long> {

    Page<KitInstallation> findByKitId(Long kitId, Pageable pageable);

    Page<KitInstallation> findByAddressId(Long addressId, Pageable pageable);

    List<KitInstallation> findByKitIdOrderByOperationDateDesc(Long kitId);

    @Query("SELECT ki FROM KitInstallation ki WHERE ki.kit.id = :kitId AND ki.operationType = :operationType ORDER BY ki.operationDate DESC")
    List<KitInstallation> findByKitAndOperationType(
        @Param("kitId") Long kitId,
        @Param("operationType") KitOperationType operationType
    );

    @Query("SELECT ki FROM KitInstallation ki WHERE ki.kit.id = :kitId ORDER BY ki.operationDate DESC, ki.createdAt DESC LIMIT 1")
    Optional<KitInstallation> findLatestByKitId(@Param("kitId") Long kitId);

    @Query("SELECT ki FROM KitInstallation ki WHERE ki.operationDate BETWEEN :start AND :end ORDER BY ki.operationDate DESC")
    Page<KitInstallation> findByDateRange(
        @Param("start") LocalDate start,
        @Param("end") LocalDate end,
        Pageable pageable
    );

    @Query("SELECT ki FROM KitInstallation ki WHERE ki.kit.contract.company.id = :companyId ORDER BY ki.operationDate DESC")
    Page<KitInstallation> findByCompanyId(@Param("companyId") Long companyId, Pageable pageable);
}
