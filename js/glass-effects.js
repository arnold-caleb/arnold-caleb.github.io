// Glass effects for both .glass elements and profile picture
document.querySelectorAll('.glass, .pfp').forEach(el=>{
  el.addEventListener('mousemove', e=>{
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--x', x + '%');
    el.style.setProperty('--y', y + '%');
  });
  el.addEventListener('mouseleave', ()=>{
    el.style.removeProperty('--x');
    el.style.removeProperty('--y');
  });
});
