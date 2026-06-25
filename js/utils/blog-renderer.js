var blogState = { posts: [], fnRefCounts: {}, fnRefs: {} };

function formatDate(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function blogFormatText(str) {
  if (!str) return '';
  var saved = {};
  var n = 0;
  str = str.replace(/\\(.)/g, function(_, c) {
    var k = '\x00' + n++;
    saved[k] = c;
    return k;
  });
  str = str.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  str = str.replace(/~~(.+?)~~/g, '<s>$1</s>');
  str = str.replace(/\+\+(.+?)\+\+/g, '<u>$1</u>');
  str = str.replace(/==(.+?)==/g, '<mark>$1</mark>');
  str = str.replace(/\|\|(.+?)\|\|/g, '<span class="blog-spoiler">$1</span>');
  str = str.replace(/\^(.+?)\^/g, '<sup>$1</sup>');
  str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/__(.+?)__/g, '<strong>$1</strong>');
  str = str.replace(/\*(.+?)\*/g, '<em>$1</em>');
  str = str.replace(/_(.+?)_/g, '<em>$1</em>');
  str = str.replace(/~(.+?)~/g, '<sub>$1</sub>');
  str = str.replace(/`(.+?)`/g, '<code>$1</code>');
  str = str.replace(/\(fn:([\w.-]+)\)/g, function(_, id) {
    if (!blogState.fnRefCounts[id]) blogState.fnRefCounts[id] = 0;
    var idx = blogState.fnRefCounts[id]++;
    var refId = 'fnref-' + id + '-' + idx;
    if (!blogState.fnRefs[id]) blogState.fnRefs[id] = [];
    blogState.fnRefs[id].push(refId);
    return '<sup class="fn-ref" id="' + refId + '"><a href="#" class="fn-link" data-fn="' + id + '">' + id + '</a></sup>';
  });
  str = str.replace(/\{([^}|]+)\|([^}]+)\}/g, function(_, text, url) {
    return '<a href="' + url + '">' + text + '</a>';
  });
  var aTags = {};
  var aN = 0;
  str = str.replace(/<a\b[^>]*>.*?<\/a>/g, function(m) {
    var k = '\x01A' + aN++;
    aTags[k] = m;
    return k;
  });
  str = str.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  str = str.replace(/\x01A\d+/g, function(m) { return aTags[m] || ''; });
  str = str.replace(/\x00\d+/g, function(m) { return saved[m] || ''; });
  return str;
}

function blogHtml(str) {
  return blogFormatText(escapeHTML(str));
}

