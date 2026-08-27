-- Remove o fallback de volume e pressão da linha de gás.
--
-- Os dois eram lidos só quando a linha não tinha casco conectado, e nesse caso
-- devolviam um número inventado (5 L / 140 bar) para uma linha que é apenas
-- tubulação. Litragem sem cilindro não existe no mundo físico: quem tem volume
-- e pressão nominal é o casco, via CylinderModel.
--
-- A V48 já deu um casco de 5 L / 140 bar a toda linha que não tinha nenhum, e
-- abortaria se algum ambiente tivesse fallback fora do default. Então aqui não
-- há mais número dependendo destas colunas — nenhuma linha fica sem valor.
--
-- A partir daqui, linha sem casco conectado não tem volume nem pressão de 100%:
-- os derivados devolvem NULL e o status cai em UNKNOWN, que é a verdade.

ALTER TABLE gas_points DROP COLUMN internal_volume_liters;
ALTER TABLE gas_points DROP COLUMN full_tank_pressure_bar;
