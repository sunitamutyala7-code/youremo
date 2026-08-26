// =====================================================
// YouRemo - Complete script.js
// User Profiles + Mutual Friends + Friendship Detection
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
// NAVIGATION
// =====================================================

function findFriends() {

  const section =
    document.getElementById("friends");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth"
    });
  }

  setTimeout(() => {

    const input =
      document.getElementById("friendSearch");

    if (input) {
      input.focus();
    }

  }, 600);
}


function learnMore() {

  const section =
    document.getElementById("about");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth"
    });
  }
}


// =====================================================
// AUTH MODAL
// =====================================================

function openAuth() {

  const modal =
    document.getElementById("authModal");

  if (!modal) return;

  modal.style.display = "flex";

  showLogin();
}


function closeAuth() {

  const modal =
    document.getElementById("authModal");

  if (modal) {
    modal.style.display = "none";
  }
}


function showLogin() {

  const title =
    document.getElementById("authTitle");

  const subtitle =
    document.getElementById("authSubtitle");

  const name =
    document.getElementById("authName");

  const username =
    document.getElementById("authUsername");

  const email =
    document.getElementById("authEmail");

  const password =
    document.getElementById("authPassword");

  const button =
    document.querySelector(".auth-submit");

  const switchText =
    document.querySelector(".auth-switch");


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
    button.textContent = "Login";
    button.onclick = login;
  }


  if (switchText) {

    switchText.innerHTML =
      `Don't have an account?
       <span onclick="showSignup()">Sign Up</span>`;
  }
}


function showSignup() {

  const title =
    document.getElementById("authTitle");

  const subtitle =
    document.getElementById("authSubtitle");

  const name =
    document.getElementById("authName");

  const username =
    document.getElementById("authUsername");

  const email =
    document.getElementById("authEmail");

  const password =
    document.getElementById("authPassword");

  const button =
    document.querySelector(".auth-submit");

  const switchText =
    document.querySelector(".auth-switch");


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

    alert(error.message);

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

        id: data.user.id,

        username: username,

        full_name: name

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

    alert(error.message);

    return;
  }


  alert(
    "Login successful!"
  );


  closeAuth();

  await refreshAccountUI();
}


// =====================================================
// REFRESH ACCOUNT UI
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

    friendResults.innerHTML = "";
  }


  // -------------------------------------------------
  // LOGGED OUT
  // -------------------------------------------------

  if (!session) {

    resetProfileUI();

    resetFriendCounts();

    await updateLoginButton();


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


    return;
  }


  // -------------------------------------------------
  // LOGGED IN
  // -------------------------------------------------

  await updateLoginButton();

  await loadMyProfile();

  await loadFriendRequests();

  await loadMyFriends();
}


// =====================================================
// RESET PROFILE UI
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
// LOGIN BUTTON / NAVBAR
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


  button.textContent =
    profile?.full_name ||
    profile?.username ||
    "Account";


  if (navAvatar) {

    if (profile?.avatar_url) {

      navAvatar.innerHTML =
        `
        <img
          src="${profile.avatar_url}?v=${Date.now()}"
          alt="Profile"
        >
        `;

    } else {

      const letter =
        (
          profile?.full_name ||
          profile?.username ||
          "U"
        )
          .charAt(0)
          .toUpperCase();


      navAvatar.textContent =
        letter;
    }
  }
}


// =====================================================
// SEARCH FRIENDS
// =====================================================

