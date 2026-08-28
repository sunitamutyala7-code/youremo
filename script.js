```javascript
/* =========================================================
   YOUREMO - COMPLETE REPLACEMENT script.js
   Works with:
   index.html
   friends.html
   messages.html
   profile.html

   Supabase tables used:
   profiles
   friendships
   friend_requests
   messages
   ========================================================= */

"use strict";

/* =========================================================
   1. SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://ykqnqdtekbxnevtjjkbd.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

window.supabaseClient = supabaseClient;


/* =========================================================
   2. GLOBAL STATE
   ========================================================= */

let currentUser = null;
let selectedMessageFriend = null;
let messageRealtimeChannel = null;
let messageFriends = [];
let authBusy = false;


/* =========================================================
   3. BASIC HELPERS
   ========================================================= */

function getCurrentPage() {
  const path =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  return path || "index.html";
}


function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value === null ||
      value === undefined
        ? ""
        : String(value);
  }
}


function setValue(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value === null ||
      value === undefined
        ? ""
        : value;
  }
}


function getInitials(name) {
  if (!name) {
    return "?";
  }

  const words =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "?";
  }

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();
}


function escapeHTML(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeJS(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}


function updateAvatarElement(
  id,
  avatarUrl,
  name
) {
  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.innerHTML = "";
  element.style.backgroundImage = "none";

  if (avatarUrl) {
    const img =
      document.createElement("img");

    img.src = avatarUrl;
    img.alt =
      name || "Profile photo";

    img.className =
      "profile-avatar-img";

    img.onerror =
      function () {
        this.remove();

        element.textContent =
          getInitials(name);
      };

    element.appendChild(img);

    return;
  }

  element.textContent =
    getInitials(name);
}


/* =========================================================
   4. STARTUP
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "YouRemo script loaded."
    );

    console.log(
      "Current page:",
      getCurrentPage()
    );

    setupSearchEnterKey();
    setupMessagePageSearch();
    setupMessageInput();

    await loadCurrentUser();

    setupAvatarUpload();
    setupProfilePage();

    setupPageSpecificFeatures();

  }
);


/* =========================================================
   5. AUTH STATE
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  function (event, session) {

    console.log(
      "Auth event:",
      event
    );

    currentUser =
      session && session.user
        ? session.user
        : null;

    setTimeout(
      async function () {

        await refreshAccountUI();

        if (currentUser) {

          await loadProfile();
          await loadFriendRequests();
          await loadMyFriends();

          if (
            getCurrentPage() ===
            "messages.html"
          ) {

            await loadMessageFriends();

            startMessageRealtime();

          }

        } else {

          stopMessageRealtime();

        }

      },
      50
    );

  }
);


/* =========================================================
   6. LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

  try {

    const result =
      await supabaseClient.auth.getUser();

    if (result.error) {

      console.error(
        "Get user error:",
        result.error
      );

      currentUser = null;

      await refreshAccountUI();

      return;
    }

    currentUser =
      result.data.user || null;

    await refreshAccountUI();

    if (currentUser) {

      await loadProfile();
      await loadFriendRequests();
      await loadMyFriends();

      if (
        getCurrentPage() ===
        "messages.html"
      ) {

        await loadMessageFriends();

        startMessageRealtime();

      }

    }

  } catch (error) {

    console.error(
      "loadCurrentUser error:",
      error
    );

  }

}


/* =========================================================
   7. ACCOUNT UI
   ========================================================= */

async function refreshAccountUI() {

  const loginButton =
    document.getElementById(
      "loginButton"
    );

  const navAvatar =
    document.getElementById(
      "navAvatar"
    );

  const accountMenu =
    document.getElementById(
      "accountMenu"
    );

  if (!loginButton) {
    return;
  }

  if (!currentUser) {

    loginButton.textContent =
      "Login";

    if (navAvatar) {

      navAvatar.innerHTML =
        "👤";

      navAvatar.style.backgroundImage =
        "none";

    }

    if (accountMenu) {

      accountMenu.style.display =
        "none";

    }

    return;
  }

  let profile = null;

  try {

    const result =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();

    if (!result.error) {
      profile = result.data;
    }

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

  }

  const displayName =
    profile &&
    profile.full_name
      ? profile.full_name
      : profile &&
        profile.username
        ? profile.username
        : currentUser.email
          ? currentUser.email.split("@")[0]
          : "Account";

  loginButton.textContent =
    displayName;

  if (navAvatar) {

    updateAvatarElement(
      "navAvatar",
      profile &&
      profile.avatar_url
        ? profile.avatar_url
        : "",
      displayName
    );

  }

}


function handleAccountClick() {

  if (!currentUser) {

    openAuth();

    return;

  }

  const menu =
    document.getElementById(
      "accountMenu"
    );

  if (!menu) {
    return;
  }

  const visible =
    window.getComputedStyle(menu)
      .display !== "none";

  menu.style.display =
    visible
      ? "none"
      : "block";

}


/* =========================================================
   8. AUTH MODAL
   ========================================================= */

function openAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );

  if (!modal) {
    return;
  }

  modal.style.display =
    "flex";

  showLogin();

}


function closeAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );

  if (modal) {

    modal.style.display =
      "none";

  }

}


function showLogin() {

  const title =
    document.getElementById(
      "authTitle"
    );

  const subtitle =
    document.getElementById(
      "authSubtitle"
    );

  const name =
    document.getElementById(
      "authName"
    );

  const username =
    document.getElementById(
      "authUsername"
    );

  const button =
    document.querySelector(
      ".auth-submit"
    );

  if (title) {
    title.textContent =
      "Welcome Back";
  }

  if (subtitle) {
    subtitle.textContent =
      "Login to your YouRemo account";
  }

  if (name) {
    name.style.display =
      "none";
  }

  if (username) {
    username.style.display =
      "none";
  }

  if (button) {

    button.textContent =
      "Login";

    button.onclick =
      login;

  }

}


function showSignup() {

  const title =
    document.getElementById(
      "authTitle"
    );

  const subtitle =
    document.getElementById(
      "authSubtitle"
    );

  const name =
    document.getElementById(
      "authName"
    );

  const username =
    document.getElementById(
      "authUsername"
    );

  const button =
    document.querySelector(
      ".auth-submit"
    );

  if (title) {

    title.textContent =
      "Welcome to YouRemo";

  }

  if (subtitle) {

    subtitle.textContent =
      "Create your account";

  }

  if (name) {

    name.style.display =
      "block";

  }

  if (username) {

    username.style.display =
      "block";

  }

  if (button) {

    button.textContent =
      "Create Account";

    button.onclick =
      signUp;

  }

}


function clearAuthForm() {

  [
    "authName",
    "authUsername",
    "authEmail",
    "authPassword"
  ].forEach(
    function (id) {

      const element =
        document.getElementById(id);

      if (element) {
        element.value = "";
      }

    }
  );

}


/* =========================================================
   9. SIGN UP
   ========================================================= */

async function signUp() {

  if (authBusy) {
    return;
  }

  const name =
    document.getElementById(
      "authName"
    )?.value.trim() || "";

  const username =
    document.getElementById(
      "authUsername"
    )?.value.trim() || "";

  const email =
    document.getElementById(
      "authEmail"
    )?.value.trim() || "";

  const password =
    document.getElementById(
      "authPassword"
    )?.value || "";

  if (!name) {

    alert(
      "Please enter your full name."
    );

    return;

  }

  if (!username) {

    alert(
      "Please enter a username."
    );

    return;

  }

  if (!email) {

    alert(
      "Please enter your email."
    );

    return;

  }

  if (password.length < 6) {

    alert(
      "Password must be at least 6 characters."
    );

    return;

  }

  authBusy = true;

  try {

    const usernameCheck =
      await supabaseClient
        .from("profiles")
        .select("id")
        .eq(
          "username",
          username
        )
        .maybeSingle();

    if (usernameCheck.error) {

      console.error(
        "Username check error:",
        usernameCheck.error
      );

    }

    if (usernameCheck.data) {

      alert(
        "That username is already taken."
      );

      return;

    }

    const result =
      await supabaseClient.auth.signUp({

        email:
          email,

        password:
          password,

        options: {

          data: {

            full_name:
              name,

            username:
              username

          }

        }

      });

    if (result.error) {

      alert(
        result.error.message
      );

      return;

    }

    if (
      !result.data ||
      !result.data.user
    ) {

      alert(
        "Account could not be created."
      );

      return;

    }

    const profileResult =
      await supabaseClient
        .from("profiles")
        .upsert({

          id:
            result.data.user.id,

          full_name:
            name,

          username:
            username

        });

    if (profileResult.error) {

      console.error(
        "Profile creation error:",
        profileResult.error
      );

    }

    alert(
      "Account created successfully!"
    );

    closeAuth();

    clearAuthForm();

    currentUser =
      result.data.user;

    await refreshAccountUI();

    await loadProfile();

  } catch (error) {

    console.error(
      "Signup error:",
      error
    );

    alert(
      "Something went wrong while creating your account."
    );

  } finally {

    authBusy = false;

  }

}


/* =========================================================
   10. LOGIN
   ========================================================= */

async function login() {

  if (authBusy) {
    return;
  }

  const email =
    document.getElementById(
      "authEmail"
    )?.value.trim() || "";

  const password =
    document.getElementById(
      "authPassword"
    )?.value || "";

  if (!email || !password) {

    alert(
      "Please enter your email and password."
    );

    return;

  }

  authBusy = true;

  try {

    const result =
      await supabaseClient.auth
        .signInWithPassword({

          email:
            email,

          password:
            password

        });

    if (result.error) {

      alert(
        result.error.message
      );

      return;

    }

    currentUser =
      result.data.user || null;

    closeAuth();

    clearAuthForm();

    await refreshAccountUI();

    if (currentUser) {

      await loadProfile();
      await loadFriendRequests();
      await loadMyFriends();

      if (
        getCurrentPage() ===
        "messages.html"
      ) {

        await loadMessageFriends();

        startMessageRealtime();

      }

    }

    alert(
      "Login successful!"
    );

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    alert(
      "Login failed."
    );

  } finally {

    authBusy = false;

  }

}


/* =========================================================
   11. LOGOUT
   ========================================================= */

async function logout() {

  try {

    stopMessageRealtime();

    const result =
      await supabaseClient.auth.signOut();

    if (result.error) {

      alert(
        result.error.message
      );

      return;

    }

    currentUser = null;

    selectedMessageFriend = null;

    window.selectedMessageFriend =
      null;

    const menu =
      document.getElementById(
        "accountMenu"
      );

    if (menu) {

      menu.style.display =
        "none";

    }

    await refreshAccountUI();

    window.location.href =
      "index.html";

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    alert(
      "Logout failed."
    );

  }

}


/* =========================================================
   12. NAVIGATION
   ========================================================= */

function goHome() {

  window.location.href =
    "index.html";

}


function goToFriends() {

  window.location.href =
    "friends.html";

}


function goToMessages() {

  if (!currentUser) {

    openAuth();

    return;

  }

  window.location.href =
    "messages.html";

}


function goToProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }

  window.location.href =
    "profile.html";

}


function goToRequests() {

  if (!currentUser) {

    openAuth();

    return;

  }

  window.location.href =
    "friends.html#requests";

}


function goToMyProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }

  window.location.href =
    "profile.html";

}


function learnMore() {

  const target =
    document.getElementById(
      "about"
    );

  if (target) {

    target.scrollIntoView({

      behavior:
        "smooth"

    });

    return;

  }

  window.location.href =
    "index.html#about";

}


/* =========================================================
   13. FRIEND SEARCH
   ========================================================= */

async function searchFriends() {

  const input =
    document.getElementById(
      "friendSearch"
    );

  const results =
    document.getElementById(
      "friendResults"
    );

  if (!results) {
    return;
  }

  const searchTerm =
    input
      ? input.value.trim()
      : "";

  if (!searchTerm) {

    results.innerHTML =
      '<div class="empty-state">' +
      '<div>🔎</div>' +
      '<h2>Discover People</h2>' +
      '<p>Enter a name or username above to find people on YouRemo.</p>' +
      '</div>';

    return;

  }

  results.innerHTML =
    '<div class="empty-state">' +
    '<div>⏳</div>' +
    '<p>Searching...</p>' +
    '</div>';

  try {

    const pattern =
      "%" +
      searchTerm +
      "%";

    const nameResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .ilike(
          "full_name",
          pattern
        )
        .limit(30);

    const usernameResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .ilike(
          "username",
          pattern
        )
        .limit(30);

    if (
      nameResult.error &&
      usernameResult.error
    ) {

      throw (
        nameResult.error ||
        usernameResult.error
      );

    }

    const combined = [
      ...(nameResult.data || []),
      ...(usernameResult.data || [])
    ];

    const unique =
      Array.from(
        new Map(
          combined.map(
            function (person) {
              return [
                person.id,
                person
              ];
            }
          )
        ).values()
      );

    const filtered =
      currentUser
        ? unique.filter(
            function (person) {
              return (
                person.id !==
                currentUser.id
              );
            }
          )
        : unique;

    if (!filtered.length) {

      results.innerHTML =
        '<div class="empty-state">' +
        '<div>😕</div>' +
        '<h2>No People Found</h2>' +
        '<p>Try another name or username.</p>' +
        '</div>';

      return;

    }

    results.innerHTML =
      filtered
        .map(
          function (person) {

            return createFriendSearchCard(
              person
            );

          }
        )
        .join("");

  } catch (error) {

    console.error(
      "searchFriends error:",
      error
    );

    results.innerHTML =
      '<div class="empty-state">' +
      '<div>⚠️</div>' +
      '<h2>Search Error</h2>' +
      '<p>Unable to search for people.</p>' +
      '</div>';

  }

}


/* =========================================================
   14. FRIEND SEARCH CARD
   ========================================================= */

function createFriendSearchCard(
  person
) {

  const name =
    person.full_name ||
    person.username ||
    "YouRemo User";

  const username =
    person.username
      ? "@" +
        person.username
      : "";

  let avatar =
    "";

  if (person.avatar_url) {

    avatar =
      `
      <div class="friend-avatar">
        <img
          src="${escapeHTML(person.avatar_url)}"
          alt="${escapeHTML(name)}"
        >
      </div>
      `;

  } else {

    avatar =
      `
      <div class="friend-avatar">
        ${escapeHTML(
          getInitials(name)
        )}
      </div>
      `;

  }

  return `
    <div
      class="friend-result-card"
      data-user-id="${escapeHTML(person.id)}"
    >

      ${avatar}

      <div class="friend-result-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(username)}
        </p>

      </div>

      <button
        type="button"
        class="primary-btn"
        onclick="sendFriendRequest('${escapeJS(person.id)}')"
      >
        Add Friend
      </button>

    </div>
  `;

}


/* =========================================================
   15. SEND FRIEND REQUEST
   ========================================================= */

async function sendFriendRequest(
  receiverId
) {

  if (!currentUser) {

    openAuth();

    return;

  }

  if (
    !receiverId ||
    receiverId === currentUser.id
  ) {

    return;

  }

  try {

    const existing =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id, status, sender_id, receiver_id"
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

    if (existing.error) {

      console.error(
        "Existing request error:",
        existing.error
      );

    }

    const existingRow =
      (existing.data || [])[0];

    if (existingRow) {

      if (
        existingRow.status ===
        "accepted"
      ) {

        alert(
          "You are already friends."
        );

      } else if (
        existingRow.status ===
        "pending"
      ) {

        alert(
          "A friend request already exists."
        );

      } else {

        const retry =
          await supabaseClient
            .from("friend_requests")
            .update({
              status:
                "pending",
              sender_id:
                currentUser.id,
              receiver_id:
                receiverId
            })
            .eq(
              "id",
              existingRow.id
            );

        if (retry.error) {

          alert(
            retry.error.message
          );

        } else {

          alert(
            "Friend request sent!"
          );

        }

      }

      return;

    }

    const result =
      await supabaseClient
        .from("friend_requests")
        .insert({

          sender_id:
            currentUser.id,

          receiver_id:
            receiverId,

          status:
            "pending"

        });

    if (result.error) {

      alert(
        result.error.message
      );

      return;

    }

    alert(
      "Friend request sent!"
    );

  } catch (error) {

    console.error(
      "sendFriendRequest error:",
      error
    );

    alert(
      "Could not send friend request."
    );

  }

}


/* =========================================================
   16. LOAD FRIEND REQUESTS
   ========================================================= */

async function loadFriendRequests() {

  const badge =
    document.getElementById(
      "requestBadge"
    );

  if (!currentUser) {

    if (badge) {
      badge.textContent = "0";
    }

    return;

  }

  try {

    const result =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id, sender_id, receiver_id, status"
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        );

    if (result.error) {

      console.error(
        "Friend requests error:",
        result.error
      );

      return;

    }

    const count =
      (result.data || []).length;

    if (badge) {

      badge.textContent =
        String(count);

      badge.style.display =
        count > 0
          ? "inline-flex"
          : "none";

    }

    renderFriendRequests(
      result.data || []
    );

  } catch (error) {

    console.error(
      "loadFriendRequests error:",
      error
    );

  }

}


/* =========================================================
   17. RENDER FRIEND REQUESTS
   ========================================================= */

async function renderFriendRequests(
  requests
) {

  const container =
    document.getElementById(
      "friendRequests"
    );

  if (!container) {
    return;
  }

  if (!requests.length) {

    container.innerHTML =
      `
      <div class="empty-state">
        <div>📭</div>
        <h2>No Friend Requests</h2>
        <p>You don't have any pending requests.</p>
      </div>
      `;

    return;

  }

  const ids =
    requests.map(
      function (request) {
        return request.sender_id;
      }
    );

  const profilesResult =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username, full_name, avatar_url"
      )
      .in(
        "id",
        ids
      );

  const profiles =
    profilesResult.data || [];

  container.innerHTML =
    requests
      .map(
        function (request) {

          const sender =
            profiles.find(
              function (profile) {
                return (
                  profile.id ===
                  request.sender_id
                );
              }
            );

          return createRequestCard(
            request,
            sender
          );

        }
      )
      .join("");

}


/* =========================================================
   18. REQUEST CARD
   ========================================================= */

function createRequestCard(
  request,
  sender
) {

  const name =
    sender &&
    sender.full_name
      ? sender.full_name
      : sender &&
        sender.username
        ? sender.username
        : "YouRemo User";

  const username =
    sender &&
    sender.username
      ? "@" +
        sender.username
      : "";

  let avatar =
    "";

  if (
    sender &&
    sender.avatar_url
  ) {

    avatar =
      `
      <div class="friend-avatar">
        <img
          src="${escapeHTML(sender.avatar_url)}"
          alt="${escapeHTML(name)}"
        >
      </div>
      `;

  } else {

    avatar =
      `
      <div class="friend-avatar">
        ${escapeHTML(
          getInitials(name)
        )}
      </div>
      `;

  }

  return `
    <div class="friend-request-card">

      ${avatar}

      <div class="friend-result-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(username)}
        </p>

      </div>

      <div class="request-actions">

        <button
          type="button"
          class="primary-btn"
          onclick="acceptFriendRequest('${escapeJS(request.id)}')"
        >
          Accept
        </button>

        <button
          type="button"
          class="secondary-btn"
          onclick="declineFriendRequest('${escapeJS(request.id)}')"
        >
          Decline
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   19. ACCEPT FRIEND REQUEST
   ========================================================= */

