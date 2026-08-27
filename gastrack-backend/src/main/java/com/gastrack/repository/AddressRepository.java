package com.gastrack.repository;

import com.gastrack.model.Address;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByCompanyId(Long companyId);

    Page<Address> findByCompanyId(Long companyId, Pageable pageable);

    List<Address> findByCompanyIdAndActive(Long companyId, boolean active);

    Page<Address> findByCompanyIdAndActive(Long companyId, boolean active, Pageable pageable);

    Page<Address> findByActive(boolean active, Pageable pageable);

    List<Address> findByCityId(Long cityId);

    Optional<Address> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByIdAndCompanyId(Long id, Long companyId);
}
