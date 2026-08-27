package com.gastrack.repository;

import com.gastrack.model.City;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {

    List<City> findByStateId(Long stateId);

    Page<City> findByStateId(Long stateId, Pageable pageable);

    List<City> findByStateIdAndActive(Long stateId, boolean active);

    Optional<City> findByCode(String code);

    List<City> findByActive(boolean active);

    Page<City> findByActive(boolean active, Pageable pageable);

    boolean existsByCode(String code);

    @Query("SELECT c FROM City c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<City> findByNameContainingIgnoreCase(@Param("name") String name);

    @Query("SELECT c FROM City c WHERE c.state.id = :stateId AND LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<City> findByStateIdAndNameContainingIgnoreCase(@Param("stateId") Long stateId, @Param("name") String name);
}
