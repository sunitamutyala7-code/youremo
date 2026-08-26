// =====================================================
// YouRemo - CLEAN COMPLETE script.js
// Authentication + Profiles + Friends + Mutual Friends
// =====================================================


// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://ykqnqdtekbxnevtjjkbd.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// =====================================================
// GLOBALS
// =====================================================

let friendSearchTimer = null;
let loadingMyFriends = false;


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

  try {

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {

      console.error(
        "Logout error:",
        error
      );

      alert(
        "Unable to logout. Please try again."
      );

      return;
    }

    const accountMenu =
      document.getElementById(
        "accountMenu"
      );

    if (accountMenu) {
      accountMenu.classList.remove("show");
      accountMenu.style.display = "none";
    }

    window.location.hash = "home";

    await refreshAccountUI();

  } catch (error) {

    console.error(
      "Logout failed:",
      error
    );

    alert(
      "Logout failed. Please try again."
    );
  }
}


// =====================================================
// NAVIGATION
// =====================================================

function findFriends() {

  const section =
    document.getElementById(
      "friends"
    );

  if (section) {

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  setTimeout(() => {

    const input =
      document.getElementById(
        "friendSearch"
      );

    if (input) {
      input.focus();
    }

  }, 600);
}


function learnMore() {

  const section =
    document.getElementById(
      "about"
    );

  if (section) {

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


// =====================================================
// AUTH MODAL
// =====================================================

function openAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );

  if (!modal) return;

  modal.style.display = "flex";

  showLogin();
}


function closeAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );

  if (modal) {
    modal.style.display = "none";
  }
}


// =====================================================
// LOGIN FORM
// =====================================================

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

  const email =
    document.getElementById(
      "authEmail"
    );

  const password =
    document.getElementById(
      "authPassword"
    );

  const button =
    document.querySelector(
      ".auth-submit"
    );

  const switchText =
    document.querySelector(
      ".auth-switch"
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
    name.style.display = "none";
  }


  if (username) {
    username.style.display = "none";
  }


  if (email) {
    email.style.display = "block";
  }


  if (password) {
    password.style.display = "block";
  }


  if (button) {

    button.textContent =
      "Login";

    button.onclick =
      login;
  }


  if (switchText) {

    switchText.innerHTML =
      `Don't have an account?
       <span onclick="showSignup()">Sign Up</span>`;
  }
}


// =====================================================
// SIGNUP FORM
// =====================================================

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

  const email =
    document.getElementById(
      "authEmail"
    );

  const password =
    document.getElementById(
      "authPassword"
    );

  const button =
    document.querySelector(
      ".auth-submit"
    );

  const switchText =
    document.querySelector(
      ".auth-switch"
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
    name.style.display = "block";
  }


  if (username) {
    username.style.display = "block";
  }


  if (email) {
    email.style.display = "block";
  }


  if (password) {
    password.style.display = "block";
  }


  if (button) {

    button.textContent =
      "Create Account";

    button.onclick =
      signUp;
  }


  if (switchText) {

    switchText.innerHTML =
      `Already have an account?
       <span onclick="showLogin()">Login</span>`;
  }
}


// =====================================================
// SIGN UP
// =====================================================

