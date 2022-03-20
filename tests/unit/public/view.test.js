import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import { JSDOM } from 'jsdom'
import View from '../../../public/controller/js/view'

describe('#View - test suite for presentation layer', () => {
  const dom = new JSDOM()
  global.document = dom.window.document
  global.window = dom.window

  function makeBtnElement({text, classList} = {
    text: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }) {
    return {
      onclick: jest.fn(),
      classList,
      innerText: text
    }
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  it('#changeCommandBtnsVisibility - should add unassigned class with hidden=true param and reset onclick', () => {
    const view = new View()
    const btn = makeBtnElement()
    jest.spyOn(
      document,
      "querySelectorAll"
    ).mockReturnValue([btn])

    view.changeCommandBtnsVisibility()

    expect(btn.classList.add).toHaveBeenCalledWith('unassigned')
    expect(btn.onclick.name).toStrictEqual('onClickReset')
    expect(() => btn.onclick()).not.toThrow()
  })


  it('#changeCommandBtnsVisibility - should remove unassigned class with hidden=true param and reset onclick', () => {
    const view = new View()
    const btn = makeBtnElement()
    jest.spyOn(
      document,
      "querySelectorAll"
    ).mockReturnValue([btn])

    view.changeCommandBtnsVisibility(false)

    expect(btn.classList.add).not.toHaveBeenCalled()
    expect(btn.classList.remove).toHaveBeenCalledWith('unassigned')
    expect(btn.onclick.name).toStrictEqual('onClickReset')
    expect(() => btn.onclick()).not.toThrow()
  })
  
  it('#onLoad', () => {
    const view = new View()
    jest.spyOn(
      view,
      view.changeCommandBtnsVisibility.name
    ).mockReturnValue()

    view.onLoad()

    expect(view.changeCommandBtnsVisibility).toHaveBeenCalled()
  })
})