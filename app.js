
(function(){
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('supon-theme');
  if(saved){ root.setAttribute('data-theme', saved); }
  else if(prefersDark){ root.setAttribute('data-theme','dark'); }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.theme-toggle');
    if(!btn) return;
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('supon-theme', next);
  });

  // Demo: toast on forms with .form (for presentation)
  document.querySelectorAll('form').forEach(f=>{
    f.addEventListener('submit', ()=>{
      showToast('Zapisano (demo).');
    });
  });

  function showToast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    Object.assign(t.style, {
      position:'fixed', bottom:'18px', right:'18px', background:'var(--nav-bg)',
      color:'var(--nav-text)', padding:'10px 14px', borderRadius:'12px', zIndex:9999,
      boxShadow:'0 8px 30px rgba(0,0,0,.15)', opacity:'0', transition:'opacity .2s ease'
    });
    document.body.appendChild(t);
    requestAnimationFrame(()=> t.style.opacity='1');
    setTimeout(()=>{
      t.style.opacity='0';
      setTimeout(()=> t.remove(), 250);
    }, 1500);
  }
  function openModal(){
    document.getElementById('modal-add-user').hidden = false;
  }
  function closeModal(){
    document.getElementById('modal-add-user').hidden = true;
  }

})();

// ===== Zamówienia: modal szczegółów =====
(function(){
  const table = document.querySelector('#orders-table');
  if(!table) return;

  const modal = document.getElementById('order-modal');
  const backdrop = document.getElementById('modal-backdrop');
  const itemsBox = document.getElementById('order-items');
  const metaBox = document.getElementById('order-meta');
  const title = document.getElementById('order-title');

  function openModal(){
    modal.classList.add('open');
    backdrop.classList.add('open');
  }
  function closeModal(){
    modal.classList.remove('open');
    backdrop.classList.remove('open');
  }

  modal.addEventListener('click', (e)=>{
    if(e.target.matches('[data-close]')) closeModal();
  });
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); });

  table.addEventListener('click', (e)=>{
    const tr = e.target.closest('tr[data-order]');
    if(!tr) return;

    // parse payload
    let payload = {};
    try{ payload = JSON.parse(tr.getAttribute('data-order')); }catch(_){}

    // tytuł + meta
    title.textContent = `Zamówienie ${payload.id || ''}`;
    metaBox.innerHTML = `
      <span>Status: <b>${payload.status || '—'}</b></span>
      <span>Utworzono: <b>${payload.created || '—'}</b></span>
      <span>Adres dostawy: <b>${payload.addr || '—'}</b></span>
      <span>ETA: <b>${payload.eta || '—'}</b></span>
    `;

    // pozycje
    itemsBox.innerHTML = (payload.items || []).map(it => `
      <tr>
        <td><img class="item-photo" src="${it.foto}" alt=""></td>
        <td>${it.produkt}</td>
        <td>${it.nr}</td>
        <td>${it.rozmiar}</td>
        <td>${it.ilosc}</td>
        <td>${it.osoba}</td>
      </tr>
    `).join('');

    openModal();
  });
})();

// ===== MODAL (open/close) =====
document.addEventListener('click', (e) => {
  const openBtn = e.target.closest('[data-open-modal]');
  if (openBtn) {
    const sel = openBtn.getAttribute('data-open-modal');
    const modal = document.querySelector(sel);
    if (modal) {
      modal.setAttribute('open', '');
      document.documentElement.classList.add('has-modal');
    }
  }

  const closeBtn = e.target.closest('[data-modal-close]');
  if (closeBtn) {
    const modal = closeBtn.closest('.modal');
    if (modal) {
      modal.removeAttribute('open');
      document.documentElement.classList.remove('has-modal');
    }
  }

  // Закрытие по клику на затемнение
  if (e.target.classList.contains('modal-backdrop')) {
    const modal = e.target.closest('.modal');
    if (modal) {
      modal.removeAttribute('open');
      document.documentElement.classList.remove('has-modal');
    }
  }
});

// ===== LIVE SEARCH (Table Filtering) =====
document.addEventListener('input', (e) => {
  if (e.target.matches('input[type="search"]')) {
    const query = e.target.value.toLowerCase();
    // Find closest section/card and then table
    const container = e.target.closest('section.card') || document;
    const table = container.querySelector('table.table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }
});

// ===== BUTTON LOADING STATES =====
document.addEventListener('click', (e) => {
  // Ignore clicks on links that actually navigate or open modals
  const btn = e.target.closest('button.btn, a.btn');
  if (!btn) return;
  
  // If it's a link to another page, let it navigate (don't prevent default unless it's a demo)
  // For demo purposes, we add loading state to buttons that trigger actions
  if (btn.tagName === 'BUTTON' && btn.type !== 'submit') {
    if (btn.hasAttribute('data-open-modal') || btn.hasAttribute('data-modal-close')) return;
    
    // Add loading class
    const originalText = btn.innerHTML;
    btn.classList.add('is-loading');
    
    setTimeout(() => {
      btn.classList.remove('is-loading');
      // Show dummy toast
      showToast('Akcja wykonana pomyślnie (demo).');
    }, 600);
  }
});

// Expose showToast globally if needed by form submissions
window.showToast = function(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  Object.assign(t.style, {
    position:'fixed', bottom:'18px', right:'18px', background:'var(--nav-bg)',
    color:'var(--nav-text)', padding:'10px 14px', borderRadius:'12px', zIndex:9999,
    boxShadow:'0 8px 30px rgba(0,0,0,.15)', opacity:'0', transition:'opacity .2s ease'
  });
  document.body.appendChild(t);
  requestAnimationFrame(()=> t.style.opacity='1');
  setTimeout(()=>{
    t.style.opacity='0';
    setTimeout(()=> t.remove(), 250);
  }, 1500);
};
