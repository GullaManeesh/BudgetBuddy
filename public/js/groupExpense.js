const createGroupDiv = document.querySelector(".create-group-div");
const createGroup = document.querySelector(".createGroup");
const overlay = document.querySelector(".overlay");
const createdGroup = document.querySelectorAll(".createdGroup");
const groupDetailsBtn = document.querySelectorAll(".groupDetailsBtn");
const groupDetails = document.querySelector(".groupDetails");
const editGroupDetails = document.querySelectorAll(".EditGroupDetails");
const editGroupDiv = document.querySelectorAll(".edit-group-div");
const closeEditgroup = document.getElementById("closeEditGroup");
const splitOptions = document.querySelectorAll("input[name='splitOption']");
const manualSplitContainer = document.getElementById("manualSplitContainer");
const form = document.querySelector(".expense-form");
const addSymbol = document.querySelectorAll(".addSymbol");
const groupExpenseFormContainer = document.querySelectorAll(
  ".expense-form-container"
);
const closeGroupExpense = document.getElementById("closeGroupExpense");

// Open create group modal
createGroup.addEventListener("click", (event) => {
  event.preventDefault();
  createGroupDiv.classList.add("create-group-div-popup");
  overlay.classList.add("overlayShow");
});

// Group details + send ID
groupDetailsBtn.forEach((btn) => {
  btn.addEventListener("click", async (event) => {
    event.preventDefault();
    const groupId = btn.dataset.selgroupid;

    try {
      btn.textContent = "Loading...";

      // (1) FIRST: Wait for the fetch to complete
      const response = await fetch(`/groups/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      groupDetails.classList.add("groupDetailsShow");
      overlay.classList.add("overlayShow");
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to load group details. Please try again.");
    } finally {
      btn.textContent = "Group Details";
    }
  });
});

overlay.addEventListener("click", (event) => {
  createGroupDiv.classList.remove("create-group-div-popup");

  document.querySelectorAll(".groupDetails").forEach((group) => {
    group.classList.remove("groupDetailsShow");
  });

  editGroupDiv.forEach((editDiv) => {
    editDiv.classList.remove("edit-group-div-show");
  });

  groupExpenseFormContainer.forEach((div) => {
    div.classList.remove("expense-form-container-show");
  });

  overlay.classList.remove("overlayShow");
  window.location.reload();
});

// Scroll inside groupDetails
document.querySelectorAll(".gdSec a").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href").substring(1);
    const target = document.getElementById(targetId);
    const container = document.querySelector(".gdBody");

    if (target && container) {
      container.scrollLeft = target.offsetLeft;
    }
  });
});

// Edit group modal
editGroupDetails.forEach((editbtn, index) => {
  editbtn.addEventListener("click", (event) => {
    event.preventDefault();
    editGroupDiv[index].classList.add("edit-group-div-show");
  });
});

closeEditgroup?.addEventListener("click", (event) => {
  event.preventDefault();
  editGroupDiv.forEach((editDiv) => {
    editDiv.classList.remove("edit-group-div-show");
  });
});

// Show/hide manual split
splitOptions.forEach((option) => {
  option.addEventListener("change", () => {
    if (option.value === "manual" && option.checked) {
      manualSplitContainer.style.display = "block";
    } else {
      manualSplitContainer.style.display = "none";
    }
  });
});

// Submit expense form
form?.addEventListener("submit", function (e) {
  const selectedSplit = form.querySelector(
    "input[name='splitOption']:checked"
  )?.value;

  if (selectedSplit === "manual") {
    const splits = [];
    const inputs = manualSplitContainer.querySelectorAll("input");

    let totalSplitAmount = 0;

    inputs.forEach((input) => {
      const member = input.name.match(/\[(.*?)\]/)[1];
      let amount = Math.abs(Math.floor(parseFloat(input.value) || 0));
      splits.push({ member, amount });
      totalSplitAmount += amount;
    });

    const enteredAmountRaw = form.querySelector("#amountInput")?.value || 0;
    const enteredAmount = Math.abs(Math.floor(parseFloat(enteredAmountRaw)));

    console.log("Total Split Amount:", totalSplitAmount);
    console.log("Entered Amount:", enteredAmount);

    if (totalSplitAmount !== enteredAmount) {
      alert("Manual split amounts do not add up to the total amount.");
      e.preventDefault();
      return;
    }

    const splitsJsonField = form.querySelector("#splitsJson");
    if (splitsJsonField) {
      splitsJsonField.value = JSON.stringify(splits);
    }
  }
});

// Show add expense form
addSymbol.forEach((button, index) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    groupExpenseFormContainer[index].classList.add(
      "expense-form-container-show"
    );
  });
});

// Close add expense form
closeGroupExpense?.addEventListener("click", (event) => {
  event.preventDefault();
  groupExpenseFormContainer.forEach((Div) => {
    Div.classList.remove("expense-form-container-show");
  });
});

// Calculate balances
function calculateBalances(group) {
  const balances = {};
  group.members.forEach((member) => {
    balances[member.name] = 0;
  });

  group.expenses.forEach((exp) => {
    const totalAmount = exp.amount;
    const paidBy = exp.paidBy;

    if (exp.splitOption === "equal") {
      const perPerson = totalAmount / group.members.length;
      group.members.forEach((member) => {
        if (member.name === paidBy) {
          balances[paidBy] += totalAmount - perPerson;
        } else {
          balances[member.name] -= perPerson;
        }
      });
    } else {
      exp.splits.forEach((split) => {
        if (split.member === paidBy) {
          balances[paidBy] += split.amount;
        } else {
          balances[split.member] -= split.amount;
        }
      });
    }
  });

  return balances;
}

// Load balances
document.addEventListener("DOMContentLoaded", function () {
  const gdBody = document.querySelector(".gdBody");
  const balanceContainer = document.querySelector("#balanceContent");

  if (!gdBody || !balanceContainer || !gdBody.dataset.group) return;

  const group = JSON.parse(gdBody.dataset.group);
  const balances = calculateBalances(group);
  const entries = Object.entries(balances);

  if (entries.length === 0) {
    balanceContainer.innerHTML = "<p>No balances to show.</p>";
    return;
  }

  entries.forEach(([name, balance]) => {
    const row = document.createElement("div");
    row.className = "balance-row";
    row.style =
      "display: flex; justify-content: space-between; padding: 5px 0;";

    const left = document.createElement("span");
    left.textContent = name;

    const right = document.createElement("span");
    right.textContent =
      (balance >= 0 ? "+" : "-") + "₹" + Math.abs(balance).toFixed(2);
    right.style.color = balance >= 0 ? "green" : "red";

    row.appendChild(left);
    row.appendChild(right);
    balanceContainer.appendChild(row);
  });
});

// Expense modal (view/edit)
const expenseModal = document.getElementById("expenseModal");
const closeExpenseModal = document.getElementById("closeExpenseModal");

// Expense Click Handler
document.querySelectorAll(".expense-clickable").forEach((exp) => {
  exp.addEventListener("click", () => {
    // Set basic fields
    document.getElementById("modalExpenseId").value = exp.dataset.id;
    document.getElementById("modalDeleteId").value = exp.dataset.id;
    document.getElementById("modalTitle").value = exp.dataset.title;
    document.getElementById("modalAmount").value = exp.dataset.amount;
    document.getElementById("modalDate").value = new Date(exp.dataset.date)
      .toISOString()
      .split("T")[0];
    document.getElementById("modalPaidBy").value = exp.dataset.paidby;
    document.getElementById("modalSplitOption").value = exp.dataset.split;

    // Handle splits
    const splitOption = exp.dataset.split;
    const manualSplitContainer = document.getElementById(
      "modalManualSplitContainer"
    );
    const splits = JSON.parse(exp.dataset.splits || "[]");

    if (splitOption === "manual") {
      manualSplitContainer.style.display = "block";

      // Reset all split inputs to 0 first
      document
        .querySelectorAll("#modalManualSplitContainer input")
        .forEach((input) => {
          input.value = 0;
        });

      // Set only actual split values > 0
      splits.forEach((split) => {
        const input = document.querySelector(
          `#modalManualSplitContainer input[name="manualSplits[${split.member}]"]`
        );
        if (input) {
          input.value = split.amount;
        }
      });
    } else {
      manualSplitContainer.style.display = "none";
    }

    expenseModal.style.display = "block";
  });
});

