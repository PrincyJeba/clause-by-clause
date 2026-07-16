// Sets up the light/dark toggle. Theme itself is already applied
// before first paint by the inline script in index.html — this just
// wires up the button and keeps the label in sync.

(function () {
  const button = document.getElementById("themeToggle");

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  function updateLabel() {
    button.textContent = currentTheme() === "dark" ? "Light mode" : "Dark mode";
  }

  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateLabel();
  });

  updateLabel();
})();