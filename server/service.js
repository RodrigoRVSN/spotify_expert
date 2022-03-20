import path, {join, extname} from 'path'
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

const { 
  dir: { publicDirectory, fxDirectory }, 
  constants: { fallbackBitRate, englishConversation, bitRateDivisor, audioMediaType, songVolume, fxVolume }
} = config

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

    return streamPromises.pipeline(
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

  async readFxByName(fxName) {
    const songs = await fsPromises.readdir(fxDirectory)
    const chosenSong = songs.find(filename => filename.toLowerCase().includes(fxName))
    if(!chosenSong) return Promise.reject(`🚧 the song ${fxName} wasn't found!`)
    return path.join(fxDirectory, chosenSong)
  }

  appendFxStream(fx) {
    const throttleTransformable = new Throttle(this.currentBitRate)
    streamPromises.pipeline(
      throttleTransformable,
      this.broadCast()
    )

    const unpipe = () => {
      const transformStream = this.mergeAudioStreams(fx, this.currentReadable)
      this.throttleTransform = throttleTransformable
      this.currentReadable = transformStream
      this.currentReadable.removeListener('unpipe', unpipe)

      streamPromises.pipeline(
        transformStream,
        throttleTransformable
      )
    }

    this.throttleTransform.on('unpipe', unpipe)
    this.throttleTransform.pause()
    this.currentReadable.unpipe(this.throttleTransform)
  }

  mergeAudioStreams(song, readable) {
    const transformStream = PassThrough()
    const args = [
      '-t', audioMediaType,
      '-v', songVolume,
      '-m', '-',
      '-t', audioMediaType,
      '-v', fxVolume,
      song,
      '-t', audioMediaType,
      '-'
    ]

    const { stdout, stdin } = this._executeSoxCommand(args)

    streamPromises.pipeline(
      readable, 
      stdin
    )

    streamPromises.pipeline(
      stdout, 
      transformStream
    )
    
    return transformStream
  }
}