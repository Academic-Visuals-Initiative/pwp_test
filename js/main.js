var renderers = { hero: renderHero, about: renderAbout, education: renderEducation, publications: renderPublications, projects: renderProjects, blog: renderBlog, contact: renderContact };

var defaultSections = ['hero.json', 'about.json', 'education.json', 'publications.json', 'projects.json', 'blog/blog.json', 'contact.json'];

function init() {
  loadTheme();
  document.querySelectorAll('[data-toggle-theme]').forEach(function(el) { el.addEventListener('click', toggleTheme); });
  fetchJSON('data/site.json').then(function(siteData) {
    var sectionFiles = siteData.sections && siteData.sections.length ? siteData.sections : defaultSections;
    document.title = siteData.title || document.title;
    if (siteData.favicon) document.querySelector('link[rel="icon"]').href = siteData.favicon;
    var brandEls = document.querySelectorAll('.nav-logo');
    if (brandEls.length && siteData.name) brandEls.forEach(function(el) { el.textContent = siteData.name; el.style.cursor = 'pointer'; el.addEventListener('click', function() { document.getElementById('hero').scrollIntoView({ behavior: 'smooth' }); }); });
    var nav = document.querySelector('.nav-links');
    var mobileNav = document.querySelector('.mobile-overlay');
    var app = document.getElementById('app');
    app.innerHTML = '';
    var sectionIds = [];
    var chain = Promise.resolve();
    var renderIndex = 0;
    sectionFiles.forEach(function(file) {
      chain = chain.then(function() {
        return fetchJSON(file.indexOf('/') >= 0 ? file : 'data/' + file).then(function(section) {
          if (!section.enabled) return;
          var render = renderers[section.type];
          if (!render) return;
          app.innerHTML += render(section);
          sectionIds.push(section.id);
          if (section.navigation && section.navigation.show && nav) {
            var a = document.createElement('a');
            a.href = section.navigation.href || '#' + section.id;
            a.className = 'nav-link';
            a.textContent = section.navigation.label;
            nav.appendChild(a);
            var ma = a.cloneNode(true);
            if (mobileNav) {
              var closeBtn = mobileNav.querySelector('.mobile-close');
              var actions = mobileNav.querySelector('.mobile-actions');
              if (actions) { mobileNav.insertBefore(ma, actions); }
              else if (closeBtn) { mobileNav.insertBefore(ma, closeBtn.nextSibling); }
              else { mobileNav.appendChild(ma); }
            }
          }
          renderIndex++;
        }).catch(function(e) { console.warn('Skipping ' + file + ':', e); });
      });
    });
    return chain.then(function() {
      initScrollSpy(sectionIds);
      initSmartNav();
      initMobileMenu();
      initCVButton(siteData);
      var footer = document.querySelector('footer');
      if (footer && siteData.footer) {
        footer.style.display = 'block';
        var fName = footer.querySelector('.footer-name');
        var fTag = footer.querySelector('.footer-tagline');
        var fLinks = footer.querySelector('.footer-links');
        if (fName) fName.textContent = siteData.footer.name || '';
        if (fTag) fTag.innerHTML = nl2br(siteData.footer.tagline || '');
        if (fLinks && siteData.footer.links) {
          fLinks.innerHTML = siteData.footer.links.map(function(l) { return l.url ? '<a href="' + l.url + '" class="footer-link">' + l.label + '</a>' : '<span class="footer-link">' + l.label + '</span>'; }).join('');
        }
      }
      setTimeout(function() {
        fetchJSON('data/contact.json').then(function(s) {
          initContactForm(s.emailjs || null);
        }).catch(function() {});
      }, 100);
      fetchJSON('blog/blog.json').then(function(blogSection) {
        if (blogSection && blogSection.enabled && blogSection.data && blogSection.data.manifest) {
          if (typeof initBlogPreview === 'function') {
            initBlogPreview('blogPostPreview', blogSection.data.manifest, blogSection.data.preview_count || 3, blogSection.data.read_more_url || 'pages/blog.html');
          }
        }
      }).catch(function() {});

    });
  }).catch(function(e) { console.error('Init failed:', e); });
}

document.addEventListener('DOMContentLoaded', init);
