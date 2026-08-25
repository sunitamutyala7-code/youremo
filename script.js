const SUPABASE_URL = "https://ykqnqdtekbxnevtjjkbd.supabase.co";

const SUPABASE_KEY = "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
// ================================
// YouRemo - Main Script
// ================================


// ---------- FIND FRIENDS BUTTON ----------

function findFriends() {
  const friendsSection = document.getElementById("friends");

  if (friendsSection) {
    friendsSection.scrollIntoView({
      behavior: "smooth"
    });
  }

  setTimeout(() => {
    const searchInput = document.getElementById("friendSearch");

    if (searchInput) {
      searchInput.focus();
    }
  }, 600);
}


// ---------- LEARN MORE ----------

function learnMore() {
  const aboutSection = document.getElementById("about");

  if (aboutSection) {
    aboutSection.scrollIntoView({
      behavior: "smooth"
    });
  }
}


// ---------- AUTH MODAL ----------

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


// ---------- LOGIN FORM ----------

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


// ---------- SIGN UP FORM ----------

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
    name.placeholder = "Full name";
  }

  if (username) {
    username.style.display = "block";
    username.placeholder = "Username";
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


// ---------- SIGN UP ----------

async function signUp() {

  const nameElement = document.getElementById("authName");
  const usernameElement = document.getElementById("authUsername");
  const emailElement = document.getElementById("authEmail");
  const passwordElement = document.getElementById("authPassword");

  const name = nameElement ? nameElement.value.trim() : "";
  const username = usernameElement ? usernameElement.value.trim() : "";
  const email = emailElement ? emailElement.value.trim() : "";
  const password = passwordElement ? passwordElement.value : "";

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
      email: email,
      password: password
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
      .insert({
        id: data.user.id,
        username: username,
        full_name: name
      });

  if (profileError) {
    console.error("Profile error:", profileError);

    if (!profileError.message.toLowerCase().includes("duplicate")) {
      alert(profileError.message);
      return;
    }
  }

  alert("Account created successfully!");

  closeAuth();

  await updateLoginButton();
}


// ---------- LOGIN ----------

async function login() {

  const emailElement = document.getElementById("authEmail");
  const passwordElement = document.getElementById("authPassword");

  if (!emailElement || !passwordElement) {
    alert("Login form not found.");
    return;
  }

  const email = emailElement.value.trim();
  const password = passwordElement.value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (error) {
    console.error("Login error:", error);
    alert(error.message);
    return;
  }

  alert("Login successful!");

  closeAuth();

  await updateLoginButton();
  await loadFriendRequests();
}


// ---------- UPDATE LOGIN BUTTON ----------

async function updateLoginButton() {

  const button = document.getElementById("loginButton");

  if (!button) return;

  const { data, error } =
    await supabaseClient.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return;
  }

  if (!data.session) {
    button.textContent = "Login";
    return;
  }

  const user = data.session.user;

  const { data: profile, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) {
    console.error("Profile error:", profileError);
    return;
  }

  if (profile && profile.full_name) {
    button.textContent = profile.full_name;
  } else if (profile && profile.username) {
    button.textContent = profile.username;
  } else {
    button.textContent = "Account";
  }
}


// ---------- SEARCH FRIENDS ----------