function renderBlock(block, context) {
  switch (block.type) {
    case 'heading': {
      var level = Math.min(Math.max(block.level || 2, 1), 6);
      return '<div class="block block-heading"><h' + level + '>' + blogHtml(block.text || '') + '</h' + level + '></div>';
    }
    case 'paragraph':
      return '<div class="block block-paragraph"><p>' + blogHtml(block.content || '') + '</p></div>';
    case 'text':
      return '<div class="block block-text"><p>' + blogHtml(block.text || '') + '</p></div>';
    case 'image': {
      var layout = block.layout || 'center';
      var size = block.size || 'large';
      var alt = escapeHTML(block.alt || '');
      var caption = block.caption ? '<figcaption>' + escapeHTML(block.caption) + '</figcaption>' : '';
      var credit = block.credit ? '<span class="img-credit">' + escapeHTML(block.credit) + '</span>' : '';
      var borderCls = block.border ? ' img-border' : '';
      var lightboxAttr = block.lightbox ? ' data-lightbox="true"' : '';
      var img = '<img src="' + IMG_PREFIX + escapeHTML(block.src || '') + '" alt="' + alt + '" loading="lazy">';
      if (block.link) {
        var target = block.target === '_blank' ? ' target="_blank" rel="noopener"' : '';
        img = '<a href="' + escapeHTML(block.link) + '"' + target + '>' + img + '</a>';
      }
      var figure = '<figure class="img-figure' + borderCls + '"' + lightboxAttr + '>' + img + credit + caption + '</figure>';
      if (layout === 'left' || layout === 'right') {
        var text = block.text ? '<div class="img-text">' + blogHtml(block.text) + '</div>' : '';
        return '<div class="block block-image layout-' + layout + ' size-' + size + '">' + (layout === 'left' ? figure + text : text + figure) + '</div>';
      }
      return '<div class="block block-image layout-' + layout + ' size-' + size + '">' + figure + '</div>';
    }
    case 'code': {
      var lang = block.language ? '<span class="code-lang">' + escapeHTML(block.language) + '</span>' : '';
      var filename = block.filename ? '<span class="code-filename">' + escapeHTML(block.filename) + '</span>' : '';
      var showCopy = block.enableCopy !== false;
      var copyBtn = showCopy ? '<button class="code-copy" data-copy="' + escapeHTML(block.code || '') + '">Copy</button>' : '';
      var header = (lang || filename || copyBtn) ? '<div class="code-header">' + lang + filename + copyBtn + '</div>' : '';
      var highlightSet = {};
      if (block.highlightLines) {
        for (var hi = 0; hi < block.highlightLines.length; hi++) { highlightSet[block.highlightLines[hi]] = true; }
      }
      var lines = block.code.split('\n');
      var numbered = block.showLineNumbers;
      var maxLen = numbered ? String(lines.length).length : 0;
      var codeHtml = '';
      for (var li = 0; li < lines.length; li++) {
        var lineNum = numbered ? '<span class="cl-num">' + String(li + 1).padStart(maxLen, ' ') + '</span>' : '';
        var hl = highlightSet[li + 1] ? ' cl-hl' : '';
        codeHtml += '<span class="cl-line' + hl + '">' + lineNum + '<span class="cl-text">' + escapeHTML(lines[li]) + '</span></span>';
      }
      return '<div class="block block-code">' + header + '<pre class="code-pre"><code>' + codeHtml + '</code></pre></div>';
    }
    case 'blockquote':
    case 'pullquote':
    case 'epigraph': {
      var qLayout = block.type === 'pullquote' ? (block.layout || 'center') : (block.layout || 'right');
      var attribution = '';
      if (block.attribution) {
        var cite = '<cite>' + blogHtml(block.attribution) + '</cite>';
        var linked = block.citeUrl ? '<a href="' + escapeHTML(block.citeUrl) + '">' + cite + '</a>' : cite;
        attribution = '<p class="quote-attribution">&mdash; ' + linked + '</p>';
      }
      return '<div class="block block-' + block.type + ' layout-' + qLayout + '">' + blogHtml(block.text || '') + attribution + '</div>';
    }
    case 'math': {
      var formula = block.formula || '';
      var displayMode = block.displayMode !== false;
      var label = block.label ? '<span class="math-label">(' + escapeHTML(block.label) + ')</span>' : '';
      var caption = block.caption ? '<figcaption class="math-caption">' + blogHtml(block.caption) + '</figcaption>' : '';
      var rendered;
      try {
        if (typeof katex !== 'undefined') {
          rendered = katex.renderToString(formula, { displayMode: displayMode, throwOnError: false });
        } else {
          rendered = '<code class="math-fallback">' + escapeHTML(formula) + '</code>';
        }
      } catch (e) {
        rendered = '<code class="math-fallback">' + escapeHTML(formula) + '</code>';
      }
      if (!displayMode) {
        return '<span class="block-math math-inline">' + rendered + '</span>';
      }
      var align = block.align || 'center';
      var alignCls = align === 'left' ? ' math-left' : '';
      return '<div class="block block-math math-display' + alignCls + '">' + rendered + label + '</div>' + (caption ? '<div class="block block-math-caption">' + caption + '</div>' : '');
    }
    case 'table': {
      var headers = block.headers || [];
      var aligns = block.alignments || [];
      var striped = block.striped ? ' table-striped' : '';
      var capPos = block.captionPosition === 'top' ? ' cap-top' : '';
      var tblCaption = block.caption ? '<caption>' + blogHtml(block.caption) + '</caption>' : '';
      var rows = block.rows || [];
      var thead = '';
      if (headers.length) {
        var headCells = '';
        for (var hi2 = 0; hi2 < headers.length; hi2++) {
          var ha = aligns[hi2] ? ' style="text-align:' + aligns[hi2] + '"' : '';
          headCells += '<th' + ha + '>' + escapeHTML(headers[hi2] || '') + '</th>';
        }
        thead = '<thead><tr>' + headCells + '</tr></thead>';
      }
      var tbodyRows = '';
      for (var ri = 0; ri < rows.length; ri++) {
        var row = rows[ri];
        if (!Array.isArray(row)) continue;
        var cells = '';
        for (var ci = 0; ci < row.length; ci++) {
          var ca = aligns[ci] ? ' style="text-align:' + aligns[ci] + '"' : '';
          cells += '<td' + ca + '>' + blogHtml(String(row[ci] || '')) + '</td>';
        }
        tbodyRows += '<tr>' + cells + '</tr>';
      }
      return '<div class="block block-table' + striped + capPos + '"><table>' + tblCaption + thead + '<tbody>' + tbodyRows + '</tbody></table></div>';
    }
    case 'list': {
      var listStyle = block.style === 'number' ? 'ol' : 'ul';
      var rawItems = block.items || [];
      var parseItem = function(item) {
        if (typeof item === 'object' && item.text != null) {
          return { level: 0, text: String(item.text), sublist: item.sublist || null };
        }
        var str = String(item);
        var sp = str.match(/^(\s*)(.*)/);
        return { level: Math.floor(sp[1].length / 2), text: sp[2], sublist: null };
      };
      var renderList = function(items, startIdx, tag) {
        var i = startIdx;
        var baseLevel = items[startIdx] ? items[startIdx].level : 0;
        var lis = [];
        while (i < items.length) {
          var item = items[i];
          if (item.level < baseLevel) break;
          if (item.level === baseLevel) {
            var text = item.text;
            var checked = '';
            if (/^\[x\]\s*/i.test(text)) { checked = ' checked'; text = text.replace(/^\[x\]\s*/i, ''); }
            else if (/^\[\s*\]\s*/.test(text)) { checked = ''; text = text.replace(/^\[\s*\]\s*/i, ''); }
            var cb = checked !== '' ? '<input type="checkbox"' + checked + '>' : '';
            var inner = '';
            if (item.sublist) {
              var subTag = item.sublist.style === 'number' ? 'ol' : 'ul';
              var subItems = (item.sublist.items || []).map(parseItem);
              inner = blogHtml(text) + renderList(subItems, 0, subTag).html;
            } else {
              inner = cb + blogHtml(text);
              if (i + 1 < items.length && items[i + 1].level > baseLevel) {
                var result = renderList(items, i + 1, tag);
                inner += result.html;
                i += result.consumed;
              }
            }
            lis.push('<li>' + inner + '</li>');
            i++;
          } else { i++; }
        }
        return { html: '<' + tag + ' class="ll">' + lis.join('') + '</' + tag + '>', consumed: i - startIdx };
      };
      var parsed = rawItems.map(parseItem);
      var result = parsed.length ? renderList(parsed, 0, listStyle) : '';
      return '<div class="block block-list">' + (result.html || '') + '</div>';
    }
    case 'link':
      return '<div class="block block-link"><a href="' + escapeHTML(block.url || '') + '" target="_blank" rel="noopener" class="cta-link">' + blogHtml(block.text || '') + '</a></div>';
    case 'button': {
      var btnAlign = block.align || 'left';
      var variant = block.variant === 'outline' ? ' btn-outline' : ' btn-primary';
      var btnText = block.text ? blogHtml(block.text) : '';
      return '<div class="block block-button align-' + btnAlign + '"><a href="' + escapeHTML(block.url || '#') + '" target="_blank" rel="noopener" class="btn' + variant + '">' + btnText + '</a></div>';
    }
    case 'video': {
      var vidUrl = block.url || '';
      var vidCaption = block.caption ? '<figcaption>' + escapeHTML(block.caption) + '</figcaption>' : '';
      var poster = block.poster ? ' poster="' + escapeHTML(block.poster) + '"' : '';
      var embed = '';
      var ytMatch = vidUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
      if (ytMatch) {
        embed = '<iframe src="https://www.youtube.com/embed/' + ytMatch[1] + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      }
      var vimeoMatch = vidUrl.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        embed = '<iframe src="https://player.vimeo.com/video/' + vimeoMatch[1] + '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
      }
      if (!embed) {
        var vidType = 'mp4';
        if (vidUrl.endsWith('.webm')) vidType = 'webm';
        else if (vidUrl.endsWith('.ogg')) vidType = 'ogg';
        embed = '<video controls' + poster + '><source src="' + escapeHTML(vidUrl) + '" type="video/' + vidType + '">Your browser does not support the video tag.</video>';
      }
      return '<div class="block block-video"><figure class="video-figure">' + embed + vidCaption + '</figure></div>';
    }
    case 'gallery': {
      var images = block.images || [];
      var gLayout = block.layout || 'grid';
      var cols = block.columns || 3;
      var ratio = block.ratio || 'original';
      var imgHtml = function(img) {
        var ialt = escapeHTML(img.alt || '');
        var icredit = img.credit ? '<span class="img-credit">' + escapeHTML(img.credit) + '</span>' : '';
        var icaption = img.caption ? '<figcaption>' + blogHtml(img.caption) + '</figcaption>' : '';
        return '<figure class="gallery-figure">' + icredit + '<img src="' + IMG_PREFIX + escapeHTML(img.src || '') + '" alt="' + ialt + '" loading="lazy">' + icaption + '</figure>';
      };
      if (gLayout === 'masonry') {
        var masonryItems = '';
        for (var mi = 0; mi < Math.min(images.length, 2); mi++) {
          var mcls = mi === 0 ? ' masonry-hero' : ' masonry-side';
          masonryItems += '<div class="gallery-cell' + mcls + '">' + imgHtml(images[mi]) + '</div>';
        }
        return '<div class="block block-gallery layout-masonry ratio-' + ratio + '"><div class="gallery-masonry">' + masonryItems + '</div></div>';
      }
      if (gLayout === 'carousel') {
        var carouselItems = '';
        for (var ci2 = 0; ci2 < images.length; ci2++) {
          carouselItems += '<div class="gallery-cell">' + imgHtml(images[ci2]) + '</div>';
        }
        return '<div class="block block-gallery layout-carousel"><div class="gallery-track">' + carouselItems + '</div></div>';
      }
      var gridItems = '';
      for (var gi = 0; gi < images.length; gi++) {
        gridItems += '<div class="gallery-cell">' + imgHtml(images[gi]) + '</div>';
      }
      return '<div class="block block-gallery layout-grid cols-' + cols + ' ratio-' + ratio + '"><div class="gallery-grid">' + gridItems + '</div></div>';
    }
    case 'audio': {
      var aTitle = block.title ? '<div class="audio-title">' + escapeHTML(block.title) + '</div>' : '';
      var aCaption = block.caption ? '<figcaption>' + escapeHTML(block.caption) + '</figcaption>' : '';
      return '<div class="block block-audio"><figure>' + aTitle + '<audio controls src="' + escapeHTML(block.src || '') + '"></audio>' + aCaption + '</figure></div>';
    }
    case 'divider': {
      var divStyle = block.style || 'solid';
      return '<hr class="block block-divider divider-' + divStyle + '">';
    }
    case 'spacer': {
      var spH = Math.max(parseInt(block.height, 10) || 40, 1);
      return '<div class="block block-spacer" style="height:' + spH + 'px"></div>';
    }
    case 'columns': {
      var colCount = Math.min(Math.max(block.count || 2, 2), 3);
      var cols = block.columns || [];
      var colHtml = '';
      for (var ci3 = 0; ci3 < cols.length; ci3++) {
        var inner = '';
        var innerBlocks = cols[ci3].blocks || [];
        for (var bi = 0; bi < innerBlocks.length; bi++) {
          inner += renderBlock(innerBlocks[bi], context);
        }
        colHtml += '<div class="col">' + inner + '</div>';
      }
      return '<div class="block block-columns cols-' + colCount + '">' + colHtml + '</div>';
    }
    case 'callout': {
      var icons = { info: '\u2139\uFE0F', tip: '\uD83D\uDCA1', warning: '\u26A0\uFE0F', error: '\u274C' };
      var callStyle = block.style || 'info';
      var icon = icons[callStyle] || icons.info;
      return '<div class="block block-callout callout-' + callStyle + '"><span class="callout-icon">' + icon + '</span><div class="callout-body">' + blogHtml(block.text || '') + '</div></div>';
    }
    case 'accordion': {
      var accOpen = block.open ? ' open' : '';
      return '<details class="block block-accordion"' + accOpen + '><summary>' + escapeHTML(block.summary || '') + '</summary><div class="accordion-content">' + blogHtml(block.text || '') + '</div></details>';
    }
    default:
      return '';
  }
}

