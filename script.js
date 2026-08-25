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


function searchFriends() {
  const searchInput = document.getElementById("friendSearch");
  const searchText = searchInput.value.toLowerCase().trim();

  const friendCards = document.querySelectorAll(".friend-card");

  friendCards.forEach(function(card) {
    const name = card.querySelector("h3").textContent.toLowerCase();
    const username = card.querySelector("p").textContent.toLowerCase();

    if (
      name.includes(searchText) ||
      username.includes(searchText)
    ) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}


function addFriend(button) {
  button.textContent = "Request Sent";
  button.disabled = true;

  button.style.background = "#22a06b";

  alert("Friend request sent!");
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
