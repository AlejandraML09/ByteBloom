import { Link } from 'react-router-dom'

export function CtaSection({ title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="cta-section">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <Link to={linkTo} className="btn-cta">{linkLabel}</Link>
    </div>
  )
}
