
window.safeStorage = {
  get: (key, defaultVal = null) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.error(`Błąd odczytu localStorage [${key}]:`, e);
      return defaultVal;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.error(`Błąd zapisu localStorage [${key}]:`, e);
      return false;
    }
  }
};

(function(){
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  let saved = null;
  try {
    saved = localStorage.getItem('supon-theme');
  } catch(e) {}
  if(saved){ root.setAttribute('data-theme', saved); }
  else if(prefersDark){ root.setAttribute('data-theme','dark'); }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.theme-toggle');
    if(!btn) return;
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('supon-theme', next);
    } catch(e) {}
  });


  // Initialize Database in localStorage
  function initDB() {
    // 1. Employees
    let emps = window.safeStorage.get('portal_employees');
    if (!Array.isArray(emps)) {
      window.safeStorage.set('portal_employees', window.DEFAULT_EMPLOYEES || []);
      emps = window.DEFAULT_EMPLOYEES || [];
    } else {
      emps = emps.filter(emp => emp !== null && emp !== undefined);
      let modified = false;
      emps.forEach(emp => {
        if (emp && emp.items) {
          emp.items = emp.items.filter(it => it !== null && it !== undefined);
          emp.items.forEach(it => {
            if (it && it.lastOp && it.lastOp.includes('—')) {
              it.lastOp = it.lastOp.split('—')[0].trim();
              modified = true;
            }
          });
        }
      });
      if (modified) {
        window.safeStorage.set('portal_employees', emps);
      }
    }
    
    // 2. Orders
    let orders = window.safeStorage.get('portal_orders');
    if (!Array.isArray(orders)) {
      orders = window.DEFAULT_ORDERS || [];
      window.safeStorage.set('portal_orders', orders);
    } else {
      let migrated = false;
      const originalLength = orders.length;
      orders = orders.filter(o => o !== null && o !== undefined && o.status !== "Szkic");
      if (orders.length !== originalLength) migrated = true;
      
      orders.forEach(o => {
        if (o && o.status === "Nowe") {
          o.status = "W realizacji";
          migrated = true;
        }
      });

      // Merge in default orders that are not in local storage
      if (window.DEFAULT_ORDERS) {
        const storedIds = new Set(orders.map(o => o.id));
        window.DEFAULT_ORDERS.forEach(d => {
          if (d && d.id && !storedIds.has(d.id)) {
            orders.push(d);
            migrated = true;
          }
        });
      }

      // Upgrade default orders if they exist in localStorage but are outdated
      if (window.DEFAULT_ORDERS) {
        orders = orders.map(o => {
          if (!o) return o;
          const defaultVer = window.DEFAULT_ORDERS.find(d => d && d.id === o.id);
          if (defaultVer) {
            // Force local photo path synchronization if outdated
            let photoUpdated = false;
            if (o.items && defaultVer.items) {
              o.items.forEach((it, idx) => {
                const defaultItem = defaultVer.items[idx];
                if (defaultItem && it.foto !== defaultItem.foto) {
                  it.foto = defaultItem.foto;
                  photoUpdated = true;
                }
              });
            }
            if (photoUpdated) migrated = true;

            const storedDostawy = o.dostawy ? o.dostawy.length : 0;
            const defaultDostawy = defaultVer.dostawy ? defaultVer.dostawy.length : 0;
            
            // Check if shipments array size, status, or contents changed, upgrade to get package info
            if (storedDostawy !== defaultDostawy || 
                (o.status !== defaultVer.status && o.status !== "Zatwierdzone") ||
                (o.status === defaultVer.status && JSON.stringify(o.dostawy) !== JSON.stringify(defaultVer.dostawy))) {
              migrated = true;
              return defaultVer;
            }
          }
          return o;
        });
      }

      if (migrated) {
        // Sort by ID descending so newly created orders (with higher numbers) are at the top
        orders.sort((a, b) => b.id.localeCompare(a.id));
        window.safeStorage.set('portal_orders', orders);
      }
    }
    
    // 3. Requests (Tickets)
    const VERSION_KEY = 'portal_requests_v5';
    let requests = window.safeStorage.get('portal_requests');
    if (!window.safeStorage.get(VERSION_KEY) || !Array.isArray(requests)) {
      requests = window.DEFAULT_TICKETS || [];
      window.safeStorage.set('portal_requests', requests);
      window.safeStorage.set(VERSION_KEY, 'true');
    } else {
      let migrated = false;
      const originalLength = requests.length;
      requests = requests.filter(r => r !== null && r !== undefined);
      if (requests.length !== originalLength) migrated = true;

      requests.forEach(r => {
        if (r && (r.status === "Nowe" || r.status === "Do oceny")) {
          r.status = "W toku";
          migrated = true;
        }
      });

      // Merge missing default tickets
      if (window.DEFAULT_TICKETS) {
        const storedIds = new Set(requests.map(r => r.id));
        window.DEFAULT_TICKETS.forEach(d => {
          if (d && d.id && !storedIds.has(d.id)) {
            requests.push(d);
            migrated = true;
          }
        });
      }

      if (migrated) {
        window.safeStorage.set('portal_requests', requests);
      }
    }

    // 4. WZ
    let wz = window.safeStorage.get('portal_wz');
    if (!Array.isArray(wz)) {
      window.safeStorage.set('portal_wz', window.DEFAULT_WZ || []);
    } else {
      const originalLength = wz.length;
      wz = wz.filter(w => w !== null && w !== undefined);
      if (wz.length !== originalLength) {
        window.safeStorage.set('portal_wz', wz);
      }
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
  document.querySelectorAll('form:not([id="form-add-employee"]):not([id="form-add-ticket"]):not([id="newRequestForm"]):not([id="loginForm"])').forEach(f=>{
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
