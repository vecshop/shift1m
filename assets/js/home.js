import habitService from "./habit-service.js";

// Global variables to store chart instances
let monthlyProgressChart = null;
let completionRateChart = null;

function updateHomeStats() {
  const habits = habitService.getAllHabits();
  const activeHabitsCount = habits.filter((habit) => !habit.archived).length;

  // Calculate total checklist completion
  const totalChecked = habits.reduce(
    (sum, habit) => sum + habit.progress.filter((day) => day).length,
    0
  );
  const totalDays = habits.reduce(
    (sum, habit) => sum + habit.progress.length,
    0
  );
  const totalProgress =
    totalDays > 0 ? Math.round((totalChecked / totalDays) * 100) : 0;

  // Calculate average streak
  const totalStreak = habits.reduce(
    (sum, habit) => sum + habitService.getCurrentStreak(habit.id),
    0
  );
  const avgStreak =
    habits.length > 0 ? Math.round(totalStreak / habits.length) : 0;

  // Update DOM
  document.getElementById("activeHabitsCount").textContent = activeHabitsCount;
  document.getElementById("currentStreak").textContent = avgStreak;
  document.getElementById("totalProgressBar").style.width = `${totalProgress}%`;
  document.getElementById(
    "totalProgressText"
  ).textContent = `${totalProgress}%`;
}

function prepareMonthlyProgressData() {
  const habits = habitService.getAllHabits();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  return last30Days.map((date) => {
    let checkedHabitsCount = 0;

    habits.forEach((habit) => {
      const dayIndex = (date.getDate() - 1) % habit.progress.length;
      if (habit.progress[dayIndex]) {
        checkedHabitsCount++;
      }
    });

    return {
      date: date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
      }),
      checkedCount: checkedHabitsCount,
      totalHabits: habits.length,
    };
  });
}

function prepareCompletionRateData() {
  const habits = habitService.getAllHabits();
  return habits
    .map((habit) => {
      const completionRate = habitService.getHabitProgress(habit.id);
      return {
        name: habit.name,
        completed: completionRate,
        color: generateColorFromString(habit.name),
      };
    })
    .sort((a, b) => b.completed - a.completed);
}

function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

function destroyCharts() {
  if (monthlyProgressChart) {
    monthlyProgressChart.destroy();
    monthlyProgressChart = null;
  }
  if (completionRateChart) {
    completionRateChart.destroy();
    completionRateChart = null;
  }
}

function updateCharts() {
  // Destroy existing charts
  destroyCharts();

  const monthlyProgressData = prepareMonthlyProgressData();
  const completionRateData = prepareCompletionRateData();

  // Monthly Progress Chart
  const lineCtx = document
    .getElementById("monthlyProgressChart")
    .getContext("2d");
  monthlyProgressChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: monthlyProgressData.map((data) => data.date),
      datasets: [
        {
          label: "Completed Habits",
          data: monthlyProgressData.map((data) => data.checkedCount),
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#4CAF50",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "top",
          labels: {
            padding: 20,
            font: {
              size: 12,
              family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (context) {
              const data = context.dataset.data[context.dataIndex];
              const total = monthlyProgressData[context.dataIndex].totalHabits;
              return `Completed: ${data} out of ${total} habits`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          max: Math.max(...monthlyProgressData.map((data) => data.totalHabits)),
          ticks: {
            stepSize: 1,
            font: {
              size: 11,
            },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    },
  });

  // Completion Rate Chart
  const barCtx = document
    .getElementById("completionRateChart")
    .getContext("2d");
  completionRateChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: completionRateData.map((data) => data.name),
      datasets: [
        {
          label: "Completion Rate",
          data: completionRateData.map((data) => data.completed),
          backgroundColor: completionRateData.map((data) => data.color),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Completion: ${context.parsed.y}%`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
            font: {
              size: 11,
            },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
      },
    },
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  updateCharts();
  updateHomeStats();
});

// Throttle function to prevent too many resize events
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Add throttled resize event listener
window.addEventListener(
  "resize",
  throttle(() => {
    updateCharts();
  }, 250)
);
