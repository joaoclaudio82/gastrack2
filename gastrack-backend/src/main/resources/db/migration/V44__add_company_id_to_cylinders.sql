-- Cilindro passa a pertencer a uma empresa explicitamente (dono não mais derivado da instalação).
-- Fase 1: coluna nullable + backfill dos existentes. O NOT NULL fica para uma migration futura,
-- depois que os órfãos legados (em estoque, sem ponto/endereço) receberem uma empresa.

ALTER TABLE cylinders ADD COLUMN company_id BIGINT;

ALTER TABLE cylinders
    ADD CONSTRAINT fk_cylinders_company
    FOREIGN KEY (company_id) REFERENCES companies (id);

CREATE INDEX idx_cylinders_company_id ON cylinders (company_id);

-- Backfill 1: empresa via ponto de gás instalado (ponto -> endereço -> empresa).
UPDATE cylinders c
SET company_id = a.company_id
FROM gas_points pg
JOIN addresses a ON a.id = pg.address_id
WHERE c.gas_point_id = pg.id
  AND c.company_id IS NULL;

-- Backfill 2: legado via vínculo direto de endereço.
UPDATE cylinders c
SET company_id = a.company_id
FROM addresses a
WHERE c.address_id = a.id
  AND c.company_id IS NULL;
