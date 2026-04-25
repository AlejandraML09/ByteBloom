export function StepIndicator({ zona, slot }) {
  function step1Class() {
    return 'step' + (zona ? ' done' : ' active')
  }

  function step2Class() {
    return 'step' + (!zona ? '' : slot ? ' done' : ' active')
  }

  function step3Class() {
    return 'step' + (slot ? ' active' : '')
  }

  return (
    <div className="steps">
      <div className={step1Class()}>
        <div className="step-num">1</div>
        <span>Zona</span>
      </div>
      <div className="step-sep" />
      <div className={step2Class()}>
        <div className="step-num">2</div>
        <span>Día y horario</span>
      </div>
      <div className="step-sep" />
      <div className={step3Class()}>
        <div className="step-num">3</div>
        <span>Tus datos</span>
      </div>
    </div>
  )
}
