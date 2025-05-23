document.addEventListener("DOMContentLoaded", function () {
  // Cache DOM elements with null checks
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
  const expenseModal = document.getElementById("expenseModal");
  const closeExpenseModal = document.getElementById("closeExpenseModal");
  const settleModal = document.getElementById("settleModal");
  const closeSettleModal = document.getElementById("closeSettleModal");

  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      navLinks.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Helper function for safe JSON parsing
  function safeJsonParse(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON parse error:", e);
      return null;
    }
  }

  // Format amount to whole number
  function formatAmount(amount) {
    return Math.round(parseFloat(amount));
  }

  // Open create group modal
  if (createGroup && createGroupDiv && overlay) {
    createGroup.addEventListener("click", (event) => {
      event.preventDefault();
      createGroupDiv.classList.add("create-group-div-popup");
      overlay.classList.add("overlayShow");
    });
  }

  // Group details + send ID
  if (groupDetailsBtn.length > 0) {
    groupDetailsBtn.forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        event.preventDefault();
        const groupId = btn.dataset.selgroupid;

        try {
          btn.textContent = "Loading...";

          const response = await fetch(`/groups/${groupId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          if (groupDetails) {
            groupDetails.classList.add("groupDetailsShow");
            overlay?.classList.add("overlayShow");
          }
        } catch (error) {
          console.error("Fetch error:", error);
          alert("Failed to load group details. Please try again.");
        } finally {
          btn.textContent = "Group Details";
        }
      });
    });
  }

  // Overlay click handler
  if (overlay) {
    overlay.addEventListener("click", (event) => {
      window.location.reload();
      if (createGroupDiv)
        createGroupDiv.classList.remove("create-group-div-popup");

      if (groupDetails) {
        groupDetails.classList.remove("groupDetailsShow");
      }

      if (editGroupDiv) {
        editGroupDiv.forEach((editDiv) => {
          editDiv.classList.remove("edit-group-div-show");
        });
      }

      if (groupExpenseFormContainer) {
        groupExpenseFormContainer.forEach((div) => {
          div.classList.remove("expense-form-container-show");
        });
      }

      if (expenseModal) expenseModal.style.display = "none";
      if (settleModal) settleModal.style.display = "none";

      overlay.classList.remove("overlayShow");
    });
  }

  // Scroll inside groupDetails
  const gdSecLinks = document.querySelectorAll(".gdSec a");
  if (gdSecLinks.length > 0) {
    gdSecLinks.forEach((link) => {
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
  }

  // Edit group modal
  if (editGroupDetails.length > 0 && editGroupDiv.length > 0) {
    editGroupDetails.forEach((editbtn, index) => {
      editbtn.addEventListener("click", (event) => {
        event.preventDefault();
        editGroupDiv[index].classList.add("edit-group-div-show");
      });
    });
  }

  if (closeEditgroup) {
    closeEditgroup.addEventListener("click", (event) => {
      event.preventDefault();
      if (editGroupDiv) {
        editGroupDiv.forEach((editDiv) => {
          editDiv.classList.remove("edit-group-div-show");
        });
      }
    });
  }

  // Show/hide manual split
  if (splitOptions.length > 0 && manualSplitContainer) {
    splitOptions.forEach((option) => {
      option.addEventListener("change", () => {
        if (option.value === "manual" && option.checked) {
          manualSplitContainer.style.display = "block";
        } else {
          manualSplitContainer.style.display = "none";
        }
      });
    });
  }

  // Submit expense form
  if (form) {
    form.addEventListener("submit", function (e) {
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
        const enteredAmount = Math.abs(
          Math.floor(parseFloat(enteredAmountRaw))
        );

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
  }

  // Show add expense form
  if (addSymbol.length > 0 && groupExpenseFormContainer.length > 0) {
    addSymbol.forEach((button, index) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        groupExpenseFormContainer[index].classList.add(
          "expense-form-container-show"
        );
      });
    });
  }

  // Close add expense form
  if (closeGroupExpense && groupExpenseFormContainer.length > 0) {
    closeGroupExpense.addEventListener("click", (event) => {
      event.preventDefault();
      groupExpenseFormContainer.forEach((Div) => {
        Div.classList.remove("expense-form-container-show");
      });
    });
  }

  // Calculate balances
  function calculateBalances(group) {
    const balances = {};
    const owes = {};

    // Initialize balances and owes for all members
    if (group.members) {
      group.members.forEach((member) => {
        balances[member.name] = 0;
        owes[member.name] = [];
      });
    }

    // First calculate balances from expenses only
    if (group.expenses) {
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
              owes[member.name].push({ to: paidBy, amount: perPerson });
            }
          });
        } else {
          if (exp.splits) {
            exp.splits.forEach((split) => {
              if (split.member === paidBy) {
                balances[paidBy] += split.amount;
              } else {
                balances[split.member] -= split.amount;
                owes[split.member].push({ to: paidBy, amount: split.amount });
              }
            });
          }
        }
      });
    }

    // Then apply settlements to adjust balances and owes
    if (group.settlements && group.settlements.length > 0) {
      group.settlements.forEach((settlement) => {
        const { from, to, amount } = settlement;

        // Adjust balances
        balances[from] -= amount;
        balances[to] += amount;

        // Adjust owes by reducing or removing settled amounts
        if (owes[from]) {
          for (let i = owes[from].length - 1; i >= 0; i--) {
            if (owes[from][i].to === to) {
              const remaining = owes[from][i].amount - amount;
              if (remaining > 0) {
                owes[from][i].amount = remaining;
              } else {
                owes[from].splice(i, 1);
                // If we settled more than owed, create reverse entry
                if (remaining < 0) {
                  if (!owes[to]) owes[to] = [];
                  owes[to].push({ to: from, amount: Math.abs(remaining) });
                }
              }
              break;
            }
          }
        }
      });
    }

    return { balances, owes };
  }

  // Load balances
  const gdBody = document.querySelector(".gdBody");
  const balanceContainer = document.querySelector("#balanceContent");

  if (gdBody && balanceContainer && gdBody.dataset.group) {
    try {
      const group = safeJsonParse(gdBody.dataset.group) || {};
      const result = calculateBalances(group);
      const balances = result.balances;
      const entries = Object.entries(balances);

      if (entries.length === 0) {
        balanceContainer.innerHTML = "<p>No balances to show.</p>";
        return;
      }

      balanceContainer.innerHTML = "";
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
    } catch (error) {
      console.error("Error loading balances:", error);
      balanceContainer.innerHTML = "<p>Error loading balances</p>";
    }
  }

  // Expense modal handlers
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
      const splits = safeJsonParse(exp.dataset.splits) || [];

      if (splitOption === "manual" && manualSplitContainer) {
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
      } else if (manualSplitContainer) {
        manualSplitContainer.style.display = "none";
      }

      if (expenseModal) {
        expenseModal.style.display = "block";
        overlay?.classList.add("overlayShow");
      }
    });
  });

  // Close expense modal
  if (closeExpenseModal && expenseModal) {
    closeExpenseModal.addEventListener("click", () => {
      expenseModal.style.display = "none";
      overlay?.classList.remove("overlayShow");
    });
  }

  // Split Option Change Handler
  const modalSplitOption = document.getElementById("modalSplitOption");
  if (modalSplitOption) {
    modalSplitOption.addEventListener("change", function () {
      const manualSplitContainer = document.getElementById(
        "modalManualSplitContainer"
      );
      if (manualSplitContainer) {
        manualSplitContainer.style.display =
          this.value === "manual" ? "block" : "none";
      }
    });
  }

  // Expense form submission
  const expenseModalForm = document.querySelector("#expenseModal form");
  if (expenseModalForm) {
    expenseModalForm.addEventListener("submit", function (e) {
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

        if (splitsField) {
          splitsField.value = JSON.stringify(splits);
        }
      } else if (splitsField) {
        splitsField.value = JSON.stringify([]);
      }
    });
  }

  // Settlement functionality
  function showSettleModal(from, to, amount) {
    if (!settleModal) return;

    const formattedAmount = formatAmount(amount);

    document.getElementById("settleFrom").textContent = from;
    document.getElementById("settleTo").textContent = to;
    document.getElementById("settleAmount").textContent = `₹${formattedAmount}`;

    document.getElementById("settleFromInput").value = from;
    document.getElementById("settleToInput").value = to;
    document.getElementById("settleAmountInput").value = formattedAmount;

    settleModal.style.display = "block";
    overlay?.classList.add("overlayShow");
  }

  function closeSettleModalHandler() {
    if (settleModal) {
      settleModal.style.display = "none";
    }
    overlay?.classList.remove("overlayShow");
  }

  // In your settlement form submission handler
  async function handleSettleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Processing...";

      const response = await fetch("/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: formData.get("from"),
          to: formData.get("to"),
          amount: formData.get("amount"),
          groupId: formData.get("groupId"),
          paymentMethod: formData.get("paymentMethod"),
          date: formData.get("date"),
          note: formData.get("note") || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Settlement failed");
      }

      const result = await response.json();

      // Update UI with the new data
      updateBalancesUI(result.balances);
      updateOwesUI(result.owes);
      updateSettlementsUI(result.group.settlements);

      // Close the modal
      closeSettleModalHandler();
    } catch (error) {
      console.error("Settlement error:", error);
      submitButton.disabled = false;
      submitButton.textContent = "Confirm Settlement";
      alert(`Settlement failed: ${error.message}`);
    }
  }

  // Update the UI functions
  function updateBalancesUI(balances) {
    const container = document.querySelector(".balances-container");
    if (!container) return;

    // Clear existing balance cards
    const balanceCards = container.querySelectorAll(".balance-card");
    balanceCards.forEach((card) => card.remove());

    // Add updated balance cards
    Object.entries(balances).forEach(([name, balance]) => {
      // Only show meaningful balances (greater than 1 rupee)
      if (Math.abs(balance) >= 1) {
        const card = document.createElement("div");
        card.className = `balance-card ${
          balance >= 0 ? "positive" : "negative"
        }`;

        // Format the balance amount
        const displayAmount = `${balance >= 0 ? "+" : "-"}₹${Math.abs(
          Math.round(balance)
        )}`;

        card.innerHTML = `
        <div class="balance-name">${name}</div>
        <div class="balance-amount">${displayAmount}</div>
      `;

        // Insert before the settle-up section
        const settleSection = container.querySelector(".settle-up-section");
        if (settleSection) {
          container.insertBefore(card, settleSection);
        } else {
          container.appendChild(card);
        }
      }
    });

    // If no meaningful balances, show a message
    if (
      Object.keys(balances).filter((name) => Math.abs(balances[name]) >= 1)
        .length === 0
    ) {
      const noBalances = document.createElement("p");
      noBalances.textContent = "All settled up!";
      noBalances.style.color = "white";
      noBalances.style.textAlign = "center";
      noBalances.style.margin = "10px 0";
      container.appendChild(noBalances);
    }
  }

  function updateOwesUI(owes) {
    const container = document.querySelector(".settle-up-section");
    if (!container) return;

    // Clear existing settle rows but keep the title
    const title = container.querySelector("h3");
    container.innerHTML = "";
    if (title) container.appendChild(title);

    // Add updated settle rows
    let hasDebts = false;

    Object.entries(owes).forEach(([debtor, debts]) => {
      debts.forEach((debt) => {
        // Only show meaningful debts (greater than 1 rupee)
        if (debt.amount >= 1) {
          hasDebts = true;
          const row = document.createElement("div");
          row.className = "settle-row";

          row.innerHTML = `
          <span>${debtor} owes <strong>${debt.to}</strong></span>
          <span class="settle-amount">₹${Math.round(debt.amount)}</span>
          <button class="settle-btn" 
                  data-from="${debtor}" 
                  data-to="${debt.to}" 
                  data-amount="${debt.amount}">
            Settle
          </button>
        `;

          container.appendChild(row);
        }
      });
    });

    // If no debts, show a message
    if (!hasDebts) {
      const noDebts = document.createElement("p");
      noDebts.textContent = "No debts to settle";
      noDebts.style.color = "white";
      noDebts.style.textAlign = "center";
      noDebts.style.margin = "10px 0";
      container.appendChild(noDebts);
    }
  }

  // Update the event delegation for settle buttons
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("settle-btn")) {
      e.preventDefault();
      const from = e.target.dataset.from;
      const to = e.target.dataset.to;
      const amount = parseFloat(e.target.dataset.amount);

      if (from && to && !isNaN(amount) && amount > 0) {
        showSettleModal(from, to, amount);
      }
    }
  });

  function updateSettlementsUI(settlements) {
    const container = document.querySelector(".settlement-history");
    if (!container) return;

    const title = document.createElement("h3");
    title.style.color = "white";
    title.textContent = "Settlement History";

    container.innerHTML = "";
    container.appendChild(title);

    if (settlements && settlements.length > 0) {
      settlements.forEach((settlement) => {
        const item = document.createElement("div");
        item.className = "settlement-item";
        item.innerHTML = `
          <p>
            ${settlement.from} paid ${settlement.to} ₹${Math.round(
          settlement.amount
        )} on
            ${new Date(settlement.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year:
                new Date().getFullYear() !==
                new Date(settlement.date).getFullYear()
                  ? "numeric"
                  : undefined,
            })}
          </p>
          <p class="settlement-method">${settlement.paymentMethod}</p>
        `;
        container.appendChild(item);
      });
    } else {
      const noHistory = document.createElement("p");
      noHistory.style.color = "rgb(165, 165, 165)";
      noHistory.textContent = "No settlement history yet.";
      container.appendChild(noHistory);
    }
  }

  // Event delegation for settle buttons
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("settle-btn")) {
      e.preventDefault();
      showSettleModal(
        e.target.dataset.from,
        e.target.dataset.to,
        e.target.dataset.amount
      );
    }
  });

  if (closeSettleModal) {
    closeSettleModal.addEventListener("click", closeSettleModalHandler);
  }

  const settleForm = document.getElementById("settleForm");
  if (settleForm) {
    settleForm.addEventListener("submit", handleSettleSubmit);
  }
});