async function signUp() {

  const name =
    document
      .getElementById("authName")
      ?.value
      .trim();

  const username =
    document
      .getElementById("authUsername")
      ?.value
      .trim();

  const email =
    document
      .getElementById("authEmail")
      ?.value
      .trim();

  const password =
    document
      .getElementById("authPassword")
      ?.value;


  if (
    !name ||
    !username ||
    !email ||
    !password
  ) {

    alert(
      "Please fill in all fields."
    );

    return;
  }


  if (password.length < 6) {

    alert(
      "Password must be at least 6 characters."
    );

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp({

      email,
      password,

      options: {
        data: {
          full_name: name,
          username: username
        }
      }

    });


  if (error) {

    console.error(
      "Signup error:",
      error
    );

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


  const {
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .upsert({

        id:
          data.user.id,

        username:
          username,

        full_name:
          name

      });


  if (profileError) {

    console.error(
      "Profile error:",
      profileError
    );

    alert(
      profileError.message
    );

    return;
  }


  alert(
    "Account created successfully!"
  );


  closeAuth();

  await refreshAccountUI();
}


// =====================================================
// LOGIN
// =====================================================

async function login() {

  const email =
    document
      .getElementById("authEmail")
      ?.value
      .trim();

  const password =
    document
      .getElementById("authPassword")
      ?.value;


  if (!email || !password) {

    alert(
      "Please enter your email and password."
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient.auth
      .signInWithPassword({

        email,
        password

      });


  if (error) {

    console.error(
      "Login error:",
      error
    );

    alert(
      error.message
    );

    return;
  }


  alert(
    "Login successful!"
  );


  closeAuth();

  await refreshAccountUI();
}


// =====================================================
// ACCOUNT BUTTON
// =====================================================

async function handleAccountClick() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth
      .getSession();


  if (!session) {

    openAuth();

    return;
  }


  const accountMenu =
    document.getElementById(
      "accountMenu"
    );


  if (accountMenu) {

    accountMenu.classList.toggle(
      "show"
    );

    if (
      accountMenu.classList.contains(
        "show"
      )
    ) {

      accountMenu.style.display =
        "block";

    } else {

      accountMenu.style.display =
        "none";
    }
  }
}


// =====================================================
// LOGIN BUTTON SETUP
// =====================================================

function setupLoginButton() {

  const loginButton =
    document.getElementById(
      "loginButton"
    );


  if (!loginButton) {

    console.warn(
      "loginButton not found."
    );

    return;
  }


  loginButton.onclick =
    function(event) {

      event.preventDefault();
      event.stopPropagation();

      handleAccountClick();
    };


  console.log(
    "Login / Account button connected."
  );
}


// =====================================================
// UPDATE LOGIN BUTTON
// =====================================================

async function updateLoginButton() {

  const button =
    document.getElementById(
      "loginButton"
    );

  const navAvatar =
    document.getElementById(
      "navAvatar"
    );


  if (!button) return;


  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth
      .getSession();


  if (!session) {

    button.textContent =
      "Login";


    if (navAvatar) {

      navAvatar.innerHTML = "";

      navAvatar.textContent =
        "?";
    }


    return;
  }


  const user =
    session.user;


  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "full_name, username, avatar_url"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

    button.textContent =
      "Account";

    return;
  }


  const displayName =
    profile?.full_name ||
    profile?.username ||
    "Account";


  button.textContent =
    displayName;


  if (navAvatar) {

    if (profile?.avatar_url) {

      navAvatar.innerHTML =
        `
        <img
          src="${escapeAttribute(profile.avatar_url)}?v=${Date.now()}"
          alt="Profile"
        >
        `;

    } else {

      navAvatar.innerHTML = "";

      navAvatar.textContent =
        displayName
          .charAt(0)
          .toUpperCase();
    }
  }
}


// =====================================================
// REFRESH ENTIRE ACCOUNT UI
// =====================================================

async function refreshAccountUI() {

  console.log(
    "Refreshing account UI..."
  );


  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth
      .getSession();


  const searchInput =
    document.getElementById(
      "friendSearch"
    );


  const friendResults =
    document.getElementById(
      "friendResults"
    );


  if (searchInput) {

    searchInput.value = "";
    searchInput.blur();
  }


  if (friendResults) {

    friendResults.innerHTML =
      "";
  }


  if (!session) {

    resetProfileUI();

    resetFriendCounts();

    await updateLoginButton();

    showLoggedOutFriendUI();

    return;
  }


  await updateLoginButton();

  await loadMyProfile();

  await loadFriendRequests();

  await loadMyFriends();
}


// =====================================================
// LOGGED OUT FRIEND UI
// =====================================================

function showLoggedOutFriendUI() {

  const friendRequests =
    document.getElementById(
      "friendRequests"
    );


  if (friendRequests) {

    friendRequests.innerHTML =
      "<p>Please login to see friend requests.</p>";
  }


  const requestBadge =
    document.getElementById(
      "requestBadge"
    );


  if (requestBadge) {

    requestBadge.textContent =
      "0";

    requestBadge.style.display =
      "none";
  }


  const myFriends =
    document.getElementById(
      "myFriendsList"
    );


  if (myFriends) {

    myFriends.innerHTML =
      "<p>Please login to see your friends.</p>";
  }
}


// =====================================================
// RESET PROFILE
// =====================================================

function resetProfileUI() {

  const avatar =
    document.getElementById(
      "myProfileAvatar"
    );

  const name =
    document.getElementById(
      "myProfileName"
    );

  const username =
    document.getElementById(
      "myProfileUsername"
    );


  if (avatar) {

    avatar.innerHTML = "";
    avatar.textContent =
      "?";
  }


  if (name) {

    name.textContent =
      "Your Name";
  }


  if (username) {

    username.textContent =
      "@username";
  }
}


// =====================================================
// RESET FRIEND COUNTS
// =====================================================

function resetFriendCounts() {

  const friendCount =
    document.getElementById(
      "friendCount"
    );

  const profileFriendCount =
    document.getElementById(
      "profileFriendCount"
    );


  if (friendCount) {

    friendCount.textContent =
      "0 Friends";
  }


  if (profileFriendCount) {

    profileFriendCount.textContent =
      "0";
  }
}


// =====================================================
// SEARCH FRIENDS
// =====================================================

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


  const searchText =
    input.value.trim();


  if (!searchText) {

    results.innerHTML =
      "";

    return;
  }


  if (searchText.length < 2) {

    results.innerHTML =
      "<p>Type at least 2 characters.</p>";

    return;
  }


  clearTimeout(
    friendSearchTimer
  );


  friendSearchTimer =
    setTimeout(
      async function() {

        const {
          data: {
            user
          },
          error: userError
        } =
          await supabaseClient.auth
            .getUser();


        if (
          userError ||
          !user
        ) {

          results.innerHTML =
            "<p>Please login first.</p>";

          return;
        }


        results.innerHTML =
          "<p>Searching...</p>";


        const safeSearch =
          searchText
            .replace(/,/g, "")
            .replace(/%/g, "");


        const {
          data: users,
          error: searchError
        } =
          await supabaseClient
            .from("profiles")
            .select(
              "id, username, full_name, avatar_url"
            )
            .or(
              `username.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`
            )
            .limit(20);


        if (searchError) {

          console.error(
            "Search users error:",
            searchError
          );

          results.innerHTML =
            "<p>Unable to search users.</p>";

          return;
        }


        const otherUsers =
          (users || []).filter(
            person =>
              person.id !== user.id
          );


        if (
          otherUsers.length === 0
        ) {

          results.innerHTML =
            "<p>No users found.</p>";

          return;
        }


        results.innerHTML =
          "";


        for (
          const person
          of otherUsers
        ) {

          await createSearchFriendCard(
            person,
            user,
            results
          );
        }

      },
      250
    );
}


// =====================================================
// CREATE SEARCH FRIEND CARD
// =====================================================

async function createSearchFriendCard(
  person,
  currentUser,
  results
) {

  const relationship =
    await getRelationshipStatus(
      currentUser.id,
      person.id
    );


  const mutualProfiles =
    await getMutualFriendProfiles(
      currentUser.id,
      person.id
    );


  const name =
    person.full_name ||
    "User";


  const username =
    person.username ||
    "username";


  const avatarHTML =
    createProfileAvatarHTML(
      person
    );


  const buttonHTML =
    createRelationshipButton(
      relationship,
      person.id
    );


  const mutualHTML =
    createMutualFriendsHTML(
      mutualProfiles
    );


  const card =
    document.createElement(
      "div"
    );


  card.className =
    "friend-card profile-clickable";


  card.style.cursor =
    "pointer";


  card.innerHTML =
    `
      <div class="avatar">
        ${avatarHTML}
      </div>

      <div class="friend-info">

        <h3>
          ${escapeHTML(name)}
        </h3>

        <p>
          @${escapeHTML(username)}
        </p>

        ${mutualHTML}

      </div>

      ${buttonHTML}
    `;


  card.addEventListener(
    "click",
    function(event) {

      if (
        event.target.closest("button")
      ) {
        return;
      }

      openUserProfile(
        person.id
      );
    }
  );


  results.appendChild(
    card
  );
}


// =====================================================
// RELATIONSHIP STATUS
// =====================================================

async function getRelationshipStatus(
  currentUserId,
  otherUserId
) {

  if (
    !currentUserId ||
    !otherUserId
  ) {

    return {
      type: "none",
      status: "none",
      requestId: null
    };
  }


  const {
    data: friendship,
    error: friendshipError
  } =
    await supabaseClient
      .from("friendships")
      .select(
        "id, user_id, friend_id"
      )
      .or(
        `and(user_id.eq.${currentUserId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${currentUserId})`
      )
      .limit(1)
      .maybeSingle();


  if (friendshipError) {

    console.error(
      "Friendship check error:",
      friendshipError
    );
  }


  if (friendship) {

    return {
      type: "friends",
      status: "friend",
      requestId: null
    };
  }


  const {
    data: requests,
    error: requestError
  } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id, status"
      )
      .eq(
        "status",
        "pending"
      )
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order(
        "id",
        {
          ascending: false
        }
      )
      .limit(1);


  if (requestError) {

    console.error(
      "Friend request check error:",
      requestError
    );
  }


  const request =
    requests?.[0];


  if (!request) {

    return {
      type: "none",
      status: "none",
      requestId: null
    };
  }


  if (
    request.sender_id ===
    currentUserId
  ) {

    return {
      type: "request-sent",
      status: "sent",
      requestId: request.id
    };
  }


  if (
    request.receiver_id ===
    currentUserId
  ) {

    return {
      type: "request-received",
      status: "received",
      requestId: request.id
    };
  }


  return {
    type: "none",
    status: "none",
    requestId: null
  };
}


// =====================================================
// RELATIONSHIP BUTTON
// =====================================================

function createRelationshipButton(
  relationship,
  otherUserId
) {

  if (
    relationship.status ===
    "friend"
  ) {

    return `
      <button
        class="friend-button friends-button"
        disabled>

        ✓ Friends

      </button>
    `;
  }


  if (
    relationship.status ===
    "sent"
  ) {

    return `
      <button
        class="friend-button"
        disabled>

        ✓ Request Sent

      </button>
    `;
  }


  if (
    relationship.status ===
    "received"
  ) {

    return `
      <button
        class="friend-button"
        onclick="acceptFriendRequest('${relationship.requestId}')">

        ✓ Accept Request

      </button>
    `;
  }


  return `
    <button
      class="friend-button"
      data-user-id="${escapeAttribute(otherUserId)}"
      onclick="addFriend(this)">

      ＋ Add Friend

    </button>
  `;
}


// =====================================================
// ADD FRIEND
// =====================================================

async function addFriend(button) {

  if (!button) {
    return;
  }


  const receiverId =
    button.dataset.userId;


  if (!receiverId) {
    return;
  }


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }


  if (
    user.id ===
    receiverId
  ) {

    return;
  }


  button.disabled =
    true;


  const relationship =
    await getRelationshipStatus(
      user.id,
      receiverId
    );


  if (
    relationship.status ===
    "friend"
  ) {

    button.textContent =
      "✓ Friends";

    return;
  }


  if (
    relationship.status ===
    "sent"
  ) {

    button.textContent =
      "✓ Request Sent";

    return;
  }


  if (
    relationship.status ===
    "received"
  ) {

    button.disabled =
      false;

    button.textContent =
      "✓ Accept Request";

    button.onclick =
      function() {

        acceptFriendRequest(
          relationship.requestId
        );
      };

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("friend_requests")
      .insert({

        sender_id:
          user.id,

        receiver_id:
          receiverId,

        status:
          "pending"

      });


  if (error) {

    console.error(
      "Send friend request error:",
      error
    );

    button.disabled =
      false;

    alert(
      error.message
    );

    return;
  }


  button.textContent =
    "✓ Request Sent";
}


// =====================================================
// FRIEND REQUESTS
// =====================================================

async function loadFriendRequests() {

  const container =
    document.getElementById(
      "friendRequests"
    );


  if (!container) {
    return;
  }


  const badge =
    document.getElementById(
      "requestBadge"
    );


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {

    container.innerHTML =
      "<p>Please login to see friend requests.</p>";

    if (badge) {

      badge.textContent =
        "0";

      badge.style.display =
        "none";
    }

    return;
  }


  const {
    data: requests,
    error
  } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id, status"
      )
      .eq(
        "receiver_id",
        user.id
      )
      .eq(
        "status",
        "pending"
      )
      .order(
        "id",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Friend requests error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load friend requests.</p>";

    if (badge) {

      badge.textContent =
        "0";

      badge.style.display =
        "none";
    }

    return;
  }


  container.innerHTML =
    "";


  const count =
    requests?.length || 0;


  if (badge) {

    badge.textContent =
      String(count);

    badge.style.display =
      count > 0
        ? "inline-flex"
        : "none";
  }


  if (count === 0) {

    container.innerHTML =
      "<p>No new friend requests.</p>";

    return;
  }


  for (
    const request
    of requests
  ) {

    const {
      data: profile
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, full_name, username, avatar_url"
        )
        .eq(
          "id",
          request.sender_id
        )
        .maybeSingle();


    const name =
      profile?.full_name ||
      "User";


    const username =
      profile?.username ||
      "username";


    const avatarHTML =
      createProfileAvatarHTML(
        profile
      );


    const card =
      document.createElement(
        "div"
      );


    card.className =
      "friend-card";


    card.innerHTML =
      `
        <div class="avatar">
          ${avatarHTML}
        </div>

        <div
          class="friend-info"
          style="cursor:pointer">

          <h3>
            ${escapeHTML(name)}
          </h3>

          <p>
            @${escapeHTML(username)}
          </p>

        </div>

        <button
          onclick="acceptFriendRequest('${request.id}')">

          Accept

        </button>

        <button
          class="secondary-request"
          onclick="declineFriendRequest('${request.id}')">

          Decline

        </button>
      `;


    card
      .querySelector(
        ".friend-info"
      )
      ?.addEventListener(
        "click",
        function() {

          openUserProfile(
            request.sender_id
          );
        }
      );


    container.appendChild(
      card
    );
  }
}