let friendSearchTimer = null;


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


  if (searchText.length === 0) {

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
      async () => {

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
              `username.ilike.%${searchText}%,full_name.ilike.%${searchText}%`
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


  const mutualFriends =
    await getMutualFriends(
      currentUser.id,
      person.id
    );


  const name =
    person.full_name ||
    "User";


  const username =
    person.username ||
    "username";


  const firstLetter =
    name
      .charAt(0)
      .toUpperCase();


  let avatarHTML =
    firstLetter;


  if (person.avatar_url) {

    avatarHTML =
      `
      <img
        src="${person.avatar_url}?v=${Date.now()}"
        alt="${name}"
      >
      `;
  }


  let buttonHTML =
    "";


  if (
    relationship.status ===
    "friend"
  ) {

    buttonHTML =
      `
      <button
        class="friend-button"
        disabled>
        ✓ Friends
      </button>
      `;

  } else if (
    relationship.status ===
    "sent"
  ) {

    buttonHTML =
      `
      <button
        class="friend-button"
        disabled>
        📤 Request Sent
      </button>
      `;

  } else if (
    relationship.status ===
    "received"
  ) {

    buttonHTML =
      `
      <button
        class="friend-button"
        onclick="acceptFriendRequest('${relationship.requestId}')">
        ✓ Accept Request
      </button>
      `;

  } else {

    buttonHTML =
      `
      <button
        class="friend-button"
        data-user-id="${person.id}"
        onclick="addFriend(this)">
        ＋ Add Friend
      </button>
      `;
  }


  let mutualHTML =
    "";


  if (
    mutualFriends.length > 0
  ) {

    const mutualNames =
      mutualFriends
        .slice(0, 3)
        .map(
          friend =>
            friend.full_name ||
            friend.username ||
            "User"
        );


    mutualHTML =
      `
      <div class="mutual-friends">
        🤝
        ${mutualFriends.length}
        mutual
        ${
          mutualNames.length > 0
            ? `· ${mutualNames.join(", ")}`
            : ""
        }
      </div>
      `;
  }


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


  // Clicking the person opens profile
  card.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          "button"
        )
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
      status: "none",
      requestId: null
    };
  }


  // -------------------------------------------------
  // CHECK ACTUAL FRIENDSHIP
  // -------------------------------------------------

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
      status: "friend",
      requestId: null
    };
  }


  // -------------------------------------------------
  // CHECK PENDING REQUEST
  // -------------------------------------------------

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
    requests &&
    requests.length > 0
      ? requests[0]
      : null;


  if (!request) {

    return {
      status: "none",
      requestId: null
    };
  }


  if (
    request.sender_id ===
    currentUserId
  ) {

    return {
      status: "sent",
      requestId: request.id
    };
  }


  if (
    request.receiver_id ===
    currentUserId
  ) {

    return {
      status: "received",
      requestId: request.id
    };
  }


  return {
    status: "none",
    requestId: null
  };
}


// =====================================================
// MUTUAL FRIENDS
// =====================================================

