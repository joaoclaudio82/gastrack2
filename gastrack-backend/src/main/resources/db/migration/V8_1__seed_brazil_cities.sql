-- Seed Brazilian cities (capitals and major cities)
-- Using IBGE 7-digit codes

-- Acre (state_id = 1)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(1, 'Rio Branco', '1200401', 1, true),
(2, 'Cruzeiro do Sul', '1200203', 1, true),
(3, 'Sena Madureira', '1200500', 1, true),
(4, 'Tarauacá', '1200609', 1, true),
(5, 'Feijó', '1200302', 1, true);

-- Alagoas (state_id = 2)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(6, 'Maceió', '2704302', 2, true),
(7, 'Arapiraca', '2700300', 2, true),
(8, 'Rio Largo', '2707701', 2, true),
(9, 'Palmeira dos Índios', '2706307', 2, true),
(10, 'União dos Palmares', '2709301', 2, true);

-- Amapá (state_id = 3)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(11, 'Macapá', '1600303', 3, true),
(12, 'Santana', '1600600', 3, true),
(13, 'Laranjal do Jari', '1600279', 3, true),
(14, 'Oiapoque', '1600501', 3, true),
(15, 'Porto Grande', '1600535', 3, true);

-- Amazonas (state_id = 4)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(16, 'Manaus', '1302603', 4, true),
(17, 'Parintins', '1303403', 4, true),
(18, 'Itacoatiara', '1301902', 4, true),
(19, 'Manacapuru', '1302504', 4, true),
(20, 'Coari', '1301209', 4, true);

-- Bahia (state_id = 5)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(21, 'Salvador', '2927408', 5, true),
(22, 'Feira de Santana', '2910800', 5, true),
(23, 'Vitória da Conquista', '2933307', 5, true),
(24, 'Camaçari', '2905701', 5, true),
(25, 'Itabuna', '2914802', 5, true),
(26, 'Juazeiro', '2918407', 5, true),
(27, 'Lauro de Freitas', '2919207', 5, true),
(28, 'Ilhéus', '2913606', 5, true);

-- Ceará (state_id = 6)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(29, 'Fortaleza', '2304400', 6, true),
(30, 'Caucaia', '2303709', 6, true),
(31, 'Juazeiro do Norte', '2307304', 6, true),
(32, 'Maracanaú', '2307650', 6, true),
(33, 'Sobral', '2312908', 6, true),
(34, 'Crato', '2304202', 6, true);

-- Distrito Federal (state_id = 7)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(35, 'Brasília', '5300108', 7, true);

-- Espírito Santo (state_id = 8)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(36, 'Vitória', '3205309', 8, true),
(37, 'Vila Velha', '3205200', 8, true),
(38, 'Serra', '3205002', 8, true),
(39, 'Cariacica', '3201308', 8, true),
(40, 'Cachoeiro de Itapemirim', '3201209', 8, true),
(41, 'Linhares', '3203205', 8, true);

-- Goiás (state_id = 9)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(42, 'Goiânia', '5208707', 9, true),
(43, 'Aparecida de Goiânia', '5201405', 9, true),
(44, 'Anápolis', '5201108', 9, true),
(45, 'Rio Verde', '5218805', 9, true),
(46, 'Luziânia', '5212501', 9, true),
(47, 'Águas Lindas de Goiás', '5200258', 9, true);

-- Maranhão (state_id = 10)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(48, 'São Luís', '2111300', 10, true),
(49, 'Imperatriz', '2105302', 10, true),
(50, 'São José de Ribamar', '2111201', 10, true),
(51, 'Timon', '2112209', 10, true),
(52, 'Caxias', '2103000', 10, true),
(53, 'Codó', '2103307', 10, true);

-- Mato Grosso (state_id = 11)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(54, 'Cuiabá', '5103403', 11, true),
(55, 'Várzea Grande', '5108402', 11, true),
(56, 'Rondonópolis', '5107602', 11, true),
(57, 'Sinop', '5107909', 11, true),
(58, 'Tangará da Serra', '5107958', 11, true),
(59, 'Cáceres', '5102504', 11, true);

-- Mato Grosso do Sul (state_id = 12)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(60, 'Campo Grande', '5002704', 12, true),
(61, 'Dourados', '5003702', 12, true),
(62, 'Três Lagoas', '5008305', 12, true),
(63, 'Corumbá', '5003207', 12, true),
(64, 'Ponta Porã', '5006606', 12, true),
(65, 'Naviraí', '5005707', 12, true);

-- Minas Gerais (state_id = 13)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(66, 'Belo Horizonte', '3106200', 13, true),
(67, 'Uberlândia', '3170206', 13, true),
(68, 'Contagem', '3118601', 13, true),
(69, 'Juiz de Fora', '3136702', 13, true),
(70, 'Betim', '3106705', 13, true),
(71, 'Montes Claros', '3143302', 13, true),
(72, 'Ribeirão das Neves', '3154606', 13, true),
(73, 'Uberaba', '3170107', 13, true),
(74, 'Governador Valadares', '3127701', 13, true),
(75, 'Ipatinga', '3131307', 13, true);

-- Pará (state_id = 14)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(76, 'Belém', '1501402', 14, true),
(77, 'Ananindeua', '1500800', 14, true),
(78, 'Santarém', '1506807', 14, true),
(79, 'Marabá', '1504208', 14, true),
(80, 'Parauapebas', '1505536', 14, true),
(81, 'Castanhal', '1502400', 14, true);

-- Paraíba (state_id = 15)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(82, 'João Pessoa', '2507507', 15, true),
(83, 'Campina Grande', '2504009', 15, true),
(84, 'Santa Rita', '2513703', 15, true),
(85, 'Patos', '2510808', 15, true),
(86, 'Bayeux', '2501807', 15, true),
(87, 'Cabedelo', '2503209', 15, true);

