// =====================================================
// YouRemo - Complete script.js
// =====================================================


// =====================================================
// 1. SUPABASE CONFIGURATION
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
// 2. NAVIGATION
// =====================================================

function findFriends() {

  const section =
    document.getElementById("friends");

  if (section) {

    section.scrollIntoView({
      behavior: "smooth"
    });

  }

  setTimeout(function () {

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
// 3. LOGIN / AUTH MODAL
// =====================================================

function openAuth() {

  const modal =
    document.getElementById("authModal");

  if (!modal) {

    console.error(
      "authModal not found"
    );

    return;
  }

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

    button.textContent =
      "Login";

    button.onclick =
      login;
  }

  if (switchText) {

    switchText.innerHTML =
      'Don\'t have an account? <span onclick="showSignup()">Sign Up</span>';
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
      'Already have an account? <span onclick="showLogin()">Login</span>';
  }
}


// =====================================================
// 4. SIGN UP
// =====================================================

async function signUp() {

  const name =
    document
      .getElementById("authName")
      .value
      .trim();

  const username =
    document
      .getElementById("authUsername")
      .value
      .trim();

  const email =
    document
      .getElementById("authEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("authPassword")
      .value;

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

    console.error(
      "Signup error:",
      result.error
    );

    alert(
      result.error.message
    );

    return;
  }

  if (!result.data.user) {

    alert(
      "Account could not be created."
    );

    return;
  }

  const profileResult =
    await supabaseClient
      .from("profiles")
      .insert({

        id: result.data.user.id,

        username: username,

        full_name: name

      });

  if (profileResult.error) {

    console.error(
      "Profile creation error:",
      profileResult.error
    );

    if (
      !profileResult.error.message
        .toLowerCase()
        .includes("duplicate")
    ) {

      alert(
        profileResult.error.message
      );

      return;
    }
  }

  alert(
    "Account created successfully!"
  );

  closeAuth();

  await updateLoginButton();
  await loadMyProfile();
  await loadMyFriends();
}


// =====================================================
// 5. LOGIN
// =====================================================

async function login() {

  const email =
    document
      .getElementById("authEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("authPassword")
      .value;

  if (!email || !password) {

    alert(
      "Please enter your email and password."
    );

    return;
  }

  const result =
    await supabaseClient.auth.signInWithPassword({

      email: email,

      password: password

    });

  if (result.error) {

    console.error(
      "Login error:",
      result.error
    );

    alert(
      result.error.message
    );

    return;
  }

  alert(
    "Login successful!"
  );

  closeAuth();

  await updateLoginButton();
  await loadFriendRequests();
  await loadMyFriends();
  await loadMyProfile();
}


// =====================================================
// 6. LOGIN BUTTON / NAVBAR PROFILE
// =====================================================

async function updateLoginButton() {

  const button =
    document.getElementById("loginButton");

  const navAvatar =
    document.getElementById("navAvatar");

  if (!button) return;

  const {
    data: { session }
  } =
    await supabaseClient.auth.getSession();

  if (!session) {

    button.textContent =
      "Login";

    if (navAvatar) {

      navAvatar.innerHTML =
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
      .eq("id", user.id)
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

  if (
    profile &&
    profile.full_name
  ) {

    button.textContent =
      profile.full_name;

  } else if (
    profile &&
    profile.username
  ) {

    button.textContent =
      profile.username;

  } else {

    button.textContent =
      "Account";
  }

  if (navAvatar) {

    if (
      profile &&
      profile.avatar_url
    ) {

      navAvatar.innerHTML = `
        <img
          src="${profile.avatar_url}?v=${Date.now()}"
          alt="Profile"
        >
      `;

    } else {

      const firstLetter =
        (
          profile?.full_name ||
          "U"
        )
          .charAt(0)
          .toUpperCase();

      navAvatar.textContent =
        firstLetter;
    }
  }
}


// =====================================================
// 7. SEARCH FRIENDS
// =====================================================

async function searchFriends() {

  const input =
    document.getElementById("friendSearch");

  const results =
    document.getElementById("friendResults");

  if (!input || !results) {
    return;
  }

  const searchText =
    input.value.trim();

  if (searchText.length < 2) {

    results.innerHTML =
      "";

    return;
  }

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {

    results.innerHTML =
      "<p>Please login first.</p>";

    return;
  }

  const result =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username, full_name"
      )
      .or(
        "username.ilike.%" +
        searchText +
        "%,full_name.ilike.%" +
        searchText +
        "%"
      )
      .limit(20);

  if (result.error) {

    console.error(
      "Search error:",
      result.error
    );

    results.innerHTML =
      "<p>Unable to search users.</p>";

    return;
  }

  const users =
    result.data;

  results.innerHTML =
    "";

  if (
    !users ||
    users.length === 0
  ) {

    results.innerHTML =
      "<p>No users found.</p>";

    return;
  }

  for (const person of users) {

    if (person.id === user.id) {
      continue;
    }

    const friendshipResult =
      await supabaseClient
        .from("friendships")
        .select("id")
        .or(
          "and(user_id.eq." +
          user.id +
          ",friend_id.eq." +
          person.id +
          "),and(user_id.eq." +
          person.id +
          ",friend_id.eq." +
          user.id +
          ")"
        )
        .limit(1)
        .maybeSingle();

    const friendship =
      friendshipResult.data;

    const card =
      document.createElement("div");

    card.className =
      "friend-card";

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

    if (friendship) {

      card.innerHTML = `
        <div class="avatar">
          ${firstLetter}
        </div>

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
        <div class="avatar">
          ${firstLetter}
        </div>

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
// 8. ADD FRIEND
// =====================================================

async function addFriend(button) {

  const receiverId =
    button.dataset.userId;

  if (!receiverId) {

    alert(
      "User information is missing."
    );

    return;
  }

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }

  if (user.id === receiverId) {

    alert(
      "You cannot add yourself."
    );

    return;
  }

  const friendshipResult =
    await supabaseClient
      .from("friendships")
      .select("id")
      .or(
        "and(user_id.eq." +
        user.id +
        ",friend_id.eq." +
        receiverId +
        "),and(user_id.eq." +
        receiverId +
        ",friend_id.eq." +
        user.id +
        ")"
      )
      .limit(1)
      .maybeSingle();

  if (friendshipResult.data) {

    button.textContent =
      "Friends ✓";

    button.disabled =
      true;

    return;
  }

  const requestResult =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, status"
      )
      .or(
        "and(sender_id.eq." +
        user.id +
        ",receiver_id.eq." +
        receiverId +
        "),and(sender_id.eq." +
        receiverId +
        ",receiver_id.eq." +
        user.id +
        ")"
      )
      .limit(1)
      .maybeSingle();

  const existingRequest =
    requestResult.data;

  if (existingRequest) {

    if (
      existingRequest.status ===
      "pending"
    ) {

      button.textContent =
        "Request Sent";

      button.disabled =
        true;

      return;
    }

    if (
      existingRequest.status ===
      "accepted"
    ) {

      button.textContent =
        "Friends ✓";

      button.disabled =
        true;

      return;
    }
  }

  const insertResult =
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

  if (insertResult.error) {

    console.error(
      "Friend request error:",
      insertResult.error
    );

    alert(
      insertResult.error.message
    );

    return;
  }

  button.textContent =
    "Request Sent";

  button.disabled =
    true;
}


// =====================================================
// 9. LOAD FRIEND REQUESTS
// =====================================================

async function loadFriendRequests() {

  const container =
    document.getElementById(
      "friendRequests"
    );

  const requestBadge =
    document.getElementById(
      "requestBadge"
    );

  if (!container) {
    return;
  }

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {

    container.innerHTML =
      "<p>Please login to see friend requests.</p>";

    if (requestBadge) {
      requestBadge.textContent =
        "0";
    }

    return;
  }

  const result =
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

  if (result.error) {

    console.error(
      "Request loading error:",
      result.error
    );

    container.innerHTML =
      "<p>Unable to load friend requests.</p>";

    return;
  }

  const requests =
    result.data || [];

  if (requestBadge) {

    requestBadge.textContent =
      requests.length;
  }

  container.innerHTML =
    "";

  if (requests.length === 0) {

    container.innerHTML =
      "<p>No new friend requests.</p>";

    return;
  }

  for (const request of requests) {

    const profileResult =
      await supabaseClient
        .from("profiles")
        .select(
          "full_name, username"
        )
        .eq(
          "id",
          request.sender_id
        )
        .maybeSingle();

    const profile =
      profileResult.data;

    const name =
      profile?.full_name ||
      "User";

    const username =
      profile?.username ||
      "username";

    const firstLetter =
      name
        .charAt(0)
        .toUpperCase();

    const card =
      document.createElement("div");

    card.className =
      "friend-card";

    card.innerHTML = `
      <div class="avatar">
        ${firstLetter}
      </div>

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
// 10. ACCEPT FRIEND REQUEST
// =====================================================

async function acceptFriendRequest(
  requestId
) {

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }

  const requestResult =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id"
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

  const request =
    requestResult.data;

  if (
    requestResult.error ||
    !request
  ) {

    console.error(
      "Request error:",
      requestResult.error
    );

    alert(
      "Friend request not found."
    );

    return;
  }

  const friendshipResult =
    await supabaseClient
      .from("friendships")
      .select("id")
      .or(
        "and(user_id.eq." +
        user.id +
        ",friend_id.eq." +
        request.sender_id +
        "),and(user_id.eq." +
        request.sender_id +
        ",friend_id.eq." +
        user.id +
        ")"
      )
      .limit(1)
      .maybeSingle();

  if (!friendshipResult.data) {

    const insertResult =
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

    if (insertResult.error) {

      console.error(
        "Friendship error:",
        insertResult.error
      );

      alert(
        insertResult.error.message
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
      )
      .eq(
        "receiver_id",
        user.id
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
    "Friend added successfully! 🎉"
  );

  await loadFriendRequests();
  await loadMyFriends();
}


// =====================================================
// 11. DECLINE FRIEND REQUEST
// =====================================================

async function declineFriendRequest(
  requestId
) {

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }

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
        user.id
      );

  if (result.error) {

    console.error(
      "Decline error:",
      result.error
    );

    alert(
      result.error.message
    );

    return;
  }

  await loadFriendRequests();
}


// =====================================================
// 12. LOAD MY FRIENDS
// =====================================================

let loadingMyFriends =
  false;

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
      data: { user }
    } =
      await supabaseClient.auth.getUser();

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
        .select("friend_id")
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

    // Remove duplicates
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

    // Update My Friends count
    const friendCount =
      document.getElementById(
        "friendCount"
      );

    if (friendCount) {

      friendCount.textContent =
        `${totalFriends} ${
          totalFriends === 1
            ? "Friend"
            : "Friends"
        }`;
    }

    // Update Profile friends count
    const profileFriendCount =
      document.getElementById(
        "profileFriendCount"
      );

    if (profileFriendCount) {

      profileFriendCount.textContent =
        totalFriends;
    }

    container.innerHTML =
      "";

    if (
      uniqueFriendIds.length === 0
    ) {

      container.innerHTML =
        "<p>You don't have any friends yet.</p>";

      return;
    }

    // Load every unique friend
    for (
      const friendId
      of uniqueFriendIds
    ) {

      const {
        data: profile,
        error: profileError
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id, full_name, username"
          )
          .eq(
            "id",
            friendId
          )
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
        profile.full_name ||
        "User";

      const username =
        profile.username ||
        "username";

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

      card.dataset.friendId =
        friendId;

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

      card.onclick =
        function () {

          openFriendProfile(
            profile.id,
            name,
            username
          );

        };

      container.appendChild(
        card
      );
    }

  } finally {

    loadingMyFriends =
      false;

  }
}


// =====================================================
// 13. FRIEND PROFILE
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
    name
      .charAt(0)
      .toUpperCase();

  const modal =
    document.createElement(
      "div"
    );

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

  document.body.appendChild(
    modal
  );
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
// 14. LOAD MY PROFILE
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

  if (!avatar) {
    return;
  }

  // Clear previous account
  avatar.innerHTML =
    "?";

  if (nameElement) {

    nameElement.textContent =
      "Your Name";
  }

  if (usernameElement) {

    usernameElement.textContent =
      "@username";
  }

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

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

  if (profile.avatar_url) {

    avatar.innerHTML = `
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


// =====================================================
// 15. PROFILE PICTURE UPLOAD
// =====================================================

async function uploadProfilePicture() {

  const input =
    document.getElementById(
      "avatarInput"
    );

  if (
    !input ||
    !input.files ||
    !input.files[0]
  ) {

    return;
  }

  const file =
    input.files[0];

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {

    alert(
      "Please login first."
    );

    input.value =
      "";

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

    input.value =
      "";

    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {

    alert(
      "Image must be smaller than 5 MB."
    );

    input.value =
      "";

    return;
  }

  const fileExtension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  const filePath =
    `${user.id}.${fileExtension}`;

  const {
    error: uploadError
  } =
    await supabaseClient.storage
      .from("avatars")
      .upload(
        filePath,
        file,
        {
          upsert:
            true,

          contentType:
            file.type
        }
      );

  if (uploadError) {

    console.error(
      "Avatar upload error:",
      uploadError
    );

    alert(
      uploadError.message
    );

    input.value =
      "";

    return;
  }

  const {
    data: publicUrlData
  } =
    supabaseClient.storage
      .from("avatars")
      .getPublicUrl(
        filePath
      );

  const avatarUrl =
    publicUrlData.publicUrl;

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
        user.id
      );

  if (profileError) {

    console.error(
      "Profile update error:",
      profileError
    );

    alert(
      profileError.message
    );

    input.value =
      "";

    return;
  }

  await loadMyProfile();
  await updateLoginButton();

  alert(
    "Profile picture updated! 🎉"
  );

  input.value =
    "";
}


// =====================================================
// 16. ACCOUNT MENU
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
    async function (event) {

      event.stopPropagation();

      const {
        data: { session }
      } =
        await supabaseClient.auth.getSession();

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
  function () {

    if (accountMenu) {

      accountMenu.classList.remove(
        "show"
      );
    }

  }
);


// =====================================================
// 17. GO TO MY PROFILE
// =====================================================

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
      behavior:
        "smooth"
    });
  }
}


// =====================================================
// 18. LOGOUT
// =====================================================

async function logout() {

  const {
    error
  } =
    await supabaseClient.auth.signOut();

  if (error) {

    console.error(
      "Logout error:",
      error
    );

    alert(
      error.message
    );

    return;
  }

  if (accountMenu) {

    accountMenu.classList.remove(
      "show"
    );
  }

  await updateLoginButton();
  await loadFriendRequests();
  await loadMyFriends();
  await loadMyProfile();

  alert(
    "Logged out successfully."
  );
}


// =====================================================
// 19. EDIT PROFILE
// =====================================================

async function openEditProfile() {

  if (accountMenu) {

    accountMenu.classList.remove(
      "show"
    );
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

    console.error(
      "Edit profile elements not found."
    );

    return;
  }

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {

    alert(
      "Please login first."
    );

    return;
  }

  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "full_name, username"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (error) {

    console.error(
      "Edit profile loading error:",
      error
    );

    alert(
      error.message
    );

    return;
  }

  nameInput.value =
    profile?.full_name ||
    "";

  usernameInput.value =
    profile?.username ||
    "";

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
  } =
    await supabaseClient.auth.getUser();

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
      .from("profiles")
      .update({

        full_name:
          name,

        username:
          username

      })
      .eq(
        "id",
        user.id
      );

  if (error) {

    console.error(
      "Profile update error:",
      error
    );

    alert(
      error.message
    );

    return;
  }

  closeEditProfile();

  await updateLoginButton();
  await loadMyProfile();

  alert(
    "Profile updated successfully! 🎉"
  );
}


// =====================================================
// 20. AUTH STATE CHANGE
// =====================================================

supabaseClient.auth.onAuthStateChange(
  function () {

    updateLoginButton();
    loadFriendRequests();
    loadMyFriends();
    loadMyProfile();

  }
);


// =====================================================
// 21. INITIALIZE
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    updateLoginButton();

    loadFriendRequests();

    loadMyFriends();

    loadMyProfile();

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

  }
);
