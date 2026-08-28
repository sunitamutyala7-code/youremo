```javascript
/* =========================================================
   YOUREMO - COMPLETE SCRIPT.JS
   CLEAN REPLACEMENT
   =========================================================

   Pages:
   - index.html
   - friends.html
   - messages.html
   - profile.html

   Supabase:
   - Authentication
   - Profiles
   - Friends
   - Friend Requests
   - Messages
   - Realtime Messaging

   IMPORTANT:
   This file is designed to be loaded AFTER the Supabase
   CDN script in each HTML page.
   ========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
   ========================================================= */

const SUPABASE_URL =
  "https://ykqnqdtekbxnevtjjkbd.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";


let supabaseClient = null;


if (
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {

  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

} else {

  console.error(
    "Supabase library was not loaded."
  );

}


/* =========================================================
   2. GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;

let currentProfile = null;

let selectedMessageFriend = null;

let messageRealtimeChannel = null;

let messageFriends = [];


/* =========================================================
   3. PAGE DETECTION
   ========================================================= */

function getCurrentPage() {

  let path =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  if (!path) {
    path = "index.html";
  }

  return path;
}


/* =========================================================
   4. DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "================================="
    );

    console.log(
      "YouRemo script.js loaded"
    );

    console.log(
      "Current page:",
      getCurrentPage()
    );

    console.log(
      "================================="
    );


    if (!supabaseClient) {
      return;
    }


    await loadCurrentUser();


    setupAvatarUpload();

    setupProfilePage();

    setupSearchEnterKey();

    setupMessagePage();

    setupPageSpecificFeatures();

  }
);


/* =========================================================
   5. PAGE SPECIFIC FEATURES
   ========================================================= */

function setupPageSpecificFeatures() {

  const page =
    getCurrentPage();


  /* -------------------------------------------------------
     HOME
     ------------------------------------------------------- */

  if (
    page === "index.html"
  ) {

    console.log(
      "Home page initialized."
    );

  }


  /* -------------------------------------------------------
     FRIENDS
     ------------------------------------------------------- */

  if (
    page === "friends.html"
  ) {

    console.log(
      "Friends page initialized."
    );


    if (currentUser) {

      loadFriendRequests();

      loadMyFriends();

    }

  }


  /* -------------------------------------------------------
     PROFILE
     ------------------------------------------------------- */

  if (
    page === "profile.html"
  ) {

    console.log(
      "Profile page initialized."
    );


    if (currentUser) {

      loadProfile();

    }

  }


  /* -------------------------------------------------------
     MESSAGES
     ------------------------------------------------------- */

  if (
    page === "messages.html"
  ) {

    console.log(
      "Messages page initialized."
    );


    if (currentUser) {

      loadMessageFriends();

      startMessageRealtime();

    }

  }

}


/* =========================================================
   6. LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

  if (!supabaseClient) {
    return;
  }


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


    console.log(
      "Current user:",
      currentUser
    );


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
   7. AUTH STATE CHANGE
   ========================================================= */

if (supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    function (
      event,
      session
    ) {

      console.log(
        "Auth event:",
        event
      );


      currentUser =
        session &&
        session.user
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
        100
      );

    }
  );

}


/* =========================================================
   8. ACCOUNT UI
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


  const requestBadge =
    document.getElementById(
      "requestBadge"
    );


  if (!loginButton) {
    return;
  }


  /* -------------------------------------------------------
     LOGGED OUT
     ------------------------------------------------------- */

  if (!currentUser) {

    loginButton.textContent =
      "Login";


    if (navAvatar) {

      navAvatar.style.backgroundImage =
        "none";

      navAvatar.textContent =
        "👤";

    }


    if (accountMenu) {

      accountMenu.style.display =
        "none";

    }


    if (requestBadge) {

      requestBadge.textContent =
        "0";

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

      profile =
        result.data;

    }

  } catch (error) {

    console.error(
      "Account profile error:",
      error
    );

  }


  currentProfile =
    profile;


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

    navAvatar.style.backgroundImage =
      "none";

    navAvatar.textContent =
      "";


    if (
      profile &&
      profile.avatar_url
    ) {

      navAvatar.style.backgroundImage =
        "url('" +
        profile.avatar_url +
        "')";

      navAvatar.style.backgroundSize =
        "cover";

      navAvatar.style.backgroundPosition =
        "center";

      navAvatar.style.backgroundRepeat =
        "no-repeat";

    } else {

      navAvatar.textContent =
        getInitials(
          displayName
        );

    }

  }


  if (
    requestBadge &&
    currentUser
  ) {

    updateRequestBadge();

  }

}


/* =========================================================
   9. ACCOUNT BUTTON
   ========================================================= */

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


  const isOpen =
    menu.style.display ===
    "block";


  menu.style.display =
    isOpen
      ? "none"
      : "block";

}


/* =========================================================
   10. CLOSE ACCOUNT MENU WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {

    const menu =
      document.getElementById(
        "accountMenu"
      );


    const button =
      document.getElementById(
        "accountButton"
      );


    if (
      !menu ||
      !button
    ) {
      return;
    }


    if (
      !button.contains(event.target) &&
      !menu.contains(event.target)
    ) {

      menu.style.display =
        "none";

    }

  }
);


/* =========================================================
   11. OPEN AUTH
   ========================================================= */

function openAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );


  if (!modal) {

    console.warn(
      "authModal not found."
    );

    return;

  }


  modal.style.display =
    "flex";


  showLogin();

}


/* =========================================================
   12. CLOSE AUTH
   ========================================================= */

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


/* =========================================================
   13. SHOW LOGIN
   ========================================================= */

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


/* =========================================================
   14. SHOW SIGNUP
   ========================================================= */

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


/* =========================================================
   15. SIGN UP
   ========================================================= */

async function signUp() {

  const nameElement =
    document.getElementById(
      "authName"
    );


  const usernameElement =
    document.getElementById(
      "authUsername"
    );


  const emailElement =
    document.getElementById(
      "authEmail"
    );


  const passwordElement =
    document.getElementById(
      "authPassword"
    );


  const name =
    nameElement
      ? nameElement.value.trim()
      : "";


  const username =
    usernameElement
      ? usernameElement.value.trim()
      : "";


  const email =
    emailElement
      ? emailElement.value.trim()
      : "";


  const password =
    passwordElement
      ? passwordElement.value
      : "";


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


  if (
    password.length < 6
  ) {

    alert(
      "Password must be at least 6 characters."
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

    await loadCurrentUser();


  } catch (error) {

    console.error(
      "Signup error:",
      error
    );


    alert(
      "Something went wrong while creating your account."
    );

  }

}


/* =========================================================
   16. LOGIN
   ========================================================= */

async function login() {

  const emailElement =
    document.getElementById(
      "authEmail"
    );


  const passwordElement =
    document.getElementById(
      "authPassword"
    );


  const email =
    emailElement
      ? emailElement.value.trim()
      : "";


  const password =
    passwordElement
      ? passwordElement.value
      : "";


  if (
    !email ||
    !password
  ) {

    alert(
      "Please enter your email and password."
    );

    return;

  }


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
      result.data.user;


    closeAuth();

    clearAuthForm();


    await refreshAccountUI();

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


    console.log(
      "Login successful."
    );


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    alert(
      "Login failed."
    );

  }

}


/* =========================================================
   17. LOGOUT
   ========================================================= */

async function logout() {

  try {

    stopMessageRealtime();


    const result =
      await supabaseClient.auth
        .signOut();


    if (result.error) {

      alert(
        result.error.message
      );

      return;

    }


    currentUser =
      null;

    currentProfile =
      null;

    selectedMessageFriend =
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

  }

}


/* =========================================================
   18. CLEAR AUTH FORM
   ========================================================= */

function clearAuthForm() {

  const ids = [

    "authName",

    "authUsername",

    "authEmail",

    "authPassword"

  ];


  ids.forEach(
    function (id) {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.value =
          "";

      }

    }
  );

}


/* =========================================================
   19. FIND FRIENDS
   ========================================================= */

function findFriends() {

  const section =
    document.getElementById(
      "friends"
    );


  if (section) {

    section.scrollIntoView({

      behavior:
        "smooth"

    });


    const input =
      document.getElementById(
        "friendSearch"
      );


    if (input) {

      setTimeout(
        function () {

          input.focus();

        },
        400
      );

    }


    return;

  }


  window.location.href =
    "friends.html";

}


/* =========================================================
   20. LEARN MORE
   ========================================================= */

function learnMore() {

  const about =
    document.getElementById(
      "about"
    );


  if (about) {

    about.scrollIntoView({

      behavior:
        "smooth"

    });

  }

}


/* =========================================================
   21. SEARCH FRIENDS
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


  if (
    !input ||
    !results
  ) {

    return;

  }


  const searchTerm =
    input.value.trim();


  if (!searchTerm) {

    results.innerHTML =
      `
      <div class="empty-state">
        <div>👥</div>
        <h2>Find Friends</h2>
        <p>
          Enter a name or username to find people on YouRemo.
        </p>
      </div>
      `;

    return;

  }


  if (!currentUser) {

    openAuth();

    return;

  }


  results.innerHTML =
    `
    <div class="empty-state">
      <div>🔎</div>
      <p>Searching...</p>
    </div>
    `;


  try {

    const nameResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .ilike(
          "full_name",
          "%" +
          searchTerm +
          "%"
        )
        .limit(20);


    const usernameResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .ilike(
          "username",
          "%" +
          searchTerm +
          "%"
        )
        .limit(20);


    const combined =
      [
        ...(nameResult.data || []),
        ...(usernameResult.data || [])
      ];


    const unique =
      Array.from(
        new Map(
          combined.map(
            function (user) {

              return [
                user.id,
                user
              ];

            }
          )
        ).values()
      )
      .filter(
        function (user) {

          return (
            user.id !==
            currentUser.id
          );

        }
      );


    if (!unique.length) {

      results.innerHTML =
        `
        <div class="empty-state">
          <div>🔍</div>
          <h2>No People Found</h2>
          <p>
            Try another name or username.
          </p>
        </div>
        `;

      return;

    }


    results.innerHTML =
      unique
        .map(
          function (user) {

            return createSearchResultCard(
              user
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
      `
      <div class="empty-state">
        <div>⚠️</div>
        <p>Unable to search right now.</p>
      </div>
      `;

  }

}


/* =========================================================
   22. CREATE SEARCH RESULT CARD
   ========================================================= */

function createSearchResultCard(
  user
) {

  const name =
    user.full_name ||
    user.username ||
    "YouRemo User";


  const username =
    user.username
      ? "@" +
        user.username
      : "";


  let avatar =
    "";


  if (
    user.avatar_url
  ) {

    avatar =
      `
      <div class="friend-avatar">
        <img
          src="${escapeHTML(user.avatar_url)}"
          alt="${escapeHTML(name)}"
          class="friend-avatar-img"
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

      <div class="friend-card-actions">

        <button
          type="button"
          class="primary-btn"
          onclick="sendFriendRequest('${escapeJS(user.id)}')"
        >
          Add Friend
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   23. SEND FRIEND REQUEST
   ========================================================= */

