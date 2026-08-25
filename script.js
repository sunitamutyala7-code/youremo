const text=document.getElementById('text'),count=document.getElementById('count'),message=document.getElementById('message');
text.addEventListener('input',()=>count.textContent=text.value.length);
document.querySelectorAll('.emotion').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.emotion').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  const e=btn.dataset.emotion;
  document.getElementById('placeholder').textContent=e==='More'?'Write what you are feeling...':`Write what you're feeling about being ${e.toLowerCase()}...`;
}));
document.querySelectorAll('.privacy').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.privacy').forEach(x=>x.classList.remove('chosen'));
  btn.classList.add('chosen');
  document.querySelectorAll('.privacy mark').forEach(x=>x.remove());
  const mark=document.createElement('mark');mark.textContent='✓';btn.appendChild(mark);
}));
document.getElementById('shareBtn').addEventListener('click',()=>{
 if(!text.value.trim()){message.textContent='Write what you are feeling first.';return}
 message.textContent='Your emotion is ready to be shared in this demo.';
 text.value='';count.textContent='0';
});
