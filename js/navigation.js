// ---- scrollspy for top micro-nav + dynamic pills in the left rail
(function(){
  const sections = document.querySelectorAll('.section');
  const navlink = document.querySelectorAll('.navlink');
  const pillsHost = document.getElementById('dynamic-pills');

  function setActive(id){
    navlink.forEach(a=>{
      a.classList.toggle('active', a.getAttribute('href') === '#'+id);
    });
  }
  function setPillsFor(section){
    const tags = (section.dataset.tags || '').split(',').map(s=>s.trim()).filter(Boolean);
    pillsHost.innerHTML = tags.map(t=>`<span class="pill">${t}</span>`).join('') || pillsHost.innerHTML;
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const id = entry.target.id;
        setActive(id);
        setPillsFor(entry.target);
      }
    });
  }, { root:null, rootMargin:'0px 0px -60% 0px', threshold:0.25 });

  sections.forEach(sec=>io.observe(sec));
})();