async function sendFriendRequest(
  receiverId
) {

  if (!currentUser) {

    openAuth();

    return;

  }


  if (
    receiverId ===
    currentUser.id
  ) {

    alert(
      "You cannot add yourself."
    );

    return;

  }


  try {

    const existing =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id, sender_id, receiver_id, status"
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


    if (
      existing.error
    ) {

      console.error(
        existing.error
      );

    } else {

      const rows =
        existing.data || [];


      const alreadyFriends =
        await areFriends(
          currentUser.id,
          receiverId
        );


      if (alreadyFriends) {

        alert(
          "You are already friends."
        );

        return;

      }


      const pending =
        rows.find(
          function (row) {

            return (
              row.status ===
              "pending"
            );

          }
        );


      if (pending) {

        alert(
          "A friend request already exists."
        );

        return;

      }

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

      console.error(
        "Send friend request error:",
        result.error
      );


      alert(
        result.error.message
      );

      return;

    }


    alert(
      "Friend request sent!"
    );


    await searchFriends();


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
   24. LOAD FRIEND REQUESTS
   ========================================================= */

async function loadFriendRequests() {

  const container =
    document.getElementById(
      "friendRequestsList"
    );


  const badge =
    document.getElementById(
      "requestBadge"
    );


  if (!container) {

    if (badge && currentUser) {
      await updateRequestBadge();
    }

    return;

  }


  if (!currentUser) {

    container.innerHTML =
      `
      <div class="empty-state">
        <div>🔐</div>
        <h2>Login Required</h2>
        <p>
          Please login to see your friend requests.
        </p>
      </div>
      `;


    if (badge) {

      badge.textContent =
        "0";

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
        "Friend request loading error:",
        result.error
      );

      return;

    }


    const requests =
      result.data || [];


    if (badge) {

      badge.textContent =
        String(
          requests.length
        );

    }


    if (!requests.length) {

      container.innerHTML =
        `
        <div class="empty-state">
          <div>📭</div>
          <h2>No Friend Requests</h2>
          <p>
            You don't have any pending requests.
          </p>
        </div>
        `;

      return;

    }


    const senderIds =
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
          senderIds
        );


    const profileMap =
      new Map();


    (
      profilesResult.data ||
      []
    ).forEach(
      function (profile) {

        profileMap.set(
          profile.id,
          profile
        );

      }
    );


    container.innerHTML =
      requests
        .map(
          function (request) {

            return createRequestCard(
              request,
              profileMap.get(
                request.sender_id
              )
            );

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "loadFriendRequests error:",
      error
    );

  }

}


/* =========================================================
   25. UPDATE REQUEST BADGE
   ========================================================= */

async function updateRequestBadge() {

  const badge =
    document.getElementById(
      "requestBadge"
    );


  if (!badge) {
    return;
  }


  if (!currentUser) {

    badge.textContent =
      "0";

    return;

  }


  try {

    const result =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id",
          {
            count:
              "exact",
            head:
              true
          }
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
        "Request badge error:",
        result.error
      );

      return;

    }


    badge.textContent =
      String(
        result.count || 0
      );


  } catch (error) {

    console.error(
      "updateRequestBadge error:",
      error
    );

  }

}


