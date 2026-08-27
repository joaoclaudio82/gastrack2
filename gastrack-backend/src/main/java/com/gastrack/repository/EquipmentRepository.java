package com.gastrack.repository;

import com.gastrack.model.Equipment;
import com.gastrack.model.EquipmentCondition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Optional<Equipment> findByAssetTag(String assetTag);

    boolean existsByAssetTag(String assetTag);

    Page<Equipment> findByEquipmentKitId(Long kitId, Pageable pageable);

    List<Equipment> findByEquipmentKitIdAndActive(Long kitId, Boolean active);

    Page<Equipment> findByActive(Boolean active, Pageable pageable);

    // Unassigned equipment (not in any kit) - for SUPER_ADMIN inventory view
    @Query("SELECT e FROM Equipment e WHERE e.equipmentKit IS NULL AND e.active = true")
    Page<Equipment> findUnassigned(Pageable pageable);

    // Equipment in kits of a specific company
    @Query("SELECT e FROM Equipment e WHERE e.equipmentKit.contract.company.id = :companyId AND e.active = true")
    Page<Equipment> findByCompanyId(@Param("companyId") Long companyId, Pageable pageable);

    // Equipment by condition
    Page<Equipment> findByCondition(EquipmentCondition condition, Pageable pageable);

    // Equipment by type
    Page<Equipment> findByEquipmentTypeIdAndActive(Long typeId, Boolean active, Pageable pageable);

    // Count equipment in a kit
    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.equipmentKit.id = :kitId AND e.active = true")
    long countActiveByKitId(@Param("kitId") Long kitId);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.equipmentKit.contract.company.id = :companyId AND e.active = true")
    long countActiveByCompanyId(@Param("companyId") Long companyId);

    @Query("""
        SELECT e FROM Equipment e
        LEFT JOIN e.equipmentKit ek
        LEFT JOIN ek.contract c
        WHERE e.active = true
          AND (
            :companyId = -1L OR
            (ek IS NOT NULL AND c.company.id = :companyId)
          )
          AND (
            :kitId = -1L OR
            (ek IS NOT NULL AND ek.id = :kitId)
          )
          AND (:typeId = -1L OR e.equipmentType.id = :typeId)
          AND (:condition IS NULL OR e.condition = :condition)
          AND (
            :assignment = '' OR
            (:assignment = 'assigned' AND ek IS NOT NULL) OR
            (:assignment = 'unassigned' AND ek IS NULL)
          )
    """)
    Page<Equipment> search(
        @Param("companyId") Long companyId,
        @Param("kitId") Long kitId,
        @Param("typeId") Long typeId,
        @Param("condition") EquipmentCondition condition,
        @Param("assignment") String assignment,
        Pageable pageable);

    @Query("SELECT e FROM Equipment e JOIN FETCH e.equipmentType WHERE e.serialNumber = :serialNumber AND e.active = true")
    List<Equipment> findActiveBySerialNumber(@Param("serialNumber") String serialNumber);

    // Tenant ownership resolution: fetches the ESP + its kit -> contract -> company (owner)
    // so kit.getCompany() and kit.installationDate resolve without extra lazy loads.
    @Query("""
        SELECT e FROM Equipment e
        JOIN FETCH e.equipmentType
        LEFT JOIN FETCH e.equipmentKit k
        LEFT JOIN FETCH k.contract c
        LEFT JOIN FETCH c.company
        WHERE e.serialNumber = :serialNumber AND e.active = true
    """)
    List<Equipment> findActiveWithOwnerBySerialNumber(@Param("serialNumber") String serialNumber);

    @Query("""
        SELECT e FROM Equipment e
        JOIN FETCH e.equipmentType
        LEFT JOIN FETCH e.equipmentKit k
        LEFT JOIN FETCH k.address a
        LEFT JOIN FETCH a.company
        WHERE e.serialNumber IN :serialNumbers AND e.active = true
    """)
    List<Equipment> findActiveBySerialNumberIn(@Param("serialNumbers") Collection<String> serialNumbers);

    Optional<Equipment> findByParentEquipmentIdAndSensorPort(Long parentEquipmentId, Integer sensorPort);

    Optional<Equipment> findByCodigoSensor(String codigoSensor);
}
