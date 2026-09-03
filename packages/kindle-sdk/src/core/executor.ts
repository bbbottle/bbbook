import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream, mkdirSync, unlinkSync } from 'node:fs'
import { dirname } from 'node:path'
import { Effect } from 'effect'
import { ConnectionLostError } from '../errors/kindle-errors.js'
import { shellQuote } from '../commands/utils.js'

export interface ExecResult {
  stdout: string
  stderr: string
  code: number
}

export interface SshClient {
  readonly binary: string
  readonly args: ReadonlyArray<string>
}

// Minimal shell-like argv splitter that supports single/double quotes and backslash escapes.
// It does NOT invoke a shell, so correctly splitting the string is enough to avoid injection.
const splitSshCommand = (cmd: string): ReadonlyArray<string> => {
  const tokens: string[] = []
  let current = ''
  let quote: "'" | '"' | null = null
  let escaped = false

  for (const ch of cmd) {
    if (escaped) {
      current += ch
      escaped = false
      continue
    }

    if (ch === '\\' && quote === null) {
      escaped = true
      continue
    }

    if (quote) {
      if (ch === quote) {
        quote = null
      } else {
        current += ch
      }
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (current.length > 0) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += ch
  }

  if (quote) {
    throw new Error(`Unterminated quote in ssh command: ${cmd}`)
  }
  if (escaped) {
    current += '\\'
  }
  if (current.length > 0) {
    tokens.push(current)
  }

  return tokens
}

// Allow only a small, safe subset of ssh options. In particular `-o` is rejected
// because it can be used to inject arbitrary commands (e.g. ProxyCommand/LocalCommand).
const allowedFlagOptions = new Set([
  '-4', '-6', '-A', '-a', '-C', '-f', '-G', '-g', '-K', '-k', '-M', '-N', '-n',
  '-q', '-s', '-T', '-t', '-V', '-v', '-X', '-x', '-Y', '-y',
])

const allowedValueOptions = new Set(['-p', '-i', '-l', '-F', '-D', '-L', '-R', '-S'])

const isSafeHost = (token: string) => /^[A-Za-z0-9_.\-@]+$/.test(token)

const parseSshCommand = (cmd: string): { readonly binary: string; readonly args: ReadonlyArray<string> } => {
  const tokens = splitSshCommand(cmd.trim())
  if (tokens.length === 0) {
    throw new Error('Empty ssh command')
  }

  const binary = tokens[0]
  if (binary !== 'ssh') {
    throw new Error(`Unexpected ssh binary: ${binary}. Only 'ssh' is allowed.`)
  }

  const args: string[] = []
  let hostSeen = false
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]

    if (hostSeen) {
      throw new Error(`ssh command contains extra arguments after host: ${token}`)
    }

    if (token.startsWith('-')) {
      if (allowedValueOptions.has(token)) {
        if (i + 1 >= tokens.length) {
          throw new Error(`ssh option ${token} is missing a value`)
        }
        args.push(token, tokens[i + 1])
        i += 1
      } else if (allowedFlagOptions.has(token)) {
        args.push(token)
      } else {
        throw new Error(`ssh option '${token}' is not allowed. Use an alias in ~/.ssh/config instead.`)
      }
    } else {
      if (!isSafeHost(token)) {
        throw new Error(`Invalid ssh host/alias: ${token}`)
      }
      hostSeen = true
      args.push(token)
    }
  }

  if (!hostSeen) {
    throw new Error('ssh command is missing a host')
  }

  return { binary, args }
}

const sshArgs = (client: SshClient, timeoutMs?: number) => {
  const connectTimeout = timeoutMs ? Math.max(1, Math.ceil(timeoutMs / 1000)) : undefined
  const extra: string[] = [
    '-oBatchMode=yes',
    '-oPasswordAuthentication=no',
    ...(connectTimeout ? [`-oConnectTimeout=${connectTimeout}`] : []),
  ]
  return [...extra, ...client.args]
}

