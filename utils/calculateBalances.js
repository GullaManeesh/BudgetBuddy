function calculateBalances(group) {
  const balances = {};
  const owes = {};

  // Initialize balances for all members
  group.members.forEach((member) => {
    balances[member.name] = 0;
  });

  // Calculate net balances from expenses
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
      // Handle manual splits
      exp.splits.forEach((split) => {
        if (split.member === paidBy) {
          balances[paidBy] += split.amount;
        } else {
          balances[split.member] -= split.amount;
        }
      });
    }
  });

  // Apply settlements to adjust balances
  if (group.settlements && group.settlements.length > 0) {
    group.settlements.forEach((settlement) => {
      balances[settlement.from] -= settlement.amount;
      balances[settlement.to] += settlement.amount;
    });
  }

  // Round to 2 decimal places to avoid floating point issues
  Object.keys(balances).forEach((name) => {
    balances[name] = Math.round(balances[name] * 100) / 100;
  });

  // Calculate optimal owes (simplified settlement)
  const creditors = [];
  const debtors = [];

  // Separate into creditors (positive balance) and debtors (negative balance)
  Object.keys(balances).forEach((name) => {
    if (balances[name] > 0) {
      creditors.push({ name, amount: balances[name] });
    } else if (balances[name] < 0) {
      debtors.push({ name, amount: -balances[name] });
    }
  });

  // Sort creditors and debtors by amount (largest first)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Calculate who owes whom how much (optimal settlement)
  const transactions = [];
  let i = 0,
    j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.01) {
      // Ignore tiny amounts
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount,
      });

      creditor.amount -= amount;
      debtor.amount -= amount;
    }

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  // Convert transactions to owes format
  transactions.forEach((txn) => {
    if (!owes[txn.from]) owes[txn.from] = [];
    owes[txn.from].push({
      to: txn.to,
      amount: txn.amount,
    });
  });

  return { balances, owes };
}
module.exports = calculateBalances;
