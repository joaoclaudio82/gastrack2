-- Dá um casco de verdade às linhas que nunca tiveram nenhum cadastrado.
--
-- Essas linhas viviam do fallback gravado no ponto (5 L / 140 bar), que é um
-- número inventado: quem tem volume e pressão nominal é o cilindro, via
-- CylinderModel. Pior, o fallback chegou a produzir nível e alarme fabricados
-- numa linha com sensor publicando e zero casco — 40 bar sobre 140 bar de
-- ficção viravam "28% / LOW" no painel de um cliente.
--
-- O casco criado é 5 L / 150 bar: é o cilindro real da operação, que chega
-- entre 139 e 150 bar. O nominal de um CylinderModel é um valor só e o "100%"
-- é o cheio, então 150 — um casco a 139 bar fica em ~93%, que é o certo.
--
-- Isso MUDA o nível das linhas que hoje leem sobre o fallback de 140 bar, e é
-- de propósito: o 140 não era a pressão de casco nenhum, era um número
-- inventado. Efeito conhecido, uma linha só tem leitura hoje — a IFCE da
-- biosphere-gas sai de 28,7% para 26,8% (40,19 bar sobre 150 em vez de 140).
-- As outras cinco linhas sem casco não têm leitura, então nada muda nelas.
--
-- Precisa vir antes da V49, que remove as colunas de fallback.

DO $$
DECLARE
    v_model_id BIGINT;
    v_created BIGINT;
    v_configured BIGINT;
BEGIN
    -- CONVENTIONS §7: a trava mora aqui, na primeira migration que escreve.
    -- O default 5 L / 140 bar a gente sabe o que é: ficção, e trocá-la pelo
    -- casco real é o objetivo. Fallback FORA do default é outra coisa — alguém
    -- o ajustou à mão, e decidir o destino desse valor é humano.
    SELECT COUNT(*) INTO v_configured
    FROM gas_points
    WHERE internal_volume_liters IS DISTINCT FROM 5.000
       OR full_tank_pressure_bar IS DISTINCT FROM 140.000;

    IF v_configured > 0 THEN
        RAISE EXCEPTION
            'V48 abortada: % linha(s) com fallback fora do default de 5 L / 140 bar. O backfill mudaria o número delas. Rode: SELECT id, location, internal_volume_liters, full_tank_pressure_bar FROM gas_points WHERE internal_volume_liters IS DISTINCT FROM 5.000 OR full_tank_pressure_bar IS DISTINCT FROM 140.000;',
            v_configured;
    END IF;

    INSERT INTO cylinder_models (codigo, gas_type, water_volume_liters, capacity_bar, active)
    VALUES ('O2-5L-150BAR', 'O2', 5.00, 150.00, TRUE)
    ON CONFLICT (codigo) DO NOTHING;

    SELECT id INTO v_model_id FROM cylinder_models WHERE codigo = 'O2-5L-150BAR';

    -- Só linha com ZERO cilindro ativo. Linha que tem casco com a válvula
    -- fechada é estado operacional legítimo — não pode ganhar casco fantasma.
    WITH sem_casco AS (
        SELECT gp.id AS gas_point_id, gp.address_id, a.company_id
        FROM gas_points gp
        JOIN addresses a ON a.id = gp.address_id
        WHERE NOT EXISTS (
            SELECT 1 FROM cylinders cy
            WHERE cy.gas_point_id = gp.id AND cy.active
        )
    )
    INSERT INTO cylinders (
        cylinder_model_id, company_id, gas_point_id, address_id,
        serial_number, active, connected
    )
    SELECT v_model_id, sc.company_id, sc.gas_point_id, sc.address_id,
           'BACKFILL-GP-' || sc.gas_point_id, TRUE, TRUE
    FROM sem_casco sc;

    GET DIAGNOSTICS v_created = ROW_COUNT;
    RAISE NOTICE 'V48: % linha(s) sem casco receberam um cilindro 5 L / 150 bar.', v_created;
END $$;