function renderPostDetail(post) {
  blogState.fnRefCounts = {};
  blogState.fnRefs = {};
  var ctx = { posts: blogState.posts, view: 'post' };
  var blocks = '';
  if (post.blocks) {
    for (var bi2 = 0; bi2 < post.blocks.length; bi2++) {
      blocks += renderBlock(post.blocks[bi2], ctx);
    }
  }
  var footnotesHtml = '';
  if (post.footnotes && post.footnotes.length) {
    var fnItems = '';
    for (var fi = 0; fi < post.footnotes.length; fi++) {
      var fn = post.footnotes[fi];
      var refs = blogState.fnRefs[fn.id] || [];
      var backLinks = '';
      for (var bri = 0; bri < refs.length; bri++) {
        backLinks += '<a href="#" class="fn-back" data-fnref="' + refs[bri] + '" aria-label="Back to reference">&#8617;<sup>' + (bri + 1) + '</sup></a>';
      }
      fnItems += '<li id="fn-' + escapeHTML(fn.id) + '">' + blogHtml(fn.text || '') + ' ' + backLinks + '</li>';
    }
    footnotesHtml = '<section class="footnotes"><h2 class="footnotes-title">Footnotes</h2><ol>' + fnItems + '</ol></section>';
  }
  var heroHtml = '';
  if (post.hero) {
    var hero = typeof post.hero === 'string' ? { src: post.hero } : post.hero;
    var hAlt = escapeHTML(hero.alt || post.title || '');
    var hTagline = hero.tagline ? '<p class="hero-tagline size-' + (hero.taglineSize || 'xl') + '">' + blogHtml(hero.tagline) + '</p>' : '';
    var hCaption = hero.caption ? '<figcaption>' + escapeHTML(hero.caption) + '</figcaption>' : '';
    var hCredit = hero.credit ? '<span class="img-credit">' + escapeHTML(hero.credit) + '</span>' : '';
    heroHtml = '<figure class="hero-figure align-' + (hero.align || 'center') + '">' + hCredit + '<img src="' + IMG_PREFIX + escapeHTML(hero.src || '') + '" alt="' + hAlt + '" class="hero-img">' + hTagline + hCaption + '</figure>';
  }
  return '<div class="post-detail">' +
    '<div class="container"><div class="post-header-row">' +
    '<a href="blog.html" class="back-btn">&larr; Back to all posts</a>' +
    '<button class="post-theme-toggle" aria-label="Toggle theme"><svg class="theme-icon theme-icon-dark" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/></svg><svg class="theme-icon theme-icon-light" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M440-760v-160h80v160h-80Zm266 110-55-55 112-115 56 57-113 113Zm54 210v-80h160v80H760ZM440-40v-160h80v160h-80ZM254-652 140-763l57-56 113 113-56 54Zm508 512L651-255l54-54 114 110-57 59ZM40-440v-80h160v80H40Zm157 300-56-57 112-112 29 27 29 28-114 114Zm113-170q-70-70-70-170t70-170q70-70 170-70t170 70q70 70 70 170t-70 170q-70 70-170 70t-170-70Zm283-57q47-47 47-113t-47-113q-47-47-113-47t-113 47q-47 47-47 113t47 113q47 47 113 47t113-47ZM480-480Z"/></svg></button>' +
    '</div>' +
    heroHtml +
    '<h1 class="post-title">' + escapeHTML(post.title || '') + '</h1>' +
    '<div class="post-meta">' + formatDate(post.date) + '</div>' +
    blocks +
    footnotesHtml +
    '</div></div>';
}