async function acceptFriendRequest(
  requestId
) {

  if (!currentUser) {
    return;
  }

  try {

    const requestResult =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id, sender_id, receiver_id, status"
        )
        .eq(
          "id",
          requestId
        )
        .maybeSingle();

    if (requestResult.error) {

      alert(
        requestResult.error.message
      );

      return;

    }

    const request =
      requestResult.data;

    if (!request) {

      alert(
        "Friend request not found."
      );

      return;

    }

    const updateResult =
      await supabaseClient
        .from("friend_requests")
        .update({
          status:
            "accepted"
        })
        .eq(
          "id",
          requestId
        );

    if (updateResult.error) {

      alert(
        updateResult.error.message
      );

      return;

    }

    const friendshipResult =
      await supabaseClient
        .from("friendships")
        .insert([

          {
            user_id:
              request.sender_id,

            friend_id:
              request.receiver_id
          }

        ]);

    if (
      friendshipResult.error &&
      !String(
        friendshipResult.error.message
      ).toLowerCase()
        .includes("duplicate")
    ) {

      console.error(
        "Friendship creation error:",
        friendshipResult.error
      );

    }

    alert(
      "Friend request accepted!"
    );

    await loadFriendRequests();
    await loadMyFriends();

    if (
      getCurrentPage() ===
      "messages.html"
    ) {

      await loadMessageFriends();

    }

  } catch (error) {

    console.error(
      "acceptFriendRequest error:",
      error
    );

    alert(
      "Could not accept friend request."
    );

  }

}


