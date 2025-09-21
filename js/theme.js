(function(){
  const STORAGE_KEY = 'theme';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = saved ? saved : (prefersDark ? 'dark' : 'light');

  function applyTheme(mode){
    document.body.setAttribute('data-theme', mode === 'dark' ? 'dark' : 'light');
    const emoji = document.getElementById('theme-emoji');
    const label = document.getElementById('theme-label');
    if(emoji && label){
      if(mode === 'dark'){ emoji.textContent = '☀️'; label.textContent = 'Light'; }
      else { emoji.textContent = '🌙'; label.textContent = 'Dark'; }
    }
  }

  // set initial
  applyTheme(initial);

  // watch OS changes (only if user hasn't explicitly chosen)
  if(!saved && window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e=>{
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }

  // click toggle
  const btn = document.getElementById('theme-toggle');
  if(btn){
    btn.addEventListener('click', ()=>{
      const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }

  // optional: keyboard shortcut "t" to toggle
  document.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey){
      const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    }
  });
})();
