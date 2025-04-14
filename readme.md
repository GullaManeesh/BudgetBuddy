function calculateBalances(group) {
const balances = {};
const owes = {};

// Initialize balances
group.members.forEach((member) => {
balances[member.name] = 0;
owes[member.name] = [];
});

// Process expenses
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

// Process settlements (reduce balances)
group.settlements?.forEach((settlement) => {
balances[settlement.from] -= settlement.amount;
balances[settlement.to] += settlement.amount;
});

// Calculate who owes whom
const members = group.members.map(m => m.name);
for (const debtor of members) {
for (const creditor of members) {
if (debtor !== creditor && balances[debtor] < 0 && balances[creditor] > 0) {
const debtAmount = Math.min(-balances[debtor], balances[creditor]);
if (debtAmount > 0) {
owes[debtor].push({ to: creditor, amount: debtAmount });
balances[debtor] += debtAmount;
balances[creditor] -= debtAmount;
}
}
}
}

return { balances, owes };
}
Additional Checks
Make sure your frontend is sending all required fields in the settlement request:

from

to

amount

groupId

paymentMethod

date

note (optional)

Verify that the groupId being sent matches an existing group in your database.

Check your server logs for more detailed error messages when the settlement fails.

This should resolve the settlement functionality in your application. The error was occurring because the route handler didn't exist, so the frontend's POST request to /settle was failing.

