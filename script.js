"use strict";

/* =========================================================
YouRemo - Complete Stable script.js
========================================================= */

const SUPABASE_URL = "https://ykqnqdtekbxnevtjjkbd.supabase.co";
const SUPABASE_KEY = "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

let supabaseClient = null;
let currentUser = null;

let messageFriends = [];
let selectedMessageFriend = null;
let messageRealtimeChannel = null;
let authBusy = false;

/* =========================================================
BASIC HELPERS
========================================================= */

function initSupabase() {
if (!window.supabase) {
console.error("Supabase library did not load.");
return false;
}

```
if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    window.supabaseClient = supabaseClient;
}

return true;
```

}

function pageName() {
const parts = window.location.pathname.split("/");
return (parts[parts.length - 1] || "index.html").toLowerCase();
}

function el(id) {
return document.getElementById(id);
}

function setText(id, value) {
const element = el(id);

```
if (element) {
    element.textContent = value == null ? "" : String(value);
}
```

}

function setValue(id, value) {
const element = el(id);

```
if (element) {
    element.value = value == null ? "" : String(value);
}
```

}

function initials(name) {
const clean = String(name || "?").trim();

```
if (!clean) {
    return "?";
}

const parts = clean.split(/\s+/).filter(Boolean);

if (parts.length >= 2) {
    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}

return clean.substring(0, 2).toUpperCase();
```

}