function showBlogPost(id) {
  var post = null;
  for (var pi = 0; pi < blogState.posts.length; pi++) {
    if (blogState.posts[pi].id === id) { post = blogState.posts[pi]; break; }
  }
  if (!post) return;
  fetch(post.file).then(function(r) {
    if (!r.ok) throw new Error('Failed to load post');
    return r.json();
  }).then(function(data) {
    var app = document.getElementById('app');
    var sections = app.querySelectorAll('section');
    for (var si = 0; si < sections.length; si++) {
      sections[si].style.display = 'none';
    }
    var existing = document.getElementById('postDetailWrapper');
    if (existing) existing.remove();
    var wrapper = document.createElement('div');
    wrapper.id = 'postDetailWrapper';
    wrapper.innerHTML = renderPostDetail(data);
    app.appendChild(wrapper);
    window.scrollTo(0, 0);
  }).catch(function() {
    var wrapper = document.getElementById('postDetailWrapper');
    if (wrapper) {
      wrapper.innerHTML = '<div class="container"><div class="blog-empty">Failed to load this post.</div></div>';
    }
  });
}

function backToPosts() {
  var app = document.getElementById('app');
  var wrapper = document.getElementById('postDetailWrapper');
  if (wrapper) wrapper.remove();
  var sections = app.querySelectorAll('section');
  for (var si = 0; si < sections.length; si++) {
    sections[si].style.display = '';
  }
  var blogSection = document.getElementById('blog');
  if (blogSection) blogSection.scrollIntoView({ behavior: 'smooth' });
}

