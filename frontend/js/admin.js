/* ── Datos demo ──────────────────────────────────────── */
    const HORARIOS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
    const ZONAS    = { superior: 'Tren superior', medio: 'Tren medio', inferior: 'Tren inferior' };

    const PACIENTES = [
      { id:1, nombre:'María González',   email:'paciente@Empresa.com', tel:'221-4561234', os:'IOMA',           zona:'superior', asistencias: 12 },
      { id:2, nombre:'Carlos Pérez',     email:'cperez@mail.com',        tel:'221-7893456', os:'OSDE',           zona:'inferior', asistencias: 8  },
      { id:3, nombre:'Ana Rodríguez',    email:'ana.r@mail.com',         tel:'221-5554321', os:'Swiss Medical',  zona:'medio',    asistencias: 15 },
      { id:4, nombre:'Luis Martínez',    email:'luism@mail.com',         tel:'221-3217654', os:'PAMI',           zona:'inferior', asistencias: 5  },
      { id:5, nombre:'Sofía Torres',     email:'sofiat@mail.com',        tel:'221-6549870', os:'Galeno',         zona:'superior', asistencias: 20 },
      { id:6, nombre:'Diego Fernández',  email:'diegof@mail.com',        tel:'221-1236540', os:'Particular',     zona:'medio',    asistencias: 3  },
      { id:7, nombre:'Laura Sánchez',    email:'lauras@mail.com',        tel:'221-9874561', os:'IOMA',           zona:'superior', asistencias: 9  },
      { id:8, nombre:'Roberto Díaz',     email:'rdíaz@mail.com',         tel:'221-7412580', os:'OSDE',           zona:'inferior', asistencias: 11 },
    ];

    // Turnos demo: distribuidos en los horarios de hoy
    function buildTurnos(fecha) {
      const seed = fecha.split('-').join('');
      const turnos = [];
      const dist = [
        { pac:0, hora:'09:00', zona:'superior', estado:'confirmado'  },
        { pac:4, hora:'09:00', zona:'superior', estado:'confirmado'  },
        { pac:1, hora:'10:00', zona:'inferior', estado:'confirmado'  },
        { pac:2, hora:'10:00', zona:'medio',    estado:'confirmado'  },
        { pac:6, hora:'11:00', zona:'superior', estado:'pendiente'   },
        { pac:3, hora:'12:00', zona:'inferior', estado:'confirmado'  },
        { pac:5, hora:'13:00', zona:'medio',    estado:'cancelado'   },
        { pac:7, hora:'14:00', zona:'inferior', estado:'confirmado'  },
        { pac:2, hora:'15:00', zona:'medio',    estado:'pendiente'   },
      ];
      return dist.map((t, i) => ({ ...t, paciente: PACIENTES[t.pac], id: i }));
    }

    // Cupos demo
    const cuposMax = {};
    HORARIOS.forEach(h => { cuposMax[h] = 5; });

    const ocupados = {};
    function getOcup(fecha, hora) {
      const k = `${fecha}_${hora}`;
      if (!(k in ocupados)) ocupados[k] = Math.floor(Math.random() * 4);
      return ocupados[k];
    }

    // Asistencia
    const asistencia = {};

    /* ── Helpers ─────────────────────────────────────────── */
    function fmtDate(d) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

    function fmtLargo(d) {
      const dt = new Date(d + 'T00:00:00');
      return `${DIAS[dt.getDay()]} ${dt.getDate()} de ${MESES[dt.getMonth()]}`;
    }

    function initials(nombre) {
      return nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    /* ── Fecha de hoy ────────────────────────────────────── */
    const today = fmtDate(new Date());
    document.getElementById('fecha-hoy').textContent = fmtLargo(today);

    // Inicializar inputs de fecha
    ['filter-date','filter-cupos-date','filter-asist-date'].forEach(id => {
      document.getElementById(id).value = today;
    });

    // Selector de hora en asistencia
    const selHora = document.getElementById('filter-asist-hora');
    HORARIOS.forEach(h => {
      const o = document.createElement('option');
      o.value = h; o.textContent = h;
      selHora.appendChild(o);
    });

    /* ── Tabs ────────────────────────────────────────────── */
    function showSection(name, btn) {
      document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.sec-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('panel-' + name).classList.add('active');
      btn.classList.add('active');
    }

    /* ── Render: Turnos ──────────────────────────────────── */
    function renderTurnos() {
      const fecha  = document.getElementById('filter-date').value;
      const turnos = buildTurnos(fecha);
      const tbody  = document.getElementById('tbody-turnos');
      document.getElementById('turnos-fecha-sub').textContent = fmtLargo(fecha);

      tbody.innerHTML = '';
      if (!turnos.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-t);padding:2rem;">Sin turnos para esta fecha</td></tr>';
        return;
      }

      turnos.forEach(t => {
        const estadoBadge =
          t.estado === 'confirmado' ? '<span class="badge badge-green">Confirmado</span>' :
          t.estado === 'pendiente'  ? '<span class="badge badge-amber">Pendiente</span>'  :
                                     '<span class="badge badge-red">Cancelado</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="patient-name">
            <div class="patient-avatar">${initials(t.paciente.nombre)}</div>
            <span>${t.paciente.nombre}</span>
          </div></td>
          <td><strong>${t.hora}</strong> – ${nextHour(t.hora)}</td>
          <td><span class="badge badge-purple">${ZONAS[t.zona]}</span></td>
          <td>${t.paciente.os}</td>
          <td>${estadoBadge}</td>
          <td>
            <button class="btn-action danger" onclick="cancelarTurno(this, '${t.paciente.nombre}')">Cancelar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('stat-turnos').textContent = turnos.filter(t => t.estado !== 'cancelado').length;
    }

    function cancelarTurno(btn, nombre) {
      const tr = btn.closest('tr');
      tr.cells[4].innerHTML = '<span class="badge badge-red">Cancelado</span>';
      btn.disabled = true;
      btn.style.opacity = '0.4';
      showToast(`Turno de ${nombre} cancelado`);
    }

    function nextHour(h) {
      const [hr] = h.split(':').map(Number);
      return `${String(hr+1).padStart(2,'0')}:00`;
    }

    /* ── Render: Pacientes ───────────────────────────────── */
    function renderPacientes() {
      const tbody = document.getElementById('tbody-pacientes');
      tbody.innerHTML = '';
      PACIENTES.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="patient-name">
            <div class="patient-avatar">${initials(p.nombre)}</div>
            <span>${p.nombre}</span>
          </div></td>
          <td style="color:var(--p-dark);">${p.email}</td>
          <td>${p.tel}</td>
          <td>${p.os}</td>
          <td><span class="badge badge-purple">${ZONAS[p.zona]}</span></td>
          <td><span class="badge badge-green">${p.asistencias} sesiones</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    /* ── Render: Cupos ───────────────────────────────────── */
    function renderCupos() {
      const fecha = document.getElementById('filter-cupos-date').value;
      const tbody = document.getElementById('tbody-cupos');
      tbody.innerHTML = '';

      let totalLibres = 0;

      HORARIOS.forEach(hora => {
        const ocupado  = getOcup(fecha, hora);
        const maxActual = cuposMax[hora];
        const libres   = Math.max(0, maxActual - ocupado);
        totalLibres += libres;

        const dots = Array.from({length: 5}, (_, i) =>
          `<div class="cupo-dot${i < ocupado ? (ocupado >= maxActual ? ' full' : ' taken') : ''}"></div>`
        ).join('');

        const estadoBadge = libres === 0 ? '<span class="badge badge-red">Sin cupos</span>' :
                            libres <= 1  ? '<span class="badge badge-amber">Casi lleno</span>' :
                                          '<span class="badge badge-green">Disponible</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${hora}</strong></td>
          <td><div class="cupo-bar">${dots}</div></td>
          <td><input class="cupo-input" type="number" min="1" max="10" value="${maxActual}" data-hora="${hora}" /></td>
          <td>${libres} lugar${libres !== 1 ? 'es' : ''}</td>
          <td>${estadoBadge}</td>
          <td><button class="btn-action" onclick="guardarCupo(this, '${hora}')">Guardar</button></td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('stat-libres').textContent = totalLibres;
    }

    function guardarCupo(btn, hora) {
      const tr  = btn.closest('tr');
      const inp = tr.querySelector('.cupo-input');
      cuposMax[hora] = parseInt(inp.value) || 5;
      showToast(`Cupo de ${hora} actualizado a ${cuposMax[hora]} personas`);
      renderCupos();
    }

    /* ── Render: Asistencia ──────────────────────────────── */
    function renderAsistencia() {
      const fecha  = document.getElementById('filter-asist-date').value;
      const hora   = document.getElementById('filter-asist-hora').value;
      const turnos = buildTurnos(fecha).filter(t => t.hora === hora && t.estado !== 'cancelado');
      const tbody  = document.getElementById('tbody-asistencia');
      tbody.innerHTML = '';

      if (!turnos.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--gray-t);padding:2rem;">Sin pacientes en este horario</td></tr>';
        return;
      }

      turnos.forEach(t => {
        const key     = `${fecha}_${hora}_${t.paciente.id}`;
        const checked = asistencia[key] ? 'checked' : '';
        const tr      = document.createElement('tr');
        tr.innerHTML = `
          <td><div class="patient-name">
            <div class="patient-avatar">${initials(t.paciente.nombre)}</div>
            <span>${t.paciente.nombre}</span>
          </div></td>
          <td><span class="badge badge-purple">${ZONAS[t.zona]}</span></td>
          <td><input type="checkbox" class="asist-check" data-key="${key}" ${checked} /></td>
        `;
        tbody.appendChild(tr);
      });
    }

    function guardarAsistencia() {
      document.querySelectorAll('.asist-check').forEach(cb => {
        asistencia[cb.dataset.key] = cb.checked;
      });
      const presentes = Object.values(asistencia).filter(Boolean).length;
      document.getElementById('stat-presentes').textContent = presentes;
      showToast('Asistencia guardada correctamente');
    }

    /* ── Sesión ──────────────────────────────────────────── */
    function logout() {
      sessionStorage.removeItem('ks_user');
      window.location.href = 'login.html';
    }

    // Leer nombre del sessionStorage si existe
    const sess = sessionStorage.getItem('ks_user');
    if (sess) {
      const u = JSON.parse(sess);
      document.getElementById('nav-nombre').textContent = u.nombre;
      document.getElementById('nav-initials').textContent = initials(u.nombre);
    }

    /* ── Init ────────────────────────────────────────────── */
    renderTurnos();
    renderPacientes();
    renderCupos();
    renderAsistencia();