declare module 'glslCanvas' {
  export default class GlslCanvas {
    constructor(canvas: HTMLCanvasElement)
    load(fragSource: string): void
    setUniform(name: string, ...values: (number | string)[]): void
  }
}
