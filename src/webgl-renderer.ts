export class WebGLRenderer {
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

  compileShader(name: string, source: string, type: GLenum) {
    this.#shaders[name] = this.#compile_shader(source, type)!
  }

  useShader(names: (string & {})[] = []) {
    const shaders = names.map((name) => this.#shaders[name]).filter((shader) => !!shader)

    return this.#use_shader(shaders)
  }

  // eslint-disable-next-line no-unused-vars
  startFrame() {
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

export class TriangleThing {
  _verticies = new Float32Array([
    0.0,
    0.5,
    0.0,
    1.0,
    0.0,
    0.0, // Vertex 1: position + red color
    -0.5,
    -0.5,
    0.0,
    0.0,
    1.0,
    0.0, // Vertex 2: position + green color
    0.5,
    -0.5,
    0.0,
    0.0,
    0.0,
    1.0 // Vertex 3: position + blue color
  ])
  _vertexBuffer

  _shaderProgram

  rotationAngle = 0
  rotationLocation
  rotationMatrix
  positionLocation
  colorLocation

  render(renderer: WebGLRenderer, delta_time: number) {
    const gl = renderer.context
    gl.clear(gl.COLOR_BUFFER_BIT)

    this.rotationMatrix = new Float32Array([
      Math.cos(this.rotationAngle),
      -Math.sin(this.rotationAngle),
      0,
      0,
      Math.sin(this.rotationAngle),
      Math.cos(this.rotationAngle),
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ])

    gl.uniformMatrix4fv(this.rotationLocation, false, this.rotationMatrix)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
    this.rotationAngle += 1 * delta_time
  }

  constructor(renderer: WebGLRenderer) {
    const gl = renderer.context
    renderer.compileShader(
      'vertex_shader',
      `
    attribute vec4 a_position;
    attribute vec4 a_color;
    uniform mat4 u_rotation;
    varying vec4 v_color;

    void main() {
      gl_Position = u_rotation * a_position;
      v_color = a_color;
    }`,
      gl.VERTEX_SHADER
    )
    renderer.compileShader(
      'fragment_shader',
      `
    precision mediump float;
    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
  `,
      gl.FRAGMENT_SHADER
    )
    this._shaderProgram = renderer.useShader(['vertex_shader', 'fragment_shader'])
    // Create a buffer for the vertices
    this._vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this._verticies, gl.STATIC_DRAW)

    // Get attribute locations
    this.positionLocation = gl.getAttribLocation(this._shaderProgram, 'a_position')
    this.colorLocation = gl.getAttribLocation(this._shaderProgram, 'a_color')

    // Enable the position attribute
    gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
    gl.enableVertexAttribArray(this.positionLocation)

    // Enable the color attribute
    gl.vertexAttribPointer(
      this.colorLocation,
      3,
      gl.FLOAT,
      false,
      6 * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT
    )
    gl.enableVertexAttribArray(this.colorLocation)

    // Rotation matrix uniform
    this.rotationLocation = gl.getUniformLocation(this._shaderProgram, 'u_rotation')

    this.rotationMatrix = new Float32Array([
      Math.cos(this.rotationAngle),
      -Math.sin(this.rotationAngle),
      0,
      0,
      Math.sin(this.rotationAngle),
      Math.cos(this.rotationAngle),
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ])
  }
}
