
"use strict";

/* =========================================================
   YouRemo - stable replacement script
   ========================================================= */

const SUPABASE_URL = "https://ykqnqdtekbxnevtjjkbd.supabase.co";
const SUPABASE_KEY = "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

let supabaseClient = null;
let currentUser = null;
let messageFriends = [];
let selectedMessageFriend = null;
let messageRealtimeChannel = null;
let authBusy = false;

function initSupabase(){
  if(!window.supabase){
    console.error("Supabase library did not load.");
    return false;
  }
  if(!supabaseClient){
    supabaseClient = window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    window.supabaseClient = supabaseClient;
  }
  return true;
}

function pageName(){
  return (location.pathname.split("/").pop() || "index.html").toLowerCase();
}
function el(id){ return document.getElementById(id); }
function text(id,value){ const x=el(id); if(x) x.textContent=value??""; }
function value(id,v){ const x=el(id); if(x) x.value=v??""; }
function initials(name){
  const a=String(name||"?").trim().split(/\s+/).filter(Boolean);
  return a.length>1 ? (a[0][0]+a[a.length-1][0]).toUpperCase() : (a[0]||"?").slice(0,2).toUpperCase();
}
function esc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function escAttr(v){ return esc(v).replace(/`/g,"&#096;"); }

function notify(message){
  let t=el("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent=message; t.style.display="block";
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>t.style.display="none",2800);
}
function setUser(user){ currentUser=user||null; window.currentUser=currentUser; }

function updateAvatar(id,url,name){
  const x=el(id); if(!x)return;
  x.innerHTML="";
  if(url){
    const img=document.createElement("img"); img.src=url; img.alt=name||"Profile";
    img.onerror=()=>{x.textContent=initials(name)}; x.appendChild(img);
  }else x.textContent=initials(name);
}

/* ---------- auth modal ---------- */

function openAuth(mode="login"){
  const modal=el("authModal");
  if(!modal)return;
  modal.style.display="flex";
  mode==="signup" ? showSignup() : showLogin();
}
function closeAuth(){ const m=el("authModal"); if(m)m.style.display="none"; }

function showLogin(){
  text("authTitle","Welcome Back");
  text("authSubtitle","Login to your YouRemo account");
  const n=el("authName"),u=el("authUsername");
  if(n)n.style.display="none"; if(u)u.style.display="none";
  const b=document.querySelector(".auth-submit");
  if(b){b.textContent="Login";b.onclick=login;}
  const sw=el("authSwitch"); if(sw){sw.textContent="Create an account";sw.onclick=showSignup;}
}
function showSignup(){
  text("authTitle","Welcome to YouRemo");
  text("authSubtitle","Create your account");
  const n=el("authName"),u=el("authUsername");
  if(n)n.style.display="block"; if(u)u.style.display="block";
  const b=document.querySelector(".auth-submit");
  if(b){b.textContent="Create Account";b.onclick=signUp;}
  const sw=el("authSwitch"); if(sw){sw.textContent="Already have an account? Login";sw.onclick=showLogin;}
}
function clearAuthForm(){
  ["authName","authUsername","authEmail","authPassword"].forEach(id=>{if(el(id))el(id).value="";});
}

/* ---------- account ---------- */

async function refreshAccountUI(){
  const login=el("loginButton"), avatar=el("navAvatar"), menu=el("accountMenu");
  if(!login)return;
  if(!currentUser){
    login.textContent="Login";
    updateAvatar("navAvatar","", "User");
    if(menu)menu.style.display="none";
    return;
  }
  let p=null;
  const r=await supabaseClient.from("profiles").select("id,username,full_name,avatar_url").eq("id",currentUser.id).maybeSingle();
  if(!r.error)p=r.data;
  const name=p?.full_name||p?.username||currentUser.email?.split("@")[0]||"Account";
  login.textContent=name;
  updateAvatar("navAvatar",p?.avatar_url||"",name);
}
function handleAccountClick(){
  if(!currentUser){openAuth("login");return;}
  const m=el("accountMenu"); if(!m)return;
  m.style.display=getComputedStyle(m).display==="none"?"block":"none";
}
window.handleAccountClick=handleAccountClick;
window.openAuth=openAuth;window.closeAuth=closeAuth;window.showLogin=showLogin;window.showSignup=showSignup;

/* ---------- login/signup/logout ---------- */

async function login(){
  if(authBusy)return;
  if(!initSupabase())return;
  const email=el("authEmail")?.value.trim()||"";
  const password=el("authPassword")?.value||"";
  if(!email||!password){notify("Please enter your email and password.");return;}
  authBusy=true;
  const b=document.querySelector(".auth-submit"); if(b)b.disabled=true;
  try{
    const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
    if(error){notify(error.message);return;}
    setUser(data.user);
    closeAuth();clearAuthForm();
    await refreshAccountUI();
    await afterLogin();
    notify("Login successful!");
  }catch(e){console.error(e);notify("Login failed. Please try again.");}
  finally{authBusy=false;if(b)b.disabled=false;}
}
async function signUp(){
  if(authBusy)return;
  if(!initSupabase())return;
  const name=el("authName")?.value.trim()||"";
  const username=el("authUsername")?.value.trim()||"";
  const email=el("authEmail")?.value.trim()||"";
  const password=el("authPassword")?.value||"";
  if(!name||!username||!email||password.length<6){notify("Enter name, username, email and a password of at least 6 characters.");return;}
  authBusy=true;
  const b=document.querySelector(".auth-submit");if(b)b.disabled=true;
  try{
    const check=await supabaseClient.from("profiles").select("id").eq("username",username).maybeSingle();
    if(check.data){notify("That username is already taken.");return;}
    const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{full_name:name,username}}});
    if(error){notify(error.message);return;}
    if(data.user){
      const p=await supabaseClient.from("profiles").upsert({id:data.user.id,full_name:name,username});
      if(p.error)console.warn("Profile upsert:",p.error);
      setUser(data.user);
      closeAuth();clearAuthForm();await refreshAccountUI();
      if(data.session) await afterLogin();
      notify(data.session?"Account created successfully!":"Account created. Check your email if confirmation is enabled.");
    }
  }catch(e){console.error(e);notify("Could not create the account.");}
  finally{authBusy=false;if(b)b.disabled=false;}
}
async function logout(){
  if(!initSupabase())return;
  stopMessageRealtime();
  const {error}=await supabaseClient.auth.signOut();
  if(error){notify(error.message);return;}
  setUser(null);selectedMessageFriend=null;messageFriends=[];
  if(el("accountMenu"))el("accountMenu").style.display="none";
  await refreshAccountUI();
  notify("Logged out.");
  setTimeout(()=>location.href="index.html",250);
}
window.login=login;window.signUp=signUp;window.logout=logout;

/* ---------- navigation ---------- */

function goHome(){location.href="index.html"}
function goToFriends(){location.href="friends.html"}
function goToMessages(){if(!currentUser){openAuth();return}location.href="messages.html"}
function goToProfile(){if(!currentUser){openAuth();return}location.href="profile.html"}
function goToRequests(){if(!currentUser){openAuth();return}location.href="friends.html#requests"}
function goToMyProfile(){goToProfile()}
function learnMore(){const a=el("about");if(a)a.scrollIntoView({behavior:"smooth"});else location.href="index.html#about"}
window.goHome=goHome;window.goToFriends=goToFriends;window.goToMessages=goToMessages;window.goToProfile=goToProfile;window.goToRequests=goToRequests;window.goToMyProfile=goToMyProfile;window.learnMore=learnMore;

/* ---------- friends ---------- */

async function searchFriends(){
  const input=el("friendSearch"),results=el("friendResults");if(!results)return;
  const q=input?.value.trim()||"";
  if(!q){results.innerHTML=`<div class="empty-state"><div>🔎</div><h2>Discover People</h2><p>Enter a name or username above to find people.</p></div>`;return;}
  results.innerHTML=`<div class="empty-state"><div>⏳</div><p>Searching...</p></div>`;
  const pattern=`%${q}%`;
  try{
    const [a,b]=await Promise.all([
      supabaseClient.from("profiles").select("id,username,full_name,avatar_url").ilike("full_name",pattern).limit(30),
      supabaseClient.from("profiles").select("id,username,full_name,avatar_url").ilike("username",pattern).limit(30)
    ]);
    if(a.error&&b.error)throw a.error;
    const people=[...(a.data||[]),...(b.data||[])];
    const unique=[...new Map(people.map(x=>[x.id,x])).values()].filter(x=>x.id!==currentUser?.id);
    results.innerHTML=unique.length?unique.map(friendSearchCard).join(""):`<div class="empty-state"><div>😕</div><h2>No People Found</h2><p>Try another name or username.</p></div>`;
  }catch(e){console.error(e);results.innerHTML=`<div class="empty-state"><div>⚠️</div><h2>Search Error</h2><p>${esc(e.message||"Unable to search.")}</p></div>`;}
}
function friendSearchCard(p){
  const name=p.full_name||p.username||"YouRemo User";
  return `<div class="friend-result-card"><div class="friend-avatar">${p.avatar_url?`<img src="${escAttr(p.avatar_url)}" alt="${escAttr(name)}">`:esc(initials(name))}</div><div class="friend-result-info"><h3>${esc(name)}</h3><p>${p.username?"@"+esc(p.username):""}</p></div><button class="primary-btn" type="button" onclick="sendFriendRequest('${escAttr(p.id)}')">Add Friend</button></div>`;
}
async function sendFriendRequest(receiverId){
  if(!currentUser){openAuth();return}
  if(!receiverId||receiverId===currentUser.id)return;
  try{
    const r=await supabaseClient.from("friend_requests").select("id,status,sender_id,receiver_id").or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`);
    if(r.error)throw r.error;
    const row=(r.data||[])[0];
    if(row?.status==="accepted"){notify("You are already friends.");return}
    if(row?.status==="pending"){notify("A friend request already exists.");return}
    let result;
    if(row) result=await supabaseClient.from("friend_requests").update({sender_id:currentUser.id,receiver_id:receiverId,status:"pending"}).eq("id",row.id);
    else result=await supabaseClient.from("friend_requests").insert({sender_id:currentUser.id,receiver_id:receiverId,status:"pending"});
    if(result.error)throw result.error;
    notify("Friend request sent!");
    await loadFriendRequests();
  }catch(e){console.error(e);notify(e.message||"Could not send friend request.");}
}
window.searchFriends=searchFriends;window.sendFriendRequest=sendFriendRequest;

