function calculateBalances(group) {
  const balances = {};
  const owes = {}; // New structure to track who owes whom

  // Initialize all members' balances
  group.members.forEach((member) => {
    balances[member.name] = 0;
    owes[member.name] = []; // Initialize an array for each member
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
          owes[member.name].push({ to: paidBy, amount: perPerson }); // Track who owes whom
        }
      });
    } else {
      exp.splits.forEach((split) => {
        if (split.member === paidBy) {
          balances[paidBy] += split.amount;
        } else {
          balances[split.member] -= split.amount;
          owes[split.member].push({ to: paidBy, amount: split.amount }); // Track who owes whom
        }
      });
    }
  });

  return { balances, owes };
}
module.exports = calculateBalances;
