import { useState } from 'react'
import client from '../../api/client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function HorarioTab({
  classes,
  horarioInput,
  onInputChange,
  onModifyHorario,
  filterDate,
  onFilterChange,
}) {
  const filteredClasses = filterDate
    ? classes.filter((clase) => clase.fecha === filterDate)
    : classes

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Modificar horario de clase</h3>
          <p>Selecciona una clase y ajusta su horario de inicio.</p>
        </div>
        <div className='date-filter'>
          <input type='date' value={filterDate} onChange={(e) => onFilterChange(e.target.value)} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Zona</th>
              <th>Fecha</th>
              <th>Horario actual</th>
              <th>Nuevo inicio</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan='5' style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No hay clases disponibles.
                </td>
              </tr>
            ) : (
              filteredClasses.map((clase) => (
                <tr key={clase.id}>
                  <td>{clase.zona_nombre}</td>
                  <td>{clase.fecha}</td>
                  <td>{clase.hora}</td>
                  <td>
                    <select
                      className='cupo-input'
                      value={horarioInput[clase.id]?.inicio || ''}
                      onChange={(e) => onInputChange(clase.id, 'inicio', e.target.value)}
                      style={{
                        fontSize: '1.1rem',
                        padding: '0.6rem',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value=''>Selecciona horario</option>
                      {Array.from({ length: 23 }, (_, i) => {
                        const hora = Math.floor(i / 2) + 8
                        const minutos = i % 2 === 0 ? '00' : '30'
                        const horarioStr = `${String(hora).padStart(2, '0')}:${minutos}`
                        
                        if (hora > 19 || (hora === 19 && minutos === '30')) return null
                        
                        return (
                          <option key={horarioStr} value={horarioStr}>
                            {horarioStr}
                          </option>
                        )
                      }).filter(Boolean)}
                    </select>
                  </td>
                  <td>
                    <button className='btn-action' onClick={() => onModifyHorario(clase.id)}>
                      Modificar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}