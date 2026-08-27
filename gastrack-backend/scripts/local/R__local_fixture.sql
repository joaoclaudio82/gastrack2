DO $$
DECLARE
    v_company_id BIGINT;
    v_admin_user_id BIGINT;
    v_contract_id BIGINT;
    v_address_id BIGINT;
    v_base_point_id BIGINT;
    v_mix_point_id BIGINT;
    v_empty_point_id BIGINT;
    v_model_200_id BIGINT;
    v_model_150_id BIGINT;
    v_city_id BIGINT;
    v_esp_type_id BIGINT;
    v_sensor_type_id BIGINT;
    v_esp_equipment_id BIGINT;
    v_sensor_equipment_id BIGINT;
    -- Empresa de destino. Vazio = cria a empresa de teste propria da fixture.
    -- Preenchido = pendura a fixture numa empresa que ja existe, para dar para
    -- ver o cenario logando com um usuario real (util em producao, onde o
    -- usuario ficticio da fixture nao existe no Cognito).
    -- Definido por PGOPTIONS='-c gastrack.fixture_company_slug=<slug>'; sob o
    -- Flyway a variavel nao existe e o default vale.
    v_target_slug TEXT := NULLIF(current_setting('gastrack.fixture_company_slug', TRUE), '');
    v_existing_slug TEXT;
    v_kit_id BIGINT;
