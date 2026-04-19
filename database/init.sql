-- =========================
-- SCHEMA: TEAdmin
-- =========================
CREATE SCHEMA IF NOT EXISTS teadmin;
SET search_path TO teadmin;

-- =========================
-- ENUMS
-- =========================
CREATE TYPE grau_deficiencia_enum AS ENUM ('leve','moderado','severo');
CREATE TYPE status_tratamento_enum AS ENUM ('ativo','finalizado','pausado');
CREATE TYPE dia_semana_enum AS ENUM ('domingo','segunda','terca','quarta','quinta','sexta','sabado');
CREATE TYPE tipo_telefone_enum AS ENUM ('celular','residencial','comercial');

-- =========================
-- TABELAS
-- =========================

CREATE TABLE pacientes (
    id_paciente BIGSERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    sobrenome VARCHAR NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo CHAR(1) NOT NULL,
    cpf CHAR(11) UNIQUE
);

CREATE TABLE responsavel (
    id_responsavel BIGSERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    sobrenome VARCHAR NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo CHAR(1) NOT NULL,
    cpf CHAR(11) UNIQUE NOT NULL,
    email VARCHAR UNIQUE
);

CREATE TABLE paciente_responsavel (
    id_paciente BIGINT NOT NULL,
    id_responsavel BIGINT NOT NULL,
    grau_parentesco VARCHAR NOT NULL,
    responsavel_principal BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_paciente, id_responsavel),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_responsavel) REFERENCES responsavel(id_responsavel)
);

-- 🔥 REGRA: apenas 1 responsável principal por paciente
CREATE UNIQUE INDEX uk_responsavel_principal
ON paciente_responsavel(id_paciente)
WHERE responsavel_principal = true;

-- =========================

CREATE TABLE profissional (
    id_profissional BIGSERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    sobrenome VARCHAR NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo CHAR(1) NOT NULL,
    cpf CHAR(11) UNIQUE NOT NULL,
    conselho VARCHAR NOT NULL,
    num_conselho_profissional VARCHAR NOT NULL,
    uf_num_conselho CHAR(2) NOT NULL,
    data_contratacao DATE,
    fim_contratacao DATE,
    UNIQUE (conselho, num_conselho_profissional, uf_num_conselho)
);

CREATE TABLE recepcionista (
    id_recepcionista BIGSERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    sobrenome VARCHAR NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo CHAR(1) NOT NULL,
    cpf CHAR(11) UNIQUE NOT NULL,
    telefone VARCHAR NOT NULL,
    data_contratacao DATE NOT NULL,
    fim_contratacao DATE,
    tipo_contrato VARCHAR NOT NULL
);

CREATE TABLE status_da_consulta (
    id_status SERIAL PRIMARY KEY,
    status_consulta VARCHAR UNIQUE NOT NULL
);

CREATE TABLE consulta (
    id_consulta BIGSERIAL PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    id_profissional BIGINT NOT NULL,
    id_recepcionista BIGINT NOT NULL,
    id_status INT NOT NULL,
    data_consulta DATE NOT NULL,
    hora_consulta TIME NOT NULL,
    descricao_consulta VARCHAR,
    UNIQUE (id_profissional, data_consulta, hora_consulta),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional),
    FOREIGN KEY (id_recepcionista) REFERENCES recepcionista(id_recepcionista),
    FOREIGN KEY (id_status) REFERENCES status_da_consulta(id_status)
);

-- =========================

CREATE TABLE tipo_deficiente (
    id_tipo BIGSERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL
);

CREATE TABLE deficiencia (
    id_deficiencia BIGSERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    id_tipo BIGINT NOT NULL,
    descricao VARCHAR,
    FOREIGN KEY (id_tipo) REFERENCES tipo_deficiente(id_tipo)
);

CREATE TABLE paciente_deficiencia (
    id_paciente BIGINT NOT NULL,
    id_deficiencia BIGINT NOT NULL,
    grau grau_deficiencia_enum NOT NULL,
    descricao VARCHAR,
    PRIMARY KEY (id_paciente, id_deficiencia),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_deficiencia) REFERENCES deficiencia(id_deficiencia)
);

-- =========================

CREATE TABLE medicamentos (
    id_medicamento BIGSERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    principio_ativo VARCHAR NOT NULL,
    forma VARCHAR NOT NULL,
    dosagem_mg DECIMAL(4,1) NOT NULL,
    colaterais VARCHAR
);

