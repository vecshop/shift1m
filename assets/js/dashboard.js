import habitService from "./habit-service.js";
import { showToast, createHabitCard } from "./ui-utils.js";

let cachedHabits = []; // Cache untuk habits

// Fungsi utama untuk memuat semua habit ke dashboard
async function initializeDashboard() {
  cachedHabits = await habitService.getAllHabits(); // Simpan data di cache
  const habitsContainer = document.querySelector(".habits-container");

  habitsContainer.innerHTML = ""; // Bersihkan kontainer sebelumnya
  cachedHabits.forEach((habit) => {
    const habitElement = createHabitCard(habit);
    habitsContainer.insertAdjacentHTML("beforeend", habitElement);
    updateProgressBar(habit.id); // Perbarui progress bar untuk setiap habit
  });

  await updateDashboardStats(); // Pastikan statistik diperbarui
}

// Fungsi untuk memperbarui progress bar
function updateProgressBar(habitId) {
  const habit = cachedHabits.find((h) => h.id === habitId);
  if (!habit) return;

  const completedDays = habit.progress.filter((day) => day).length;
  const progressPercentage = Math.round(
    (completedDays / habit.progress.length) * 100
  );

  const progressBar = document.querySelector(`#progressBar-${habitId}`);
  const progressText = document.querySelector(`#progressPercentage-${habitId}`);

  if (progressBar && progressText) {
    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `${progressPercentage}%`;
  }
}

// Fungsi untuk memperbarui statistik dashboard (streak, completion rate)
async function updateDashboardStats() {
  const habits = cachedHabits; // Gunakan cache lokal

  // Validasi agar habits selalu berupa array
  if (!Array.isArray(habits)) {
    console.error("Habits data is not an array:", habits);
    return;
  }

  // Hitung active habits
  const activeHabitsCount = habitService.getActiveHabitsCount();
  document.getElementById("activeHabitsCount").textContent = activeHabitsCount;

  // Hitung total streak dan completion rate
  let totalStreak = 0;
  let totalCompletion = 0;

  habits.forEach((habit) => {
    totalStreak += habitService.getCurrentStreak(habit.id);
    totalCompletion += habitService.getHabitProgress(habit.id);
  });

  const avgStreak = habits.length ? Math.round(totalStreak / habits.length) : 0;
  const avgCompletion = habits.length
    ? Math.round(totalCompletion / habits.length)
    : 0;

  document.getElementById("currentStreak").textContent = avgStreak;
  document.getElementById("completionRate").textContent = `${avgCompletion}%`;
}

// Event listener saat DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();

  // Event listener untuk membuka modal "Add Habit"
  document.querySelector(".btn-primary").addEventListener("click", () => {
    const addHabitModal = new bootstrap.Modal(
      document.getElementById("addHabitModal")
    );
    addHabitModal.show();
  });

  // Event listener untuk menyimpan habit baru
  document
    .getElementById("modalHabitForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const habitName = document.getElementById("habitName").value.trim();
      const habitDescription = document
        .getElementById("habitDescription")
        .value.trim();
      const habitReminder = document.getElementById("habitReminder").value;

      if (!habitName) {
        showToast("Habit name is required", "error");
        return;
      }

      const habitData = {
        name: habitName,
        description: habitDescription,
        reminderTime: habitReminder,
      };

      try {
        await habitService.createHabit(habitData);
        showToast("Habit added successfully!", "success");
        const addHabitModal = bootstrap.Modal.getInstance(
          document.getElementById("addHabitModal")
        );
        addHabitModal.hide();
        initializeDashboard(); // Reload habits
      } catch (error) {
        showToast("Failed to add habit", "error");
      }
    });

  // Event listener untuk meng-handle tombol edit dan checklist
  document
    .querySelector(".habits-container")
    .addEventListener("click", async (e) => {
      const habitDay = e.target.closest(".habit-day");
      const habitCard = e.target.closest(".habit-card");

      if (!habitCard) return;

      const habitId = parseInt(habitCard.dataset.habitId);

      // Handle tombol edit
      if (e.target.classList.contains("btn-edit")) {
        const habit = cachedHabits.find((h) => h.id === habitId);

        if (!habit) {
          showToast("Habit not found!", "error");
          return;
        }

        // Isi form di dalam modal dengan data habit
        document.getElementById("editHabitName").value = habit.name;
        document.getElementById("editHabitDescription").value =
          habit.description;
        document.getElementById("editHabitReminder").value =
          habit.reminderTime || "";

        // Simpan ID habit untuk diupdate nanti
        document.getElementById("editHabitModal").dataset.habitId = habitId;

        // Tampilkan modal
        const editHabitModal = new bootstrap.Modal(
          document.getElementById("editHabitModal")
        );
        editHabitModal.show();
      }

      // Handle toggle checklist
      if (habitDay) {
        const dayIndex = parseInt(habitDay.dataset.day);

        try {
          const updatedHabit = await habitService.toggleHabitDay(
            habitId,
            dayIndex
          );

          // Update cache lokal
          const index = cachedHabits.findIndex((h) => h.id === habitId);
          if (index !== -1) {
            cachedHabits[index] = updatedHabit;
          }

          // Update tampilan checklist
          habitDay.classList.toggle("completed");
          updateProgressBar(habitId);
          await updateDashboardStats();
        } catch (error) {
          console.error("Error updating habit:", error);
          showToast("Failed to update habit progress", "error");
        }
      }
    });

  // Event listener untuk menyimpan perubahan habit (Edit Habit)
  document
    .getElementById("saveEditHabit")
    .addEventListener("click", async () => {
      const habitId = parseInt(
        document.getElementById("editHabitModal").dataset.habitId
      );

      const updatedHabit = {
        name: document.getElementById("editHabitName").value,
        description: document.getElementById("editHabitDescription").value,
        reminderTime: document.getElementById("editHabitReminder").value,
      };

      try {
        await habitService.updateHabit(habitId, updatedHabit);

        // Tutup modal
        const editHabitModal = bootstrap.Modal.getInstance(
          document.getElementById("editHabitModal")
        );
        editHabitModal.hide();

        // Refresh dashboard
        initializeDashboard();
        showToast("Habit updated successfully!", "success");
      } catch (error) {
        console.error("Error updating habit:", error);
        showToast("Failed to update habit.", "error");
      }
    });

  // Real-time update saat data habit disimpan
  document.addEventListener("habitUpdated", async () => {
    await initializeDashboard();
  });
});
