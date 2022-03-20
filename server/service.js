import {join, extname} from 'path'
import fs from 'fs'
import fsPromises from 'fs/promises'
import streamPromises from 'stream/promises'
import { randomUUID } from 'crypto'
import {PassThrough, Writable} from 'stream'
import config from './config.js'
import Throttle from 'throttle'
import childProcess from 'child_process'
import {logger} from "./util.js";
import { once } from 'events'

const { dir: { publicDirectory }, constants: { fallbackBitRate, englishConversation, bitRateDivisor } } = config

export class Service {
  constructor() {
    this.clientStreams = new Map()
    this.currentSong = englishConversation
    this.currentBitRate = 0
    this.throttleTransform = {}
    this.currentReadable = {}
  }

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(id) {
    this.clientStreams.delete(id)
  }

  createFileStream(filename) {
    return fs.createReadStream(filename)
  }

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  async getBitRage(song) {
    try {
      const args = [
          '--i', // info
          '-B', // bitrate
          song
      ]

      const {
        stderr, // errors
        stdout, // logs
        // stdin // send data as string
      } = this._executeSoxCommand(args)

      await Promise.all([
        once(stderr, 'readable'),
        once(stdout, 'readable')
      ])

      const [success, error]  = [stdout, stderr].map(stream => stream.read())
      if(error) return await Promise.reject()

      return success.toString().trim().replace(/k/, '000')
    } catch(error) {
      logger.error(`Error with bitrate: ${error}`)
      return fallbackBitRate
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, enc, cb) => {
        for(const [id, stream] of this.clientStreams ){
          if(stream.writableEnded){
            this.clientStreams.delete(id)
            continue
          }
          stream.write(chunk)
        }
        cb()
      }
    })
  }

  async startStreamming() {
    logger.info(`Starting with ${this.currentSong}`)
    const bitRate = this.currentBitRate = (await this.getBitRage((this.currentSong)) / bitRateDivisor)
    const throttleTransform = this.throttleTransform = new Throttle(bitRate)
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong)

    streamPromises.pipeline(
        songReadable,
        throttleTransform,
        this.broadCast()
    )
  }

  stopStreamming() {
    this.throttleTransform?.end?.()
  }

  async getFileInfo(file){
    const fullFilePath = join(publicDirectory, file)
    await fsPromises.access(fullFilePath)
    const fileType = extname(fullFilePath)
    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream(file) {
    const {name, type} = await this.getFileInfo(file)

    return{
      stream: this.createFileStream(name),
      type
    }
  }
}