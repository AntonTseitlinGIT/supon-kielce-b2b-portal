
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


  // Initialize Database in localStorage
  function initDB() {
    if (!localStorage.getItem('portal_employees') && window.DEFAULT_EMPLOYEES) {
      localStorage.setItem('portal_employees', JSON.stringify(window.DEFAULT_EMPLOYEES));
    } else if (localStorage.getItem('portal_employees')) {
      try {
        const emps = JSON.parse(localStorage.getItem('portal_employees'));
        let modified = false;
        emps.forEach(emp => {
          if (emp.items) {
            emp.items.forEach(it => {
              if (it.lastOp && it.lastOp.includes('—')) {
                it.lastOp = it.lastOp.split('—')[0].trim();
                modified = true;
              }
            });
          }
        });
        if (modified) {
          localStorage.setItem('portal_employees', JSON.stringify(emps));
        }
      } catch(e) {}
    }
    
    let orders = null;
    if (localStorage.getItem('portal_orders')) {
      try {
        orders = JSON.parse(localStorage.getItem('portal_orders'));
      } catch(e) {}
    }
    
    if (!orders && window.DEFAULT_ORDERS) {
      localStorage.setItem('portal_orders', JSON.stringify(window.DEFAULT_ORDERS));
    } else if (orders && window.DEFAULT_ORDERS) {
      // Upgrade default orders if they exist in localStorage but are outdated
      let updated = false;
      orders = orders.map(o => {
        const defaultVer = window.DEFAULT_ORDERS.find(d => d.id === o.id);
        if (defaultVer) {
          const storedDostawy = o.dostawy ? o.dostawy.length : 0;
          const defaultDostawy = defaultVer.dostawy ? defaultVer.dostawy.length : 0;
          
          // Check if shipments array size, status, or contents changed, upgrade to get package info
          if (storedDostawy !== defaultDostawy || 
              (o.status !== defaultVer.status && o.status !== "Zatwierdzone") ||
              (o.status === defaultVer.status && JSON.stringify(o.dostawy) !== JSON.stringify(defaultVer.dostawy))) {
            updated = true;
            return defaultVer;
          }
        }
        return o;
      });
      if (updated) {
        localStorage.setItem('portal_orders', JSON.stringify(orders));
      }
    }
    
    
    if (!localStorage.getItem('portal_requests') && window.DEFAULT_TICKETS) {
      localStorage.setItem('portal_requests', JSON.stringify(window.DEFAULT_TICKETS));
    }

    if (!localStorage.getItem('portal_wz') && window.DEFAULT_WZ) {
      localStorage.setItem('portal_wz', JSON.stringify(window.DEFAULT_WZ));
    }
  }
  initDB();

  // Generic Table Sorting
  document.addEventListener('click', (e) => {
    const th = e.target.closest('table.table th');
    if (!th) return;
    const table = th.closest('table');
    if (!table) return;

    // Skip non-sortable columns
    const text = th.textContent.trim();
    if (text === '' || text === 'Akcje' || text === 'Foto' || text === 'Zdjęcie' || text === 'CHIP' || th.classList.contains('no-sort')) return;

    const index = Array.from(th.parentNode.children).indexOf(th);
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    if (rows.length === 0) return;

    const isAscending = !th.classList.contains('sort-asc');

    // Reset other headers
    th.parentNode.querySelectorAll('th').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
      const arrow = header.querySelector('.sort-arrow');
      if (arrow) arrow.remove();
    });

    // Set active sort class & visual arrow indicator
    th.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'sort-arrow';
    arrowSpan.style.marginLeft = '6px';
    arrowSpan.style.fontSize = '11px';
    arrowSpan.style.display = 'inline-block';
    arrowSpan.style.transition = 'transform 0.15s ease';
    arrowSpan.innerHTML = isAscending ? '▲' : '▼';
    th.appendChild(arrowSpan);

    // Sort rows
    rows.sort((rowA, rowB) => {
      if (rowA.children.length <= index || rowB.children.length <= index) return 0;
      const cellA = rowA.children[index].textContent.trim();
      const cellB = rowB.children[index].textContent.trim();

      // Check for numeric sorting
      const cleanA = cellA.replace(/[^\d.-]/g, '');
      const cleanB = cellB.replace(/[^\d.-]/g, '');
      const numA = parseFloat(cleanA);
      const numB = parseFloat(cleanB);
      
      if (cleanA !== '' && cleanB !== '' && !isNaN(numA) && !isNaN(numB)) {
        return isAscending ? numA - numB : numB - numA;
      }

      // Fallback to alphabetical sorting
      return isAscending
        ? cellA.localeCompare(cellB, 'pl', { sensitivity: 'base', numeric: true })
        : cellB.localeCompare(cellA, 'pl', { sensitivity: 'base', numeric: true });
    });

    // Re-append sorted rows
    const tbody = table.querySelector('tbody');
    rows.forEach(row => tbody.appendChild(row));
  });

  // Demo: toast on forms with .form (for presentation)
  document.querySelectorAll('form:not([id="form-add-employee"]):not([id="form-add-ticket"])').forEach(f=>{
    f.addEventListener('submit', (e)=>{
      e.preventDefault();
      showToast('Zapisano (demo).');
    });
  });

  function showToast(msg){
    if (window.showToast) {
      window.showToast(msg);
    }
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
    itemsBox.innerHTML = (payload.items || []).map(it => {
      const total = it.ilosc || 1;
      let delivered = it.ilosc_dostarczona !== undefined ? it.ilosc_dostarczona : (payload.status === "Dostarczone" || payload.status === "Zatwierdzone" ? total : 0);
      let shipped = it.ilosc_wyslana !== undefined ? it.ilosc_wyslana : (payload.status === "Wysłane" ? total : 0);
      let itemStatus = it.status || (delivered >= total ? "Dostarczone" : (shipped >= total ? "W drodze" : payload.status));

      let statusBadge = `<span class="badge" style="padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; `;
      if (itemStatus === "Dostarczone" || itemStatus === "Zatwierdzone") {
        statusBadge += `background: color-mix(in oklab, var(--ok) 15%, transparent); color: var(--ok);`;
      } else if (itemStatus === "W drodze" || itemStatus === "Wysłane") {
        statusBadge += `background: color-mix(in oklab, var(--accent) 15%, transparent); color: var(--accent);`;
      } else if (itemStatus === "Częściowo wysłane") {
        statusBadge += `background: color-mix(in oklab, #b45309 15%, transparent); color: #b45309;`;
      } else {
        statusBadge += `background: var(--line); color: var(--muted);`;
      }
      statusBadge += `">${itemStatus}</span>`;

      return `
        <tr>
          <td><img class="item-photo" src="${it.foto}" alt="" width="50"></td>
          <td><b>${it.produkt}</b></td>
          <td>${it.nr}</td>
          <td>${it.rozmiar}</td>
          <td>${total} szt.</td>
          <td>${delivered} szt.</td>
          <td>${shipped} szt.</td>
          <td>${statusBadge}</td>
          <td>${it.osoba}</td>
        </tr>
      `;
    }).join('');

    const shipmentsSec = document.getElementById('shipments-section');
    const shipmentsBody = document.getElementById('order-shipments');
    if (shipmentsSec && shipmentsBody) {
      if (payload.dostawy && payload.dostawy.length > 0) {
        shipmentsSec.style.display = 'block';
        shipmentsBody.innerHTML = payload.dostawy.map(d => `
          <tr>
            <td><strong>${d.id_wysylki}</strong></td>
            <td>${d.data_wysylki}</td>
            <td>${d.kurier}</td>
            <td><a href="#" style="color: var(--accent); font-weight: 600;" onclick="event.preventDefault(); alert('Śledzenie przesyłki: ${d.nr_listu}')">${d.nr_listu}</a></td>
            <td><span class="muted">${d.pozycje.map(it => `${it.produkt} (${it.ilosc} szt.)`).join(", ")}</span></td>
            <td><span style="font-weight: 700; color: ${d.status === 'Dostarczona' ? 'var(--ok)' : 'var(--accent)'}">${d.status}</span></td>
          </tr>
        `).join('');
      } else {
        shipmentsSec.style.display = 'none';
        shipmentsBody.innerHTML = '';
      }
    }

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