function escapeHTML(value) {
return String(value == null ? "" : value).replace(
/[&<>"']/g,
function (character) {
const replacements = {
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
};

```
        return replacements[character];
    }
);
```

}

function escapeAttribute(value) {
return escapeHTML(value);
}

function notify(message) {
let toast = el("toast");

```
if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";

    document.body.appendChild(toast);
}

toast.textContent = message;
toast.style.display = "block";

clearTimeout(window.__youremoToastTimer);

window.__youremoToastTimer = setTimeout(function () {
    toast.style.display = "none";
}, 3000);
```

}

function setUser(user) {
currentUser = user || null;
window.currentUser = currentUser;
}

function updateAvatar(id, url, name) {
const element = el(id);

```
if (!element) {
    return;
}

element.innerHTML = "";

if (url) {
    const image = document.createElement("img");

    image.src = url;
    image.alt = name || "Profile";

    image.onerror = function () {
        element.innerHTML = "";
        element.textContent = initials(name);
    };

    element.appendChild(image);
} else {
    element.textContent = initials(name);
}
```

}

/* =========================================================
AUTH MODAL
========================================================= */

function openAuth(mode) {
const modal = el("authModal");

```
if (!modal) {
    console.warn("authModal not found.");
    return;
}

modal.style.display = "flex";

if (mode === "signup") {
    showSignup();
} else {
    showLogin();
}
```

}

function closeAuth() {
const modal = el("authModal");

```
if (modal) {
    modal.style.display = "none";
}
```

}

function showLogin() {
setText("authTitle", "Welcome Back");
setText("authSubtitle", "Login to your YouRemo account");

```
const nameInput = el("authName");
const usernameInput = el("authUsername");

if (nameInput) {
    nameInput.style.display = "none";
}

if (usernameInput) {
    usernameInput.style.display = "none";
}

const button = document.querySelector(".auth-submit");

if (button) {
    button.textContent = "Login";
    button.disabled = false;
    button.onclick = login;
}

const switchButton = el("authSwitch");

if (switchButton) {
    switchButton.textContent = "Create an account";
    switchButton.onclick = function () {
        showSignup();
    };
}
```

}

function showSignup() {
setText("authTitle", "Welcome to YouRemo");
setText("authSubtitle", "Create your account");

```
const nameInput = el("authName");
const usernameInput = el("authUsername");

if (nameInput) {
    nameInput.style.display = "block";
}

if (usernameInput) {
    usernameInput.style.display = "block";
}

const button = document.querySelector(".auth-submit");

if (button) {
    button.textContent = "Create Account";
    button.disabled = false;
    button.onclick = signUp;
}

const switchButton = el("authSwitch");

if (switchButton) {
    switchButton.textContent = "Already have an account? Login";
    switchButton.onclick = function () {
        showLogin();
    };
}
```

}

function clearAuthForm() {
const ids = [
"authName",
"authUsername",
"authEmail",
"authPassword"
];

```
ids.forEach(function (id) {
    const input = el(id);

    if (input) {
        input.value = "";
    }
});
```

}

/* =========================================================
ACCOUNT
========================================================= */

async function refreshAccountUI() {
const loginButton = el("loginButton");
const menu = el("accountMenu");

```
if (!loginButton) {
    return;
}

if (!currentUser) {
    loginButton.textContent = "Login";

    updateAvatar(
        "navAvatar",
        "",
        "User"
    );

    if (menu) {
        menu.style.display = "none";
    }

    return;
}

let profile = null;

try {
    const result = await supabaseClient
        .from("profiles")
        .select("id,username,full_name,avatar_url")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (!result.error) {
        profile = result.data;
    }
} catch (error) {
    console.error("Profile loading error:", error);
}

const name =
    (profile && profile.full_name) ||
    (profile && profile.username) ||
    (currentUser.email
        ? currentUser.email.split("@")[0]
        : "Account");

loginButton.textContent = name;

updateAvatar(
    "navAvatar",
    profile && profile.avatar_url
        ? profile.avatar_url
        : "",
    name
);
```

}

function handleAccountClick() {
if (!currentUser) {
openAuth("login");
return;
}

```
const menu = el("accountMenu");

if (!menu) {
    return;
}

if (menu.style.display === "block") {
    menu.style.display = "none";
} else {
    menu.style.display = "block";
}
```

}

/* =========================================================
LOGIN
========================================================= */

async function login() {
if (authBusy) {
return;
}

```
if (!initSupabase()) {
    return;
}

const emailElement = el("authEmail");
const passwordElement = el("authPassword");

const email = emailElement
    ? emailElement.value.trim()
    : "";

const password = passwordElement
    ? passwordElement.value
    : "";

if (!email || !password) {
    notify("Please enter your email and password.");
    return;
}

authBusy = true;

const button = document.querySelector(".auth-submit");

if (button) {
    button.disabled = true;
    button.textContent = "Logging in...";
}

try {
    const result =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (result.error) {
        notify(result.error.message);
        return;
    }

    setUser(result.data.user);

    closeAuth();
    clearAuthForm();

    await refreshAccountUI();
    await afterLogin();

    notify("Login successful!");
} catch (error) {
    console.error("Login error:", error);
    notify("Login failed. Please try again.");
} finally {
    authBusy = false;

    if (button) {
        button.disabled = false;
        button.textContent = "Login";
    }
}
```

}

/* =========================================================
SIGN UP
========================================================= */

async function signUp() {
if (authBusy) {
return;
}

```
if (!initSupabase()) {
    return;
}

const nameElement = el("authName");
const usernameElement = el("authUsername");
const emailElement = el("authEmail");
const passwordElement = el("authPassword");

const name = nameElement
    ? nameElement.value.trim()
    : "";

const username = usernameElement
    ? usernameElement.value.trim()
    : "";

const email = emailElement
    ? emailElement.value.trim()
    : "";

const password = passwordElement
    ? passwordElement.value
    : "";

if (!name || !username || !email) {
    notify("Please fill in all required fields.");
    return;
}

if (password.length < 6) {
    notify("Password must be at least 6 characters.");
    return;
}

authBusy = true;

const button = document.querySelector(".auth-submit");

if (button) {
    button.disabled = true;
    button.textContent = "Creating...";
}

try {
    const existing = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

    if (existing.error) {
        console.warn(
            "Username check:",
            existing.error
        );
    }

    if (existing.data) {
        notify("That username is already taken.");
        return;
    }

    const result =
        await supabaseClient.auth.signUp({
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

    if (!result.data.user) {
        notify("Account could not be created.");
        return;
    }

    const profileResult =
        await supabaseClient
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

    setUser(result.data.user);

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
} catch (error) {
    console.error("Signup error:", error);
    notify("Could not create the account.");
} finally {
    authBusy = false;

    if (button) {
        button.disabled = false;
        button.textContent = "Create Account";
    }
}
```

}

/* =========================================================
LOGOUT
========================================================= */

async function logout() {
if (!initSupabase()) {
return;
}

```
stopMessageRealtime();

try {
    const result =
        await supabaseClient.auth.signOut();

    if (result.error) {
        notify(result.error.message);
        return;
    }

    setUser(null);
    selectedMessageFriend = null;
    messageFriends = [];

    const menu = el("accountMenu");

    if (menu) {
        menu.style.display = "none";
    }

    await refreshAccountUI();

    notify("Logged out.");

    setTimeout(function () {
        window.location.href = "index.html";
    }, 300);
} catch (error) {
    console.error("Logout error:", error);
    notify("Logout failed.");
}
```

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
if (!currentUser) {
openAuth("login");
return;
}

```
window.location.href = "messages.html";
```

}

function goToProfile() {
if (!currentUser) {
openAuth("login");
return;
}

```
window.location.href = "profile.html";
```

}

function goToRequests() {
if (!currentUser) {
openAuth("login");
return;
}

```
window.location.href = "friends.html#requests";
```

}

function goToMyProfile() {
goToProfile();
}

function learnMore() {
const about = el("about");

```
if (about) {
    about.scrollIntoView({
        behavior: "smooth"
    });
} else {
    window.location.href = "index.html#about";
}
```

}

/* =========================================================
FRIEND SEARCH
========================================================= */

async function searchFriends() {
const input = el("friendSearch");
const results = el("friendResults");

```
if (!results) {
    return;
}

if (!currentUser) {
    openAuth("login");
    return;
}

const query = input
    ? input.value.trim()
    : "";

if (!query) {
    results.innerHTML =
        '<div class="empty-state">' +
        '<div>🔎</div>' +
        '<h2>Discover People</h2>' +
        '<p>Enter a name or username above to find people.</p>' +
        "</div>";

    return;
}

results.innerHTML =
    '<div class="empty-state">' +
    "<div>⏳</div>" +
    "<p>Searching...</p>" +
    "</div>";

try {
    const pattern = "%" + query + "%";

    const nameResult =
        await supabaseClient
            .from("profiles")
            .select(
                "id,username,full_name,avatar_url"
            )
            .ilike("full_name", pattern)
            .limit(30);

    const usernameResult =
        await supabaseClient
            .from("profiles")
            .select(
                "id,username,full_name,avatar_url"
            )
            .ilike("username", pattern)
            .limit(30);

    if (
        nameResult.error &&
        usernameResult.error
    ) {
        throw nameResult.error;
    }

    const people = []
        .concat(nameResult.data || [])
        .concat(usernameResult.data || []);

    const uniquePeople = [];

    const seen = {};

    people.forEach(function (person) {
        if (!person || !person.id) {
            return;
        }

        if (person.id === currentUser.id) {
            return;
        }

        if (!seen[person.id]) {
            seen[person.id] = true;
            uniquePeople.push(person);
        }
    });

    if (!uniquePeople.length) {
        results.innerHTML =
            '<div class="empty-state">' +
            "<div>😕</div>" +
            "<h2>No People Found</h2>" +
            "<p>Try another name or username.</p>" +
            "</div>";

        return;
    }

    results.innerHTML = uniquePeople
        .map(friendSearchCard)
        .join("");
} catch (error) {
    console.error(
        "Friend search error:",
        error
    );

    results.innerHTML =
        '<div class="empty-state">' +
        "<div>⚠️</div>" +
        "<h2>Search Error</h2>" +
        "<p>" +
        escapeHTML(
            error.message ||
            "Unable to search."
        ) +
        "</p>" +
        "</div>";
}
```

}

function friendSearchCard(profile) {
const name =
profile.full_name ||
profile.username ||
"YouRemo User";

```
const avatar = profile.avatar_url
    ? '<img src="' +
      escapeAttribute(profile.avatar_url) +
      '" alt="' +
      escapeAttribute(name) +
      '">'
    : escapeHTML(initials(name));

return (
    '<div class="friend-result-card">' +
    '<div class="friend-avatar">' +
    avatar +
    "</div>" +

    '<div class="friend-result-info">' +
    "<h3>" +
    escapeHTML(name) +
    "</h3>" +

    "<p>" +
    (
        profile.username
            ? "@" +
              escapeHTML(profile.username)
            : ""
    ) +
    "</p>" +

    "</div>" +

    '<button class="primary-btn" type="button" ' +
    'onclick="sendFriendRequest(\'' +
    escapeAttribute(profile.id) +
    "')\">" +
    "Add Friend" +
    "</button>" +

    "</div>"
);
```

}

/* =========================================================
SEND FRIEND REQUEST
========================================================= */

async function sendFriendRequest(receiverId) {
if (!currentUser) {
openAuth("login");
return;
}

```
if (
    !receiverId ||
    receiverId === currentUser.id
) {
    return;
}

try {
    const result =
        await supabaseClient
            .from("friend_requests")
            .select(
                "id,status,sender_id,receiver_id"
            )
            .or(
                "and(sender_id.eq." +
                currentUser.id +
                ",receiver_id.eq." +
                receiverId +
                "),and(sender_id.eq." +
                receiverId +
                ",receiver_id.eq." +
                currentUser.id +
                ")"
            );

    if (result.error) {
        throw result.error;
    }

    const existing =
        (result.data || [])[0];

    if (
        existing &&
        existing.status === "accepted"
    ) {
        notify("You are already friends.");
        return;
    }

    if (
        existing &&
        existing.status === "pending"
    ) {
        notify(
            "A friend request already exists."
        );
        return;
    }

    let requestResult;

    if (existing) {
        requestResult =
            await supabaseClient
                .from("friend_requests")
                .update({
                    sender_id: currentUser.id,
                    receiver_id: receiverId,
                    status: "pending"
                })
                .eq("id", existing.id);
    } else {
        requestResult =
            await supabaseClient
                .from("friend_requests")
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: receiverId,
                    status: "pending"
                });
    }

    if (requestResult.error) {
        throw requestResult.error;
    }

    notify("Friend request sent!");

    await loadFriendRequests();
} catch (error) {
    console.error(
        "Friend request error:",
        error
    );

    notify(
        error.message ||
        "Could not send friend request."
    );
}
```

}

/* =========================================================
FRIEND REQUESTS
========================================================= */

async function loadFriendRequests() {
const badge = el("requestBadge");
const container = el("friendRequests");

```
if (!currentUser) {
    if (badge) {
        badge.style.display = "none";
        badge.textContent = "0";
    }

    return;
}

try {
    const result =
        await supabaseClient
            .from("friend_requests")
            .select(
                "id,sender_id,receiver_id,status"
            )
            .eq(
                "receiver_id",
                currentUser.id
            )
            .eq("status", "pending");

    if (result.error) {
        throw result.error;
    }

    const rows = result.data || [];

    if (badge) {
        badge.textContent =
            String(rows.length);

        badge.style.display =
            rows.length
                ? "inline-flex"
                : "none";
    }

    if (container) {
        await renderRequests(rows);
    }
} catch (error) {
    console.error(
        "Friend requests error:",
        error
    );
}
```

}

async function renderRequests(rows) {
const container = el("friendRequests");

```
if (!container) {
    return;
}

if (!rows.length) {
    container.innerHTML =
        '<div class="empty-state">' +
        "<div>📭</div>" +
        "<h2>No Friend Requests</h2>" +
        "<p>You're all caught up.</p>" +
        "</div>";

    return;
}

const ids = rows.map(function (row) {
    return row.sender_id;
});

const result =
    await supabaseClient
        .from("profiles")
        .select(
            "id,username,full_name,avatar_url"
        )
        .in("id", ids);

const profiles = result.data || [];

container.innerHTML = rows
    .map(function (request) {
        const profile =
            profiles.find(function (item) {
                return (
                    item.id ===
                    request.sender_id
                );
            }) || {};

        const name =
            profile.full_name ||
            profile.username ||
            "YouRemo User";

        const avatar =
            profile.avatar_url
                ? '<img src="' +
                  escapeAttribute(
                      profile.avatar_url
                  ) +
                  '" alt="' +
                  escapeAttribute(name) +
                  '">'
                : escapeHTML(
                      initials(name)
                  );

        return (
            '<div class="friend-request-card">' +

            '<div class="friend-avatar">' +
            avatar +
            "</div>" +

            '<div class="friend-result-info">' +
            "<h3>" +
            escapeHTML(name) +
            "</h3>" +

            "<p>" +
            (
                profile.username
                    ? "@" +
                      escapeHTML(
                          profile.username
                      )
                    : ""
            ) +
            "</p>" +

            "</div>" +

            '<div class="request-actions">' +

            '<button class="primary-btn" ' +
            'onclick="acceptFriendRequest(\'' +
            escapeAttribute(request.id) +
            "')\">" +
            "Accept" +
            "</button>" +

            '<button class="secondary-btn" ' +
            'onclick="declineFriendRequest(\'' +
            escapeAttribute(request.id) +
            "')\">" +
            "Decline" +
            "</button>" +

            "</div>" +

            "</div>"
        );
    })
    .join("");
```

}

async function acceptFriendRequest(id) {
if (!currentUser) {
return;
}

```
try {
    const request =
        await supabaseClient
            .from("friend_requests")
            .select("*")
            .eq("id", id)
            .maybeSingle();

    if (request.error) {
        throw request.error;
    }

    if (!request.data) {
        throw new Error(
            "Friend request not found."
        );
    }

    const update =
        await supabaseClient
            .from("friend_requests")
            .update({
                status: "accepted"
            })
            .eq("id", id)
            .eq(
                "receiver_id",
                currentUser.id
            );

    if (update.error) {
        throw update.error;
    }

    const friendship =
        await supabaseClient
            .from("friendships")
            .insert({
                user_id:
                    request.data.sender_id,
                friend_id:
                    request.data.receiver_id
            });

    if (
        friendship.error &&
        !String(
            friendship.error.message
        )
            .toLowerCase()
            .includes("duplicate")
    ) {
        throw friendship.error;
    }

    notify(
        "Friend request accepted!"
    );

    await loadFriendRequests();
    await loadMyFriends();
    await loadMessageFriends();
} catch (error) {
    console.error(
        "Accept request error:",
        error
    );

    notify(
        error.message ||
        "Could not accept request."
    );
}
```

}

async function declineFriendRequest(id) {
if (!currentUser) {
return;
}

```
try {
    const result =
        await supabaseClient
            .from("friend_requests")
            .update({
                status: "declined"
            })
            .eq("id", id)
            .eq(
                "receiver_id",
                currentUser.id
            );

    if (result.error) {
        throw result.error;
    }

    await loadFriendRequests();

    notify("Request declined.");
} catch (error) {
    console.error(
        "Decline request error:",
        error
    );

    notify(error.message);
}
```

}

/* =========================================================
FRIENDS LIST
========================================================= */

async function loadMyFriends() {
const container = el("friendsList");

```
if (!container) {
    return;
}

if (!currentUser) {
    container.innerHTML =
        '<div class="empty-state">' +
        "<div>🔐</div>" +
        "<h2>Login Required</h2>" +
        "<p>Please login to see your friends.</p>" +
        "</div>";

    return;
}

try {
    const result =
        await supabaseClient
            .from("friendships")
            .select(
                "id,user_id,friend_id"
            )
            .or(
                "user_id.eq." +
                currentUser.id +
                ",friend_id.eq." +
                currentUser.id
            );

    if (result.error) {
        throw result.error;
    }

    const ids = [];

    (result.data || []).forEach(
        function (row) {
            const friendId =
                row.user_id === currentUser.id
                    ? row.friend_id
                    : row.user_id;

            if (
                friendId &&
                ids.indexOf(friendId) === -1
            ) {
                ids.push(friendId);
            }
        }
    );

    const count = el("friendsCount");

    if (count) {
        count.textContent =
            ids.length +
            " Friend" +
            (
                ids.length === 1
                    ? ""
                    : "s"
            );
    }

    if (!ids.length) {
        container.innerHTML =
            '<div class="empty-state">' +
            "<div>👥</div>" +
            "<h2>No Friends Yet</h2>" +
            "<p>Search for people and send friend requests.</p>" +
            "</div>";

        return;
    }

    const profiles =
        await supabaseClient
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
            .map(friendCard)
            .join("");
} catch (error) {
    console.error(
        "Friends loading error:",
        error
    );

    container.innerHTML =
        '<div class="empty-state">' +
        "<div>⚠️</div>" +
        "<h2>Unable to load friends</h2>" +
        "<p>" +
        escapeHTML(
            error.message || ""
        ) +
        "</p>" +
        "</div>";
}
```

}

function friendCard(profile) {
const name =
profile.full_name ||
profile.username ||
"YouRemo User";

```
const avatar =
    profile.avatar_url
        ? '<img src="' +
          escapeAttribute(
              profile.avatar_url
          ) +
          '" alt="' +
          escapeAttribute(name) +
          '">'
        : escapeHTML(initials(name));

return (
    '<div class="friend-card">' +

    '<div class="friend-avatar">' +
    avatar +
    "</div>" +

    '<div class="friend-info">' +

    "<h3>" +
    escapeHTML(name) +
    "</h3>" +

    "<p>" +
    (
        profile.username
            ? "@" +
              escapeHTML(
                  profile.username
              )
            : ""
    ) +
    "</p>" +

    "</div>" +

    '<button class="primary-btn" ' +
    'onclick="messageFriend(\'' +
    escapeAttribute(profile.id) +
    "')\">" +
    "Message" +
    "</button>" +

    "</div>"
);
```

}

function messageFriend(id) {
if (!currentUser) {
openAuth("login");
return;
}

```
window.location.href =
    "messages.html?friend=" +
    encodeURIComponent(id);
```

}

/* =========================================================
MESSAGES
========================================================= */

async function loadMessageFriends() {
const list = el("conversationList");

```
if (!list) {
    return;
}

if (!currentUser) {
    list.innerHTML =
        '<div class="empty-state">' +
        "<div>🔐</div>" +
        "<h2>Login Required</h2>" +
        "<p>Please login to see your conversations.</p>" +
        "</div>";

    return;
}

try {
    const friendships =
        await supabaseClient
            .from("friendships")
            .select(
                "user_id,friend_id"
            )
            .or(
                "user_id.eq." +
                currentUser.id +
                ",friend_id.eq." +
                currentUser.id
            );

    if (friendships.error) {
        throw friendships.error;
    }

    const ids = [];

    (friendships.data || []).forEach(
        function (row) {
            const friendId =
                row.user_id === currentUser.id
                    ? row.friend_id
                    : row.user_id;

            if (
                friendId &&
                ids.indexOf(friendId) === -1
            ) {
                ids.push(friendId);
            }
        }
    );

    if (!ids.length) {
        messageFriends = [];
        renderMessageFriends();
        return;
    }

    const profiles =
        await supabaseClient
            .from("profiles")
            .select(
                "id,username,full_name,avatar_url"
            )
            .in("id", ids);

    if (profiles.error) {
        throw profiles.error;
    }

    messageFriends =
        profiles.data || [];

    renderMessageFriends();

    selectFriendFromURL();
} catch (error) {
    console.error(
        "Message friends error:",
        error
    );
}
```

}

function renderMessageFriends(term) {
const list = el("conversationList");

```
if (!list) {
    return;
}

const searchTerm =
    String(term || "")
        .trim()
        .toLowerCase();

const friends =
    messageFriends.filter(
        function (profile) {
            const name =
                (
                    profile.full_name ||
                    ""
                ).toLowerCase();

            const username =
                (
                    profile.username ||
                    ""
                ).toLowerCase();

            return (
                !searchTerm ||
                name.includes(searchTerm) ||
                username.includes(searchTerm)
            );
        }
    );

if (!friends.length) {
    list.innerHTML =
        '<div class="empty-state">' +
        "<div>👥</div>" +
        "<h2>No Friends</h2>" +
        "<p>Add friends first to start chatting.</p>" +
        "</div>";

    return;
}

list.innerHTML =
    friends
        .map(function (profile) {
            const name =
                profile.full_name ||
                profile.username ||
                "User";

            const avatar =
                profile.avatar_url
                    ? '<img src="' +
                      escapeAttribute(
                          profile.avatar_url
                      ) +
                      '" alt="">'
                    : escapeHTML(
                          initials(name)
                      );

            const selected =
                selectedMessageFriend &&
                selectedMessageFriend.id ===
                    profile.id
                    ? " selected"
                    : "";

            return (
                '<button type="button" ' +
                'class="conversation-card' +
                selected +
                '" ' +
                'onclick="selectMessageFriend(\'' +
                escapeAttribute(
                    profile.id
                ) +
                "')\">" +

                '<div class="conversation-avatar">' +
                avatar +
                "</div>" +

                '<div class="conversation-info">' +

                "<h3>" +
                escapeHTML(name) +
                "</h3>" +

                "<p>" +
                (
                    profile.username
                        ? "@" +
                          escapeHTML(
                              profile.username
                          )
                        : ""
                ) +
                "</p>" +

                "</div>" +

                "</button>"
            );
        })
        .join("");
```

}

async function selectMessageFriend(id) {
const profile =
messageFriends.find(
function (item) {
return item.id === id;
}
);

```
if (!profile) {
    return;
}

selectedMessageFriend = profile;
window.selectedMessageFriend = profile;

const name =
    profile.full_name ||
    profile.username ||
    "YouRemo User";

setText(
    "chatFriendName",
    name
);

setText(
    "chatFriendUsername",
    profile.username
        ? "@" + profile.username
        : ""
);

updateAvatar(
    "chatFriendAvatar",
    profile.avatar_url || "",
    name
);

renderMessageFriends(
    el("messageFriendSearch")
        ? el("messageFriendSearch").value
        : ""
);

await loadConversationMessages(
    profile.id
);
```

}

async function loadConversationMessages(friendId) {
const chat = el("chatMessages");

```
if (!chat || !currentUser) {
    return;
}

chat.innerHTML =
    '<div class="empty-state">' +
    "<div>⏳</div>" +
    "<p>Loading messages...</p>" +
    "</div>";

try {
    const result =
        await supabaseClient
            .from("messages")
            .select(
                "id,sender_id,receiver_id,message,created_at,seen"
            )
            .or(
                "and(sender_id.eq." +
                currentUser.id +
                ",receiver_id.eq." +
                friendId +
                "),and(sender_id.eq." +
                friendId +
                ",receiver_id.eq." +
                currentUser.id +
                ")"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (result.error) {
        throw result.error;
    }

    chat.innerHTML = "";

    if (
        !result.data ||
        !result.data.length
    ) {
        chat.innerHTML =
            '<div class="empty-state">' +
            "<div>💬</div>" +
            "<h2>Start a Conversation</h2>" +
            "<p>Send your first message.</p>" +
            "</div>";
    } else {
        result.data.forEach(
            appendMessage
        );
    }

    chat.scrollTop =
        chat.scrollHeight;

    const unreadIds =
        (result.data || [])
            .filter(function (message) {
                return (
                    message.receiver_id ===
                        currentUser.id &&
                    !message.seen
                );
            })
            .map(function (message) {
                return message.id;
            });

    if (unreadIds.length) {
        await supabaseClient
            .from("messages")
            .update({
                seen: true
            })
            .in(
                "id",
                unreadIds
            )
            .eq(
                "receiver_id",
                currentUser.id
            );
    }
} catch (error) {
    console.error(
        "Conversation error:",
        error
    );

    chat.innerHTML =
        '<div class="empty-state">' +
        "<div>⚠️</div>" +
        "<h2>Unable to load messages</h2>" +
        "<p>" +
        escapeHTML(
            error.message || ""
        ) +
        "</p>" +
        "</div>";
}
```

}

function appendMessage(message) {
const chat = el("chatMessages");

```
if (!chat || !currentUser) {
    return;
}

const friend =
    selectedMessageFriend;

if (friend) {
    const valid =
        (
            message.sender_id ===
                currentUser.id &&
            message.receiver_id ===
                friend.id
        ) ||
        (
            message.sender_id ===
                friend.id &&
            message.receiver_id ===
                currentUser.id
        );

    if (!valid) {
        return;
    }
}

const existing =
    chat.querySelector(
        '[data-message-id="' +
        escapeAttribute(
            String(message.id)
        ) +
        '"]'
    );

if (existing) {
    return;
}

const wrapper =
    document.createElement("div");

wrapper.className =
    "message-bubble-wrapper " +
    (
        message.sender_id ===
        currentUser.id
            ? "sent"
            : "received"
    );

wrapper.dataset.messageId =
    String(message.id);

const bubble =
    document.createElement("div");

bubble.className =
    "message-bubble";

bubble.textContent =
    message.message || "";

wrapper.appendChild(bubble);

if (
    message.sender_id ===
    currentUser.id
) {
    const status =
        document.createElement("span");

    status.className =
        "message-seen";

    status.textContent =
        message.seen
            ? "Seen"
            : "Sent";

    wrapper.appendChild(status);
}

chat.appendChild(wrapper);

chat.scrollTop =
    chat.scrollHeight;
```

}

async function sendMessage() {
if (!currentUser) {
openAuth("login");
return;
}

```
if (!selectedMessageFriend) {
    notify(
        "Please select a friend first."
    );
    return;
}

const input = el("messageInput");

if (!input) {
    return;
}

const message =
    input.value.trim();

if (!message) {
    return;
}

const button =
    el("sendMessageButton");

if (button) {
    button.disabled = true;
}

try {
    const result =
        await supabaseClient
            .from("messages")
            .insert({
                sender_id:
                    currentUser.id,

                receiver_id:
                    selectedMessageFriend.id,

                message: message,

                seen: false
            })
            .select()
            .single();

    if (result.error) {
        throw result.error;
    }

    input.value = "";

    appendMessage(
        result.data
    );

    input.focus();
} catch (error) {
    console.error(
        "Send message error:",
        error
    );

    notify(
        error.message ||
        "Could not send message."
    );
} finally {
    if (button) {
        button.disabled = false;
    }
}
```

}

/* =========================================================
MESSAGE REALTIME
========================================================= */

function startMessageRealtime() {
if (
!currentUser ||
pageName() !== "messages.html"
) {
return;
}

```
stopMessageRealtime();

messageRealtimeChannel =
    supabaseClient
        .channel(
            "youremo-messages-" +
            currentUser.id
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

                if (
                    message &&
                    (
                        message.sender_id ===
                            currentUser.id ||
                        message.receiver_id ===
                            currentUser.id
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
                const message =
                    payload.new;

                if (!message) {
                    return;
                }

                const element =
                    document.querySelector(
                        '[data-message-id="' +
                        escapeAttribute(
                            String(
                                message.id
                            )
                        ) +
                        '"]'
                    );

                if (element) {
                    const status =
                        element.querySelector(
                            ".message-seen"
                        );

                    if (status) {
                        status.textContent =
                            message.seen
                                ? "Seen"
                                : "Sent";
                    }
                }
            }
        )
        .subscribe(function (status) {
            console.log(
                "Message realtime:",
                status
            );
        });
```

}

function stopMessageRealtime() {
if (
messageRealtimeChannel &&
supabaseClient
) {
supabaseClient.removeChannel(
messageRealtimeChannel
);

```
    messageRealtimeChannel =
        null;
}
```

}

function selectFriendFromURL() {
const params =
new URLSearchParams(
window.location.search
);

```
const id =
    params.get("friend");

if (!id) {
    return;
}

const exists =
    messageFriends.some(
        function (profile) {
            return profile.id === id;
        }
    );

if (exists) {
    selectMessageFriend(id);
}
```

}

/* =========================================================
PROFILE
========================================================= */

async function loadProfile() {
if (!currentUser) {
return null;
}

```
try {
    const result =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();

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
            ? "@" +
              profile.username
            : ""
    );

    setText(
        "profileBio",
        profile.bio || ""
    );

    setText(
        "profileEmail",
        currentUser.email ||
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
} catch (error) {
    console.error(
        "Profile error:",
        error
    );

    return null;
}
```

}

async function saveProfile() {
if (!currentUser) {
openAuth("login");
return;
}

```
const nameElement =
    el("profileFullName");

const usernameElement =
    el("profileUsernameInput");

const bioElement =
    el("profileBioInput");

const name =
    nameElement
        ? nameElement.value.trim()
        : "";

const username =
    usernameElement
        ? usernameElement.value.trim()
        : "";

const bio =
    bioElement
        ? bioElement.value.trim()
        : "";

if (!name || !username) {
    notify(
        "Name and username are required."
    );
    return;
}

try {
    const existing =
        await supabaseClient
            .from("profiles")
            .select("id")
            .eq(
                "username",
                username
            )
            .neq(
                "id",
                currentUser.id
            )
            .maybeSingle();

    if (existing.error) {
        console.warn(
            "Username check:",
            existing.error
        );
    }

    if (existing.data) {
        notify(
            "That username is already taken."
        );
        return;
    }

    const result =
        await supabaseClient
            .from("profiles")
            .update({
                full_name: name,
                username: username,
                bio: bio
            })
            .eq(
                "id",
                currentUser.id
            );

    if (result.error) {
        throw result.error;
    }

    await loadProfile();
    await refreshAccountUI();

    notify(
        "Profile updated successfully!"
    );
} catch (error) {
    console.error(
        "Save profile error:",
        error
    );

    notify(
        error.message ||
        "Could not update profile."
    );
}
```

}

/* =========================================================
AVATAR UPLOAD
========================================================= */

async function uploadAvatar(file) {
if (!currentUser) {
openAuth("login");
return;
}

```
if (!file) {
    return;
}

try {
    const filename =
        file.name || "avatar.jpg";

    const parts =
        filename.split(".");

    const extension =
        (
            parts.length > 1
                ? parts[parts.length - 1]
                : "jpg"
        ).toLowerCase();

    const path =
        currentUser.id +
        "/" +
        Date.now() +
        "." +
        extension;

    const upload =
        await supabaseClient
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
        supabaseClient
            .storage
            .from("avatars")
            .getPublicUrl(path)
            .data.publicUrl;

    const profile =
        await supabaseClient
            .from("profiles")
            .update({
                avatar_url:
                    publicURL
            })
            .eq(
                "id",
                currentUser.id
            );

    if (profile.error) {
        throw profile.error;
    }

    await loadProfile();
    await refreshAccountUI();

    notify(
        "Profile photo updated!"
    );
} catch (error) {
    console.error(
        "Avatar upload error:",
        error
    );

    notify(
        error.message ||
        "Could not upload photo."
    );
}
```

}

/* =========================================================
LOGIN AFTER ACTIONS
========================================================= */

async function afterLogin() {
await refreshAccountUI();

```
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
```

}

/* =========================================================
PAGE EVENT SETUP
========================================================= */

function setupPage() {

```
const friendSearch =
    el("friendSearch");

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
    el("messageFriendSearch");

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
    el("messageInput");

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
    el("profileForm");

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
    el("avatarInput");

if (avatarInput) {
    avatarInput.addEventListener(
        "change",
        function (event) {
            const file =
                event.target.files &&
                event.target.files[0];

            uploadAvatar(file);
        }
    );
}


const authModal =
    el("authModal");

if (authModal) {
    authModal.addEventListener(
        "click",
        function (event) {
            if (
                event.target ===
                authModal
            ) {
                closeAuth();
            }
        }
    );
}
```

}

/* =========================================================
MAKE INLINE HTML FUNCTIONS GLOBAL
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
window.goToFriends =
goToFriends;
window.goToMessages =
goToMessages;
window.goToProfile =
goToProfile;
window.goToRequests =
goToRequests;
window.goToMyProfile =
goToMyProfile;
window.learnMore =
learnMore;

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

window.friendCard =
friendCard;

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
        console.error(
            "Supabase initialization failed."
        );

        return;
    }


    setupPage();


    try {
        const sessionResult =
            await supabaseClient
                .auth
                .getSession();

        setUser(
            sessionResult.data &&
            sessionResult.data.session
                ? sessionResult.data.session.user
                : null
        );

        await refreshAccountUI();

        if (currentUser) {
            await afterLogin();
        } else {

            if (
                pageName() ===
                "friends.html"
            ) {
                await loadFriendRequests();
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


    supabaseClient.auth.onAuthStateChange(
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );

            setUser(
                session
                    ? session.user
                    : null
            );

            setTimeout(
                async function () {

                    await refreshAccountUI();

                    if (currentUser) {
                        await afterLogin();
                    } else {
                        stopMessageRealtime();
                    }

                },
                100
            );
        }
    );

}
```

);

console.log(
"YouRemo script.js ready."
);