/* =========================================================
   26. CREATE REQUEST CARD
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


  let avatarHTML =
    "";


  if (
    sender &&
    sender.avatar_url
  ) {

    avatarHTML =
      `
      <div class="friend-avatar">

        <img
          src="${escapeHTML(sender.avatar_url)}"
          alt="${escapeHTML(name)}"
          class="friend-avatar-img"
        >

      </div>
      `;

  } else {

    avatarHTML =
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
      class="friend-card"
      data-request-id="${escapeHTML(request.id)}"
    >

      ${avatarHTML}

      <div class="friend-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(username)}
        </p>

      </div>

      <div class="friend-card-actions">

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
   27. ACCEPT FRIEND REQUEST
   ========================================================= */

async function acceptFriendRequest(
  requestId
) {

  if (!currentUser) {

    openAuth();

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
        .eq(
          "receiver_id",
          currentUser.id
        )
        .maybeSingle();


    if (
      requestResult.error ||
      !requestResult.data
    ) {

      alert(
        "Friend request could not be found."
      );

      return;

    }


    const request =
      requestResult.data;


    if (
      request.status !==
      "pending"
    ) {

      alert(
        "This request has already been handled."
      );

      return;

    }


    const friendshipResult =
      await supabaseClient
        .from("friendships")
        .insert([

          {
            user_id:
              currentUser.id,

            friend_id:
              request.sender_id
          },

          {
            user_id:
              request.sender_id,

            friend_id:
              currentUser.id
          }

        ]);


    if (
      friendshipResult.error
    ) {

      const errorMessage =
        friendshipResult.error.message
          ? friendshipResult.error.message.toLowerCase()
          : "";


      if (
        !errorMessage.includes(
          "duplicate"
        )
      ) {

        console.error(
          "Friendship creation error:",
          friendshipResult.error
        );


        alert(
          friendshipResult.error.message
        );

        return;

      }

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


    if (
      updateResult.error
    ) {

      console.error(
        "Request update error:",
        updateResult.error
      );


      alert(
        updateResult.error.message
      );

      return;

    }


    alert(
      "Friend request accepted!"
    );


    await loadFriendRequests();

    await loadMyFriends();

    await updateRequestBadge();


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
   28. DECLINE FRIEND REQUEST
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

      console.error(
        "Decline request error:",
        result.error
      );


      alert(
        result.error.message
      );

      return;

    }


    await loadFriendRequests();

    await updateRequestBadge();


  } catch (error) {

    console.error(
      "declineFriendRequest error:",
      error
    );

  }

}


