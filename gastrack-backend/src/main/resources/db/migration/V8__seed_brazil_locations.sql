-- Seed Brazil country
INSERT INTO countries (id, name, code, active) VALUES (1, 'Brasil', 'BR', true);

-- Seed Brazilian states (27 total: 26 states + DF)
-- Using IBGE 2-digit codes
INSERT INTO states (id, name, code, abbreviation, country_id, active) VALUES
(1, 'Acre', '12', 'AC', 1, true),
(2, 'Alagoas', '27', 'AL', 1, true),
(3, 'Amapá', '16', 'AP', 1, true),
(4, 'Amazonas', '13', 'AM', 1, true),
(5, 'Bahia', '29', 'BA', 1, true),
(6, 'Ceará', '23', 'CE', 1, true),
(7, 'Distrito Federal', '53', 'DF', 1, true),
(8, 'Espírito Santo', '32', 'ES', 1, true),
(9, 'Goiás', '52', 'GO', 1, true),
(10, 'Maranhão', '21', 'MA', 1, true),
(11, 'Mato Grosso', '51', 'MT', 1, true),
(12, 'Mato Grosso do Sul', '50', 'MS', 1, true),
(13, 'Minas Gerais', '31', 'MG', 1, true),
(14, 'Pará', '15', 'PA', 1, true),
(15, 'Paraíba', '25', 'PB', 1, true),
(16, 'Paraná', '41', 'PR', 1, true),
(17, 'Pernambuco', '26', 'PE', 1, true),
(18, 'Piauí', '22', 'PI', 1, true),
(19, 'Rio de Janeiro', '33', 'RJ', 1, true),
(20, 'Rio Grande do Norte', '24', 'RN', 1, true),
(21, 'Rio Grande do Sul', '43', 'RS', 1, true),
(22, 'Rondônia', '11', 'RO', 1, true),
(23, 'Roraima', '14', 'RR', 1, true),
(24, 'Santa Catarina', '42', 'SC', 1, true),
(25, 'São Paulo', '35', 'SP', 1, true),
(26, 'Sergipe', '28', 'SE', 1, true),
(27, 'Tocantins', '17', 'TO', 1, true);

-- Update sequences to avoid conflicts
SELECT setval('country_id_seq', 100);
SELECT setval('state_id_seq', 100);