// =====================================================
// ACCEPT FRIEND REQUEST
// =====================================================

async function acceptFriendRequest(
  requestId
) {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }


  const {
    data: request,
    error
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
        user.id
      )
      .eq(
        "status",
        "pending"
      )
      .single();


  if (
    error ||
    !request
  ) {

    alert(
      "Friend request not found."
    );

    return;
  }


  const {
    data: existingFriendship
  } =
    await supabaseClient
      .from("friendships")
      .select(
        "id"
      )
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${request.sender_id}),and(user_id.eq.${request.sender_id},friend_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();


  if (!existingFriendship) {

    const {
      error:
        friendshipError
    } =
      await supabaseClient
        .from("friendships")
        .insert([

          {
            user_id:
              user.id,

            friend_id:
              request.sender_id
          },

          {
            user_id:
              request.sender_id,

            friend_id:
              user.id
          }

        ]);


    if (friendshipError) {

      console.error(
        "Friendship error:",
        friendshipError
      );

      alert(
        friendshipError.message
      );

      return;
    }
  }


  const {
    error:
      updateError
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
      )
      .eq(
        "receiver_id",
        user.id
      );


  if (updateError) {

    alert(
      updateError.message
    );

    return;
  }


  alert(
    "Friend added successfully! 🎉"
  );


  await loadFriendRequests();

  await loadMyFriends();

  await loadMyProfile();

  await updateLoginButton();
}


