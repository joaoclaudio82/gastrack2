-- =====================================================
-- V13: Seed first SUPER_ADMIN user
-- =====================================================
-- IMPORTANTE: Este seed cria o primeiro SUPER_ADMIN do sistema.
--
-- ANTES de rodar esta migration, você precisa:
-- 1. Criar o usuário no AWS Cognito (via Console ou CLI)
-- 2. Atualizar o cognito_sub abaixo com o SUB real do Cognito
--
-- Para criar o usuário no Cognito via CLI:
-- aws cognito-idp admin-create-user \
--   --user-pool-id YOUR_USER_POOL_ID \
--   --username admin@gastrack.com.br \
--   --user-attributes Name=email,Value=admin@gastrack.com.br Name=email_verified,Value=true Name=given_name,Value=Super Name=family_name,Value=Admin \
--   --desired-delivery-mediums EMAIL
--
-- Para obter o SUB do usuário criado:
-- aws cognito-idp admin-get-user \
--   --user-pool-id YOUR_USER_POOL_ID \
--   --username admin@gastrack.com.br \
--   --query 'UserAttributes[?Name==`sub`].Value' --output text
-- =====================================================

-- Configuração: ATUALIZE ESTES VALORES ANTES DE RODAR!
DO $$
DECLARE
    -- ===========================================
    -- CONFIGURE AQUI OS DADOS DO SUPER_ADMIN
    -- ===========================================
    v_cognito_sub VARCHAR(36) := 'b45854f8-c011-70ad-12ba-a832025d46fc';  -- SUB do Cognito
    v_email VARCHAR(255) := 'admin@gastrack.com.br';          -- Email do SUPER_ADMIN
    v_username VARCHAR(50) := 'superadmin';                   -- Username
    v_first_name VARCHAR(100) := 'Super';                     -- Primeiro nome
    v_last_name VARCHAR(100) := 'Admin';                      -- Sobrenome
    -- ===========================================
BEGIN
    -- Validação: Não permite rodar com placeholder
    IF v_cognito_sub = 'PLACEHOLDER_COGNITO_SUB' THEN
        RAISE EXCEPTION 'ERRO: Você precisa configurar o cognito_sub antes de rodar esta migration!

1. Crie o usuário no Cognito:
   aws cognito-idp admin-create-user --user-pool-id YOUR_POOL_ID --username % --user-attributes Name=email,Value=% Name=email_verified,Value=true --desired-delivery-mediums EMAIL

2. Obtenha o SUB:
   aws cognito-idp admin-get-user --user-pool-id YOUR_POOL_ID --username % --query ''UserAttributes[?Name==`sub`].Value'' --output text

3. Atualize o v_cognito_sub neste arquivo com o valor obtido.
', v_email, v_email, v_email;
    END IF;

    -- Verifica se já existe um SUPER_ADMIN
    IF EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN') THEN
        RAISE NOTICE 'SUPER_ADMIN já existe. Seed ignorado.';
        RETURN;
    END IF;

    -- Verifica se o email já está em uso
    IF EXISTS (SELECT 1 FROM users WHERE email = v_email) THEN
        RAISE EXCEPTION 'Email % já está em uso por outro usuário.', v_email;
    END IF;

    -- Verifica se o cognito_sub já está em uso
    IF EXISTS (SELECT 1 FROM users WHERE cognito_sub = v_cognito_sub) THEN
        RAISE EXCEPTION 'Cognito SUB % já está em uso por outro usuário.', v_cognito_sub;
    END IF;

    -- Insere o SUPER_ADMIN
    INSERT INTO users (
        cognito_sub,
        email,
        username,
        first_name,
        last_name,
        role,
        company_id,
        active,
        created_at,
        updated_at
    ) VALUES (
        v_cognito_sub,
        v_email,
        v_username,
        v_first_name,
        v_last_name,
        'SUPER_ADMIN',
        NULL,  -- SUPER_ADMIN não precisa de company
        TRUE,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'SUPER_ADMIN criado com sucesso!';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Cognito SUB: %', v_cognito_sub;
END $$;
