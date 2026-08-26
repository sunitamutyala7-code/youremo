// =====================================================
// YouRemo - Clean script.js
// =====================================================

// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://ykqnqdtekbxnevtjjkbd.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// =====================================================
// NAVIGATION
// =====================================================

function findFriends() {
  const section = document.getElementById("friends");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth"
    });
  }

  setTimeout(() => {
    const input = document.getElementById("friendSearch");

    if (input) {
      input.focus();
    }
  }, 600);
}


function learnMore() {
  const section = document.getElementById("about");

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
  const modal = document.getElementById("authModal");

  if (!modal) return;

  modal.style.display = "flex";

  showLogin();
}


function closeAuth() {
  const modal = document.getElementById("authModal");

  if (modal) {
    modal.style.display = "none";
  }
}


function showLogin() {
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  const name = document.getElementById("authName");
  const username = document.getElementById("authUsername");
  const email = document.getElementById("authEmail");
  const password = document.getElementById("authPassword");
  const button = document.querySelector(".auth-submit");
  const switchText = document.querySelector(".auth-switch");

  if (title) {
    title.textContent = "Welcome Back";
  }

  if (subtitle) {
    subtitle.textContent = "Login to your YouRemo account";
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
      `Don't have an account? <span onclick="showSignup()">Sign Up</span>`;
  }
}


function showSignup() {
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  const name = document.getElementById("authName");
  const username = document.getElementById("authUsername");
  const email = document.getElementById("authEmail");
  const password = document.getElementById("authPassword");
  const button = document.querySelector(".auth-submit");
  const switchText = document.querySelector(".auth-switch");

  if (title) {
    title.textContent = "Welcome to YouRemo";
  }

  if (subtitle) {
    subtitle.textContent = "Create your account";
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
    button.textContent = "Create Account";
    button.onclick = signUp;
  }

  if (switchText) {
    switchText.innerHTML =
      `Already have an account? <span onclick="showLogin()">Login</span>`;
  }
}


// =====================================================
// SIGN UP
// =====================================================

async function signUp() {
  const name =
    document.getElementById("authName")?.value.trim();

  const username =
    document.getElementById("authUsername")?.value.trim();

  const email =
    document.getElementById("authEmail")?.value.trim();

  const password =
    document.getElementById("authPassword")?.value;

  if (!name || !username || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const { data, error } =
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
    console.error("Signup error:", error);
    alert(error.message);
    return;
  }

  if (!data.user) {
    alert("Account could not be created.");
    return;
  }

  const { error: profileError } =
    await supabaseClient
      .from("profiles")
      .upsert({
        id: data.user.id,
        username: username,
        full_name: name
      });

  if (profileError) {
    console.error("Profile error:", profileError);
    alert(profileError.message);
    return;
  }

  alert("Account created successfully!");

  closeAuth();

  await refreshAccountUI();
}


// =====================================================
// LOGIN
// =====================================================

async function login() {
  const email =
    document.getElementById("authEmail")?.value.trim();

  const password =
    document.getElementById("authPassword")?.value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error("Login error:", error);
    alert(error.message);
    return;
  }

  alert("Login successful!");

  closeAuth();

  await refreshAccountUI();
}


// =====================================================
// REFRESH ACCOUNT UI
// =====================================================

async function refreshAccountUI() {
  console.log("Refreshing account UI...");

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  // Clear friend search
  const searchInput =
    document.getElementById("friendSearch");

  const friendResults =
    document.getElementById("friendResults");

  if (searchInput) {
    searchInput.value = "";
    searchInput.blur();
  }

  if (friendResults) {
    friendResults.innerHTML = "";
  }

  // Logged out
  if (!session) {
    resetProfileUI();
    resetFriendCounts();

    await updateLoginButton();

    const friendRequests =
      document.getElementById("friendRequests");

    if (friendRequests) {
      friendRequests.innerHTML =
        "<p>Please login to see friend requests.</p>";
    }

    const requestBadge =
      document.getElementById("requestBadge");

    if (requestBadge) {
      requestBadge.textContent = "0";
      requestBadge.style.display = "none";
    }

    const myFriends =
      document.getElementById("myFriendsList");

    if (myFriends) {
      myFriends.innerHTML =
        "<p>Please login to see your friends.</p>";
    }

    return;
  }

  // Logged in
  await updateLoginButton();
  await loadMyProfile();
  await loadFriendRequests();
  await loadMyFriends();
}