// =====================================================
// DECLINE FRIEND REQUEST
// =====================================================

async function declineFriendRequest(
  requestId
) {

  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }


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
        user.id
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
}


// =====================================================
// LOAD MY FRIENDS
// =====================================================

async function loadMyFriends() {

  if (loadingMyFriends) {
    return;
  }


  loadingMyFriends =
    true;


  try {

    const container =
      document.getElementById(
        "myFriendsList"
      );


    if (!container) {
      return;
    }


    const {
      data: {
        user
      }
    } =
      await supabaseClient.auth
        .getUser();


    if (!user) {

      container.innerHTML =
        "<p>Please login to see your friends.</p>";

      return;
    }


    const {
      data: friendships,
      error
    } =
      await supabaseClient
        .from("friendships")
        .select(
          "friend_id"
        )
        .eq(
          "user_id",
          user.id
        );


    if (error) {

      console.error(
        "Friends loading error:",
        error
      );

      container.innerHTML =
        "<p>Unable to load friends.</p>";

      return;
    }


    const friendIds =
      [
        ...new Set(
          (friendships || [])
            .map(
              friendship =>
                friendship.friend_id
            )
        )
      ];


    const totalFriends =
      friendIds.length;


    updateFriendCounts(
      totalFriends
    );


    container.innerHTML =
      "";


    if (friendIds.length === 0) {

      container.innerHTML =
        "<p>You don't have any friends yet.</p>";

      return;
    }


    for (
      const friendId
      of friendIds
    ) {

      const {
        data: profile
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id, full_name, username, avatar_url"
          )
          .eq(
            "id",
            friendId
          )
          .maybeSingle();


      if (!profile) {
        continue;
      }


      const name =
        profile.full_name ||
        "User";


      const username =
        profile.username ||
        "username";


      const avatarHTML =
        createProfileAvatarHTML(
          profile
        );


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "friend-card friend-clickable profile-clickable";


      card.style.cursor =
        "pointer";


      card.innerHTML =
        `
          <div class="avatar">
            ${avatarHTML}
          </div>

          <div class="friend-info">

            <h3>
              ${escapeHTML(name)}
            </h3>

            <p>
              @${escapeHTML(username)}
            </p>

          </div>

          <span class="friend-status">
            ✓ Friends
          </span>
        `;


      card.addEventListener(
        "click",
        function() {

          openUserProfile(
            profile.id
          );
        }
      );


      container.appendChild(
        card
      );
    }

  } catch (error) {

    console.error(
      "Unexpected error loading friends:",
      error
    );

  } finally {

    loadingMyFriends =
      false;
  }
}


