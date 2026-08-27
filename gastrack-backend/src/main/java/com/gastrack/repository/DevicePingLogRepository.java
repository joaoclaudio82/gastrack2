package com.gastrack.repository;

import com.gastrack.model.DevicePingLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DevicePingLogRepository extends JpaRepository<DevicePingLog, Long> {

    @Query(value = """
            SELECT d.* FROM device_ping_logs d
            LEFT JOIN equipment e ON d.equipment_id = e.id
            WHERE (:serial = '' OR d.serial_number LIKE CONCAT('%', :serial, '%'))
              AND (CAST(:unregisteredOnly AS boolean) = false OR NOT EXISTS (
                SELECT 1 FROM equipment eq
                WHERE eq.serial_number = d.serial_number
                  AND eq.active = true
              ))
            ORDER BY d.pinged_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM device_ping_logs d
            WHERE (:serial = '' OR d.serial_number LIKE CONCAT('%', :serial, '%'))
              AND (CAST(:unregisteredOnly AS boolean) = false OR NOT EXISTS (
                SELECT 1 FROM equipment eq
                WHERE eq.serial_number = d.serial_number
                  AND eq.active = true
              ))
            """,
            nativeQuery = true)
    Page<DevicePingLog> search(
            @Param("serial") String serial,
            @Param("unregisteredOnly") boolean unregisteredOnly,
            Pageable pageable
    );
}
