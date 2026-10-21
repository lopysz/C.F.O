/* ===== Núcleo: utilitários, armazenamento, telas e diálogos ===== */
const CFO = { modules: {}, screens: [] };

CFO.esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Dados salvos no navegador (localStorage)
CFO.store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('cfo:' + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('cfo:' + k, JSON.stringify(v)); }
};

// Abre uma tela cobrindo a atual (com X para voltar)
CFO.open = (title, render) => {
  const s = document.createElement('section');
  s.className = 'screen';
  s.innerHTML = `<header><button class="x" aria-label="Voltar">✕</button><h2>${CFO.esc(title)}</h2></header><div class="body"></div>`;
  s.querySelector('.x').onclick = CFO.close;
  document.getElementById('screens').append(s);
  CFO.screens.push(s);
  render(s.querySelector('.body'));
};
CFO.close = () => CFO.screens.pop()?.remove();

// Janela de formulário
CFO.dialog = (title, fields, onOk) => {
  const d = document.createElement('dialog');
  d.innerHTML = `<form method="dialog"><h3>${CFO.esc(title)}</h3>${fields}
    <div class="row"><button value="cancel" class="ghost" formnovalidate>Cancelar</button><button value="ok">Salvar</button></div></form>`;
  d.onclose = () => {
    if (d.returnValue === 'ok') onOk(Object.fromEntries(new FormData(d.querySelector('form'))));
    d.remove();
  };
  document.body.append(d);
  d.showModal();
};
