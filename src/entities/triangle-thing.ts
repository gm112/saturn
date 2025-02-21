import { webgl_renderer } from '../engine/webgl-renderer.js'

export class triangle_thing {
  #verticies = new Float32Array([
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
  #vertex_buffer

  #shader_program

  rotation_angle = 0
  rotation_location
  rotation_matrix
  position_location
  color_location

  render(renderer: webgl_renderer, delta_time: number) {
    const gl = renderer.context
    this.rotation_angle += 0.1 * delta_time

    this.rotation_matrix = new Float32Array([
      Math.cos(this.rotation_angle),
      -Math.sin(this.rotation_angle),
      0,
      0,
      Math.sin(this.rotation_angle),
      Math.cos(this.rotation_angle),
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

    gl.uniformMatrix4fv(this.rotation_location, false, this.rotation_matrix)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  constructor(renderer: webgl_renderer) {
    const gl = renderer.context
    renderer.compile_shader(
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
    renderer.compile_shader(
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
    this.#shader_program = renderer.use_shader(['vertex_shader', 'fragment_shader'])
    // Create a buffer for the vertices
    this.#vertex_buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#vertex_buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.#verticies, gl.STATIC_DRAW)

    // Get attribute locations
    this.position_location = gl.getAttribLocation(this.#shader_program, 'a_position')
    this.color_location = gl.getAttribLocation(this.#shader_program, 'a_color')

    // Enable the position attribute
    gl.vertexAttribPointer(this.position_location, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)
    gl.enableVertexAttribArray(this.position_location)

    // Enable the color attribute
    gl.vertexAttribPointer(
      this.color_location,
      3,
      gl.FLOAT,
      false,
      6 * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT
    )
    gl.enableVertexAttribArray(this.color_location)

    // Rotation matrix uniform
    this.rotation_location = gl.getUniformLocation(this.#shader_program, 'u_rotation')

    this.rotation_matrix = new Float32Array([
      Math.cos(this.rotation_angle),
      -Math.sin(this.rotation_angle),
      0,
      0,
      Math.sin(this.rotation_angle),
      Math.cos(this.rotation_angle),
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
