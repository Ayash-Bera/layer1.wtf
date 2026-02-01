declare module 'sparklines' {
  interface SparklineOptions {
    width?: number
    height?: number
    lineColor?: string
    lineWidth?: number
    startColor?: string
    endColor?: string
    maxColor?: string
    minColor?: string
    minValue?: number
    maxValue?: number
    minMaxValue?: number
    maxMinValue?: number
    dotRadius?: number
    tooltip?: ((value: number, index: number, points: number[]) => string) | null
    fillBelow?: boolean
    fillLighten?: number
    startLine?: boolean | object
    endLine?: boolean | object
    minLine?: boolean | object
    maxLine?: boolean | object
    bottomLine?: boolean | object
    topLine?: boolean | object
    averageLine?: boolean | object
  }

  interface Sparkline {
    draw(points: number[]): void
  }

  const Sparkline: {
    new (element: HTMLElement, options?: SparklineOptions): Sparkline
    init(element: HTMLElement, options?: SparklineOptions): Sparkline
    draw(element: HTMLElement, points: number[], options?: SparklineOptions): Sparkline
    options: SparklineOptions
  }

  export default Sparkline
}
