export function ProfCard({ profesional }) {
  const { initials, name, title, tags, bio, stars, reviews } = profesional

  return (
    <div className="prof-card" key={initials}>
      <div className="prof-photo-placeholder">
        <div className="prof-initials">{initials}</div>
      </div>
      <div className="prof-body">
        <div className="prof-name">{name}</div>
        <div className="prof-title">{title}</div>
        <div className="prof-tags">
          {tags.map(t => <span className="prof-tag" key={t}>{t}</span>)}
        </div>
        <p className="prof-bio">{bio}</p>
        <div className="reviews-title">
          <span className="stars">{stars}</span> Reseñas de pacientes
        </div>
        {reviews.map((r, i) => (
          <div className="review-item" key={i}>
            <div className="review-text">{r.text}</div>
            <div className="review-author">{r.author}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
