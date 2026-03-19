/**
 * navbar.js
 * Maneja el toggle del menú mobile (hamburger).
 * El navbar ya está incluido en cada HTML — no se necesita fetch().
 */
(function () {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
  }
})();