/* =========================================================
   29. LOAD MY FRIENDS
   ========================================================= */

async function loadMyFriends() {

  const container =
    document.getElementById(
      "myFriendsList"
    );


  const countElement =
    document.getElementById(
      "friendCount"
    );


  if (!container) {
    return;
  }


  if (!currentUser) {

    container.innerHTML =
      `
      <div class="empty-state">
        <div>🔐</div>
        <h2>Login Required</h2>
        <p>
          Please login to see your friends.
        </p>
      </div>
      `;


    if (countElement) {

      countElement.textContent =
        "0 Friends";

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
        "My friends error:",
        result.error
      );


      container.innerHTML =
        `
        <div class="empty-state">
          <div>⚠️</div>
          <p>
            Unable to load friends.
          </p>
        </div>
        `;

      return;

    }


    const friendIds =
      [];


    (
      result.data ||
      []
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


    const uniqueFriendIds =
      Array.from(
        new Set(friendIds)
      );


    if (countElement) {

      countElement.textContent =
        uniqueFriendIds.length +
        " " +
        (
          uniqueFriendIds.length ===
          1
            ? "Friend"
            : "Friends"
        );

    }


    if (!uniqueFriendIds.length) {

      container.innerHTML =
        `
        <div class="empty-state">
          <div>👥</div>
          <h2>No Friends Yet</h2>
          <p>
            Search for people and start connecting.
          </p>
        </div>
        `;

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
          uniqueFriendIds
        );


    if (
      profilesResult.error
    ) {

      console.error(
        "Friend profile error:",
        profilesResult.error
      );

      return;

    }


    container.innerHTML =
      (
        profilesResult.data ||
        []
      )
        .map(
          function (profile) {

            return createMyFriendCard(
              profile
            );

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "loadMyFriends error:",
      error
    );

  }

}


/* =========================================================
   30. CREATE MY FRIEND CARD
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


  let avatarHTML =
    "";


  if (
    friend.avatar_url
  ) {

    avatarHTML =
      `
      <div class="friend-avatar">

        <img
          src="${escapeHTML(friend.avatar_url)}"
          alt="${escapeHTML(name)}"
          class="friend-avatar-img"
        >

      </div>
      `;

  } else {

    avatarHTML =
      `
      <div class="friend-avatar">
        ${escapeHTML(
          getInitials(name)
        )}
      </div>
      `;

  }


  return `
    <div class="friend-card">

      ${avatarHTML}

      <div class="friend-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          ${escapeHTML(username)}
        </p>

      </div>

      <div class="friend-card-actions">

        <button
          type="button"
          class="primary-btn"
          onclick="messageFriend('${escapeJS(friend.id)}')"
        >
          Message
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   31. MESSAGE FRIEND
   ========================================================= */

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
   32. LOAD PROFILE
   ========================================================= */

async function loadProfile() {

  if (!currentUser) {
    return;
  }


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


    if (result.error) {

      console.error(
        "Profile load error:",
        result.error
      );

      return;

    }


    currentProfile =
      result.data;


    const profile =
      result.data;


    const name =
      profile &&
      profile.full_name
        ? profile.full_name
        : currentUser.email
          ? currentUser.email.split("@")[0]
          : "Your Name";


    const username =
      profile &&
      profile.username
        ? "@" +
          profile.username
        : "";


    setText(
      "profileName",
      name
    );


    setText(
      "profileUsername",
      username
    );


    setText(
      "displayName",
      name
    );


    setText(
      "usernameDisplay",
      username
    );


    setValue(
      "editProfileName",
      profile &&
      profile.full_name
        ? profile.full_name
        : ""
    );


    setValue(
      "editProfileUsername",
      profile &&
      profile.username
        ? profile.username
        : ""
    );


    updateAvatarElement(
      "profileAvatar",
      profile &&
      profile.avatar_url
        ? profile.avatar_url
        : "",
      name
    );


    updateAvatarElement(
      "navAvatar",
      profile &&
      profile.avatar_url
        ? profile.avatar_url
        : "",
      name
    );


  } catch (error) {

    console.error(
      "loadProfile error:",
      error
    );

  }

}


