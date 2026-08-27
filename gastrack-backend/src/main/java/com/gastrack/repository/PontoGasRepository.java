package com.gastrack.repository;

import com.gastrack.model.PontoGas;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PontoGasRepository extends JpaRepository<PontoGas, Long> {

    /** Linhas ativas da empresa — a linha pertence à empresa pelo endereço. */
    long countByAddressCompanyIdAndActiveTrue(Long companyId);

    long countByActiveTrue();

    Page<PontoGas> findByActive(boolean active, Pageable pageable);

    Page<PontoGas> findByAddressCompanyId(Long companyId, Pageable pageable);

    Page<PontoGas> findByAddressCompanyIdAndActive(Long companyId, boolean active, Pageable pageable);

    List<PontoGas> findByAddressCompanyIdAndActiveTrue(Long companyId);

    /**
     * Linhas ativas com sensor mapeado — o conjunto que o job de sincronização varre.
     *
     * <p>{@code JOIN FETCH} porque o job roda sem transação: as entidades voltam desanexadas e
     * o acesso a {@code getEquipments()} estouraria LazyInitializationException. É seguro aqui
     * por ser consulta de lista, sem paginação — fetch de coleção com {@code Pageable} faria o
     * Hibernate paginar em memória.
     */
    @Query("""
        SELECT DISTINCT p FROM PontoGas p
        JOIN FETCH p.equipments e
        WHERE p.active = true
          AND e.active = true
          AND e.codigoSensor IS NOT NULL
    """)
    List<PontoGas> findActiveWithSensor();

    @Query(
        value =
            "SELECT DISTINCT p FROM PontoGas p "
                + "LEFT JOIN FETCH p.equipments e "
                + "LEFT JOIN FETCH e.equipmentType "
                + "WHERE p.address.id = :addressId",
        countQuery = "SELECT COUNT(p) FROM PontoGas p WHERE p.address.id = :addressId")
    Page<PontoGas> findByAddressId(@Param("addressId") Long addressId, Pageable pageable);

    @Query(
        value =
            "SELECT DISTINCT p FROM PontoGas p "
                + "LEFT JOIN FETCH p.equipments e "
                + "LEFT JOIN FETCH e.equipmentType "
                + "WHERE p.address.id = :addressId AND p.active = :active",
        countQuery =
            "SELECT COUNT(p) FROM PontoGas p WHERE p.address.id = :addressId AND p.active = :active")
    Page<PontoGas> findByAddressIdAndActive(
        @Param("addressId") Long addressId,
        @Param("active") boolean active,
        Pageable pageable);

    @Query(
        value =
            "SELECT DISTINCT p FROM PontoGas p "
                + "JOIN FETCH p.equipments e "
                + "LEFT JOIN FETCH e.equipmentType "
                + "WHERE p.address.id = :addressId AND e.equipmentKit.id = :kitId",
        countQuery =
            "SELECT COUNT(DISTINCT p) FROM PontoGas p "
                + "JOIN p.equipments e "
                + "WHERE p.address.id = :addressId AND e.equipmentKit.id = :kitId")
    Page<PontoGas> findByAddressIdAndKitId(
        @Param("addressId") Long addressId,
        @Param("kitId") Long kitId,
        Pageable pageable);

    @Query(
        value =
            "SELECT DISTINCT p FROM PontoGas p "
                + "JOIN FETCH p.equipments e "
                + "LEFT JOIN FETCH e.equipmentType "
                + "WHERE p.address.id = :addressId AND p.active = :active AND e.equipmentKit.id = :kitId",
        countQuery =
            "SELECT COUNT(DISTINCT p) FROM PontoGas p "
                + "JOIN p.equipments e "
                + "WHERE p.address.id = :addressId AND p.active = :active AND e.equipmentKit.id = :kitId")
    Page<PontoGas> findByAddressIdAndKitIdAndActive(
        @Param("addressId") Long addressId,
        @Param("kitId") Long kitId,
        @Param("active") boolean active,
        Pageable pageable);
}
