import { Client } from 'ssh2'
import { Effect } from 'effect'
import type { KindleConnectionOptions } from '../types/index.js'

export interface ExecResult {
  stdout: string
  stderr: string
  code: number
}

const createClient = (options: KindleConnectionOptions) =>
  Effect.promise<Client>((signal) => {
    return new Promise((resolve, reject) => {
      const client = new Client()

      const onReady = () => {
        cleanup()
        resolve(client)
      }

      const onError = (err: Error) => {
        cleanup()
        reject(err)
      }

      const cleanup = () => {
        client.removeListener('ready', onReady)
        client.removeListener('error', onError)
      }

      const onAbort = () => {
        cleanup()
        client.destroy()
        reject(new Error('Connection aborted'))
      }

      signal.addEventListener('abort', onAbort, { once: true })
      client.on('ready', onReady).on('error', onError).connect({
        host: options.host,
        port: options.port ?? 22,
        username: options.username,
        password: options.password,
        privateKey: options.privateKey,
        readyTimeout: options.connectionTimeout ?? 10000,
      })
    })
  })

export const connect = (options: KindleConnectionOptions) =>
  createClient(options).pipe(Effect.timeout(options.connectionTimeout ?? 10000))

export const exec = (client: Client, command: string) =>
  Effect.promise<ExecResult>((signal) => {
    return new Promise((resolve, reject) => {
      let stdout = ''
      let stderr = ''

      client.exec(command, (err, stream) => {
        if (err) {
          return reject(err)
        }

        const onAbort = () => {
          stream.close()
          reject(new Error('Command aborted'))
        }

        signal.addEventListener('abort', onAbort, { once: true })

        stream
          .on('data', (data: Buffer) => {
            stdout += data.toString()
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString()
          })
          .on('close', (code: number) => {
            resolve({ stdout, stderr, code })
          })
      })
    })
  })

export const uploadFile = (client: Client, localPath: string, remotePath: string) =>
  Effect.promise<void>((signal) => {
    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) {
          return reject(err)
        }

        const onAbort = () => {
          reject(new Error('Upload aborted'))
        }

        signal.addEventListener('abort', onAbort, { once: true })

        sftp.fastPut(localPath, remotePath, (err2) => {
          if (err2) {
            return reject(err2)
          }
          resolve(undefined)
        })
      })
    })
  })

export const disconnect = (client: Client) =>
  Effect.sync(() => {
    client.end()
  })
