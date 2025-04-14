function calculateBalances(group) {
  const balances = {};
  const owes = {};

  // Initialize balances and owes for all members
  group.members.forEach((member) => {
    balances[member.name] = 0;
    owes[member.name] = [];
  });

  // Process expenses first (only calculate what each person paid)
  group.expenses.forEach((exp) => {
    const totalAmount = exp.amount;
    const paidBy = exp.paidBy;

    // Add full amount to the payer
    balances[paidBy] += totalAmount;

    if (exp.splitOption === "equal") {
      const perPerson = totalAmount / group.members.length;

      group.members.forEach((member) => {
        balances[member.name] -= perPerson;

        if (member.name !== paidBy) {
          owes[member.name].push({ to: paidBy, amount: perPerson });
        }
      });
    } else {
      exp.splits.forEach((split) => {
        const { member, amount } = split;

        balances[member] -= amount;

        if (member !== paidBy) {
          owes[member].push({ to: paidBy, amount: amount });
        }
      });
    }
  });

  // Process settlements (only adjust owes, not balances)
  if (group.settlements && group.settlements.length > 0) {
    group.settlements.forEach((settlement) => {
      const { from, to, amount } = settlement;

      // Adjust owes
      if (owes[from]) {
        for (let i = 0; i < owes[from].length; i++) {
          if (owes[from][i].to === to) {
            owes[from][i].amount -= amount;
            if (owes[from][i].amount <= 0.01) {
              owes[from].splice(i, 1);
            }
            break;
          }
        }
      }

      // ✅ Adjust balances as well
      balances[from] += amount;
      balances[to] -= amount;
    });
  }

  // Clean up near-zero balances
  Object.keys(balances).forEach((name) => {
    if (Math.abs(balances[name]) < 0.01) balances[name] = 0;
  });

  // Filter out settled debts
  Object.keys(owes).forEach((debtor) => {
    owes[debtor] = owes[debtor].filter((debt) => debt.amount > 0.01);
  });

  return { balances, owes };
}

module.exports = calculateBalances;
