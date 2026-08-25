// =====================================================
// YouRemo - Complete script.js
// =====================================================

const SUPABASE_URL = "https://ykqnqdtekbxnevtjjkbd.supabase.co";
const SUPABASE_KEY = "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

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
    section.scrollIntoView({ behavior: "smooth" });
  }

  setTimeout(() => {
    const input = document.getElementById("friendSearch");
    if (input) input.focus();
  }, 600);
}

function learnMore() {
  const section = document.getElementById("about");

  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
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

  if (title) title.textContent = "Welcome Back";
  if (subtitle) subtitle.textContent = "Login to your YouRemo account";

  if (name) name.style.display = "none";
  if (username) username.style.display = "none";

  if (email) email.style.display = "block";
  if (password) password.style.display = "block";

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

  if (title) title.textContent = "Welcome to YouRemo";
  if (subtitle) subtitle.textContent = "Create your account";

  if (name) name.style.display = "block";
  if (username) username.style.display = "block";
  if (email) email.style.display = "block";
  if (password) password.style.display = "block";

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
  const name = document.getElementById("authName")?.value.trim();
  const username = document.getElementById("authUsername")?.value.trim();
  const email = document.getElementById("authEmail")?.value.trim();
  const password = document.getElementById("authPassword")?.value;

  if (!name || !username || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
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
    console.error(error);
    alert(error.message);
    return;
  }

  if (!data.user) {
    alert("Account could not be created.");
    return;
  }

  const { error: profileError } = await supabaseClient
    .from("profiles")
    .upsert({
      id: data.user.id,
      username,
      full_name: name
    });

  if (profileError) {
    console.error(profileError);
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
  const email = document.getElementById("authEmail")?.value.trim();
  const password = document.getElementById("authPassword")?.value;

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
    console.error(error);
    alert(error.message);
    return;
  }

  alert("Login successful!");

  closeAuth();

  await refreshAccountUI();
}


// =====================================================
// REFRESH EVERYTHING FOR CURRENT ACCOUNT
// =====================================================

async function refreshAccountUI() {
  console.log("Refreshing account UI...");

  // First clear old account information
  resetProfileUI();
  resetFriendCounts();

  // Then load the CURRENT account
  await updateLoginButton();
  await loadMyProfile();
  await loadFriendRequests();
  await loadMyFriends();

  console.log("Account UI refreshed.");
}


// =====================================================
// RESET PROFILE UI
// =====================================================

function resetProfileUI() {
  const avatar = document.getElementById("myProfileAvatar");
  const name = document.getElementById("myProfileName");
  const username = document.getElementById("myProfileUsername");

  if (avatar) {
    avatar.innerHTML = "?";
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
    profileFriendCount.textContent = "0 Friends";
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

  if (!session) {
    button.textContent = "Login";

    if (navAvatar) {
      navAvatar.textContent = "?";
    }

    return;
  }

  const user = session.user;

  const { data: profile, error } =
    await supabaseClient
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
        (profile?.full_name || profile?.username || "U")
          .charAt(0)
          .toUpperCase();

      navAvatar.textContent = letter;
    }
  }
}


// =====================================================
// SEARCH FRIENDS
// =====================================================