// =====================================================
// RESET PROFILE
// =====================================================

function resetProfileUI() {
  const avatar =
    document.getElementById("myProfileAvatar");

  const name =
    document.getElementById("myProfileName");

  const username =
    document.getElementById("myProfileUsername");

  if (avatar) {
    avatar.textContent = "?";
  }

  if (name) {
    name.textContent = "Your Name";
  }

  if (username) {
    username.textContent = "@username";
  }
}


// =====================================================
// RESET FRIEND COUNTS
// =====================================================

function resetFriendCounts() {
  const friendCount =
    document.getElementById("friendCount");

  const profileFriendCount =
    document.getElementById("profileFriendCount");

  if (friendCount) {
    friendCount.textContent = "0 Friends";
  }

  if (profileFriendCount) {
    profileFriendCount.textContent = "0";
  }
}


// =====================================================
// LOGIN BUTTON / NAVBAR
// =====================================================

async function updateLoginButton() {
  const button =
    document.getElementById("loginButton");

  const navAvatar =
    document.getElementById("navAvatar");

  if (!button) return;

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  // Logged out
  if (!session) {
    button.textContent = "Login";

    if (navAvatar) {
      navAvatar.textContent = "?";
    }

    return;
  }

  const user = session.user;

  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile error:", error);

    button.textContent = "Account";

    return;
  }

  button.textContent =
    profile?.full_name ||
    profile?.username ||
    "Account";

  if (navAvatar) {
    if (profile?.avatar_url) {
      navAvatar.innerHTML = `
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

      navAvatar.textContent = letter;
    }
  }
}



// =====================================================
// SEARCH FRIENDS - FIXED
// =====================================================

let friendSearchTimer = null;

async function searchFriends() {

  const input = document.getElementById("friendSearch");
  const results = document.getElementById("friendResults");

  if (!input || !results) return;

  const searchText = input.value.trim();

  if (searchText.length === 0) {
    results.innerHTML = "";
    return;
  }

  if (searchText.length < 2) {
    results.innerHTML = "<p>Type at least 2 characters.</p>";
    return;
  }

  clearTimeout(friendSearchTimer);

  friendSearchTimer = setTimeout(async () => {

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      results.innerHTML =
        "<p>Please login first.</p>";
      return;
    }

    results.innerHTML =
      "<p>Searching...</p>";

    // -------------------------------------------------
    // SEARCH USERS
    // -------------------------------------------------

    const {
      data: users,
      error: searchError
    } = await supabaseClient
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

    // Remove current user
    const otherUsers = (users || []).filter(
      person => person.id !== user.id
    );

    if (otherUsers.length === 0) {

      results.innerHTML =
        "<p>No users found.</p>";

      return;
    }

    results.innerHTML = "";

    // -------------------------------------------------
    // CREATE USER CARDS
    // -------------------------------------------------

    for (const person of otherUsers) {

      // -----------------------------------------------
      // CHECK BOTH DIRECTIONS OF FRIENDSHIP
      // -----------------------------------------------

      const {
        data: friendships,
        error: friendshipError
      } = await supabaseClient
        .from("friendships")
        .select("id, user_id, friend_id")
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${person.id}),and(user_id.eq.${person.id},friend_id.eq.${user.id})`
        );

      if (friendshipError) {

        console.error(
          "Friendship check error:",
          friendshipError
        );
      }

      // IMPORTANT:
      // Only consider it a friendship if a real row exists.
      const isFriend =
        Array.isArray(friendships) &&
        friendships.some(row =>
          (
            row.user_id === user.id &&
            row.friend_id === person.id
          ) ||
          (
            row.user_id === person.id &&
            row.friend_id === user.id
          )
        );

      // -----------------------------------------------
      // CHECK PENDING REQUEST
      // -----------------------------------------------

      const {
        data: requests,
        error: requestError
      } = await supabaseClient
        .from("friend_requests")
        .select(
          "id, sender_id, receiver_id, status"
        )
        .eq("status", "pending")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${person.id}),and(sender_id.eq.${person.id},receiver_id.eq.${user.id})`
        )
        .order("id", {
          ascending: false
        })
        .limit(1);

      if (requestError) {

        console.error(
          "Friend request check error:",
          requestError
        );
      }

      const request =
        requests && requests.length > 0
          ? requests[0]
          : null;

      // -----------------------------------------------
      // USER INFORMATION
      // -----------------------------------------------

      const name =
        person.full_name || "User";

      const username =
        person.username || "username";

      const firstLetter =
        name.charAt(0).toUpperCase();

      let avatarHTML = firstLetter;

      if (person.avatar_url) {

        avatarHTML = `
          <img
            src="${person.avatar_url}?v=${Date.now()}"
            alt="${name}"
          >
        `;
      }

      // -----------------------------------------------
      // BUTTON
      // -----------------------------------------------

      let buttonHTML = "";

      if (isFriend) {

        buttonHTML = `
          <button
            class="friend-button"
            disabled>
            Friends ✓
          </button>
        `;

      } else if (
        request &&
        request.sender_id === user.id
      ) {

        buttonHTML = `
          <button
            class="friend-button"
            disabled>
            Request Sent
          </button>
        `;

      } else if (
        request &&
        request.receiver_id === user.id
      ) {

        buttonHTML = `
          <button
            class="friend-button"
            onclick="acceptFriendRequest('${request.id}')">
            Accept Request
          </button>
        `;

      } else {

        buttonHTML = `
          <button
            class="friend-button"
            data-user-id="${person.id}"
            onclick="addFriend(this)">
            Add Friend
          </button>
        `;
      }

      // -----------------------------------------------
      // CARD
      // -----------------------------------------------

      const card =
        document.createElement("div");

      card.className =
        "friend-card";

      card.innerHTML = `

        <div class="avatar">
          ${avatarHTML}
        </div>

        <div class="friend-info">

          <h3>
            ${name}
          </h3>

          <p>
            @${username}
          </p>

        </div>

        ${buttonHTML}

      `;

      results.appendChild(card);
    }

  }, 250);
}


// =====================================================
// ADD FRIEND
// =====================================================

async function addFriend(button) {
  const receiverId =
    button.dataset.userId;

  if (!receiverId) return;

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  if (user.id === receiverId) {
    return;
  }

  // Check friendship
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
    button.textContent = "Friends ✓";
    button.disabled = true;
    return;
  }

  // Check pending request
  const {
    data: requestRows,
    error: requestError
  } = await supabaseClient
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id, status"
    )
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
    )
    .eq("status", "pending")
    .order("id", {
      ascending: false
    })
    .limit(1);

  if (requestError) {
    console.error(
      "Friend request check error:",
      requestError
    );
  }

  const request =
    requestRows &&
    requestRows.length > 0
      ? requestRows[0]
      : null;

  if (request) {
    if (request.sender_id === user.id) {
      button.textContent = "Request Sent";
      button.disabled = true;
      return;
    }

    if (request.receiver_id === user.id) {
      button.textContent = "Accept Request";

      button.onclick = () =>
        acceptFriendRequest(request.id);

      return;
    }
  }

  // Send request
  const { error } =
    await supabaseClient
      .from("friend_requests")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: "pending"
      });

  if (error) {
    console.error(
      "Send friend request error:",
      error
    );

    alert(error.message);
    return;
  }

  button.textContent =
    "Request Sent";

  button.disabled = true;
}


// =====================================================
// FRIEND REQUESTS
// =====================================================

async function loadFriendRequests() {
  const container =
    document.getElementById("friendRequests");

  if (!container) return;

  const badge =
    document.getElementById("requestBadge");

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    container.innerHTML =
      "<p>Please login to see friend requests.</p>";

    if (badge) {
      badge.textContent = "0";
      badge.style.display = "none";
    }

    return;
  }

  const {
    data: requests,
    error
  } = await supabaseClient
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id, status"
    )
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error(
      "Friend requests error:",
      error
    );

    if (badge) {
      badge.textContent = "0";
      badge.style.display = "none";
    }

    container.innerHTML =
      "<p>Unable to load friend requests.</p>";

    return;
  }

  container.innerHTML = "";

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

  for (const request of requests) {

    const {
      data: profile
    } = await supabaseClient
      .from("profiles")
      .select(
        "full_name, username, avatar_url"
      )
      .eq("id", request.sender_id)
      .maybeSingle();

    const name =
      profile?.full_name || "User";

    const username =
      profile?.username || "username";

    const avatarUrl =
      profile?.avatar_url || "";

    const firstLetter =
      name.charAt(0).toUpperCase();

    const card =
      document.createElement("div");

    card.className =
      "friend-card";

    let avatarHTML =
      firstLetter;

    if (avatarUrl) {
      avatarHTML = `
        <img
          src="${avatarUrl}?v=${Date.now()}"
          alt="Profile picture"
        >
      `;
    }

    card.innerHTML = `
      <div class="avatar">
        ${avatarHTML}
      </div>

      <div class="friend-info">
        <h3>${name}</h3>
        <p>@${username}</p>
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

    container.appendChild(card);
  }
}


