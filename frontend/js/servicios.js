function toggleMenu() {
      document.getElementById('mobileMenu').classList.toggle('open');
      document.getElementById('hamburger').classList.toggle('open');
    }

    // Scroll suave a zona y actualizar tab activo
    function scrollTo(zona, btn) {
      document.querySelectorAll('.zone-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('zona-' + zona).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Actualizar tab activo al hacer scroll
    const sections = ['superior','medio','inferior'];
    window.addEventListener('scroll', () => {
      let current = 'superior';
      sections.forEach(z => {
        const el = document.getElementById('zona-' + z);
        if (el && el.getBoundingClientRect().top < 180) current = z;
      });
      document.querySelectorAll('.zone-tab').forEach((t, i) => {
        t.classList.toggle('active', sections[i] === current);
      });
    });