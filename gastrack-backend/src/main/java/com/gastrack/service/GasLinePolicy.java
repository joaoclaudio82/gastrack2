package com.gastrack.service;

import com.gastrack.exceptions.ConflictException;
import com.gastrack.exceptions.ErrorCodes;
import com.gastrack.model.Cylinder;
import com.gastrack.model.CylinderModel;
import com.gastrack.model.PontoGas;
import com.gastrack.repository.CylinderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Invariantes físicas da linha de gás, num lugar só.
 *
 * <p>Existe porque a regra de gás único por manifold nasceu duplicada: estava no cadastro de
 * cilindro mas não no registro de troca, que cria cilindro por outro caminho. Guard replicado é
 * guard que uma hora falta em algum chamador — todos passam por aqui.
 */
@Component
@RequiredArgsConstructor
public class GasLinePolicy {

    private final CylinderRepository cylinderRepository;

    /**
     * Um sensor mede a saída combinada do manifold, então misturar gases na mesma linha torna a
     * leitura fisicamente sem sentido — e perigoso. Todos os cascos de uma linha carregam o
     * mesmo gás.
     *
     * @param excludingCylinderId cilindro que está sendo editado (ignorado na checagem), ou null
     */
    public void validateGasTypeMatchesLine(PontoGas pontoGas, CylinderModel model, Long excludingCylinderId) {
        if (pontoGas == null || model == null || model.getGasType() == null) {
            return;
        }

        cylinderRepository.findByPontoGasIdAndActiveTrue(pontoGas.getId()).stream()
            .filter(c -> excludingCylinderId == null || !excludingCylinderId.equals(c.getId()))
            .map(Cylinder::getCylinderModel)
            .filter(m -> m != null && m.getGasType() != null && m.getGasType() != model.getGasType())
            .findFirst()
            .ifPresent(conflicting -> {
                throw new ConflictException(
                    "Gas point already has cylinders of gas type " + conflicting.getGasType()
                        + "; cannot mix with " + model.getGasType(),
                    ErrorCodes.GAS_TYPE_MISMATCH);
            });
    }
}
