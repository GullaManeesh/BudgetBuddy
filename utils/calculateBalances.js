function calculateBalances(group) {
  const balances = {};

  // Initialize balances
  group.members.forEach((member) => {
    balances[member.name] = 0;
  });

  // Process expenses
  group.expenses.forEach((exp) => {
    const paidBy = exp.paidBy;

    if (exp.splitOption === "equal") {
      const share = exp.amount / group.members.length;
      group.members.forEach((member) => {
        if (member.name !== paidBy) {
          balances[member.name] -= share;
          balances[paidBy] += share;
        }
      });
    } else {
      // Manual splits
      exp.splits.forEach((split) => {
        if (split.member !== paidBy) {
          balances[split.member] -= split.amount;
          balances[paidBy] += split.amount;
        }
      });
    }
  });

  // Apply settlements
  if (group.settlements) {
    group.settlements.forEach((s) => {
      balances[s.from] -= s.amount;
      balances[s.to] += s.amount;
    });
  }

  // Round balances
  Object.keys(balances).forEach((name) => {
    balances[name] = Math.round(balances[name] * 100) / 100;
  });

  // Calculate who owes whom
  const owes = {};
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([name, balance]) => {
    if (balance > 0.01) creditors.push({ name, amount: balance });
    else if (balance < -0.01) debtors.push({ name, amount: -balance });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0,
    j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.01) {
      if (!owes[debtor.name]) owes[debtor.name] = [];
      owes[debtor.name].push({ to: creditor.name, amount });

      creditor.amount -= amount;
      debtor.amount -= amount;
    }

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return { balances, owes };
}
module.exports = calculateBalances;
