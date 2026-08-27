/* =========================================================
   YOUREMO - COMPLETE SCRIPT.JS
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


/* =========================================================
   2. GLOBAL USER
   ========================================================= */

let currentUser = null;


/* =========================================================
   3. PAGE START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log("YouRemo script loaded");

    await loadCurrentUser();

    setupAvatarUpload();

    setupProfilePage();

    setupSearchEnterKey();

  }
);


/* =========================================================
   4. LOAD CURRENT USER
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

  startMessageRealtime();

}

  } catch (error) {

    console.error(
      "loadCurrentUser error:",
      error
    );

  }

}


/* =========================================================
   5. AUTH STATE CHANGE
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

  startMessageRealtime();

} else {

  stopMessageRealtime();

}

      },
      100
    );

  }
);


/* =========================================================
   6. ACCOUNT UI
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

    return;
  }


  /* -------------------------------------------------------
     LOGGED IN
     ------------------------------------------------------- */

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
    profile && profile.full_name
      ? profile.full_name
      : profile && profile.username
        ? profile.username
        : currentUser.email
          ? currentUser.email.split("@")[0]
          : "Account";


  loginButton.textContent =
    displayName;


  /* -------------------------------------------------------
     NAVIGATION AVATAR
     ------------------------------------------------------- */

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
   7. ACCOUNT BUTTON
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


  if (
    menu.style.display ===
    "block"
  ) {

    menu.style.display =
      "none";

  } else {

    menu.style.display =
      "block";

  }

}


