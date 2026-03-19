function toggleMenu() {
      const menu = document.getElementById('mobileMenu');
      const btn  = document.getElementById('hamburger');
      menu.classList.toggle('open');
      btn.classList.toggle('open');
    }

    /* ── Estado de la app ────────────────────────────────── */
    const state = {
      zona:      null,
      diaDate:   null,
      slot:      null,
      weekOffset: 0,
    };

    /* ── Cupos simulados (clave: "YYYY-MM-DD_HH:MM") ─────── */
    // Precargamos algunos turnos con ocupación para demostración
    const ocupados = {};
    function seedOcupados() {
      const hoy = new Date();
      const dias = [-1, 0, 1, 2, 3];
      const horas = ['09:00','10:00','11:00','14:00','15:00'];
      dias.forEach(d => {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + d);
        if (fecha.getDay() === 0 || fecha.getDay() === 6) return;
        horas.forEach(h => {
          const key = `${fmtDate(fecha)}_${h}`;
          ocupados[key] = Math.floor(Math.random() * 5);
        });
      });
    }
    seedOcupados();

    function getOcupados(fecha, hora) {
      const key = `${fmtDate(fecha)}_${hora}`;
      return ocupados[key] || 0;
    }

    /* ── Helpers de fecha ────────────────────────────────── */
    const DIAS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const MESES_ES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    function fmtDate(d) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function fmtDiaLargo(d) {
      return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
    }

    function getMonday(d) {
      const day = d.getDay();
      const diff = (day === 0) ? -6 : 1 - day;
      const mon = new Date(d);
      mon.setDate(d.getDate() + diff);
      return mon;
    }

    /* ── Horarios disponibles ─────────────────────────────── */
    const HORARIOS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

    /* ── Renderizar semana ───────────────────────────────── */
    const today = new Date();
    today.setHours(0,0,0,0);

    function renderWeek() {
      const base = new Date(today);
      base.setDate(today.getDate() + state.weekOffset * 7);
      const monday = getMonday(base);

      // Label de semana
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      document.getElementById('week-label').textContent =
        `${monday.getDate()} al ${friday.getDate()} de ${MESES_ES[friday.getMonth()]}`;

      // Flecha atrás: deshabilitar si la semana ya pasó
      const prevMonday = new Date(monday);
      prevMonday.setDate(monday.getDate() - 7);
      document.getElementById('btn-prev-week').disabled = prevMonday < today;

      // Días
      const row = document.getElementById('days-row');
      row.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const isPast = d < today;
        const isToday = fmtDate(d) === fmtDate(today);
        const isSelected = state.diaDate && fmtDate(d) === fmtDate(state.diaDate);

        const btn = document.createElement('button');
        btn.className = `day-btn${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isPast ? ' past' : ''}`;
        btn.disabled = isPast;
        btn.style.opacity = isPast ? '0.35' : '1';
        btn.style.cursor  = isPast ? 'not-allowed' : 'pointer';
        btn.innerHTML = `
          <div class="day-name">${DIAS_ES[d.getDay()]}</div>
          <div class="day-num">${d.getDate()}</div>
        `;
        btn.onclick = () => selectDia(d);
        row.appendChild(btn);
      }
    }

    /* ── Renderizar horarios ─────────────────────────────── */
    function renderSlots() {
      const container = document.getElementById('slots-container');
      if (!state.diaDate) {
        container.innerHTML = `<div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <p>Seleccioná un día para ver los turnos disponibles</p>
        </div>`;
        return;
      }

      const grid = document.createElement('div');
      grid.className = 'slots-grid';

      HORARIOS.forEach(hora => {
        const taken = getOcupados(state.diaDate, hora);
        const isFull = taken >= 5;
        const isSelected = state.slot === hora;

        const btn = document.createElement('button');
        btn.className = `slot-btn${isFull ? ' full' : ''}${isSelected ? ' selected' : ''}`;
        btn.disabled = isFull;

        // Dots de cupo
        let dots = '';
        for (let i = 0; i < 5; i++) {
          dots += `<div class="slot-dot${i < taken ? ' taken' : ''}"></div>`;
        }

        btn.innerHTML = `
          <span class="slot-time">${hora}</span>
          <div class="slot-dots">${dots}</div>
          <div class="slot-cupos" style="color:${isFull ? 'var(--gray-text)' : taken >= 4 ? 'var(--red)' : 'var(--green-dark)'}">
            ${isFull ? 'Sin cupos' : `${5 - taken} lugar${5 - taken === 1 ? '' : 'es'}`}
          </div>
        `;
        btn.onclick = () => selectSlot(hora);
        grid.appendChild(btn);
      });

      container.innerHTML = '';
      container.appendChild(grid);
    }

    /* ── Handlers de selección ───────────────────────────── */
    function selectZona(el) {
      document.querySelectorAll('.zona-btn').forEach(b => b.classList.remove('selected'));
      el.classList.add('selected');
      state.zona = el.dataset.zona;
      updateSteps();
      updateSummary();
    }

    function selectDia(d) {
      state.diaDate = d;
      state.slot = null;
      renderWeek();
      renderSlots();
      updateSteps();
      updateSummary();
    }

    function selectSlot(hora) {
      state.slot = hora;
      renderSlots();
      updateSteps();
      updateSummary();
    }

    function changeWeek(dir) {
      state.weekOffset += dir;
      renderWeek();
      renderSlots();
    }

    /* ── Actualizar pasos visuales ───────────────────────── */
    function updateSteps() {
      const s1 = document.getElementById('step1');
      const s2 = document.getElementById('step2');
      const s3 = document.getElementById('step3');

      s1.className = 'step' + (state.zona ? ' done' : ' active');
      s2.className = 'step' + (!state.zona ? '' : state.slot ? ' done' : ' active');
      s3.className = 'step' + (state.slot ? ' active' : '');
    }

    /* ── Actualizar resumen ──────────────────────────────── */
    const ZONA_LABELS = {
      superior: 'Tren superior',
      medio:    'Tren medio',
      inferior: 'Tren inferior',
    };

    function updateSummary() {
      const nombre   = document.getElementById('inp-nombre').value.trim();
      const apellido = document.getElementById('inp-apellido').value.trim();
      const os       = document.getElementById('inp-os').value;

      setVal('sum-zona',   state.zona    ? ZONA_LABELS[state.zona] : null);
      setVal('sum-dia',    state.diaDate ? fmtDiaLargo(state.diaDate) : null);
      setVal('sum-hora',   state.slot    ? `${state.slot} – ${nextHour(state.slot)}` : null);
      setVal('sum-nombre', (nombre || apellido) ? `${nombre} ${apellido}`.trim() : null);
      setVal('sum-os',     os || null);

      // Habilitar botón si todo está completo
      const email = document.getElementById('inp-email').value.trim();
      const tel   = document.getElementById('inp-tel').value.trim();
      const ok = state.zona && state.diaDate && state.slot && nombre && apellido && email && tel && os;
      document.getElementById('btn-confirm').disabled = !ok;
    }

    function setVal(id, val) {
      const el = document.getElementById(id);
      if (val) {
        el.textContent = val;
        el.classList.remove('empty');
      } else {
        el.textContent = id === 'sum-zona'   ? 'Sin seleccionar' :
                         id === 'sum-dia'    ? 'Sin seleccionar' :
                         id === 'sum-hora'   ? 'Sin seleccionar' :
                         id === 'sum-nombre' ? 'Sin completar'   : 'Sin completar';
        el.classList.add('empty');
      }
    }

    function nextHour(hora) {
      const [h, m] = hora.split(':').map(Number);
      return `${String(h + 1).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }

    /* ── Confirmar turno ─────────────────────────────────── */
    function confirmarTurno() {
      // Registrar la ocupación
      const key = `${fmtDate(state.diaDate)}_${state.slot}`;
      ocupados[key] = (ocupados[key] || 0) + 1;

      // Toast
      const nombre = document.getElementById('inp-nombre').value.trim();
      showToast(`✓ Turno confirmado para ${nombre} el ${fmtDiaLargo(state.diaDate)} a las ${state.slot}`);

      // Reset
      setTimeout(() => {
        state.zona = null;
        state.diaDate = null;
        state.slot = null;
        document.querySelectorAll('.zona-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('inp-nombre').value   = '';
        document.getElementById('inp-apellido').value = '';
        document.getElementById('inp-tel').value      = '';
        document.getElementById('inp-email').value    = '';
        document.getElementById('inp-os').value       = '';
        renderWeek();
        renderSlots();
        updateSteps();
        updateSummary();
      }, 2800);
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3500);
    }

    /* ── Init ─────────────────────────────────────────────── */
    renderWeek();
    renderSlots();
    updateSteps();
    updateSummary();