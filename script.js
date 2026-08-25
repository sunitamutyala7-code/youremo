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