async function getMutualFriends(
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
    data: mine,
    error: mineError
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


  if (mineError) {

    console.error(
      "My friends error:",
      mineError
    );

    return [];
  }


  const {
    data: theirs,
    error: theirsError
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


  if (theirsError) {

    console.error(
      "Other friends error:",
      theirsError
    );

    return [];
  }


  const myIds =
    new Set(
      (mine || [])
        .map(
          row =>
            row.friend_id
        )
    );


  const mutualIds =
    (theirs || [])
      .map(
        row =>
          row.friend_id
      )
      .filter(
        id =>
          myIds.has(id) &&
          id !== currentUserId &&
          id !== otherUserId
      );


  const uniqueIds =
    [
      ...new Set(
        mutualIds
      )
    ];


  if (
    uniqueIds.length === 0
  ) {

    return [];
  }


  const {
    data: profiles,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url"
      )
      .in(
        "id",
        uniqueIds
      );


  if (profileError) {

    console.error(
      "Mutual profile error:",
      profileError
    );

    return [];
  }


  return profiles || [];
}


// =====================================================
// ADD FRIEND
// =====================================================

async function addFriend(
  button
) {

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
      "📤 Request Sent";

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
      () =>
        acceptFriendRequest(
          relationship.requestId
        );

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

    alert(
      error.message
    );

    return;
  }


  button.textContent =
    "📤 Request Sent";

  button.disabled =
    true;
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
      );


  if (error) {

    console.error(
      "Friend requests error:",
      error
    );


    if (badge) {

      badge.textContent =
        "0";

      badge.style.display =
        "none";
    }


    container.innerHTML =
      "<p>Unable to load friend requests.</p>";

    return;
  }


  container.innerHTML =
    "";


  const count =
    (requests || []).length;


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
          "full_name, username, avatar_url"
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


    const avatarUrl =
      profile?.avatar_url ||
      "";


    const firstLetter =
      name
        .charAt(0)
        .toUpperCase();


    const card =
      document.createElement(
        "div"
      );


    card.className =
      "friend-card";


    let avatarHTML =
      firstLetter;


    if (avatarUrl) {

      avatarHTML =
        `
        <img
          src="${avatarUrl}?v=${Date.now()}"
          alt="Profile picture"
        >
        `;
    }


    card.innerHTML =
      `
      <div class="avatar">
        ${avatarHTML}
      </div>

      <div class="friend-info">
        <h3>${escapeHTML(name)}</h3>
        <p>@${escapeHTML(username)}</p>
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


    card.querySelector(
      ".friend-info"
    )?.addEventListener(
      "click",
      () => {

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


  if (
    !existingFriendship
  ) {

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


    if (
      friendshipError
    ) {

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

let loadingMyFriends =
  false;


async function loadMyFriends() {

  if (
    loadingMyFriends
  ) {
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
      error:
        friendshipsError
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


    if (
      friendshipsError
    ) {

      console.error(
        "Friends loading error:",
        friendshipsError
      );


      container.innerHTML =
        "<p>Unable to load friends.</p>";

      return;
    }


    const uniqueFriendIds =
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
      uniqueFriendIds.length;


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


    if (
      profileFriendCount
    ) {

      profileFriendCount.textContent =
        totalFriends;
    }


    container.innerHTML =
      "";


    if (
      uniqueFriendIds.length ===
      0
    ) {

      container.innerHTML =
        "<p>You don't have any friends yet.</p>";

      return;
    }


    for (
      const friendId
      of uniqueFriendIds
    ) {

      const {
        data: profile,
        error:
          profileError
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


      if (
        profileError
      ) {

        console.error(
          "Friend profile error:",
          profileError
        );

        continue;
      }


      if (!profile) {
        continue;
      }


      const name =
        profile.full_name ||
        "User";


      const username =
        profile.username ||
        "username";


      const avatarUrl =
        profile.avatar_url ||
        "";


      const firstLetter =
        name
          .charAt(0)
          .toUpperCase();


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "friend-card friend-clickable";


      let avatarHTML =
        firstLetter;


      if (avatarUrl) {

        avatarHTML =
          `
          <img
            src="${avatarUrl}?v=${Date.now()}"
            alt="Profile picture"
          >
          `;
      }


      card.innerHTML =
        `
        <div class="avatar">
          ${avatarHTML}
        </div>

        <div class="friend-info">
          <h3>${escapeHTML(name)}</h3>
          <p>@${escapeHTML(username)}</p>
        </div>

        <span class="friend-status">
          ✓ Friends
        </span>
        `;


      card.addEventListener(
        "click",
        function () {

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


    const container =
      document.getElementById(
        "myFriendsList"
      );


    if (container) {

      container.innerHTML =
        "<p>Unable to load friends.</p>";
    }

  } finally {

    loadingMyFriends =
      false;
  }
}


// =====================================================
// MY PROFILE
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


  const profileFriendCount =
    document.getElementById(
      "profileFriendCount"
    );


  if (avatar) {

    avatar.textContent =
      "?";
  }


  if (nameElement) {

    nameElement.textContent =
      "Your Name";
  }


  if (usernameElement) {

    usernameElement.textContent =
      "@username";
  }


  if (profileFriendCount) {

    profileFriendCount.textContent =
      "0";
  }


  const {
    data: {
      user
    }
  } =
    await supabaseClient.auth
      .getUser();


  if (!user) {
    return;
  }


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

    if (
      profile.avatar_url
    ) {

      avatar.innerHTML =
        `
        <img
          src="${profile.avatar_url}?v=${Date.now()}"
          alt="Profile picture"
        >
        `;

    } else {

      avatar.textContent =
        name
          .charAt(0)
          .toUpperCase();
    }
  }
}


// =====================================================
// USER PROFILE
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

    goToMyProfile();

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
    error:
      profileError
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


  if (
    profileError ||
    !profile
  ) {

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


  const mutualFriends =
    await getMutualFriends(
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


  const avatarUrl =
    profile.avatar_url ||
    "";


  const firstLetter =
    name
      .charAt(0)
      .toUpperCase();


  let avatarHTML =
    firstLetter;


  if (avatarUrl) {

    avatarHTML =
      `
      <img
        src="${avatarUrl}?v=${Date.now()}"
        alt="${escapeHTML(name)}"
      >
      `;
  }


  let relationshipHTML =
    "";


  if (
    relationship.status ===
    "friend"
  ) {

    relationshipHTML =
      `
      <div class="profile-status">
        🤝 You are friends
      </div>
      `;

  } else if (
    relationship.status ===
    "sent"
  ) {

    relationshipHTML =
      `
      <div class="profile-status">
        📤 Friend request sent
      </div>
      `;

  } else if (
    relationship.status ===
    "received"
  ) {

    relationshipHTML =
      `
      <button
        class="profile-add-btn"
        onclick="acceptFriendRequest('${relationship.requestId}'); closeUserProfile();">
        ✓ Accept Friend Request
      </button>
      `;

  } else {

    relationshipHTML =
      `
      <button
        class="profile-add-btn"
        onclick="sendFriendFromProfile('${userId}', this)">
        ＋ Add Friend
      </button>
      `;
  }


  let mutualHTML =
    `
    <div class="profile-mutual-section">
      <h3>
        🤝 Mutual Friends
      </h3>
    `;


  if (
    mutualFriends.length ===
    0
  ) {

    mutualHTML +=
      `
      <p>
        No mutual friends yet.
      </p>
      `;

  } else {

    mutualHTML +=
      `
      <p>
        You have
        <strong>
          ${mutualFriends.length}
        </strong>
        mutual
        ${
          mutualFriends.length === 1
            ? "friend"
            : "friends"
        }.
      </p>
      `;


    mutualFriends
      .slice(0, 5)
      .forEach(
        friend => {

          const mutualName =
            friend.full_name ||
            friend.username ||
            "User";


          mutualHTML +=
            `
            <div
              class="mutual-profile-item"
              onclick="openUserProfile('${friend.id}')">

              <div class="avatar">
                ${
                  friend.avatar_url
                    ? `
                      <img
                        src="${friend.avatar_url}?v=${Date.now()}"
                        alt="${escapeHTML(mutualName)}"
                      >
                      `
                    : escapeHTML(
                        mutualName
                          .charAt(0)
                          .toUpperCase()
                      )
                }
              </div>

              <div>
                <strong>
                  ${escapeHTML(mutualName)}
                </strong>

                <small>
                  @${escapeHTML(
                    friend.username ||
                    "username"
                  )}
                </small>
              </div>

            </div>
            `;
        }
      );
  }


  mutualHTML +=
    `</div>`;


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
        class="profile-avatar user-profile-avatar">

        ${avatarHTML}

      </div>


      <h2>
        ${escapeHTML(name)}
      </h2>


      <p>
        @${escapeHTML(username)}
      </p>


      <div
        class="profile-friend-count">

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


      ${relationshipHTML}


      ${mutualHTML}

    </div>
    `;


  modal.addEventListener(
    "click",
    event => {

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
// SEND FRIEND FROM PROFILE
// =====================================================

async function sendFriendFromProfile(
  receiverId,
  button
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
      "📤 Request Sent";

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
      async () => {

        await acceptFriendRequest(
          relationship.requestId
        );

        closeUserProfile();
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
      "Profile friend request error:",
      error
    );

    alert(
      error.message
    );

    return;
  }


  button.textContent =
    "📤 Request Sent";

  button.disabled =
    true;
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
// PART 2 — USER PROFILES
// =====================================================


// =====================================================
// OPEN USER PROFILE
// =====================================================

async function openUserProfile(userId) {

  if (!userId) {
    return;
  }

  const {
    data: {
      user
    }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  // Remove old profile modal
  const oldModal =
    document.getElementById("userProfileModal");

  if (oldModal) {
    oldModal.remove();
  }

  // ---------------------------------------------------
  // Load user profile
  // ---------------------------------------------------

  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {

    console.error(
      "User profile error:",
      error
    );

    alert(
      "Unable to load this profile."
    );

    return;
  }

  if (!profile) {

    alert(
      "User profile not found."
    );

    return;
  }

  const name =
    profile.full_name || "User";

  const username =
    profile.username || "username";

  const avatarUrl =
    profile.avatar_url || "";

  const firstLetter =
    name.charAt(0).toUpperCase();

  let avatarHTML =
    firstLetter;

  if (avatarUrl) {

    avatarHTML = `
      <img
        src="${avatarUrl}?v=${Date.now()}"
        alt="${name}"
      >
    `;
  }


  // ---------------------------------------------------
  // Determine friendship status
  // ---------------------------------------------------

  let friendshipStatus =
    "not-friends";

  let requestId =
    null;

  let requestDirection =
    null;


  // Check friendship

  const {
    data: friendship
  } = await supabaseClient
    .from("friendships")
    .select(
      "id, user_id, friend_id"
    )
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();


  if (friendship) {

    friendshipStatus =
      "friends";

  } else {

    // Check pending request

    const {
      data: requests
    } = await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id, status"
      )
      .eq(
        "status",
        "pending"
      )
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
      )
      .order(
        "id",
        {
          ascending: false
        }
      )
      .limit(1);


    if (
      requests &&
      requests.length > 0
    ) {

      const request =
        requests[0];

      requestId =
        request.id;


      if (
        request.sender_id === user.id
      ) {

        friendshipStatus =
          "request-sent";

        requestDirection =
          "sent";

      } else {

        friendshipStatus =
          "request-received";

        requestDirection =
          "received";
      }
    }
  }


  // ---------------------------------------------------
  // Friendship button
  // ---------------------------------------------------

  let actionHTML = "";


  if (
    friendshipStatus ===
    "friends"
  ) {

    actionHTML = `
      <button
        class="profile-friend-btn friends"
        disabled>

        ✓ Friends

      </button>
    `;

  } else if (
    friendshipStatus ===
    "request-sent"
  ) {

    actionHTML = `
      <button
        class="profile-friend-btn"
        disabled>

        ✓ Request Sent

      </button>
    `;

  } else if (
    friendshipStatus ===
    "request-received"
  ) {

    actionHTML = `
      <button
        class="profile-friend-btn"
        onclick="acceptFriendRequest('${requestId}'); closeUserProfile();">

        Accept Request

      </button>
    `;

  } else {

    actionHTML = `
      <button
        class="profile-friend-btn"
        onclick="sendFriendRequestFromProfile('${userId}', this)">

        + Add Friend

      </button>
    `;
  }


  // ---------------------------------------------------
  // Profile modal
  // ---------------------------------------------------

  const modal =
    document.createElement("div");

  modal.id =
    "userProfileModal";

  modal.className =
    "auth-modal";

  modal.style.display =
    "flex";


  modal.innerHTML = `

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
        ${name}
      </h2>


      <p class="user-profile-username">
        @${username}
      </p>


      <div
        class="user-profile-status">

        ${actionHTML}

      </div>
      <div
  id="profileMutualFriends">

  <p>Loading mutual friends...</p>

</div>

      <div
        class="user-profile-info">

        <div>
          <strong>
            YouRemo User
          </strong>
        </div>

      </div>

    </div>

  `;


  document.body.appendChild(modal);


  // ---------------------------------------------------
  // Close when clicking outside
  // ---------------------------------------------------

  modal.addEventListener(
    "click",
    function(event) {

      if (
        event.target === modal
      ) {

        closeUserProfile();

      }

    }
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
  } = await supabaseClient.auth.getUser();


  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }


  if (
    user.id === receiverId
  ) {

    return;
  }


  // ---------------------------------------------------
  // Check friendship
  // ---------------------------------------------------

  const {
    data: friendship
  } = await supabaseClient
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();


  if (friendship) {

    button.textContent =
      "✓ Friends";

    button.disabled =
      true;

    return;
  }


  // ---------------------------------------------------
  // Check existing request
  // ---------------------------------------------------

  const {
    data: requests,
    error: requestError
  } = await supabaseClient
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id, status"
    )
    .eq(
      "status",
      "pending"
    )
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
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
      "Profile request error:",
      requestError
    );

    alert(
      requestError.message
    );

    return;
  }


  if (
    requests &&
    requests.length > 0
  ) {

    const request =
      requests[0];


    if (
      request.sender_id ===
      user.id
    ) {

      button.textContent =
        "✓ Request Sent";

      button.disabled =
        true;

      return;
    }


    if (
      request.receiver_id ===
      user.id
    ) {

      button.textContent =
        "Accept Request";

      button.onclick =
        async function() {

          await acceptFriendRequest(
            request.id
          );

          closeUserProfile();

        };

      return;
    }
  }


  // ---------------------------------------------------
  // Send request
  // ---------------------------------------------------

  const {
    error
  } = await supabaseClient
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
      "Send profile request error:",
      error
    );

    alert(
      error.message
    );

    return;
  }


  button.textContent =
    "✓ Request Sent";

  button.disabled =
    true;
}



