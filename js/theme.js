(function(){
  const STORAGE_KEY = 'theme';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  let saved = localStorage.getItem(STORAGE_KEY);
  
  // If no saved preference, default to 'system' to follow OS
  // Also treat empty string or invalid values as 'system'
  if(!saved || (saved !== 'system' && saved !== 'dark' && saved !== 'light')) {
    saved = 'system';
    localStorage.setItem(STORAGE_KEY, 'system');
  }

  function getSystemTheme(){
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(mode){
    // If mode is 'system', use system preference
    const actualMode = mode === 'system' ? getSystemTheme() : mode;
    document.body.setAttribute('data-theme', actualMode === 'dark' ? 'dark' : 'light');
  }

  function getCurrentTheme(){
    return saved === 'system' ? getSystemTheme() : saved;
  }

  // set initial - make sure system mode actually applies system preference
  applyTheme(saved);

  // Function to check and apply system theme if needed
  function checkAndApplySystemTheme(){
    const currentSaved = localStorage.getItem(STORAGE_KEY);
    if(currentSaved === 'system' || !currentSaved){
      applyTheme('system');
    }
  }

  // watch OS changes - always listen, but only apply if in 'system' mode
  if(window.matchMedia){
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Use addListener for better browser compatibility (especially mobile)
    const handleSystemChange = (e) => {
      checkAndApplySystemTheme();
    };
    
    // Add both addEventListener and addListener for maximum compatibility
    if(mediaQuery.addEventListener){
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if(mediaQuery.addListener){
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemChange);
    }
  }

  // Also check when page becomes visible (user switches back to tab/app)
  document.addEventListener('visibilitychange', () => {
    if(!document.hidden){
      checkAndApplySystemTheme();
    }
  });

  // Periodic check as fallback (every 2 seconds) - useful for mobile browsers
  let lastSystemTheme = getSystemTheme();
  setInterval(() => {
    const currentSystemTheme = getSystemTheme();
    if(currentSystemTheme !== lastSystemTheme){
      lastSystemTheme = currentSystemTheme;
      checkAndApplySystemTheme();
    }
  }, 2000);

  function toggleTheme(){
    // Always get current value from localStorage
    const currentSaved = localStorage.getItem(STORAGE_KEY) || 'system';
    const currentTheme = currentSaved === 'system' ? getSystemTheme() : currentSaved;
    let next;
    
    // Cycle: system -> dark -> light -> system
    if(currentSaved === 'system'){
      next = 'dark';
    } else if(currentTheme === 'dark'){
      next = 'light';
    } else {
      next = 'system';
    }
    
    saved = next;
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  // click toggle
  const btn = document.getElementById('theme-toggle');
  if(btn){
    btn.addEventListener('click', toggleTheme);
  }

  // floating toggle for mobile
  const floatingBtn = document.getElementById('floating-theme-toggle');
  if(floatingBtn){
    floatingBtn.addEventListener('click', toggleTheme);
  }

  // optional: keyboard shortcut "t" to toggle
  document.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey){
      toggleTheme();
    }
  });
})();
