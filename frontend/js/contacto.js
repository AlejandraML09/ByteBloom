function enviarConsulta() {
  const nombre  = document.getElementById('inp-nombre').value.trim();
  const email   = document.getElementById('inp-email').value.trim();
  const tel     = document.getElementById('inp-tel').value.trim();
  const destino = document.getElementById('inp-destino').value;
  const asunto  = document.getElementById('inp-asunto').value.trim();
  const mensaje = document.getElementById('inp-mensaje').value.trim();
  const error   = document.getElementById('form-error');

  if (!nombre || !email || !destino || !mensaje) {
    error.textContent = 'Por favor completá los campos obligatorios.';
    error.style.display = 'block';
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    error.textContent = 'El email ingresado no es válido.';
    error.style.display = 'block';
    return;
  }

  error.style.display = 'none';

  const destinoNombre = destino === 'jose' ? 'José' : 'Laura';
  showToast(`✓ Mensaje enviado a ${destinoNombre}. Te respondemos a la brevedad.`);

  // Reset form
  document.getElementById('inp-nombre').value  = '';
  document.getElementById('inp-email').value   = '';
  document.getElementById('inp-tel').value     = '';
  document.getElementById('inp-destino').value = '';
  document.getElementById('inp-asunto').value  = '';
  document.getElementById('inp-mensaje').value = '';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}