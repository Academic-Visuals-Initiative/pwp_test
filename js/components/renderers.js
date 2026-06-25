function renderHero(data) {
  var d = data.data;
  return '<header class="hero" id="' + data.id + '"><div class="hero-text">' +
    (d.badge ? '<span class="hero-tag">' + d.badge + '</span>' : '') +
    '<h1>' + d.name + (d.accent ? '<br><span>' + d.accent + '</span>' : '') + '</h1>' +
    (d.tagline ? '<p class="hero-tagline">' + nl2br(d.tagline) + '</p>' : '') +
    (d.description ? '<p class="hero-desc">' + nl2br(d.description) + '</p>' : '') +
    '</div>' +
    (d.image ? '<img src="' + d.image + '" alt="' + (d.alt || '') + '" fetchpriority="high" class="hero-img" width="800" height="1000">' : '') +
    '</header><div class="section-divider"></div>';
}

function renderAbout(data) {
  var d = data.data;
  var text = (d.paragraphs || []).join(' ');
  return '<section id="' + data.id + '"><div class="container"><div class="section-header">' +
    '<p>' + (d.heading_label || '') + '</p>' +
    '<h2>' + (d.heading || '') + '</h2></div>' +
    '<div class="bio-content"><p class="bio-text">' + nl2br(text) + '</p></div>' +
    '</div></section>';
}

function renderEducation(data) {
  var d = data.data;
  var items = d.items || [];
  var tabs = items.map(function(item, i) {
    var active = i === 0 ? ' active' : '';
    return '<button class="edu-tab-btn' + active + '" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-controls="panel-' + item.id + '" id="tab-' + item.id + '" onclick="switchEduConsole(\'' + item.id + '\')">' +
      '<span class="edu-tab-num">' + item.tab_num + '</span>' +
      '<span class="edu-tab-heading">' + item.tab_heading + '</span>' +
      '<span class="edu-tab-meta">' + item.tab_meta + '</span></button>';
  }).join('');
  var panels = items.map(function(item, i) {
    var dateRange = item.start && item.end ? '<span class="edu-date">' + item.start + ' \u2013 ' + item.end + '</span>' : '';
    var location = item.location ? '<span class="edu-location">' + item.location + '</span>' : '';
    var specs = (item.specs || []).map(function(s) {
      return '<div class="edu-spec-row"><span class="edu-spec-key">' + s.key + '</span><span class="edu-spec-val">' + nl2br(s.val) + '</span></div>';
    }).join('');
    var highlights = item.highlights && item.highlights.length ? '<div class="edu-highlights"><span class="edu-spec-lbl">' + (item.highlights_label || 'Highlights') + '</span><ul>' + item.highlights.map(function(h) { return '<li>' + nl2br(h) + '</li>'; }).join('') + '</ul></div>' : '';
    var link = item.link ? '<a href="' + item.link.url + '" class="edu-link">' + item.link.text + '</a>' : '';
    return '<div id="panel-' + item.id + '" class="edu-panel' + (i === 0 ? ' active' : '') + '" role="tabpanel" aria-labelledby="tab-' + item.id + '"' + (i !== 0 ? ' style="display:none"' : '') + '>' +
      '<div class="edu-panel-header"><span class="edu-spec-lbl">' + (item.spec_label || 'Credential Specification') + '</span>' +
      '<h3 class="edu-panel-title">' + item.title + '</h3>' +
      '<p class="edu-panel-institution">' + item.institution + dateRange + location + '</p></div>' +
      '<div class="edu-specs">' + specs + '</div>' + highlights + link + '</div>';
  }).join('');
  return '<section id="' + data.id + '"><div class="container"><div class="section-header">' +
    '<p>' + (d.heading_label || '') + '</p>' +
    '<h2>' + (d.heading || '') + '</h2>' +
    (d.description ? '<p class="section-desc">' + nl2br(d.description) + '</p>' : '') + '</div>' +
    '<div class="edu-console"><div class="edu-nav" role="tablist">' +
    tabs + '</div><div class="edu-display">' + panels + '</div></div></div></section>';
}

