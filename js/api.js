function fetchJSON(path) {
  return fetch(path).then(function(res) {
    if (!res.ok) throw new Error('Failed to load ' + path);
    return res.json();
  });
}

function initScrollSpy(sectionIds) {
  var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  if (!navLinks.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function(link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-70px 0px -40% 0px' });
  sectionIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

function initMobileMenu() {
  var toggle = document.querySelector('.mobile-toggle');
  var overlay = document.querySelector('.mobile-overlay');
  var close = document.querySelector('.mobile-close');
  if (!toggle || !overlay) return;
  function closeMenu() {
    overlay.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
  }
  toggle.addEventListener('click', function() {
    overlay.classList.add('active');
    document.body.classList.add('overflow-hidden');
  });
  if (close) close.addEventListener('click', closeMenu);
  overlay.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', closeMenu);
  });
}

function initSmartNav() {
  var nav = document.querySelector('nav');
  var navRight = document.querySelector('.nav-right');
  if (!nav || !navRight) return;
  var totalWidth = 0;
  function getChildrenWidth() {
    var total = 0, visible = 0;
    for (var i = 0; i < navRight.children.length; i++) {
      var child = navRight.children[i];
      if (child.offsetWidth > 0) { total += child.offsetWidth; visible++; }
    }
    return visible > 1 ? total + 16 * (visible - 1) : total;
  }
  function check() {
    if (nav.classList.contains('nav-collapsed')) {
      if (totalWidth > 0 && totalWidth <= navRight.clientWidth) {
        nav.classList.remove('nav-collapsed');
      } else if (totalWidth === 0) {
        nav.classList.remove('nav-collapsed');
        requestAnimationFrame(function() {
          var w = getChildrenWidth();
          if (w > navRight.clientWidth) { totalWidth = w; nav.classList.add('nav-collapsed'); }
          else { totalWidth = w; }
        });
      }
    } else {
      var w = getChildrenWidth();
      if (w > navRight.clientWidth) {
        totalWidth = w;
        nav.classList.add('nav-collapsed');
      } else {
        totalWidth = w;
      }
    }
  }
  setTimeout(check, 300);
  window.addEventListener('resize', function() { requestAnimationFrame(check); });
  if (window.MutationObserver) {
    var mo = new MutationObserver(function() { totalWidth = 0; if (!nav.classList.contains('nav-collapsed')) check(); });
    mo.observe(navRight, { childList: true, subtree: true, characterData: true });
  }
}

function initCVButton(siteData) {
  var btns = document.querySelectorAll('.cv-btn');
  if (!btns.length || !siteData.cv) return;
  if (siteData.cv.enabled === false) { btns.forEach(function(b) { b.style.display = 'none'; }); return; }
  var cv = siteData.cv;
  btns.forEach(function(btn) {
    btn.textContent = cv.labels && cv.labels[cv.mode] ? cv.labels[cv.mode] : 'CV';
    btn.addEventListener('click', function(e) {
    e.preventDefault();
    if (cv.mode === 'view') {
      window.open(cv.viewer + '?url=' + encodeURIComponent('../' + cv.path), '_blank');
    } else if (cv.mode === 'download') {
      btn.textContent = 'Downloading...';
      btn.disabled = true;
      var url = cv.path;
      if (url.includes('github.com') && url.includes('/blob/')) {
        url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }
      fetch(url).then(function(r) { return r.blob(); }).then(function(blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = url.split('/').pop();
        a.click();
        URL.revokeObjectURL(a.href);
        btn.textContent = cv.labels ? cv.labels.download : 'Download';
        btn.disabled = false;
      }).catch(function() {
        window.open(url, '_blank');
        btn.textContent = cv.labels ? cv.labels.download : 'Download';
        btn.disabled = false;
      });
    } else if (cv.mode === 'external') {
      window.open(cv.external_url, '_blank');
    }
  });
  });
}

function switchEduConsole(credentialId) {
  var buttons = document.querySelectorAll('.edu-tab-btn');
  buttons.forEach(function(btn) {
    var isActive = btn.id === 'tab-' + credentialId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  var panels = document.querySelectorAll('.edu-panel');
  panels.forEach(function(panel) {
    panel.style.display = panel.id === 'panel-' + credentialId ? 'block' : 'none';
  });
}

function initContactForm(ej) {
  if (!ej || !ej.public_key) return;
  if (typeof emailjs !== 'undefined') emailjs.init(ej.public_key);
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var orig = btn ? btn.textContent : 'Send';
    if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }
    var timedOut = false;
    var timeoutId = setTimeout(function() {
      timedOut = true;
      if (btn) { btn.textContent = 'Failed -- try again'; btn.disabled = false; }
      setTimeout(function() { if (btn) btn.textContent = orig; }, 3000);
    }, 10000);
    if (typeof emailjs !== 'undefined' && emailjs.sendForm) {
      emailjs.sendForm(ej.service_id, ej.template_id, form).then(function() {
        clearTimeout(timeoutId); if (timedOut) return;
        if (btn) { btn.textContent = 'Sent!'; }
        form.reset();
        setTimeout(function() { if (btn) { btn.textContent = orig; btn.disabled = false; } }, 3000);
      }, function(err) {
        clearTimeout(timeoutId); if (timedOut) return;
        console.error('EmailJS error:', err);
        if (btn) { btn.textContent = 'Failed -- try again'; btn.disabled = false; }
        setTimeout(function() { if (btn) btn.textContent = orig; }, 3000);
      });
    } else {
      clearTimeout(timeoutId);
      if (btn) { btn.textContent = 'EmailJS not loaded'; btn.disabled = false; }
      setTimeout(function() { if (btn) btn.textContent = orig; }, 3000);
    }
  });
}
