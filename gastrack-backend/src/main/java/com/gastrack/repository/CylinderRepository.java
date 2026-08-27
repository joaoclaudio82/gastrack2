package com.gastrack.repository;

import com.gastrack.model.Cylinder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CylinderRepository extends JpaRepository<Cylinder, Long> {

    Optional<Cylinder> findBySerialNumber(String serialNumber);

    List<Cylinder> findByPontoGasIdAndActiveTrue(Long pontoGasId);

    List<Cylinder> findByAddressId(Long addressId);

    Page<Cylinder> findByAddressId(Long addressId, Pageable pageable);

    boolean existsBySerialNumber(String serialNumber);

    List<Cylinder> findByAddressCompanyId(Long companyId);

    Page<Cylinder> findByAddressCompanyId(Long companyId, Pageable pageable);

    Optional<Cylinder> findByIdAndAddressCompanyId(Long id, Long companyId);

    long countByAddressCompanyId(Long companyId);

    /**
     * Escopo de empresa via {@code company} do próprio cilindro — NOT NULL desde a V45,
     * então não há mais fallback por ponto/endereço.
     */
    @Query("""
        SELECT c FROM Cylinder c
        LEFT JOIN c.pontoGas pg
        LEFT JOIN c.address addr
        WHERE c.active = true
          AND (:companyId IS NULL OR c.company.id = :companyId)
          AND (:addressId IS NULL OR pg.address.id = :addressId OR addr.id = :addressId)
          AND (:pontoGasId IS NULL OR pg.id = :pontoGasId)
          AND (
            :search IS NULL OR :search = '' OR
            LOWER(c.serialNumber) LIKE LOWER(CONCAT('%', :search, '%'))
          )
    """)
    Page<Cylinder> search(
        @Param("companyId") Long companyId,
        @Param("addressId") Long addressId,
        @Param("pontoGasId") Long pontoGasId,
        @Param("search") String search,
        Pageable pageable);
}