CREATE TABLE paciente_medicamento (
    id_paciente_medicamento BIGSERIAL PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    id_medicamento BIGINT NOT NULL,
    dosagem_mg_recomendada DECIMAL(4,1),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    frequencia VARCHAR NOT NULL,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);

-- =========================

CREATE TABLE tratamento (
    id_tratamento BIGSERIAL PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    id_profissional BIGINT NOT NULL,
    descricao VARCHAR,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status_tratamento status_tratamento_enum NOT NULL,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional)
);

CREATE TABLE diagnostico (
    id_diagnostico BIGSERIAL PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    id_profissional BIGINT NOT NULL,
    data_diagnostico DATE NOT NULL,
    descricao VARCHAR,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional)
);

CREATE TABLE diagnostico_tratamento (
    id_diagnostico BIGINT NOT NULL,
    id_tratamento BIGINT NOT NULL,
    PRIMARY KEY (id_diagnostico, id_tratamento),
    FOREIGN KEY (id_diagnostico) REFERENCES diagnostico(id_diagnostico),
    FOREIGN KEY (id_tratamento) REFERENCES tratamento(id_tratamento)
);

CREATE TABLE tratamento_medicamento (
    id_tratamento BIGINT NOT NULL,
    id_medicamento BIGINT NOT NULL,
    PRIMARY KEY (id_tratamento, id_medicamento),
    FOREIGN KEY (id_tratamento) REFERENCES tratamento(id_tratamento),
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);

-- =========================

CREATE TABLE prontuario (
    id_prontuario BIGSERIAL PRIMARY KEY,
    id_paciente BIGINT NOT NULL,
    id_profissional BIGINT NOT NULL,
    data_registro TIMESTAMP NOT NULL,
    descricao VARCHAR,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional)
);

CREATE TABLE prontuario_medicamento (
    id_prontuario BIGINT NOT NULL,
    id_medicamento BIGINT NOT NULL,
    PRIMARY KEY (id_prontuario, id_medicamento),
    FOREIGN KEY (id_prontuario) REFERENCES prontuario(id_prontuario),
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);

CREATE TABLE prontuario_tratamento (
    id_prontuario BIGINT NOT NULL,
    id_tratamento BIGINT NOT NULL,
    PRIMARY KEY (id_prontuario, id_tratamento),
    FOREIGN KEY (id_prontuario) REFERENCES prontuario(id_prontuario),
    FOREIGN KEY (id_tratamento) REFERENCES tratamento(id_tratamento)
);

-- =========================

CREATE TABLE especialidade (
    id_especialidade SERIAL PRIMARY KEY,
    nome VARCHAR NOT NULL,
    descricao VARCHAR
);

CREATE TABLE profissional_especialidade (
    id_profissional BIGINT NOT NULL,
    id_especialidade BIGINT NOT NULL,
    PRIMARY KEY (id_profissional, id_especialidade),
    FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional),
    FOREIGN KEY (id_especialidade) REFERENCES especialidade(id_especialidade)
);

-- =========================

CREATE TABLE hora_agenda_profissional (
    id_hora_agenda_profissional SERIAL PRIMARY KEY,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL
);

CREATE TABLE dia_agenda_profissional (
    id_dia_agenda_profissional SERIAL PRIMARY KEY,
    dia_da_semana dia_semana_enum UNIQUE NOT NULL
);

CREATE TABLE agenda_profissional (
    id_agenda_profissional BIGSERIAL PRIMARY KEY,
    id_profissional BIGINT NOT NULL,
    id_dia_agenda_profissional BIGINT NOT NULL,
    id_hora_agenda_profissional BIGINT NOT NULL,
    UNIQUE (id_profissional, id_dia_agenda_profissional, id_hora_agenda_profissional),
    FOREIGN KEY (id_profissional) REFERENCES profissional(id_profissional),
    FOREIGN KEY (id_dia_agenda_profissional) REFERENCES dia_agenda_profissional(id_dia_agenda_profissional),
    FOREIGN KEY (id_hora_agenda_profissional) REFERENCES hora_agenda_profissional(id_hora_agenda_profissional)
);

-- =========================

CREATE TABLE telefone_responsavel (
    id_telefone BIGSERIAL PRIMARY KEY,
    id_responsavel BIGINT NOT NULL,
    telefone VARCHAR NOT NULL,
    tipo tipo_telefone_enum NOT NULL,
    UNIQUE (id_responsavel, telefone),
    FOREIGN KEY (id_responsavel) REFERENCES responsavel(id_responsavel)
);