/* =========================================================
   8. OPEN AUTH
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


/* =========================================================
   9. CLOSE AUTH
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
   10. SHOW LOGIN
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
   11. SHOW SIGNUP
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
   12. SIGN UP
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

    /* Check username */

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


    /* Create account */

    const signupResult =
      await supabaseClient.auth.signUp({

        email: email,

        password: password,

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


    /* Create profile */

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
   13. LOGIN
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


  if (!email || !password) {

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
   14. LOGOUT
   ========================================================= */

async function logout() {

  try {

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


    const menu =
      document.getElementById(
        "accountMenu"
      );


    if (menu) {

      menu.style.display =
        "none";

    }


    await refreshAccountUI();


    window.location.reload();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

}


/* =========================================================
   15. CLEAR AUTH FORM
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
   16. FIND FRIENDS
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
   17. LEARN MORE
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
   18. SEARCH FRIENDS
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


  if (!input || !results) {
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
          "%" + searchTerm + "%"
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
          "%" + searchTerm + "%"
        )
        .limit(30);


    if (nameResult.error) {

      console.error(
        "Name search error:",
        nameResult.error
      );

    }


    if (usernameResult.error) {

      console.error(
        "Username search error:",
        usernameResult.error
      );

    }


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
   19. CREATE FRIEND RESULT CARD
   ========================================================= */

function createFriendResultCard(
  person
) {

  const name =
    person.full_name ||
    person.username ||
    "YouRemo User";


  const username =
    person.username
      ? "@" + person.username
      : "";


  let avatarHTML = "";


  if (person.avatar_url) {

    avatarHTML =
      '<div class="friend-avatar">' +

      '<img ' +
      'src="' +
      escapeHTML(
        person.avatar_url
      ) +
      '" ' +
      'alt="' +
      escapeHTML(name) +
      '" ' +
      'class="friend-avatar-img" ' +
      'onerror="this.style.display=\'none\'; this.parentElement.textContent=\'' +
      escapeJS(
        getInitials(name)
      ) +
      '\'"' +
      '>' +

      '</div>';

  } else {

    avatarHTML =
      '<div class="friend-avatar">' +
      escapeHTML(
        getInitials(name)
      ) +
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
   20. UPDATE SEARCH BUTTONS
   ========================================================= */

async function updateSearchButtons(
  people
) {

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


  if (sentResult.error) {

    console.error(
      "Sent request lookup:",
      sentResult.error
    );

  }


  if (receivedResult.error) {

    console.error(
      "Received request lookup:",
      receivedResult.error
    );

  }


  if (friendshipResult.error) {

    console.error(
      "Friendship lookup:",
      friendshipResult.error
    );

  }


  const sentMap =
    new Map();


  (sentResult.data || []).forEach(
    function (request) {

      sentMap.set(
        request.receiver_id,
        request.status
      );

    }
  );


  const receivedMap =
    new Map();


  (receivedResult.data || []).forEach(
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


      if (
        friendIds.has(
          person.id
        )
      ) {

        button.textContent =
          "Friends";

        button.disabled =
          true;

        return;

      }


      if (
        sentMap.get(
          person.id
        ) === "pending"
      ) {

        button.textContent =
          "Request Sent";

        button.disabled =
          true;

        return;

      }


      if (
        receivedMap.get(
          person.id
        ) === "pending"
      ) {

        button.textContent =
          "Respond to Request";

        button.disabled =
          false;

        button.onclick =
          function () {

            const requests =
              document.getElementById(
                "requests"
              );

            if (requests) {

              requests.scrollIntoView({
                behavior:
                  "smooth"
              });

            }

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
   21. SEND FRIEND REQUEST
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
          "This person has already sent you a friend request. Check Requests."
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
   22. LOAD FRIEND REQUESTS
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


    if (profilesResult.error) {

      console.error(
        "Profile error:",
        profilesResult.error
      );

    }


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
   23. CREATE REQUEST CARD
   ========================================================= */

function createRequestCard(
  request,
  sender
) {

  const name =
    sender && sender.full_name
      ? sender.full_name
      : sender && sender.username
        ? sender.username
        : "YouRemo User";


  const username =
    sender && sender.username
      ? "@" + sender.username
      : "";


  let avatarHTML = "";


  if (
    sender &&
    sender.avatar_url
  ) {

    avatarHTML =
      '<div class="friend-avatar">' +

      '<img ' +
      'src="' +
      escapeHTML(
        sender.avatar_url
      ) +
      '" ' +
      'alt="' +
      escapeHTML(name) +
      '" ' +
      'class="friend-avatar-img" ' +
      'onerror="this.style.display=\'none\'; this.parentElement.textContent=\'' +
      escapeJS(
        getInitials(name)
      ) +
      '\'"' +
      '>' +

      '</div>';

  } else {

    avatarHTML =
      '<div class="friend-avatar">' +
      escapeHTML(
        getInitials(name)
      ) +
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
   24. ACCEPT FRIEND REQUEST
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

      const message =
        friendshipResult.error.message
          ? friendshipResult.error.message.toLowerCase()
          : "";


      if (
        !message.includes(
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


    if (updateResult.error) {

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
   25. DECLINE FRIEND REQUEST
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

  } catch (error) {

    console.error(
      "declineFriendRequest error:",
      error
    );

  }

}


/* =========================================================
   26. LOAD MY FRIENDS
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

      container.innerHTML =
        '<div class="empty-state">' +
        '<div>⚠️</div>' +
        '<p>Unable to load friends.</p>' +
        '</div>';

      return;

    }


    const friendIds = [];


    (result.data || []).forEach(
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
   27. CREATE MY FRIEND CARD
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
      ? "@" + friend.username
      : "";


  let avatarHTML = "";


  if (friend.avatar_url) {

    avatarHTML =
      '<div class="friend-avatar">' +

      '<img ' +
      'src="' +
      escapeHTML(
        friend.avatar_url
      ) +
      '" ' +
      'alt="' +
      escapeHTML(name) +
      '" ' +
      'class="friend-avatar-img" ' +
      'onerror="this.style.display=\'none\'; this.parentElement.textContent=\'' +
      escapeJS(
        getInitials(name)
      ) +
      '\'"' +
      '>' +

      '</div>';

  } else {

    avatarHTML =
      '<div class="friend-avatar">' +
      escapeHTML(
        getInitials(name)
      ) +
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
   28. LOAD PROFILE
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
      profile && profile.full_name
        ? profile.full_name
        : currentUser.email
          ? currentUser.email.split("@")[0]
          : "Your Name";


    const username =
      profile && profile.username
        ? profile.username
        : "username";


    /* INDEX PROFILE */

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


    /* PROFILE PAGE */

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
      currentUser.email ||
      "Not available"
    );


    /* JOINED DATE */

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


    /* AVATARS */

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


    /* FRIEND COUNT */

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


    /* EDIT PROFILE */

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
   29. OPEN EDIT PROFILE
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
      "index.html#profile";

    return;

  }


  loadProfile();


  modal.style.display =
    "flex";

}


/* =========================================================
   30. CLOSE EDIT PROFILE
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
   31. SAVE EDIT PROFILE
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
   32. PROFILE PAGE
   ========================================================= */

function setupProfilePage() {

  window.editProfile =
    function () {

      if (!currentUser) {

        openAuth();

        return;

      }


      window.location.href =
        "index.html#profile";

    };

}


/* =========================================================
   33. AVATAR UPLOAD SETUP
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


      await uploadAvatar(
        file
      );

    }
  );

}


/* =========================================================
   34. UPLOAD AVATAR
   ========================================================= */

async function uploadAvatar(
  file
) {

  if (!currentUser) {

    alert(
      "Please login first."
    );

    return;

  }


  if (
    !file.type.startsWith(
      "image/"
    )
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

      console.error(
        "Avatar upload error:",
        uploadResult.error
      );

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

      console.error(
        "Avatar profile update:",
        profileResult.error
      );

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
   35. SEARCH ENTER KEY
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
   36. GO TO MY PROFILE
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
    "index.html#profile";

}


/* =========================================================
   37. CLICK OUTSIDE ACCOUNT MENU
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
   38. CLOSE MODALS OUTSIDE
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
      event.target ===
      authModal
    ) {

      closeAuth();

    }


    if (
      editModal &&
      event.target ===
      editModal
    ) {

      closeEditProfile();

    }

  }
);


/* =========================================================
   39. SET TEXT
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
      value === null ||
      value === undefined
        ? ""
        : value;

  }

}


/* =========================================================
   40. SET VALUE
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
      value === null ||
      value === undefined
        ? ""
        : value;

  }

}


/* =========================================================
   41. GET INITIALS
   ========================================================= */

function getInitials(
  name
) {

  if (!name) {
    return "?";
  }


  const words =
    name
      .trim()
      .split(/\s+/);


  if (words.length === 1) {

    return words[0]
      .substring(
        0,
        2
      )
      .toUpperCase();

  }


  return (

    words[0][0] +

    words[
      words.length - 1
    ][0]

  ).toUpperCase();

}


/* =========================================================
   42. UPDATE AVATAR ELEMENT
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


/* =========================================================
   43. ESCAPE HTML
   ========================================================= */

function escapeHTML(
  value
) {

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


/* =========================================================
   44. ESCAPE JAVASCRIPT
   ========================================================= */

function escapeJS(
  value
) {

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
   45. EDIT PROFILE
   ========================================================= */

function editProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  window.location.href =
    "index.html#profile";

}

/* =========================================================
   45. REAL-TIME MESSAGING
   ========================================================= */

let messageRealtimeChannel = null;


/* ---------------------------------------------------------
   START REAL-TIME MESSAGE LISTENER
   --------------------------------------------------------- */

function startMessageRealtime() {

  if (!currentUser) {
    console.log("Realtime chat: user not logged in.");
    return;
  }

  /* Remove previous listener if one exists */

  if (messageRealtimeChannel) {

    supabaseClient.removeChannel(
      messageRealtimeChannel
    );

    messageRealtimeChannel = null;

  }


  console.log(
    "Starting real-time messaging for:",
    currentUser.id
  );


  messageRealtimeChannel =
    supabaseClient
      .channel(
        "messages-realtime-" +
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

          console.log(
            "New real-time message:",
            payload.new
          );

          handleRealtimeMessage(
            payload.new
          );

        }
      )
      .subscribe(
        function (status) {

          console.log(
            "Message realtime status:",
            status
          );

        }
      );

}


/* ---------------------------------------------------------
   HANDLE REAL-TIME MESSAGE
   --------------------------------------------------------- */

function handleRealtimeMessage(
  message
) {

  if (!currentUser) {
    return;
  }


  /*
   * Ignore messages that are not related
   * to the current logged-in user.
   */

  const belongsToCurrentUser =
    message.sender_id === currentUser.id ||
    message.receiver_id === currentUser.id;


  if (!belongsToCurrentUser) {
    return;
  }


  /*
   * If no friend is currently selected,
   * don't add the message to the chat.
   */

  if (!selectedMessageFriend) {
    return;
  }


  /*
   * Check whether this message belongs
   * to the currently open conversation.
   */

  const friendId =
    selectedMessageFriend.id;


  const belongsToOpenConversation =
    (
      message.sender_id === currentUser.id &&
      message.receiver_id === friendId
    )
    ||
    (
      message.sender_id === friendId &&
      message.receiver_id === currentUser.id
    );


  if (!belongsToOpenConversation) {

    console.log(
      "New message belongs to another conversation."
    );

    return;

  }


  /*
   * Add the message directly to the screen.
   */

  appendRealtimeMessage(
    message
  );

}


/* ---------------------------------------------------------
   APPEND MESSAGE TO CHAT
   --------------------------------------------------------- */

function appendRealtimeMessage(message) {

  const chat =
    document.getElementById("chatMessages");

  if (!chat || !currentUser) {
    return;
  }

  /* Check if this message is already displayed */

  if (
    message.id &&
    chat.querySelector(
      '[data-message-id="' +
      CSS.escape(String(message.id)) +
      '"]'
    )
  ) {
    return;
  }

  /* Remove empty state */

  const emptyState =
    chat.querySelector(".empty-state");

  if (emptyState) {
    chat.innerHTML = "";
  }

  /* Create message row */

  const mine =
    message.sender_id === currentUser.id;

  const row =
    document.createElement("div");

  row.className =
    "message-row " +
    (mine ? "mine" : "theirs");

  row.setAttribute(
    "data-message-id",
    String(message.id)
  );

  /* Create bubble */

  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  /* Message text */

  bubble.textContent =
    message.message || "";

  /* Timestamp */

  const time =
    document.createElement("div");

  time.className =
    "message-time";

  time.textContent =
    message.created_at
      ? new Date(
          message.created_at
        ).toLocaleTimeString(
          "en-IN",
          {
            hour: "numeric",
            minute: "2-digit"
          }
        )
      : "";

  bubble.appendChild(time);

  row.appendChild(bubble);

  chat.appendChild(row);

  /* Scroll to newest message */

  chat.scrollTop =
    chat.scrollHeight;

}

/* ---------------------------------------------------------
   STOP REAL-TIME LISTENER
   --------------------------------------------------------- */

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
   46. EXPORT FUNCTIONS
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


/* =========================================================
   END
   ========================================================= */
