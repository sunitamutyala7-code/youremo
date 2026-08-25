const menuBtn=document.getElementById("menuBtn");const nav=document.getElementById("navLinks");if(menuBtn)menuBtn.addEventListener("click",()=>nav.classList.toggle("open"));
document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
document.querySelectorAll("#emotions button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#emotions button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected")}));
document.querySelectorAll(".support").forEach(btn=>btn.addEventListener("click",()=>{btn.classList.toggle("sent");btn.textContent=btn.classList.contains("sent")?"✓ Support sent":"♡ Support"}));
const shareBtn=document.getElementById("shareBtn"),status=document.getElementById("shareStatus");if(shareBtn)shareBtn.addEventListener("click",()=>{status.textContent="✓ Your feeling was shared with your friends.";setTimeout(()=>status.textContent="",3500)});
/* =========================
   FIND FRIENDS
========================= */

const friendsModal =
  document.getElementById("friendsModal");

const findFriends =
  document.getElementById("findFriends");

const closeFriends =
  document.getElementById("closeFriends");


/* OPEN MODAL */

findFriends?.addEventListener("click", () => {

  friendsModal.classList.add("show");

});


/* CLOSE MODAL */

closeFriends?.addEventListener("click", () => {

  friendsModal.classList.remove("show");

});


/* CLICK OUTSIDE */

friendsModal?.addEventListener("click", (event) => {

  if (event.target === friendsModal) {

    friendsModal.classList.remove("show");

  }

});


/* ESC KEY */

document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {

    friendsModal?.classList.remove("show");

  }

});


/* =========================
   SEARCH FRIENDS
========================= */

const friendSearch =
  document.getElementById("friendSearch");

const emptySearch =
  document.getElementById("emptySearch");


friendSearch?.addEventListener("input", () => {

  const search =
    friendSearch.value
      .toLowerCase()
      .trim();

  const friends =
    document.querySelectorAll(".suggestion");

  let found = 0;


  friends.forEach((friend) => {

    const name =
      friend.dataset.name
        .toLowerCase();

    if (name.includes(search)) {

      friend.style.display = "grid";

      found++;

    } else {

      friend.style.display = "none";

    }

  });


  if (found === 0) {

    emptySearch.style.display = "block";

  } else {

    emptySearch.style.display = "none";

  }

});


/* =========================
   ADD FRIEND
========================= */

document
  .querySelectorAll(".add-btn")
  .forEach((button) => {

    button.addEventListener("click", () => {

      button.textContent =
        "✓ Request sent";

      button.classList.add("requested");

      button.disabled = true;

    });

  });
