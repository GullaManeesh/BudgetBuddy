    <section id="Home">
              <% if (selectedGroup && selectedGroup.expenses) { %> <%
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
                    Expense on <%= new
                    Date(exp.date).toLocaleDateString("en-US", { month: "long",
                    day: "numeric" }) %>
                  </p>
                </div>
              </div>
              <% }) %> <% } else { %>
              <p>No group selected or no expenses available.</p>
              <% } %>

              <div class="addSymbol"><a href="">+</a></div>
            </section>

   <section id="Balances">
              <div class="balances-container">
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
                <div class="settle-up-title">Settle up</div>
                <% Object.keys(owes).forEach((person) => { %> <%
                owes[person].forEach((debt) => { %>
                <div class="settle-row">
                  <span
                    ><%= person %> owes <strong><%= debt.to %></strong></span
                  >
                  <span class="settle-amount"
                    >₹<%= debt.amount.toFixed(0) %></span
                  >
                  <a href="/settle/<%= person %>" class="settle-btn">Settle</a>
                </div>
                <% }) %> <% }) %>
              </div>
            </section>

<---------------------------------------------------------------------->

<div class="gdBody" data-group="<%=selectedGroup%>">
          <section id="Home">
            <% if (selectedGroup && selectedGroup.expenses) { %> <%
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
            <% }) %> <% } else { %>
            <p>No group selected or no expenses available.</p>
            <% } %>

            <div class="addSymbol"><a href="">+</a></div>
          </section>

          <!-- Single Modal Outside the Loop -->
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
                <input type="hidden" name="groupId" value="<%= group._id %>" />

                <label>Title:</label>
                <input type="text" name="title" id="modalTitle" required />

                <label>Amount:</label>
                <input type="number" name="amount" id="modalAmount" required />

                <label>Date:</label>
                <input type="date" name="date" id="modalDate" required />

                <label>Paid By:</label>
                <select name="paidBy" id="modalPaidBy" required>
                  <% group.members.forEach(member => { %>
                  <option value="<%= member.name %>"><%= member.name %></option>
                  <% }); %>
                </select>

                <label>Split Option:</label>
                <select name="splitOption" id="modalSplitOption">
                  <option value="equal">Equal</option>
                  <option value="manual">Manual</option>
                </select>

                <div id="modalManualSplitContainer" style="display: none">
                  <h4 style="margin-bottom: 10px">Manual Splits (INR):</h4>
                  <% group.members.forEach(member => { %>
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
                <button type="submit">Save Changes</button>
              </form>

              <form
                action="/groupExpenses/delete"
                method="POST"
                style="margin-top: 10px">
                <input type="hidden" name="expenseId" id="modalDeleteId" />
                <input type="hidden" name="groupId" value="<%= group._id %>" />
                <button
                  type="submit"
                  style="background-color: red; color: white">
                  Delete Expense
                </button>
              </form>
            </div>
          </div>

          <section id="Balances"></section>
          <section id="Statistics"></section>
        </div>



        <---------------------------------------------->
           <div class="edit-group-div">
          <div style="display: flex; justify-content: space-between">
            <h1 style="text-align: center; font-weight: 700">EDIT GROUP</h1>
            <i class="fa-solid fa-circle-xmark" id="closeEditGroup"></i>
          </div>
          <form action="/groups/edit" class="edit-group-form" method="POST">
            <!-- Hidden group ID -->
            <input type="hidden" name="groupId" value="<%= group._id %>" />

            <div>
              <h5 for="editGroupName">Edit Group Name:</h5>
              <input
                type="text"
                id="editGroupName"
                name="groupName"
                value="<%= group.groupName %>"
                required
                placeholder="Enter new group name" />
            </div>

            <div id="editMembersContainer">
              <h5>Group Members (comma-separated):</h5>
              <textarea
                name="memberNames"
                placeholder="Edit members: John, Jack, Emily"
                required>

<%= group.members.map(member => member.name).join(', ') %></textarea
              >
</div>
<button type="submit" class="editGroupBtn">Edit Group</button>
</form>
</div>