/* =========================================================
   20. DECLINE FRIEND REQUEST
   ========================================================= */

async function declineFriendRequest(
  requestId
) {

  if (!currentUser) {
    return;
  }

  try {

    const result =
      await supabaseClient
        .from("friend_requests")
        .update({
          status:
            "declined"
        })
        .eq(
          "id",
          requestId
        )
        .eq(
          "receiver_id",
          currentUser.id
        );

    if (result.error) {

      alert(
        result.error.message
      );

      return;

    }

    await loadFriendRequests();

  } catch (error) {

    console.error(
      "declineFriendRequest error:",
      error
    );

    alert(
      "Could not decline request."
    );

  }

}


/* =========================================================
   21. LOAD MY FRIENDS
   ========================================================= */

async function loadMyFriends() {

  const container =
    document.getElementById(
      "friendsList"
    );

  if (!currentUser) {

    if (container) {

      container.innerHTML =
        `
        <div class="empty-state">
          <div>🔐</div>
          <h2>Login Required</h2>
          <p>Please login to see your friends.</p>
        </div>
        `;

    }

    return;

  }

  try {

    const result =
      await supabaseClient
        .from("friendships")
        .select(
          "id, user_id, friend_id"
        )
        .or(
          "user_id.eq." +
          currentUser.id +
          ",friend_id.eq." +
          currentUser.id
        );

    if (result.error) {

      console.error(
        "Load friends error:",
        result.error
      );

      return;

    }

    const friendIds =
      [];

    (
      result.data || []
    ).forEach(
      function (friendship) {

        if (
          friendship.user_id ===
          currentUser.id
        ) {

          friendIds.push(
            friendship.friend_id
          );

        } else {

          friendIds.push(
            friendship.user_id
          );

        }

      }
    );

    const uniqueIds =
      Array.from(
        new Set(friendIds)
      );

    if (!uniqueIds.length) {

      if (container) {

        container.innerHTML =
          `
          <div class="empty-state">
            <div>👥</div>
            <h2>No Friends Yet</h2>
            <p>Search for people and send friend requests.</p>
          </div>
          `;

      }

      return;

    }

    const profilesResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .in(
          "id",
          uniqueIds
        );

    if (profilesResult.error) {

      console.error(
        "Friends profiles error:",
        profilesResult.error
      );

      return;

    }

    if (container) {

      container.innerHTML =
        (
          profilesResult.data || []
        )
          .map(
            function (friend) {

              return createMyFriendCard(
                friend
              );

            }
          )
          .join("");

    }

  } catch (error) {

    console.error(
      "loadMyFriends error:",
      error
    );

  }

}


