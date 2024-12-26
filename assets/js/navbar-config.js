import authService from "./auth-service.js";

const navConfig = {
  guest: [
    { link: "index.html", text: "Landing Page" },
    { link: "login.html", text: "Login" },
    { link: "register.html", text: "Register" },
  ],
};

function getProfileDisplay(user) {
  if (user?.user_metadata?.avatar_url) {
    return `<img 
      src="${user.user_metadata.avatar_url}" 
      class="nav-profile-img"
      data-bs-toggle="dropdown"
      alt="Profile"
    />`;
  }

  // Generate initials dari nama atau email
  const displayName = user.user_metadata?.full_name || user.email;
  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return `
    <div class="nav-profile-img default-profile" data-bs-toggle="dropdown">
      <span class="initials">${initials}</span>
    </div>
  `;
}

export function loadNavItems() {
  const isLoggedIn = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const navList = document.querySelector(".nav-list");

  if (!navList) {
    console.error("Error: Navbar container (.nav-list) not found!");
    return;
  }

  if (isLoggedIn) {
    navList.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="home.html">Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="dashboard.html">Dashboard</a>
      </li>
      <li class="nav-item dropdown">
        ${getProfileDisplay(currentUser)}
        <div class="dropdown-menu dropdown-menu-end profile-dropdown">
          <a class="dropdown-item d-flex align-items-center gap-2" href="my-account.html">
            <i class="bi bi-gear"></i>
            Settings
          </a>
          <hr class="dropdown-divider">
          <a class="dropdown-item d-flex align-items-center gap-2 text-danger" href="#" id="navLogoutBtn">
            <i class="bi bi-box-arrow-right"></i>
            Logout
          </a>
        </div>
      </li>
    `;

    document.getElementById("navLogoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      authService.logout();
    });
  } else {
    // Menu untuk guest tetap sama
    navList.innerHTML = navConfig.guest
      .map(
        (item) => `
        <li class="nav-item">
          <a class="nav-link" href="${item.link}">${item.text}</a>
        </li>
      `
      )
      .join("");
  }
}
