```javascript
/* =========================================================
   YOUREMO - COMPLETE SCRIPT.JS
   SEPARATE PAGES VERSION

   Pages:
   index.html
   friends.html
   messages.html
   profile.html

   Supabase:
   Authentication
   Profiles
   Friends
   Friend Requests
   Messages
   Realtime Messaging
   ========================================================= */


/* =========================================================
   1. SUPABASE CONNECTION
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
   2. GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;

let selectedMessageFriend = null;

let messageRealtimeChannel = null;

let messageFriends = [];


/* =========================================================
   3. CURRENT PAGE
   ========================================================= */

function getCurrentPage() {

  const path =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  if (!path) {
    return "index.html";
  }

  return path;
}


/* =========================================================
   4. PAGE START
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


    await loadCurrentUser();

    setupAvatarUpload();

    setupProfilePage();

    setupSearchEnterKey();

    setupPageSpecificFeatures();

  }
);


/* =========================================================
   5. PAGE SPECIFIC FEATURES
   ========================================================= */

function setupPageSpecificFeatures() {

  const page =
    getCurrentPage();


  if (page === "index.html") {

    console.log(
      "Home page initialized."
    );

  }


  if (page === "friends.html") {

    console.log(
      "Friends page initialized."
    );

    if (currentUser) {

      loadFriendRequests();

      loadMyFriends();

    }

  }


  if (page === "profile.html") {

    console.log(
      "Profile page initialized."
    );

    if (currentUser) {

      loadProfile();

    }

  }


  if (page === "messages.html") {

    console.log(
      "Messages page initialized."
    );

    if (currentUser) {

      initializeMessagesPage();

    }

  }

}


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

        await initializeMessagesPage();

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

supabaseClient.auth.onAuthStateChange(
  function (event, session) {

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

            await initializeMessagesPage();

          }

        } else {

          stopMessageRealtime();

        }

      },
      100
    );

  }
);


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


  if (!loginButton) {
    return;
  }


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
        getInitials(displayName);

    }

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


  menu.style.display =
    menu.style.display === "block"
      ? "none"
      : "block";

}


/* =========================================================
   10. AUTH
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


/* =========================================================
   11. LOGIN FORM
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
   12. SIGNUP FORM
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
   13. SIGN UP
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
    !password ||
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


    if (usernameCheck.error) {

      console.error(
        usernameCheck.error
      );

    }


    if (usernameCheck.data) {

      alert(
        "That username is already taken."
      );

      return;

    }


    const signupResult =
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


    if (signupResult.error) {

      alert(
        signupResult.error.message
      );

      return;

    }


    if (
      !signupResult.data ||
      !signupResult.data.user
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
            signupResult.data.user.id,

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
   14. LOGIN
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


    alert(
      "Login successful!"
    );


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

      await initializeMessagesPage();

    }

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
   15. LOGOUT
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


    currentUser =
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
   16. CLEAR AUTH FORM
   ========================================================= */

function clearAuthForm() {

  const fields = [

    "authName",

    "authUsername",

    "authEmail",

    "authPassword"

  ];


  fields.forEach(
    function (id) {

      const element =
        document.getElementById(id);


      if (element) {

        element.value =
          "";

      }

    }
  );

}


/* =========================================================
   17. FIND FRIENDS
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
   18. LEARN MORE
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
   19. SEARCH FRIENDS
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
      '<div class="empty-state">' +
      '<div>👥</div>' +
      '<h2>Find Friends</h2>' +
      '<p>Enter a name or username to find people on YouRemo.</p>' +
      '</div>';

    return;

  }


  results.innerHTML =
    '<div class="empty-state">' +
    '<div>🔎</div>' +
    '<p>Searching...</p>' +
    '</div>';


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
        .limit(30);


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
        .limit(30);


    const combined = [

      ...(nameResult.data || []),

      ...(usernameResult.data || [])

    ];


    const peopleMap =
      new Map();


    combined.forEach(
      function (person) {

        peopleMap.set(
          person.id,
          person
        );

      }
    );


    let people =
      Array.from(
        peopleMap.values()
      );


    if (currentUser) {

      people =
        people.filter(
          function (person) {

            return (
              person.id !==
              currentUser.id
            );

          }
        );

    }


    if (!people.length) {

      results.innerHTML =
        '<div class="empty-state">' +
        '<div>😕</div>' +
        '<h2>No people found</h2>' +
        '<p>Try another name or username.</p>' +
        '</div>';

      return;

    }


    results.innerHTML =
      people
        .map(
          function (person) {

            return createFriendResultCard(
              person
            );

          }
        )
        .join("");


    if (currentUser) {

      await updateSearchButtons(
        people
      );

    }

  } catch (error) {

    console.error(
      "Search friends error:",
      error
    );


    results.innerHTML =
      '<div class="empty-state">' +
      '<div>⚠️</div>' +
      '<h2>Search Error</h2>' +
      '<p>Something went wrong while searching.</p>' +
      '</div>';

  }

}


/* =========================================================
   20. FRIEND RESULT CARD
   ========================================================= */

function createFriendResultCard(person) {

  const name =
    person.full_name ||
    person.username ||
    "YouRemo User";


  const username =
    person.username
      ? "@" + person.username
      : "";


  let avatarHTML =
    "";


  if (person.avatar_url) {

    avatarHTML =
      '<div class="friend-avatar">' +
      '<img src="' +
      escapeHTML(person.avatar_url) +
      '" alt="' +
      escapeHTML(name) +
      '" class="friend-avatar-img">' +
      '</div>';

  } else {

    avatarHTML =
      '<div class="friend-avatar">' +
      escapeHTML(getInitials(name)) +
      '</div>';

  }


  return (

    '<div class="friend-card" data-user-id="' +
    escapeHTML(person.id) +
    '">' +

    avatarHTML +

    '<div class="friend-info">' +

    '<h3>' +
    escapeHTML(name) +
    '</h3>' +

    '<p>' +
    escapeHTML(username) +
    '</p>' +

    '</div>' +

    '<div class="friend-card-actions">' +

    '<button ' +
    'class="primary-btn friend-request-btn" ' +
    'data-user-id="' +
    escapeHTML(person.id) +
    '" ' +
    'onclick="sendFriendRequest(\'' +
    escapeJS(person.id) +
    '\')">' +

    'Add Friend' +

    '</button>' +

    '</div>' +

    '</div>'

  );

}


/* =========================================================
   21. UPDATE SEARCH BUTTONS
   ========================================================= */

async function updateSearchButtons(people) {

  if (!currentUser) {
    return;
  }


  const ids =
    people.map(
      function (person) {
        return person.id;
      }
    );


  if (!ids.length) {
    return;
  }


  const sentResult =
    await supabaseClient
      .from("friend_requests")
      .select(
        "receiver_id, status"
      )
      .eq(
        "sender_id",
        currentUser.id
      )
      .in(
        "receiver_id",
        ids
      );


  const receivedResult =
    await supabaseClient
      .from("friend_requests")
      .select(
        "sender_id, status"
      )
      .eq(
        "receiver_id",
        currentUser.id
      )
      .in(
        "sender_id",
        ids
      );


  const friendshipResult =
    await supabaseClient
      .from("friendships")
      .select(
        "user_id, friend_id"
      )
      .or(
        "user_id.eq." +
        currentUser.id +
        ",friend_id.eq." +
        currentUser.id
      );


  const sentMap =
    new Map();


  (
    sentResult.data || []
  ).forEach(
    function (request) {

      sentMap.set(
        request.receiver_id,
        request.status
      );

    }
  );


  const receivedMap =
    new Map();


  (
    receivedResult.data || []
  ).forEach(
    function (request) {

      receivedMap.set(
        request.sender_id,
        request.status
      );

    }
  );


  const friendIds =
    new Set();


  (
    friendshipResult.data || []
  ).forEach(
    function (friendship) {

      if (
        friendship.user_id ===
        currentUser.id
      ) {

        friendIds.add(
          friendship.friend_id
        );

      }


      if (
        friendship.friend_id ===
        currentUser.id
      ) {

        friendIds.add(
          friendship.user_id
        );

      }

    }
  );


  people.forEach(
    function (person) {

      const button =
        document.querySelector(
          '.friend-request-btn[data-user-id="' +
          CSS.escape(person.id) +
          '"]'
        );


      if (!button) {
        return;
      }


      if (friendIds.has(person.id)) {

        button.textContent =
          "Friends";

        button.disabled =
          true;

        return;

      }


      if (
        sentMap.get(person.id) ===
        "pending"
      ) {

        button.textContent =
          "Request Sent";

        button.disabled =
          true;

        return;

      }


      if (
        receivedMap.get(person.id) ===
        "pending"
      ) {

        button.textContent =
          "Respond to Request";

        button.disabled =
          false;

        button.onclick =
          function () {

            window.location.href =
              "friends.html#requests";

          };

        return;

      }


      button.textContent =
        "Add Friend";

      button.disabled =
        false;

    }
  );

}


/* =========================================================
   22. SEND FRIEND REQUEST
   ========================================================= */

async function sendFriendRequest(receiverId) {

  if (!currentUser) {

    openAuth();

    return;

  }


  if (
    receiverId ===
    currentUser.id
  ) {

    alert(
      "You cannot send a friend request to yourself."
    );

    return;

  }


  try {

    const friendshipResult =
      await supabaseClient
        .from("friendships")
        .select("id")
        .or(
          "and(user_id.eq." +
          currentUser.id +
          ",friend_id.eq." +
          receiverId +
          "),and(user_id.eq." +
          receiverId +
          ",friend_id.eq." +
          currentUser.id +
          ")"
        )
        .maybeSingle();


    if (friendshipResult.data) {

      alert(
        "You are already friends."
      );

      return;

    }


    const requestResult =
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
        )
        .eq(
          "status",
          "pending"
        )
        .maybeSingle();


    if (requestResult.data) {

      if (
        requestResult.data.sender_id ===
        currentUser.id
      ) {

        alert(
          "Friend request already sent."
        );

      } else {

        alert(
          "This person has already sent you a friend request."
        );

      }

      return;

    }


    const insertResult =
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


    if (insertResult.error) {

      console.error(
        "Send request error:",
        insertResult.error
      );

      alert(
        insertResult.error.message
      );

      return;

    }


    const button =
      document.querySelector(
        '.friend-request-btn[data-user-id="' +
        CSS.escape(receiverId) +
        '"]'
      );


    if (button) {

      button.textContent =
        "Request Sent";

      button.disabled =
        true;

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
   23. LOAD FRIEND REQUESTS
   ========================================================= */

async function loadFriendRequests() {

  const container =
    document.getElementById(
      "friendRequests"
    );


  const badge =
    document.getElementById(
      "requestBadge"
    );


  if (!container) {
    return;
  }


  if (!currentUser) {

    container.innerHTML =
      '<div class="empty-state">' +
      '<div>🔐</div>' +
      '<h2>Login Required</h2>' +
      '<p>Please login to see your friend requests.</p>' +
      '</div>';


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
        "Friend request loading error:",
        result.error
      );

      return;

    }


    const requests =
      result.data || [];


    if (badge) {

      badge.textContent =
        String(requests.length);

    }


    if (!requests.length) {

      container.innerHTML =
        '<div class="empty-state">' +
        '<div>📭</div>' +
        '<h2>No Friend Requests</h2>' +
        '<p>You don\'t have any pending requests.</p>' +
        '</div>';

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
      profilesResult.data || []
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
   24. REQUEST CARD
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
      ? "@" + sender.username
      : "";


  let avatarHTML =
    "";


  if (
    sender &&
    sender.avatar_url
  ) {

    avatarHTML =
      '<div class="friend-avatar">' +
      '<img src="' +
      escapeHTML(sender.avatar_url) +
      '" alt="' +
      escapeHTML(name) +
      '" class="friend-avatar-img">' +
      '</div>';

  } else {

    avatarHTML =
      '<div class="friend-avatar">' +
      escapeHTML(getInitials(name)) +
      '</div>';

  }


  return (

    '<div class="friend-card" data-request-id="' +
    escapeHTML(request.id) +
    '">' +

    avatarHTML +

    '<div class="friend-info">' +

    '<h3>' +
    escapeHTML(name) +
    '</h3>' +

    '<p>' +
    escapeHTML(username) +
    '</p>' +

    '</div>' +

    '<div class="friend-card-actions">' +

    '<button class="primary-btn" ' +
    'onclick="acceptFriendRequest(\'' +
    escapeJS(request.id) +
    '\')">' +

    'Accept' +

    '</button>' +

    '<button class="secondary-btn" ' +
    'onclick="declineFriendRequest(\'' +
    escapeJS(request.id) +
    '\')">' +

    'Decline' +

    '</button>' +

    '</div>' +

    '</div>'

  );

}


/* =========================================================
   25. ACCEPT FRIEND REQUEST
   ========================================================= */

async function acceptFriendRequest(requestId) {

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


    if (friendshipResult.error) {

      const message =
        friendshipResult.error.message
          ? friendshipResult.error.message.toLowerCase()
          : "";


      if (
        !message.includes("duplicate")
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


    if (updateResult.error) {

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
   26. DECLINE FRIEND REQUEST
   ========================================================= */

async function declineFriendRequest(requestId) {

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

  }

}


/* =========================================================
   27. LOAD MY FRIENDS
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
      '<div class="empty-state">' +
      '<div>🔐</div>' +
      '<h2>Login Required</h2>' +
      '<p>Please login to see your friends.</p>' +
      '</div>';


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

      return;

    }


    const friendIds = [];


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


    const uniqueFriendIds =
      Array.from(
        new Set(friendIds)
      );


    if (countElement) {

      countElement.textContent =
        uniqueFriendIds.length +
        " " +
        (
          uniqueFriendIds.length === 1
            ? "Friend"
            : "Friends"
        );

    }


    if (!uniqueFriendIds.length) {

      container.innerHTML =
        '<div class="empty-state">' +
        '<div>👥</div>' +
        '<h2>No Friends Yet</h2>' +
        '<p>Search for people and start connecting.</p>' +
        '</div>';

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


    if (profilesResult.error) {

      console.error(
        "Friend profile error:",
        profilesResult.error
      );

      return;

    }


    container.innerHTML =
      (
        profilesResult.data || []
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
   28. MY FRIEND CARD
   ========================================================= */

function createMyFriendCard(friend) {

  const name =
    friend.full_name ||
    friend.username ||
    "YouRemo User";


  const username =
    friend.username
      ? "@" + friend.username
      : "";


  let avatarHTML =
    "";


  if (friend.avatar_url) {

    avatarHTML =
      '<div class="friend-avatar">' +
      '<img src="' +
      escapeHTML(friend.avatar_url) +
      '" alt="' +
      escapeHTML(name) +
      '" class="friend-avatar-img">' +
      '</div>';

  } else {

    avatarHTML =
      '<div class="friend-avatar">' +
      escapeHTML(getInitials(name)) +
      '</div>';

  }


  return (

    '<div class="friend-card">' +

    avatarHTML +

    '<div class="friend-info">' +

    '<h3>' +
    escapeHTML(name) +
    '</h3>' +

    '<p>' +
    escapeHTML(username) +
    '</p>' +

    '</div>' +

    '</div>'

  );

}


/* =========================================================
   29. LOAD PROFILE
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
        ? profile.username
        : "username";


    setText(
      "myProfileName",
      name
    );


    setText(
      "profileUsername",
      "@" + username
    );


    setText(
      "myProfileUsername",
      "@" + username
    );


    setText(
      "profileName",
      name
    );


    setText(
      "profileEmail",
      currentUser.email || ""
    );


    setText(
      "displayName",
      name
    );


    setText(
      "displayUsername",
      "@" + username
    );


    setText(
      "displayEmail",
      currentUser.email || "Not available"
    );


    if (currentUser.created_at) {

      const formatted =
        new Date(
          currentUser.created_at
        ).toLocaleDateString(
          "en-IN",
          {

            day:
              "numeric",

            month:
              "long",

            year:
              "numeric"

          }
        );


      setText(
        "joinedDate",
        formatted
      );

    }


    updateAvatarElement(
      "myProfileAvatar",
      profile &&
      profile.avatar_url
        ? profile.avatar_url
        : "",
      name
    );


    updateAvatarElement(
      "profileAvatar",
      profile &&
      profile.avatar_url
        ? profile.avatar_url
        : "",
      name
    );


    const friendshipsResult =
      await supabaseClient
        .from("friendships")
        .select(
          "user_id, friend_id"
        )
        .or(
          "user_id.eq." +
          currentUser.id +
          ",friend_id.eq." +
          currentUser.id
        );


    const friendIds =
      new Set();


    (
      friendshipsResult.data || []
    ).forEach(
      function (friendship) {

        if (
          friendship.user_id ===
          currentUser.id
        ) {

          friendIds.add(
            friendship.friend_id
          );

        } else {

          friendIds.add(
            friendship.user_id
          );

        }

      }
    );


    setText(
      "profileFriendCount",
      friendIds.size
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

  } catch (error) {

    console.error(
      "loadProfile error:",
      error
    );

  }

}


/* =========================================================
   30. EDIT PROFILE
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


    if (existingResult.data) {

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
   31. PROFILE PAGE SETUP
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
   32. AVATAR UPLOAD
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
    async function (event) {

      const file =
        event.target.files &&
        event.target.files[0];


      if (!file) {
        return;
      }


      await uploadAvatar(file);

    }
  );

}


async function uploadAvatar(file) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }


  if (
    !file.type.startsWith("image/")
  ) {

    alert(
      "Please select an image file."
    );

    return;

  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    alert(
      "Please choose an image smaller than 5 MB."
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
      await supabaseClient
        .storage
        .from("avatars")
        .upload(
          filePath,
          file,
          {

            upsert:
              true,

            cacheControl:
              "3600"

          }
        );


    if (uploadResult.error) {

      alert(
        "Photo upload failed: " +
        uploadResult.error.message
      );

      return;

    }


    const publicResult =
      supabaseClient
        .storage
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
        "Could not create image URL."
      );

      return;

    }


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


    alert(
      "Profile photo updated!"
    );


    await loadProfile();

    await refreshAccountUI();

  } catch (error) {

    console.error(
      "uploadAvatar error:",
      error
    );


    alert(
      "Something went wrong while uploading your photo."
    );

  }

}


/* =========================================================
   33. SEARCH ENTER KEY
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

      if (event.key === "Enter") {

        event.preventDefault();

        searchFriends();

      }

    }
  );

}


/* =========================================================
   34. PROFILE NAVIGATION
   ========================================================= */

function goToMyProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  const menu =
    document.getElementById(
      "accountMenu"
    );


  if (menu) {

    menu.style.display =
      "none";

  }


  const profile =
    document.getElementById(
      "profile"
    );


  if (profile) {

    profile.scrollIntoView({

      behavior:
        "smooth"

    });

    return;

  }


  window.location.href =
    "profile.html";

}


function editProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  window.location.href =
    "profile.html";

}


/* =========================================================
   35. CLICK OUTSIDE ACCOUNT MENU
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {

    const accountButton =
      document.getElementById(
        "accountButton"
      );


    const accountMenu =
      document.getElementById(
        "accountMenu"
      );


    if (
      !accountButton ||
      !accountMenu
    ) {

      return;

    }


    if (
      !accountButton.contains(
        event.target
      ) &&
      !accountMenu.contains(
        event.target
      )
    ) {

      accountMenu.style.display =
        "none";

    }

  }
);


/* =========================================================
   36. CLOSE MODALS
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {

    const authModal =
      document.getElementById(
        "authModal"
      );


    const editModal =
      document.getElementById(
        "editProfileModal"
      );


    if (
      authModal &&
      event.target === authModal
    ) {

      closeAuth();

    }


    if (
      editModal &&
      event.target === editModal
    ) {

      closeEditProfile();

    }

  }
);


/* =========================================================
   37. MESSAGES PAGE INITIALIZATION
   ========================================================= */

async function initializeMessagesPage() {

  if (!currentUser) {

    showMessagesLoginRequired();

    return;

  }


  console.log(
    "Initializing messages..."
  );


  await loadMessageFriends();


  setupMessageInput();


  startMessageRealtime();

}


/* =========================================================
   38. LOAD MESSAGE FRIENDS
   ========================================================= */

async function loadMessageFriends() {

  const container =
    document.getElementById(
      "messageFriends"
    );


  if (!container) {

    console.log(
      "messageFriends container not found."
    );

    return;

  }


  if (!currentUser) {

    showMessagesLoginRequired();

    return;

  }


  container.innerHTML =
    '<div class="empty-state">' +
    '<div>⏳</div>' +
    '<p>Loading friends...</p>' +
    '</div>';


  try {

    const friendshipResult =
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


    if (friendshipResult.error) {

      console.error(
        "Message friends error:",
        friendshipResult.error
      );

      container.innerHTML =
        '<div class="empty-state">' +
        '<div>⚠️</div>' +
        '<p>Unable to load friends.</p>' +
        '</div>';

      return;

    }


    const ids = [];


    (
      friendshipResult.data || []
    ).forEach(
      function (friendship) {

        if (
          friendship.user_id ===
          currentUser.id
        ) {

          ids.push(
            friendship.friend_id
          );

        } else {

          ids.push(
            friendship.user_id
          );

        }

      }
    );


    const uniqueIds =
      Array.from(
        new Set(ids)
      );


    if (!uniqueIds.length) {

      messageFriends = [];


      container.innerHTML =
        '<div class="empty-state">' +
        '<div>👥</div>' +
        '<h3>No friends yet</h3>' +
        '<p>Add friends first to start messaging.</p>' +
        '</div>';

      return;

    }


    const profileResult =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .in(
          "id",
          uniqueIds
        );


    if (profileResult.error) {

      console.error(
        "Message profile error:",
        profileResult.error
      );

      container.innerHTML =
        '<div class="empty-state">' +
        '<div>⚠️</div>' +
        '<p>Unable to load friend profiles.</p>' +
        '</div>';

      return;

    }


    messageFriends =
      profileResult.data || [];


    container.innerHTML =
      messageFriends
        .map(
          function (friend) {

            return createMessageFriendCard(
              friend
            );

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "loadMessageFriends error:",
      error
    );

  }

}


/* =========================================================
   39. MESSAGE FRIEND CARD
   ========================================================= */

function createMessageFriendCard(friend) {

  const name =
    friend.full_name ||
    friend.username ||
    "YouRemo User";


  const username =
    friend.username
      ? "@" + friend.username
      : "";


  const avatar =
    friend.avatar_url

      ? '<img src="' +
        escapeHTML(friend.avatar_url) +
        '" alt="' +
        escapeHTML(name) +
        '" class="message-friend-avatar-img">'

      : escapeHTML(
          getInitials(name)
        );


  return (

    '<button ' +

    'type="button" ' +

    'class="message-friend" ' +

    'data-friend-id="' +
    escapeHTML(friend.id) +
    '" ' +

    'onclick="openConversation(\'' +
    escapeJS(friend.id) +
    '\')">' +

    '<div class="message-friend-avatar">' +

    avatar +

    '</div>' +

    '<div class="message-friend-info">' +

    '<strong>' +
    escapeHTML(name) +
    '</strong>' +

    '<span>' +
    escapeHTML(username) +
    '</span>' +

    '</div>' +

    '</button>'

  );

}


/* =========================================================
   40. OPEN CONVERSATION
   ========================================================= */

async function openConversation(friendId) {

  if (!currentUser) {

    openAuth();

    return;

  }


  const friend =
    messageFriends.find(
      function (item) {

        return item.id === friendId;

      }
    );


  if (!friend) {

    console.error(
      "Friend not found:",
      friendId
    );

    return;

  }


  setSelectedMessageFriend(
    friend
  );


  document
    .querySelectorAll(
      ".message-friend"
    )
    .forEach(
      function (element) {

        element.classList.remove(
          "active"
        );

      }
    );


  const selectedElement =
    document.querySelector(
      '.message-friend[data-friend-id="' +
      CSS.escape(friendId) +
      '"]'
    );


  if (selectedElement) {

    selectedElement.classList.add(
      "active"
    );

  }


  updateConversationHeader(
    friend
  );


  await loadConversation(
    friend.id
  );

}


/* =========================================================
   41. CONVERSATION HEADER
   ========================================================= */

function updateConversationHeader(friend) {

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


  updateAvatarElement(
    "chatFriendAvatar",
    friend.avatar_url || "",
    name
  );

}


/* =========================================================
   42. LOAD CONVERSATION
   ========================================================= */

async function loadConversation(friendId) {

  const chat =
    document.getElementById(
      "chatMessages"
    );


  if (!chat) {
    return;
  }


  if (!currentUser) {
    return;
  }


  chat.innerHTML =
    '<div class="empty-state">' +
    '<div>⏳</div>' +
    '<p>Loading messages...</p>' +
    '</div>';


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
        "Conversation loading error:",
        result.error
      );


      chat.innerHTML =
        '<div class="empty-state">' +
        '<div>⚠️</div>' +
        '<p>Unable to load messages.</p>' +
        '</div>';

      return;

    }


    const messages =
      result.data || [];


    if (!messages.length) {

      chat.innerHTML =
        '<div class="empty-state">' +
        '<div>💬</div>' +
        '<h3>No messages yet</h3>' +
        '<p>Start the conversation!</p>' +
        '</div>';

    } else {

      chat.innerHTML = "";


      messages.forEach(
        function (message) {

          appendMessageToChat(
            message,
            false
          );

        }
      );

    }


    await markConversationAsSeen(
      friendId
    );


    scrollChatToBottom();

  } catch (error) {

    console.error(
      "loadConversation error:",
      error
    );

  }

}


/* =========================================================
   43. APPEND MESSAGE TO CHAT
   ========================================================= */

function appendMessageToChat(
  message,
  scroll
) {

  const chat =
    document.getElementById(
      "chatMessages"
    );


  if (!chat) {
    return;
  }


  if (
    message.id &&
    chat.querySelector(
      '[data-message-id="' +
      CSS.escape(
        String(message.id)
      ) +
      '"]'
    )
  ) {

    return;

  }


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


  if (message.id) {

    row.setAttribute(
      "data-message-id",
      String(message.id)
    );

  }


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "message-bubble";


  const text =
    document.createElement(
      "div"
    );


  text.className =
    "message-text";


  text.textContent =
    message.message || "";


  bubble.appendChild(
    text
  );


  const meta =
    document.createElement(
      "div"
    );


  meta.className =
    "message-meta";


  const time =
    document.createElement(
      "span"
    );


  time.className =
    "message-time";


  time.textContent =
    formatMessageTime(
      message.created_at
    );


  meta.appendChild(
    time
  );


  if (mine) {

    const seen =
      document.createElement(
        "span"
      );


    seen.className =
      "message-seen";


    seen.textContent =
      message.seen
        ? "✓✓"
        : "✓";


    seen.setAttribute(
      "data-seen-id",
      String(message.id)
    );


    meta.appendChild(
      seen
    );

  }


  bubble.appendChild(
    meta
  );


  row.appendChild(
    bubble
  );


  chat.appendChild(
    row
  );


  if (scroll) {

    scrollChatToBottom();

  }

}


/* =========================================================
   44. SETUP MESSAGE INPUT
   ========================================================= */

function setupMessageInput() {

  const input =
    document.getElementById(
      "messageInput"
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
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();

        }

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


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  const sendButton =
    document.getElementById(
      "sendMessageButton"
    );


  if (sendButton) {
    sendButton.disabled = true;
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
            text,

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


    input.value =
      "";


    /*
     * Realtime normally adds the message.
     * This fallback immediately displays it
     * if realtime is delayed.
     */

    appendMessageToChat(
      result.data,
      true
    );

  } catch (error) {

    console.error(
      "sendMessage error:",
      error
    );


    alert(
      "Could not send message."
    );

  } finally {

    if (sendButton) {
      sendButton.disabled = false;
    }

  }

}


/* =========================================================
   46. START REALTIME
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


  stopMessageRealtime();


  console.log(
    "Starting message realtime..."
  );


  messageRealtimeChannel =
    supabaseClient

      .channel(
        "messages-channel-" +
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
            "🔥 REALTIME MESSAGE:",
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

          console.log(
            "👀 MESSAGE UPDATED:",
            payload.new
          );


          if (
            payload.new.seen === true
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
   47. HANDLE REALTIME MESSAGE
   ========================================================= */

function handleRealtimeMessage(message) {

  if (!currentUser) {
    return;
  }


  const belongsToCurrentUser =
    message.sender_id === currentUser.id ||
    message.receiver_id === currentUser.id;


  if (!belongsToCurrentUser) {
    return;
  }


  const friend =
    getSelectedMessageFriend();


  if (!friend) {
    return;
  }


  const friendId =
    friend.id;


  const belongsToOpenConversation =

    (
      message.sender_id ===
      currentUser.id &&

      message.receiver_id ===
      friendId
    )

    ||

    (
      message.sender_id ===
      friendId &&

      message.receiver_id ===
      currentUser.id
    );


  if (
    !belongsToOpenConversation
  ) {

    console.log(
      "Message belongs to another conversation."
    );

    return;

  }


  appendMessageToChat(
    message,
    true
  );


  if (
    message.sender_id ===
    friendId
  ) {

    markMessageSeen(
      message.id
    );

  }

}


/* =========================================================
   48. MARK MESSAGE SEEN
   ========================================================= */

async function markMessageSeen(messageId) {

  if (!currentUser) {
    return;
  }


  try {

    const result =
      await supabaseClient
        .from("messages")
        .update({

          seen:
            true

        })
        .eq(
          "id",
          messageId
        )
        .eq(
          "receiver_id",
          currentUser.id
        );


    if (result.error) {

      console.error(
        "Mark seen error:",
        result.error
      );

    }

  } catch (error) {

    console.error(
      "markMessageSeen error:",
      error
    );

  }

}


/* =========================================================
   49. MARK CONVERSATION SEEN
   ========================================================= */

async function markConversationAsSeen(
  friendId
) {

  if (!currentUser) {
    return;
  }


  try {

    const result =
      await supabaseClient
        .from("messages")
        .update({

          seen:
            true

        })
        .eq(
          "sender_id",
          friendId
        )
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "seen",
          false
        );


    if (result.error) {

      console.error(
        "Conversation seen error:",
        result.error
      );

    }

  } catch (error) {

    console.error(
      "markConversationAsSeen error:",
      error
    );

  }

}


/* =========================================================
   50. UPDATE SEEN UI
   ========================================================= */

function updateMessageSeen(
  messageId
) {

  const element =
    document.querySelector(
      '[data-seen-id="' +
      CSS.escape(
        String(messageId)
      ) +
      '"]'
    );


  if (element) {

    element.textContent =
      "✓✓";

  }

}


/* =========================================================
   51. REALTIME APPEND COMPATIBILITY
   ========================================================= */

function appendRealtimeMessage(
  message
) {

  if (!currentUser) {
    return;
  }


  const friend =
    getSelectedMessageFriend();


  if (!friend) {
    return;
  }


  const belongs =

    (
      message.sender_id ===
      currentUser.id &&

      message.receiver_id ===
      friend.id
    )

    ||

    (
      message.sender_id ===
      friend.id &&

      message.receiver_id ===
      currentUser.id
    );


  if (!belongs) {
    return;
  }


  appendMessageToChat(
    message,
    true
  );

}


/* =========================================================
   52. SELECTED MESSAGE FRIEND
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
   53. STOP REALTIME
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
   54. MESSAGE HELPERS
   ========================================================= */

function formatMessageTime(
  dateString
) {

  if (!dateString) {
    return "";
  }


  try {

    return new Date(
      dateString
    ).toLocaleTimeString(
      "en-IN",
      {

        hour:
          "numeric",

        minute:
          "2-digit"

      }
    );

  } catch (error) {

    return "";

  }

}


function scrollChatToBottom() {

  const chat =
    document.getElementById(
      "chatMessages"
    );


  if (!chat) {
    return;
  }


  requestAnimationFrame(
    function () {

      chat.scrollTop =
        chat.scrollHeight;

    }
  );

}


function showMessagesLoginRequired() {

  const friends =
    document.getElementById(
      "messageFriends"
    );


  const chat =
    document.getElementById(
      "chatMessages"
    );


  if (friends) {

    friends.innerHTML =
      '<div class="empty-state">' +
      '<div>🔐</div>' +
      '<h3>Login Required</h3>' +
      '<p>Please login to use messages.</p>' +
      '</div>';

  }


  if (chat) {

    chat.innerHTML =
      '<div class="empty-state">' +
      '<div>🔐</div>' +
      '<h3>Please Login</h3>' +
      '<p>Login to start messaging your friends.</p>' +
      '</div>';

  }

}


/* =========================================================
   55. NAVIGATION
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


/* =========================================================
   56. GENERAL HELPERS
   ========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value === null ||
      value === undefined
        ? ""
        : value;

  }

}


function setValue(
  id,
  value
) {

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
    name
      .trim()
      .split(/\s+/);


  if (
    words.length === 1
  ) {

    return words[0]
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();

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


  element.style.backgroundImage =
    "none";


  element.innerHTML =
    "";


  if (avatarUrl) {

    const img =
      document.createElement(
        "img"
      );


    img.src =
      avatarUrl;


    img.alt =
      name ||
      "Profile photo";


    img.className =
      "profile-avatar-img";


    img.onerror =
      function () {

        this.remove();

        element.textContent =
          getInitials(name);

      };


    element.appendChild(
      img
    );


    return;

  }


  element.textContent =
    getInitials(name);

}


function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

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


function escapeJS(value) {

  return String(value)

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /'/g,
      "\\'"
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
   57. WINDOW EXPORTS
   ========================================================= */

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

window.signUp =
  signUp;

window.login =
  login;

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

window.openEditProfile =
  openEditProfile;

window.closeEditProfile =
  closeEditProfile;

window.saveEditProfile =
  saveEditProfile;

window.goToMyProfile =
  goToMyProfile;

window.editProfile =
  editProfile;

window.setSelectedMessageFriend =
  setSelectedMessageFriend;

window.getSelectedMessageFriend =
  getSelectedMessageFriend;

window.openConversation =
  openConversation;

window.sendMessage =
  sendMessage;

window.startMessageRealtime =
  startMessageRealtime;

window.stopMessageRealtime =
  stopMessageRealtime;

window.appendRealtimeMessage =
  appendRealtimeMessage;

window.markMessageSeen =
  markMessageSeen;


/* =========================================================
   58. READY
   ========================================================= */

console.log(
  "YouRemo complete script.js ready."
);
```
