BEGIN;

DO $$
DECLARE
    -- Mesma variavel da seed: onde a fixture foi pendurada.
    -- Vazio = a empresa de teste propria da fixture.
    v_target_slug TEXT := COALESCE(
        NULLIF(current_setting('gastrack.fixture_company_slug', TRUE), ''),
        'teste-local-empresa'
    );
    v_owns_company BOOLEAN := FALSE;
    v_company_id BIGINT;
BEGIN
    SELECT id
    INTO v_company_id
    FROM companies
    WHERE slug = v_target_slug
    LIMIT 1;

    IF v_company_id IS NULL THEN
        RAISE NOTICE 'Nenhuma fixture encontrada para remover.';
        RETURN;
    END IF;

    -- A empresa so e descartavel quando foi a fixture que a criou. Pendurada
    -- numa empresa real, apagar companies/users levaria junto dado de gente.
    v_owns_company := (v_target_slug = 'teste-local-empresa');

    -- Tudo que a seed cria carrega o prefixo TESTE-LOCAL-; apagar por prefixo
    -- evita orfao quando a fixture ganha linha ou cilindro novo.
    DELETE FROM cylinders
    WHERE serial_number LIKE 'TESTE-LOCAL-%';

    DELETE FROM equipment
    WHERE asset_tag LIKE 'TESTE-LOCAL-%';

    DELETE FROM gas_points
    WHERE location LIKE 'TESTE-LOCAL-%';

    -- Depois do equipment (que referencia o kit) e antes de contracts e
    -- addresses, que o kit referencia.
    DELETE FROM kit_installations
    WHERE kit_id IN (SELECT id FROM equipment_kits WHERE kit_code LIKE 'TESTE-LOCAL-%');

    DELETE FROM equipment_kits
    WHERE kit_code LIKE 'TESTE-LOCAL-%';

    -- Sem filtro de empresa, igual aos DELETEs acima: a fixture mora numa
    -- empresa por vez, e um cleanup limpa o rastro dela onde quer que esteja.
    -- Escopo misto era o que deixava endereço órfão numa empresa antiga.
    DELETE FROM contract_addresses
    WHERE contract_id IN (
        SELECT id FROM contracts WHERE notes = 'TESTE-LOCAL-FIXTURE'
    );

    DELETE FROM addresses
    WHERE name LIKE 'TESTE-LOCAL-%';

    DELETE FROM contracts
    WHERE notes = 'TESTE-LOCAL-FIXTURE';

    -- Modelo é global, não pertence a uma empresa: com a fixture aplicada em
    -- mais de uma, os cilindros da outra ainda apontam para ele. Só sai quando
    -- ninguém mais referencia.
    DELETE FROM cylinder_models cm
    WHERE cm.codigo LIKE 'TESTE-LOCAL-%'
      AND NOT EXISTS (
          SELECT 1 FROM cylinders cy WHERE cy.cylinder_model_id = cm.id
      );

    IF v_owns_company THEN
        DELETE FROM users WHERE company_id = v_company_id;
        DELETE FROM companies WHERE id = v_company_id;
        RAISE NOTICE 'Fixture removida, junto com a empresa de teste.';
    ELSE
        RAISE NOTICE 'Fixture removida da empresa "%". Empresa e usuarios preservados.',
            v_target_slug;
    END IF;
END $$;

COMMIT;
