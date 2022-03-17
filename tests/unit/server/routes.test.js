import { jest, expect, describe, it } from '@jest/globals'
import config from '../../../server/config.js'

const { pages } = config

describe('#Routes - test api response', () => {
  beforeEach(()=> {
    jest.restoreAllMocks(),
    jest.clearAllMocks()
  })

  it('GET / should redirect to home page', async () => {

  })
  
  it.todo(`GET /home should response with ${pages.homeHTML} file`)
  it.todo(`GET /controller should response with ${pages.controllerHTML} file`)
  it.todo(`GET /file.ext should response with file stream`)
  it.todo(`GET /unknown should inexistent route 404`)

  describe('exceptions', () => {
    it.todo('should respond with 404 in a inexistent file')
    it.todo('should given a error with 500')
  })
})