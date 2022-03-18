import { jest, expect, describe, it } from '@jest/globals'
import config from '../../../server/config.js'
import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import TestUtil from '../_util/testUtil.js'

const { pages, location } = config

describe('#Routes - test api response', () => {
  beforeEach(()=> {
    jest.restoreAllMocks(),
    jest.clearAllMocks()
  })

  it('GET / should redirect to home page', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'
    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(302, { 'Location': location.home })
    expect(params.response.end).toHaveBeenCalled()
  })
  
  it(`GET /home should response with ${pages.homeHTML} file`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype, 
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({ 
      stream: mockFileStream, 
    })

    jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.homeHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  })

  it(`GET /controller should response with ${pages.controllerHTML} file`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype, 
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({ 
      stream: mockFileStream, 
    })

    jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(pages.controllerHTML)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  })

  // TODO
  it.todo(`GET /file.ext should response with file stream`)

  // TODO
  it(`GET /unknown should inexistent route 404`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/inexistentRoute'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    jest.spyOn(
      Controller.prototype, 
      Controller.prototype.getFileStream.name
    ).mockResolvedValue({ 
      stream: mockFileStream, 
    })

    jest.spyOn(
      mockFileStream,
      "pipe"
    ).mockReturnValue()

    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith('/inexistentRoute')
    expect(params.response.writeHead).toBeCalledWith(404, { 'Location': location.home })
  })

  describe('exceptions', () => {
    it.todo('should respond with 404 in a inexistent file')
    it.todo('should given a error with 500')
  })
})