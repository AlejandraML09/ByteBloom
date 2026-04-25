const ZONE_TABS = [
  { id: 'superior', label: 'Tren superior' },
  { id: 'medio',    label: 'Tren medio' },
  { id: 'inferior', label: 'Tren inferior' },
]

export function ZoneNav({ activeZone, onSelect }) {
  return (
    <div className="zones-nav">
      {ZONE_TABS.map(({ id, label }) => (
        <button
          key={id}
          className={`zone-tab${activeZone === id ? ' active' : ''}`}
          onClick={() => onSelect(id)}
        >
          <div className="zone-dot" /> {label}
        </button>
      ))}
    </div>
  )
}
