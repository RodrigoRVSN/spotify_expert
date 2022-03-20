export default class View {
  constructor() {
    this.btnStart = document.getElementById('start')
    this.btnStop = document.getElementById('stop')
    this.buttons = () => Array.from(document.querySelectorAll('button'))

    this.ignoreButtons = new Set(['unassigned'])
    async function onBtnClick () {}
    this.onBtnClick = onBtnClick
  }
  
  onLoad() {
    this.changeCommandBtnsVisibility()
    this.btnStart.onclick = this.onStartClicked.bind(this)
  }

  changeCommandBtnsVisibility(hide = 'true') {
    Array.from(document.querySelectorAll('[name=command]'))
    .forEach(btn => {
      const fn = hide ? 'add' : 'remove'
      btn.classList[fn]('unassigned')
      function onClickReset() {}
      btn.onclick = onClickReset
    })
  }
 
  configureOnBtnClick(fn) {
    this.onBtnClick = fn
  }

  async onStartClicked({ srcElement: { innerText }}) {
    const btnText = innerText
    await this.onBtnClick(btnText)
    this.toggleBtnStart()
    this.changeCommandBtnsVisibility(false)
    this.buttons()
      .filter(btn => this.notIsUnassaginedButton(btn))
      .forEach(this.setupBtnAction.bind(this))
  }

  setupBtnAction(btn) {
    console.log(btn)
    const text = btn.innerText.toLowerCase()
    if(text.includes('start')) return

    if(text.includes('stop')) {
      btn.onclick = this.onStopBtn.bind(this)
      return
    }
  }

  onStopBtn({
    srcElement: {
    innerText
  }}) {
    this.toggleBtnStart(false)
    this.changeCommandBtnsVisibility(true)

    return this.onBtnClick(innerText)
  }

  notIsUnassaginedButton(btn) {
    const classes = Array.from(btn.classList)
    return !(!!classes.find(item =>  this.ignoreButtons.has(item)))
  }

  toggleBtnStart(active = true) {
    if(active) {
      this.btnStart.classList.add('hidden')
      this.btnStop.classList.remove('hidden')
      return
    }

    this.btnStart.classList.remove('hidden')
    this.btnStop.classList.add('hidden')

  }
}