<section id="groupExpenses" class="group-expense-section">
  <div class="groupExpenseCon">
    <h2 class="GEtitle">GROUP EXPENSES</h2>

    <div class="groupsContainer">
      <div class="createGroup">
        <div>+</div>
        <div class="action">createGroup</div>
      </div>

      <% groups.forEach((group) => { %>
      <div class="createdGroup">
        <div
          class="groupTitle"
          style="display: flex; justify-content: space-between">
          <h3 style="text-align: center">
            <%= group.groupName.toUpperCase() %>
          </h3>
          <a
            href="/group/<%=group._id%>/delete"
            style="
              text-decoration: none;
              color: white;
              background-color: red;
              padding: 4px 5px;
              border-radius: 5px;
              font-size: 13px;
            "
            >Delete</a
          >
        </div>
        <div class="top">
          <div class="topleft">
            <h4
              style="
                margin-bottom: 5px;
                display: inline-block;
                color: rgb(214, 177, 245);
              ">
              Group Members:
            </h4>
            <% group.members.forEach((member, index) => { %>
            <span>
              <%= member.name.charAt(0).toUpperCase() + member.name.slice(1) %>
              <%= index < group.members.length - 1 ? ', ' : '' %>
            </span>
            <% }); %>
            <div class="members-count">
              <span style="color: rgb(214, 177, 245); font-size: 18px"
                >Members:</span
              >
              <%= group.members.length %>
            </div>
          </div>
        </div>
        <div class="bottom">
          <a
            data-selGroupid="<%= group._id %>"
            class="groupDetailsBtn"
            style="cursor: pointer"
            >Group Details</a
          >
        </div>
      </div>
      <% }); %>

      <div class="groupDetails">
        <div class="gdTop">
          <% if (selectedGroup && selectedGroup.expenses) { %>
          <h1><%=selectedGroup.groupName.toUpperCase()%></h1>
          <%}%>
          <a style="cursor: pointer" class="EditGroupDetails">Edit</a>
        </div>
        <div class="gdSec">
          <a href="#Home">Home</a>
          <a href="#Balances">Balances</a>
          <a href="#Settlement History" style="width: auto; padding: 4px 6px"
            >Settlement History</a
          >
        </div>
        <div class="gdBody" data-group="<%=selectedGroup%>">
          <section id="Home">
            <% if (selectedGroup && selectedGroup.expenses &&
            selectedGroup.expenses.length > 0) { %><%
            selectedGroup.expenses.forEach(exp => { %>
            <div
              class="groupExpenses expense-clickable"
              data-id="<%= exp._id %>"
              data-title="<%= exp.title %>"
              data-amount="<%= exp.amount %>"
              data-date="<%= exp.date %>"
              data-paidby="<%= exp.paidBy %>"
              data-split="<%= exp.splitOption %>"
              data-splits="<%= JSON.stringify(exp.splits) %>">
              <div
                class="geLeft"
                style="display: flex; gap: 10px; align-items: center">
                <div><i class="fas fa-coins"></i></div>
                <div>
                  <p><%=exp.title%></p>
                  <p style="margin-top: 5px">Paid by <%=exp.paidBy%></p>
                </div>
              </div>
              <div class="geRight">
                <p>&#8377;<%=exp.amount%></p>
                <p>
                  Expense on <%= new Date(exp.date).toLocaleDateString("en-US",
                  { month: "long", day: "numeric" }) %>
                </p>
              </div>
            </div>

            <!-- editing group expenses -->
            <div id="expenseModal" class="modal">
              <div class="modal-content">
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                  ">
                  <i
                    class="fa-solid fa-circle-xmark"
                    id="closeExpenseModal"
                    style="
                      font-size: 20px;
                      cursor: pointer;
                      margin-bottom: 5px;
                    "></i>
                </div>

                <h3>Edit Expense</h3>
                <form action="/groupExpenses/edit" method="POST">
                  <input type="hidden" name="expenseId" id="modalExpenseId" />
                  <input
                    type="hidden"
                    name="groupId"
                    value="<%= selectedGroup._id %>" />

                  <label>Title:</label>
                  <input type="text" name="title" id="modalTitle" required />

                  <label>Amount:</label>
                  <input
                    type="number"
                    name="amount"
                    id="modalAmount"
                    required />

                  <label>Date:</label>
                  <input type="date" name="date" id="modalDate" required />

                  <label>Paid By:</label>
                  <select name="paidBy" id="modalPaidBy" required>
                    <% selectedGroup.members.forEach(member => { %>
                    <option value="<%= member.name %>">
                      <%= member.name %>
                    </option>
                    <% }); %>
                  </select>

                  <label>Split Option:</label>
                  <select name="splitOption" id="modalSplitOption">
                    <option value="equal">Equal</option>
                    <option value="manual">Manual</option>
                  </select>

                  <div id="modalManualSplitContainer" style="display: none">
                    <h4 style="margin-bottom: 10px">Manual Splits (INR):</h4>
                    <% selectedGroup.members.forEach(member => { %>
                    <div class="manual-split-entry">
                      <label><%= member.name %>:</label>
                      <input
                        type="number"
                        name="manualSplits[<%= member.name %>]"
                        placeholder="0" />
                    </div>
                    <% }); %>
                  </div>

                  <input type="hidden" name="splits" id="modalSplits" />
                  <button
                    type="submit"
                    style="
                      background-color: rgb(79, 79, 234);
                      color: white;
                      padding: 5px 4px;
                      cursor: pointer;
                      border: none;
                    ">
                    Save Changes
                  </button>
                </form>

                <form
                  action="/groupExpenses/delete"
                  method="POST"
                  style="margin-top: 10px">
                  <input type="hidden" name="expenseId" id="modalDeleteId" />
                  <input
                    type="hidden"
                    name="groupId"
                    value="<%=selectedGroup._id %>" />
                  <button
                    type="submit"
                    style="
                      background-color: red;
                      color: white;
                      cursor: pointer;
                      padding: 5px 4px;
                      border: none;
                    ">
                    Delete Expense
                  </button>
                </form>
              </div>
            </div>

            <!-- ADD SETTLE MODAL HERE -->
            <div id="settleModal" class="modal">
              <div class="modal-content">
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                  <h3>Settle Up</h3>
                  <i
                    class="fa-solid fa-circle-xmark"
                    id="closeSettleModal"
                    style="font-size: 20px; cursor: pointer"></i>
                </div>

                <div class="settle-details">
                  <div class="settle-info">
                    <p>
                      <span id="settleFrom"></span> pays
                      <span id="settleTo"></span>
                    </p>
                    <h2 id="settleAmount">₹0</h2>
                    <!-- Will display whole number -->
                  </div>

                  <form id="settleForm" method="POST">
                    <input type="hidden" id="settleFromInput" name="from" />
                    <input type="hidden" id="settleToInput" name="to" />
                    <input type="hidden" id="settleAmountInput" name="amount" />
                    <input
                      type="hidden"
                      name="groupId"
                      value="<%= selectedGroup._id %>" />

                    <div class="form-group">
                      <label>Payment Method:</label>
                      <select name="paymentMethod" required>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Date:</label>
                      <input
                        type="date"
                        name="date"
                        required
                        value="<%= new Date().toISOString().split('T')[0] %>" />
                    </div>

                    <div class="form-group">
                      <label>Note (Optional):</label>
                      <input
                        type="text"
                        name="note"
                        placeholder="e.g., Lunch money" />
                    </div>

                    <button type="submit" class="settle-submit-btn">
                      Confirm Settlement
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <!-- add group expense -->
            <div class="expense-form-container">
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
                ">
                <h2>Add Expense</h2>
                <i
                  class="fa-solid fa-circle-xmark"
                  id="closeGroupExpense"
                  style="font-size: 20px; cursor: pointer"></i>
              </div>
              <form
                action="/groupExpenses/add"
                method="POST"
                class="expense-form">
                <!-- Hidden group ID -->
                <input
                  type="hidden"
                  name="groupId"
                  value="<%= selectedGroup._id %>" />

                <label for="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  placeholder="Enter expense title" />

                <label for="amount">Amount (INR):</label>
                <input
                  type="number"
                  id="amountInput"
                  name="amount"
                  required
                  placeholder="Enter amount" />

                <label for="date">Date:</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value="<%= new Date().toISOString().split('T')[0] %>" />
                <label for="paidBy">Paid By:</label>
                <select name="paidBy" id="paidBy" required>
                  <% selectedGroup.members.forEach(member => { %>
                  <option value="<%= member.name %>"><%= member.name %></option>
                  <% }); %>
                </select>

                <label>Split Options:</label>
                <div class="split-options">
                  <label>
                    <input
                      type="radio"
                      name="splitOption"
                      value="equal"
                      checked />
                    Split Equally
                  </label>
                  <label>
                    <input type="radio" name="splitOption" value="manual" />
                    Split Manually
                  </label>
                </div>

                <div id="manualSplitContainer" style="display: none">
                  <h4 style="margin-bottom: 10px">Manual Splits (INR):</h4>
                  <% selectedGroup.members.forEach(member => { %>
                  <div class="manual-split-entry">
                    <label><%= member.name %>:</label>
                    <input
                      type="number"
                      name="manualSplits[<%= member.name %>]"
                      placeholder="0" />
                  </div>
                  <% }); %>
                </div>

                <!-- Hidden input to send splits as JSON if manually split -->
                <input type="hidden" name="splits" id="splitsJson" />

                <button
                  type="submit"
                  style="
                    background-color: rgb(79, 79, 234);
                    color: white;
                    padding: 5px 4px;
                    cursor: pointer;
                    border: none;
                    width: 100%;
                  ">
                  Save Expense
                </button>
              </form>
            </div>

            <% }) %> <% } else { %>
            <!-- add group expense -->
            <% if (selectedGroup && selectedGroup.expenses) { %>
            <div class="expense-form-container">
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
                ">
                <h2>Add Expense</h2>
                <i
                  class="fa-solid fa-circle-xmark"
                  id="closeGroupExpense"
                  style="font-size: 20px; cursor: pointer"></i>
              </div>
              <form
                action="/groupExpenses/add"
                method="POST"
                class="expense-form">
                <!-- Hidden group ID -->
                <input
                  type="hidden"
                  name="groupId"
                  value="<%= selectedGroup._id %>" />

                <label for="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  placeholder="Enter expense title" />

                <label for="amount">Amount (INR):</label>
                <input
                  type="number"
                  id="amountInput"
                  name="amount"
                  required
                  placeholder="Enter amount" />

                <label for="date">Date:</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value="<%= new Date().toISOString().split('T')[0] %>" />
                <label for="paidBy">Paid By:</label>
                <select name="paidBy" id="paidBy" required>
                  <% selectedGroup.members.forEach(member => { %>
                  <option value="<%= member.name %>"><%= member.name %></option>
                  <% }); %>
                </select>

                <label>Split Options:</label>
                <div class="split-options">
                  <label>
                    <input
                      type="radio"
                      name="splitOption"
                      value="equal"
                      checked />
                    Split Equally
                  </label>
                  <label>
                    <input type="radio" name="splitOption" value="manual" />
                    Split Manually
                  </label>
                </div>

                <div id="manualSplitContainer" style="display: none">
                  <h4 style="margin-bottom: 10px">Manual Splits (INR):</h4>
                  <% selectedGroup.members.forEach(member => { %>
                  <div class="manual-split-entry">
                    <label><%= member.name %>:</label>
                    <input
                      type="number"
                      name="manualSplits[<%= member.name %>]"
                      placeholder="0" />
                  </div>
                  <% }); %>
                </div>

                <!-- Hidden input to send splits as JSON if manually split -->
                <input type="hidden" name="splits" id="splitsJson" />

                <button
                  type="submit"
                  style="
                    background-color: rgb(79, 79, 234);
                    color: white;
                    padding: 5px 4px;
                    cursor: pointer;
                    border: none;
                    width: 100%;
                  ">
                  Save Expense
                </button>
              </form>
            </div>

            <% } %> <% if (selectedGroup && selectedGroup.expenses) { %>
            <div class="edit-group-div">
              <div style="display: flex; justify-content: space-between">
                <h1 style="text-align: center; font-weight: 700">EDIT GROUP</h1>
                <i class="fa-solid fa-circle-xmark" id="closeEditGroup"></i>
              </div>
              <form action="/groups/edit" class="edit-group-form" method="POST">
                <!-- Hidden group ID -->
                <input
                  type="hidden"
                  name="groupId"
                  value="<%= selectedGroup._id %>" />

                <div>
                  <h5 for="editGroupName">Edit Group Name:</h5>
                  <input
                    type="text"
                    id="editGroupName"
                    name="groupName"
                    value="<%= selectedGroup.groupName %>"
                    required
                    placeholder="Enter new group name" />
                </div>

                <div id="editMembersContainer">
                  <h5>Group Members (comma-separated):</h5>
                  <textarea
                    name="memberNames"
                    placeholder="Edit members: John, Jack, Emily"
                    required>

<%= selectedGroup.members.map(member => member.name).join(', ') %></textarea
                  >

</div>
<button
                  type="submit"
                  class="editGroupBtn"
                  style="
                    background-color: rgb(79, 79, 234);
                    color: white;
                    padding: 5px 4px;
                    cursor: pointer;
                    border: none;
                  ">
Edit Group
</button>
</form>
</div>

            <% } %>

            <p>No group selected or no expenses available.</p>
            <% } %>

            <div class="addSymbol"><a href="">+</a></div>
          </section>

          <!-- balances section -->
          <section id="Balances">
            <div class="balances-container">
              <!-- Balances cards -->
              <div
                style="
                  width: 100%;
                  height: auto;
                  display: flex;
                  align-items: center;
                  flex-direction: column;
                  gap: 10px;
                ">
                <% Object.keys(balances).forEach((person) => { %> <% const
                amount = balances[person]; %>
                <div
                  class="balance-card <%= amount >= 0 ? 'positive' : 'negative' %>">
                  <div class="balance-name"><%= person %></div>
                  <div class="balance-amount">
                    <%= amount >= 0 ? '+' : '-' %>₹<%=
                    Math.abs(amount).toFixed(0) %>
                  </div>
                </div>
                <% }) %>
              </div>

              <!-- Settle Up Section -->
              <div class="settle-up-section">
                <h3 class="settle-up-title" style="color: white">Settle Up</h3>
                <% Object.keys(owes).forEach((person) => { %> <%
                owes[person].forEach((debt) => { %>
                <div class="settle-row">
                  <span
                    ><%= person %> owes <strong><%= debt.to %></strong></span
                  >
                  <span class="settle-amount"
                    >₹<%= debt.amount.toFixed(0) %></span
                  >
                  <button
                    class="settle-btn"
                    data-from="<%= person %>"
                    data-to="<%= debt.to %>"
                    data-amount="<%= debt.amount %>">
                    Settle
                  </button>
                </div>
                <% }) %> <% }) %>
              </div>
            </div>
          </section>
          <section id="Settlement History">
            <!-- Settlement History -->
            <div class="settlement-history">
              <h3 style="color: white">Settlement History</h3>
              <% if (selectedGroup && selectedGroup.settlements &&
              selectedGroup.settlements.length > 0) { %> <%
              selectedGroup.settlements.forEach(settlement => { %>
              <div class="settlement-item">
                <p>
                  <%= settlement.from %> paid <%= settlement.to %> ₹<%=
                  Math.round(settlement.amount) %> on <%= new
                  Date(settlement.date).toLocaleDateString('en-US', { month:
                  'long', day: 'numeric', year: new Date().getFullYear() !== new
                  Date(settlement.date).getFullYear() ? 'numeric' : undefined })
                  %>
                </p>
                <p class="settlement-method"><%= settlement.paymentMethod %></p>
              </div>
              <% }); %> <% } else { %>
              <p style="color: rgb(165, 165, 165)">
                No settlement history yet.
              </p>
              <% } %>
            </div>
          </section>
        </div>

        <!-- edit Group details -->

        <!-- add group expense -->
      </div>
    </div>

  </div>

  <!-- Create New Group Form -->

  <div class="create-group-div">
    <h1 style="text-align: center; font-weight: 700">CREATE GROUP</h1>
    <form action="/groups/create" class="create-group-form" method="POST">
      <!-- <div class="IconInput groupExpenseInput">
        <h2>Select Icon</h2>
        <div class="emoji-container">
          <input
            type="text"
            id="selectedIcon"
            name="groupExpenseEmoji"
            placeholder="😀"
            readonly
            required />
          <emoji-picker id="iconPicker"></emoji-picker>
        </div>
      </div> -->
      <div>
        <h3 for="groupName">Group Name:</h3>
        <input
          type="text"
          id="groupName"
          name="groupName"
          required
          placeholder="Name" />
      </div>

      <div id="membersContainer">
        <h3>Group Members (comma-separated):</h3>
        <textarea
          name="memberNames"
          placeholder="Enter names: John, Jack, Emily"
          required></textarea>
      </div>

      <button type="submit" class="createGroupBtn">Create Group</button>
    </form>

  </div>