// =====================================================
// UPDATE FRIEND COUNTS
// =====================================================

function updateFriendCounts(
  totalFriends
) {

  const friendCount =
    document.getElementById(
      "friendCount"
    );

  const profileFriendCount =
    document.getElementById(
      "profileFriendCount"
    );


  if (friendCount) {

    friendCount.textContent =
      `${totalFriends} ${
        totalFriends === 1
          ? "Friend"
          : "Friends"
      }`;
  }


  if (profileFriendCount) {

    profileFriendCount.textContent =
      String(totalFriends);
  }
}


// =====================================================
// LOAD MY PROFILE
// =====================================================

async function loadMyProfile() {

  const avatar =
    document.getElementById(
      "myProfileAvatar"
    );

  const nameElement =
    document.getElementById(
      "myProfileName"
    );

  const usernameElement =
    document.getElementById(
      "myProfileUsername"
    );


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {

    resetProfileUI();

    return;
  }


  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile loading error:",
      error
    );

    return;
  }


  if (!profile) {
    return;
  }


  const name =
    profile.full_name ||
    "User";


  const username =
    profile.username ||
    "username";


  if (nameElement) {

    nameElement.textContent =
      name;
  }


  if (usernameElement) {

    usernameElement.textContent =
      "@" + username;
  }


  if (avatar) {

    if (profile.avatar_url) {

      avatar.innerHTML =
        `
        <img
          src="${escapeAttribute(profile.avatar_url)}?v=${Date.now()}"
          alt="Profile picture"
        >
        `;

    } else {

      avatar.innerHTML = "";

      avatar.textContent =
        name
          .charAt(0)
          .toUpperCase();
    }
  }
}


