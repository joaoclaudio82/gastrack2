package com.gastrack.service;

import com.gastrack.model.Equipment;
import com.gastrack.model.PontoGas;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.repository.dynamodb.PressureReadingDynamoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Traz a leitura real do sensor (DynamoDB) para o estado da linha de gás (Postgres).
 *
 * Antes deste job, {@code PontoGas.currentPressureBar/status} só eram escritos pelo endpoint
 * manual {@code PATCH /gas-points/{id}/status} — que exige JWT de ADMIN e nenhum dispositivo
 * consegue chamar. Resultado: toda linha ficava permanentemente "SEM_SINAL". O dado existia
 * no Dynamo, mas nada o ligava à entidade que o produto usa para alertar.
 *
 * ponytail: poll simples sobre a lista de linhas ativas. Se a frota crescer a ponto de o
 * poll pesar, o caminho é AWS IoT Rule -> SQS -> consumidor, não afinar o intervalo aqui.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GasPointReadingSyncJob {

    private static final String ATTR_PRESSURE = "Pressao_bar";
    private static final String ATTR_TIMESTAMP = "timestamp";

    /** Janela de busca no Dynamo para linhas que nunca reportaram. */
    private static final Duration COLD_START_WINDOW = Duration.ofDays(1);

    /** Ciclos seguidos sem nenhuma leitura antes de avisar. Com 60s de intervalo, ~10 minutos. */
    private static final int QUIET_CYCLES_BEFORE_REPORT = 10;

    /*
     * Contadores de sinal de vida. Antes deles o job era mudo: só logava quando atualizava algo,
     * então "rodou e o Dynamo não tinha leitura", "rodou e falhou" e "não rodou" produziam
     * exatamente o mesmo silêncio — e no primeiro deploy ficou sem resposta qual era o caso.
     *
     * Mutados só pela thread do agendador, que é única (fixedDelay não sobrepõe execuções).
     */
    private boolean announced = false;
    private int quietCycles = 0;

    private final PontoGasRepository pontoGasRepository;
    private final PressureReadingDynamoRepository pressureReadingDynamoRepository;
    private final PontoGasService pontoGasService;

    @Value("${gastrack.reading-sync.enabled:true}")
    private boolean enabled;

    /*
     * SEM @Transactional de propósito. Uma transação em volta do laço faria duas coisas ruins:
     * seguraria conexão do pool durante todas as chamadas HTTP ao DynamoDB, e — pior — o
     * applyReading de cada linha entraria nela; ao falhar, o Spring marcaria a transação como
     * rollback-only, o catch abaixo engoliria a exceção, e o commit final descartaria TODAS as
     * linhas já atualizadas no ciclo. Cada applyReading tem transação própria.
     */
    @Scheduled(fixedDelayString = "${gastrack.reading-sync.interval-ms:60000}")
    public void sync() {
        if (!enabled) {
            return;
        }

        List<PontoGas> points = pontoGasRepository.findActiveWithSensor();

        // Prova de que o agendamento pegou. Uma vez só — não é para poluir o log a cada minuto.
        if (!announced) {
            log.info("Sincronização de leituras ativa: {} linha(s) com sensor mapeado", points.size());
            announced = true;
        }

        int updated = 0;
        int failed = 0;
        for (PontoGas point : points) {
            try {
                if (syncPoint(point)) {
                    updated++;
                }
            } catch (RuntimeException ex) {
                failed++;
                // Uma linha problemática não pode travar a sincronização das outras.
                log.warn("Falha ao sincronizar leitura da linha {}: {}", point.getId(), ex.getMessage());
            }
        }

        log.debug("Ciclo de sincronização: {} linha(s) varrida(s), {} atualizada(s), {} com falha",
            points.size(), updated, failed);

        if (updated > 0) {
            log.info("Sincronização de leituras: {} linha(s) atualizada(s)", updated);
            quietCycles = 0;
            return;
        }

        quietCycles++;
        // Igualdade, não >=: avisa uma vez por sequência de silêncio, em vez de a cada ciclo.
        if (quietCycles == QUIET_CYCLES_BEFORE_REPORT) {
            log.info("Job rodando, mas sem leitura nova há {} ciclos em {} linha(s) com sensor — "
                    + "o DynamoDB não tem dado mais recente que o já persistido",
                quietCycles, points.size());
        }
    }

    private boolean syncPoint(PontoGas point) {
        Equipment sensor = point.getEquipments().stream()
            .filter(e -> Boolean.TRUE.equals(e.getActive()) && e.getCodigoSensor() != null)
            .findFirst()
            .orElse(null);
        if (sensor == null) {
            return false;
        }

        // codigoSensor = "<MAC do ESP32>|<porta>", o mesmo formato usado no filtro do Dynamo.
        String[] parts = sensor.getCodigoSensor().split("\\|");
        if (parts.length != 2) {
            log.warn("codigoSensor mal formado no equipamento {}: {}", sensor.getId(), sensor.getCodigoSensor());
            return false;
        }
        String deviceId = parts[0];
        Integer sensorPort;
        try {
            sensorPort = Integer.valueOf(parts[1]);
        } catch (NumberFormatException ex) {
            log.warn("Porta não numérica no codigoSensor do equipamento {}: {}", sensor.getId(), sensor.getCodigoSensor());
            return false;
        }

        long startTs = lastReadingEpochSeconds(point);
        long endTs = Instant.now().getEpochSecond();

        Optional<Map<String, AttributeValue>> latest =
            pressureReadingDynamoRepository.findLatest(deviceId, sensorPort, startTs, endTs);
        if (latest.isEmpty()) {
            return false;
        }

        Map<String, AttributeValue> item = latest.get();
        BigDecimal pressure = readDecimal(item, ATTR_PRESSURE);
        Long readingTs = readLong(item, ATTR_TIMESTAMP);
        if (pressure == null || readingTs == null) {
            return false;
        }

        // Só avança: leitura mais velha que a já persistida não sobrescreve nada.
        if (point.getLastReadingAt() != null
            && !LocalDateTime.ofEpochSecond(readingTs, 0, ZoneOffset.UTC).isAfter(point.getLastReadingAt())) {
            return false;
        }

        pontoGasService.applyReading(point.getId(), pressure);
        return true;
    }

    /**
     * Busca a partir da última leitura conhecida (+1s para não reprocessar a mesma),
     * ou de uma janela fria quando a linha nunca reportou.
     */
    private long lastReadingEpochSeconds(PontoGas point) {
        if (point.getLastReadingAt() == null) {
            return Instant.now().minus(COLD_START_WINDOW).getEpochSecond();
        }
        return point.getLastReadingAt().toEpochSecond(ZoneOffset.UTC) + 1;
    }

    private BigDecimal readDecimal(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && value.n() != null ? new BigDecimal(value.n()) : null;
    }

    private Long readLong(Map<String, AttributeValue> item, String key) {
        AttributeValue value = item.get(key);
        return value != null && value.n() != null ? Long.valueOf(value.n()) : null;
    }
}
