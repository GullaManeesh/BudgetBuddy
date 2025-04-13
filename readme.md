<% group.members.forEach(member => { %>
<div class="manual-split-entry">
<label><%= member.name %>:</label>
<input
                          type="number"
                          name="manualSplits[<%= member.name %>]"
                          placeholder="0" />
</div>
<% }); %>
