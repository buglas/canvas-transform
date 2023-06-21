import { Matrix3 } from '../math/Matrix3'
import { Vector2 } from '../math/Vector2'
import { Img } from '../objects/Img'

/*  暂存Boolean 数据 */
let _bool: Boolean = false
/* 圆 */
const pi2 = Math.PI * 2

/* 鼠标和控制器状态的类型 */
type State = 'scale' | 'scaleX' | 'scaleY' | 'rotate' | 'move' | null

type Leve = 'moMatrix' | 'pvmoMatrix'

type Attr = {
	img?: Img
	level?: Leve
}

class Frame {
	_img = new Img()
	// 图像边框顶点集合
	vertives: number[] = []
	center = new Vector2()
	opposite = new Vector2()
	topOffsetMatrix = new Matrix3()
	level = 'pvmoMatrix'

	// 描边色
	strokeStyle = '#558ef0'
	// 填充色
	fillStyle = '#fff'

	constructor(attr: Attr = {}) {
		for (let [key, val] of Object.entries(attr)) {
			this[key] = val
		}
	}

	get img() {
		return this._img
	}
	set img(val) {
		this._img = val
		this.updateShape()
	}

	/* 更新图片角点 */
	updateShape() {
		const {
			vertives: fv,
			center,
			img,
			level,
			img: {
				size: { x: imgW, y: imgH },
			},
		} = this

		const vertices = [
			0,
			0,
			imgW / 2,
			0,
			imgW,
			0,
			imgW,
			imgH / 2,
			imgW,
			imgH,
			imgW / 2,
			imgH,
			0,
			imgH,
			0,
			imgH / 2,
		]

		/* 图像的世界偏移矩阵-实时更新 */
		const scene = img.getScene()
		if (!scene) {
			return
		}
		const { camera } = scene
		if (!camera) {
			return
		}
		this.topOffsetMatrix = img[level]
		for (let i = 0, len = vertices.length; i < len; i += 2) {
			const { x, y } = new Vector2(vertices[i], vertices[i + 1]).applyMatrix3(
				this.topOffsetMatrix
			)
			fv[i] = x
			fv[i + 1] = y
		}
		center.copy(new Vector2(fv[0], fv[1]).lerp(new Vector2(fv[8], fv[9]), 0.5))
	}

	/* 获取变换状态 */
	getTransformState(mp: Vector2): State {
		const scene = this.img.getScene()
		if (!scene) {
			return null
		}
		const { ctx } = scene
		const { vertives: fv, opposite } = this

		/* 对角线距离 */
		const diagonal = new Vector2(fv[0] - fv[8], fv[1] - fv[9]).length()

		/* 判断缩放的距离 */
		const scaleDist = Math.min(24, diagonal / 3)

		/* x,y缩放 */
		for (let i = 0, len = fv.length; i < len; i += 4) {
			if (new Vector2(fv[i], fv[i + 1]).sub(mp).length() < scaleDist) {
				const ind = (i + 8) % 16
				opposite.set(fv[ind], fv[ind + 1])
				return 'scale'
			}
		}

		/* y向缩放 */
		ctx.save()
		ctx.lineWidth = scaleDist
		ctx.beginPath()
		this.crtPath(ctx, [fv[0], fv[1], fv[4], fv[5]])
		_bool = ctx.isPointInStroke(mp.x, mp.y)
		ctx.restore()
		if (_bool) {
			opposite.set(fv[10], fv[11])
			return 'scaleY'
		}

		ctx.save()
		ctx.lineWidth = scaleDist
		ctx.beginPath()
		this.crtPath(ctx, [fv[8], fv[9], fv[12], fv[13]])
		_bool = ctx.isPointInStroke(mp.x, mp.y)
		ctx.restore()
		if (_bool) {
			opposite.set(fv[2], fv[3])
			return 'scaleY'
		}

		/* x向缩放 */
		ctx.save()
		ctx.lineWidth = scaleDist
		ctx.beginPath()
		this.crtPath(ctx, [fv[12], fv[13], fv[0], fv[1]])
		_bool = ctx.isPointInStroke(mp.x, mp.y)
		ctx.restore()
		if (_bool) {
			opposite.set(fv[6], fv[7])
			return 'scaleX'
		}

		ctx.save()
		ctx.lineWidth = scaleDist
		ctx.beginPath()
		this.crtPath(ctx, [fv[4], fv[5], fv[8], fv[9]])
		_bool = ctx.isPointInStroke(mp.x, mp.y)
		ctx.restore()
		if (_bool) {
			opposite.set(fv[14], fv[15])
			return 'scaleX'
		}

		/* 移动 */
		ctx.beginPath()
		this.crtPath(ctx, fv)
		if (ctx.isPointInPath(mp.x, mp.y)) {
			return 'move'
		}

		/* 旋转 */
		ctx.save()
		ctx.lineWidth = 80
		ctx.beginPath()
		this.crtPath(ctx, fv)
		ctx.closePath()
		_bool = ctx.isPointInStroke(mp.x, mp.y)
		ctx.restore()
		if (_bool) {
			return 'rotate'
		}

		/* 无状态 */
		return null
	}

