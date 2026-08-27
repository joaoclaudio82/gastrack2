-- Fecha a fase 2 da V44: cilindro tem dono explícito e uma única localização.
--
-- Motivação (auditoria #4): o tenant do cilindro resolvia por 3 caminhos
-- (company -> gas_point.address.company -> address.company), replicados na entidade,
-- no service e no JPQL. Com company_id NOT NULL sobra um caminho só.
-- Além disso address_id e gas_point_id podiam divergir (nada validava) — aqui alinhamos.

-- 1) Órfão sem empresa por nenhum caminho não tem dono adivinhável. Em vez de apagar
--    (perderia serial e histórico), a migration falha e pede decisão humana.
DO $$
DECLARE orphans BIGINT;
BEGIN
    SELECT COUNT(*) INTO orphans FROM cylinders WHERE company_id IS NULL;
    IF orphans > 0 THEN
        RAISE EXCEPTION
            'V45 abortada: % cilindro(s) sem company_id. Atribua a empresa dona antes de migrar: SELECT id, serial_number FROM cylinders WHERE company_id IS NULL;',
            orphans;
    END IF;
END $$;

ALTER TABLE cylinders ALTER COLUMN company_id SET NOT NULL;

-- 2) Localização única: quando o cilindro está num ponto, o endereço é o do ponto.
UPDATE cylinders c
SET address_id = pg.address_id
FROM gas_points pg
WHERE c.gas_point_id = pg.id
  AND c.address_id IS DISTINCT FROM pg.address_id;