/* =========================================================
   22. MY FRIEND CARD
   ========================================================= */

function createMyFriendCard(
  friend
) {

  const name =
    friend.full_name ||
    friend.username ||
    "YouRemo User";

  const username =
    friend.username
      ? "@" +
        friend.username
      : "";

  const avatar =
    friend.avatar_url
      ? `
        <div class="friend-avatar">
          <img
            src="${escapeHTML(friend.avatar_url)}"
            alt="${escapeHTML(name)}"
          >
        </div>
        `
      : `
        <div class="friend-avatar">
          ${escapeHTML(
            getInitials(name)
          )}
        </div>
        `;

  return `
    <div class="friend-card">

      ${avatar}

      <div class="friend-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(username)}
        </p>

      </div>

      <button
        type="button"
        class="primary-btn"
        onclick="messageFriend('${escapeJS(friend.id)}')"
      >
        Message
      </button>

    </div>
  `;

}


function messageFriend(
  friendId
) {

  if (!currentUser) {

    openAuth();

    return;

  }

  window.location.href =
    "messages.html?friend=" +
    encodeURIComponent(
      friendId
    );

}


/* =========================================================
   23. MESSAGE PAGE SEARCH
   ========================================================= */

function setupMessagePageSearch() {

  const input =
    document.getElementById(
      "messageFriendSearch"
    );

  if (!input) {
    return;
  }

  input.addEventListener(
    "input",
    function () {

      renderMessageFriends(
        input.value
      );

    }
  );

}


