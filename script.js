const text=document.getElementById('text');
const count=document.getElementById('count');
const message=document.getElementById('message');
const placeholder=document.getElementById('placeholder');
const menuBtn=document.getElementById('menuBtn');
const mobileNav=document.getElementById('mobileNav');

text.addEventListener('input',()=>{count.textContent=text.value.length;message.textContent='';});

document.querySelectorAll('.emotion').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.emotion').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  const emotion=btn.dataset.emotion;
  placeholder.textContent=emotion==='More'?'Tell us what you are feeling...':`Tell us about feeling ${emotion.toLowerCase()}...`;
  text.focus();
}));

document.querySelectorAll('.privacy').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.privacy').forEach(x=>{x.classList.remove('chosen');const mark=x.querySelector('mark');if(mark)mark.remove();});
  btn.classList.add('chosen');
  const mark=document.createElement('mark');mark.textContent='✓';btn.appendChild(mark);
}));

document.getElementById('shareBtn').addEventListener('click',()=>{
  if(!text.value.trim()){
    message.textContent='Write a little about how you feel first.';
    text.focus();
    return;
  }
  message.textContent='Your emotion is ready to be shared — demo mode.';
  text.value='';count.textContent='0';
});

menuBtn.addEventListener('click',()=>{
  const open=mobileNav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded',String(open));
});

document.querySelectorAll('.mobile-nav a').forEach(link=>link.addEventListener('click',()=>{
  mobileNav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');
}));

const sections=[...document.querySelectorAll('main section[id]')];
const navLinks=[...document.querySelectorAll('.nav a')];
const setActive=()=>{
  const y=window.scrollY+130;
  let current='home';
  sections.forEach(section=>{if(y>=section.offsetTop)current=section.id;});
  navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+current));
};
window.addEventListener('scroll',setActive,{passive:true});
setActive();
