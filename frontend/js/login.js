const USUARIOS = {
  'paciente@kinesalud.com': { pass: 'paciente123', role: 'usuario', nombre: 'Maria Gonzalez' },
  'admin@kinesalud.com':    { pass: 'admin123',    role: 'admin',   nombre: 'Dr. Ramirez'   },
};

let currentRole = 'usuario';

function setRole(role) {
  currentRole = role;
  const body  = document.getElementById('login-body');
  const tabU  = document.getElementById('tab-usuario');
  const tabA  = document.getElementById('tab-admin');
  const hint  = document.getElementById('demo-hint');
  const title = document.getElementById('greeting-title');
  const sub   = document.getElementById('greeting-sub');

  document.getElementById('error-msg').classList.remove('show');

  if (role === 'admin') {
    tabA.classList.add('active-tab');
    tabU.classList.remove('active-tab');
    body.classList.add('admin-mode');
    title.textContent = 'Panel de administracion';
    sub.textContent   = 'Acceso restringido al equipo de KineSalud';
    hint.innerHTML    = '<strong>Demo Admin:</strong><br>Email: <strong>admin@kinesalud.com</strong><br>Contrasena: <strong>admin123</strong>';
  } else {
    tabU.classList.add('active-tab');
    tabA.classList.remove('active-tab');
    body.classList.remove('admin-mode');
    title.textContent = 'Bienvenido/a';
    sub.textContent   = 'Ingresa con tu cuenta de paciente';
    hint.innerHTML    = '<strong>Demo Paciente:</strong><br>Email: <strong>paciente@kinesalud.com</strong><br>Contrasena: <strong>paciente123</strong>';
  }

  document.getElementById('inp-email').value = '';
  document.getElementById('inp-pass').value  = '';
}

function doLogin() {
  const email = document.getElementById('inp-email').value.trim().toLowerCase();
  const pass  = document.getElementById('inp-pass').value;
  const error = document.getElementById('error-msg');
  const user  = USUARIOS[email];

  if (!user || user.pass !== pass || user.role !== currentRole) {
    error.classList.add('show');
    document.getElementById('inp-pass').value = '';
    return;
  }

  error.classList.remove('show');
  sessionStorage.setItem('ks_user', JSON.stringify({
    email, role: user.role, nombre: user.nombre
  }));

  window.location.href = user.role === 'admin' ? '../templates/admin.html' : '../templates/turnos.html';
}