var IMG_PREFIX = window.IMG_PREFIX || '';
function renderBlogCard(post, linkUrl) {
  var excerpt = post.excerpt || '';
  var imgHtml = post.image ? '<div class="blog-card-img"><img src="' + IMG_PREFIX + escapeHTML(post.image) + '" alt="" loading="lazy"></div>' : '';
  var metaHtml = '<div class="blog-card-meta"><span class="blog-date">' + formatDate(post.date) + '</span></div>';
  var bodyHtml = '<h3 class="blog-title">' + escapeHTML(post.title || '') + '</h3>' +
    (excerpt ? '<p class="blog-excerpt">' + escapeHTML(excerpt) + '</p>' : '');
  var postUrl = linkUrl || 'blog.html?post=' + escapeHTML(post.id || '');
  var articleContent = imgHtml + metaHtml + bodyHtml +
    '<div class="blog-card-footer"><a href="' + escapeHTML(postUrl) + '" class="project-btn">Inspect Log \u2192</a></div>';
  return '<article class="blog-card" data-id="' + escapeHTML(post.id || '') + '">' + articleContent + '</article>';
}

function initBlog(containerId, manifestPath) {
  var container = document.getElementById(containerId);
  if (!container) return;
  fetch(manifestPath + '?t=' + Date.now()).then(function(r) {
    if (!r.ok) throw new Error('Failed to load manifest');
    return r.json();
  }).then(function(data) {
    blogState.posts = data.posts || [];

    var params = (new URL(document.location)).searchParams;
    var postId = params.get('post');
    if (postId) {
      var found = null;
      for (var pi = 0; pi < blogState.posts.length; pi++) {
        if (blogState.posts[pi].id === postId) { found = blogState.posts[pi]; break; }
      }
      if (found) {
          fetch(IMG_PREFIX + found.file + '?t=' + Date.now()).then(function(r) { return r.json(); }).then(function(postData) {
          container.innerHTML = renderPostDetail(postData);
        }).catch(function() {
          container.innerHTML = '<div class="blog-empty">Failed to load post.</div>';
        });
      } else {
        container.innerHTML = '<div class="blog-empty">Post not found.</div>';
      }
      return;
    }

    if (!blogState.posts.length) {
      container.innerHTML = '<div class="blog-empty">No posts yet.</div>';
      return;
    }
    var html = '<div class="blog-listing"><div class="blog-grid" id="blog-grid">';
    for (var pi = 0; pi < blogState.posts.length; pi++) {
      html += renderBlogCard(blogState.posts[pi]);
    }
    html += '</div></div>';
    container.innerHTML = html;
  }).catch(function(err) {
    container.innerHTML = '<div class="blog-empty">Failed to load posts.</div>';
  });
}

