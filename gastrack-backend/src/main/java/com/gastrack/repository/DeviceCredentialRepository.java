package com.gastrack.repository;

import com.gastrack.model.DeviceCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceCredentialRepository extends JpaRepository<DeviceCredential, Long> {

    Optional<DeviceCredential> findByEquipmentId(Long equipmentId);

    Optional<DeviceCredential> findByThingName(String thingName);

    boolean existsByEquipmentId(Long equipmentId);
}