</section>

// Cache DOM elements
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
createGroup?.addEventListener("click", (event) => {
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

// Overlay click handler
overlay?.addEventListener("click", (event) => {
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

if (expenseModal) expenseModal.style.display = "none";
if (settleModal) settleModal.style.display = "none";

overlay.classList.remove("overlayShow");
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

const group = safeJsonParse(gdBody.dataset.group) || {};
const balances = calculateBalances(group);
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
});

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
    overlay.classList.add("overlayShow");

});
});

// Close expense modal
closeExpenseModal?.addEventListener("click", () => {
expenseModal.style.display = "none";
overlay.classList.remove("overlayShow");
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

// Expense form submission
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

// Settlement functionality
function showSettleModal(from, to, amount) {
const formattedAmount = formatAmount(amount);

document.getElementById("settleFrom").textContent = from;
document.getElementById("settleTo").textContent = to;
document.getElementById("settleAmount").textContent = `₹${formattedAmount}`;

document.getElementById("settleFromInput").value = from;
document.getElementById("settleToInput").value = to;
document.getElementById("settleAmountInput").value = formattedAmount;

settleModal.style.display = "block";
overlay.classList.add("overlayShow");
}

function closeSettleModalHandler() {
settleModal.style.display = "none";
overlay.classList.remove("overlayShow");
}

async function handleSettleSubmit(e) {
e.preventDefault();

const formData = new FormData(e.target);
const data = {
from: formData.get("from"),
to: formData.get("to"),
amount: formatAmount(formData.get("amount")),
groupId: formData.get("groupId"),
paymentMethod: formData.get("paymentMethod"),
date: formData.get("date"),
note: formData.get("note") || "",
};

try {
const response = await fetch("/settle", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify(data),
});

    if (!response.ok) {
      throw new Error("Failed to process settlement");
    }

    const result = await response.json();
    updateBalancesUI(result.balances);
    updateOwesUI(result.owes);
    updateSettlementsUI(result.settlements);

    closeSettleModalHandler();

} catch (error) {
console.error("Settlement error:", error);
alert("Failed to process settlement. Please try again.");
}
}

function updateBalancesUI(balances) {
const container = document.querySelector(".balances-container");
container.innerHTML = "";

Object.keys(balances).forEach((person) => {
const amount = balances[person];
if (Math.abs(amount) > 0) {
const card = document.createElement("div");
card.className = `balance-card ${amount >= 0 ? "positive" : "negative"}`;
card.innerHTML = `       <div class="balance-name">${person}</div>
        <div class="balance-amount">
          ${amount >= 0 ? "+" : "-"}₹${Math.abs(amount).toFixed(0)}
        </div>
    `;
container.appendChild(card);
}
});
}

function updateOwesUI(owes) {
const container = document.querySelector(".settle-up-section");
const title = container.querySelector(".settle-up-title");
container.innerHTML = "";
container.appendChild(title);

Object.keys(owes).forEach((person) => {
owes[person].forEach((debt) => {
if (debt.amount > 0) {
const row = document.createElement("div");
row.className = "settle-row";
row.innerHTML = `         <span>${person} owes <strong>${debt.to}</strong></span>
          <span class="settle-amount">₹${debt.amount.toFixed(0)}</span>
          <button class="settle-btn" 
                  data-from="${person}" 
                  data-to="${debt.to}" 
                  data-amount="${debt.amount}">
            Settle
          </button>
      `;
container.appendChild(row);
}
});
});
}

function updateSettlementsUI(settlements) {
const container = document.querySelector(".settlement-history");
const title = container.querySelector("h3");
container.innerHTML = "";
container.appendChild(title);

if (settlements && settlements.length > 0) {
settlements.forEach((settlement) => {
const item = document.createElement("div");
item.className = "settlement-item";
item.innerHTML = `       <p>
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
container.innerHTML += "<p>No settlement history yet.</p>";
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

closeSettleModal?.addEventListener("click", closeSettleModalHandler);
document
.getElementById("settleForm")
?.addEventListener("submit", handleSettleSubmit);

function calculateBalances(group) {
const balances = {};
const owes = {};

// Initialize balances and owes for all members
group.members.forEach((member) => {
balances[member.name] = 0;
owes[member.name] = [];
});

// First calculate balances from expenses only
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
      exp.splits.forEach((split) => {
        if (split.member === paidBy) {
          balances[paidBy] += split.amount;
        } else {
          balances[split.member] -= split.amount;
          owes[split.member].push({ to: paidBy, amount: split.amount });
        }
      });
    }

});

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

module.exports = calculateBalances;

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const userModel = require("./models/user");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const budgetModel = require("./models/budgetModel");
const expenseModel = require("./models/expenseModel");
const groupModel = require("./models/groupModel");
const groupExpenseModel = require("./models/groupExpenseModel");
const session = require("express-session");
const calculateBalances = require("./utils/calculateBalances");

const ObjectId = mongoose.Types.ObjectId;
require("dotenv").config();

const port = process.env.PORT || 3000;

app.use(
session({
secret: process.env.SESSION_SECRET,
resave: false,
saveUninitialized: true,
cookie: {
path: "/",
httpOnly: true,
secure: false,
sameSite: "lax",
},
})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(\_\_dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

//----------------------HOME PAGE--------------------------------------//
app.get("/", (req, res) => {
res.render("index");
});

//-----------------------SIGNUP PAGES-----------------------------------//

app.get("/signup", (req, res) => {
res.render("signup");
});

app.post("/register", async (req, res) => {
const { username, email } = req.body;
const user = await userModel.findOne({ email: email });
if (!user) {
const createdUser = await userModel.create({ username, email });

    let token = jwt.sign(
      { email: email, userid: createdUser._id },
      process.env.SESSION_SECRET
    );
    res.cookie("token", token);
    res.redirect("/dashboard");

}
});

app.post("/registerGmail", async (req, res) => {
const { username, email } = req.body;
let user = await userModel.findOne({ email: email });

if (!user) {
user = await userModel.create({ username, email });
}
let token = jwt.sign(
{ email: email, userid: user.\_id },
process.env.SESSION_SECRET
);
res.cookie("token", token);
res.redirect("/dashboard");
});

app.post("/login", async (req, res) => {
const { email } = req.body;
const user = await userModel.findOne({ email: email });
let token = jwt.sign(
{ email: email, userid: user.\_id },
process.env.SESSION_SECRET
);
res.cookie("token", token);
res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
req.session.destroy((err) => {
if (err) {
return res.status(500).send("Logout failed");
}

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.clearCookie("token", { path: "/" });

    res.redirect("/signup");

});
});

//-------------------------DASHBOARD----------------------------------------//
app.get("/dashboard", isLoggedin, async (req, res) => {
let user = await userModel.findOne({ email: req.user.email }).populate({
path: "budgets",
populate: {
path: "expenses",
},
});

const groups = await groupModel.find({ createdBy: new ObjectId(user.\_id) });

const budgetsData = await budgetModel
.find({ User: new ObjectId(user.\_id) })
.sort({ \_id: -1 });

const expense = user.budgets.map((budget) => budget.expenses).flat();

const expenses = await expenseModel
.find({ User: new ObjectId(user.\_id) })
.sort({ CreatedDate: -1 });

let selectedGroup = null;
let balances = {};
let owes = {}; // Initialize owes here
if (req.session.selGroupid) {
selectedGroup = await groupModel
.findOne({ \_id: new ObjectId(req.session.selGroupid) })
.populate("expenses");

    if (selectedGroup && selectedGroup.expenses && selectedGroup.members) {
      const result = calculateBalances(selectedGroup); // Get both balances and owes
      balances = result.balances;
      owes = result.owes;
    }

}

const budgetId = req.session.budgetId;
let budget = "";
if (budgetId) {
budget = await budgetModel
.findOne({ \_id: new ObjectId(budgetId) })
.populate("expenses");
}

res.render("dashboard", {
user: user,
budget,
expense: JSON.stringify(expense),
expenses,
budgetsData: JSON.stringify(budgetsData),
groups,
selectedGroup,
balances,
owes,
});
});

//--------------------------budgetSec---------------------------------------//

app.post("/createBudget", isLoggedin, async (req, res) => {
const { budgetName, budgetAmount, budgetEmoji } = req.body;
const user = await userModel.findOne({ email: req.user.email });
const createBudget = await budgetModel.create({
BudgetName: budgetName,
BudgetAmount: Number(budgetAmount),
icon: budgetEmoji,
createdBy: user.username,
BudgetRemaining: Number(budgetAmount),
User: user.\_id,
});
user.budgets.push(createBudget.\_id);
await user.save();
res.redirect("/dashboard#budgets");
});

app.post("/editBudget", isLoggedin, async (req, res) => {
const { budgetId, budgetName, budgetAmount, budgetEmoji } = req.body;
const budget = await budgetModel.findOneAndUpdate(
{ \_id: new ObjectId(budgetId) },
{ BudgetName: budgetName, BudgetAmount: budgetAmount, icon: budgetEmoji }
);
await budget.save();
res.redirect("/dashboard#budgets");
});

app.post("/deletebudget", isLoggedin, async (req, res) => {
const id = req.body.budgetId;
const budget = await budgetModel.deleteOne({
\_id: new ObjectId(id),
});
await userModel.updateOne(
{ \_id: new ObjectId(req.user.userid) },
{ $pull: { budgets: new ObjectId(id) } }
);

res.redirect("/dashboard#budgets");
});

//----------------------------------EXPENSE sEC------------------------------//

app.get("/expense/:budgetid", (req, res) => {
req.session.budgetId = req.params.budgetid;
res.redirect("/dashboard#expenses");
});

app.post("/addExpense", async (req, res) => {
const { expenseName, expenseAmount, budgetId } = req.body;
let budget = "";
if (budgetId) {
budget = await budgetModel.findOne({ \_id: new ObjectId(budgetId) });
}
const createdExpense = await expenseModel.create({
ExpenseName: expenseName,
ExpenseAmount: Number(expenseAmount),
BudgetName: budget.BudgetName,
Budget: budget.\_id,
User: budget.User,
});

budget.BudgetSpent += createdExpense.ExpenseAmount;
budget.BudgetRemaining -= createdExpense.ExpenseAmount;
budget.expenses.push(createdExpense.\_id);
await budget.save();

res.redirect("/dashboard#expenses");
});

app.get("/expense/delete/:budgetid/:expenseid", async (req, res) => {
const expenseId = req.params.expenseid;
const budgetId = req.params.budgetid;
const expense = await expenseModel.findOne({
\_id: new ObjectId(expenseId),
});
const updatedBudget = await budgetModel.findOneAndUpdate(
{ \_id: new ObjectId(budgetId) },
{
$pull: { expenses: new ObjectId(expenseId) },
$inc: {
BudgetSpent: -expense.ExpenseAmount,
BudgetRemaining: expense.ExpenseAmount,
},
}
);

const deletedExpense = await expenseModel.deleteOne({
\_id: new ObjectId(expenseId),
});

res.redirect("/dashboard#expenses");
});

app.post("/expense/edit", async (req, res) => {
const { ExpenseId, budgetId, expenseName, expenseAmount } = req.body;
const newExpenseAmount = expenseAmount;
const oldExpense = await expenseModel.findOne({
\_id: new ObjectId(ExpenseId),
});

const oldExpenseAmount = oldExpense.ExpenseAmount;

const expense = await expenseModel.findOneAndUpdate(
{ \_id: new ObjectId(ExpenseId) },
{
ExpenseName: expenseName,
ExpenseAmount: Number(expenseAmount),
}
);
const budget = await budgetModel.findOneAndUpdate(
{ \_id: new ObjectId(budgetId) },
{
$inc: {
BudgetSpent: newExpenseAmount - oldExpenseAmount,
BudgetRemaining: oldExpenseAmount - newExpenseAmount,
},
}
);
res.redirect("/dashboard#expenses");
});

//------------------------------GROUP EXPENSES-------------------------------//

app.post("/groups/create", isLoggedin, async (req, res) => {
const { groupName, memberNames } = req.body;
const user = await userModel.findOne({ email: req.user.email });

const namesArray = memberNames.split(",").map((name) => name.trim());

const members = namesArray.map((name) => ({ name }));

await groupModel.create({
groupName,
members,
createdBy: user.\_id,
createdAt: new Date(),
});

res.redirect("/dashboard#groupExpenses");
});

app.post("/groups/edit", isLoggedin, async (req, res) => {
const { groupId, groupName, memberNames } = req.body;

// Split and trim member names
const namesArray = memberNames.split(",").map((name) => name.trim());
const updatedMembers = namesArray.map((name) => ({ name }));

// Update the group with new members
await groupModel.findOneAndUpdate(
{ \_id: new ObjectId(groupId), createdBy: new ObjectId(req.user.userid) },
{
groupName: groupName,
members: updatedMembers,
}
);

// Recalculate expenses to include new members
const group = await groupModel.findById(groupId).populate("expenses");

for (const expense of group.expenses) {
const totalAmount = expense.amount;
const splitOption = expense.splitOption;

    if (splitOption === "equal") {
      const perPerson = totalAmount / updatedMembers.length;
      expense.splits = updatedMembers.map((member) => ({
        member: member.name,
        amount: perPerson,
      }));
    } else if (splitOption === "manual") {
      // Handle manual splits if necessary
      // You may want to implement logic to recalculate manual splits here
    }

    // Update the expense in the database
    await groupExpenseModel.findByIdAndUpdate(expense._id, {
      splits: expense.splits,
    });

}

res.redirect("/dashboard#groupExpenses");
});
app.post("/groupExpenses/add", isLoggedin, async (req, res) => {
const { title, amount, date, time, paidBy, splitOption, groupId, splits } =
req.body;

const newExpense = await groupExpenseModel.create({
title,
amount,
date: new Date(date),
time,
paidBy,
splitOption,
groupId,
splits: splitOption === "manual" ? JSON.parse(splits) : [],
});

await groupModel.findByIdAndUpdate(groupId, {
$push: { expenses: newExpense.\_id },
});

res.redirect(`/dashboard#groupExpenses`);
});

app.post("/groups/:selGroupid", async (req, res) => {
req.session.selGroupid = req.params.selGroupid;

res.redirect("/dashboard#groupExpenses");
});

app.post("/groupExpenses/edit", async (req, res) => {
const { expenseId, title, amount, date, paidBy, splitOption, splits } =
req.body;

// Handle case where splits is empty or not valid
let parsedSplits = [];
try {
if (splitOption === "manual") {
parsedSplits = splits ? JSON.parse(splits) : [];
}
} catch (error) {
console.error("Error parsing splits:", error);
parsedSplits = [];
}

// Update the expense in the database
await groupExpenseModel.findByIdAndUpdate(expenseId, {
title,
amount,
date: new Date(date),
paidBy,
splitOption,
splits: parsedSplits, // Save the manual splits if applicable
});

// Redirect to the previous page (or wherever necessary)
res.redirect("/dashboard#groupExpenses");
});

// Delete group expense
app.post("/groupExpenses/delete", async (req, res) => {
const { expenseId, groupId } = req.body;

await groupExpenseModel.findByIdAndDelete(expenseId);

await groupModel.findByIdAndUpdate(groupId, {
$pull: { expenses: expenseId },
});

res.redirect("/dashboard#groupExpenses");
});

app.get("/group/:groupId/delete", async (req, res) => {
const groupid = req.params.groupId;

await groupExpenseModel.findOneAndDelete({
groupId: new ObjectId(groupid),
});
await groupModel.findByIdAndDelete(groupid);
res.redirect("/dashboard#groupExpenses");
});

// Add this to your server.js
app.post("/groups/:groupId", async (req, res) => {
try {
const groupId = req.params.groupId;
const group = await Group.findById(groupId)
.populate("expenses")
.populate("settlements");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Calculate balances safely
    let balances, owes;
    try {
      const result = calculateBalances(group);
      balances = result.balances;
      owes = result.owes;
    } catch (calcError) {
      console.error("Balance calculation error:", calcError);
      return res.status(500).json({ error: "Failed to calculate balances" });
    }

    res.json({
      group,
      balances,
      owes,
    });

} catch (error) {
console.error("Group details error:", error);
res.status(500).json({ error: "Failed to load group details" });
}
});

// Settlement route
app.post("/settle", isLoggedin, async (req, res) => {
try {
const { from, to, amount, groupId, paymentMethod, date, note } = req.body;

    // Validate inputs
    if (!from || !to || !amount || !groupId || !paymentMethod || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create settlement record
    const settlement = {
      from,
      to,
      amount: Number(amount),
      paymentMethod,
      date: new Date(date),
      note: note || "",
    };

    // Update group with new settlement
    const updatedGroup = await groupModel
      .findByIdAndUpdate(
        groupId,
        {
          $push: { settlements: settlement },
        },
        { new: true }
      )
      .populate("expenses");

    if (!updatedGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Recalculate balances
    const result = calculateBalances(updatedGroup);

    res.json({
      success: true,
      balances: result.balances,
      owes: result.owes,
      settlements: updatedGroup.settlements,
    });

} catch (error) {
console.error("Settlement error:", error);
res.status(500).json({ error: "Failed to process settlement" });
}
});
//---------------------------------------------------------------------------//
app.listen(port, () => {
console.log(`Server is running on http://localhost:${port}`);
});

function isLoggedin(req, res, next) {
const tok = req.cookies.token;
if (!tok) {
return res.status(401).redirect("/signup");
} else {
let data = jwt.verify(tok, process.env.SESSION_SECRET);
req.user = data;
}
next();
}

const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/BudgetBuddy");

const GroupExpenseSchema = new mongoose.Schema({
title: { type: String, required: true },
amount: { type: Number, required: true },
date: { type: Date, required: true },
paidBy: { type: String, required: true },
splitOption: { type: String, enum: ["equal", "manual"], required: true },
splits: [
{
member: String,
amount: Number,
},
],
groupId: {
type: mongoose.Schema.Types.ObjectId,
ref: "Groups",
required: true,
},
createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GroupExpenses", GroupExpenseSchema);

const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/BudgetBuddy");

const groupSchema = new mongoose.Schema({
groupName: String,
members: [
{
name: String,
},
],
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupExpenses" }],
settlements: [
{
from: String,
to: String,
amount: {
type: Number,
get: (v) => Math.round(v),
set: (v) => Math.round(v),
},
date: Date,
paymentMethod: String,
note: String,
settledAt: Date,
},
],
createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Groups", groupSchema);

check still settlements section not working
