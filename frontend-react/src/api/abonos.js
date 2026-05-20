import client from './client'

export async function getMisAbonos(usuarioId) {
  const { data } = await client.get('/abonos/mis-abonos', { params: { usuario_id: usuarioId } })
  return data
}

export async function getSesionesAbono(abonoId) {
  const { data } = await client.get(`/abonos/${abonoId}/sesiones`)
  return data
}

export async function renovarAbono(abonoId, medioPago = 'Efectivo') {
  const { data } = await client.post(`/abonos/${abonoId}/renovar`, null, {
    params: { medio_pago: medioPago },
  })
  return data
}

export async function modificarSesionAbono(abonoId, reservaIdQuitar, nuevaFecha, nuevaHora) {
  const { data } = await client.post(`/abonos/${abonoId}/modificar`, {
    reserva_id_quitar: reservaIdQuitar,
    nueva_fecha: nuevaFecha,
    nueva_hora: nuevaHora,
  })
  return data
}
