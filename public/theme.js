// Applies the saved theme before React loads, so the page never flashes the
// wrong colours. It's an external file because the CSP forbids inline
// scripts. Keep the storage key and logic in sync with src/hooks/useTheme.ts.
(function () {
  try {
    var preference = localStorage.getItem("resume-tailor:theme");
    var dark =
      preference === "dark" ||
      (preference !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {
    // Storage blocked: fall back to the light theme.
  }
})();
