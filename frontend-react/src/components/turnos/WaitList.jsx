import { useState, useEffect, useCallback } from 'react'
import { getMiListaEspera, unirseListaEspera, salirListaEspera } from '../../api/turnos'
import { fmtDiaLargo } from '../../utils/dates'
import { ZONA_LABELS } from '../../constants/turnos'

const getStoredUsuarioId = () => {
  const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  const usuario = stored ? JSON.parse(stored) : null
  return usuario?.id ?? null
}

export function useWaitlist(showToast = () => {}) {
  const [waitlistClaseIds, setWaitlistClaseIds] = useState(new Set())

  const refreshWaitlistIds = useCallback(async () => {
    const usuarioId = getStoredUsuarioId()
    if (!usuarioId) return

    try {
      const lista = await getMiListaEspera(usuarioId)
      setWaitlistClaseIds(new Set(lista.map((e) => e.clase_programada_id)))
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    refreshWaitlistIds()
  }, [refreshWaitlistIds])

  const handleWaitlistToggle = useCallback(
    async (clase) => {
      const usuarioId = getStoredUsuarioId()
      if (!usuarioId) {
        showToast('Tenés que iniciar sesión para usar la lista de espera.')
        return
      }

      const zonaNombre = ZONA_LABELS[clase.zona_nombre] ?? clase.zona_nombre
      const fechaDisplay = fmtDiaLargo(new Date(clase.fecha + 'T00:00:00'))
      const inWaitlist = waitlistClaseIds.has(clase.id)

      try {
        if (inWaitlist) {
          await salirListaEspera({ claseProgramadaId: clase.id, usuarioId })
          setWaitlistClaseIds((prev) => {
            const next = new Set(prev)
            next.delete(clase.id)
            return next
          })
          showToast(
            `Fuiste dado de baja de la lista de espera para la clase de ${zonaNombre} el ${fechaDisplay} a las ${clase.hora}.`
          )
        } else {
          await unirseListaEspera({ claseProgramadaId: clase.id, usuarioId })
          setWaitlistClaseIds((prev) => new Set([...prev, clase.id]))
          showToast(
            `Fuiste anotado a la lista de espera para la clase de ${zonaNombre} el ${fechaDisplay} a las ${clase.hora}. Recibirás una notificación si se libera el turno.`
          )
        }
      } catch (err) {
        showToast(err?.response?.data?.detail || 'No se pudo actualizar la lista de espera.')
      }
    },
    [showToast, waitlistClaseIds]
  )

  return { waitlistClaseIds, handleWaitlistToggle }
}

export function WaitlistToggle({ clase, inWaitlist, onToggle }) {
  return (
    <div className='waitlist-overlay'>
      <button
        className={`waitlist-btn${inWaitlist ? ' waitlist-btn--leave' : ' waitlist-btn--join'}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(clase)
        }}
      >
        {inWaitlist ? 'Salir de la lista de espera' : 'Anotarse a la lista de espera'}
      </button>
    </div>
  )
}
