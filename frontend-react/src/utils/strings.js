/** Returns the initials (up to 2) from a full name string */
export function initials(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}