const runProcess = (
  command: string,
  args: ReadonlyArray<string>,
  options: {
    readonly stdin?: NodeJS.ReadableStream
    readonly stdout?: NodeJS.WritableStream
    readonly signal?: AbortSignal
  } = {}
): Promise<ExecResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args as string[], { stdio: ['pipe', 'pipe', 'pipe'] })

    if (options.signal) {
      const onAbort = () => {
        child.kill('SIGTERM')
      }
      options.signal.addEventListener('abort', onAbort, { once: true })
      child.on('close', () => options.signal?.removeEventListener('abort', onAbort))
    }

    let stdout = ''
    let stderr = ''
    let stdoutFinished = !options.stdout

    child.stdout.on('data', (data: Buffer) => {
      if (options.stdout) {
        options.stdout.write(data as unknown as Uint8Array)
      } else {
        stdout += data.toString()
      }
    })

    if (options.stdout) {
      options.stdout.on('finish', () => {
        stdoutFinished = true
      })
      options.stdout.on('error', (err) => {
        child.kill('SIGTERM')
        reject(err)
      })
    }

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    if (options.stdin) {
      options.stdin.pipe(child.stdin)
      options.stdin.on('error', (err) => {
        child.kill('SIGTERM')
        reject(err)
      })
    } else {
      child.stdin.end()
    }

    child.on('error', (err) => reject(err))
    child.on('close', (code) => {
      const exitCode = code ?? 1
      if (!stdoutFinished) {
        options.stdout?.once('finish', () => {
          resolve({ stdout, stderr, code: exitCode })
        })
        options.stdout?.end()
        return
      }

      resolve({ stdout, stderr, code: exitCode })
    })
  })

export const connect = (cmd: string, timeoutMs?: number) =>
  Effect.tryPromise<SshClient, ConnectionLostError>({
    try: async () => {
      const parsed = parseSshCommand(cmd)
      const validation = await runProcess(parsed.binary, ['-G', ...sshArgs(parsed, timeoutMs)])
      if (validation.code !== 0) {
        throw new Error(validation.stderr.trim() || 'ssh -G failed')
      }
      return parsed
    },
    catch: (error) => new ConnectionLostError({ cause: error }),
  })

export const exec = (client: SshClient, command: string, timeoutMs?: number) =>
  Effect.tryPromise<ExecResult, ConnectionLostError>({
    try: (signal) => runProcess(client.binary, [...sshArgs(client, timeoutMs), command], { signal }),
    catch: (error) => new ConnectionLostError({ cause: error }),
  })

export const uploadFile = (client: SshClient, localPath: string, remotePath: string, timeoutMs?: number) =>
  Effect.tryPromise<void, ConnectionLostError>({
    try: (signal) => {
      const readStream = createReadStream(localPath)
      return runProcess(client.binary, [...sshArgs(client, timeoutMs), `cat > ${shellQuote(remotePath)}`], {
        stdin: readStream,
        signal,
      }).then((result) => {
        if (result.code !== 0) {
          throw new Error(result.stderr.trim() || `ssh exited with code ${result.code}`)
        }
        return undefined
      })
    },
    catch: (error) => new ConnectionLostError({ cause: error }),
  })

export const downloadFile = (client: SshClient, remotePath: string, localPath: string, timeoutMs?: number) =>
  Effect.tryPromise<void, ConnectionLostError>({
    try: (signal) => {
      mkdirSync(dirname(localPath), { recursive: true })
      const writeStream = createWriteStream(localPath)
      return runProcess(client.binary, [...sshArgs(client, timeoutMs), `cat ${shellQuote(remotePath)}`], {
        stdout: writeStream,
        signal,
      }).then((result) => {
        if (result.code !== 0) {
          try {
            unlinkSync(localPath)
          } catch {
            // ignore
          }
          throw new Error(result.stderr.trim() || `ssh exited with code ${result.code}`)
        }
        return undefined
      })
    },
    catch: (error) => new ConnectionLostError({ cause: error }),
  })

export const disconnect = (_client: SshClient) => Effect.void
