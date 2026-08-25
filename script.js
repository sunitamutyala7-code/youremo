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


document.querySelector(".login-btn").addEventListener("click", function() {
  alert("Login feature coming soon!");
});
function openAuth() {
  document.getElementById("authModal").style.display = "flex";
  showLogin();
}

function closeAuth() {
  document.getElementById("authModal").style.display = "none";
}

function showLogin() {
  document.getElementById("authTitle").textContent = "Welcome Back";
  document.getElementById("authSubtitle").textContent = "Login to your YouRemo account";

  document.getElementById("authName").style.display = "none";
  document.getElementById("authUsername").style.display = "none";

  document.querySelector(".auth-submit").textContent = "Login";
  document.querySelector(".auth-submit").onclick = login;

  document.querySelector(".auth-switch").innerHTML =
    'Don\'t have an account? <span onclick="showSignup()">Sign Up</span>';
}

function showSignup() {
  document.getElementById("authTitle").textContent = "Welcome to YouRemo";
  document.getElementById("authSubtitle").textContent = "Create your account";

  document.getElementById("authName").style.display = "block";
  document.getElementById("authUsername").style.display = "block";

  document.querySelector(".auth-submit").textContent = "Create Account";
  document.querySelector(".auth-submit").onclick = signUp;

  document.querySelector(".auth-switch").innerHTML =
    'Already have an account? <span onclick="showLogin()">Login</span>';
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

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
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
}
