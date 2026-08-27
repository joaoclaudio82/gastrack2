package com.gastrack.repository;

import com.gastrack.model.GasPrice;
import com.gastrack.model.GasType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GasPriceRepository extends JpaRepository<GasPrice, Long> {

    List<GasPrice> findByCompanyIdOrderByValidFromDesc(Long companyId);

    /**
     * Current price = greatest {@code validFrom <= now}, active. Ordered desc so the first row wins.
     * Use {@code PageRequest.of(0, 1)} to fetch only the vigente row.
     */
    @Query("""
        SELECT g FROM GasPrice g
        WHERE g.company.id = :companyId
          AND g.gasType = :gasType
          AND g.active = true
          AND g.validFrom <= :now
        ORDER BY g.validFrom DESC
    """)
    List<GasPrice> findCurrentByCompanyAndGasType(
        @Param("companyId") Long companyId,
        @Param("gasType") GasType gasType,
        @Param("now") LocalDateTime now,
        Pageable pageable);
}