// =====================================================
// OPEN USER PROFILE
// =====================================================

async function openUserProfile(
  userId
) {

  if (!userId) {
    return;
  }


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }


  if (
    user.id ===
    userId
  ) {

    return;
  }


  const oldModal =
    document.getElementById(
      "userProfileModal"
    );


  if (oldModal) {
    oldModal.remove();
  }


  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url"
      )
      .eq(
        "id",
        userId
      )
      .maybeSingle();


  if (error || !profile) {

    console.error(
      "User profile error:",
      error
    );

    alert(
      "Unable to load this profile."
    );

    return;
  }


  const relationship =
    await getRelationshipStatus(
      user.id,
      userId
    );


  const mutualProfiles =
    await getMutualFriendProfiles(
      user.id,
      userId
    );


  const friendCount =
    await getUserFriendCount(
      userId
    );


  const name =
    profile.full_name ||
    "User";


  const username =
    profile.username ||
    "username";


  const avatarHTML =
    createProfileAvatarHTML(
      profile
    );


  const actionHTML =
    createProfileActionHTML(
      relationship,
      userId
    );


  const mutualHTML =
    createMutualProfileSection(
      mutualProfiles
    );


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "userProfileModal";


  modal.className =
    "auth-modal";


  modal.style.display =
    "flex";


  modal.innerHTML =
    `
      <div
        class="auth-box user-profile-box">

        <button
          class="close-auth"
          onclick="closeUserProfile()">

          ×

        </button>


        <div
          class="profile-avatar-large user-profile-avatar">

          ${avatarHTML}

        </div>


        <h2>
          ${escapeHTML(name)}
        </h2>


        <p class="user-profile-username">
          @${escapeHTML(username)}
        </p>


        <div class="profile-friend-count">

          👥

          <strong>
            ${friendCount}
          </strong>

          ${
            friendCount === 1
              ? "Friend"
              : "Friends"
          }

        </div>


        <div class="user-profile-status">

          ${actionHTML}

        </div>


        <div id="profileMutualFriends">

          ${mutualHTML}

        </div>


        <div class="user-profile-info">

          <strong>
            YouRemo User
          </strong>

        </div>

      </div>
    `;


  modal.addEventListener(
    "click",
    function(event) {

      if (
        event.target ===
        modal
      ) {

        closeUserProfile();
      }
    }
  );


  document.body.appendChild(
    modal
  );
}


// =====================================================
// PROFILE ACTION BUTTON
// =====================================================

function createProfileActionHTML(
  relationship,
  userId
) {

  if (
    relationship.status ===
    "friend"
  ) {

    return `
      <button
        class="profile-friend-btn friends"
        disabled>

        ✓ Friends

      </button>
    `;
  }


  if (
    relationship.status ===
    "sent"
  ) {

    return `
      <button
        class="profile-friend-btn"
        disabled>

        ✓ Request Sent

      </button>
    `;
  }


  if (
    relationship.status ===
    "received"
  ) {

    return `
      <button
        class="profile-friend-btn"
        onclick="acceptFriendRequest('${relationship.requestId}')">

        ✓ Accept Request

      </button>
    `;
  }


  return `
    <button
      class="profile-friend-btn"
      onclick="sendFriendRequestFromProfile('${escapeAttribute(userId)}', this)">

      ＋ Add Friend

    </button>
  `;
}


