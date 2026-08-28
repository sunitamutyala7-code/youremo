"use strict";

/* =========================================================
YouRemo - Complete Stable script.js
========================================================= */

const YOUREMO_SUPABASE_URL = "https://ykqnqdtekbxnevtjjkbd.supabase.co";
const YOUREMO_SUPABASE_KEY = "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

/* =========================================================
GLOBAL STATE
========================================================= */

let youremoSupabase = null;
let youremoCurrentUser = null;
let youremoMessageFriends = [];
let youremoSelectedFriend = null;
let youremoMessageChannel = null;
let youremoAuthBusy = false;

/* =========================================================
BASIC HELPERS
========================================================= */

function $(id) {
return document.getElementById(id);
}

function pageName() {
return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
}

function escapeHTML(value) {
return String(value ?? "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

function initials(name) {
const value = String(name || "?").trim();

if (!value) return "?";

const parts = value.split(/\s+/);

if (parts.length >= 2) {
return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

return value.substring(0, 2).toUpperCase();
}

function setText(id, value) {
const element = $(id);
if (element) element.textContent = value ?? "";
}

function setValue(id, value) {
const element = $(id);
if (element) element.value = value ?? "";
}

function showElement(id, display = "block") {
const element = $(id);
if (element) element.style.display = display;
}

function hideElement(id) {
const element = $(id);
if (element) element.style.display = "none";
}

/* =========================================================
TOAST
========================================================= */

function notify(message) {
let toast = $("toast");

if (!toast) {
toast = document.createElement("div");
toast.id = "toast";
toast.className = "toast";
document.body.appendChild(toast);
}

toast.textContent = message;
toast.style.display = "block";

clearTimeout(window.__youremoToastTimer);

window.__youremoToastTimer = setTimeout(() => {
toast.style.display = "none";
}, 3000);
}

/* =========================================================
SUPABASE
========================================================= */

function initSupabase() {
if (!window.supabase) {
console.error("Supabase library did not load.");
notify("Unable to connect to YouRemo.");
return false;
}

if (!youremoSupabase) {
youremoSupabase = window.supabase.createClient(
YOUREMO_SUPABASE_URL,
YOUREMO_SUPABASE_KEY
);

```
window.supabaseClient = youremoSupabase;
```

}

return true;
}

function setCurrentUser(user) {
youremoCurrentUser = user || null;
window.currentUser = youremoCurrentUser;
}

/* =========================================================
AVATARS
========================================================= */

function updateAvatar(id, imageURL, name) {
const element = $(id);

if (!element) return;

element.innerHTML = "";

if (imageURL) {
const image = document.createElement("img");

```
image.src = imageURL;
image.alt = name || "Profile";

image.onerror = function () {
  element.textContent = initials(name);
};

element.appendChild(image);
```

} else {
element.textContent = initials(name);
}
}

/* =========================================================
AUTH MODAL
========================================================= */

function openAuth(mode = "login") {
const modal = $("authModal");

if (!modal) {
console.error("authModal not found.");
return;
}

modal.style.display = "flex";

if (mode === "signup") {
showSignup();
} else {
showLogin();
}
}

function closeAuth() {
const modal = $("authModal");

if (modal) {
modal.style.display = "none";
}
}

function showLogin() {
setText("authTitle", "Welcome Back");
setText("authSubtitle", "Login to your YouRemo account");

const name = $("authName");
const username = $("authUsername");

if (name) name.style.display = "none";
if (username) username.style.display = "none";

const button = document.querySelector(".auth-submit");

if (button) {
button.textContent = "Login";
button.onclick = login;
}

const switchButton = $("authSwitch");

if (switchButton) {
switchButton.textContent = "Create an account";
switchButton.onclick = showSignup;
}
}

function showSignup() {
setText("authTitle", "Welcome to YouRemo");
setText("authSubtitle", "Create your account");

const name = $("authName");
const username = $("authUsername");

if (name) name.style.display = "block";
if (username) username.style.display = "block";

const button = document.querySelector(".auth-submit");

if (button) {
button.textContent = "Create Account";
button.onclick = signUp;
}

const switchButton = $("authSwitch");

if (switchButton) {
switchButton.textContent = "Already have an account? Login";
switchButton.onclick = showLogin;
}
}

function clearAuthForm() {
[
"authName",
"authUsername",
"authEmail",
"authPassword"
].forEach(function (id) {
const element = $(id);

```
if (element) {
  element.value = "";
}
```

});
}

/* =========================================================
ACCOUNT UI
========================================================= */

async function refreshAccountUI() {
const loginButton = $("loginButton");
const accountMenu = $("accountMenu");

if (!loginButton) return;

if (!youremoCurrentUser) {
loginButton.textContent = "Login";

```
updateAvatar("navAvatar", "", "User");

if (accountMenu) {
  accountMenu.style.display = "none";
}

return;
```

}

let profile = null;

try {
const result = await youremoSupabase
.from("profiles")
.select("id,username,full_name,avatar_url")
.eq("id", youremoCurrentUser.id)
.maybeSingle();

```
if (!result.error) {
  profile = result.data;
}
```

} catch (error) {
console.error("Profile lookup error:", error);
}

const name =
profile?.full_name ||
profile?.username ||
youremoCurrentUser.email?.split("@")[0] ||
"Account";

loginButton.textContent = name;

updateAvatar(
"navAvatar",
profile?.avatar_url || "",
name
);
}

function handleAccountClick() {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

const menu = $("accountMenu");

if (!menu) return;

if (getComputedStyle(menu).display === "none") {
menu.style.display = "block";
} else {
menu.style.display = "none";
}
}

/* =========================================================
LOGIN
========================================================= */

async function login() {
if (youremoAuthBusy) return;

if (!initSupabase()) return;

const email = $("authEmail")?.value.trim() || "";
const password = $("authPassword")?.value || "";

if (!email || !password) {
notify("Please enter your email and password.");
return;
}

youremoAuthBusy = true;

const button = document.querySelector(".auth-submit");

if (button) {
button.disabled = true;
button.textContent = "Logging in...";
}

try {
const result = await youremoSupabase.auth.signInWithPassword({
email: email,
password: password
});

```
if (result.error) {
  notify(result.error.message);
  return;
}

setCurrentUser(result.data.user);

closeAuth();
clearAuthForm();

await refreshAccountUI();
await afterLogin();

notify("Login successful!");
```

} catch (error) {
console.error("Login error:", error);
notify("Login failed. Please try again.");
} finally {
youremoAuthBusy = false;

```
if (button) {
  button.disabled = false;
  button.textContent = "Login";
}
```

}
}

/* =========================================================
SIGN UP
========================================================= */

async function signUp() {
if (youremoAuthBusy) return;

if (!initSupabase()) return;

const name = $("authName")?.value.trim() || "";
const username = $("authUsername")?.value.trim() || "";
const email = $("authEmail")?.value.trim() || "";
const password = $("authPassword")?.value || "";

if (!name || !username || !email) {
notify("Please fill in all required fields.");
return;
}

if (password.length < 6) {
notify("Password must contain at least 6 characters.");
return;
}

youremoAuthBusy = true;

const button = document.querySelector(".auth-submit");

if (button) {
button.disabled = true;
button.textContent = "Creating...";
}

try {
const existing = await youremoSupabase
.from("profiles")
.select("id")
.eq("username", username)
.maybeSingle();

```
if (existing.error) {
  console.warn("Username check:", existing.error);
}

if (existing.data) {
  notify("That username is already taken.");
  return;
}

const result = await youremoSupabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: name,
      username: username
    }
  }
});

if (result.error) {
  notify(result.error.message);
  return;
}

if (result.data.user) {
  const profileResult = await youremoSupabase
    .from("profiles")
    .upsert({
      id: result.data.user.id,
      full_name: name,
      username: username
    });

  if (profileResult.error) {
    console.warn(
      "Profile creation:",
      profileResult.error
    );
  }

  setCurrentUser(result.data.user);

  closeAuth();
  clearAuthForm();

  await refreshAccountUI();

  if (result.data.session) {
    await afterLogin();
    notify("Account created successfully!");
  } else {
    notify(
      "Account created. Check your email to confirm your account."
    );
  }
}
```

} catch (error) {
console.error("Signup error:", error);
notify("Could not create the account.");
} finally {
youremoAuthBusy = false;

```
if (button) {
  button.disabled = false;
  button.textContent = "Create Account";
}
```

}
}

/* =========================================================
LOGOUT
========================================================= */

async function logout() {
if (!initSupabase()) return;

try {
stopMessageRealtime();

```
const result =
  await youremoSupabase.auth.signOut();

if (result.error) {
  notify(result.error.message);
  return;
}

setCurrentUser(null);

youremoSelectedFriend = null;
youremoMessageFriends = [];

const menu = $("accountMenu");

if (menu) {
  menu.style.display = "none";
}

await refreshAccountUI();

notify("Logged out.");

setTimeout(function () {
  window.location.href = "index.html";
}, 300);
```

} catch (error) {
console.error("Logout error:", error);
notify("Logout failed.");
}
}

/* =========================================================
NAVIGATION
========================================================= */

function goHome() {
window.location.href = "index.html";
}

function goToFriends() {
window.location.href = "friends.html";
}

function goToMessages() {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

window.location.href = "messages.html";
}

function goToProfile() {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

window.location.href = "profile.html";
}

function goToRequests() {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

window.location.href = "friends.html#requests";
}

function goToMyProfile() {
goToProfile();
}

function learnMore() {
const about = $("about");

if (about) {
about.scrollIntoView({
behavior: "smooth"
});
} else {
window.location.href = "index.html#about";
}
}

/* =========================================================
FRIEND SEARCH
========================================================= */

async function searchFriends() {
const results = $("friendResults");

if (!results) return;

if (!initSupabase()) return;

const input = $("friendSearch");
const query = input?.value.trim() || "";

if (!query) {
results.innerHTML = `       <div class="empty-state">         <div>🔎</div>         <h2>Discover People</h2>         <p>Enter a name or username above to find people.</p>       </div>
    `;
return;
}

results.innerHTML = `     <div class="empty-state">       <div>⏳</div>       <p>Searching...</p>     </div>
  `;

try {
const pattern = `%${query}%`;

```
const nameSearch = youremoSupabase
  .from("profiles")
  .select("id,username,full_name,avatar_url")
  .ilike("full_name", pattern)
  .limit(30);

const usernameSearch = youremoSupabase
  .from("profiles")
  .select("id,username,full_name,avatar_url")
  .ilike("username", pattern)
  .limit(30);

const [nameResult, usernameResult] =
  await Promise.all([
    nameSearch,
    usernameSearch
  ]);

if (nameResult.error && usernameResult.error) {
  throw nameResult.error;
}

const people = [
  ...(nameResult.data || []),
  ...(usernameResult.data || [])
];

const uniquePeople = [
  ...new Map(
    people.map(function (person) {
      return [person.id, person];
    })
  ).values()
].filter(function (person) {
  return person.id !== youremoCurrentUser?.id;
});

if (!uniquePeople.length) {
  results.innerHTML = `
    <div class="empty-state">
      <div>😕</div>
      <h2>No People Found</h2>
      <p>Try another name or username.</p>
    </div>
  `;
  return;
}

results.innerHTML = uniquePeople
  .map(createFriendSearchCard)
  .join("");
```

} catch (error) {
console.error("Friend search:", error);

```
results.innerHTML = `
  <div class="empty-state">
    <div>⚠️</div>
    <h2>Search Error</h2>
    <p>${escapeHTML(error.message || "Unable to search.")}</p>
  </div>
`;
```

}
}

function createFriendSearchCard(profile) {
const name =
profile.full_name ||
profile.username ||
"YouRemo User";

const avatar = profile.avatar_url
? `<img src="${escapeHTML(profile.avatar_url)}" alt="${escapeHTML(name)}">`
: escapeHTML(initials(name));

return ` <div class="friend-result-card">

```
  <div class="friend-avatar">
    ${avatar}
  </div>

  <div class="friend-result-info">
    <h3>${escapeHTML(name)}</h3>
    <p>
      ${
        profile.username
          ? "@" + escapeHTML(profile.username)
          : ""
      }
    </p>
  </div>

  <button
    class="primary-btn"
    type="button"
    onclick="sendFriendRequest('${escapeHTML(profile.id)}')"
  >
    Add Friend
  </button>

</div>
```

`;
}

/* =========================================================
FRIEND REQUESTS
========================================================= */

async function sendFriendRequest(receiverId) {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

if (!receiverId || receiverId === youremoCurrentUser.id) {
return;
}

try {
const result = await youremoSupabase
.from("friend_requests")
.select(
"id,status,sender_id,receiver_id"
)
.or(
`and(sender_id.eq.${youremoCurrentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${youremoCurrentUser.id})`
);

```
if (result.error) {
  throw result.error;
}

const existing = (result.data || [])[0];

if (existing?.status === "accepted") {
  notify("You are already friends.");
  return;
}

if (existing?.status === "pending") {
  notify("A friend request already exists.");
  return;
}

let requestResult;

if (existing) {
  requestResult = await youremoSupabase
    .from("friend_requests")
    .update({
      sender_id: youremoCurrentUser.id,
      receiver_id: receiverId,
      status: "pending"
    })
    .eq("id", existing.id);
} else {
  requestResult = await youremoSupabase
    .from("friend_requests")
    .insert({
      sender_id: youremoCurrentUser.id,
      receiver_id: receiverId,
      status: "pending"
    });
}

if (requestResult.error) {
  throw requestResult.error;
}

notify("Friend request sent!");

await loadFriendRequests();
```

} catch (error) {
console.error("Send friend request:", error);
notify(
error.message ||
"Could not send friend request."
);
}
}

async function loadFriendRequests() {
if (!youremoCurrentUser) {
const badge = $("requestBadge");

```
if (badge) {
  badge.textContent = "0";
  badge.style.display = "none";
}

return;
```

}

try {
const result = await youremoSupabase
.from("friend_requests")
.select(
"id,sender_id,receiver_id,status"
)
.eq(
"receiver_id",
youremoCurrentUser.id
)
.eq("status", "pending");

```
if (result.error) {
  throw result.error;
}

const requests = result.data || [];

const badge = $("requestBadge");

if (badge) {
  badge.textContent = requests.length;
  badge.style.display =
    requests.length > 0
      ? "inline-flex"
      : "none";
}

if ($("friendRequests")) {
  await renderRequests(requests);
}
```

} catch (error) {
console.error(
"Load friend requests:",
error
);
}
}

async function renderRequests(requests) {
const container = $("friendRequests");

if (!container) return;

if (!requests.length) {
container.innerHTML = `       <div class="empty-state">         <div>📭</div>         <h2>No Friend Requests</h2>         <p>You're all caught up.</p>       </div>
    `;
return;
}

const ids = requests.map(function (request) {
return request.sender_id;
});

const result = await youremoSupabase
.from("profiles")
.select(
"id,username,full_name,avatar_url"
)
.in("id", ids);

const profiles = result.data || [];

container.innerHTML = requests
.map(function (request) {
const profile =
profiles.find(function (person) {
return person.id === request.sender_id;
}) || {};

```
  const name =
    profile.full_name ||
    profile.username ||
    "YouRemo User";

  const avatar = profile.avatar_url
    ? `<img src="${escapeHTML(profile.avatar_url)}" alt="${escapeHTML(name)}">`
    : escapeHTML(initials(name));

  return `
    <div class="friend-request-card">

      <div class="friend-avatar">
        ${avatar}
      </div>

      <div class="friend-result-info">
        <h3>${escapeHTML(name)}</h3>
        <p>
          ${
            profile.username
              ? "@" + escapeHTML(profile.username)
              : ""
          }
        </p>
      </div>

      <div class="request-actions">

        <button
          class="primary-btn"
          type="button"
          onclick="acceptFriendRequest('${escapeHTML(request.id)}')"
        >
          Accept
        </button>

        <button
          class="secondary-btn"
          type="button"
          onclick="declineFriendRequest('${escapeHTML(request.id)}')"
        >
          Decline
        </button>

      </div>

    </div>
  `;
})
.join("");
```

}

async function acceptFriendRequest(requestId) {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

try {
const requestResult =
await youremoSupabase
.from("friend_requests")
.select("*")
.eq("id", requestId)
.maybeSingle();

```
if (requestResult.error) {
  throw requestResult.error;
}

if (!requestResult.data) {
  throw new Error(
    "Friend request not found."
  );
}

const request =
  requestResult.data;

const updateResult =
  await youremoSupabase
    .from("friend_requests")
    .update({
      status: "accepted"
    })
    .eq("id", requestId)
    .eq(
      "receiver_id",
      youremoCurrentUser.id
    );

if (updateResult.error) {
  throw updateResult.error;
}

const friendshipResult =
  await youremoSupabase
    .from("friendships")
    .insert({
      user_id: request.sender_id,
      friend_id: request.receiver_id
    });

if (
  friendshipResult.error &&
  !String(
    friendshipResult.error.message
  )
    .toLowerCase()
    .includes("duplicate")
) {
  throw friendshipResult.error;
}

notify("Friend request accepted!");

await loadFriendRequests();
await loadMyFriends();
await loadMessageFriends();
```

} catch (error) {
console.error(
"Accept request:",
error
);

```
notify(
  error.message ||
  "Could not accept request."
);
```

}
}

async function declineFriendRequest(requestId) {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

try {
const result =
await youremoSupabase
.from("friend_requests")
.update({
status: "declined"
})
.eq("id", requestId)
.eq(
"receiver_id",
youremoCurrentUser.id
);

```
if (result.error) {
  throw result.error;
}

notify("Request declined.");

await loadFriendRequests();
```

} catch (error) {
notify(
error.message ||
"Could not decline request."
);
}
}

/* =========================================================
MY FRIENDS
========================================================= */

async function loadMyFriends() {
const container = $("friendsList");

if (!container) return;

if (!youremoCurrentUser) {
container.innerHTML = `       <div class="empty-state">         <div>🔐</div>         <h2>Login Required</h2>         <p>Please login to see your friends.</p>       </div>
    `;
return;
}

try {
const result =
await youremoSupabase
.from("friendships")
.select(
"id,user_id,friend_id"
)
.or(
`user_id.eq.${youremoCurrentUser.id},friend_id.eq.${youremoCurrentUser.id}`
);

```
if (result.error) {
  throw result.error;
}

const ids = [
  ...new Set(
    (result.data || []).map(
      function (friendship) {
        return friendship.user_id ===
          youremoCurrentUser.id
          ? friendship.friend_id
          : friendship.user_id;
      }
    )
  )
];

const count = $("friendsCount");

if (count) {
  count.textContent =
    `${ids.length} Friend${ids.length === 1 ? "" : "s"}`;
}

if (!ids.length) {
  container.innerHTML = `
    <div class="empty-state">
      <div>👥</div>
      <h2>No Friends Yet</h2>
      <p>Search for people and send friend requests.</p>
    </div>
  `;
  return;
}

const profiles =
  await youremoSupabase
    .from("profiles")
    .select(
      "id,username,full_name,avatar_url"
    )
    .in("id", ids);

if (profiles.error) {
  throw profiles.error;
}

container.innerHTML =
  (profiles.data || [])
    .map(createFriendCard)
    .join("");
```

} catch (error) {
console.error(
"Load friends:",
error
);

```
container.innerHTML = `
  <div class="empty-state">
    <div>⚠️</div>
    <h2>Unable to load friends</h2>
    <p>${escapeHTML(error.message || "")}</p>
  </div>
`;
```

}
}

function createFriendCard(profile) {
const name =
profile.full_name ||
profile.username ||
"YouRemo User";

const avatar = profile.avatar_url
? `<img src="${escapeHTML(profile.avatar_url)}" alt="${escapeHTML(name)}">`
: escapeHTML(initials(name));

return ` <div class="friend-card">

```
  <div class="friend-avatar">
    ${avatar}
  </div>

  <div class="friend-info">
    <h3>${escapeHTML(name)}</h3>
    <p>
      ${
        profile.username
          ? "@" + escapeHTML(profile.username)
          : ""
      }
    </p>
  </div>

  <button
    class="primary-btn"
    type="button"
    onclick="messageFriend('${escapeHTML(profile.id)}')"
  >
    Message
  </button>

</div>
```

`;
}

function messageFriend(friendId) {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

window.location.href =
`messages.html?friend=${encodeURIComponent(friendId)}`;
}

/* =========================================================
MESSAGES
========================================================= */

async function loadMessageFriends() {
const list = $("conversationList");

if (!list) return;

if (!youremoCurrentUser) {
list.innerHTML = `       <div class="empty-state">         <div>🔐</div>         <h2>Login Required</h2>         <p>Please login to see your conversations.</p>       </div>
    `;
return;
}

try {
const result =
await youremoSupabase
.from("friendships")
.select(
"user_id,friend_id"
)
.or(
`user_id.eq.${youremoCurrentUser.id},friend_id.eq.${youremoCurrentUser.id}`
);

```
if (result.error) {
  throw result.error;
}

const ids = [
  ...new Set(
    (result.data || []).map(
      function (friendship) {
        return friendship.user_id ===
          youremoCurrentUser.id
          ? friendship.friend_id
          : friendship.user_id;
      }
    )
  )
];

if (!ids.length) {
  youremoMessageFriends = [];
  renderMessageFriends();
  return;
}

const profiles =
  await youremoSupabase
    .from("profiles")
    .select(
      "id,username,full_name,avatar_url"
    )
    .in("id", ids);

if (profiles.error) {
  throw profiles.error;
}

youremoMessageFriends =
  profiles.data || [];

window.messageFriends =
  youremoMessageFriends;

renderMessageFriends();

selectFriendFromURL();
```

} catch (error) {
console.error(
"Load message friends:",
error
);
}
}

function renderMessageFriends(searchTerm = "") {
const list = $("conversationList");

if (!list) return;

const query =
String(searchTerm)
.trim()
.toLowerCase();

const friends =
youremoMessageFriends.filter(
function (profile) {
return (
!query ||
(profile.full_name || "")
.toLowerCase()
.includes(query) ||
(profile.username || "")
.toLowerCase()
.includes(query)
);
}
);

if (!friends.length) {
list.innerHTML = `       <div class="empty-state">         <div>👥</div>         <h2>No Friends</h2>         <p>Add friends first to start chatting.</p>       </div>
    `;
return;
}

list.innerHTML =
friends
.map(function (profile) {
const name =
profile.full_name ||
profile.username ||
"User";

```
    const avatar =
      profile.avatar_url
        ? `<img src="${escapeHTML(profile.avatar_url)}" alt="${escapeHTML(name)}">`
        : escapeHTML(initials(name));

    const selected =
      youremoSelectedFriend &&
      youremoSelectedFriend.id ===
        profile.id
        ? "selected"
        : "";

    return `
      <button
        class="conversation-card ${selected}"
        type="button"
        onclick="selectMessageFriend('${escapeHTML(profile.id)}')"
      >

        <div class="conversation-avatar">
          ${avatar}
        </div>

        <div class="conversation-info">
          <h3>${escapeHTML(name)}</h3>
          <p>
            ${
              profile.username
                ? "@" + escapeHTML(profile.username)
                : ""
            }
          </p>
        </div>

      </button>
    `;
  })
  .join("");
```

}

async function selectMessageFriend(friendId) {
const friend =
youremoMessageFriends.find(
function (profile) {
return profile.id === friendId;
}
);

if (!friend) return;

youremoSelectedFriend = friend;

window.selectedMessageFriend = friend;

const name =
friend.full_name ||
friend.username ||
"YouRemo User";

setText(
"chatFriendName",
name
);

setText(
"chatFriendUsername",
friend.username
? "@" + friend.username
: ""
);

updateAvatar(
"chatFriendAvatar",
friend.avatar_url || "",
name
);

renderMessageFriends(
$("messageFriendSearch")?.value || ""
);

await loadConversationMessages(
friendId
);
}

async function loadConversationMessages(friendId) {
const chat = $("chatMessages");

if (!chat || !youremoCurrentUser) {
return;
}

chat.innerHTML = `     <div class="empty-state">       <div>⏳</div>       <p>Loading messages...</p>     </div>
  `;

try {
const result =
await youremoSupabase
.from("messages")
.select(
"id,sender_id,receiver_id,message,created_at,seen"
)
.or(
`and(sender_id.eq.${youremoCurrentUser.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${youremoCurrentUser.id})`
)
.order(
"created_at",
{
ascending: true
}
);

```
if (result.error) {
  throw result.error;
}

chat.innerHTML = "";

const messages =
  result.data || [];

if (!messages.length) {
  chat.innerHTML = `
    <div class="empty-state">
      <div>💬</div>
      <h2>Start a Conversation</h2>
      <p>Send your first message.</p>
    </div>
  `;
} else {
  messages.forEach(
    appendMessage
  );
}

chat.scrollTop =
  chat.scrollHeight;

const unreadIds =
  messages
    .filter(function (message) {
      return (
        message.receiver_id ===
          youremoCurrentUser.id &&
        !message.seen
      );
    })
    .map(function (message) {
      return message.id;
    });

if (unreadIds.length) {
  await youremoSupabase
    .from("messages")
    .update({
      seen: true
    })
    .in("id", unreadIds)
    .eq(
      "receiver_id",
      youremoCurrentUser.id
    );
}
```

} catch (error) {
console.error(
"Load messages:",
error
);

```
chat.innerHTML = `
  <div class="empty-state">
    <div>⚠️</div>
    <h2>Unable to load messages</h2>
    <p>${escapeHTML(error.message || "")}</p>
  </div>
`;
```

}
}

function appendMessage(message) {
const chat = $("chatMessages");

if (!chat || !youremoCurrentUser) {
return;
}

const friend =
youremoSelectedFriend;

if (friend) {
const belongs =
(
message.sender_id ===
youremoCurrentUser.id &&
message.receiver_id ===
friend.id
) ||
(
message.sender_id ===
friend.id &&
message.receiver_id ===
youremoCurrentUser.id
);

```
if (!belongs) return;
```

}

const existing =
chat.querySelector(
`[data-message-id="${CSS.escape(String(message.id))}"]`
);

if (existing) return;

const wrapper =
document.createElement("div");

wrapper.className =
`message-bubble-wrapper ${
      message.sender_id ===
      youremoCurrentUser.id
        ? "sent"
        : "received"
    }`;

wrapper.dataset.messageId =
String(message.id);

const bubble =
document.createElement("div");

bubble.className =
"message-bubble";

bubble.textContent =
message.message || "";

wrapper.appendChild(
bubble
);

if (
message.sender_id ===
youremoCurrentUser.id
) {
const status =
document.createElement("span");

```
status.className =
  "message-seen";

status.textContent =
  message.seen
    ? "Seen"
    : "Sent";

wrapper.appendChild(
  status
);
```

}

chat.appendChild(
wrapper
);

chat.scrollTop =
chat.scrollHeight;
}

async function sendMessage() {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

const friend =
youremoSelectedFriend;

if (!friend) {
notify(
"Please select a friend first."
);
return;
}

const input =
$("messageInput");

const message =
input?.value.trim() || "";

if (!message) return;

const button =
$("sendMessageButton");

if (button) {
button.disabled = true;
}

try {
const result =
await youremoSupabase
.from("messages")
.insert({
sender_id:
youremoCurrentUser.id,
receiver_id:
friend.id,
message: message,
seen: false
})
.select()
.single();

```
if (result.error) {
  throw result.error;
}

if (input) {
  input.value = "";
  input.focus();
}

appendMessage(
  result.data
);
```

} catch (error) {
console.error(
"Send message:",
error
);

```
notify(
  error.message ||
  "Could not send message."
);
```

} finally {
if (button) {
button.disabled = false;
}
}
}

/* =========================================================
MESSAGE REALTIME
========================================================= */

function startMessageRealtime() {
if (
!youremoCurrentUser ||
pageName() !== "messages.html"
) {
return;
}

if (!youremoSupabase) {
return;
}

stopMessageRealtime();

youremoMessageChannel =
youremoSupabase
.channel(
`youremo-messages-${youremoCurrentUser.id}`
)
.on(
"postgres_changes",
{
event: "INSERT",
schema: "public",
table: "messages"
},
function (payload) {
const message =
payload.new;

```
      if (
        message &&
        (
          message.sender_id ===
            youremoCurrentUser.id ||
          message.receiver_id ===
            youremoCurrentUser.id
        )
      ) {
        appendMessage(
          message
        );
      }
    }
  )
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "messages"
    },
    function (payload) {
      const id =
        payload.new?.id;

      if (!id) return;

      const element =
        document.querySelector(
          `[data-message-id="${CSS.escape(String(id))}"]`
        );

      if (element) {
        const status =
          element.querySelector(
            ".message-seen"
          );

        if (status) {
          status.textContent =
            "Seen";
        }
      }
    }
  )
  .subscribe(
    function (status) {
      console.log(
        "Message realtime:",
        status
      );
    }
  );
```

}

function stopMessageRealtime() {
if (
youremoMessageChannel &&
youremoSupabase
) {
youremoSupabase.removeChannel(
youremoMessageChannel
);

```
youremoMessageChannel =
  null;
```

}
}

function selectFriendFromURL() {
const params =
new URLSearchParams(
window.location.search
);

const friendId =
params.get("friend");

if (
friendId &&
youremoMessageFriends.some(
function (friend) {
return friend.id === friendId;
}
)
) {
selectMessageFriend(
friendId
);
}
}

/* =========================================================
PROFILE
========================================================= */

async function loadProfile() {
if (!youremoCurrentUser) {
return null;
}

try {
const result =
await youremoSupabase
.from("profiles")
.select("*")
.eq(
"id",
youremoCurrentUser.id
)
.maybeSingle();

```
if (
  result.error ||
  !result.data
) {
  return null;
}

const profile =
  result.data;

const name =
  profile.full_name ||
  profile.username ||
  "YouRemo User";

setText(
  "profileName",
  name
);

setText(
  "profileUsername",
  profile.username
    ? "@" + profile.username
    : ""
);

setText(
  "profileBio",
  profile.bio || ""
);

setText(
  "profileEmail",
  youremoCurrentUser.email ||
    "Not available"
);

updateAvatar(
  "profileAvatar",
  profile.avatar_url || "",
  name
);

setValue(
  "profileFullName",
  profile.full_name || ""
);

setValue(
  "profileUsernameInput",
  profile.username || ""
);

setValue(
  "profileBioInput",
  profile.bio || ""
);

return profile;
```

} catch (error) {
console.error(
"Load profile:",
error
);

```
return null;
```

}
}

async function saveProfile() {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

const name =
$("profileFullName")
?.value.trim() || "";

const username =
$("profileUsernameInput")
?.value.trim() || "";

const bio =
$("profileBioInput")
?.value.trim() || "";

if (!name || !username) {
notify(
"Name and username are required."
);
return;
}

try {
const usernameCheck =
await youremoSupabase
.from("profiles")
.select("id")
.eq(
"username",
username
)
.neq(
"id",
youremoCurrentUser.id
)
.maybeSingle();

```
if (usernameCheck.error) {
  throw usernameCheck.error;
}

if (usernameCheck.data) {
  notify(
    "That username is already taken."
  );
  return;
}

const result =
  await youremoSupabase
    .from("profiles")
    .update({
      full_name: name,
      username: username,
      bio: bio
    })
    .eq(
      "id",
      youremoCurrentUser.id
    );

if (result.error) {
  throw result.error;
}

await loadProfile();
await refreshAccountUI();

notify(
  "Profile updated successfully!"
);
```

} catch (error) {
console.error(
"Save profile:",
error
);

```
notify(
  error.message ||
  "Could not update profile."
);
```

}
}

async function uploadAvatar(file) {
if (!youremoCurrentUser) {
openAuth("login");
return;
}

if (!file) return;

try {
const extension =
(
file.name
.split(".")
.pop() ||
"jpg"
).toLowerCase();

```
const path =
  `${youremoCurrentUser.id}/${Date.now()}.${extension}`;

const upload =
  await youremoSupabase
    .storage
    .from("avatars")
    .upload(
      path,
      file,
      {
        upsert: true
      }
    );

if (upload.error) {
  throw upload.error;
}

const publicURL =
  youremoSupabase
    .storage
    .from("avatars")
    .getPublicUrl(path)
    .data
    .publicUrl;

const profile =
  await youremoSupabase
    .from("profiles")
    .update({
      avatar_url: publicURL
    })
    .eq(
      "id",
      youremoCurrentUser.id
    );

if (profile.error) {
  throw profile.error;
}

await loadProfile();
await refreshAccountUI();

notify(
  "Profile photo updated!"
);
```

} catch (error) {
console.error(
"Upload avatar:",
error
);

```
notify(
  error.message ||
  "Could not upload photo."
);
```

}
}

/* =========================================================
AFTER LOGIN
========================================================= */

async function afterLogin() {
await refreshAccountUI();

await loadFriendRequests();

if (pageName() === "friends.html") {
await loadMyFriends();
}

if (pageName() === "profile.html") {
await loadProfile();
}

if (pageName() === "messages.html") {
await loadMessageFriends();
startMessageRealtime();
}
}

/* =========================================================
PAGE SETUP
========================================================= */

function setupPage() {

const friendSearch =
$("friendSearch");

if (friendSearch) {
friendSearch.addEventListener(
"keydown",
function (event) {
if (event.key === "Enter") {
event.preventDefault();
searchFriends();
}
}
);
}

const messageSearch =
$("messageFriendSearch");

if (messageSearch) {
messageSearch.addEventListener(
"input",
function (event) {
renderMessageFriends(
event.target.value
);
}
);
}

const messageInput =
$("messageInput");

if (messageInput) {
messageInput.addEventListener(
"keydown",
function (event) {
if (
event.key === "Enter" &&
!event.shiftKey
) {
event.preventDefault();
sendMessage();
}
}
);
}

const profileForm =
$("profileForm");

if (profileForm) {
profileForm.addEventListener(
"submit",
function (event) {
event.preventDefault();
saveProfile();
}
);
}

const avatarInput =
$("avatarInput");

if (avatarInput) {
avatarInput.addEventListener(
"change",
function (event) {
uploadAvatar(
event.target.files?.[0]
);
}
);
}

const modal =
$("authModal");

if (modal) {
modal.addEventListener(
"click",
function (event) {
if (
event.target === modal
) {
closeAuth();
}
}
);
}
}

/* =========================================================
GLOBAL FUNCTIONS
================

These make inline onclick="..." handlers
in your HTML work correctly.
========================================================= */

window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.showLogin = showLogin;
window.showSignup = showSignup;

window.login = login;
window.signUp = signUp;
window.logout = logout;

window.handleAccountClick =
handleAccountClick;

window.goHome = goHome;
window.goToFriends = goToFriends;
window.goToMessages = goToMessages;
window.goToProfile = goToProfile;
window.goToRequests = goToRequests;
window.goToMyProfile = goToMyProfile;
window.learnMore = learnMore;

window.searchFriends =
searchFriends;

window.sendFriendRequest =
sendFriendRequest;

window.loadFriendRequests =
loadFriendRequests;

window.acceptFriendRequest =
acceptFriendRequest;

window.declineFriendRequest =
declineFriendRequest;

window.loadMyFriends =
loadMyFriends;

window.messageFriend =
messageFriend;

window.loadMessageFriends =
loadMessageFriends;

window.renderMessageFriends =
renderMessageFriends;

window.selectMessageFriend =
selectMessageFriend;

window.sendMessage =
sendMessage;

window.startMessageRealtime =
startMessageRealtime;

window.stopMessageRealtime =
stopMessageRealtime;

window.loadProfile =
loadProfile;

window.saveProfile =
saveProfile;

window.uploadAvatar =
uploadAvatar;

/* =========================================================
STARTUP
========================================================= */

document.addEventListener(
"DOMContentLoaded",
async function () {

```
console.log(
  "================================="
);

console.log(
  "YouRemo script.js loaded."
);

console.log(
  "Current page:",
  pageName()
);

console.log(
  "================================="
);

if (!initSupabase()) {
  return;
}

setupPage();

try {

  const sessionResult =
    await youremoSupabase.auth.getSession();

  setCurrentUser(
    sessionResult.data
      ?.session
      ?.user || null
  );

  await refreshAccountUI();

  if (youremoCurrentUser) {
    await afterLogin();
  } else {

    if (
      pageName() ===
      "friends.html"
    ) {
      await loadMyFriends();
    }

    if (
      pageName() ===
      "messages.html"
    ) {
      await loadMessageFriends();
    }

    if (
      pageName() ===
      "profile.html"
    ) {
      await loadProfile();
    }
  }

} catch (error) {
  console.error(
    "Startup error:",
    error
  );
}

youremoSupabase.auth.onAuthStateChange(
  function (event, session) {

    console.log(
      "Auth event:",
      event
    );

    setCurrentUser(
      session?.user || null
    );

    setTimeout(
      async function () {

        await refreshAccountUI();

        if (youremoCurrentUser) {
          await afterLogin();
        } else {
          stopMessageRealtime();
        }

      },
      100
    );
  }
);
```

}
);

console.log(
"YouRemo script.js ready."
);