BEGIN
    -- Prefere Fortaleza/CE, mas qualquer cidade das migrations serve.
    SELECT c.id
    INTO v_city_id
    FROM cities c
    JOIN states s ON s.id = c.state_id
    ORDER BY (c.name = 'Fortaleza' AND s.abbreviation = 'CE') DESC, c.id
    LIMIT 1;

    IF v_city_id IS NULL THEN
        RAISE EXCEPTION
            'Nenhuma cidade cadastrada. Rode as migrations completas antes da seed.';
    END IF;

    -- A fixture mora numa empresa por vez: cilindros e equipamentos têm chave
    -- única, então aplicar numa segunda empresa migra uns e duplica outros,
    -- deixando o cenário pela metade nas duas. Melhor recusar do que sujar.
    SELECT c.slug
    INTO v_existing_slug
    FROM gas_points gp
    JOIN addresses a ON a.id = gp.address_id
    JOIN companies c ON c.id = a.company_id
    WHERE gp.location LIKE 'TESTE-LOCAL-%'
    LIMIT 1;

    IF v_existing_slug IS NOT NULL
       AND v_existing_slug IS DISTINCT FROM COALESCE(v_target_slug, 'teste-local-empresa') THEN
        RAISE EXCEPTION
            'Fixture já está na empresa "%". Rode o cleanup antes de aplicar em outra.',
            v_existing_slug;
    END IF;

    IF v_target_slug IS NOT NULL THEN
        SELECT id INTO v_company_id
        FROM companies
        WHERE slug = v_target_slug;

        IF v_company_id IS NULL THEN
            RAISE EXCEPTION
                'Empresa de slug "%" nao existe. Confira gastrack.fixture_company_slug.',
                v_target_slug;
        END IF;

        -- Empresa alheia: nada de criar usuario. O created_by sai de alguem que
        -- ja e da empresa, senao a fixture nao teria como se pendurar nela.
        SELECT id INTO v_admin_user_id
        FROM users
        WHERE company_id = v_company_id
          AND active
        ORDER BY id
        LIMIT 1;

        IF v_admin_user_id IS NULL THEN
            RAISE EXCEPTION
                'Empresa "%" nao tem usuario ativo para assinar os registros da fixture.',
                v_target_slug;
        END IF;

        RAISE NOTICE 'Fixture pendurada na empresa existente "%" (id %).',
            v_target_slug, v_company_id;
    ELSE
        INSERT INTO companies (
            name,
            slug,
            cnpj,
            phone,
            email,
            active,
            stale_reading_threshold_minutes
        ) VALUES (
            'TESTE-LOCAL-EMPRESA',
            'teste-local-empresa',
            '11.111.111/1111-11',
            '+5585999990001',
            'teste-local@gastrack.local',
            TRUE,
            180
        )
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            cnpj = EXCLUDED.cnpj,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            active = TRUE,
            stale_reading_threshold_minutes = EXCLUDED.stale_reading_threshold_minutes;

        SELECT id INTO v_company_id
        FROM companies
        WHERE slug = 'teste-local-empresa';

        INSERT INTO users (
            cognito_sub,
            email,
            username,
            first_name,
            last_name,
            phone_number,
            phone_verified,
            locale,
            timezone,
            active,
            role,
            company_id
        ) VALUES (
            'teste-local-admin@gastrack.local',
            'teste-local-admin@gastrack.local',
            'teste-local-admin@gastrack.local',
            'Teste',
            'Local',
            '+5585999990002',
            TRUE,
            'pt-BR',
            'America/Fortaleza',
            TRUE,
            'ADMIN',
            v_company_id
        )
        ON CONFLICT (cognito_sub) DO UPDATE
        SET email = EXCLUDED.email,
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone_number = EXCLUDED.phone_number,
            phone_verified = EXCLUDED.phone_verified,
            locale = EXCLUDED.locale,
            timezone = EXCLUDED.timezone,
            active = TRUE,
            role = 'ADMIN',
            company_id = v_company_id;

        SELECT id INTO v_admin_user_id
        FROM users
        WHERE cognito_sub = 'teste-local-admin@gastrack.local';
    END IF;

    SELECT id
    INTO v_contract_id
    FROM contracts
    WHERE company_id = v_company_id
      AND notes = 'TESTE-LOCAL-FIXTURE'
    LIMIT 1;

    IF v_contract_id IS NULL THEN
        INSERT INTO contracts (
            company_id,
            contract_number,
            start_date,
            end_date,
            kit_quantity,
            status,
            notes,
            active,
            created_by
        ) VALUES (
            v_company_id,
            'TEMP',
            CURRENT_DATE,
            NULL,
            3,
            'ACTIVE',
            'TESTE-LOCAL-FIXTURE',
            TRUE,
            v_admin_user_id
        )
        RETURNING id INTO v_contract_id;
    ELSE
        UPDATE contracts
        SET start_date = CURRENT_DATE,
            end_date = NULL,
            kit_quantity = 3,
            status = 'ACTIVE',
            active = TRUE,
            created_by = v_admin_user_id
        WHERE id = v_contract_id;
    END IF;

    SELECT id
    INTO v_address_id
    FROM addresses
    WHERE company_id = v_company_id
      AND name = 'TESTE-LOCAL-END-01'
    LIMIT 1;

    IF v_address_id IS NULL THEN
        INSERT INTO addresses (
            company_id,
            name,
            street,
            number,
            complement,
            neighborhood,
            city_id,
            zip_code,
            latitude,
            longitude,
            active
        ) VALUES (
            v_company_id,
            'TESTE-LOCAL-END-01',
            'Rua Local de Teste',
            '123',
            'Galpao QA',
            'Centro',
            v_city_id,
            '60000-000',
            -3.7318620,
            -38.5266690,
            TRUE
        )
        RETURNING id INTO v_address_id;
    ELSE
        UPDATE addresses
        SET street = 'Rua Local de Teste',
            number = '123',
            complement = 'Galpao QA',
            neighborhood = 'Centro',
            city_id = v_city_id,
            zip_code = '60000-000',
            latitude = -3.7318620,
            longitude = -38.5266690,
            active = TRUE
        WHERE id = v_address_id;
    END IF;

    INSERT INTO contract_addresses (contract_id, address_id)
    VALUES (v_contract_id, v_address_id)
    ON CONFLICT DO NOTHING;

    -- Codigo sob o prefixo TESTE-LOCAL-, como todo o resto da fixture. Sem isso
    -- o ON CONFLICT adota um modelo que ja existia no banco e que outros
    -- cilindros usam, e o cleanup passa a mirar dado que nao e nosso.
    INSERT INTO cylinder_models (
        codigo,
        gas_type,
        water_volume_liters,
        capacity_bar,
        active
    ) VALUES
        ('TESTE-LOCAL-O2-50L-200BAR', 'O2', 50.00, 200.00, TRUE),
        ('TESTE-LOCAL-O2-50L-150BAR', 'O2', 50.00, 150.00, TRUE)
    ON CONFLICT (codigo) DO UPDATE
    SET gas_type = EXCLUDED.gas_type,
        water_volume_liters = EXCLUDED.water_volume_liters,
        capacity_bar = EXCLUDED.capacity_bar,
        active = TRUE;

    SELECT id INTO v_model_200_id
    FROM cylinder_models
    WHERE codigo = 'TESTE-LOCAL-O2-50L-200BAR';

    SELECT id INTO v_model_150_id
    FROM cylinder_models
    WHERE codigo = 'TESTE-LOCAL-O2-50L-150BAR';

    SELECT id INTO v_esp_type_id
    FROM equipment_types
    WHERE name = 'ESP32'
    LIMIT 1;

    SELECT id INTO v_sensor_type_id
    FROM equipment_types
    WHERE name = 'Sensor'
    LIMIT 1;

    IF v_esp_type_id IS NULL OR v_sensor_type_id IS NULL THEN
        RAISE EXCEPTION
            'Tipos de equipamento ESP32/Sensor nao encontrados. Verifique as migrations.';
    END IF;

    SELECT id INTO v_base_point_id
    FROM gas_points
    WHERE address_id = v_address_id
      AND location = 'TESTE-LOCAL-LINHA-BASE'
    LIMIT 1;

    IF v_base_point_id IS NULL THEN
        INSERT INTO gas_points (
            address_id,
            location,
            internal_volume_liters,
            full_tank_pressure_bar,
            current_pressure_bar,
            last_reading_at,
            status,
            active
        ) VALUES (
            v_address_id,
            'TESTE-LOCAL-LINHA-BASE',
            5.000,
            140.000,
            120.00,
            NOW() AT TIME ZONE 'UTC',
            'NORMAL',
            TRUE
        )
        RETURNING id INTO v_base_point_id;
    END IF;

    SELECT id INTO v_mix_point_id
    FROM gas_points
    WHERE address_id = v_address_id
      AND location = 'TESTE-LOCAL-LINHA-MIX'
    LIMIT 1;

    IF v_mix_point_id IS NULL THEN
        INSERT INTO gas_points (
            address_id,
            location,
            internal_volume_liters,
            full_tank_pressure_bar,
            current_pressure_bar,
            last_reading_at,
            status,
            active
        ) VALUES (
            v_address_id,
            'TESTE-LOCAL-LINHA-MIX',
            5.000,
            140.000,
            120.00,
            NOW() AT TIME ZONE 'UTC',
            'FULL',
            TRUE
        )
        RETURNING id INTO v_mix_point_id;
    END IF;

    SELECT id INTO v_empty_point_id
    FROM gas_points
    WHERE address_id = v_address_id
      AND location = 'TESTE-LOCAL-LINHA-EMPTY'
    LIMIT 1;

    IF v_empty_point_id IS NULL THEN
        INSERT INTO gas_points (
            address_id,
            location,
            internal_volume_liters,
            full_tank_pressure_bar,
            current_pressure_bar,
            last_reading_at,
            status,
            active
        ) VALUES (
            v_address_id,
            'TESTE-LOCAL-LINHA-EMPTY',
            5.000,
            140.000,
            NULL,
            NULL,
            'UNKNOWN',
            TRUE
        )
        RETURNING id INTO v_empty_point_id;
    END IF;

    UPDATE gas_points
    SET internal_volume_liters = 5.000,
        full_tank_pressure_bar = 140.000,
        current_pressure_bar = 120.00,
        last_reading_at = NOW() AT TIME ZONE 'UTC',
        status = 'NORMAL',
        active = TRUE
    WHERE id = v_base_point_id;

    UPDATE gas_points
    SET internal_volume_liters = 5.000,
        full_tank_pressure_bar = 140.000,
        current_pressure_bar = 120.00,
        last_reading_at = NOW() AT TIME ZONE 'UTC',
        status = 'FULL',
        active = TRUE
    WHERE id = v_mix_point_id;

    UPDATE gas_points
    SET internal_volume_liters = 5.000,
        full_tank_pressure_bar = 140.000,
        current_pressure_bar = NULL,
        last_reading_at = NULL,
        status = 'UNKNOWN',
        active = TRUE
    WHERE id = v_empty_point_id;

    -- O kit é quem dá dono ao ESP32: PressureReadingServiceImpl resolve a posse
    -- por equipment -> kit -> contract -> company. Sem kit, owner é nulo e
    -- /pressure/readings nega todo mundo que não seja SUPER_ADMIN — o Analytics
    -- fica inutilizável mesmo com a linha e o sensor no lugar.
    SELECT id
    INTO v_kit_id
    FROM equipment_kits
    WHERE kit_code = 'TESTE-LOCAL-KIT-01'
    LIMIT 1;

    IF v_kit_id IS NULL THEN
        INSERT INTO equipment_kits (
            contract_id,
            address_id,
            kit_code,
            installation_date,
            status,
            notes,
            active,
            created_by
        ) VALUES (
            v_contract_id,
            v_address_id,
            'TESTE-LOCAL-KIT-01',
            -- installation_date é o piso de posse das leituras: nada anterior a
            -- ela aparece. 30 dias atrás dá janela para o gráfico ter história.
            CURRENT_DATE - 30,
            'INSTALLED',
            'TESTE-LOCAL-FIXTURE',
            TRUE,
            v_admin_user_id
        )
        RETURNING id INTO v_kit_id;
    ELSE
        UPDATE equipment_kits
        SET contract_id = v_contract_id,
            address_id = v_address_id,
            installation_date = CURRENT_DATE - 30,
            status = 'INSTALLED',
            notes = 'TESTE-LOCAL-FIXTURE',
            active = TRUE,
            created_by = v_admin_user_id
        WHERE id = v_kit_id;
    END IF;

    SELECT id INTO v_esp_equipment_id
    FROM equipment
    WHERE asset_tag = 'TESTE-LOCAL-ESP-01'
    LIMIT 1;

    IF v_esp_equipment_id IS NULL THEN
        INSERT INTO equipment (
            equipment_kit_id,
            gas_point_id,
            parent_equipment_id,
            sensor_port,
            codigo_sensor,
            equipment_type_id,
            asset_tag,
            description,
            serial_number,
            manufacturer,
            model,
            condition,
            notes,
            active,
            created_by
        ) VALUES (
            v_kit_id,
            NULL,
            NULL,
            NULL,
            NULL,
            v_esp_type_id,
            'TESTE-LOCAL-ESP-01',
            'ESP32 local para simular leituras do sensor',
            'TESTE-LOCAL-ESP-01',
            'Inteligas',
            'ESP32',
            'NEW',
            'TESTE-LOCAL-FIXTURE',
            TRUE,
            v_admin_user_id
        )
        RETURNING id INTO v_esp_equipment_id;
    ELSE
        UPDATE equipment
        SET equipment_kit_id = v_kit_id,
            equipment_type_id = v_esp_type_id,
            description = 'ESP32 local para simular leituras do sensor',
            serial_number = 'TESTE-LOCAL-ESP-01',
            manufacturer = 'Inteligas',
            model = 'ESP32',
            condition = 'NEW',
            notes = 'TESTE-LOCAL-FIXTURE',
            active = TRUE,
            created_by = v_admin_user_id,
            gas_point_id = NULL,
            parent_equipment_id = NULL,
            sensor_port = NULL,
            codigo_sensor = NULL
        WHERE id = v_esp_equipment_id;
    END IF;

    SELECT id INTO v_sensor_equipment_id
    FROM equipment
    WHERE asset_tag = 'TESTE-LOCAL-SENSOR-01'
    LIMIT 1;

    IF v_sensor_equipment_id IS NULL THEN
        INSERT INTO equipment (
            equipment_kit_id,
            gas_point_id,
            parent_equipment_id,
            sensor_port,
            codigo_sensor,
            equipment_type_id,
            asset_tag,
            description,
            serial_number,
            manufacturer,
            model,
            condition,
            notes,
            active,
            created_by
        ) VALUES (
            v_kit_id,
            v_mix_point_id,
            v_esp_equipment_id,
            1,
            'TESTE-LOCAL-ESP-01|1',
            v_sensor_type_id,
            'TESTE-LOCAL-SENSOR-01',
            'Sensor logico local porta 1 para a linha mix',
            'TESTE-LOCAL-SENSOR-01',
            'Inteligas',
            'Sensor',
            'NEW',
            'TESTE-LOCAL-FIXTURE',
            TRUE,
            v_admin_user_id
        )
        RETURNING id INTO v_sensor_equipment_id;
    ELSE
        UPDATE equipment
        SET equipment_kit_id = v_kit_id,
            gas_point_id = v_mix_point_id,
            parent_equipment_id = v_esp_equipment_id,
            sensor_port = 1,
            codigo_sensor = 'TESTE-LOCAL-ESP-01|1',
            equipment_type_id = v_sensor_type_id,
            description = 'Sensor logico local porta 1 para a linha mix',
            serial_number = 'TESTE-LOCAL-SENSOR-01',
            manufacturer = 'Inteligas',
            model = 'Sensor',
            condition = 'NEW',
            notes = 'TESTE-LOCAL-FIXTURE',
            active = TRUE,
            created_by = v_admin_user_id
        WHERE id = v_sensor_equipment_id;
    END IF;

    INSERT INTO cylinders (
        cylinder_model_id,
        company_id,
        gas_point_id,
        address_id,
        serial_number,
        active,
        connected
    ) VALUES
        (v_model_200_id, v_company_id, v_base_point_id, v_address_id, 'TESTE-LOCAL-CIL-001', TRUE, TRUE),
        (v_model_200_id, v_company_id, v_base_point_id, v_address_id, 'TESTE-LOCAL-CIL-002', TRUE, TRUE),
        (v_model_200_id, v_company_id, v_base_point_id, v_address_id, 'TESTE-LOCAL-CIL-003', TRUE, TRUE),
        (v_model_200_id, v_company_id, v_mix_point_id, v_address_id, 'TESTE-LOCAL-CIL-101', TRUE, TRUE),
        (v_model_200_id, v_company_id, v_mix_point_id, v_address_id, 'TESTE-LOCAL-CIL-102', TRUE, TRUE),
        (v_model_150_id, v_company_id, v_mix_point_id, v_address_id, 'TESTE-LOCAL-CIL-103', TRUE, TRUE)
    ON CONFLICT (serial_number) DO UPDATE
    SET cylinder_model_id = EXCLUDED.cylinder_model_id,
        company_id = EXCLUDED.company_id,
        gas_point_id = EXCLUDED.gas_point_id,
        address_id = EXCLUDED.address_id,
        active = TRUE,
        connected = EXCLUDED.connected;

    RAISE NOTICE 'Fixture aplicada.';
    IF v_target_slug IS NULL THEN
        RAISE NOTICE 'Usuario local: teste-local-admin@gastrack.local / ajuste DEV_ADMIN_USERNAME para esse valor.';
        RAISE NOTICE 'Esse usuario nao existe no Cognito: serve para banco local, nao para logar em producao.';
    ELSE
        RAISE NOTICE 'Entre com um usuario que ja seja da empresa "%".', v_target_slug;
    END IF;
    RAISE NOTICE 'Linhas: TESTE-LOCAL-LINHA-BASE, TESTE-LOCAL-LINHA-MIX, TESTE-LOCAL-LINHA-EMPTY.';
END $$;