// =====================================================
// SEND FRIEND REQUEST FROM PROFILE
// =====================================================

async function sendFriendRequestFromProfile(
  receiverId,
  button
) {

  if (!receiverId) {
    return;
  }


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }


  const relationship =
    await getRelationshipStatus(
      user.id,
      receiverId
    );


  if (
    relationship.status ===
    "friend"
  ) {

    button.textContent =
      "✓ Friends";

    button.disabled =
      true;

    return;
  }


  if (
    relationship.status ===
    "sent"
  ) {

    button.textContent =
      "✓ Request Sent";

    button.disabled =
      true;

    return;
  }


  if (
    relationship.status ===
    "received"
  ) {

    button.textContent =
      "✓ Accept Request";

    button.onclick =
      async function() {

        await acceptFriendRequest(
          relationship.requestId
        );

        closeUserProfile();
      };

    return;
  }


  button.disabled =
    true;


  const {
    error
  } =
    await supabaseClient
      .from("friend_requests")
      .insert({

        sender_id:
          user.id,

        receiver_id:
          receiverId,

        status:
          "pending"

      });


  if (error) {

    console.error(
      "Profile request error:",
      error
    );

    button.disabled =
      false;

    alert(
      error.message
    );

    return;
  }


  button.textContent =
    "✓ Request Sent";
}


// =====================================================
// GET USER FRIEND COUNT
// =====================================================

async function getUserFriendCount(
  userId
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("friendships")
      .select(
        "friend_id"
      )
      .eq(
        "user_id",
        userId
      );


  if (error) {

    console.error(
      "Friend count error:",
      error
    );

    return 0;
  }


  return [
    ...new Set(
      (data || [])
        .map(
          row =>
            row.friend_id
        )
    )
  ].length;
}


// =====================================================
// MUTUAL FRIENDS
// =====================================================

async function getMutualFriendIds(
  currentUserId,
  otherUserId
) {

  if (
    !currentUserId ||
    !otherUserId
  ) {

    return [];
  }


  const {
    data: myRows,
    error: myError
  } =
    await supabaseClient
      .from("friendships")
      .select(
        "friend_id"
      )
      .eq(
        "user_id",
        currentUserId
      );


  if (myError) {

    console.error(
      "My friends error:",
      myError
    );

    return [];
  }


  const {
    data: theirRows,
    error: theirError
  } =
    await supabaseClient
      .from("friendships")
      .select(
        "friend_id"
      )
      .eq(
        "user_id",
        otherUserId
      );


  if (theirError) {

    console.error(
      "Other friends error:",
      theirError
    );

    return [];
  }


  const myIds =
    new Set(
      (myRows || [])
        .map(
          row =>
            row.friend_id
        )
    );


  return [
    ...new Set(
      (theirRows || [])
        .map(
          row =>
            row.friend_id
        )
        .filter(
          id =>
            myIds.has(id) &&
            id !== currentUserId &&
            id !== otherUserId
        )
    )
  ];
}


// =====================================================
// GET MUTUAL FRIEND PROFILES
// =====================================================

async function getMutualFriendProfiles(
  currentUserId,
  otherUserId
) {

  const mutualIds =
    await getMutualFriendIds(
      currentUserId,
      otherUserId
    );


  if (
    mutualIds.length === 0
  ) {

    return [];
  }


  const {
    data: profiles,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url"
      )
      .in(
        "id",
        mutualIds
      );


  if (error) {

    console.error(
      "Mutual profile error:",
      error
    );

    return [];
  }


  return profiles || [];
}


// =====================================================
// MUTUAL FRIEND HTML
// =====================================================

function createMutualFriendsHTML(
  profiles
) {

  if (
    !profiles ||
    profiles.length === 0
  ) {

    return "";
  }


  const count =
    profiles.length;


  const preview =
    profiles
      .slice(0, 5)
      .map(
        profile => {

          return `
            <div
              class="mutual-avatar"
              title="${escapeAttribute(
                profile.full_name ||
                profile.username ||
                "User"
              )}">

              ${createProfileAvatarHTML(profile)}

            </div>
          `;
        }
      )
      .join("");


  return `
    <div class="mutual-friends">

      <div class="mutual-avatar-list">

        ${preview}

      </div>

      <span>
        ${count}
        mutual
        ${count === 1 ? "friend" : "friends"}
      </span>

    </div>
  `;
}


// =====================================================
// MUTUAL PROFILE SECTION
// =====================================================

