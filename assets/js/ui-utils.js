// assets/js/ui-utils.js
export const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type} fade-in`;
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
};
export const createHabitCard = (habit) => {
  const progress =
    (habit.progress.filter((day) => day).length / habit.progress.length) * 100;

  return `
    <div class="habit-card card mb-3" data-habit-id="${habit.id}">
      <div class="card-body">
        <div class="habit-header">
          <h5>${habit.name}</h5>
          <div class="habit-actions">
            <button class="btn btn-sm btn-edit" data-bs-toggle="modal" data-habit-id="${
              habit.id
            }">Edit</button>
            <button class="btn btn-sm btn-delete">Delete</button>
          </div>
        </div>
        <div class="header-above">
          <span style="font-style: italic;">${habit.description}</span>
          <span class="reminder">${habit.reminderTime}</span>
        </div>
        <div class="progress mt-2">
          <div class="progress-bar" id="progressBar-${habit.id}" 
               role="progressbar" style="width: ${progress}%;"></div>
          <span id="progressPercentage-${habit.id}" class="progress-text">
            ${Math.round(progress)}%
          </span>
        </div>
        <div class="habit-grid mt-3">
          ${habit.progress
            .map(
              (completed, index) => `
                <div class="habit-day ${completed ? "completed" : ""}" 
                     data-day="${index}">
                  ${index + 1}
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
};

export const initializeFormValidation = (formElement, validationRules) => {
  formElement.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(formElement);
    const errors = [];

    for (const [field, rules] of Object.entries(validationRules)) {
      const value = formData.get(field);

      for (const rule of rules) {
        if (!rule.validate(value)) {
          errors.push(rule.message);
        }
      }
    }

    if (errors.length > 0) {
      showToast(errors.join("\n"), "error");
      return false;
    }

    return true;
  });
};

export const confirmDialog = (message) => {
  return new Promise((resolve) => {
    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `
            <div class="confirm-content">
                <p>${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn btn-primary" data-action="confirm">Confirm</button>
                </div>
            </div>
        `;

    dialog.addEventListener("click", (e) => {
      if (e.target.dataset.action === "confirm") {
        resolve(true);
      } else if (e.target.dataset.action === "cancel") {
        resolve(false);
      }
      dialog.remove();
    });

    document.body.appendChild(dialog);
  });
};
