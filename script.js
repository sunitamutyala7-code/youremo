const menuBtn=document.getElementById("menuBtn");const nav=document.getElementById("navLinks");if(menuBtn)menuBtn.addEventListener("click",()=>nav.classList.toggle("open"));
document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
document.querySelectorAll("#emotions button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#emotions button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected")}));
document.querySelectorAll(".support").forEach(btn=>btn.addEventListener("click",()=>{btn.classList.toggle("sent");btn.textContent=btn.classList.contains("sent")?"✓ Support sent":"♡ Support"}));
const shareBtn=document.getElementById("shareBtn"),status=document.getElementById("shareStatus");if(shareBtn)shareBtn.addEventListener("click",()=>{status.textContent="✓ Your feeling was shared with your friends.";setTimeout(()=>status.textContent="",3500)});
