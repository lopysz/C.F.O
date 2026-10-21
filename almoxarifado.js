/* ===== Gaveta: Almoxarifado Operacional ===== */
const dias = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const hoje = () => dias(0);

// Planilha de EPIs
CFO.modules.epi = CFO.sheet({
  key: 'epi', moves: true, qty: 'qtd',
  columns: [
    { k: 'item', label: 'Item' }, { k: 'ca', label: 'CA' }, { k: 'tam', label: 'Tamanho' },
    { k: 'qtd', label: 'Estoque', type: 'number' }, { k: 'min', label: 'Estoque mínimo', type: 'number' }
  ],
  dash: (rows, movs) => {
    const lim = dias(-30), rec = movs.filter(m => m.data.slice(0, 10) >= lim);
    const soma = t => rec.filter(m => m.tipo === t).reduce((a, m) => a + m.qtd, 0);
    return [['Itens cadastrados', rows.length], ['Estoque baixo', rows.filter(r => r.qtd <= r.min).length, 'warn'],
            ['Entradas (30 dias)', soma('Entrada')], ['Saídas (30 dias)', soma('Saída')]];
  }
});

// Planilha de contratos da empresa
CFO.modules.contratos = CFO.sheet({
  key: 'contratos',
  columns: [
    { k: 'nome', label: 'Contrato' }, { k: 'parte', label: 'Cliente/Fornecedor' },
    { k: 'ini', label: 'Início', type: 'date' }, { k: 'fim', label: 'Término', type: 'date' },
    { k: 'valor', label: 'Valor (R$)', type: 'number' },
    { k: 'status', label: 'Status', options: ['Ativo', 'Suspenso', 'Encerrado'] }
  ],
  dash: rows => {
    const at = rows.filter(r => r.status === 'Ativo');
    return [['Contratos ativos', at.length],
            ['Vencem em 30 dias', at.filter(r => r.fim >= hoje() && r.fim <= dias(30)).length, 'warn'],
            ['Vencidos', at.filter(r => r.fim && r.fim < hoje()).length, 'warn'],
            ['Valor ativo', 'R$ ' + at.reduce((a, r) => a + r.valor, 0).toLocaleString('pt-BR')]];
  }
});