// =====================================================
// ACCEPT FRIEND REQUEST
// =====================================================

async function acceptFriendRequest(requestId) {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  const {
    data: request,
    error
  } = await supabaseClient
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id, status"
    )
    .eq("id", requestId)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .single();

  if (error || !request) {
    alert("Friend request not found.");
    return;
  }

  // Check existing friendship
  const {
    data: existingFriendship
  } = await supabaseClient
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${request.sender_id}),and(user_id.eq.${request.sender_id},friend_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();

  // Create two-way friendship
  if (!existingFriendship) {
    const {
      error: friendshipError
    } = await supabaseClient
      .from("friendships")
      .insert([
        {
          user_id: user.id,
          friend_id: request.sender_id
        },
        {
          user_id: request.sender_id,
          friend_id: user.id
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

  // Mark request accepted
  const {
    error: updateError
  } = await supabaseClient
    .from("friend_requests")
    .update({
      status: "accepted"
    })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  if (updateError) {
    alert(updateError.message);
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

async function declineFriendRequest(requestId) {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  const {
    error
  } = await supabaseClient
    .from("friend_requests")
    .update({
      status: "declined"
    })
    .eq("id", requestId)
    .eq("receiver_id", user.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadFriendRequests();
}


// =====================================================
// LOAD MY FRIENDS
// =====================================================

let loadingMyFriends = false;


async function loadMyFriends() {
  if (loadingMyFriends) return;

  loadingMyFriends = true;

  try {
    const container =
      document.getElementById("myFriendsList");

    if (!container) {
      return;
    }

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
      container.innerHTML =
        "<p>Please login to see your friends.</p>";

      return;
    }

    const {
      data: friendships,
      error: friendshipsError
    } = await supabaseClient
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id);

    if (friendshipsError) {
      console.error(
        "Friends loading error:",
        friendshipsError
      );

      container.innerHTML =
        "<p>Unable to load friends.</p>";

      return;
    }

    const uniqueFriendIds = [
      ...new Set(
        (friendships || []).map(
          friendship =>
            friendship.friend_id
        )
      )
    ];

    const totalFriends =
      uniqueFriendIds.length;

    // Update friend count
    const friendCount =
      document.getElementById("friendCount");

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
        totalFriends;
    }

    container.innerHTML = "";

    if (uniqueFriendIds.length === 0) {
      container.innerHTML =
        "<p>You don't have any friends yet.</p>";

      return;
    }

    // Load friends
    for (const friendId of uniqueFriendIds) {
      const {
        data: profile,
        error: profileError
      } = await supabaseClient
        .from("profiles")
        .select(
          "id, full_name, username, avatar_url"
        )
        .eq("id", friendId)
        .maybeSingle();

      if (profileError) {
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
        profile.full_name || "User";

      const username =
        profile.username || "username";

      const avatarUrl =
        profile.avatar_url || "";

      const firstLetter =
        name.charAt(0).toUpperCase();

      const card =
        document.createElement("div");

      card.className =
        "friend-card friend-clickable";

      let avatarHTML =
        firstLetter;

      if (avatarUrl) {
        avatarHTML = `
          <img
            src="${avatarUrl}?v=${Date.now()}"
            alt="Profile picture"
          >
        `;
      }

      card.innerHTML = `
        <div class="avatar">
          ${avatarHTML}
        </div>

        <div class="friend-info">
          <h3>${name}</h3>
          <p>@${username}</p>
        </div>

        <span class="friend-status">
          Friends ✓
        </span>
      `;

      card.addEventListener(
        "click",
        function () {
          openFriendProfile(
            profile.id,
            name,
            username,
            avatarUrl
          );
        }
      );

      container.appendChild(card);
    }

  } catch (error) {
    console.error(
      "Unexpected error loading friends:",
      error
    );

    const container =
      document.getElementById("myFriendsList");

    if (container) {
      container.innerHTML =
        "<p>Unable to load friends.</p>";
    }

  } finally {
    loadingMyFriends = false;
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

  // Reset first
  if (avatar) {
    avatar.textContent = "?";
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
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) return;

  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select(
      "full_name, username, avatar_url"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Profile loading error:",
      error
    );

    return;
  }

  if (!profile) return;

  const name =
    profile.full_name || "User";

  const username =
    profile.username || "username";

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
      avatar.innerHTML = `
        <img
          src="${profile.avatar_url}?v=${Date.now()}"
          alt="Profile picture"
        >
      `;
    } else {
      avatar.textContent =
        name.charAt(0).toUpperCase();
    }
  }
}


// =====================================================
// FRIEND PROFILE
// =====================================================

function openFriendProfile(
  userId,
  name,
  username,
  avatarUrl = ""
) {
  const oldModal =
    document.getElementById(
      "friendProfileModal"
    );

  if (oldModal) {
    oldModal.remove();
  }

  const firstLetter =
    name.charAt(0).toUpperCase();

  let avatarHTML =
    firstLetter;

  if (avatarUrl) {
    avatarHTML = `
      <img
        src="${avatarUrl}?v=${Date.now()}"
        alt="Profile picture"
      >
    `;
  }

  const modal =
    document.createElement("div");

  modal.id =
    "friendProfileModal";

  modal.className =
    "auth-modal";

  modal.style.display =
    "flex";

  modal.innerHTML = `
    <div class="auth-box friend-profile-box">

      <button
        class="close-auth"
        onclick="closeFriendProfile()">
        ×
      </button>

      <div class="profile-avatar">
        ${avatarHTML}
      </div>

      <h2>${name}</h2>

      <p>@${username}</p>

      <p class="profile-friend-status">
        ✓ You are friends
      </p>

      <button
        class="remove-friend-btn"
        onclick="removeFriend('${userId}')">
        Remove Friend
      </button>

    </div>
  `;

  document.body.appendChild(modal);
}


function closeFriendProfile() {
  const modal =
    document.getElementById(
      "friendProfileModal"
    );

  if (modal) {
    modal.remove();
  }
}


// =====================================================
// REMOVE FRIEND
// =====================================================

async function removeFriend(friendId) {

  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("Please login first.");
    return;
  }

  if (!friendId) {
    alert("Friend ID is missing.");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to remove this friend?"
  );

  if (!confirmed) {
    return;
  }

  console.log("Removing friendship:", {
    currentUser: user.id,
    friend: friendId
  });

  // Delete both directions
  const { error } = await supabaseClient
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
    );

  if (error) {
    console.error("Remove friend error:", error);

    alert(
      "Unable to remove friend.\n\n" +
      error.message
    );

    return;
  }

  console.log("Friendship removed successfully.");

  closeFriendProfile();

  // Refresh friends list
  await loadMyFriends();

  alert("Friend removed successfully.");
}

// =====================================================
// PROFILE PICTURE
// =====================================================

async function uploadProfilePicture() {
  const input =
    document.getElementById(
      "avatarInput"
    );

  if (!input?.files?.[0]) {
    return;
  }

  const file =
    input.files[0];

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");

    input.value = "";

    return;
  }

  if (!file.type.startsWith("image/")) {
    alert(
      "Please select an image file."
    );

    input.value = "";

    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert(
      "Image must be smaller than 5 MB."
    );

    input.value = "";

    return;
  }

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  const filePath =
    `${user.id}.${extension}`;

  const {
    error: uploadError
  } = await supabaseClient.storage
    .from("avatars")
    .upload(
      filePath,
      file,
      {
        upsert: true,
        contentType: file.type
      }
    );

  if (uploadError) {
    console.error(
      "Upload error:",
      uploadError
    );

    alert(
      uploadError.message
    );

    input.value = "";

    return;
  }

  const {
    data: publicUrlData
  } = supabaseClient.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl =
    publicUrlData.publicUrl;

  const {
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .update({
      avatar_url: avatarUrl
    })
    .eq("id", user.id);

  if (profileError) {
    console.error(
      "Profile update error:",
      profileError
    );

    alert(
      profileError.message
    );

    input.value = "";

    return;
  }

  alert(
    "Profile picture updated! 🎉"
  );

  input.value = "";

  await refreshAccountUI();
}


// =====================================================
// EDIT PROFILE
// =====================================================

async function openEditProfile() {
  const menu =
    document.getElementById(
      "accountMenu"
    );

  if (menu) {
    menu.classList.remove("show");
  }

  const modal =
    document.getElementById(
      "editProfileModal"
    );

  const nameInput =
    document.getElementById(
      "editProfileName"
    );

  const usernameInput =
    document.getElementById(
      "editProfileUsername"
    );

  if (
    !modal ||
    !nameInput ||
    !usernameInput
  ) {
    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select(
      "full_name, username"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    alert(error.message);
    return;
  }

  nameInput.value =
    profile?.full_name || "";

  usernameInput.value =
    profile?.username || "";

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
  const nameInput =
    document.getElementById(
      "editProfileName"
    );

  const usernameInput =
    document.getElementById(
      "editProfileUsername"
    );

  const name =
    nameInput?.value.trim();

  const username =
    usernameInput?.value.trim();

  if (!name || !username) {
    alert(
      "Please enter your name and username."
    );

    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  const {
    error
  } = await supabaseClient
    .from("profiles")
    .update({
      full_name: name,
      username: username
    })
    .eq("id", user.id);

  if (error) {
    alert(error.message);
    return;
  }

  alert(
    "Profile updated successfully! 🎉"
  );

  closeEditProfile();

  await refreshAccountUI();
}


// =====================================================
// ACCOUNT MENU
// =====================================================

function setupAccountMenu() {
  const accountButton =
    document.getElementById(
      "accountButton"
    );

  const accountMenu =
    document.getElementById(
      "accountMenu"
    );

  if (accountButton) {
    accountButton.addEventListener(
      "click",
      async event => {
        event.stopPropagation();

        const {
          data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session) {
          openAuth();
          return;
        }

        if (accountMenu) {
          accountMenu.classList.toggle(
            "show"
          );
        }
      }
    );
  }

  document.addEventListener(
    "click",
    () => {
      if (accountMenu) {
        accountMenu.classList.remove(
          "show"
        );
      }
    }
  );
}


function goToMyProfile() {
  const accountMenu =
    document.getElementById(
      "accountMenu"
    );

  if (accountMenu) {
    accountMenu.classList.remove(
      "show"
    );
  }

  const profile =
    document.getElementById(
      "profile"
    );

  if (profile) {
    profile.scrollIntoView({
      behavior: "smooth"
    });
  }
}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {
  const {
    error
  } = await supabaseClient.auth.signOut();

  if (error) {
    console.error(
      "Logout error:",
      error
    );

    alert(error.message);

    return;
  }

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
    friendResults.style.display = "";
  }

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

  resetFriendCounts();
  resetProfileUI();

  await updateLoginButton();

  const accountMenu =
    document.getElementById(
      "accountMenu"
    );

  if (accountMenu) {
    accountMenu.classList.remove(
      "show"
    );
  }

  alert(
    "Logged out successfully."
  );
}


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    console.log(
      "YouRemo loaded."
    );

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
    }

    if (friendResults) {
      friendResults.innerHTML = "";
    }

    setupAccountMenu();

    const avatarInput =
      document.getElementById(
        "avatarInput"
      );

    if (avatarInput) {
      avatarInput.addEventListener(
        "change",
        uploadProfilePicture
      );
    }

    const navLinks =
      document.querySelectorAll(
        ".navbar nav a"
      );

    navLinks.forEach(
      function (link) {
        link.addEventListener(
          "click",
          function () {
            navLinks.forEach(
              function (item) {
                item.classList.remove(
                  "active"
                );
              }
            );

            this.classList.add(
              "active"
            );
          }
        );
      }
    );

    refreshAccountUI();
  }
);


// =====================================================
// AUTH STATE CHANGE
// =====================================================

supabaseClient.auth.onAuthStateChange(
  (event, session) => {
    console.log(
      "Auth event:",
      event
    );

    setTimeout(() => {
      refreshAccountUI();
    }, 100);
  }
);
