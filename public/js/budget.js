function initializeEmojiPickers() {
  if (customElements.get("emoji-picker")) {
    setupEmojiPickers();
  } else {
    customElements.whenDefined("emoji-picker").then(() => {
      setupEmojiPickers();
    });
  }
}

function setupEmojiPickers() {
  const mainPicker = document.getElementById("emojiPicker");
  const mainEmojiInput = document.getElementById("selectedEmoji");

  if (mainPicker && mainEmojiInput) {
    mainEmojiInput.addEventListener("click", (e) => {
      e.stopPropagation();
      mainPicker.style.display =
        mainPicker.style.display === "block" ? "none" : "block";
    });

    mainPicker.addEventListener("emoji-click", (event) => {
      mainEmojiInput.value = event.detail.unicode;
      mainPicker.style.display = "none";
    });
  }

  document.querySelectorAll(".emojiPicker").forEach((picker) => {
    const input = picker.previousElementSibling;
    if (input && input.classList.contains("selectedEmoji")) {
      input.addEventListener("click", (e) => {
        e.stopPropagation();
        picker.style.display =
          picker.style.display === "block" ? "none" : "block";
      });

      picker.addEventListener("emoji-click", (event) => {
        input.value = event.detail.unicode;
        picker.style.display = "none";
      });
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".emoji-container")) {
      document.querySelectorAll("emoji-picker").forEach((picker) => {
        picker.style.display = "none";
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeEmojiPickers();

  document.querySelectorAll(".progress").forEach((bar) => {
    const spent = parseFloat(bar.dataset.spent) || 0;
    const total = parseFloat(bar.dataset.total) || 1;
    const percentage = Math.min(100, Math.round((spent / total) * 100));
    bar.style.width = `${percentage}%`;
  });

  document.addEventListener("DOMContentLoaded", () => {
    const progress = document.querySelectorAll(".progress");

    progress.forEach((pro) => {
      const spent = pro.dataset.spent;
      const total = pro.dataset.total;
      const progressPercentage = Math.round((spent / total) * 100);
      pro.style.width = `${progressPercentage}%`;
    });
  });
});

let createBudgetBox = document.querySelector(".createBudget");
let createBudgetPopup = document.querySelector(".createBudgetPopup");
let closePopup = document.querySelector(".closePopup");
let closeEditPopups = document.querySelectorAll(".closeEditPopup");
let budgetForm = document.getElementById("budgetForm");
let createBudgetBtn = document.querySelector(".createBudgetBtn");
let editBudgetButtons = document.querySelectorAll(".editBudget");
let editPopups = document.querySelectorAll(".edit-popup");
let progress = document.querySelectorAll(".progress");

let overlay = document.createElement("div");
overlay.classList.add("overlay");
document.body.appendChild(overlay);

createBudgetBox.addEventListener("click", (event) => {
  event.preventDefault();

  createBudgetPopup.classList.add("createBudgetPopupShow");
  overlay.classList.add("overlayShow");
});

closePopup.addEventListener("click", (event) => {
  event.preventDefault();
  createBudgetPopup.classList.remove("createBudgetPopupShow");
  overlay.classList.remove("overlayShow");
});

overlay.addEventListener("click", (event) => {
  event.preventDefault();
  createBudgetPopup.classList.remove("createBudgetPopupShow");
  overlay.classList.remove("overlayShow");
});

editBudgetButtons.forEach((button, index) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    editPopups[index].classList.add("editPopupShow");
    overlay.classList.add("overlayShow");
  });
});

closeEditPopups.forEach((button, index) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    editPopups[index].classList.remove("editPopupShow");
    overlay.classList.remove("overlayShow");
  });
});

overlay.addEventListener("click", (event) => {
  event.preventDefault();
  editPopups.forEach((popup) => popup.classList.remove("editPopupShow"));
  overlay.classList.remove("overlayShow");
});

// document
//   .getElementById("budgetForm")
//   .addEventListener("submit", async function (event) {
//     event.preventDefault();

//     const formData = new FormData(this);
//     const jsonData = {};
//     formData.forEach((value, key) => {
//       jsonData[key] = value;
//     });

//     await axios.post("/createBudget", jsonData);

//     window.location.reload();
//   });

// document.addEventListener("DOMContentLoaded", function () {
//   document
//     .getElementById("EditForm")
//     .addEventListener("submit", async function (event) {
//       event.preventDefault();
//       const formData = new FormData(this);
//       const jsonData = {};
//       formData.forEach((value, key) => {
//         jsonData[key] = value;
//       });

//       console.log(jsonData);

//       await axios.post("/editBudget", jsonData);
//       window.location.reload();
//     });
// });
