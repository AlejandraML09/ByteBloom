export function StepIndicator({ zona, shifts, medioPago }) {
  const step1 = zona ? 'done' : 'active'
  const step2 = !zona ? '' : shifts.length > 0 ? 'done' : 'active'
  const step3 = shifts.length === 0 ? '' : medioPago ? 'done' : 'active'

  return (
    <div className="steps">
      <div className={`step ${step1}`}>
        <div className="step-num">1</div>
        <span>Zona</span>
      </div>
      <div className="step-sep" />
      <div className={`step ${step2}`}>
        <div className="step-num">2</div>
        <span>Día y horario</span>
      </div>
      <div className="step-sep" />
      <div className={`step ${step3}`}>
        <div className="step-num">3</div>
        <span>Medios de pago</span>
      </div>
    </div>
  )
}