/* =========================================================
   33. OPEN EDIT PROFILE
   ========================================================= */

function openEditProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  const modal =
    document.getElementById(
      "editProfileModal"
    );


  if (!modal) {

    window.location.href =
      "profile.html";

    return;

  }


  loadProfile();


  modal.style.display =
    "flex";

}


/* =========================================================
   34. CLOSE EDIT PROFILE
   ========================================================= */

function closeEditProfile() {

  const modal =
    document.getElementById(
      "editProfileModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


/* =========================================================
   35. SAVE EDIT PROFILE
   ========================================================= */

async function saveEditProfile() {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }


  const nameElement =
    document.getElementById(
      "editProfileName"
    );


  const usernameElement =
    document.getElementById(
      "editProfileUsername"
    );


  const name =
    nameElement
      ? nameElement.value.trim()
      : "";


  const username =
    usernameElement
      ? usernameElement.value.trim()
      : "";


  if (!name) {

    alert(
      "Please enter your name."
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

    const existingResult =
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
      existingResult.data
    ) {

      alert(
        "That username is already taken."
      );

      return;

    }


    const result =
      await supabaseClient
        .from("profiles")
        .upsert({

          id:
            currentUser.id,

          full_name:
            name,

          username:
            username

        });


    if (result.error) {

      console.error(
        "Save profile error:",
        result.error
      );


      alert(
        result.error.message
      );

      return;

    }


    alert(
      "Profile updated successfully!"
    );


    closeEditProfile();


    await loadProfile();

    await refreshAccountUI();


  } catch (error) {

    console.error(
      "saveEditProfile error:",
      error
    );


    alert(
      "Could not update profile."
    );

  }

}


/* =========================================================
   36. PROFILE PAGE SETUP
   ========================================================= */

function setupProfilePage() {

  window.editProfile =
    function () {

      if (!currentUser) {

        openAuth();

        return;

      }


      window.location.href =
        "profile.html";

    };

}


/* =========================================================
   37. AVATAR UPLOAD SETUP
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

      if (!currentUser) {

        openAuth();

        return;

      }


      const file =
        input.files &&
        input.files[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        alert(
          "Please choose an image file."
        );

        return;

      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        alert(
          "Image must be smaller than 5 MB."
        );

        return;

      }


      try {

        const extension =
          file.name
            .split(".")
            .pop()
            .toLowerCase();


        const filePath =
          currentUser.id +
          "/avatar." +
          extension;


        const uploadResult =
          await supabaseClient.storage
            .from("avatars")
            .upload(
              filePath,
              file,
              {
                upsert:
                  true
              }
            );


        if (
          uploadResult.error
        ) {

          console.error(
            "Avatar upload error:",
            uploadResult.error
          );


          alert(
            uploadResult.error.message
          );

          return;

        }


        const publicResult =
          supabaseClient.storage
            .from("avatars")
            .getPublicUrl(
              filePath
            );


        const avatarUrl =
          publicResult.data &&
          publicResult.data.publicUrl
            ? publicResult.data.publicUrl
            : "";


        if (!avatarUrl) {

          alert(
            "Could not get avatar URL."
          );

          return;

        }


        const profileResult =
          await supabaseClient
            .from("profiles")
            .upsert({

              id:
                currentUser.id,

              avatar_url:
                avatarUrl

            });


        if (
          profileResult.error
        ) {

          console.error(
            "Avatar profile update error:",
            profileResult.error
          );


          alert(
            profileResult.error.message
          );

          return;

        }


        alert(
          "Profile picture updated!"
        );


        await loadProfile();

        await refreshAccountUI();


      } catch (error) {

        console.error(
          "Avatar error:",
          error
        );


        alert(
          "Could not upload profile picture."
        );

      }

    }
  );

}


/* =========================================================
   38. SEARCH ENTER KEY
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
   39. MESSAGES PAGE SETUP
   ========================================================= */

function setupMessagePage() {

  const input =
    document.getElementById(
      "messageInput"
    );


  const search =
    document.getElementById(
      "messageFriendSearch"
    );


  const sendButton =
    document.getElementById(
      "sendMessageButton"
    );


  if (input) {

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


  if (search) {

    search.addEventListener(
      "input",
      function () {

        renderMessageFriends(
          search.value
        );

      }
    );

  }


  if (sendButton) {

    sendButton.addEventListener(
      "click",
      function () {

        sendMessage();

      }
    );

  }

}


/* =========================================================
   40. LOAD MESSAGE FRIENDS
   ========================================================= */

async function loadMessageFriends() {

  const list =
    document.getElementById(
      "conversationList"
    );


  if (!list) {
    return;
  }


  if (!currentUser) {

    list.innerHTML =
      `
      <div class="empty-state">
        <div>🔐</div>
        <h2>Login Required</h2>
        <p>
          Please login to see your conversations.
        </p>
      </div>
      `;

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
      result.data ||
      []
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

      messageFriends =
        [];

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


    if (
      profilesResult.error
    ) {

      console.error(
        "Message friend profiles error:",
        profilesResult.error
      );

      return;

    }


    messageFriends =
      profilesResult.data || [];


    renderMessageFriends();


    /* -------------------------------------------------------
       OPEN FRIEND FROM URL
       ------------------------------------------------------- */

    const params =
      new URLSearchParams(
        window.location.search
      );


    const friendFromURL =
      params.get(
        "friend"
      );


    if (friendFromURL) {

      const friend =
        messageFriends.find(
          function (item) {

            return (
              item.id ===
              friendFromURL
            );

          }
        );


      if (friend) {

        await selectMessageFriend(
          friend.id
        );

      }

    }


  } catch (error) {

    console.error(
      "loadMessageFriends error:",
      error
    );

  }

}


/* =========================================================
   41. RENDER MESSAGE FRIENDS
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
        <p>
          Add friends first to start chatting.
        </p>
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


  const selected =
    getSelectedMessageFriend();


  if (selected) {

    const selectedCard =
      document.querySelector(
        '[data-friend-id="' +
        CSS.escape(
          String(
            selected.id
          )
        ) +
        '"]'
      );


    if (selectedCard) {

      selectedCard.classList.add(
        "selected"
      );

    }

  }

}


/* =========================================================
   42. CREATE CONVERSATION CARD
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
   43. SELECT MESSAGE FRIEND
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
      CSS.escape(
        String(friendId)
      ) +
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
   44. LOAD CONVERSATION MESSAGES
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
          <p>
            ${escapeHTML(
              result.error.message
            )}
          </p>
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
          <p>
            Send your first message.
          </p>
        </div>
        `;

    } else {

      messages.forEach(
        function (message) {

          appendRealtimeMessage(
            message
          );

        }
      );

    }


    chat.scrollTop =
      chat.scrollHeight;


    /* -------------------------------------------------------
       MARK RECEIVED MESSAGES AS SEEN
       ------------------------------------------------------- */

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
          seen:
            true
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


    chat.innerHTML =
      `
      <div class="empty-state">
        <div>⚠️</div>
        <p>
          Could not load conversation.
        </p>
      </div>
      `;

  }

}