async function loadFriendRequests(){
  const badge=el("requestBadge"),container=el("friendRequests");
  if(!currentUser){if(badge){badge.style.display="none";badge.textContent="0"}return}
  try{
    const r=await supabaseClient.from("friend_requests").select("id,sender_id,receiver_id,status").eq("receiver_id",currentUser.id).eq("status","pending");
    if(r.error)throw r.error;
    const rows=r.data||[];
    if(badge){badge.textContent=rows.length;badge.style.display=rows.length?"inline-flex":"none"}
    if(container)await renderRequests(rows);
  }catch(e){console.error("requests",e)}
}
async function renderRequests(rows){
  const c=el("friendRequests");if(!c)return;
  if(!rows.length){c.innerHTML=`<div class="empty-state"><div>📭</div><h2>No Friend Requests</h2><p>You're all caught up.</p></div>`;return}
  const ids=rows.map(x=>x.sender_id);
  const r=await supabaseClient.from("profiles").select("id,username,full_name,avatar_url").in("id",ids);
  const profiles=r.data||[];
  c.innerHTML=rows.map(req=>{
    const p=profiles.find(x=>x.id===req.sender_id)||{};
    const name=p.full_name||p.username||"YouRemo User";
    return `<div class="friend-request-card"><div class="friend-avatar">${p.avatar_url?`<img src="${escAttr(p.avatar_url)}" alt="${escAttr(name)}">`:esc(initials(name))}</div><div class="friend-result-info"><h3>${esc(name)}</h3><p>${p.username?"@"+esc(p.username):""}</p></div><div class="request-actions"><button class="primary-btn" onclick="acceptFriendRequest('${escAttr(req.id)}')">Accept</button><button class="secondary-btn" onclick="declineFriendRequest('${escAttr(req.id)}')">Decline</button></div></div>`;
  }).join("");
}
async function acceptFriendRequest(id){
  if(!currentUser)return;
  try{
    const r=await supabaseClient.from("friend_requests").select("*").eq("id",id).maybeSingle();
    if(r.error)throw r.error;if(!r.data)throw new Error("Friend request not found.");
    const u=await supabaseClient.from("friend_requests").update({status:"accepted"}).eq("id",id).eq("receiver_id",currentUser.id);
    if(u.error)throw u.error;
    const f=await supabaseClient.from("friendships").insert({user_id:r.data.sender_id,friend_id:r.data.receiver_id});
    if(f.error&&!String(f.error.message).toLowerCase().includes("duplicate"))throw f.error;
    notify("Friend request accepted!");await loadFriendRequests();await loadMyFriends();await loadMessageFriends();
  }catch(e){console.error(e);notify(e.message||"Could not accept request.")}
}
async function declineFriendRequest(id){
  if(!currentUser)return;
  const r=await supabaseClient.from("friend_requests").update({status:"declined"}).eq("id",id).eq("receiver_id",currentUser.id);
  if(r.error){notify(r.error.message);return}await loadFriendRequests();notify("Request declined.");
}
window.loadFriendRequests=loadFriendRequests;window.acceptFriendRequest=acceptFriendRequest;window.declineFriendRequest=declineFriendRequest;

