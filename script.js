const SUPABASE_URL = "https://ykqnqdtekbxnevtjjkbd.supabase.co";

const SUPABASE_KEY = "sb_publishable_PRK8WX4OlSxntOJu76G_iw_UAoCye-w";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
function findFriends() {
  document.getElementById("friends").scrollIntoView({
    behavior: "smooth"
  });

  setTimeout(() => {
    document.getElementById("friendSearch").focus();
  }, 600);
}


function learnMore() {
  document.getElementById("about").scrollIntoView({
    behavior: "smooth"
  });
}
async function loadFriendRequests() {
  const container = document.getElementById("friendRequests");

  if (!container) return;

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    container.innerHTML = "<p>Please login to see friend requests.</p>";
    return;
  }

  const { data, error } = await supabaseClient
  .from("friend_requests")
  .select("id, sender_id, receiver_id, status")
  .eq("receiver_id", user.id)
  .eq("status", "pending");

  if (error) {
    console.error("Request loading error:", error);
    container.innerHTML = "<p>Unable to load friend requests.</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No new friend requests.</p>";
    return;
  }

  container.innerHTML = "";

data.forEach(function(request) {
  const card = document.createElement("div");
  card.className = "friend-card";

  card.innerHTML = `
    <div>
      <h3>Friend Request</h3>
      <p>A user wants to be your friend.</p>
    </div>

    <button onclick="acceptFriendRequest('${request.id}')">
      Accept
    </button>

    <button
      class="secondary-request"
      onclick="declineFriendRequest('${request.id}')">
      Decline
    </button>
  `;

  container.appendChild(card);
});  
}

loadFriendRequests();

async function searchFriends() {
  const searchInput = document.getElementById("friendSearch");
  const searchText = searchInput.value.trim();

  const results = document.getElementById("friendResults");

  if (searchText.length < 2) {
    results.innerHTML = "";
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .or(
      `username.ilike.%${searchText}%,full_name.ilike.%${searchText}%`
    )
    .limit(20);

  if (error) {
    console.error("Search error:", error);
    results.innerHTML = "<p>Unable to search users.</p>";
    return;
  }

  if (!data || data.length === 0) {
    results.innerHTML = "<p>No users found.</p>";
    return;
  }

  results.innerHTML = "";

  data.forEach(function(user) {
    const card = document.createElement("div");
    card.className = "friend-card";
    card.dataset.userId = user.id;
    const firstLetter =
      (user.full_name || user.username || "?")
        .charAt(0)
        .toUpperCase();

    card.innerHTML = `
      <div class="avatar">${firstLetter}</div>

      <div>
        <h3>${user.full_name || "User"}</h3>
        <p>@${user.username || "username"}</p>
      </div>

      <button
        data-user-id="${user.id}"
        onclick="addFriend(this)">
        Add Friend
      </button>
    `;

    results.appendChild(card);
  });
}


async function addFriend(button) {
  const receiverId = button.dataset.userId;

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

  const { error } = await supabaseClient
    .from("friend_requests")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending"
    });

  if (error) {
    console.error("Friend request error:", error);
    alert(error.message);
    return;
  }

  button.textContent = "Request Sent";
  button.disabled = true;
}



function openAuth() {
  const modal = document.getElementById("authModal");
  modal.style.display = "flex";

  showLogin();
}

function closeAuth() {
  document.getElementById("authModal").style.display = "none";
}

function showLogin() {
  document.getElementById("authTitle").textContent = "Welcome Back";
  document.getElementById("authSubtitle").textContent =
    "Login to your YouRemo account";

  document.getElementById("authName").style.display = "none";
  document.getElementById("authUsername").style.display = "none";

  document.getElementById("authEmail").style.display = "block";
  document.getElementById("authPassword").style.display = "block";

  const button = document.querySelector(".auth-submit");
  button.textContent = "Login";
  button.onclick = login;

  const switchText = document.querySelector(".auth-switch");
  switchText.innerHTML =
    "Don't have an account? <span onclick=\"showSignup()\">Sign Up</span>";
}

function showSignup() {
  document.getElementById("authTitle").textContent =
    "Welcome to YouRemo";

  document.getElementById("authSubtitle").textContent =
    "Create your account";

  document.getElementById("authName").style.display = "block";
  document.getElementById("authUsername").style.display = "block";
  document.getElementById("authEmail").style.display = "block";
  document.getElementById("authPassword").style.display = "block";

  document.getElementById("authName").placeholder = "Full name";
  document.getElementById("authUsername").placeholder = "Username";

  const button = document.querySelector(".auth-submit");
  button.textContent = "Create Account";
  button.onclick = signUp;

  const switchText = document.querySelector(".auth-switch");
  switchText.innerHTML =
    "Already have an account? <span onclick=\"showLogin()\">Login</span>";
}

async function signUp() {
  const name = document.getElementById("authName").value.trim();
  const username = document.getElementById("authUsername").value.trim();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  if (!name || !username || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert({
        id: data.user.id,
        username: username,
        full_name: name
      });

    if (profileError) {
      alert(profileError.message);
      return;
    }
  }

  alert("Account created successfully!");
  closeAuth();
}

async function login() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
    return;
  }

alert("Login successful!");
closeAuth();
updateLoginButton();
}
async function updateLoginButton() {
  const button = document.getElementById("loginButton");

  if (!button) return;

  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    button.textContent = "Login";
    return;
  }

  const user = data.session.user;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.log("Profile error:", error);
    return;
  }

  if (profile && profile.full_name) {
    button.textContent = profile.full_name;
  }
}

supabaseClient.auth.onAuthStateChange(function() {
  updateLoginButton();
});

updateLoginButton();
async function acceptFriendRequest(requestId) {
  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("Please login first.");
    return;
  }

  const { data: request, error: requestError } = await supabaseClient
    .from("friend_requests")
    .select("id, sender_id, receiver_id")
    .eq("id", requestId)
    .eq("receiver_id", user.id)
    .single();

  if (requestError || !request) {
    alert("Friend request not found.");
    return;
  }

  const { error: friendshipError } = await supabaseClient
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
    console.error("Friendship error:", friendshipError);
    alert(friendshipError.message);
    return;
  }

  const { error: updateError } = await supabaseClient
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (updateError) {
    alert(updateError.message);
    return;
  }

  alert("Friend added successfully! 🎉");

  loadFriendRequests();
}
