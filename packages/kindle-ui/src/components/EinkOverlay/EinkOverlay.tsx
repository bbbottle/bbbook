import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react'
import { cn } from '../../utils/cn.js'

export interface EinkOverlayHandle {
  refresh: () => void
}

export interface EinkOverlayProps {
  children?: ReactNode
  className?: string
  paused?: boolean
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform float u_time;
uniform float u_flash;
varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = v_uv;

  // Resolution-independent, low-frequency paper grain. Keep amplitude tiny
  // so the e-ink texture is almost invisible and never creates moiré.
  float n1 = noise(uv * 40.0 + vec2(12.34, 56.78));
  float n2 = noise(uv * 80.0 - vec2(34.12, 9.87)) * 0.5;
  float grain = (n1 * 0.667 + n2 * 0.333) * 0.05;

  // Very faint, irregular vertical banding.
  float band = (sin(uv.y * 24.0 + uv.x * 3.0 + noise(uv * 6.0) * 2.0) * 0.5 + 0.5) * 0.012;

  float overlay = grain + band;

  vec2 cc = uv - 0.5;
  float dist = dot(cc, cc);
  float vig = smoothstep(0.9, 0.25, dist);
  overlay *= mix(1.0, 0.0, vig * 0.3);

  // Refresh flash: e-ink has no backlight, so flash darkens rather than brightens.
  float alpha = mix(overlay, 0.85, u_flash);

  gl_FragColor = vec4(vec3(0.0), alpha);
}
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // eslint-disable-next-line no-console
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // eslint-disable-next-line no-console
    console.error('Program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

export const EinkOverlay = forwardRef<EinkOverlayHandle, EinkOverlayProps>(
  function EinkOverlay({ children, className, paused = false }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<WebGLProgram | null>(null)
    const positionBufferRef = useRef<WebGLBuffer | null>(null)
    const flashRef = useRef(0)
    const rafRef = useRef<number>(0)

    const flash = useCallback(() => {
      flashRef.current = 1
    }, [])

    useImperativeHandle(ref, () => ({ refresh: flash }), [flash])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const gl =
        (canvas.getContext('webgl', {
          premultipliedAlpha: true,
          alpha: true,
          antialias: false,
        }) as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
      if (!gl) return
      glRef.current = gl

      const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
      if (!program) return
      programRef.current = program
      gl.useProgram(program)

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      )
      positionBufferRef.current = buffer

      const positionLocation = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      return () => {
        cancelAnimationFrame(rafRef.current)
        if (buffer) gl.deleteBuffer(buffer)
        if (program) gl.deleteProgram(program)
        glRef.current = null
      }
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      const gl = glRef.current
      const program = programRef.current
      if (!canvas || !gl || !program) return

      const uTime = gl.getUniformLocation(program, 'u_time')
      const uFlash = gl.getUniformLocation(program, 'u_flash')
      const uResolution = gl.getUniformLocation(program, 'u_resolution')
      const startTime = performance.now()

      const render = () => {
        const time = (performance.now() - startTime) / 1000
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
        const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
        }

        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.uniform1f(uTime, time)
        gl.uniform2f(uResolution, canvas.width, canvas.height)

        if (!paused) {
          flashRef.current = Math.max(0, flashRef.current - 0.03)
        }
        gl.uniform1f(uFlash, flashRef.current)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
        rafRef.current = requestAnimationFrame(render)
      }

      rafRef.current = requestAnimationFrame(render)
      return () => cancelAnimationFrame(rafRef.current)
    }, [paused])

    return (
      <div className={cn('pointer-events-none relative h-full w-full', className)}>
        <div
          className="pointer-events-auto ku-scrollbar-hide h-full w-full overflow-auto"
          style={{ filter: 'grayscale(100%) contrast(1.08)' }}
        >
          {children}
        </div>
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-40 h-full w-full"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    )
  }
)
