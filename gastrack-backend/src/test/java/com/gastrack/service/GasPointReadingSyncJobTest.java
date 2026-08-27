package com.gastrack.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.gastrack.model.Equipment;
import com.gastrack.model.PontoGas;
import com.gastrack.repository.PontoGasRepository;
import com.gastrack.repository.dynamodb.PressureReadingDynamoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class GasPointReadingSyncJobTest {

    @Mock
    private PontoGasRepository pontoGasRepository;

    @Mock
    private PressureReadingDynamoRepository pressureReadingDynamoRepository;

    @Mock
    private PontoGasService pontoGasService;

    @InjectMocks
    private GasPointReadingSyncJob job;

    private PontoGas point;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(job, "enabled", true);

        Equipment sensor = Equipment.builder()
            .id(7L)
            .active(true)
            .codigoSensor("4036EB1815AC|3")
            .build();

        point = PontoGas.builder()
            .id(100L)
            .active(true)
            .equipments(new ArrayList<>(List.of(sensor)))
            .build();
    }

    private Map<String, AttributeValue> reading(String pressureBar, long timestamp) {
        return Map.of(
            "Pressao_bar", AttributeValue.builder().n(pressureBar).build(),
            "timestamp", AttributeValue.builder().n(Long.toString(timestamp)).build());
    }

    @Test
    @DisplayName("Leitura do Dynamo chega na linha de gás")
    void should_ApplyReading_When_DynamoHasNewerData() {
        long now = Instant.now().getEpochSecond();
        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(point));
        when(pressureReadingDynamoRepository.findLatest(anyString(), anyInt(), anyLong(), anyLong()))
            .thenReturn(Optional.of(reading("87.5", now)));

        job.sync();

        ArgumentCaptor<BigDecimal> pressure = ArgumentCaptor.forClass(BigDecimal.class);
        verify(pontoGasService).applyReading(eq(100L), pressure.capture());
        assertThat(pressure.getValue()).isEqualByComparingTo("87.5");
    }

    @Test
    @DisplayName("codigoSensor é quebrado em device_id e porta para consultar o Dynamo")
    void should_QueryDynamoWithDeviceAndPort_When_SensorMapped() {
        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(point));
        when(pressureReadingDynamoRepository.findLatest(anyString(), anyInt(), anyLong(), anyLong()))
            .thenReturn(Optional.empty());

        job.sync();

        verify(pressureReadingDynamoRepository)
            .findLatest(org.mockito.ArgumentMatchers.eq("4036EB1815AC"),
                org.mockito.ArgumentMatchers.eq(3), anyLong(), anyLong());
    }

    @Test
    @DisplayName("Leitura mais velha que a persistida não sobrescreve o estado")
    void should_NotApplyReading_When_OlderThanLastPersisted() {
        LocalDateTime lastReading = LocalDateTime.now(ZoneOffset.UTC).minusMinutes(5);
        point.setLastReadingAt(lastReading);
        long olderTs = lastReading.toEpochSecond(ZoneOffset.UTC) - 600;

        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(point));
        when(pressureReadingDynamoRepository.findLatest(anyString(), anyInt(), anyLong(), anyLong()))
            .thenReturn(Optional.of(reading("10", olderTs)));

        job.sync();

        verify(pontoGasService, never()).applyReading(any(), any());
    }

    @Test
    @DisplayName("Sem leitura no Dynamo, nada é escrito")
    void should_DoNothing_When_DynamoHasNoReading() {
        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(point));
        when(pressureReadingDynamoRepository.findLatest(anyString(), anyInt(), anyLong(), anyLong()))
            .thenReturn(Optional.empty());

        job.sync();

        verify(pontoGasService, never()).applyReading(any(), any());
    }

    @Test
    @DisplayName("codigoSensor malformado não derruba a sincronização das outras linhas")
    void should_SkipPoint_When_CodigoSensorMalformed() {
        point.getEquipments().get(0).setCodigoSensor("SEM-SEPARADOR");
        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(point));

        job.sync();

        verify(pontoGasService, never()).applyReading(any(), any());
        verify(pressureReadingDynamoRepository, never()).findLatest(anyString(), anyInt(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("Uma linha que explode não impede as demais de sincronizar")
    void should_KeepGoing_When_OnePointFails() {
        long now = Instant.now().getEpochSecond();
        PontoGas broken = PontoGas.builder()
            .id(200L)
            .active(true)
            .equipments(new ArrayList<>(List.of(Equipment.builder()
                .id(9L).active(true).codigoSensor("DEADBEEF|1").build())))
            .build();

        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(broken, point));
        when(pressureReadingDynamoRepository.findLatest(org.mockito.ArgumentMatchers.eq("DEADBEEF"),
            anyInt(), anyLong(), anyLong()))
            .thenThrow(new RuntimeException("dynamo fora do ar"));
        when(pressureReadingDynamoRepository.findLatest(org.mockito.ArgumentMatchers.eq("4036EB1815AC"),
            anyInt(), anyLong(), anyLong()))
            .thenReturn(Optional.of(reading("50", now)));

        job.sync();

        verify(pontoGasService).applyReading(eq(100L), any(BigDecimal.class));
    }

    /**
     * O job era mudo: só logava quando atualizava algo. "Rodou e o Dynamo não tinha leitura",
     * "rodou e falhou" e "não rodou" produziam o mesmo silêncio — foi exatamente a dúvida que
     * ficou sem resposta no primeiro deploy.
     */
    @Test
    @DisplayName("Anuncia no primeiro ciclo quantas linhas vai varrer")
    void should_AnnounceItselfOnce_When_FirstCycleRuns() {
        ListAppender<ILoggingEvent> appender = attachAppender();
        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(point));
        when(pressureReadingDynamoRepository.findLatest(anyString(), anyInt(), anyLong(), anyLong()))
            .thenReturn(Optional.empty());

        job.sync();
        job.sync();

        long announcements = appender.list.stream()
            .filter(e -> e.getLevel() == Level.INFO)
            .filter(e -> e.getFormattedMessage().contains("Sincronização de leituras ativa"))
            .count();
        assertThat(announcements).isEqualTo(1);
        assertThat(appender.list.stream().anyMatch(e -> e.getFormattedMessage().contains("1 linha")))
            .isTrue();
    }

    @Test
    @DisplayName("Avisa quando fica muitos ciclos sem leitura nova")
    void should_ReportSilence_When_NoReadingForManyCycles() {
        ListAppender<ILoggingEvent> appender = attachAppender();
        when(pontoGasRepository.findActiveWithSensor()).thenReturn(List.of(point));
        when(pressureReadingDynamoRepository.findLatest(anyString(), anyInt(), anyLong(), anyLong()))
            .thenReturn(Optional.empty());

        for (int i = 0; i < 12; i++) {
            job.sync();
        }

        long warnings = appender.list.stream()
            .filter(e -> e.getFormattedMessage().contains("sem leitura nova"))
            .count();
        // Uma vez só por sequência de silêncio, não a cada ciclo.
        assertThat(warnings).isEqualTo(1);
    }

    private ListAppender<ILoggingEvent> attachAppender() {
        Logger logger = (Logger) LoggerFactory.getLogger(GasPointReadingSyncJob.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        return appender;
    }

    @Test
    @DisplayName("Job desligado por configuração não toca em nada")
    void should_DoNothing_When_Disabled() {
        ReflectionTestUtils.setField(job, "enabled", false);

        job.sync();

        verify(pontoGasRepository, never()).findActiveWithSensor();
    }
}
