package com.gastrack.repository;

import com.gastrack.model.RefillEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefillEventRepository extends JpaRepository<RefillEvent, Long> {

    List<RefillEvent> findByGasPointIdOrderByDetectedAtDesc(Long gasPointId);
}
