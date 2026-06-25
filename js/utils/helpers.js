function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  try { localStorage.setItem('theme', theme); } catch (e) {}
}

function getPreferredTheme() {
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function loadTheme() {
  setTheme(getPreferredTheme());
}

function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function nl2br(t) {
  return (t || '').replace(/\n/g, '<br>');
}

function formatParagraphs(t) {
  if (!t) return '';
  return t.split('\n\n').map(function(block) {
    var trimmed = block.trim();
    if (!trimmed) return '';
    return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
  }).join('');
}

function formatText(t) {
  return t
    .replace(/`([^`]+)`/g, '<code class="text-sm bg-surface-variant px-1 rounded">$1</code>')
    .replace(/\*\*([^*]+)\s\*\s([^*]+)\*\*/g, '<a href="$2" class="underline underline-offset-2 hover:opacity-80">$1</a>');
}
