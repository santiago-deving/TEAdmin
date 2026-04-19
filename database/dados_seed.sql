SET search_path TO teadmin;

-- =========================
-- STATUS CONSULTA
-- =========================
INSERT INTO status_da_consulta (status_consulta) VALUES
('agendada'),
('realizada'),
('cancelada');

-- =========================
-- PACIENTES
-- =========================
INSERT INTO pacientes (nome, sobrenome, data_nascimento, sexo, cpf) VALUES
('Lucas','Silva','2015-03-10','M','11111111111'),
('Ana','Souza','2012-07-22','F','22222222222'),
('Pedro','Oliveira','2010-01-15','M','33333333333'),
('Mariana','Costa','2018-11-05','F','44444444444'),
('João','Pereira','2016-09-30','M','55555555555'),
('Carla','Fernandes','2014-06-18','F','66666666666');

-- =========================
-- RESPONSÁVEIS
-- =========================
INSERT INTO responsavel (nome, sobrenome, data_nascimento, sexo, cpf, email) VALUES
('Carlos','Silva','1985-05-10','M','77777777777','carlos@email.com'),
('Juliana','Souza','1987-08-20','F','88888888888','juliana@email.com'),
('Roberto','Oliveira','1980-02-14','M','99999999999','roberto@email.com'),
('Fernanda','Costa','1990-03-22','F','10101010101','fernanda@email.com'),
('Paulo','Pereira','1982-07-12','M','12121212121','paulo@email.com');

-- =========================
-- PACIENTE RESPONSÁVEL
-- =========================
INSERT INTO paciente_responsavel VALUES
(1,1,'pai',true),
(2,2,'mãe',true),
(3,3,'pai',true),
(4,4,'mãe',true),
(5,5,'pai',true),
(6,2,'tia',true);

-- =========================
-- PROFISSIONAIS
-- =========================
INSERT INTO profissional 
(nome, sobrenome, data_nascimento, sexo, cpf, conselho, num_conselho_profissional, uf_num_conselho)
VALUES
('Dr. João','Médico','1980-01-01','M','13131313131','CRM','12345','SP'),
('Dra. Paula','Psicóloga','1985-02-02','F','14141414141','CRP','54321','SP'),
('Carlos','Fisioterapeuta','1988-03-03','M','15151515151','CREFITO','22222','SP'),
('Luciana','Fonoaudióloga','1990-04-04','F','16161616161','CREFONO','33333','SP');

-- =========================
-- RECEPCIONISTA
-- =========================
INSERT INTO recepcionista 
(nome, sobrenome, data_nascimento, sexo, cpf, telefone, data_contratacao, tipo_contrato)
VALUES
('Bruna','Almeida','1995-05-05','F','17171717171','19999999999','2023-01-01','CLT'),
('Rafael','Santos','1992-06-06','M','18181818181','18888888888','2023-01-01','CLT');

-- =========================
-- CONSULTAS
-- =========================
INSERT INTO consulta 
(id_paciente, id_profissional, id_recepcionista, id_status, data_consulta, hora_consulta)
VALUES
(1,1,1,1,'2025-01-10','09:00'),
(2,2,1,2,'2025-01-11','10:00'),
(3,1,2,1,'2025-01-12','11:00'),
(4,3,2,2,'2025-01-13','14:00'),
(5,4,1,1,'2025-01-14','15:00'),
(6,2,2,1,'2025-01-15','16:00');

-- =========================
-- TIPOS DEFICIÊNCIA
-- =========================
INSERT INTO tipo_deficiente (nome) VALUES
('física'),
('intelectual'),
('auditiva');

INSERT INTO deficiencia (nome, id_tipo) VALUES
('paralisia',1),
('autismo',2),
('surdez',3);

-- =========================
-- PACIENTE DEFICIÊNCIA
-- =========================
INSERT INTO paciente_deficiencia VALUES
(1,2,'moderado','TEA nível 2'),
(2,2,'leve',''),
(3,1,'severo',''),
(4,3,'leve','');

-- =========================
-- MEDICAMENTOS
-- =========================
INSERT INTO medicamentos (nome, principio_ativo, forma, dosagem_mg) VALUES
('Ritalina','metilfenidato','comprimido',10),
('Paracetamol','paracetamol','comprimido',500),
('Ibuprofeno','ibuprofeno','comprimido',400);

-- =========================
-- PACIENTE MEDICAMENTO
-- =========================
INSERT INTO paciente_medicamento 
(id_paciente, id_medicamento, dosagem_mg_recomendada, data_inicio, frequencia)
VALUES
(1,1,10,'2025-01-01','2x ao dia'),
(2,2,500,'2025-01-01','se necessário'),
(3,3,400,'2025-01-01','1x ao dia');

-- =========================
-- TRATAMENTO
-- =========================
INSERT INTO tratamento 
(id_paciente, id_profissional, descricao, data_inicio, status_tratamento)
VALUES
(1,2,'Terapia comportamental','2025-01-01','ativo'),
(2,2,'Acompanhamento psicológico','2025-01-01','ativo'),
(3,3,'Fisioterapia motora','2025-01-01','ativo');

-- =========================
-- DIAGNÓSTICO
-- =========================
INSERT INTO diagnostico 
(id_paciente, id_profissional, data_diagnostico, descricao)
VALUES
(1,2,'2025-01-01','TEA'),
(2,2,'2025-01-02','Ansiedade'),
(3,1,'2025-01-03','Paralisia');

-- =========================
-- RELAÇÃO DIAGNÓSTICO/TRATAMENTO
-- =========================
INSERT INTO diagnostico_tratamento VALUES
(1,1),
(2,2),
(3,3);

-- =========================
-- PRONTUÁRIO
-- =========================
INSERT INTO prontuario 
(id_paciente, id_profissional, data_registro, descricao)
VALUES
(1,2,NOW(),'Primeira avaliação'),
(2,2,NOW(),'Consulta inicial'),
(3,1,NOW(),'Avaliação médica');

-- =========================
-- ESPECIALIDADES
-- =========================
INSERT INTO especialidade (nome) VALUES
('Pediatria'),
('Psicologia'),
('Fisioterapia');

INSERT INTO profissional_especialidade VALUES
(1,1),
(2,2),
(3,3);

-- =========================
-- TELEFONES
-- =========================
INSERT INTO telefone_responsavel (id_responsavel, telefone, tipo) VALUES
-- Responsável 1
(1, '11987654321', 'celular'),
(1, '1134567890', 'residencial'),

-- Responsável 2
(2, '11991234567', 'celular'),

-- Responsável 3
(3, '11999887766', 'celular'),
(3, '1144332211', 'comercial'),

-- Responsável 4
(4, '11995554444', 'celular'),

-- Responsável 5
(5, '11993332222', 'celular'),
(5, '1133221100', 'residencial'),

-- Responsável 6
(6, '11990001111', 'celular'),
(6, '1144556677', 'comercial');