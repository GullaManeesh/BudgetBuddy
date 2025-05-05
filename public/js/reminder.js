document.addEventListener("DOMContentLoaded", function () {
  const frequencySelect = document.getElementById("frequencySelect");
  const timeInput = document.getElementById("timeInput");
  const weeklyInput = document.getElementById("weeklyInput");
  const monthlyInput = document.getElementById("monthlyInput");
  const customDaysInput = document.getElementById("customDaysInput");

  function updateInputVisibility() {
    const frequency = frequencySelect.value;

    // Reset all inputs
    timeInput.style.display = "none";
    weeklyInput.style.display = "none";
    monthlyInput.style.display = "none";
    customDaysInput.style.display = "none";

    // Show relevant inputs based on selection
    if (
      frequency === "daily" ||
      frequency === "weekly" ||
      frequency === "monthly" ||
      frequency === "custom"
    ) {
      timeInput.style.display = "block";
    }
    if (frequency === "weekly") {
      weeklyInput.style.display = "block";
    }
    if (frequency === "monthly") {
      monthlyInput.style.display = "block";
    }
    if (frequency === "custom") {
      customDaysInput.style.display = "block";
    }
  }

  // Initial setup
  updateInputVisibility();

  // Add event listener
  frequencySelect.addEventListener("change", updateInputVisibility);
});