/* =========================================================
   45. SEND MESSAGE
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


    /*
     * Immediately show our own message.
     * Realtime duplicate protection prevents
     * the same message from appearing twice.
     */

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
   46. START MESSAGE REALTIME
   ========================================================= */

function startMessageRealtime() {

  if (!currentUser) {

    console.log(
      "Realtime: no logged-in user."
    );

    return;

  }


  if (
    getCurrentPage() !==
    "messages.html"
  ) {

    return;

  }


  if (
    messageRealtimeChannel
  ) {

    supabaseClient.removeChannel(
      messageRealtimeChannel
    );

    messageRealtimeChannel =
      null;

  }


  console.log(
    "Starting message realtime..."
  );


  messageRealtimeChannel =
    supabaseClient
      .channel(
        "messages-" +
        currentUser.id +
        "-" +
        Date.now()
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

          console.log(
            "Realtime message:",
            payload.new
          );


          handleRealtimeMessage(
            payload.new
          );

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

          if (
            payload.new &&
            payload.new.seen ===
            true
          ) {

            updateMessageSeen(
              payload.new.id
            );

          }

        }
      )


      .subscribe(
        function (
          status,
          error
        ) {

          console.log(
            "Realtime status:",
            status
          );


          if (error) {

            console.error(
              "Realtime error:",
              error
            );

          }

        }
      );

}


