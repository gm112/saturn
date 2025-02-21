export class webgl_renderer {
  #canvas: HTMLCanvasElement
  #context: WebGL2RenderingContext
  get context() {
    return this.#context
  }

  #shaders: Record<string, WebGLShader> = {}

  #compile_shader(source: string, type: GLenum) {
    const gl = this.#context
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile failed:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  #use_shader(shaders: WebGLShader[] = []) {
    const gl = this.#context
    // Create shader program
    const shader_program = gl.createProgram()!
    for (const shader of shaders) gl.attachShader(shader_program, shader)

    gl.linkProgram(shader_program)
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(shader_program))
    }
    gl.useProgram(shader_program)

    return shader_program
  }

  compile_shader(name: string, source: string, type: GLenum) {
    this.#shaders[name] = this.#compile_shader(source, type)!
  }

  use_shader(names: (string & {})[] = []) {
    const shaders = names.map((name) => this.#shaders[name]).filter((shader) => !!shader) as WebGLShader[]

    return this.#use_shader(shaders)
  }

  // eslint-disable-next-line no-unused-vars
  start_frame() {
    const gl = this.#context
    //resize canvas to display size

    gl.viewport(0, 0, this.#canvas.width, this.#canvas.height)

    gl.clearColor(0, 0, 255, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  constructor() {
    this.#canvas = document.getElementById('game') as HTMLCanvasElement
    this.#context = this.#canvas!.getContext('webgl2')!
    this.#canvas.height = 480
    this.#canvas.width = 640

    if (!this.#context) throw new Error('Unable to initialize WebGL Context!')
  }
}