// =====================================================
// MAKE SEARCH USERS CLICKABLE
// =====================================================

function makeUserCardClickable(
  card,
  userId
) {

  if (!card || !userId) {
    return;
  }

  card.style.cursor =
    "pointer";


  card.addEventListener(
    "click",
    function(event) {

      // Don't open profile when
      // clicking a button

      if (
        event.target.closest(
          "button"
        )
      ) {

        return;
      }


      openUserProfile(
        userId
      );

    }
  );
}



// =====================================================
// USER PROFILE — ESC KEY
// =====================================================

document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key === "Escape"
    ) {

      closeUserProfile();

    }

  }
);



// =====================================================
// PROFILE INITIALIZATION
// =====================================================

async function initializeUserProfiles() {

  console.log(
    "User profile system ready."
  );

}
// =====================================================
// PART 3 — CONNECT USER PROFILES TO FRIEND CARDS
// =====================================================


// =====================================================
// OPEN PROFILE FROM SEARCH RESULT
// =====================================================

function openProfileFromCard(userId) {

  if (!userId) {
    return;
  }

  openUserProfile(userId);
}



// =====================================================
// MAKE SEARCH RESULT CARD CLICKABLE
// =====================================================

function attachProfileClick(
  card,
  userId
) {

  if (!card || !userId) {
    return;
  }

  card.classList.add(
    "profile-clickable"
  );

  card.style.cursor =
    "pointer";


  card.addEventListener(
    "click",
    function(event) {

      // Ignore buttons

      if (
        event.target.closest("button")
      ) {
        return;
      }


      openUserProfile(
        userId
      );

    }
  );
}



