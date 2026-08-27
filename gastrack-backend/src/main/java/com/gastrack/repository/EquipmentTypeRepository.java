package com.gastrack.repository;

import com.gastrack.model.EquipmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EquipmentTypeRepository extends JpaRepository<EquipmentType, Long> {

    Optional<EquipmentType> findByName(String name);

    boolean existsByName(String name);

    Page<EquipmentType> findByActive(Boolean active, Pageable pageable);

    Page<EquipmentType> findByNameContainingIgnoreCaseAndActive(String name, Boolean active, Pageable pageable);
}
