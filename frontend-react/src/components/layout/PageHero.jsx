export function PageHero({ badge, title, subtitle }) {
  return (
    <div className="page-hero">
      <div className="page-hero-badge">{badge}</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}