function createMutualProfileSection(
  profiles
) {

  if (
    !profiles ||
    profiles.length === 0
  ) {

    return `
      <div class="profile-mutual-section">

        <h3>
          🤝 Mutual Friends
        </h3>

        <p>
          No mutual friends yet.
        </p>

      </div>
    `;
  }


  const items =
    profiles
      .slice(0, 5)
      .map(
        profile => {

          const name =
            profile.full_name ||
            profile.username ||
            "User";


          return `
            <div
              class="mutual-profile-item"
              onclick="openUserProfile('${escapeAttribute(profile.id)}')">

              <div class="avatar">

                ${createProfileAvatarHTML(profile)}

              </div>

              <div>

                <strong>
                  ${escapeHTML(name)}
                </strong>

                <small>
                  @${escapeHTML(
                    profile.username ||
                    "username"
                  )}
                </small>

              </div>

            </div>
          `;
        }
      )
      .join("");


  return `
    <div class="profile-mutual-section">

      <h3>
        🤝 Mutual Friends
      </h3>

      <p>
        You have
        <strong>
          ${profiles.length}
        </strong>
        mutual
        ${profiles.length === 1 ? "friend" : "friends"}.
      </p>

      ${items}

    </div>
  `;
}


// =====================================================
// PROFILE AVATAR
// =====================================================

function createProfileAvatarHTML(
  profile
) {

  if (!profile) {
    return "?";
  }


  const name =
    profile.full_name ||
    profile.username ||
    "User";


  if (profile.avatar_url) {

    return `
      <img
        src="${escapeAttribute(profile.avatar_url)}?v=${Date.now()}"
        alt="${escapeAttribute(name)}"
      >
    `;
  }


  return escapeHTML(
    name
      .charAt(0)
      .toUpperCase()
  );
}


// =====================================================
// CLOSE USER PROFILE
// =====================================================

function closeUserProfile() {

  const modal =
    document.getElementById(
      "userProfileModal"
    );


  if (modal) {
    modal.remove();
  }
}


// =====================================================
// GO TO MY PROFILE
// =====================================================

function goToMyProfile() {

  const profile =
    document.getElementById(
      "myProfile"
    );


  if (profile) {

    profile.scrollIntoView({
      behavior: "smooth"
    });
  }
}


// =====================================================
// ESCAPE HTML
// =====================================================

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


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );
}


// =====================================================
// PROFILE CSS
// =====================================================

function setupProfileStyles() {

  if (
    document.getElementById(
      "youremo-profile-styles"
    )
  ) {

    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "youremo-profile-styles";


  style.textContent = `

    .profile-clickable {
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }


    .profile-clickable:hover {
      transform:
        translateY(-2px);
    }


    .mutual-friends {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      padding: 8px 10px;
      border-radius: 10px;
      background: #f8fafc;
      font-size: 13px;
      color: #64748b;
    }


    .mutual-avatar-list {
      display: flex;
      align-items: center;
    }


    .mutual-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid white;
      margin-left: -7px;
    }


    .mutual-avatar:first-child {
      margin-left: 0;
    }


    .mutual-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }


    .user-profile-box {
      position: relative;
    }


    .user-profile-avatar {
      overflow: hidden;
    }


    .user-profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }


    .profile-friend-count {
      margin-top: 10px;
      color: #64748b;
    }


    .profile-friend-btn {
      margin-top: 15px;
      padding: 11px 22px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
    }


    .profile-friend-btn:disabled {
      cursor: default;
      opacity: 0.85;
    }


    .profile-mutual-section {
      margin-top: 20px;
      text-align: left;
    }


    .profile-mutual-section h3 {
      margin-bottom: 8px;
    }


    .mutual-profile-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-radius: 10px;
      cursor: pointer;
    }


    .mutual-profile-item:hover {
      background: #f8fafc;
    }


    .mutual-profile-item .avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }


    .mutual-profile-item .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }


    .mutual-profile-item small {
      display: block;
      color: #64748b;
    }


    .user-profile-info {
      margin-top: 15px;
      color: #64748b;
    }

  `;


  document.head.appendChild(
    style
  );
}


// =====================================================
// AUTH STATE CHANGE
// =====================================================

supabaseClient.auth.onAuthStateChange(
  async function(event, session) {

    console.log(
      "Auth event:",
      event
    );


    // Let Supabase finish its auth event
    setTimeout(
      function() {

        refreshAccountUI();

      },
      100
    );
  }
);


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    setupProfileStyles();

    setupLoginButton();

    refreshAccountUI();

    console.log(
      "YouRemo initialized successfully."
    );
  }
);


// =====================================================
// ESC KEY
// =====================================================

document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Escape"
    ) {

      closeUserProfile();

      closeAuth();
    }
  }
);
