class HabitService {
  constructor() {
    // Validasi agar data yang diambil selalu array
    try {
      const savedHabits = JSON.parse(localStorage.getItem("habits"));
      this.habits = Array.isArray(savedHabits) ? savedHabits : [];
    } catch (error) {
      console.error("Failed to parse habits from localStorage:", error);
      this.habits = [];
    }
  }

  getAllHabits() {
    return this.habits; // Kembalikan array langsung
  }

  async createHabit(habitData) {
    const newHabit = {
      id: Date.now(),
      ...habitData,
      createdAt: new Date().toISOString(),
      progress: Array(30).fill(false), // Default progress: 30 hari belum dichecklist
    };

    this.habits.push(newHabit);
    this.saveHabits();
    return newHabit;
  }

  async updateHabit(habitId, updates) {
    const habitIndex = this.habits.findIndex((h) => h.id === habitId);
    if (habitIndex === -1) throw new Error("Habit not found");

    this.habits[habitIndex] = {
      ...this.habits[habitIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveHabits();
    return this.habits[habitIndex];
  }

  async toggleHabitDay(habitId, dayIndex) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) throw new Error("Habit not found");

    // Validasi day index
    if (dayIndex < 0 || dayIndex >= habit.progress.length) {
      throw new Error("Invalid day index");
    }

    // Toggle status checklist
    habit.progress[dayIndex] = !habit.progress[dayIndex];
    this.saveHabits();

    return habit;
  }

  async deleteHabit(habitId) {
    this.habits = this.habits.filter((h) => h.id !== habitId);
    this.saveHabits();
  }

  getHabitProgress(habitId) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return 0;

    const completedDays = habit.progress.filter((day) => day).length;
    return Math.round((completedDays / habit.progress.length) * 100); // Dibulatkan
  }

  getCurrentStreak(habitId) {
    const habit = this.habits.find((h) => h.id === habitId);
    if (!habit) return 0;

    let streak = 0;
    for (let i = habit.progress.length - 1; i >= 0; i--) {
      if (habit.progress[i]) streak++;
      else break;
    }
    return streak;
  }

  getTotalCompletion() {
    if (!this.habits.length) return 0;

    const totalProgress = this.habits.reduce(
      (sum, habit) =>
        sum +
        habit.progress.filter((day) => day).length / habit.progress.length,
      0
    );

    return Math.round((totalProgress / this.habits.length) * 100);
  }

  getActiveHabitsCount() {
    return this.habits.filter((habit) =>
      habit.progress.some((day) => day === true)
    ).length;
  }

  saveHabits() {
    localStorage.setItem("habits", JSON.stringify(this.habits));
    // Trigger custom event agar UI bisa diperbarui
    document.dispatchEvent(new CustomEvent("habitUpdated"));
  }
}

const habitService = new HabitService();
export default habitService;