/* =========================================================
   24. MESSAGE INPUT
   ========================================================= */

function setupMessageInput() {

  const input =
    document.getElementById(
      "messageInput"
    );

  if (!input) {
    return;
  }

  input.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );

}


/* =========================================================
   25. LOAD MESSAGE FRIENDS
   ========================================================= */

async function loadMessageFriends() {

  if (!window.supabaseClient) {
    return;
  }

  if (!currentUser) {

    const list =
      document.getElementById(
        "conversationList"
      );

    if (list) {

      list.innerHTML =
        `
        <div class="empty-state">
          <div>🔐</div>
          <h2>Login Required</h2>
          <p>Please login to see your conversations.</p>
        </div>
        `;

    }

    return;

  }

  try {

    const result =
      await supabaseClient
        .from("friendships")
        .select(
          "id, user_id, friend_id"
        )
        .or(
          "user_id.eq." +
          currentUser.id +
          ",friend_id.eq." +
          currentUser.id
        );

    if (result.error) {

      console.error(
        "Message friends error:",
        result.error
      );

      return;

    }

    const friendIds =
      [];

    (
      result.data || []
    ).forEach(
      function (friendship) {

        if (
          friendship.user_id ===
          currentUser.id
        ) {

          friendIds.push(
            friendship.friend_id
          );

        } else {

          friendIds.push(
            friendship.user_id
          );

        }

      }
    );

    const uniqueIds =
      Array.from(
        new Set(friendIds)
      );

    if (!uniqueIds.length) {

      messageFriends = [];

      renderMessageFriends();

      return;

    }

    const profilesResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .in(
          "id",
          uniqueIds
        );

    if (profilesResult.error) {

      console.error(
        "Message friend profiles error:",
        profilesResult.error
      );

      return;

    }

    messageFriends =
      profilesResult.data || [];

    renderMessageFriends();

    selectFriendFromURL();

  } catch (error) {

    console.error(
      "loadMessageFriends error:",
      error
    );

  }

}


/* =========================================================
   26. RENDER MESSAGE FRIENDS
   ========================================================= */

