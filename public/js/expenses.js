const editpenButtons = document.querySelectorAll("#editpen");
const expensePopups = document.querySelectorAll(".expenseEditPopup");
const closeExpenseButtons = document.querySelectorAll(".closeExpensePopup");
const overlay = document.querySelector(".overlay"); // Ensure overlay exists

// Open popup
editpenButtons.forEach((button, index) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("clicked");
    expensePopups[index].classList.add("expenseEditPopupShow");
    overlay.classList.add("overlayShow");
  });
});

// Close popup
closeExpenseButtons.forEach((button, index) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    expensePopups[index].classList.remove("expenseEditPopupShow");
    overlay.classList.remove("overlayShow");
  });
});

// Close popup when overlay is clicked
overlay.addEventListener("click", (event) => {
  event.preventDefault();
  expensePopups.forEach((popup) =>
    popup.classList.remove("expenseEditPopupShow")
  );
  overlay.classList.remove("overlayShow");
});

// document.addEventListener("DOMContentLoaded", function () {
//   const expenseEditForm = document.getElementById("expenseEditForm");
//   if (expenseEditForm) {
//     expenseEditForm.addEventListener("submit", async function (event) {
//       event.preventDefault();
//       const formData = new FormData(this);
//       const jsonData = {};
//       formData.forEach((value, key) => {
//         jsonData[key] = value;
//       });

//       await axios.post("/expense/edit", jsonData);
//       window.location.reload();
//     });
//   }
// });
