-- =====================================================
-- V19: Assign default company to orphan users
-- =====================================================
-- Esta migration corrige usuários criados antes do fluxo
-- multi-tenant que estão sem company associada.
--
-- - Cria uma company padrão "GasTrack" se não existir
-- - Atribui essa company aos users não-SUPER_ADMIN sem company
-- =====================================================

DO $$
DECLARE
    v_default_company_id BIGINT;
    v_affected_users INTEGER;
BEGIN
    -- Busca ou cria a company padrão
    SELECT id INTO v_default_company_id
    FROM companies
    WHERE slug = 'gastrack-default';

    IF v_default_company_id IS NULL THEN
        INSERT INTO companies (
            name,
            slug,
            email,
            active,
            created_at,
            updated_at
        ) VALUES (
            'GasTrack (Default)',
            'gastrack-default',
            'contato@gastrack.com.br',
            TRUE,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_default_company_id;

        RAISE NOTICE 'Company padrão criada com ID: %', v_default_company_id;
    ELSE
        RAISE NOTICE 'Company padrão já existe com ID: %', v_default_company_id;
    END IF;

    -- Atualiza usuários órfãos (não-SUPER_ADMIN sem company)
    UPDATE users
    SET company_id = v_default_company_id,
        updated_at = NOW()
    WHERE company_id IS NULL
      AND role != 'SUPER_ADMIN';

    GET DIAGNOSTICS v_affected_users = ROW_COUNT;

    IF v_affected_users > 0 THEN
        RAISE NOTICE 'Atualizados % usuários para a company padrão.', v_affected_users;
    ELSE
        RAISE NOTICE 'Nenhum usuário órfão encontrado.';
    END IF;
END $$;