-- Paraná (state_id = 16)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(88, 'Curitiba', '4106902', 16, true),
(89, 'Londrina', '4113700', 16, true),
(90, 'Maringá', '4115200', 16, true),
(91, 'Ponta Grossa', '4119905', 16, true),
(92, 'Cascavel', '4104808', 16, true),
(93, 'São José dos Pinhais', '4125506', 16, true),
(94, 'Foz do Iguaçu', '4108304', 16, true),
(95, 'Colombo', '4105805', 16, true);

-- Pernambuco (state_id = 17)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(96, 'Recife', '2611606', 17, true),
(97, 'Jaboatão dos Guararapes', '2607901', 17, true),
(98, 'Olinda', '2609600', 17, true),
(99, 'Caruaru', '2604106', 17, true),
(100, 'Petrolina', '2611101', 17, true),
(101, 'Paulista', '2610707', 17, true),
(102, 'Cabo de Santo Agostinho', '2602902', 17, true);

-- Piauí (state_id = 18)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(103, 'Teresina', '2211001', 18, true),
(104, 'Parnaíba', '2207702', 18, true),
(105, 'Picos', '2208007', 18, true),
(106, 'Piripiri', '2208403', 18, true),
(107, 'Floriano', '2203909', 18, true);

-- Rio de Janeiro (state_id = 19)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(108, 'Rio de Janeiro', '3304557', 19, true),
(109, 'São Gonçalo', '3304904', 19, true),
(110, 'Duque de Caxias', '3301702', 19, true),
(111, 'Nova Iguaçu', '3303500', 19, true),
(112, 'Niterói', '3303302', 19, true),
(113, 'Belford Roxo', '3300456', 19, true),
(114, 'Campos dos Goytacazes', '3301009', 19, true),
(115, 'São João de Meriti', '3305109', 19, true),
(116, 'Petrópolis', '3303906', 19, true);

-- Rio Grande do Norte (state_id = 20)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(117, 'Natal', '2408102', 20, true),
(118, 'Mossoró', '2408003', 20, true),
(119, 'Parnamirim', '2403251', 20, true),
(120, 'São Gonçalo do Amarante', '2412005', 20, true),
(121, 'Ceará-Mirim', '2402600', 20, true);

-- Rio Grande do Sul (state_id = 21)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(122, 'Porto Alegre', '4314902', 21, true),
(123, 'Caxias do Sul', '4305108', 21, true),
(124, 'Pelotas', '4314407', 21, true),
(125, 'Canoas', '4304606', 21, true),
(126, 'Santa Maria', '4316907', 21, true),
(127, 'Gravataí', '4309209', 21, true),
(128, 'Viamão', '4323002', 21, true),
(129, 'Novo Hamburgo', '4313409', 21, true);

-- Rondônia (state_id = 22)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(130, 'Porto Velho', '1100205', 22, true),
(131, 'Ji-Paraná', '1100122', 22, true),
(132, 'Ariquemes', '1100023', 22, true),
(133, 'Vilhena', '1100304', 22, true),
(134, 'Cacoal', '1100049', 22, true);

-- Roraima (state_id = 23)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(135, 'Boa Vista', '1400100', 23, true),
(136, 'Rorainópolis', '1400472', 23, true),
(137, 'Caracaraí', '1400209', 23, true),
(138, 'Alto Alegre', '1400050', 23, true);

-- Santa Catarina (state_id = 24)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(139, 'Florianópolis', '4205407', 24, true),
(140, 'Joinville', '4209102', 24, true),
(141, 'Blumenau', '4202404', 24, true),
(142, 'São José', '4216602', 24, true),
(143, 'Chapecó', '4204202', 24, true),
(144, 'Itajaí', '4208203', 24, true),
(145, 'Criciúma', '4204608', 24, true),
(146, 'Jaraguá do Sul', '4208906', 24, true);

-- São Paulo (state_id = 25)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(147, 'São Paulo', '3550308', 25, true),
(148, 'Guarulhos', '3518800', 25, true),
(149, 'Campinas', '3509502', 25, true),
(150, 'São Bernardo do Campo', '3548708', 25, true),
(151, 'Santo André', '3547809', 25, true),
(152, 'Osasco', '3534401', 25, true),
(153, 'Ribeirão Preto', '3543402', 25, true),
(154, 'Sorocaba', '3552205', 25, true),
(155, 'São José dos Campos', '3549904', 25, true),
(156, 'Santos', '3548500', 25, true),
(157, 'Mauá', '3529401', 25, true),
(158, 'São José do Rio Preto', '3549805', 25, true),
(159, 'Mogi das Cruzes', '3530508', 25, true),
(160, 'Diadema', '3513801', 25, true);

-- Sergipe (state_id = 26)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(161, 'Aracaju', '2800308', 26, true),
(162, 'Nossa Senhora do Socorro', '2804805', 26, true),
(163, 'Lagarto', '2803500', 26, true),
(164, 'Itabaiana', '2802908', 26, true),
(165, 'São Cristóvão', '2806701', 26, true);

-- Tocantins (state_id = 27)
INSERT INTO cities (id, name, code, state_id, active) VALUES
(166, 'Palmas', '1721000', 27, true),
(167, 'Araguaína', '1702109', 27, true),
(168, 'Gurupi', '1709500', 27, true),
(169, 'Porto Nacional', '1718204', 27, true),
(170, 'Paraíso do Tocantins', '1716109', 27, true);

-- Update city sequence to avoid conflicts
SELECT setval('city_id_seq', 1000);