function renderPublications(data) {
  var d = data.data;
  var headingHtml = '';
  if (d.heading && Array.isArray(d.heading)) {
    headingHtml = (d.heading_label ? '<p>' + d.heading_label + '</p>' : '') + '<h2>' + d.heading.join(' ') + '</h2>';
  } else {
    headingHtml = (d.heading_label ? '<p>' + d.heading_label + '</p>' : '') + '<h2>' + (d.heading || '') + '</h2>';
  }
  var focusHtml = d.focus ? '<p class="pub-focus">' + nl2br(d.focus) + '</p>' : '';
  var allLinkHtml = d.all_link ? '<a href="' + d.all_link + '" class="pub-all-link" target="_blank">' + (d.all_link_label || 'View all publications') + ' \u2192</a>' : '';
  var featuredHtml = '';
  if (d.featured && d.featured.length) {
    featuredHtml = d.featured.map(function(f) {
      function featBtnHtml(btn) {
        var iconHtml = '<span class="pub-feat-dl-icon material-symbols-outlined">' + (btn.icon || 'download') + '</span>';
        var infoHtml = btn.info ? '<span class="pub-feat-dl-info">' + btn.info + '</span>' : '';
        var labelHtml = btn.label ? '<span class="pub-feat-dl-label">' + btn.label + '</span>' : '';
        var dlAttr = btn.download ? ' download' : '';
        var urlAttr = btn.url ? ' href="' + btn.url + '"' : '';
        var tagName = btn.url ? 'a' : 'div';
        var mainBtn = '<' + tagName + urlAttr + dlAttr + ' class="pub-feat-download">' + iconHtml + '<div>' + labelHtml + infoHtml + '</div></' + tagName + '>';
        var iconBtns = '';
        if (btn.iconBtns) {
          iconBtns = btn.iconBtns.map(function(ib) {
            var ibDl = ib.download ? ' download' : '';
            var ibUrl = ib.url ? ' href="' + ib.url + '"' : '';
            var ibTag = ib.url ? 'a' : 'div';
            return '<' + ibTag + ibUrl + ibDl + ' class="pub-feat-icon-btn"><span class="material-symbols-outlined">' + (ib.icon || 'open_in_new') + '</span></' + ibTag + '>';
          }).join('');
        }
        return iconBtns ? '<div class="pub-feat-download-row">' + mainBtn + iconBtns + '</div>' : mainBtn;
      }
      var downloadHtml = '';
      if (f.links) {
        downloadHtml = '<div class="pub-feat-links">' + f.links.map(featBtnHtml).join('') + '</div>';
      } else if (f.download) {
        downloadHtml = featBtnHtml(f.download);
      }
      var featImg = f.image ? '<div class="pub-feat-img"><img src="' + f.image + '" alt="' + (f.alt || '') + '" loading="lazy"></div>' : '';
      var featDesc = '';
      if (f.paragraphs) {
        featDesc = '<div class="pub-feat-desc">' + f.paragraphs.map(function(p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('') + '</div>';
      } else if (f.description) {
        featDesc = '<p class="pub-feat-desc">' + nl2br(f.description) + '</p>';
      }
      var featTags = (f.tags || []).map(function(t) {
        return '<span class="pub-item-tag">' + t + '</span>';
      }).join('');
      var featTagsHtml = featTags ? '<div class="pub-item-tags">' + featTags + '</div>' : '';
      return '<div class="pub-featured-block">' + featImg +
        '<div class="pub-feat-content">' + featTagsHtml +
        '<span class="pub-feat-badge">' + (f.badge || '') + '</span>' +
        '<h3 class="pub-feat-title">' + f.title + '</h3>' +
        (f.authors ? '<span class="pub-item-authors">' + f.authors + '</span>' : '') +
        featDesc + downloadHtml + '</div></div>';
    }).join('');
  }
  var itemsHtml = (d.items || []).map(function(item) {
    var imgHtml = item.image ? '<div class="pub-item-img"><img src="' + item.image + '" alt="" loading="lazy"></div>' : '';
    var linksHtml = (item.links || []).map(function(l) {
      return '<a href="' + l.url + '" class="pub-item-link"' + (l.download ? ' download' : '') + ' target="_blank"><span class="material-symbols-outlined">' + (l.icon || 'link') + '</span>' + l.label + '</a>';
    }).join('');
    var tagsHtml = (item.tags || []).map(function(t) {
      return '<span class="pub-item-tag">' + t + '</span>';
    }).join('');
    return '<div class="pub-item"><div class="pub-item-inner">' +
      imgHtml +
      '<div class="pub-item-body"><div class="pub-item-tags">' + tagsHtml + '</div>' +
      '<h4 class="pub-item-title">' + item.title + '</h4>' +
      '<span class="pub-item-authors">' + (item.authors || '') + '</span>' +
      '<p class="pub-item-summary">' + nl2br(item.summary) + '</p>' +
      '<span class="pub-item-journal">' + (item.journal || '') + '</span>' +
      '<div class="pub-item-links">' + linksHtml + '</div></div></div></div>';
  }).join('');
  return '<section id="' + data.id + '"><div class="container"><div class="section-header">' +
    headingHtml + focusHtml + '</div>' +
    featuredHtml +
    '<div class="pub-list">' + itemsHtml + '</div>' +
    (allLinkHtml ? '<div class="project-footer">' + allLinkHtml + '</div>' : '') + '</div></section>';
}

function renderProjects(data) {
  var d = data.data;
  var viewAllHtml = d.view_all ? '<a href="' + d.view_all.url + '" class="project-btn">' + d.view_all.label + ' \u2192</a>' : '';
  var featuredHtml = '';
  if (d.featured && d.featured.length) {
    featuredHtml = d.featured.map(function(f) {
      var fImg = f.image ? '<div class="project-img"><img src="' + f.image + '" alt="' + (f.alt || '') + '" loading="lazy"></div>' : '';
      var fStatus = f.status ? '<span class="project-status">' + f.status + '</span>' : '';
      var fTitle = f.title ? '<h3 class="project-card-title">' + f.title + '</h3>' : '';
      var fDesc = f.description ? '<p class="project-card-desc">' + nl2br(f.description) + '</p>' : '';
      var fBtn = f.url ? '<a href="' + f.url + '" class="project-btn">' + (f.btn_label || 'View') + ' \u2192</a>' : '';
      var fBadge = f.badge ? '<span class="project-featured-badge">' + f.badge + '</span>' : '<span class="project-featured-badge">Featured</span>';
      return '<div class="project-featured">' + fBadge + fImg + '<div class="project-card-body">' + fStatus + fTitle + fDesc + fBtn + '</div></div>';
    }).join('');
  }
  return '<section id="' + data.id + '"><div class="container"><div class="section-header">' +
    '<p>' + (d.heading_label || '') + '</p>' +
    '<h2>' + (d.heading || '') + '</h2>' +
    (d.tagline ? '<p class="section-desc">' + nl2br(d.tagline) + '</p>' : '') +
    '</div>' + featuredHtml + '<div class="project-masonry">' +
    (d.items || []).map(function(item) {
      var statusHtml = item.status ? '<span class="project-status">' + item.status + '</span>' : '';
      var titleHtml = item.title ? '<h3 class="project-card-title">' + item.title + '</h3>' : '';
      var descHtml = item.description ? '<p class="project-card-desc">' + nl2br(item.description) + '</p>' : '';
      var btnHtml = item.url ? '<a href="' + item.url + '" class="project-btn">View \u2192</a>' : '';
      var imgHtml = item.image ? '<div class="project-img"><img src="' + item.image + '" alt="' + (item.alt || '') + '" loading="lazy" width="600" height="400"></div>' : '';
      return '<div class="project-item">' +
        imgHtml +
        '<div class="project-card-body">' + statusHtml + titleHtml + descHtml + btnHtml + '</div></div>';
    }).join('') +
    '</div>' + (viewAllHtml ? '<div class="project-footer">' + viewAllHtml + '</div>' : '') + '</div></section>';
}

function renderBlog(data) {
  var d = data.data;
  return '<section id="' + data.id + '"><div class="container"><div class="section-header">' +
    '<p>' + (d.heading_label || '') + '</p>' +
    '<h2>' + (d.heading || '') + '</h2>' +
    (d.tagline ? '<p class="section-desc">' + nl2br(d.tagline) + '</p>' : '') + '</div>' +

    '<div id="blogPostPreview"></div>' +
    (d.read_more_url ? '<div class="blog-preview-footer"><a href="' + d.read_more_url + '" class="project-btn">' + (d.read_more || 'Read All Posts') + '</a></div>' : '') +
    '</div></section>';
}

function renderContact(data) {
  var d = data.data;
  var gi = d.google_icons || {};
  function icon(name, svg) { return gi[name] ? '<span class="material-symbols-outlined" style="font-size:18px">' + escapeHTML(gi[name]) + '</span>' : svg; }
  var addrHtml = d.address && d.address.length ? d.address.map(function(l) { return '<span>' + escapeHTML(l || '') + '</span>'; }).join('') : '';
  var ej = data.emailjs || {};
  var ah = d.active_hours || {};
  var iconPath = 'assets/icons/academic social icons/';
  var iconsHtml = d.icons && d.icons.length ? '<div class="contact-icons">' + d.icons.map(function(ic) {
    return '<a href="' + escapeHTML(ic.url || '#') + '" target="_blank" rel="noopener" class="contact-icon"><img src="' + escapeHTML(iconPath + (ic.name || '') + '.svg') + '" alt="' + escapeHTML(ic.name || '') + '" loading="lazy"></a>';
  }).join('') + '</div>' : '';
  var r = d.right || {};
  var rightHtml;
  if (r.type === 'image' && r.image && r.image.src) {
    var ri = r.image;
    rightHtml = '<div class="contact-image"><img src="' + escapeHTML(ri.src) + '" alt="' + escapeHTML(ri.alt || '') + '" loading="lazy"' + (ri.caption ? '><figcaption>' + escapeHTML(ri.caption) + '</figcaption>' : '>') + '</div>';
  } else if (r.type === 'map' && r.map && r.map.embed) {
    var mapSrc = r.map.embed;
    if (mapSrc.indexOf('<iframe') === 0) {
      var m = mapSrc.match(/src\s*=\s*["']([^"']+)["']/);
      if (m) mapSrc = m[1];
    }
    rightHtml = '<div class="contact-map"><iframe src="' + escapeHTML(mapSrc) + '" loading="lazy" allowfullscreen></iframe></div>';
  } else {
    rightHtml = '<form id="contact-form" class="contact-form" data-service-id="' + escapeHTML(ej.service_id || '') + '" data-template-id="' + escapeHTML(ej.template_id || '') + '" data-public-key="' + escapeHTML(ej.public_key || '') + '">' +
      '<input type="text" name="from_name" placeholder="Your Name" required>' +
      '<input type="email" name="from_email" placeholder="Your Email" required>' +
      '<input type="text" name="subject" placeholder="Subject" required>' +
      '<textarea name="message" placeholder="Your Message" rows="5" required></textarea>' +
      '<button type="submit">' + (d.button || 'Send') + '</button></form>';
  }
  var mailIcon = icon('email', '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/></svg>');
  var phoneIcon = icon('phone', '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M280-40q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v720q0 33-23.5 56.5T680-40H280Zm0-120v40h400v-40H280Zm0-80h400v-480H280v480Zm0-560h400v-40H280v40Zm0 0v-40 40Zm0 640v40-40Zm200-280q-17 0-28.5-11.5T440-480q0-17 11.5-28.5T480-520q17 0 28.5 11.5T520-480q0 17-11.5 28.5T480-440Z"/></svg>');
  var calIcon = icon('best_time_to_email', '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Z"/></svg>');
  var deptIcon = icon('department', '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-80v-112q0-34 17.5-62.5T224-298q62-31 126-46.5T480-360q66 0 130 15.5T736-298q29 15 46.5 43.5T800-192v112H160Zm80-80h480v-32q0-11-5.5-20T700-222q-54-27-109-42.5T480-280q-56 0-111 15.5T260-222q-9 5-14.5 14t-5.5 20v32Zm240-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/></svg>');
  var addrIcon = icon('address', '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/></svg>');
  var hoursIcon = icon('active_hours', '<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/></svg>');
  return '<section id="' + data.id + '" class="contact-section"><div class="container"><div class="contact-grid">' +
    '<div class="contact-info">' +
    '<h2>' + (d.heading || '') + '</h2>' +
    '<p>' + nl2br(d.message) + '</p>' +
    '<div class="contact-details">' +
    '<div class="contact-row">' + mailIcon + '<a href="mailto:' + escapeHTML(d.email || '') + '">' + escapeHTML(d.email || '') + '</a></div>' +
    (d.phone ? '<div class="contact-row">' + phoneIcon + '<span>' + escapeHTML(d.phone) + '</span></div>' : '') +
    (d.best_time_to_email ? '<div class="contact-row">' + calIcon + '<span>' + nl2br(escapeHTML(d.best_time_to_email)) + '</span></div>' : '') +
    (d.department || d.institution ? '<div class="contact-row">' + deptIcon + '<span>' + (d.department ? escapeHTML(d.department) + (d.institution ? ', ' : '') : '') + (d.institution ? escapeHTML(d.institution) : '') + '</span></div>' : '') +
    (addrHtml ? '<div class="contact-row">' + addrIcon + '<div>' + addrHtml + '</div></div>' : '') +
    (ah.label || ah.time ? '<div class="contact-hours">' + hoursIcon + '<div><strong>' + escapeHTML(ah.label || 'Office Hours') + '</strong><span>' + escapeHTML(ah.time || '') + '</span>' + (ah.note ? '<em>' + escapeHTML(ah.note) + '</em>' : '') + '</div></div>' : '') +
    '</div>' + iconsHtml + '</div>' +
    rightHtml + '</div></div></section>';
}
