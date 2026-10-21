/* ===== Fábrica de planilhas: tabela + dashboard + importar/exportar =====
   cfg: { key, columns:[{k,label,type,options}], dash(rows,movs), moves, qty } */
CFO.sheet = cfg => body => {
  const K = cfg.key, first = cfg.columns[0];
  let rows = CFO.store.get(K, []), movs = CFO.store.get(K + ':mov', []), q = '';

  const save = () => { CFO.store.set(K, rows); CFO.store.set(K + ':mov', movs); draw(); };
  const clean = d => { cfg.columns.forEach(c => { if (c.type === 'number') d[c.k] = +d[c.k] || 0; }); return d; };
  const field = (c, v = '') => c.options
    ? `<label>${c.label}<select name="${c.k}">${c.options.map(o => `<option ${o == v ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`
    : `<label>${c.label}<input name="${c.k}" type="${c.type || 'text'}" step="any" value="${CFO.esc(v)}" ${c === first ? 'required' : ''}></label>`;
  const form = (r = {}) => cfg.columns.map(c => field(c, r[c.k])).join('');

  function draw() {
    const list = rows.filter(r => JSON.stringify(Object.values(r)).toLowerCase().includes(q));
    body.innerHTML = `
      <div class="cards">${cfg.dash(rows, movs).map(d => `<div class="card ${d[2] || ''}"><small>${d[0]}</small><b>${d[1]}</b></div>`).join('')}</div>
      <div class="bar">
        <input id="q" type="search" placeholder="Buscar..." value="${CFO.esc(q)}">
        <button id="add">+ Adicionar</button>
        <button id="imp" class="ghost">Importar</button>
        <button id="exp" class="ghost">Exportar</button>
        <input id="file" type="file" accept=".xlsx,.xls,.csv" hidden>
      </div>
      <div class="tw"><table><thead><tr>${cfg.columns.map(c => `<th>${c.label}</th>`).join('')}<th></th></tr></thead><tbody>
        ${list.map(r => `<tr>${cfg.columns.map(c => `<td>${CFO.esc(r[c.k])}</td>`).join('')}
          <td class="act">${cfg.moves ? `<button data-m="${r.id}" title="Entrada/Saída">⇅</button>` : ''}<button data-e="${r.id}" title="Editar">✎</button><button data-d="${r.id}" title="Excluir">🗑</button></td></tr>`).join('')
          || '<tr><td colspan="99" class="empty">Nenhum registro. Adicione um item ou importe uma planilha.</td></tr>'}
      </tbody></table></div>
      ${cfg.moves && movs.length ? `<ul class="log"><b>Últimas movimentações</b>${movs.slice(-5).reverse().map(m => `<li>${m.tipo}: ${CFO.esc(m.item)} (${m.qtd}) - ${CFO.esc(m.resp)} - ${m.data.slice(0, 10)}</li>`).join('')}</ul>` : ''}`;
    bind();
  }

  function bind() {
    const $ = s => body.querySelector(s), find = id => rows.find(r => r.id === id);
    $('#q').oninput = e => { q = e.target.value.toLowerCase(); draw(); const n = $('#q'); n.focus(); n.setSelectionRange(99, 99); };
    $('#add').onclick = () => CFO.dialog('Novo registro', form(), d => { rows.push({ id: Date.now() + Math.random().toString(36).slice(2, 5), ...clean(d) }); save(); });
    body.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const r = find(b.dataset.e); CFO.dialog('Editar registro', form(r), d => { Object.assign(r, clean(d)); save(); }); });
    body.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (confirm('Excluir este registro?')) { rows = rows.filter(r => r.id !== b.dataset.d); save(); } });
    body.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      const r = find(b.dataset.m);
      CFO.dialog('Movimentar: ' + r[first.k],
        `<label>Tipo<select name="tipo"><option>Saída</option><option>Entrada</option></select></label>
         <label>Quantidade<input name="qtd" type="number" min="1" required></label>
         <label>Responsável<input name="resp"></label>`,
        d => { const n = +d.qtd; r[cfg.qty] = (+r[cfg.qty] || 0) + (d.tipo === 'Entrada' ? n : -n);
               movs.push({ item: r[first.k], tipo: d.tipo, qtd: n, resp: d.resp, data: new Date().toISOString() }); save(); });
    });
    $('#exp').onclick = () => {
      const ws = XLSX.utils.json_to_sheet(rows.map(r => Object.fromEntries(cfg.columns.map(c => [c.label, r[c.k]]))));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, K); XLSX.writeFile(wb, K + '.xlsx');
    };
    $('#imp').onclick = () => $('#file').click();
    $('#file').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      const wb = XLSX.read(await f.arrayBuffer());
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
      json.forEach(j => {
        const vals = Object.values(j), r = { id: Date.now() + Math.random().toString(36).slice(2, 6) };
        cfg.columns.forEach((c, i) => { const key = Object.keys(j).find(h => h.trim().toLowerCase() === c.label.toLowerCase()); r[c.k] = key ? j[key] : vals[i] ?? ''; });
        rows.push(clean(r));
      });
      save();
    };
  }
  draw();
};
