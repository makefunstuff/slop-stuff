(function () {
  var input = document.getElementById('siteSearch');
  var results = document.getElementById('siteSearchResults');
  if (!input || !results) return;
  var idx = window.SLOP_SEARCH_INDEX || [];

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function render(q) {
    q = q.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) { results.style.display = 'none'; return; }
    var haystack = function (e) { return (e.t + ' ' + e.c + ' ' + e.b).toLowerCase(); };
    var hits = idx.filter(function (e) { return haystack(e).indexOf(q) !== -1; });
    results.style.display = 'block';
    if (!hits.length) {
      results.innerHTML = '<div class="sr-empty">No pages match &ldquo;' + escapeHtml(q) + '&rdquo;.</div>';
      return;
    }
    hits.slice(0, 20).forEach(function (e) {
      var a = document.createElement('a');
      a.href = e.p;
      a.className = 'sr-item';
      a.innerHTML =
        '<span class="sr-title">' + escapeHtml(e.t) + '</span>' +
        '<span class="sr-cat">' + escapeHtml(e.c) + '</span>';
      results.appendChild(a);
    });
  }

  input.addEventListener('input', function () { render(input.value); });

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = ''; render(''); input.blur();
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.site-search')) results.style.display = 'none';
  });
})();
