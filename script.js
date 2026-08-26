/* =========================================================
   YOUREMO - COMPLETE SCRIPT.JS
   Works with:
   - index.html
   - friends.html
   - profile.html
   - Supabase Auth
   - Profiles
   - Friend Search
   - Friend Requests
   - My Friends
   - Profile Editing
   - Avatar Upload
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
   2. GLOBAL CURRENT USER
   ========================================================= */

let currentUser = null;


/* =========================================================
   3. PAGE START
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("YouRemo script loaded");

  await loadCurrentUser();

  setupAvatarUpload();

  setupProfilePage();

  setupSearchEnterKey();

});


/* =========================================================
   4. GET CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("Get user error:", error);
      return;
    }

    currentUser = data.user || null;

    console.log(
      "Current user:",
      currentUser
    );

    await refreshAccountUI();

    if (currentUser) {

      await loadProfile();

      await loadFriendRequests();

      await loadMyFriends();

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
  async (event, session) => {

    console.log(
      "Auth event:",
      event
    );

    currentUser =
      session?.user || null;

    /*
      Give Supabase a moment to finish
      updating the session before refreshing UI.
    */

    setTimeout(
      async () => {

        await refreshAccountUI();

        if (currentUser) {

          await loadProfile();

          await loadFriendRequests();

          await loadMyFriends();

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
    document.getElementById("loginButton");

  const navAvatar =
    document.getElementById("navAvatar");

  const accountMenu =
    document.getElementById("accountMenu");

  if (!loginButton) {
    return;
  }

  if (!currentUser) {

    loginButton.textContent =
      "Login";

    if (navAvatar) {

      navAvatar.textContent =
        "?";

      navAvatar.style.backgroundImage =
        "none";

    }

    if (accountMenu) {

      accountMenu.style.display =
        "none";

    }

    return;

  }


  /* -------------------------------------------------------
     USER IS LOGGED IN
     ------------------------------------------------------- */

  let profile = null;

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select(
        "id, username, full_name, avatar_url"
      )
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();

    if (!error) {
      profile = data;
    }

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

  }


  const displayName =
    profile?.full_name ||
    profile?.username ||
    currentUser.email?.split("@")[0] ||
    "Account";


  loginButton.textContent =
    displayName;


  if (navAvatar) {

    if (profile?.avatar_url) {

      navAvatar.textContent = "";

      navAvatar.style.backgroundImage =
        `url("${profile.avatar_url}")`;

      navAvatar.style.backgroundSize =
        "cover";

      navAvatar.style.backgroundPosition =
        "center";

      navAvatar.style.backgroundRepeat =
        "no-repeat";

    } else {

      navAvatar.style.backgroundImage =
        "none";

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
    menu.style.display === "block"
  ) {

    menu.style.display =
      "none";

  } else {

    menu.style.display =
      "block";

  }

}


/* =========================================================
   8. OPEN LOGIN / SIGNUP MODAL
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
   10. SHOW LOGIN MODE
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
   11. SHOW SIGNUP MODE
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

  const name =
    document.getElementById(
      "authName"
    )?.value.trim();

  const username =
    document.getElementById(
      "authUsername"
    )?.value.trim();

  const email =
    document.getElementById(
      "authEmail"
    )?.value.trim();

  const password =
    document.getElementById(
      "authPassword"
    )?.value;


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


  if (!password || password.length < 6) {

    alert(
      "Password must be at least 6 characters."
    );

    return;

  }


  try {

    /*
      First check whether username
      already exists.
    */

    const {
      data: existingUsername,
      error: usernameError
    } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq(
        "username",
        username
      )
      .maybeSingle();


    if (
      usernameError &&
      usernameError.code !== "PGRST116"
    ) {

      console.error(
        usernameError
      );

    }


    if (existingUsername) {

      alert(
        "That username is already taken."
      );

      return;

    }


    /* -----------------------------------------------------
       CREATE AUTH ACCOUNT
       ----------------------------------------------------- */

    const {
      data,
      error
    } = await supabaseClient.auth.signUp({

      email: email,

      password: password,

      options: {

        data: {

          full_name: name,

          username: username

        }

      }

    });


    if (error) {

      alert(
        error.message
      );

      return;

    }


    if (!data.user) {

      alert(
        "Account could not be created."
      );

      return;

    }


    /*
      Create profile row.
    */

    const {
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .upsert({

        id: data.user.id,

        full_name: name,

        username: username

      });


    if (profileError) {

      console.error(
        "Profile creation error:",
        profileError
      );

    }


    alert(
      "Account created successfully!"
    );


    closeAuth();


    /*
      Clear form.
    */

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

  const email =
    document.getElementById(
      "authEmail"
    )?.value.trim();

  const password =
    document.getElementById(
      "authPassword"
    )?.value;


  if (!email || !password) {

    alert(
      "Please enter your email and password."
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

      });


    if (error) {

      alert(
        error.message
      );

      return;

    }


    currentUser =
      data.user;


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

    const {
      error
    } =
      await supabaseClient.auth.signOut();


    if (error) {

      alert(
        error.message
      );

      return;

    }


    currentUser = null;


    const menu =
      document.getElementById(
        "accountMenu"
      );

    if (menu) {

      menu.style.display =
        "none";

    }


    await refreshAccountUI();


    /*
      Reload the current page so all
      friend/profile information resets.
    */

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
    id => {

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
   16. FIND FRIENDS BUTTON
   ========================================================= */

function findFriends() {

  const section =
    document.getElementById(
      "friends"
    );

  if (section) {

    section.scrollIntoView({

      behavior: "smooth"

    });

    const input =
      document.getElementById(
        "friendSearch"
      );

    if (input) {

      setTimeout(
        () => input.focus(),
        400
      );

    }

    return;

  }


  /*
    If we're on another page,
    open friends.html.
  */

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

      behavior: "smooth"

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

    results.innerHTML = `

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


  results.innerHTML = `

    <div class="empty-state">

      <div>🔎</div>

      <p>
        Searching...
      </p>

    </div>

  `;


  try {

    /*
      Search both full_name and username.
    */

    const {
      data,
      error
    } = await supabaseClient
      .from("profiles")
      .select(
        "id, username, full_name, avatar_url"
      )
      .or(
        `full_name.ilike.%${escapeSearch(searchTerm)}%,username.ilike.%${escapeSearch(searchTerm)}%`
      )
      .limit(30);


    if (error) {

      console.error(
        "Search error:",
        error
      );

      results.innerHTML = `

        <div class="empty-state">

          <div>⚠️</div>

          <p>
            Unable to search right now.
          </p>

        </div>

      `;

      return;

    }


    /*
      Don't show yourself in search results.
    */

    const people =
      (data || []).filter(
        person =>
          !currentUser ||
          person.id !== currentUser.id
      );


    if (!people.length) {

      results.innerHTML = `

        <div class="empty-state">

          <div>😕</div>

          <h2>No people found</h2>

          <p>
            Try another name or username.
          </p>

        </div>

      `;

      return;

    }


    /*
      Render each result.
    */

    results.innerHTML =
      people
        .map(
          person =>
            createFriendResultCard(
              person
            )
        )
        .join("");


    /*
      Update buttons based on existing
      friend/request status.
    */

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

    results.innerHTML = `

      <div class="empty-state">

        <div>⚠️</div>

        <p>
          Something went wrong.
        </p>

      </div>

    `;

  }

}


/* =========================================================
   CREATE REQUEST CARD - FIXED AVATAR
   ========================================================= */

function createRequestCard(request, sender) {

  const name =
    sender?.full_name ||
    sender?.username ||
    "YouRemo User";

  const username =
    sender?.username
      ? `@${sender.username}`
      : "";

  let avatarHTML = "";

  if (sender?.avatar_url) {

    avatarHTML = `
      <div class="friend-avatar">
        <img
          src="${escapeHTML(sender.avatar_url)}"
          alt="${escapeHTML(name)}"
          class="friend-avatar-img"
          onerror="this.style.display='none'; this.parentElement.textContent='${escapeJS(getInitials(name))}'"
        >
      </div>
    `;

  } else {

    avatarHTML = `
      <div class="friend-avatar">
        ${escapeHTML(getInitials(name))}
      </div>
    `;

  }

  return `
    <div
      class="friend-card"
      data-request-id="${escapeHTML(request.id)}">

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
          class="primary-btn"
          onclick="acceptFriendRequest('${escapeJS(request.id)}')">

          Accept

        </button>

        <button
          class="secondary-btn"
          onclick="declineFriendRequest('${escapeJS(request.id)}')">

          Decline

        </button>

      </div>

    </div>
  `;
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
      person => person.id
    );


  if (!ids.length) {
    return;
  }


  /*
    Check outgoing requests.
  */

  const {
    data: sentRequests,
    error: sentError
  } =
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


  if (sentError) {

    console.error(
      "Sent request lookup:",
      sentError
    );

  }


  /*
    Check incoming requests.
  */

  const {
    data: receivedRequests,
    error: receivedError
  } =
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


  if (receivedError) {

    console.error(
      "Received request lookup:",
      receivedError
    );

  }


  /*
    Check friendships.
  */

  const {
    data: friendships,
    error: friendshipError
  } =
    await supabaseClient
      .from("friendships")
      .select(
        "user_id, friend_id"
      )
      .or(
        `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
      );


  if (friendshipError) {

    console.error(
      "Friendship lookup:",
      friendshipError
    );

  }


  const sentMap =
    new Map(
      (sentRequests || [])
        .map(
          request => [
            request.receiver_id,
            request.status
          ]
        )
    );


  const receivedMap =
    new Map(
      (receivedRequests || [])
        .map(
          request => [
            request.sender_id,
            request.status
          ]
        )
    );


  const friendIds =
    new Set();


  (friendships || [])
    .forEach(
      friendship => {

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
    person => {

      const button =
        document.querySelector(
          `.friend-request-btn[data-user-id="${CSS.escape(person.id)}"]`
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

        button.onclick =
          () => {

            document
              .getElementById(
                "requests"
              )
              ?.scrollIntoView({
                behavior: "smooth"
              });

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

    /*
      Check whether already friends.
    */

    const {
      data: existingFriend
    } =
      await supabaseClient
        .from("friendships")
        .select("id")
        .or(
          `and(user_id.eq.${currentUser.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${currentUser.id})`
        )
        .maybeSingle();


    if (existingFriend) {

      alert(
        "You are already friends."
      );

      return;

    }


    /*
      Check existing request.
    */

    const {
      data: existingRequest
    } =
      await supabaseClient
        .from("friend_requests")
        .select(
          "id, sender_id, receiver_id, status"
        )
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`
        )
        .in(
          "status",
          [
            "pending"
          ]
        )
        .maybeSingle();


    if (existingRequest) {

      if (
        existingRequest.sender_id ===
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


    /*
      Send request.
    */

    const {
      error
    } =
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


    if (error) {

      console.error(
        "Send request error:",
        error
      );

      alert(
        error.message
      );

      return;

    }


    /*
      Change button.
    */

    const button =
      document.querySelector(
        `.friend-request-btn[data-user-id="${CSS.escape(receiverId)}"]`
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


  /*
    These elements don't exist on friends.html.
    That's okay.
  */

  if (!container) {
    return;
  }


  if (!currentUser) {

    container.innerHTML = `

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

    const {
      data,
      error
    } =
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


    if (error) {

      console.error(
        "Friend request loading error:",
        error
      );

      return;

    }


    const requests =
      data || [];


    if (badge) {

      badge.textContent =
        requests.length;

    }


    if (!requests.length) {

      container.innerHTML = `

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


    /*
      Get sender profiles.
    */

    const senderIds =
      requests.map(
        request =>
          request.sender_id
      );


    const {
      data: profiles,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .in(
          "id",
          senderIds
        );


    if (profileError) {

      console.error(
        profileError
      );

    }


    const profileMap =
      new Map(
        (profiles || [])
          .map(
            profile => [
              profile.id,
              profile
            ]
          )
      );


    container.innerHTML =
      requests
        .map(
          request => {

            const sender =
              profileMap.get(
                request.sender_id
              );


            return createRequestCard(
              request,
              sender
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

function createRequestCard(request, sender) {

  const name =
    sender?.full_name ||
    sender?.username ||
    "YouRemo User";

  const username =
    sender?.username
      ? `@${sender.username}`
      : "";

  const avatarHTML = sender?.avatar_url
    ? `
      <div class="friend-avatar">

        <img
          src="${escapeHTML(sender.avatar_url)}"
          alt="${escapeHTML(name)}"
          onerror="this.style.display='none'; this.parentElement.textContent='${escapeJS(getInitials(name))}'"
        >

      </div>
    `
    : `
      <div class="friend-avatar">
        ${escapeHTML(getInitials(name))}
      </div>
    `;

  return `
    <div
      class="friend-card"
      data-request-id="${escapeHTML(request.id)}">

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
          class="primary-btn"
          onclick="acceptFriendRequest('${escapeJS(request.id)}')">

          Accept

        </button>

        <button
          class="secondary-btn"
          onclick="declineFriendRequest('${escapeJS(request.id)}')">

          Decline

        </button>

      </div>

    </div>
  `;
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

    /*
      Get request.
    */

    const {
      data: request,
      error: requestError
    } =
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
      requestError ||
      !request
    ) {

      alert(
        "Friend request could not be found."
      );

      return;

    }


    if (
      request.status !==
      "pending"
    ) {

      alert(
        "This request has already been handled."
      );

      return;

    }


    /*
      Create friendship in both directions.

      This makes it easy to query friends
      regardless of which user sent the request.
    */

    const {
      error: friendshipError
    } =
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


    if (friendshipError) {

      console.error(
        "Friendship creation error:",
        friendshipError
      );

      /*
        If duplicate rows already exist,
        don't immediately fail the whole operation.
      */

      if (
        !friendshipError.message
          ?.toLowerCase()
          .includes("duplicate")
      ) {

        alert(
          friendshipError.message
        );

        return;

      }

    }


    /*
      Mark request accepted.
    */

    const {
      error: updateError
    } =
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


    if (updateError) {

      console.error(
        "Request update error:",
        updateError
      );

      alert(
        updateError.message
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

    const {
      error
    } =
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


    if (error) {

      console.error(
        "Decline request error:",
        error
      );

      alert(
        error.message
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

    container.innerHTML = `

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

    /*
      Get friendship rows where
      current user is involved.
    */

    const {
      data,
      error
    } =
      await supabaseClient
        .from("friendships")
        .select(
          "id, user_id, friend_id"
        )
        .or(
          `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
        );


    if (error) {

      console.error(
        "My friends error:",
        error
      );

      container.innerHTML = `

        <div class="empty-state">

          <div>⚠️</div>

          <p>
            Unable to load friends.
          </p>

        </div>

      `;

      return;

    }


    /*
      Extract friend IDs.
    */

    const friendIds = [];


    (data || []).forEach(
      friendship => {

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


    /*
      Remove duplicates.
    */

    const uniqueFriendIds =
      [...new Set(friendIds)];


    if (countElement) {

      countElement.textContent =
        `${uniqueFriendIds.length} ${
          uniqueFriendIds.length === 1
            ? "Friend"
            : "Friends"
        }`;

    }


    /*
      No friends.
    */

    if (!uniqueFriendIds.length) {

      container.innerHTML = `

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


    /*
      Load profiles.
    */

    const {
      data: profiles,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url"
        )
        .in(
          "id",
          uniqueFriendIds
        );


    if (profileError) {

      console.error(
        "Friend profile error:",
        profileError
      );

      return;

    }


    container.innerHTML =
      (profiles || [])
        .map(
          profile =>
            createMyFriendCard(
              profile
            )
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
   CREATE MY FRIEND CARD - FIXED AVATAR
   ========================================================= */

function createMyFriendCard(friend) {

  const name =
    friend.full_name ||
    friend.username ||
    "YouRemo User";

  const username =
    friend.username
      ? `@${friend.username}`
      : "";

  let avatarHTML = "";

  if (friend.avatar_url) {

    avatarHTML = `
      <div class="friend-avatar">
        <img
          src="${escapeHTML(friend.avatar_url)}"
          alt="${escapeHTML(name)}"
          class="friend-avatar-img"
          onerror="this.style.display='none'; this.parentElement.textContent='${escapeJS(getInitials(name))}'"
        >
      </div>
    `;

  } else {

    avatarHTML = `
      <div class="friend-avatar">
        ${escapeHTML(getInitials(name))}
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

    </div>
  `;
}

/* =========================================================
   28. LOAD PROFILE
   ========================================================= */

async function loadProfile() {

  if (!currentUser) {
    return;
  }


  try {

    const {
      data: profile,
      error
    } =
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


    if (error) {

      console.error(
        "Profile load error:",
        error
      );

      return;

    }


    const name =
      profile?.full_name ||
      currentUser.email?.split("@")[0] ||
      "Your Name";


    const username =
      profile?.username ||
      "username";


    /*
      INDEX.HTML profile
    */

    setText(
      "myProfileName",
      name
    );

    setText(
      "myProfileUsername",
      `@${username}`
    );


    /*
      PROFILE.HTML
    */

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
      `@${username}`
    );

    setText(
      "displayEmail",
      currentUser.email || "Not available"
    );


    /*
      Joined date
    */

    const joinedDate =
      currentUser.created_at;


    if (joinedDate) {

      const formatted =
        new Date(
          joinedDate
        ).toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        );


      setText(
        "joinedDate",
        formatted
      );

    }


    /*
      Avatars
    */

    updateAvatarElement(
      "myProfileAvatar",
      profile?.avatar_url,
      name
    );


    updateAvatarElement(
      "profileAvatar",
      profile?.avatar_url,
      name
    );


    /*
      Friend count on index.
    */

    const {
      data: friendships
    } =
      await supabaseClient
        .from("friendships")
        .select(
          "user_id, friend_id"
        )
        .or(
          `user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`
        );


    const friendIds =
      new Set();


    (friendships || [])
      .forEach(
        friendship => {

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


    /*
      Edit profile fields
    */

    setValue(
      "editProfileName",
      profile?.full_name || ""
    );

    setValue(
      "editProfileUsername",
      profile?.username || ""
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

    /*
      If we're on profile.html,
      go to the homepage profile editor.
    */

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


  const name =
    document.getElementById(
      "editProfileName"
    )?.value.trim();


  const username =
    document.getElementById(
      "editProfileUsername"
    )?.value.trim();


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

    /*
      Check username belongs to another user.
    */

    const {
      data: existing
    } =
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


    if (existing) {

      alert(
        "That username is already taken."
      );

      return;

    }


    const {
      error
    } =
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


    if (error) {

      console.error(
        "Save profile error:",
        error
      );

      alert(
        error.message
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
   32. PROFILE PAGE EDIT BUTTON
   ========================================================= */

function setupProfilePage() {

  /*
    profile.html currently contains an inline
    editProfile() function that shows an alert.

    We replace it here after the page loads so
    the Edit Profile button actually works.
  */

  window.editProfile =
    function () {

      if (!currentUser) {

        openAuth();

        return;

      }


      /*
        Send user to the profile editor
        on index.html.
      */

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
    async event => {

      const file =
        event.target.files?.[0];


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


  /*
    Only allow images.
  */

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


  /*
    Limit file size to 5 MB.
  */

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
      `${currentUser.id}/avatar.${extension}`;


    /*
      Upload to Supabase Storage.

      Bucket name:
      avatars
    */

    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from("avatars")
        .upload(
          filePath,
          file,
          {
            upsert: true,

            cacheControl:
              "3600"

          }
        );


    if (uploadError) {

      console.error(
        "Avatar upload error:",
        uploadError
      );

      alert(
        "Photo upload failed: " +
        uploadError.message
      );

      return;

    }


    /*
      Get public URL.
    */

    const {
      data
    } =
      supabaseClient
        .storage
        .from("avatars")
        .getPublicUrl(
          filePath
        );


    const avatarUrl =
      data?.publicUrl;


    if (!avatarUrl) {

      alert(
        "Could not create image URL."
      );

      return;

    }


    /*
      Save URL to profile.
    */

    const {
      error: profileError
    } =
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


    if (profileError) {

      console.error(
        "Avatar profile update:",
        profileError
      );

      alert(
        profileError.message
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
   35. SEARCH WITH ENTER KEY
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
    event => {

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
   36. MY PROFILE NAVIGATION
   ========================================================= */

function goToMyProfile() {

  if (!currentUser) {

    openAuth();

    return;

  }


  /*
    Close menu.
  */

  const menu =
    document.getElementById(
      "accountMenu"
    );


  if (menu) {

    menu.style.display =
      "none";

  }


  /*
    If already on index.html,
    scroll to profile.
  */

  const profile =
    document.getElementById(
      "profile"
    );


  if (profile) {

    profile.scrollIntoView({

      behavior: "smooth"

    });

    return;

  }


  /*
    Otherwise open index profile.
  */

  window.location.href =
    "index.html#profile";

}


/* =========================================================
   37. CLICK OUTSIDE ACCOUNT MENU
   ========================================================= */

document.addEventListener(
  "click",
  event => {

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
   38. CLOSE MODALS WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
  "click",
  event => {

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
   39. HELPER - TEXT
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
      value ?? "";

  }

}


/* =========================================================
   40. HELPER - INPUT VALUE
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
      value ?? "";

  }

}


/* =========================================================
   41. HELPER - INITIALS
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
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    words[0][0] +
    words[words.length - 1][0]
  ).toUpperCase();

}


/* =========================================================
   42. HELPER - AVATAR ELEMENT
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


  if (avatarUrl) {

    element.textContent =
      "";

    element.style.backgroundImage =
      `url("${avatarUrl}")`;

    element.style.backgroundSize =
      "cover";

    element.style.backgroundPosition =
      "center";

    element.style.backgroundRepeat =
      "no-repeat";

  } else {

    element.style.backgroundImage =
      "none";

    element.textContent =
      getInitials(name);

  }

}


/* =========================================================
   43. HELPER - ESCAPE HTML
   ========================================================= */

function escapeHTML(
  value
) {

  if (value === null ||
      value === undefined) {

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
   44. HELPER - ESCAPE JAVASCRIPT
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
   45. HELPER - SEARCH TEXT
   ========================================================= */

function escapeSearch(
  value
) {

  /*
    Escape characters that could interfere
    with the Supabase PostgREST filter.
  */

  return String(value)
    .replace(
      /[%_]/g,
      "\\$&"
    )
    .replace(
      /,/g,
      "\\,"
    );

}


/* =========================================================
   46. EXPORT FUNCTIONS TO WINDOW
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
   END OF YOUREMO SCRIPT
   ========================================================= */