// =====================================================
// MAKE MY FRIEND CARD CLICKABLE
// =====================================================

function attachFriendProfileClick(
  card,
  profile
) {

  if (
    !card ||
    !profile ||
    !profile.id
  ) {
    return;
  }


  card.classList.add(
    "profile-clickable"
  );


  card.style.cursor =
    "pointer";


  card.addEventListener(
    "click",
    function(event) {

      // Don't open profile
      // when clicking a button

      if (
        event.target.closest(
          "button"
        )
      ) {

        return;

      }


      openUserProfile(
        profile.id
      );

    }
  );
}



// =====================================================
// PROFILE CARD AVATAR HELPER
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


  const firstLetter =
    name
      .charAt(0)
      .toUpperCase();


  if (
    profile.avatar_url
  ) {

    return `
      <img
        src="${profile.avatar_url}?v=${Date.now()}"
        alt="${name}"
      >
    `;

  }


  return firstLetter;
}



// =====================================================
// FRIENDSHIP STATUS HELPER
// =====================================================

async function getUserRelationship(
  currentUserId,
  otherUserId
) {

  if (
    !currentUserId ||
    !otherUserId
  ) {

    return {
      type: "none",
      request: null
    };

  }


  // ---------------------------------------------------
  // Check friendship
  // ---------------------------------------------------

  const {
    data: friendship,
    error: friendshipError
  } = await supabaseClient
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
      "Relationship friendship error:",
      friendshipError
    );

  }


  if (friendship) {

    return {
      type: "friends",
      request: null
    };

  }


  // ---------------------------------------------------
  // Check pending request
  // ---------------------------------------------------

  const {
    data: requests,
    error: requestError
  } = await supabaseClient
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
      "Relationship request error:",
      requestError
    );

  }


  if (
    requests &&
    requests.length > 0
  ) {

    const request =
      requests[0];


    if (
      request.sender_id ===
      currentUserId
    ) {

      return {
        type: "request-sent",
        request: request
      };

    }


    if (
      request.receiver_id ===
      currentUserId
    ) {

      return {
        type: "request-received",
        request: request
      };

    }

  }


  return {
    type: "none",
    request: null
  };
}



