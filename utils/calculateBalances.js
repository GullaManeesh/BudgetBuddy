function calculateBalances(group) {
  const balances = {};
  const owes = {};

  // Initialize balances and owes for all members
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
          // Only add to owes if the amount is significant
          if (perPerson > 0.01) {
            owes[member.name].push({ to: paidBy, amount: perPerson });
          }
        }
      });
    } else {
      exp.splits.forEach((split) => {
        if (split.member === paidBy) {
          balances[paidBy] += split.amount;
        } else {
          balances[split.member] -= split.amount;
          // Only add to owes if the amount is significant
          if (split.amount > 0.01) {
            owes[split.member].push({ to: paidBy, amount: split.amount });
          }
        }
      });
    }
  });

  // Process settlements
  if (group.settlements && group.settlements.length > 0) {
    group.settlements.forEach((settlement) => {
      let remainingAmount = settlement.amount;
      const { from, to } = settlement;

      // Adjust balances
      balances[from] -= settlement.amount;
      balances[to] += settlement.amount;

      // Adjust owes - first try to settle existing debts
      if (owes[from]) {
        for (let i = owes[from].length - 1; i >= 0; i--) {
          if (owes[from][i].to === to) {
            const remaining = owes[from][i].amount - remainingAmount;
            if (remaining > 0.01) {
              owes[from][i].amount = remaining;
              remainingAmount = 0; // All settlement amount used
              break;
            } else {
              owes[from].splice(i, 1);
              remainingAmount = Math.abs(remaining); // Carry over any excess
              // If we settled more than owed, create reverse entry
              if (remainingAmount > 0.01) {
                if (!owes[to]) owes[to] = [];
                owes[to].push({ to: from, amount: remainingAmount });
              }
              break;
            }
          }
        }
      }
    });
  }

  // Clean up near-zero balances
  Object.keys(balances).forEach((name) => {
    if (Math.abs(balances[name]) < 0.01) balances[name] = 0;
  });

  // Filter out settled debts and consolidate
  Object.keys(owes).forEach((debtor) => {
    const consolidated = {};
    owes[debtor].forEach((debt) => {
      if (debt.amount > 0.01) {
        if (!consolidated[debt.to]) {
          consolidated[debt.to] = debt.amount;
        } else {
          consolidated[debt.to] += debt.amount;
        }
      }
    });

    owes[debtor] = Object.keys(consolidated).map((to) => ({
      to,
      amount: consolidated[to],
    }));
  });

  return { balances, owes };
}
module.exports = calculateBalances;