	crtPath(ctx: CanvasRenderingContext2D, vertices: number[]) {
		const p0 = new Vector2(vertices[0], vertices[1])
		ctx.moveTo(p0.x, p0.y)
		for (let i = 2, len = vertices.length; i < len; i += 2) {
			const pn = new Vector2(vertices[i], vertices[i + 1])
			ctx.lineTo(pn.x, pn.y)
		}
	}

	crtPathByMatrix(
		ctx: CanvasRenderingContext2D,
		vertices: number[],
		matrix: Matrix3
	) {
		const p0 = new Vector2(vertices[0], vertices[1]).applyMatrix3(matrix)
		ctx.moveTo(p0.x, p0.y)
		for (let i = 2, len = vertices.length; i < len; i += 2) {
			const pn = new Vector2(vertices[i], vertices[i + 1]).applyMatrix3(matrix)
			ctx.lineTo(pn.x, pn.y)
		}
		ctx.closePath()
	}

	draw(ctx: CanvasRenderingContext2D) {
		this.updateShape()
		const {
			img,
			img: { size, worldScale },
			vertives: fv,
			center,
			topOffsetMatrix,
			strokeStyle,
			fillStyle,
		} = this

		/* 图像尺寸的一半 */
		const [halfWidth, halfheight] = [size.width / 2, size.height / 2]

		/* 绘图 */
		ctx.save()
		ctx.strokeStyle = strokeStyle
		ctx.fillStyle = fillStyle

		/* 矩形框 */
		ctx.beginPath()
		this.crtPath(ctx, [
			fv[0],
			fv[1],
			fv[4],
			fv[5],
			fv[8],
			fv[9],
			fv[12],
			fv[13],
		])
		ctx.closePath()
		ctx.stroke()

		/* 矩形节点 */
		// 节点尺寸
		const scene = img.getScene()
		const zoom = scene ? scene.camera.zoom : 1
		const pointSize = new Vector2(8, 8).divide(worldScale).multiplyScalar(zoom)
		const [w, h] = [pointSize.x / 2, pointSize.y / 2]
		// 绘制节点
		ctx.beginPath()
		for (let y = 0; y < 3; y++) {
			for (let x = 0; x < 3; x++) {
				if (y === 1 && x === 1) {
					continue
				}
				const [bx, by] = [halfWidth * x, halfheight * y]
				this.crtPathByMatrix(
					ctx,
					[bx - w, by - h, bx + w, by - h, bx + w, by + h, bx - w, by + h],
					topOffsetMatrix
				)
			}
		}
		ctx.fill()
		ctx.stroke()

		// 基点
		ctx.beginPath()
		ctx.arc(center.x, center.y, 5, 0, pi2)
		ctx.fill()
		ctx.stroke()
		ctx.restore()
	}
}
export { Frame }