function initBlogPreview(containerId, manifestPath, maxCount, allLink) {
  var container = document.getElementById(containerId);
  if (!container) return;
  fetch(manifestPath + '?t=' + Date.now()).then(function(r) {
    if (!r.ok) throw new Error('Failed to load manifest');
    return r.json();
  }).then(function(data) {
    var posts = data.posts || [];
    posts = posts.filter(function(p) { return p.featured; });
    if (!posts.length) {
      container.innerHTML = '<div class="blog-empty">No featured posts yet.</div>';
      return;
    }
    var count = Math.min(maxCount || posts.length, posts.length);
    var gridHtml = '<div class="blog-grid" id="blog-grid">';
    for (var pi = 0; pi < count; pi++) {
      gridHtml += renderBlogCard(posts[pi], 'pages/blog.html?post=' + posts[pi].id);
    }
    gridHtml += '</div>';
    container.innerHTML = gridHtml;
  }).catch(function(err) {
    container.innerHTML = '<div class="blog-empty">Failed to load posts.</div>';
  });
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('app').addEventListener('click', function(e) {
    var card = e.target.closest('.blog-card');
    if (card && card.dataset.id) { e.preventDefault(); var btn = card.querySelector('.project-btn'); window.location.href = btn ? btn.getAttribute('href') : 'blog.html?post=' + card.dataset.id; return; }
    var fnLink = e.target.closest('.fn-link');
    if (fnLink) {
      e.preventDefault();
      var fnId = fnLink.dataset.fn;
      var fnEl = document.getElementById('fn-' + fnId);
      if (!fnEl) return;
      var actives = document.querySelectorAll('.fn-active');
      for (var ai = 0; ai < actives.length; ai++) actives[ai].classList.remove('fn-active');
      fnEl.classList.add('fn-active');
      fnEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    var fnBack = e.target.closest('.fn-back');
    if (fnBack) {
      e.preventDefault();
      var refId = fnBack.dataset.fnref;
      var el = document.getElementById(refId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    var lightboxFig = e.target.closest('[data-lightbox="true"]');
    if (lightboxFig) {
      e.preventDefault();
      var img = lightboxFig.querySelector('img');
      if (!img) return;
      var overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = '<div class="lightbox-bg"></div><img src="' + escapeHTML(img.src) + '" alt="' + escapeHTML(img.alt) + '" class="lightbox-img"><button class="lightbox-close">&times;</button>';
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      overlay.addEventListener('click', function(ev) {
        if (ev.target.closest('.lightbox-close') || ev.target.classList.contains('lightbox-bg')) {
          overlay.remove();
          document.body.style.overflow = '';
        }
      });
      return;
    }
    var copyBtn = e.target.closest('.code-copy');
    if (copyBtn) {
      e.preventDefault();
      var code = copyBtn.dataset.copy;
      navigator.clipboard.writeText(code).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
      }).catch(function() {
        var ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
      });
      return;
    }
  });
});
