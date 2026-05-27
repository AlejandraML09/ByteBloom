import { useState, useMemo } from 'react'

export function PriceTab({ classes = [], priceValue, onPriceChange, onModifyPrice, currentPrice }) {
  const [modoModificacion, setModoModificacion] = useState('global') // 'global' | 'zona'
  const [zonaSeleccionada, setZonaSeleccionada] = useState('')

  // Extraer zonas únicas de las clases
const zonasUnicas = useMemo(() => {
  console.log("Datos brutos recibidos en el prop 'classes':", classes);
  
  const zonas = new Map()
  classes.forEach((c, index) => {
    // Imprime cada clase para ver si tienen IDs diferentes
    console.log(`Clase index ${index}: zona_id = ${c.zona_id}, nombre = ${c.zona_nombre}`);
    
    if (c.zona_id && !zonas.has(c.zona_id)) {
      zonas.set(c.zona_id, { id: c.zona_id, nombre: c.zona_nombre, precio: c.precio })
    }
  })
  
  const resultado = Array.from(zonas.values());
  console.log("Zonas únicas procesadas para el selector:", resultado);
  return resultado;
}, [classes])

  // Filtrar clases según la zona seleccionada de forma segura
  const clasesFiltradas = useMemo(() => {
    if (modoModificacion === 'global') {
      return classes
    }
    if (modoModificacion === 'zona' && zonaSeleccionada) {
      return classes.filter((c) => c.zona_id === Number(zonaSeleccionada))
    }
    // Si es modo zona pero no hay zona seleccionada, mostramos vacío
    return []
  }, [modoModificacion, zonaSeleccionada, classes])

  // Obtener precio actual según el modo
  const precioActualMostrado =
    modoModificacion === 'global'
      ? currentPrice
      : zonaSeleccionada
        ? zonasUnicas.find((z) => z.id === Number(zonaSeleccionada))?.precio ?? 0
        : 0

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Modificar precio de clases</h3>
          <p>Modifica precios de forma global (todas las zonas) o por zona específica.</p>
        </div>
      </div>

      <div className='card-body' style={{ padding: '1.5rem' }}>
        {/* Selector de modo */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, marginRight: '1rem' }}>
            Modo de modificación:
          </label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type='radio'
                value='global'
                checked={modoModificacion === 'global'}
                onChange={(e) => {
                  setModoModificacion(e.target.value)
                  setZonaSeleccionada('')
                }}
              />
              Todas las zonas
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type='radio'
                value='zona'
                checked={modoModificacion === 'zona'}
                onChange={(e) => setModoModificacion(e.target.value)}
              />
              Por zona específica
            </label>
          </div>
        </div>

        {/* Selector de zona (solo si modo = 'zona') */}
        {modoModificacion === 'zona' && zonasUnicas.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', fontWeight: 500 }}>
              Selecciona la zona:
            </label>
            <select
              value={zonaSeleccionada}
              onChange={(e) => setZonaSeleccionada(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #EAE4F2',
                fontSize: '14px',
              }}
            >
              <option value=''>-- Seleccionar zona --</option>
              {zonasUnicas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre} (${zona.precio})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Input de nuevo precio */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: '1 1 220px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Precio actual:{' '}
              <strong>${precioActualMostrado ?? 0}</strong>
            </label>
            <input
              type='number'
              value={priceValue}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder='Ej: 25000'
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #EAE4F2',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className='btn-action'
              onClick={() =>
                onModifyPrice(
                  modoModificacion === 'zona' ? Number(zonaSeleccionada) : null
                )
              }
              style={{ minWidth: '180px' }}
              disabled={
                   !priceValue || Number(priceValue) <= 0 || clasesFiltradas.length === 0 || (modoModificacion === 'zona' && !zonaSeleccionada)
              }
            >
              Modificar precio
            </button>
          </div>
        </div>

        {/* Tabla de clases */}
        <div>
          <div
            style={{ marginBottom: '0.75rem', fontSize: '13px', color: '#6B5D8C', fontWeight: 500 }}
          >
            Próximas clases sin inscriptos
            {modoModificacion === 'zona' && zonaSeleccionada 
              ? ` - Zona: ${zonasUnicas.find((z) => z.id === Number(zonaSeleccionada))?.nombre}` 
              : ''}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Zona</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Horario</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Precio actual</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Cupo máx</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Inscriptos</th>
              </tr>
            </thead>
            <tbody>
              {clasesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan='6'
                    style={{ textAlign: 'center', padding: '1.5rem', color: '#7A6F9B' }}
                  >
                    {modoModificacion === 'zona' && !zonaSeleccionada
                      ? 'Selecciona una zona para ver sus clases.'
                      : 'No hay clases disponibles.'}
                  </td>
                </tr>
              ) : (
                clasesFiltradas.map((clase) => (
                  <tr key={clase.id} style={{ borderBottom: '1px solid #EAE4F2' }}>
                    <td style={{ padding: '10px 12px' }}>{clase.zona_nombre ?? clase.zona}</td>
                    <td style={{ padding: '10px 12px' }}>{clase.fecha}</td>
                    <td style={{ padding: '10px 12px' }}>{clase.hora}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#4a4a4a' }}>
                      ${clase.precio ?? 0}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{clase.cupo_maximo}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {clase.cupo_maximo - clase.cupo_disponible}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}