async function searchFriends() {

  const searchInput =
    document.getElementById("friendSearch");

  const results =
    document.getElementById("friendResults");

  if (!searchInput || !results) {
    return;
  }

  const searchText =
    searchInput.value.trim();

  if (searchText.length < 2) {
    results.innerHTML = "";
    return;
  }

  const {
    data: { user: currentUser }
  } = await supabaseClient.auth.getUser();

  if (!currentUser) {
    results.innerHTML =
      "<p>Please login first.</p>";
    return;
  }

  const { data: users, error } =
    await supabaseClient
      .from("profiles")
      .select("id, username, full_name")
      .or(
        `username.ilike.%${searchText}%,full_name.ilike.%${searchText}%`
      )
      .limit(20);

  if (error) {
    console.error("Search error:", error);

    results.innerHTML =
      "<p>Unable to search users.</p>";

    return;
  }

  results.innerHTML = "";

  if (!users || users.length === 0) {

    results.innerHTML =
      "<p>No users found.</p>";

    return;
  }

  for (const person of users) {

    if (person.id === currentUser.id) {
      continue;
    }

    const {
      data: friendship,
      error: friendshipError
    } = await supabaseClient
      .from("friendships")
      .select("id")
      .or(
        `and(user_id.eq.${currentUser.id},friend_id.eq.${person.id}),and(user_id.eq.${person.id},friend_id.eq.${currentUser.id})`
      )
      .limit(1)
      .maybeSingle();

    if (friendshipError) {
      console.error(
        "Friendship check error:",
        friendshipError
      );
    }

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


// ---------- ADD FRIEND ----------

async function addFriend(button) {

  const receiverId =
    button.dataset.userId;

  if (!receiverId) {
    alert("User information is missing.");
    return;
  }

  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("Please login first.");
    return;
  }

  if (user.id === receiverId) {
    alert("You cannot add yourself.");
    return;
  }

  const {
    data: existingRequest
  } = await supabaseClient
    .from("friend_requests")
    .select("id, status")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();

  if (existingRequest) {

    if (existingRequest.status === "pending") {

      button.textContent =
        "Request Sent";

      button.disabled = true;

      return;
    }

    if (existingRequest.status === "accepted") {

      button.textContent =
        "Friends ✓";

      button.disabled = true;

      return;
    }
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

    console.error(
      "Friend request error:",
      error
    );

    alert(error.message);

    return;
  }

  button.textContent =
    "Request Sent";

  button.disabled = true;
}


// ---------- LOAD FRIEND REQUESTS ----------

async function loadFriendRequests() {

  const container =
    document.getElementById("friendRequests");

  if (!container) return;

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {

    container.innerHTML =
      "<p>Please login to see friend requests.</p>";

    return;
  }

  const { data, error } =
    await supabaseClient
      .from("friend_requests")
      .select(
        "id, sender_id, receiver_id, status"
      )
      .eq("receiver_id", user.id)
      .eq("status", "pending");

  if (error) {

    console.error(
      "Request loading error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load friend requests.</p>";

    return;
  }

  container.innerHTML = "";

  if (!data || data.length === 0) {

    container.innerHTML =
      "<p>No new friend requests.</p>";

    return;
  }

  for (const request of data) {

    const {
      data: profile
    } = await supabaseClient
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


// ---------- ACCEPT FRIEND REQUEST ----------

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
    error: requestError
  } = await supabaseClient
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id"
    )
    .eq("id", requestId)
    .eq("receiver_id", user.id)
    .single();

  if (requestError || !request) {

    console.error(
      "Request error:",
      requestError
    );

    alert(
      "Friend request not found."
    );

    return;
  }

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

    console.error(
      "Update request error:",
      updateError
    );

    alert(updateError.message);

    return;
  }

  alert(
    "Friend added successfully! 🎉"
  );

  await loadFriendRequests();
}


// ---------- DECLINE FRIEND REQUEST ----------

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

    console.error(
      "Decline error:",
      error
    );

    alert(error.message);

    return;
  }

  await loadFriendRequests();
}


// ---------- AUTH STATE ----------

supabaseClient.auth.onAuthStateChange(
  function() {

    updateLoginButton();
    loadFriendRequests();

  }
);


// ---------- START ----------

updateLoginButton();
loadFriendRequests();
async function loadMyFriends() {
  const container = document.getElementById("myFriendsList");

  if (!container) return;

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

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
    console.error("Friends loading error:", error);

    container.innerHTML =
      "<p>Unable to load friends.</p>";

    return;
  }

  if (!friendships || friendships.length === 0) {
    container.innerHTML =
      "<p>You don't have any friends yet.</p>";

    return;
  }

  container.innerHTML = "";

  for (const friendship of friendships) {

    const { data: profile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("id, full_name, username")
        .eq("id", friendship.friend_id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Friend profile error:",
        profileError
      );

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

    card.className = "friend-card";

    card.innerHTML = `
      <div class="avatar">
        ${firstLetter}
      </div>

      <div>
        <h3>${name}</h3>
        <p>@${username}</p>
      </div>

      <span class="friend-status">
        Friends ✓
      </span>
    `;

    container.appendChild(card);
  }
}
loadMyFriends();