async function loadMyFriends(){
  const c=el("friendsList");if(!c)return;
  if(!currentUser){c.innerHTML=`<div class="empty-state"><div>🔐</div><h2>Login Required</h2><p>Please login to see your friends.</p></div>`;return}
  try{
    const r=await supabaseClient.from("friendships").select("id,user_id,friend_id").or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);
    if(r.error)throw r.error;
    const ids=[...new Set((r.data||[]).map(x=>x.user_id===currentUser.id?x.friend_id:x.user_id))];
    const count=el("friendsCount");if(count)count.textContent=`${ids.length} Friend${ids.length===1?"":"s"}`;
    if(!ids.length){c.innerHTML=`<div class="empty-state"><div>👥</div><h2>No Friends Yet</h2><p>Search for people and send friend requests.</p></div>`;return}
    const p=await supabaseClient.from("profiles").select("id,username,full_name,avatar_url").in("id",ids);
    if(p.error)throw p.error;
    c.innerHTML=(p.data||[]).map(friendCard).join("");
  }catch(e){console.error(e)}
}
function friendCard(p){
  const name=p.full_name||p.username||"YouRemo User";
  return `<div class="friend-card"><div class="friend-avatar">${p.avatar_url?`<img src="${escAttr(p.avatar_url)}" alt="${escAttr(name)}">`:esc(initials(name))}</div><div class="friend-info"><h3>${esc(name)}</h3><p>${p.username?"@"+esc(p.username):""}</p></div><button class="primary-btn" onclick="messageFriend('${escAttr(p.id)}')">Message</button></div>`;
}
function messageFriend(id){if(!currentUser){openAuth();return}location.href=`messages.html?friend=${encodeURIComponent(id)}`}
window.loadMyFriends=loadMyFriends;window.messageFriend=messageFriend;

