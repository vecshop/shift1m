import { loadNavItems } from "./navbar-config.js"; // Path sudah benar

/**
 * Fungsi untuk memuat navbar secara dinamis.
 */
export const loadNavbar = async () => {
  try {
    const response = await fetch("assets/navbar.html"); // Path sudah benar
    const navbarHtml = await response.text();

    // Inject HTML navbar ke dalam placeholder
    document.getElementById("navbar-placeholder").innerHTML = navbarHtml;

    // Setelah navbar selesai dimuat, panggil loadNavItems
    loadNavItems();
  } catch (error) {
    console.error("Error loading navbar:", error);
    document.getElementById("navbar-placeholder").innerHTML =
      "<p>Failed to load navigation bar. Please try again later.</p>";
  }
};

/**
 * Fungsi untuk mengecek autentikasi pengguna.
 */
export const checkAuth = () => {
  const isLoggedIn = !!localStorage.getItem("shift1m_token");
  if (!isLoggedIn) {
    window.location.href = "login.html";
  }
};
