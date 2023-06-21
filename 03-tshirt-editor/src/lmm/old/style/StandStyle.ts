import { BasicStyle } from './BasicStyle'

class StandStyle extends BasicStyle {
	strokeStyle: string | CanvasGradient | CanvasPattern | undefined
	fillStyle: string | CanvasGradient | CanvasPattern | undefined
	lineWidth: number = 1
	lineDash: number[] | undefined
	lineDashOffset: number = 0
	lineCap: CanvasLineCap = 'butt'
	lineJoin: CanvasLineJoin = 'miter'
	miterLimit: number = 10

	// 填充和描边的顺序，默认先描边再填充
	order: ['stroke', 'fill'] | ['fill', 'stroke'] = ['stroke', 'fill']

	apply(ctx: CanvasRenderingContext2D) {
		super.apply(ctx)
		const {
			fillStyle,
			strokeStyle,
			lineWidth,
			lineCap,
			lineJoin,
			miterLimit,
			lineDash,
			lineDashOffset,
		} = this

		if (strokeStyle) {
			ctx.strokeStyle = strokeStyle
			ctx.lineWidth = lineWidth
			ctx.lineCap = lineCap
			ctx.lineJoin = lineJoin
			ctx.miterLimit = miterLimit
			if (lineDash) {
				ctx.setLineDash(lineDash)
				ctx.lineDashOffset = lineDashOffset
			}
		}
		fillStyle && (ctx.fillStyle = fillStyle)
	}
}
export { StandStyle }