/* =========================================================
   47. STOP MESSAGE REALTIME
   ========================================================= */

function stopMessageRealtime() {

  if (
    messageRealtimeChannel
  ) {

    supabaseClient.removeChannel(
      messageRealtimeChannel
    );


    messageRealtimeChannel =
      null;


    console.log(
      "Message realtime stopped."
    );

  }

}


/* =========================================================
   48. HANDLE REALTIME MESSAGE
   ========================================================= */

function handleRealtimeMessage(
  message
) {

  if (!currentUser) {
    return;
  }


  const belongsToUser =
    message.sender_id ===
      currentUser.id ||
    message.receiver_id ===
      currentUser.id;


  if (!belongsToUser) {
    return;
  }


  const friend =
    getSelectedMessageFriend();


  if (!friend) {
    return;
  }


  const belongsToConversation =
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


  if (!belongsToConversation) {
    return;
  }


  appendRealtimeMessage(
    message
  );


  /*
   * If this is a received message and the
   * conversation is currently open, mark it seen.
   */

  if (
    message.receiver_id ===
      currentUser.id &&
    message.seen !== true
  ) {

    supabaseClient
      .from("messages")
      .update({
        seen:
          true
      })
      .eq(
        "id",
        message.id
      )
      .eq(
        "receiver_id",
        currentUser.id
      )
      .then(
        function (result) {

          if (result.error) {

            console.error(
              "Mark message seen error:",
              result.error
            );

          }

        }
      );

  }

}


/* =========================================================
   49. APPEND MESSAGE
   ========================================================= */

function appendRealtimeMessage(
  message
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


  /*
   * Prevent duplicate messages.
   */

  if (
    message.id
  ) {

    const existing =
      document.querySelector(
        '[data-message-id="' +
        CSS.escape(
          String(message.id)
        ) +
        '"]'
      );


    if (existing) {
      return;
    }

  }


  /*
   * Remove empty state.
   */

  const emptyState =
    chat.querySelector(
      ".empty-state"
    );


  if (emptyState) {

    chat.innerHTML =
      "";

  }


  const mine =
    message.sender_id ===
    currentUser.id;


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "message-row " +
    (
      mine
        ? "mine"
        : "theirs"
    );


  row.setAttribute(
    "data-message-id",
    String(
      message.id || ""
    )
  );


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "message-bubble";


  bubble.textContent =
    message.message ||
    "";


  const time =
    document.createElement(
      "div"
    );


  time.className =
    "message-time";


  time.textContent =
    message.created_at
      ? new Date(
          message.created_at
        ).toLocaleTimeString(
          "en-IN",
          {

            hour:
              "numeric",

            minute:
              "2-digit"

          }
        )
      : "";


  bubble.appendChild(
    time
  );


  /*
   * Seen indicator for sent messages.
   */

  if (mine) {

    const seen =
      document.createElement(
        "div"
      );


    seen.className =
      "message-seen";


    seen.textContent =
      message.seen === true
        ? "Seen"
        : "";


    bubble.appendChild(
      seen
    );

  }


  row.appendChild(
    bubble
  );


  chat.appendChild(
    row
  );


  chat.scrollTop =
    chat.scrollHeight;

}


/* =========================================================
   50. UPDATE MESSAGE SEEN
   ========================================================= */

function updateMessageSeen(
  messageId
) {

  const element =
    document.querySelector(
      '[data-message-id="' +
      CSS.escape(
        String(messageId)
      ) +
      '"]'
    );


  if (!element) {
    return;
  }


  const seen =
    element.querySelector(
      ".message-seen"
    );


  if (seen) {

    seen.textContent =
      "Seen";

  }

}


/* =========================================================
   51. SELECTED MESSAGE FRIEND
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
    window.selectedMessageFriend ||
    selectedMessageFriend ||
    null
  );

}


/* =========================================================
   52. CHECK FRIENDSHIP
   ========================================================= */

async function areFriends(
  userId,
  friendId
) {

  try {

    const result =
      await supabaseClient
        .from("friendships")
        .select("id")
        .or(
          "and(user_id.eq." +
          userId +
          ",friend_id.eq." +
          friendId +
          "),and(user_id.eq." +
          friendId +
          ",friend_id.eq." +
          userId +
          ")"
        )
        .limit(1);


    return (
      !result.error &&
      result.data &&
      result.data.length > 0
    );


  } catch (error) {

    console.error(
      "areFriends error:",
      error
    );


    return false;

  }

}


