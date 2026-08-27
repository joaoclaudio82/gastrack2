-- Cilindro aberto (fornecendo) x fechado (reserva na linha).
--
-- A soma de volume da linha só é fisicamente válida para os cascos abertos no manifold:
-- um cilindro de válvula fechada não está na pressão medida pelo sensor, então não pode
-- entrar no volume que alimenta a previsão de autonomia.
--
-- Default true: todo cilindro já cadastrado estava sendo contado como aberto, que era o
-- comportamento anterior — a migration não muda nenhum número existente.

ALTER TABLE cylinders
    ADD COLUMN connected BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX idx_cylinders_gas_point_connected
    ON cylinders (gas_point_id, connected)
    WHERE gas_point_id IS NOT NULL;