// =====================================================
// GET FRIENDSHIP STATUS LOGO
// =====================================================

function getRelationshipLogo(
  relationship
) {

  if (
    relationship ===
    "friends"
  ) {

    return `
      <span
        class="relationship-logo friends-logo"
        title="Friends">

        ✓

      </span>
    `;

  }


  if (
    relationship ===
    "request-sent"
  ) {

    return `
      <span
        class="relationship-logo request-logo"
        title="Friend request sent">

        ⏳

      </span>
    `;

  }


  if (
    relationship ===
    "request-received"
  ) {

    return `
      <span
        class="relationship-logo received-logo"
        title="Friend request received">

        👋

      </span>
    `;

  }


  return `
    <span
      class="relationship-logo not-friends-logo"
      title="Not friends">

      +

    </span>
  `;
}



// =====================================================
// PROFILE RELATIONSHIP BUTTON
// =====================================================

function createRelationshipButton(
  relationship,
  otherUserId
) {

  if (
    relationship.type ===
    "friends"
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
    relationship.type ===
    "request-sent"
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
    relationship.type ===
    "request-received"
  ) {

    const requestId =
      relationship.request?.id;


    return `
      <button
        class="friend-button"
        onclick="acceptFriendRequest('${requestId}')">

        Accept Request

      </button>
    `;

  }


  return `
    <button
      class="friend-button"
      data-user-id="${otherUserId}"
      onclick="addFriend(this)">

      + Add Friend

    </button>
  `;
}