/* =========================================================
   53. NAVIGATION - HOME
   ========================================================= */

function goHome() {

  window.location.href =
    "index.html";

}


/* =========================================================
   54. NAVIGATION - FRIENDS
   ========================================================= */

function goToFriends() {

  window.location.href =
    "friends.html";

}


/* =========================================================
   55. NAVIGATION - MESSAGES
   ========================================================= */

function goToMessages() {

  if (!currentUser) {

    openAuth();

    return;

  }


  window.location.href =
    "messages.html";

}


/* =========================================================
   56. NAVIGATION - PROFILE
   ========================================================= */

function goToProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  window.location.href =
    "profile.html";

}


/* =========================================================
   57. NAVIGATION - MY PROFILE
   ========================================================= */

function goToMyProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  window.location.href =
    "profile.html";

}


/* =========================================================
   58. NAVIGATION - REQUESTS
   ========================================================= */

function goToRequests() {

  if (!currentUser) {

    openAuth();

    return;

  }


  window.location.href =
    "friends.html#requests";

}


/* =========================================================
   59. EDIT PROFILE
   ========================================================= */

function editProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  window.location.href =
    "profile.html";

}


/* =========================================================
   60. HELPER - SET TEXT
   ========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value || "";

  }

}


/* =========================================================
   61. HELPER - SET VALUE
   ========================================================= */

function setValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.value =
      value || "";

  }

}


/* =========================================================
   62. HELPER - INITIALS
   ========================================================= */

function getInitials(
  name
) {

  if (!name) {
    return "U";
  }


  const words =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (!words.length) {
    return "U";
  }


  if (words.length === 1) {

    return words[0]
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();

}


/* =========================================================
   63. HELPER - ESCAPE HTML
   ========================================================= */

function escapeHTML(
  value
) {

  return String(
    value == null
      ? ""
      : value
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   64. HELPER - ESCAPE JAVASCRIPT
   ========================================================= */

function escapeJS(
  value
) {

  return String(
    value == null
      ? ""
      : value
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /"/g,
      '\\"'
    )
    .replace(
      /\r/g,
      "\\r"
    )
    .replace(
      /\n/g,
      "\\n"
    );

}


/* =========================================================
   65. HELPER - UPDATE AVATAR
   ========================================================= */

function updateAvatarElement(
  id,
  avatarUrl,
  name
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.style.backgroundImage =
    "none";


  element.style.backgroundSize =
    "cover";


  element.style.backgroundPosition =
    "center";


  element.style.backgroundRepeat =
    "no-repeat";


  element.textContent =
    "";


  if (avatarUrl) {

    element.style.backgroundImage =
      "url('" +
      String(avatarUrl)
        .replace(
          /'/g,
          "%27"
        ) +
      "')";

  } else {

    element.textContent =
      getInitials(
        name
      );

  }

}


/* =========================================================
   66. WINDOW EXPORTS
   =========================================================

   These are important because your HTML uses
   onclick="..." attributes.
   ========================================================= */


/* Account */

window.handleAccountClick =
  handleAccountClick;

window.openAuth =
  openAuth;

window.closeAuth =
  closeAuth;


/* Authentication */

window.showLogin =
  showLogin;

window.showSignup =
  showSignup;

window.signUp =
  signUp;

window.login =
  login;

window.logout =
  logout;


/* Navigation */

window.goHome =
  goHome;

window.goToFriends =
  goToFriends;

window.goToMessages =
  goToMessages;

window.goToProfile =
  goToProfile;

window.goToMyProfile =
  goToMyProfile;

window.goToRequests =
  goToRequests;

window.editProfile =
  editProfile;


/* Friends */

window.findFriends =
  findFriends;

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


/* Profile */

window.loadProfile =
  loadProfile;

window.openEditProfile =
  openEditProfile;

window.closeEditProfile =
  closeEditProfile;

window.saveEditProfile =
  saveEditProfile;


/* Messages */

window.loadMessageFriends =
  loadMessageFriends;

window.renderMessageFriends =
  renderMessageFriends;

window.createConversationCard =
  createConversationCard;

window.selectMessageFriend =
  selectMessageFriend;

window.loadConversationMessages =
  loadConversationMessages;

window.sendMessage =
  sendMessage;

window.startMessageRealtime =
  startMessageRealtime;

window.stopMessageRealtime =
  stopMessageRealtime;

window.handleRealtimeMessage =
  handleRealtimeMessage;

window.appendRealtimeMessage =
  appendRealtimeMessage;

window.updateMessageSeen =
  updateMessageSeen;

window.setSelectedMessageFriend =
  setSelectedMessageFriend;

window.getSelectedMessageFriend =
  getSelectedMessageFriend;


/* =========================================================
   67. FINAL MESSAGE
   ========================================================= */

console.log(
  "YouRemo script.js ready."
);
```
