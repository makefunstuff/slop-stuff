(function () {
  const root = document.documentElement;
  const guideId = root.dataset.guide || 'default';
  const themeKey = 'slop-guide-theme-' + guideId;

  // Theme
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const saved = localStorage.getItem(themeKey);
    if (saved) root.dataset.theme = saved;
    else if (matchMedia('(prefers-color-scheme: light)').matches) root.dataset.theme = 'light';
    themeToggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(themeKey, root.dataset.theme);
    });
  }

  // Print
  const printBtn = document.getElementById('printGuide');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  // Copy buttons on code blocks
  document.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-button')) return;
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.type = 'button';
    button.textContent = 'copy';
    button.addEventListener('click', async () => {
      const code = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'copied';
        setTimeout(() => (button.textContent = 'copy'), 1300);
      } catch {
        button.textContent = 'select';
      }
    });
    pre.appendChild(button);
  });

  // Search
  const search = document.getElementById('search');
  const searchable = [...document.querySelectorAll('.searchable')];
  const noResults = document.getElementById('noResults');
  if (search && searchable.length) {
    const applySearch = () => {
      const query = search.value.trim().toLowerCase();
      let shown = 0;
      searchable.forEach((section) => {
        const match = !query || section.textContent.toLowerCase().includes(query);
        section.hidden = !match;
        if (match) shown += 1;
      });
      if (noResults) noResults.style.display = shown ? 'none' : 'block';
    };
    search.addEventListener('input', applySearch);
    document.addEventListener('keydown', (event) => {
      if (event.key === '/' && document.activeElement !== search) {
        event.preventDefault();
        search.focus();
      }
      if (event.key === 'Escape' && document.activeElement === search) {
        search.value = '';
        search.blur();
        applySearch();
      }
    });
  }

  // Scrollspy for the sidebar
  const navLinks = [...document.querySelectorAll('.sidebar a')];
  if (navLinks.length) {
    const targets = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) =>
          link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`)
        );
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.2, 0.6] }
    );
    targets.forEach((target) => observer.observe(target));
  }
})();
