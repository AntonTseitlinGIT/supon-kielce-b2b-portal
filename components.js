class AppNav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav class="topbar" aria-label="Główna nawigacja">
        <div class="container">
          <a class="brand" href="dashboard.html" aria-label="SUPON Kielce">
            <img src="logo.png" alt="" class="brand-logo" />
            <span class="brand-name">SUPON Kielce</span>
          </a>
          <ul class="nav-list" role="list">
            <li><a class="nav-link" href="dashboard.html" data-page="dashboard">Pulpit</a></li>
            <li><a class="nav-link" href="zamowienia.html" data-page="zamowienia">Zamówienia</a></li>
            <li><a class="nav-link" href="zgloszenia.html" data-page="zgloszenia">Zgłoszenia</a></li>
            <li><a class="nav-link" href="#" data-page="wz">WZ</a></li>
            <li><a class="nav-link" href="#" data-page="sklep">Sklep</a></li>
          </ul>
          <div class="nav-actions">
            <button class="theme-toggle" aria-label="Przełącz motyw" title="Motyw">
              <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><g stroke-width="2"><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g></svg>
              <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <a href="index.html" class="logout-link" title="Wyloguj się">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Wyloguj</span>
            </a>
          </div>
        </div>
      </nav>
    `;

    // Highlight active link
    const path = window.location.pathname;
    let page = path.split('/').pop().replace('.html', '');
    if (!page || page === 'index') page = 'dashboard';
    
    // Also consider nowe-zamowienie as part of zamowienia
    if (page === 'nowe-zamowienie') page = 'zamowienia';

    const activeLink = this.querySelector(`[data-page="${page}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      activeLink.setAttribute('aria-current', 'page');
    }
  }
}
customElements.define('app-nav', AppNav);

class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="page-footer" role="contentinfo">
        <div class="container">
          <small>© 2025 — SUPON Kielce — Portal Klienta</small>
        </div>
      </footer>
    `;
  }
}
customElements.define('app-footer', AppFooter);
