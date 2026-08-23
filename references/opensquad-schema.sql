-- Tabela que controla o status atual de cada CNPJ descoberto via CNAE
CREATE TABLE IF NOT EXISTS leads_prospeccao (
    cnpj VARCHAR(14) PRIMARY KEY,
    razao_social VARCHAR(255),
    telefone VARCHAR(20),
    cnae VARCHAR(7),
    status VARCHAR(50) DEFAULT 'disponivel', -- 'disponivel', 'em_abordagem', 'fechado', 'recusado'
    agente_responsavel_id INT,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de auditoria em tempo real (O que o monitor vai acompanhar)
CREATE TABLE IF NOT EXISTS logs_open_squad (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(14) REFERENCES leads_prospeccao(cnpj),
    agente_id INT,
    acao VARCHAR(100), -- Ex: 'Disparou WhatsApp', 'Moveu para Fechado', 'Visualizou Lead'
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresas_cnae ON leads_prospeccao (cnae);
CREATE INDEX IF NOT EXISTS idx_empresas_localizacao ON leads_prospeccao (uf, municipio);
CREATE INDEX IF NOT EXISTS idx_logs_data_acao ON logs_open_squad (data_acao);
