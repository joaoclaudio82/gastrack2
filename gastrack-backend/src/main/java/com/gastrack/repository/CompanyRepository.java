package com.gastrack.repository;

import com.gastrack.model.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findBySlug(String slug);

    Optional<Company> findByCnpj(String cnpj);

    boolean existsBySlug(String slug);

    boolean existsByCnpj(String cnpj);

    Page<Company> findByActive(boolean active, Pageable pageable);

    Page<Company> findByActiveAndNameContainingIgnoreCase(boolean active, String name, Pageable pageable);

    long countByActiveTrue();
}
