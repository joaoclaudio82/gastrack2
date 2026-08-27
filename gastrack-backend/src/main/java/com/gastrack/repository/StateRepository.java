package com.gastrack.repository;

import com.gastrack.model.State;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StateRepository extends JpaRepository<State, Long> {

    List<State> findByCountryId(Long countryId);

    Page<State> findByCountryId(Long countryId, Pageable pageable);

    List<State> findByCountryIdAndActive(Long countryId, boolean active);

    Optional<State> findByCode(String code);

    Optional<State> findByAbbreviationAndCountryId(String abbreviation, Long countryId);

    List<State> findByActive(boolean active);

    boolean existsByCode(String code);

    boolean existsByAbbreviationAndCountryId(String abbreviation, Long countryId);
}
