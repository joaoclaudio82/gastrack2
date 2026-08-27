package com.gastrack.repository;

import com.gastrack.model.MovementHistory;
import com.gastrack.model.MovementOperation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovementHistoryRepository extends JpaRepository<MovementHistory, Long> {

    Page<MovementHistory> findByEquipmentId(Long equipmentId, Pageable pageable);

    Page<MovementHistory> findByEquipmentKitId(Long kitId, Pageable pageable);

    List<MovementHistory> findByEquipmentIdOrderByOperationAtDesc(Long equipmentId);

    List<MovementHistory> findByEquipmentKitIdOrderByOperationAtDesc(Long kitId);

    @Query("SELECT h FROM MovementHistory h WHERE h.equipment.id = :equipmentId AND h.operation = :operation ORDER BY h.operationAt DESC")
    List<MovementHistory> findByEquipmentAndOperation(
        @Param("equipmentId") Long equipmentId,
        @Param("operation") MovementOperation operation
    );

    @Query("SELECT h FROM MovementHistory h WHERE h.equipmentKit.id = :kitId AND h.operation = :operation ORDER BY h.operationAt DESC")
    List<MovementHistory> findByKitAndOperation(
        @Param("kitId") Long kitId,
        @Param("operation") MovementOperation operation
    );

    @Query("SELECT h FROM MovementHistory h WHERE h.operationAt BETWEEN :start AND :end ORDER BY h.operationAt DESC")
    Page<MovementHistory> findByDateRange(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        Pageable pageable
    );

    // History for equipment in a specific company
    @Query("SELECT h FROM MovementHistory h WHERE h.equipment.equipmentKit.contract.company.id = :companyId ORDER BY h.operationAt DESC")
    Page<MovementHistory> findByCompanyIdThroughEquipment(@Param("companyId") Long companyId, Pageable pageable);

    // History for kits in a specific company
    @Query("SELECT h FROM MovementHistory h WHERE h.equipmentKit.contract.company.id = :companyId ORDER BY h.operationAt DESC")
    Page<MovementHistory> findByCompanyIdThroughKit(@Param("companyId") Long companyId, Pageable pageable);

    // All history ordered by operation date
    @Query("SELECT h FROM MovementHistory h ORDER BY h.operationAt DESC")
    Page<MovementHistory> findAllByOrderByOperationAtDesc(Pageable pageable);

    // All history for a company (either through equipment's kit or direct kit association)
    @Query("SELECT DISTINCT h FROM MovementHistory h " +
           "LEFT JOIN h.equipment e " +
           "LEFT JOIN e.equipmentKit ek " +
           "LEFT JOIN ek.contract ekc " +
           "LEFT JOIN h.equipmentKit hk " +
           "LEFT JOIN hk.contract hkc " +
           "WHERE ekc.company.id = :companyId OR hkc.company.id = :companyId " +
           "ORDER BY h.operationAt DESC")
    Page<MovementHistory> findByCompanyId(@Param("companyId") Long companyId, Pageable pageable);

    // All history related to a kit (as associated kit, source, or destination), optionally filtered by operation
    @Query("SELECT DISTINCT h FROM MovementHistory h " +
           "WHERE (h.equipmentKit.id = :kitId " +
           "OR h.fromKit.id = :kitId " +
           "OR h.toKit.id = :kitId) " +
           "AND (:operation IS NULL OR h.operation = :operation) " +
           "ORDER BY h.operationAt DESC")
    Page<MovementHistory> findAllRelatedToKit(@Param("kitId") Long kitId,
                                              @Param("operation") MovementOperation operation,
                                              Pageable pageable);
}
