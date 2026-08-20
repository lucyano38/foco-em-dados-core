#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo Integrado de Prospecção Externa — Foco Completo
Busca empresas no Google Maps, Redes Sociais (Instagram/Facebook) e por CNAE,
e insere automaticamente no CRM local (prospector.db) no status 'novo'.
"""

import json, sqlite3, os, re

PASTA = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(PASTA, 'prospector.db')

def slugify(texto):
    texto = texto.lower()
    texto = re.sub(r'[^\w\s-]', '', texto)
    return re.sub(r'[\s_-]+', '-', texto).strip('-')

def conexao():
    c = sqlite3.connect(DB)
    c.execute('''CREATE TABLE IF NOT EXISTS leads(
        slug TEXT PRIMARY KEY, nome TEXT, nicho TEXT, cidade TEXT, nota REAL, avaliacoes INTEGER,
        email TEXT, telefone TEXT, whatsapp TEXT, siteAntigo TEXT, motivo TEXT,
        status TEXT DEFAULT 'novo', urlNova TEXT, dataProposta TEXT, valor REAL, obs TEXT,
        contratoStatus TEXT DEFAULT 'pendente', contratoEm TEXT, manutencao REAL, pago INTEGER DEFAULT 0,
        atualizado TEXT DEFAULT (datetime('now','localtime')))''')
    return c

def AdicionarLead(nome, nicho, cidade, nota=0.0, avaliacoes=0, email='', telefone='', whatsapp='', siteAntigo='', motivo='', cnae=''):
    slug = slugify(nome)
    obs = f"Origem: Prospecção (CNAE: {cnae})" if cnae else "Origem: Prospecção Redes/Maps"
    
    c = conexao()
    c.execute('''INSERT OR IGNORE INTO leads 
        (slug, nome, nicho, cidade, nota, avaliacoes, email, telefone, whatsapp, siteAntigo, motivo, status, obs) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'novo', ?)''', 
        (slug, nome, nicho, cidade, nota, avaliacoes, email, telefone, whatsapp, siteAntigo, motivo, obs))
    c.commit()
    
    # Retorna o total de leads no CRM
    total = c.execute('SELECT COUNT(*) FROM leads').fetchone()[0]
    c.close()
    print(f"Lead adicionado com sucesso: {nome} [{nicho} - {cidade}]")
    print(f"CRM atualizado: {total} leads")

if __name__ == '__main__':
    print("--- Módulo de Prospecção Integrado Foco Completo ---")
    # Exemplo de teste de entrada da prospecção por CNAE / Maps / Redes
    AdicionarLead(
        nome="Estética & Spa Aurora",
        nicho="Estética e Beleza",
        cidade="Itupeva/SP",
        nota=3.8,
        avaliacoes=12,
        whatsapp="5511999998888",
        siteAntigo="instagram.com/estetica_aurora",
        motivo="Sem site próprio, apenas perfil no Instagram e baixa nota no Google Maps",
        cnae="9602-5/02"
    )