package com.gastrack.service;

import com.gastrack.dto.pontogas.PontoGasMonitoringResponse;
import com.gastrack.dto.pontogas.PontoGasRequest;
import com.gastrack.dto.pontogas.PontoGasResponse;
import com.gastrack.dto.pontogas.PontoGasStatusUpdateRequest;
import com.gastrack.model.PontoGas;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface PontoGasService {

    PontoGasResponse create(PontoGasRequest request);

    PontoGasResponse findById(Long id);

    PontoGasMonitoringResponse getMonitoring(Long id);

    PontoGasResponse updateStatus(Long id, PontoGasStatusUpdateRequest request);

    /**
     * Aplica uma leitura já autorizada, em transação própria. Uso interno (job de
     * sincronização) — não expor via REST.
     *
     * <p>Recebe id, não entidade: o job roda sem transação para não segurar conexão durante as
     * chamadas ao DynamoDB, então a entidade precisa ser carregada aqui dentro para as coleções
     * LAZY (cilindros) resolverem.
     */
    void applyReading(Long pontoGasId, BigDecimal pressureBar);

    Page<PontoGasResponse> findAll(Boolean active, Pageable pageable);

    Page<PontoGasResponse> findByAddressId(Long addressId, Boolean active, Pageable pageable);

    Page<PontoGasResponse> findByAddressIdAndKitId(Long addressId, Long kitId, Boolean active, Pageable pageable);

    PontoGasResponse update(Long id, PontoGasRequest request);

    void deactivate(Long id);

    void activate(Long id);

    void delete(Long id);
}
