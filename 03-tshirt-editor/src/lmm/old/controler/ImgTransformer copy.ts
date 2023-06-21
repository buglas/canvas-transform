import { Vector2 } from '../math/Vector2'
import { Img } from '../objects/Img'

/* PI*2 */
const pi2 = Math.PI * 2

/* 图像数据类型 */
type ImgData = {
	position: Vector2
	scale: Vector2
	rotate: number
	offset: Vector2
}

type Attr = {
	img?: Img
	orign?: Vector2
	mousePos?: Vector2
	mouseStart?: Vector2
	uniformRotateAng?: number
}

class ImgTransformer {
	img = new Img()
	// 暂存的变换信息
	position = new Vector2()
	scale = new Vector2(1, 1)
	rotate = 0
	offset = new Vector2()
	//变换基点
	orign = new Vector2()
	// 鼠标信息
	mousePos = new Vector2()
	mouseStart = new Vector2()
	originToMouseStart = new Vector2()
	// 旋转弧度
	uniformRotateAng = pi2 / 24

	constructor(attr: Attr = {}) {
		this.setOption(attr)
	}

	setOption(attr: Attr = {}) {
		Object.assign(this, attr)
		const { img, mouseStart, orign } = attr
		img && this.passImgDataTo()
		if (orign || mouseStart) {
			this.originToMouseStart.subVectors(
				mouseStart || this.mouseStart,
				orign || this.orign
			)
		}
	}
	updateOriginToMouseStart() {
		this.originToMouseStart.subVectors(this.mouseStart, this.orign)
	}

	copyImgData(obj: ImgData) {
		const { position, scale, rotate, offset } = obj
		const { img } = this
		img.position.copy(position)
		img.scale.copy(scale)
		img.rotate = rotate
		img.offset.copy(offset)
	}

	passImgDataTo(obj: ImgData = this) {
		const { position, scale, rotate, offset } = this.img
		console.log('passImgDataTo')
		console.log('position', position)
		console.log('offset', offset)

		obj.position.copy(position)
		obj.scale.copy(scale)
		obj.rotate = rotate
		obj.offset.copy(offset)
	}

	/* 双向缩放 */
	scale0() {
		const { img, scale, orign, originToMouseStart, mousePos } = this
		img.scale.copy(
			scale
				.clone()
				.multiply(mousePos.clone().sub(orign).divide(originToMouseStart))
		)
	}

	/* 双向等比缩放 */
	scale1() {
		console.log('scale1')

		const { img, scale, orign, originToMouseStart, mousePos } = this
		const s = mousePos.clone().sub(orign).divide(originToMouseStart)
		img.scale.copy(scale.clone().multiplyScalar((s.x + s.y) / 2))
	}

	/* 单向缩放 */
	scaleX0() {
		this.doScaleSigleDir('x')
	}
	scaleY0() {
		this.doScaleSigleDir('y')
	}
	doScaleSigleDir(dir: 'x' | 'y') {
		const { img, scale, orign, originToMouseStart, mousePos } = this
		// 将鼠标减去基点
		img.scale[dir] =
			scale[dir] * ((mousePos[dir] - orign[dir]) / originToMouseStart[dir])
	}

	/* 单向等比缩放 */
	scaleX1() {
		this.doUniformScaleSigleDir('x')
	}
	scaleY1() {
		this.doUniformScaleSigleDir('y')
	}
	doUniformScaleSigleDir(dir: 'x' | 'y') {
		const { img, scale, orign, originToMouseStart, mousePos } = this
		// 将鼠标减去基点
		img.scale.copy(
			scale
				.clone()
				.multiplyScalar((mousePos[dir] - orign[dir]) / originToMouseStart[dir])
		)
	}

	/* 旋转 */
	rotate0() {
		const { img, rotate, orign, originToMouseStart, mousePos } = this
		const { scale } = img
		img.rotate =
			rotate +
			mousePos.clone().sub(orign).multiply(scale).angle() -
			originToMouseStart.clone().multiply(scale).angle()
	}

	/* 等量旋转 */
	rotate1() {
		const {
			img,
			rotate,
			orign,
			originToMouseStart,
			mousePos,
			uniformRotateAng,
		} = this
		const ang = mousePos.clone().sub(orign).angle() - originToMouseStart.angle()
		img.rotate =
			rotate +
			Math.floor((ang + uniformRotateAng / 2) / uniformRotateAng) *
				uniformRotateAng
	}

	/* 位移 */
	// 自由位移
	move0() {
		const { img, position, mouseStart, mousePos } = this
		img.position.copy(
			position
				.clone()
				.add(
					mousePos
						.clone()
						.sub(mouseStart)
						.multiply(img.scale)
						.rotate(img.rotate)
				)
		)
	}
	// 正交位移-作业，留给同学们实现
	move1() {
		this.move0()
	}

	/* 将图案回退到变换之前的状态 */
	restoreImg() {
		const { img, position, rotate, scale, offset } = this
		img.position.copy(position)
		img.scale.copy(scale)
		img.offset.copy(offset)
		img.rotate = rotate
	}
}
export { ImgTransformer }