// =====================================================
// MUTUAL FRIENDS
// =====================================================

async function getMutualFriends(
  currentUserId,
  otherUserId
) {

  if (
    !currentUserId ||
    !otherUserId
  ) {

    return [];

  }


  // ---------------------------------------------------
  // Current user's friends
  // ---------------------------------------------------

  const {
    data: myFriendRows,
    error: myError
  } = await supabaseClient
    .from("friendships")
    .select("friend_id")
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


  // ---------------------------------------------------
  // Other user's friends
  // ---------------------------------------------------

  const {
    data: theirFriendRows,
    error: theirError
  } = await supabaseClient
    .from("friendships")
    .select("friend_id")
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


  const myFriends =
    new Set(
      (myFriendRows || [])
        .map(
          row =>
            row.friend_id
        )
    );


  const theirFriends =
    (theirFriendRows || [])
      .map(
        row =>
          row.friend_id
      );


  const mutualIds =
    theirFriends.filter(
      id =>
        myFriends.has(id)
    );


  return [
    ...new Set(
      mutualIds
    )
  ];
}



// =====================================================
// LOAD MUTUAL FRIEND PROFILES
// =====================================================

async function loadMutualFriendProfiles(
  currentUserId,
  otherUserId
) {

  const mutualIds =
    await getMutualFriends(
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
  } = await supabaseClient
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
      "Mutual profiles error:",
      error
    );

    return [];

  }


  return profiles || [];
}



