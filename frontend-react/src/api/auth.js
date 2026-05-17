import client from './client'

export const registrarUsuario = async (datos) => {
  const response = await client.post('/registro/', {
    nombre: datos.nombre,
    apellido: datos.apellido,
    email: datos.email,
    fecha_nacimiento: datos.fechaNacimiento,
    password: datos.password,
  })
  return response.data
}

export const login = async (email, password) => {
  const response = await client.post('/login', { email, password })
  return response.data
}