async function searchFriends() {
  const input =
    document.getElementById("friendSearch");

  const results =
    document.getElementById("friendResults");

  if (!input || !results) return;

  const searchText =
    input.value.trim();

  if (searchText.length < 2) {
    results.innerHTML = "";
    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    results.innerHTML =
      "<p>Please login first.</p>";
    return;
  }

  const { data: users, error } =
    await supabaseClient
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .or(
        `username.ilike.%${searchText}%,full_name.ilike.%${searchText}%`
      )
      .limit(20);

  if (error) {
    console.error(error);
    results.innerHTML =
      "<p>Unable to search users.</p>";
    return;
  }

  results.innerHTML = "";

  const filteredUsers =
    (users || []).filter(person =>
      person.id !== user.id
    );

  if (filteredUsers.length === 0) {
    results.innerHTML =
      "<p>No users found.</p>";
    return;
  }

  for (const person of filteredUsers) {
    const { data: friendship } =
      await supabaseClient
        .from("friendships")
        .select("id")
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${person.id}),and(user_id.eq.${person.id},friend_id.eq.${user.id})`
        )
        .limit(1)
        .maybeSingle();

    const card =
      document.createElement("div");

    card.className = "friend-card";

    const name =
      person.full_name || "User";

    const username =
      person.username || "username";

    const firstLetter =
      name.charAt(0).toUpperCase();

    if (friendship) {
      card.innerHTML = `
        <div class="avatar">${firstLetter}</div>
        <div>
          <h3>${name}</h3>
          <p>@${username}</p>
        </div>
        <button disabled>
          Friends ✓
        </button>
      `;
    } else {
      card.innerHTML = `
        <div class="avatar">${firstLetter}</div>
        <div>
          <h3>${name}</h3>
          <p>@${username}</p>
        </div>
        <button
          data-user-id="${person.id}"
          onclick="addFriend(this)">
          Add Friend
        </button>
      `;
    }

    results.appendChild(card);
  }
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

  const { data: friendship } =
    await supabaseClient
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

  const { data: request } =
    await supabaseClient
      .from("friend_requests")
      .select("id, status")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();

  if (request?.status === "pending") {
    button.textContent = "Request Sent";
    button.disabled = true;
    return;
  }

  if (request?.status === "accepted") {
    button.textContent = "Friends ✓";
    button.disabled = true;
    return;
  }

  const { error } =
    await supabaseClient
      .from("friend_requests")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: "pending"
      });

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  button.textContent = "Request Sent";
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

    if (badge) badge.textContent = "0";

    return;
  }

  const { data: requests, error } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id, status"
      )
      .eq("receiver_id", user.id)
      .eq("status", "pending");

  if (error) {
    console.error(error);

    if (badge) badge.textContent = "0";

    container.innerHTML =
      "<p>Unable to load friend requests.</p>";

    return;
  }

  container.innerHTML = "";

  if (badge) {
    badge.textContent =
      String((requests || []).length);
  }

  if (!requests || requests.length === 0) {
    container.innerHTML =
      "<p>No new friend requests.</p>";
    return;
  }

  for (const request of requests) {
    const { data: profile } =
      await supabaseClient
        .from("profiles")
        .select("full_name, username")
        .eq("id", request.sender_id)
        .maybeSingle();

    const name =
      profile?.full_name || "User";

    const username =
      profile?.username || "username";

    const firstLetter =
      name.charAt(0).toUpperCase();

    const card =
      document.createElement("div");

    card.className = "friend-card";

    card.innerHTML = `
      <div class="avatar">${firstLetter}</div>

      <div>
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

  const { data: request, error } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id"
      )
      .eq("id", requestId)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .single();

  if (error || !request) {
    alert("Friend request not found.");
    return;
  }

  const { data: existingFriendship } =
    await supabaseClient
      .from("friendships")
      .select("id")
      .or(
        `and(user_id.eq.${user.id},friend_id.eq.${request.sender_id}),and(user_id.eq.${request.sender_id},friend_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();

  if (!existingFriendship) {
    const { error: friendshipError } =
      await supabaseClient
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
      console.error(friendshipError);
      alert(friendshipError.message);
      return;
    }
  }

  const { error: updateError } =
    await supabaseClient
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

  alert("Friend added successfully! 🎉");

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

  const { error } =
    await supabaseClient
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

    if (!container) return;

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();

    // IMPORTANT: always reset count first
    resetFriendCounts();

    if (!user) {
      container.innerHTML =
        "<p>Please login to see your friends.</p>";
      return;
    }

    const { data: friendships, error } =
      await supabaseClient
        .from("friendships")
        .select("friend_id")
        .eq("user_id", user.id);

    if (error) {
      console.error(
        "Friends loading error:",
        error
      );

      container.innerHTML =
        "<p>Unable to load friends.</p>";

      return;
    }

    // Remove duplicate IDs
    const uniqueFriendIds =
      [
        ...new Set(
          (friendships || []).map(
            friendship =>
              friendship.friend_id
          )
        )
      ];

    const totalFriends =
      uniqueFriendIds.length;

    // Update both counts
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
        `${totalFriends} ${
          totalFriends === 1
            ? "Friend"
            : "Friends"
        }`;
    }

    container.innerHTML = "";

    if (uniqueFriendIds.length === 0) {
      container.innerHTML =
        "<p>You don't have any friends yet.</p>";
      return;
    }

    for (const friendId of uniqueFriendIds) {
      const { data: profile, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select(
            "id, full_name, username, avatar_url"
          )
          .eq("id", friendId)
          .maybeSingle();

      if (profileError) {
        console.error(profileError);
        continue;
      }

      if (!profile) continue;

      const name =
        profile.full_name || "User";

      const username =
        profile.username || "username";

      const firstLetter =
        name.charAt(0).toUpperCase();

      const card =
        document.createElement("div");

      card.className =
        "friend-card friend-clickable";

      card.innerHTML = `
        <div class="avatar">
          ${firstLetter}
        </div>

        <div class="friend-info">
          <h3>${name}</h3>
          <p>@${username}</p>
        </div>

        <span class="friend-status">
          Friends ✓
        </span>
      `;

      card.onclick = () => {
        openFriendProfile(
          profile.id,
          name,
          username
        );
      };

      container.appendChild(card);
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

  // ALWAYS clear old account first
  if (avatar) {
    avatar.innerHTML = "?";
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
      "0 Friends";
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) return;

  const { data: profile, error } =
    await supabaseClient
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
  username
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
        ${firstLetter}
      </div>

      <h2>${name}</h2>

      <p>@${username}</p>

      <p class="profile-friend-status">
        ✓ You are friends
      </p>

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
// PROFILE PICTURE
// =====================================================

async function uploadProfilePicture() {
  const input =
    document.getElementById(
      "avatarInput"
    );

  if (!input?.files?.[0]) return;

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
    alert("Please select an image file.");
    input.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Image must be smaller than 5 MB.");
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

  const { error: uploadError } =
    await supabaseClient.storage
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
    console.error(uploadError);
    alert(uploadError.message);
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

  const { error: profileError } =
    await supabaseClient
      .from("profiles")
      .update({
        avatar_url: avatarUrl
      })
      .eq("id", user.id);

  if (profileError) {
    console.error(profileError);
    alert(profileError.message);
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

  const { data: profile, error } =
    await supabaseClient
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

  const { error } =
    await supabaseClient
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

function goToMyProfile() {
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
  const { error } =
    await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  // Immediately clear everything
  resetProfileUI();
  resetFriendCounts();

  const friendsList =
    document.getElementById(
      "myFriendsList"
    );

  if (friendsList) {
    friendsList.innerHTML =
      "<p>Please login to see your friends.</p>";
  }

  const requests =
    document.getElementById(
      "friendRequests"
    );

  if (requests) {
    requests.innerHTML =
      "<p>Please login to see friend requests.</p>";
  }

  const badge =
    document.getElementById(
      "requestBadge"
    );

  if (badge) {
    badge.textContent = "0";
  }

  await updateLoginButton();

  alert(
    "Logged out successfully."
  );
}


// =====================================================
// AVATAR INPUT
// =====================================================

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


// =====================================================
// AUTH STATE CHANGE
// =====================================================

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "Auth event:",
      event
    );

    // Run after the auth event completes
    setTimeout(
      () => {
        refreshAccountUI();
      },
      100
    );
  }
);


// =====================================================
// INITIAL LOAD
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    refreshAccountUI();
  }
);
