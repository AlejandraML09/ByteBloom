/**
 * Estrellas de solo lectura para un valor 0–5 (admite decimales: media estrella).
 * @param {{ value?: number, size?: number }} props
 */
export function RatingStars({ value = 0, size = 16 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0))
  return (
    <span className='rs-stars' style={{ fontSize: size }} aria-label={`${v} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i)) // 0, parcial o 1
        return (
          <span key={i} className='rs-star'>
            <span className='rs-star-bg'>★</span>
            <span className='rs-star-fg' style={{ width: `${fill * 100}%` }}>
              ★
            </span>
          </span>
        )
      })}
    </span>
  )
}
