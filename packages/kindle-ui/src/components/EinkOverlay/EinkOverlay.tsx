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
uniform float u_flash;
uniform vec2 u_resolution;
varying vec2 v_uv;

float hash(vec2 p) {
  // Stable hash for any input size; the initial fract avoids precision issues
  // when p comes from large screen-pixel coordinates.
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}

float hash2(vec2 p) {
  return hash(p + vec2(12.9898, 78.233));
}

void main() {
  vec2 uv = v_uv;

  // Ultra-fine, per-pixel paper grain. Amplitude is kept tiny so the texture
  // is present but never competes with the content on top of it.
  float grain = (hash(uv * u_resolution) - 0.5) * 0.008;

  // An extremely faint, non-periodic vertical drift instead of hard scanlines.
  // It is derived from 1D hash samples along y, so no visible wave bands form.
  float y = uv.y * u_resolution.y;
  float scanNoise = mix(hash2(vec2(0.0, floor(y * 0.05))),
                        hash2(vec2(0.0, floor(y * 0.05) + 1.0)),
                        fract(y * 0.05));
  float scan = (scanNoise - 0.5) * 0.002;

  // Vignette only modulates the texture term; the uniform screen tone stays flat.
  vec2 cc = uv - 0.5;
  float dist = dot(cc, cc);
  float vig = smoothstep(0.9, 0.25, dist);

  // Base tone chosen so that, with alpha = 0.5 over white, the final composited
  // color is #8D8F8D (0.5537). The grain/scan terms are zero-mean, so they only
  // add an imperceptible variance around that target tone.
  // 0.5537 = 0.5 + 0.5 * base  =>  base = 0.1074
  float overlay = 0.1074 + (grain + scan) * mix(1.0, 0.0, vig * 0.3);

  // Refresh flash: no backlight, so the screen briefly darkens instead of brightening.
  float alpha = (1.0 - u_flash) * 0.5 + u_flash;
  vec3 color = mix(vec3(overlay), vec3(0.0), u_flash);

  gl_FragColor = vec4(color * alpha, alpha);
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

      // Standard alpha blending. The canvas draws a semi-transparent darkening
      // overlay over the HTML content, with premultipliedAlpha for correct compositing.
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

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

      const uFlash = gl.getUniformLocation(program, 'u_flash')
      const uResolution = gl.getUniformLocation(program, 'u_resolution')

      const render = () => {
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

        if (uResolution) gl.uniform2f(uResolution, canvas.width, canvas.height)

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
