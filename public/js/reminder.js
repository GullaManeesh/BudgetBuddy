const frequencySelect = document.getElementById("frequencySelect");
const timeInput = document.getElementById("timeInput");
const weeklyInput = document.getElementById("weeklyInput");
const monthlyInput = document.getElementById("monthlyInput");

frequencySelect.addEventListener("change", () => {
  timeInput.style.display = "none";
  weeklyInput.style.display = "none";
  monthlyInput.style.display = "none";

  if (
    frequencySelect.value === "daily" ||
    frequencySelect.value === "weekly" ||
    frequencySelect.value === "monthly"
  ) {
    timeInput.style.display = "block";
  }
  if (frequencySelect.value === "weekly") {
    weeklyInput.style.display = "block";
  }
  if (frequencySelect.value === "monthly") {
    monthlyInput.style.display = "block";
  }
});
