(function () {
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("slop-theme", next); } catch (e) {}
    });
  }

  document.querySelectorAll("pre").forEach(function (pre) {
    if (pre.querySelector(".copy")) return;
    var btn = document.createElement("button");
    btn.className = "copy";
    btn.type = "button";
    btn.textContent = "copy";
    btn.addEventListener("click", function () {
      var code = pre.querySelector("code") ? pre.querySelector("code").innerText : pre.innerText;
      navigator.clipboard.writeText(code).then(function () {
        btn.textContent = "ok";
        setTimeout(function () { btn.textContent = "copy"; }, 1200);
      }).catch(function () { btn.textContent = "select"; });
    });
    pre.appendChild(btn);
  });

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc nav a"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = tocLinks.map(function (a) {
      try { return document.querySelector(a.getAttribute("href")); }
      catch (e) { return null; }
    });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove("active"); });
        var i = map.indexOf(e.target);
        if (i >= 0) tocLinks[i].classList.add("active");
      });
    }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
    map.forEach(function (el) { if (el) obs.observe(el); });
  }

  var input = document.getElementById("q");
  var hits = document.getElementById("hits");
  if (!input || !hits) return;
  var index = [];
  var jsonURL = input.form.getAttribute("action");
  if (jsonURL.slice(-1) !== "/") jsonURL += "/";
  jsonURL += "index.json";

  fetch(jsonURL).then(function (r) { return r.json(); }).then(function (data) {
    index = data || [];
  }).catch(function () { index = []; });

  function render(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) { hits.hidden = true; hits.innerHTML = ""; return; }
    var out = index.filter(function (item) {
      var blob = [item.title, item.category, item.description].concat(item.tags || []).join(" ").toLowerCase();
      return blob.indexOf(q) !== -1;
    }).slice(0, 20);
    hits.hidden = false;
    if (!out.length) {
      hits.innerHTML = '<div class="empty">no matches</div>';
      return;
    }
    hits.innerHTML = out.map(function (item) {
      return '<a href="' + item.url + '">' +
        escapeHtml(item.title) +
        '<span class="cat">' + escapeHtml(item.category || "") + "</span></a>";
    }).join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  input.addEventListener("input", function () { render(input.value); });
  input.addEventListener("focus", function () { if (input.value) render(input.value); });
  document.addEventListener("click", function (e) {
    if (!hits.contains(e.target) && e.target !== input) hits.hidden = true;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === "Escape") {
      hits.hidden = true;
      if (document.activeElement === input) input.blur();
    }
  });
})();