// Close Modal
closeExpenseModal?.addEventListener("click", () => {
  expenseModal.style.display = "none";
});

// Split Option Change Handler
document
  .getElementById("modalSplitOption")
  ?.addEventListener("change", function () {
    const manualSplitContainer = document.getElementById(
      "modalManualSplitContainer"
    );
    manualSplitContainer.style.display =
      this.value === "manual" ? "block" : "none";
  });

// Form Submission
document
  .querySelector("#expenseModal form")
  ?.addEventListener("submit", function (e) {
    const splitOption = document.getElementById("modalSplitOption").value;
    const splitsField = document.getElementById("modalSplits");

    if (splitOption === "manual") {
      const splits = [];
      const inputs = document.querySelectorAll(
        "#modalManualSplitContainer input"
      );

      let totalSplitAmount = 0;
      const seenMembers = new Set();

      inputs.forEach((input) => {
        const member = input.name.match(/\[(.*?)\]/)[1];
        const amount = parseFloat(input.value) || 0;

        // Only add members with amount > 0 and not already added
        if (amount > 0 && !seenMembers.has(member)) {
          splits.push({ member, amount });
          totalSplitAmount += amount;
          seenMembers.add(member);
        }
      });

      const totalAmount =
        parseFloat(document.getElementById("modalAmount").value) || 0;

      if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
        alert("Manual split amounts must add up to the total amount");
        e.preventDefault();
        return;
      }

      splitsField.value = JSON.stringify(splits);
    } else {
      splitsField.value = JSON.stringify([]);
    }
  });