function renderMessageFriends(
  searchTerm = ""
) {

  const list =
    document.getElementById(
      "conversationList"
    );

  if (!list) {
    return;
  }

  const term =
    searchTerm
      .trim()
      .toLowerCase();

  let friends =
    messageFriends;

  if (term) {

    friends =
      messageFriends.filter(
        function (friend) {

          const name =
            (
              friend.full_name ||
              ""
            ).toLowerCase();

          const username =
            (
              friend.username ||
              ""
            ).toLowerCase();

          return (
            name.includes(term) ||
            username.includes(term)
          );

        }
      );

  }

  if (!friends.length) {

    list.innerHTML =
      `
      <div class="empty-state">
        <div>👥</div>
        <h2>No Friends</h2>
        <p>Add friends first to start chatting.</p>
      </div>
      `;

    return;

  }

  list.innerHTML =
    friends
      .map(
        function (friend) {

          return createConversationCard(
            friend
          );

        }
      )
      .join("");

}


/* =========================================================
   27. CREATE CONVERSATION CARD
   ========================================================= */

function createConversationCard(
  friend
) {

  const name =
    friend.full_name ||
    friend.username ||
    "YouRemo User";

  const username =
    friend.username
      ? "@" +
        friend.username
      : "";

  let avatarHTML =
    "";

  if (
    friend.avatar_url
  ) {

    avatarHTML =
      `
      <div class="conversation-avatar">

        <img
          src="${escapeHTML(friend.avatar_url)}"
          alt="${escapeHTML(name)}"
        >

      </div>
      `;

  } else {

    avatarHTML =
      `
      <div class="conversation-avatar">
        ${escapeHTML(
          getInitials(name)
        )}
      </div>
      `;

  }

  return `
    <button
      type="button"
      class="conversation-card"
      data-friend-id="${escapeHTML(friend.id)}"
      onclick="selectMessageFriend('${escapeJS(friend.id)}')"
    >

      ${avatarHTML}

      <div class="conversation-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(username)}
        </p>

      </div>

    </button>
  `;

}


/* =========================================================
   28. SELECT MESSAGE FRIEND
   ========================================================= */

async function selectMessageFriend(
  friendId
) {

  const friend =
    messageFriends.find(
      function (item) {

        return (
          item.id ===
          friendId
        );

      }
    );

  if (!friend) {
    return;
  }

  setSelectedMessageFriend(
    friend
  );

  const name =
    friend.full_name ||
    friend.username ||
    "YouRemo User";

  const username =
    friend.username
      ? "@" +
        friend.username
      : "";

  setText(
    "chatFriendName",
    name
  );

  setText(
    "chatFriendUsername",
    username
  );

  updateAvatarElement(
    "chatFriendAvatar",
    friend.avatar_url || "",
    name
  );

  document
    .querySelectorAll(
      ".conversation-card"
    )
    .forEach(
      function (card) {

        card.classList.remove(
          "selected"
        );

      }
    );

  const selectedCard =
    document.querySelector(
      '.conversation-card[data-friend-id="' +
      CSS.escape(friendId) +
      '"]'
    );

  if (selectedCard) {

    selectedCard.classList.add(
      "selected"
    );

  }

  await loadConversationMessages(
    friendId
  );

}


/* =========================================================
   29. SELECTED MESSAGE FRIEND
   ========================================================= */

function setSelectedMessageFriend(
  friend
) {

  selectedMessageFriend =
    friend;

  window.selectedMessageFriend =
    friend;

}


function getSelectedMessageFriend() {

  return (
    selectedMessageFriend ||
    window.selectedMessageFriend ||
    null
  );

}


/* =========================================================
   30. LOAD CONVERSATION MESSAGES
   ========================================================= */

async function loadConversationMessages(
  friendId
) {

  const chat =
    document.getElementById(
      "chatMessages"
    );

  if (
    !chat ||
    !currentUser
  ) {

    return;

  }

  chat.innerHTML =
    `
    <div class="empty-state">
      <div>⏳</div>
      <p>Loading messages...</p>
    </div>
    `;

  try {

    const result =
      await supabaseClient
        .from("messages")
        .select(
          "id, sender_id, receiver_id, message, created_at, seen"
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
            ascending:
              true
          }
        );

    if (result.error) {

      console.error(
        "Load messages error:",
        result.error
      );

      chat.innerHTML =
        `
        <div class="empty-state">
          <div>⚠️</div>
          <h2>Unable to load messages</h2>
          <p>${escapeHTML(
            result.error.message
          )}</p>
        </div>
        `;

      return;

    }

    const messages =
      result.data || [];

    chat.innerHTML =
      "";

    if (!messages.length) {

      chat.innerHTML =
        `
        <div class="empty-state">
          <div>💬</div>
          <h2>Start a Conversation</h2>
          <p>Send your first message.</p>
        </div>
        `;

      return;

    }

    messages.forEach(
      function (message) {

        appendRealtimeMessage(
          message
        );

      }
    );

    chat.scrollTop =
      chat.scrollHeight;

    const unseenIds =
      messages
        .filter(
          function (message) {

            return (
              message.receiver_id ===
              currentUser.id &&
              message.seen !== true
            );

          }
        )
        .map(
          function (message) {

            return message.id;

          }
        );

    if (unseenIds.length) {

      await supabaseClient
        .from("messages")
        .update({
          seen: true
        })
        .in(
          "id",
          unseenIds
        )
        .eq(
          "receiver_id",
          currentUser.id
        );

    }

  } catch (error) {

    console.error(
      "loadConversationMessages error:",
      error
    );

  }

}


/* =========================================================
   31. SEND MESSAGE
   ========================================================= */

