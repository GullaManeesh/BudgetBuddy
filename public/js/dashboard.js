let chartInstance;
let isMonthly = false;

document.addEventListener("DOMContentLoaded", () => {
  const dashCon = document.querySelector(".dashCon");
  const expenseData = JSON.parse(dashCon.dataset.expenses);
  const toggleBtn = document.getElementById("toggleChart");

  const pieContainer = document.querySelector(".pieCharts");
  const rawBudgets = pieContainer.dataset.budgets;
  const budgets = JSON.parse(rawBudgets);
  renderPieChart(budgets);

  const drawChart = () => {
    const groupedExpenses = isMonthly
      ? getMonthlyExpenses(expenseData)
      : getDailyExpenses(expenseData);

    if (chartInstance) chartInstance.destroy();
    renderBarGraph(groupedExpenses);
  };

  toggleBtn.addEventListener("click", () => {
    isMonthly = !isMonthly;
    toggleBtn.textContent = isMonthly ? "Switch to Daily" : "Switch to Monthly";
    drawChart();
  });

  drawChart();

  populateMonthSelector(expenseData);
  document.getElementById("monthSelector").addEventListener("change", (e) => {
    const selectedMonth = e.target.value;
    renderMonthlyBudgetPieChart(expenseData, selectedMonth);
  });
});

function getDailyExpenses(data) {
  const dailyExpenses = {};
  data.forEach((expense) => {
    const date = new Date(expense.CreatedDate).toISOString().split("T")[0];
    const amount = parseFloat(expense.ExpenseAmount);
    dailyExpenses[date] = (dailyExpenses[date] || 0) + amount;
  });

  return Object.fromEntries(
    Object.entries(dailyExpenses).sort(
      (a, b) => new Date(a[0]) - new Date(b[0])
    )
  );
}

function getMonthlyExpenses(data) {
  const monthlyExpenses = {};
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  data.forEach((expense) => {
    const date = new Date(expense.CreatedDate);
    const year = date.getFullYear();
    const monthName = monthNames[date.getMonth()];
    const key = `${monthName} ${year}`; // Example: March 2025
    const amount = parseFloat(expense.ExpenseAmount);
    monthlyExpenses[key] = (monthlyExpenses[key] || 0) + amount;
  });

  return Object.fromEntries(
    Object.entries(monthlyExpenses).sort((a, b) => {
      const [monthA, yearA] = a[0].split(" ");
      const [monthB, yearB] = b[0].split(" ");
      const indexA = monthNames.indexOf(monthA);
      const indexB = monthNames.indexOf(monthB);
      return (
        new Date(`${yearA}-${indexA + 1}`) - new Date(`${yearB}-${indexB + 1}`)
      );
    })
  );
}

function renderBarGraph(expenses) {
  const labels = Object.keys(expenses);
  const data = Object.values(expenses);

  const ctx = document.getElementById("myChart1").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Expenses",
          data: data,
          backgroundColor: "rgb(255, 111, 125)",
          borderWidth: 2,
          barThickness: 20,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: isMonthly
            ? "Monthly Expense Analysis"
            : "Daily Expense Analysis",
          color: "#fff",
          font: { size: 18, weight: "bold" },
        },
        tooltip: {
          callbacks: {
            label: (context) => `Amount: ₹${context.parsed.y}`,
          },
        },
        legend: {
          labels: {
            color: "white",
            font: { size: 14 },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount",
            color: "white",
            font: { size: 16, weight: "bold" },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.27)",
          },
          ticks: {
            color: "white",
            font: { size: 14 },
          },
        },
        x: {
          title: {
            display: true,
            text: isMonthly ? "Month" : "Date",
            color: "white",
            font: { size: 16, weight: "bold" },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.27)",
          },
          ticks: {
            color: "white",
            font: { size: 14 },
          },
        },
      },
    },
  });
}

function renderPieChart(budgets) {
  const ctx = document.getElementById("budgetPieChart").getContext("2d");

  const labels = budgets.map((b) => b.BudgetName);
  const data = budgets.map((b) => b.BudgetSpent);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#66BB6A",
            "#BA68C8",
            "#FFA726",
            "#4DD0E1",
            "#EF5350",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#fff",
            font: { size: 14 },
          },
        },
        title: {
          display: true,
          text: "Total Budget-wise Spent Breakdown",
          color: "#fff",
          font: { size: 18 },
        },
      },
    },
  });
}

let monthlyPieChartInstance;

function populateMonthSelector(expenses) {
  const monthSet = new Set();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  expenses.forEach((e) => {
    const date = new Date(e.CreatedDate);
    const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    monthSet.add(month);
  });

  const sortedMonths = Array.from(monthSet).sort((a, b) => {
    const [ma, ya] = a.split(" ");
    const [mb, yb] = b.split(" ");
    return (
      new Date(`${ya}-${monthNames.indexOf(ma) + 1}`) -
      new Date(`${yb}-${monthNames.indexOf(mb) + 1}`)
    );
  });

  const select = document.getElementById("monthSelector");
  select.innerHTML = ""; // Clear existing options

  const currentDate = new Date();
  const currentMonthText = `${
    monthNames[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;

  let defaultMonthFound = false;

  sortedMonths.forEach((month) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    if (month === currentMonthText) {
      option.selected = true;
      defaultMonthFound = true;
    }
    select.appendChild(option);
  });

  // If current month is not present, use first month as default
  const selectedMonth = defaultMonthFound ? currentMonthText : sortedMonths[0];
  if (selectedMonth) {
    renderMonthlyBudgetPieChart(expenses, selectedMonth);
  }
}

function renderMonthlyBudgetPieChart(expenses, selectedMonth) {
  const ctx = document.getElementById("monthlyBudgetPieChart").getContext("2d");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const filtered = expenses.filter((e) => {
    const date = new Date(e.CreatedDate);
    const formattedMonth = `${
      monthNames[date.getMonth()]
    } ${date.getFullYear()}`;
    return formattedMonth === selectedMonth;
  });

  const categoryTotals = {};
  filtered.forEach((e) => {
    const category = e.BudgetName;
    const amount = parseFloat(e.ExpenseAmount);
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (monthlyPieChartInstance) monthlyPieChartInstance.destroy();

  monthlyPieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#66BB6A",
            "#BA68C8",
            "#FFA726",
            "#4DD0E1",
            "#EF5350",
            "#AB47BC",
            "#26A69A",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#fff",
            font: { size: 14 },
          },
        },
        title: {
          display: true,
          text: `Budget-wise Expenses for ${selectedMonth}`,
          color: "#fff",
          font: { size: 18 },
        },
      },
    },
  });
}
