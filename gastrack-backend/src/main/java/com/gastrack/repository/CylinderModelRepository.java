package com.gastrack.repository;

import com.gastrack.model.CylinderModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CylinderModelRepository extends JpaRepository<CylinderModel, Long> {

    boolean existsByCodigo(String codigo);
}