async function sendMessage() {

  if (!currentUser) {

    openAuth();

    return;

  }

  const friend =
    getSelectedMessageFriend();

  if (!friend) {

    alert(
      "Please select a friend first."
    );

    return;

  }

  const input =
    document.getElementById(
      "messageInput"
    );

  if (!input) {
    return;
  }

  const messageText =
    input.value.trim();

  if (!messageText) {
    return;
  }

  const button =
    document.getElementById(
      "sendMessageButton"
    );

  if (button) {
    button.disabled =
      true;
  }

  try {

    const result =
      await supabaseClient
        .from("messages")
        .insert({

          sender_id:
            currentUser.id,

          receiver_id:
            friend.id,

          message:
            messageText,

          seen:
            false

        })
        .select()
        .single();

    if (result.error) {

      console.error(
        "Send message error:",
        result.error
      );

      alert(
        result.error.message
      );

      return;

    }

    appendRealtimeMessage(
      result.data
    );

    input.value =
      "";

    input.focus();

  } catch (error) {

    console.error(
      "sendMessage error:",
      error
    );

    alert(
      "Could not send message."
    );

  } finally {

    if (button) {

      button.disabled =
        false;

    }

  }

}


/* =========================================================
   32. APPEND MESSAGE
   ========================================================= */

function appendRealtimeMessage(
  message
) {

  const chat =
    document.getElementById(
      "chatMessages"
    );

  if (!chat || !message) {
    return;
  }

  const friend =
    getSelectedMessageFriend();

  if (
    friend &&
    !(
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
      )
    )
  ) {

    return;

  }

  const existing =
    chat.querySelector(
      '[data-message-id="' +
      CSS.escape(
        String(message.id)
      ) +
      '"]'
    );

  if (existing) {
    return;
  }

  const isMine =
    message.sender_id ===
    currentUser.id;

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    isMine
      ? "message-bubble-wrapper sent"
      : "message-bubble-wrapper received";

  wrapper.dataset.messageId =
    String(message.id);

  const bubble =
    document.createElement(
      "div"
    );

  bubble.className =
    "message-bubble";

  bubble.textContent =
    message.message || "";

  wrapper.appendChild(
    bubble
  );

  if (isMine) {

    const seen =
      document.createElement(
        "span"
      );

    seen.className =
      "message-seen";

    seen.textContent =
      message.seen
        ? "Seen"
        : "Sent";

    wrapper.appendChild(
      seen
    );

  }

  chat.appendChild(
    wrapper
  );

  chat.scrollTop =
    chat.scrollHeight;

}


/* =========================================================
   33. REALTIME MESSAGES
   ========================================================= */

