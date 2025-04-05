document.addEventListener("DOMContentLoaded", () => {
  const dashCon = document.querySelector(".dashCon");
  const expenseData = JSON.parse(dashCon.dataset.expense);

  // Group expenses by date for the bar chart (myChart1)
  const dailyExpenses = expenseData.reduce((acc, expense) => {
    const date = new Date(expense.CreatedDate).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += expense.ExpenseAmount;
    return acc;
  }, {});

  // Render the bar graph (myChart1) with the grouped daily expenses
  renderBarGraph(dailyExpenses);

  // Get today's date in locale format
  const today = new Date().toLocaleDateString();

  // Filter today's expenses
  const todayExpenses = expenseData.filter((expense) => {
    const expenseDate = new Date(expense.CreatedDate).toLocaleDateString();
    return expenseDate === today;
  });

  // Group today's expenses by BudgetName for the doughnut chart (myChart2)
  const categoryExpensesToday = todayExpenses.reduce((acc, expense) => {
    const category = expense.BudgetName;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.ExpenseAmount;
    return acc;
  }, {});

  // Render the doughnut chart (myChart2) with today's category expenses
  renderDoughnutGraph(categoryExpensesToday);
});

// Function to render the bar chart
function renderBarGraph(dailyExpenses) {
  const labels = Object.keys(dailyExpenses);
  const data = Object.values(dailyExpenses);

  const ctx = document.getElementById("myChart1").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Expenses",
          data: data,
          backgroundColor: "rgb(134, 233, 238)", // Bar color
          borderColor: "#50565e", // Border color
          borderWidth: 3,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Function to render the doughnut chart
function renderDoughnutGraph(categoryExpenses) {
  const labels = Object.keys(categoryExpenses);
  const data = Object.values(categoryExpenses);

  // Use more distinct colors with better contrast
  const backgroundColor = [
    "rgba(255, 99, 132, 0.7)",
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(75, 192, 192, 0.7)",
    "rgba(153, 102, 255, 0.7)",
    "rgba(255, 159, 64, 0.7)",
    "rgba(199, 199, 199, 0.7)",
    "rgba(83, 102, 255, 0.7)",
  ];

  const borderColor = "rgba(255, 255, 255, 0.8)";
  const borderWidth = 2;

  const ctx = document.getElementById("myChart2").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          // Add hover effects
          hoverBackgroundColor: backgroundColor.map((color) =>
            color.replace("0.7", "1")
          ),
          hoverBorderColor: "rgba(255, 255, 255, 1)",
          hoverBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "70%", // Makes the doughnut thinner
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#333", // Darker text for better visibility
            font: {
              size: 12,
            },
            padding: 20,
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: $${value.toFixed(2)} (${percentage}%)`;
            },
          },
          bodyFont: {
            size: 14,
          },
          titleFont: {
            size: 16,
            weight: "bold",
          },
          padding: 12,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          displayColors: true,
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
        },
      },
      // Ensure hover works properly
      onHover: (event, chartElement) => {
        if (chartElement.length) {
          event.native.target.style.cursor = "pointer";
        } else {
          event.native.target.style.cursor = "default";
        }
      },
      // Add animation configuration
      animation: {
        animateScale: true,
        animateRotate: true,
      },
    },
  });
}