/* ---------- messages ---------- */

async function loadMessageFriends(){
  const list=el("conversationList");if(!list)return;
  if(!currentUser){list.innerHTML=`<div class="empty-state"><div>🔐</div><h2>Login Required</h2><p>Please login to see your conversations.</p></div>`;return}
  try{
    const r=await supabaseClient.from("friendships").select("user_id,friend_id").or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);
    if(r.error)throw r.error;
    const ids=[...new Set((r.data||[]).map(x=>x.user_id===currentUser.id?x.friend_id:x.user_id))];
    if(!ids.length){messageFriends=[];renderMessageFriends();return}
    const p=await supabaseClient.from("profiles").select("id,username,full_name,avatar_url").in("id",ids);
    if(p.error)throw p.error;
    messageFriends=p.data||[];renderMessageFriends();selectFriendFromURL();
  }catch(e){console.error("loadMessageFriends",e)}
}
function renderMessageFriends(term=""){
  const list=el("conversationList");if(!list)return;
  const q=term.trim().toLowerCase();
  const friends=messageFriends.filter(p=>!q||(p.full_name||"").toLowerCase().includes(q)||(p.username||"").toLowerCase().includes(q));
  if(!friends.length){list.innerHTML=`<div class="empty-state"><div>👥</div><h2>No Friends</h2><p>Add friends first to start chatting.</p></div>`;return}
  list.innerHTML=friends.map(p=>`<button class="conversation-card ${selectedMessageFriend?.id===p.id?"selected":""}" onclick="selectMessageFriend('${escAttr(p.id)}')"><div class="conversation-avatar">${p.avatar_url?`<img src="${escAttr(p.avatar_url)}" alt="">`:esc(initials(p.full_name||p.username))}</div><div class="conversation-info"><h3>${esc(p.full_name||p.username||"User")}</h3><p>${p.username?"@"+esc(p.username):""}</p></div></button>`).join("");
}
async function selectMessageFriend(id){
  const p=messageFriends.find(x=>x.id===id);if(!p)return;
  selectedMessageFriend=p;window.selectedMessageFriend=p;
  const name=p.full_name||p.username||"YouRemo User";
  text("chatFriendName",name);text("chatFriendUsername",p.username?"@"+p.username:"");updateAvatar("chatFriendAvatar",p.avatar_url||"",name);
  renderMessageFriends(el("messageFriendSearch")?.value||"");
  await loadConversationMessages(id);
}
async function loadConversationMessages(friendId){
  const chat=el("chatMessages");if(!chat||!currentUser)return;
  chat.innerHTML=`<div class="empty-state"><div>⏳</div><p>Loading messages...</p></div>`;
  try{
    const r=await supabaseClient.from("messages").select("id,sender_id,receiver_id,message,created_at,seen").or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUser.id})`).order("created_at",{ascending:true});
    if(r.error)throw r.error;
    chat.innerHTML="";
    if(!r.data?.length){chat.innerHTML=`<div class="empty-state"><div>💬</div><h2>Start a Conversation</h2><p>Send your first message.</p></div>`}
    else r.data.forEach(appendMessage);
    chat.scrollTop=chat.scrollHeight;
    const ids=(r.data||[]).filter(m=>m.receiver_id===currentUser.id&&!m.seen).map(m=>m.id);
    if(ids.length)await supabaseClient.from("messages").update({seen:true}).in("id",ids).eq("receiver_id",currentUser.id);
  }catch(e){console.error(e);chat.innerHTML=`<div class="empty-state"><div>⚠️</div><h2>Unable to load messages</h2><p>${esc(e.message)}</p></div>`}
}
function appendMessage(m){
  const chat=el("chatMessages");if(!chat||!currentUser)return;
  const f=selectedMessageFriend;if(f&& !((m.sender_id===currentUser.id&&m.receiver_id===f.id)||(m.sender_id===f.id&&m.receiver_id===currentUser.id)))return;
  if(chat.querySelector(`[data-message-id="${CSS.escape(String(m.id))}"]`))return;
  const w=document.createElement("div");w.className=`message-bubble-wrapper ${m.sender_id===currentUser.id?"sent":"received"}`;w.dataset.messageId=String(m.id);
  const b=document.createElement("div");b.className="message-bubble";b.textContent=m.message||"";w.appendChild(b);
  if(m.sender_id===currentUser.id){const s=document.createElement("span");s.className="message-seen";s.textContent=m.seen?"Seen":"Sent";w.appendChild(s)}
  chat.appendChild(w);chat.scrollTop=chat.scrollHeight;
}
async function sendMessage(){
  if(!currentUser){openAuth();return}
  const f=selectedMessageFriend;if(!f){notify("Please select a friend first.");return}
  const input=el("messageInput");const msg=input?.value.trim()||"";if(!msg)return;
  const btn=el("sendMessageButton");if(btn)btn.disabled=true;
  try{
    const r=await supabaseClient.from("messages").insert({sender_id:currentUser.id,receiver_id:f.id,message:msg,seen:false}).select().single();
    if(r.error)throw r.error;input.value="";appendMessage(r.data);input.focus();
  }catch(e){console.error(e);notify(e.message||"Could not send message.")}
  finally{if(btn)btn.disabled=false}
}
function startMessageRealtime(){
  if(!currentUser||pageName()!=="messages.html")return;
  stopMessageRealtime();
  messageRealtimeChannel=supabaseClient.channel(`messages-${currentUser.id}`)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},payload=>{
      const m=payload.new;
      if(m&&(m.sender_id===currentUser.id||m.receiver_id===currentUser.id))appendMessage(m);
    })
    .on("postgres_changes",{event:"UPDATE",schema:"public",table:"messages"},payload=>{
      const x=el("chatMessages")?.querySelector(`[data-message-id="${CSS.escape(String(payload.new?.id||""))}"]`);
      if(x){const s=x.querySelector(".message-seen");if(s)s.textContent="Seen"}
    }).subscribe(s=>console.log("Message realtime:",s));
}
function stopMessageRealtime(){if(messageRealtimeChannel){supabaseClient.removeChannel(messageRealtimeChannel);messageRealtimeChannel=null}}
function selectFriendFromURL(){
  const id=new URLSearchParams(location.search).get("friend");if(id&&messageFriends.some(x=>x.id===id))selectMessageFriend(id);
}
window.loadMessageFriends=loadMessageFriends;window.renderMessageFriends=renderMessageFriends;window.selectMessageFriend=selectMessageFriend;window.sendMessage=sendMessage;window.startMessageRealtime=startMessageRealtime;window.stopMessageRealtime=stopMessageRealtime;

/* ---------- profile ---------- */

async function loadProfile(){
  if(!currentUser)return null;
  const r=await supabaseClient.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();
  if(r.error||!r.data)return null;
  const p=r.data,name=p.full_name||p.username||"YouRemo User";
  text("profileName",name);text("profileUsername",p.username?"@"+p.username:"");text("profileBio",p.bio||"");
  text("profileEmail",currentUser.email||"Not available");
  updateAvatar("profileAvatar",p.avatar_url||"",name);
  value("profileFullName",p.full_name||"");value("profileUsernameInput",p.username||"");value("profileBioInput",p.bio||"");
  return p;
}
async function saveProfile(){
  if(!currentUser){openAuth();return}
  const name=el("profileFullName")?.value.trim()||"",username=el("profileUsernameInput")?.value.trim()||"",bio=el("profileBioInput")?.value.trim()||"";
  if(!name||!username){notify("Name and username are required.");return}
  const check=await supabaseClient.from("profiles").select("id").eq("username",username).neq("id",currentUser.id).maybeSingle();
  if(check.data){notify("That username is already taken.");return}
  const r=await supabaseClient.from("profiles").update({full_name:name,username,bio}).eq("id",currentUser.id);
  if(r.error){notify(r.error.message);return}
  await loadProfile();await refreshAccountUI();notify("Profile updated successfully!");
}
async function uploadAvatar(file){
  if(!currentUser){openAuth();return}
  if(!file)return;
  try{
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
    const path=`${currentUser.id}/${Date.now()}.${ext}`;
    const u=await supabaseClient.storage.from("avatars").upload(path,file,{upsert:true});
    if(u.error)throw u.error;
    const publicUrl=supabaseClient.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const p=await supabaseClient.from("profiles").update({avatar_url:publicUrl}).eq("id",currentUser.id);
    if(p.error)throw p.error;
    await loadProfile();await refreshAccountUI();notify("Profile photo updated!");
  }catch(e){console.error(e);notify(e.message||"Could not upload photo.")}
}
window.loadProfile=loadProfile;window.saveProfile=saveProfile;window.uploadAvatar=uploadAvatar;

/* ---------- startup ---------- */

async function afterLogin(){
  await refreshAccountUI();
  await loadFriendRequests();
  await loadMyFriends();
  if(pageName()==="profile.html")await loadProfile();
  if(pageName()==="messages.html"){await loadMessageFriends();startMessageRealtime();}
}
function setupPage(){
  if(el("friendSearch"))el("friendSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchFriends()}});
  if(el("messageFriendSearch"))el("messageFriendSearch").addEventListener("input",e=>renderMessageFriends(e.target.value));
  if(el("messageInput"))el("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendMessage()}});
  if(el("profileForm"))el("profileForm").addEventListener("submit",e=>{e.preventDefault();saveProfile()});
  if(el("avatarInput"))el("avatarInput").addEventListener("change",e=>uploadAvatar(e.target.files?.[0]));
  const modal=el("authModal");if(modal)modal.addEventListener("click",e=>{if(e.target===modal)closeAuth()});
}
document.addEventListener("DOMContentLoaded",async()=>{
  console.log("YouRemo script.js loaded.");
  if(!initSupabase())return;
  setupPage();
  const {data}=await supabaseClient.auth.getSession();
  setUser(data.session?.user||null);
  await refreshAccountUI();
  if(currentUser)await afterLogin();
  else{
    if(pageName()==="friends.html"){await loadFriendRequests();await loadMyFriends()}
    if(pageName()==="messages.html")await loadMessageFriends();
    if(pageName()==="profile.html")await loadProfile();
  }
  supabaseClient.auth.onAuthStateChange((event,session)=>{
    console.log("Auth event:",event);
    setUser(session?.user||null);
    setTimeout(async()=>{await refreshAccountUI();if(currentUser)await afterLogin();else stopMessageRealtime()},0);
  });
});
console.log("YouRemo script.js ready.");