function startMessageRealtime() {

  if (!currentUser) {
    return;
  }

  if (
    getCurrentPage() !==
    "messages.html"
  ) {

    return;

  }

  stopMessageRealtime();

  messageRealtimeChannel =
    supabaseClient
      .channel(
        "messages-" +
        currentUser.id
      )
      .on(
        "postgres_changes",
        {
          event:
            "INSERT",
          schema:
            "public",
          table:
            "messages"
        },
        function (payload) {

          const message =
            payload.new;

          if (!message) {
            return;
          }

          if (
            message.sender_id ===
              currentUser.id ||
            message.receiver_id ===
              currentUser.id
          ) {

            appendRealtimeMessage(
              message
            );

          }

        }
      )
      .on(
        "postgres_changes",
        {
          event:
            "UPDATE",
          schema:
            "public",
          table:
            "messages"
        },
        function (payload) {

          const message =
            payload.new;

          if (message) {

            updateMessageSeen(
              message.id
            );

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

}


function stopMessageRealtime() {

  if (
    messageRealtimeChannel
  ) {

    try {

      supabaseClient.removeChannel(
        messageRealtimeChannel
      );

    } catch (error) {

      console.error(
        "Realtime cleanup error:",
        error
      );

    }

    messageRealtimeChannel =
      null;

  }

}


/* =========================================================
   34. UPDATE MESSAGE SEEN
   ========================================================= */

function updateMessageSeen(
  messageId
) {

  const messageElement =
    document.querySelector(
      '[data-message-id="' +
      CSS.escape(
        String(messageId)
      ) +
      '"]'
    );

  if (!messageElement) {
    return;
  }

  const seenElement =
    messageElement.querySelector(
      ".message-seen"
    );

  if (seenElement) {

    seenElement.textContent =
      "Seen";

  }

}


/* =========================================================
   35. PROFILE
   ========================================================= */

async function loadProfile() {

  if (!currentUser) {
    return null;
  }

  try {

    const result =
      await supabaseClient
        .from("profiles")
        .select(
          "*"
        )
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();

    if (result.error) {

      console.error(
        "loadProfile error:",
        result.error
      );

      return null;

    }

    const profile =
      result.data;

    if (!profile) {
      return null;
    }

    setText(
      "profileName",
      profile.full_name ||
      profile.username ||
      "YouRemo User"
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
      profile.bio ||
      ""
    );

    updateAvatarElement(
      "profileAvatar",
      profile.avatar_url ||
      "",
      profile.full_name ||
      profile.username ||
      ""
    );

    setValue(
      "profileFullName",
      profile.full_name ||
      ""
    );

    setValue(
      "profileUsername",
      profile.username ||
      ""
    );

    setValue(
      "profileBio",
      profile.bio ||
      ""
    );

    return profile;

  } catch (error) {

    console.error(
      "loadProfile error:",
      error
    );

    return null;

  }

}


/* =========================================================
   36. SAVE PROFILE
   ========================================================= */

async function saveProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }

  const fullName =
    document.getElementById(
      "profileFullName"
    )?.value.trim() || "";

  const username =
    document.getElementById(
      "profileUsername"
    )?.value.trim() || "";

  const bio =
    document.getElementById(
      "profileBio"
    )?.value.trim() || "";

  if (!fullName) {

    alert(
      "Please enter your full name."
    );

    return;

  }

  if (!username) {

    alert(
      "Please enter a username."
    );

    return;

  }

  try {

    const usernameCheck =
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

    if (
      usernameCheck.data
    ) {

      alert(
        "That username is already taken."
      );

      return;

    }

    const result =
      await supabaseClient
        .from("profiles")
        .update({

          full_name:
            fullName,

          username:
            username,

          bio:
            bio

        })
        .eq(
          "id",
          currentUser.id
        );

    if (result.error) {

      alert(
        result.error.message
      );

      return;

    }

    await loadProfile();

    await refreshAccountUI();

    alert(
      "Profile updated successfully!"
    );

  } catch (error) {

    console.error(
      "saveProfile error:",
      error
    );

    alert(
      "Could not update profile."
    );

  }

}


/* =========================================================
   37. AVATAR UPLOAD
   ========================================================= */

function setupAvatarUpload() {

  const input =
    document.getElementById(
      "avatarInput"
    );

  if (!input) {
    return;
  }

  input.addEventListener(
    "change",
    async function () {

      if (
        !input.files ||
        !input.files[0]
      ) {

        return;

      }

      await uploadAvatar(
        input.files[0]
      );

    }
  );

}


async function uploadAvatar(
  file
) {

  if (!currentUser) {

    openAuth();

    return;

  }

  if (!file) {
    return;
  }

  try {

    const extension =
      file.name.includes(".")
        ? file.name
            .split(".")
            .pop()
        : "jpg";

    const path =
      currentUser.id +
      "/" +
      Date.now() +
      "." +
      extension;

    const uploadResult =
      await supabaseClient
        .storage
        .from("avatars")
        .upload(
          path,
          file,
          {
            upsert:
              true
          }
        );

    if (uploadResult.error) {

      alert(
        uploadResult.error.message
      );

      return;

    }

    const publicResult =
      supabaseClient
        .storage
        .from("avatars")
        .getPublicUrl(
          path
        );

    const avatarUrl =
      publicResult.data
        .publicUrl;

    const profileResult =
      await supabaseClient
        .from("profiles")
        .update({
          avatar_url:
            avatarUrl
        })
        .eq(
          "id",
          currentUser.id
        );

    if (profileResult.error) {

      alert(
        profileResult.error.message
      );

      return;

    }

    await loadProfile();

    await refreshAccountUI();

    alert(
      "Profile photo updated!"
    );

  } catch (error) {

    console.error(
      "uploadAvatar error:",
      error
    );

    alert(
      "Could not upload profile photo."
    );

  }

}


/* =========================================================
   38. PROFILE PAGE SETUP
   ========================================================= */

function setupProfilePage() {

  const form =
    document.getElementById(
      "profileForm"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    function (event) {

      event.preventDefault();

      saveProfile();

    }
  );

}


/* =========================================================
   39. SEARCH ENTER KEY
   ========================================================= */

function setupSearchEnterKey() {

  const input =
    document.getElementById(
      "friendSearch"
    );

  if (!input) {
    return;
  }

  input.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        searchFriends();

      }

    }
  );

}


/* =========================================================
   40. PAGE SPECIFIC FEATURES
   ========================================================= */

function setupPageSpecificFeatures() {

  const page =
    getCurrentPage();

  if (
    page ===
    "friends.html"
  ) {

    loadFriendRequests();

    loadMyFriends();

  }

  if (
    page ===
    "messages.html"
  ) {

    loadMessageFriends();

  }

  if (
    page ===
    "profile.html"
  ) {

    loadProfile();

  }

}


/* =========================================================
   41. URL MESSAGE FRIEND
   ========================================================= */

function selectFriendFromURL() {

  if (
    getCurrentPage() !==
    "messages.html"
  ) {

    return;

  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const friendId =
    params.get(
      "friend"
    );

  if (!friendId) {
    return;
  }

  const friend =
    messageFriends.find(
      function (item) {

        return (
          item.id ===
          friendId
        );

      }
    );

  if (friend) {

    selectMessageFriend(
      friendId
    );

  }

}


/* =========================================================
   42. GLOBAL EXPORTS
   ========================================================= */

window.currentUser =
  currentUser;

window.handleAccountClick =
  handleAccountClick;

window.openAuth =
  openAuth;

window.closeAuth =
  closeAuth;

window.showLogin =
  showLogin;

window.showSignup =
  showSignup;

window.login =
  login;

window.signUp =
  signUp;

window.logout =
  logout;

window.goHome =
  goHome;

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

window.acceptFriendRequest =
  acceptFriendRequest;

window.declineFriendRequest =
  declineFriendRequest;

window.loadFriendRequests =
  loadFriendRequests;

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

window.loadConversationMessages =
  loadConversationMessages;

window.sendMessage =
  sendMessage;

window.updateMessageSeen =
  updateMessageSeen;

window.saveProfile =
  saveProfile;

window.uploadAvatar =
  uploadAvatar;

window.startMessageRealtime =
  startMessageRealtime;

window.stopMessageRealtime =
  stopMessageRealtime;

window.refreshAccountUI =
  refreshAccountUI;

window.loadProfile =
  loadProfile;

console.log(
  "YouRemo script.js ready."
);
```