// =====================================================
// CREATE MUTUAL FRIEND SECTION
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


  const preview =
    profiles
      .slice(0, 5)
      .map(
        profile => {

          const avatar =
            createProfileAvatarHTML(
              profile
            );


          return `
            <div
              class="mutual-avatar"
              title="${profile.full_name || profile.username}">

              ${avatar}

            </div>
          `;

        }
      )
      .join("");


  const count =
    profiles.length;


  return `

    <div
      class="mutual-friends">

      <div
        class="mutual-avatar-list">

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
// USER PROFILE WITH MUTUAL FRIENDS
// =====================================================

async function loadMutualFriendsIntoProfile(
  currentUserId,
  otherUserId
) {

  const container =
    document.getElementById(
      "profileMutualFriends"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "<p>Loading mutual friends...</p>";


  const profiles =
    await loadMutualFriendProfiles(
      currentUserId,
      otherUserId
    );


  if (
    profiles.length === 0
  ) {

    container.innerHTML = "";

    return;

  }


  container.innerHTML =
    createMutualFriendsHTML(
      profiles
    );
}



// =====================================================
// OPEN USER PROFILE WITH MUTUAL FRIENDS
// =====================================================

async function openUserProfileWithMutuals(
  userId
) {

  await openUserProfile(
    userId
  );


  const {
    data: {
      user
    }
  } = await supabaseClient.auth.getUser();


  if (!user) {
    return;
  }


  await loadMutualFriendsIntoProfile(
    user.id,
    userId
  );
}



// =====================================================
// UPDATE EXISTING PROFILE FUNCTION
// =====================================================

// This replaces the old profile opener
// so mutual friends are loaded automatically.

const originalOpenUserProfile =
  window.openUserProfile;


window.openUserProfile =
  async function(userId) {

    await originalOpenUserProfile(
      userId
    );


    const {
      data: {
        user
      }
    } = await supabaseClient.auth.getUser();


    if (!user) {
      return;
    }


    await loadMutualFriendsIntoProfile(
      user.id,
      userId
    );

  };



// =====================================================
// PROFILE CARD CSS CLASS SETUP
// =====================================================

function setupProfileCardClasses() {

  const style =
    document.createElement(
      "style"
    );


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


    .relationship-logo {
      display:
        inline-flex;

      align-items:
        center;

      justify-content:
        center;

      width:
        30px;

      height:
        30px;

      border-radius:
        50%;

      font-size:
        15px;

      font-weight:
        700;

      margin-left:
        8px;
    }


    .friends-logo {
      background:
        #dcfce7;

      color:
        #16a34a;
    }


    .request-logo {
      background:
        #fef3c7;

      color:
        #d97706;
    }


    .received-logo {
      background:
        #dbeafe;

      color:
        #2563eb;
    }


    .not-friends-logo {
      background:
        #f1f5f9;

      color:
        #64748b;
    }


    .mutual-friends {
      display:
        flex;

      align-items:
        center;

      gap:
        10px;

      margin-top:
        15px;

      padding:
        10px 12px;

      border-radius:
        12px;

      background:
        #f8fafc;

      font-size:
        14px;

      color:
        #64748b;
    }


    .mutual-avatar-list {
      display:
        flex;

      align-items:
        center;
    }


    .mutual-avatar {
      width:
        30px;

      height:
        30px;

      border-radius:
        50%;

      overflow:
        hidden;

      display:
        flex;

      align-items:
        center;

      justify-content:
        center;

      background:
        #e2e8f0;

      color:
        #475569;

      font-size:
        12px;

      font-weight:
        700;

      border:
        2px solid white;

      margin-left:
        -7px;
    }


    .mutual-avatar:first-child {
      margin-left:
        0;
    }


    .mutual-avatar img {
      width:
        100%;

      height:
        100%;

      object-fit:
        cover;
    }


    .user-profile-box {
      position:
        relative;
    }


    .user-profile-avatar {
      overflow:
        hidden;
    }


    .user-profile-avatar img {
      width:
        100%;

      height:
        100%;

      object-fit:
        cover;
    }


    .profile-friend-btn {
      margin-top:
        15px;

      padding:
        11px 22px;

      border:
        none;

      border-radius:
        10px;

      cursor:
        pointer;
    }


    .profile-friend-btn.friends {
      cursor:
        default;
    }


    .user-profile-status {
      margin-top:
        10px;
    }


    .user-profile-info {
      margin-top:
        10px;
    }


    #profileMutualFriends {
      margin-top:
        10px;
    }

  `;


  document.head.appendChild(
    style
  );
}



// =====================================================
// INITIALIZE PROFILE FEATURES
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    setupProfileCardClasses();

    console.log(
      "User profile features initialized."
    );

  }
);
// =====================================================
// LOGIN / ACCOUNT BUTTON FIX
// =====================================================

async function handleAccountClick() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (!session) {

    openAuth();

    return;
  }

  const accountMenu =
    document.getElementById("accountMenu");

  if (accountMenu) {

    accountMenu.classList.toggle("show");

  }
}
