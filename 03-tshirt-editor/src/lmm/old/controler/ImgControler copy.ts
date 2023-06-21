import { Vector2 } from '../math/Vector2'
import { Object2D, Object2DType } from '../objects/Object2D'
import { Img } from '../objects/Img'
import { Matrix3 } from '../math/Matrix3'
import { Scene } from '../core/Scene'
import { ImgTransformer } from './ImgTransformer'
import { MouseShape } from './MouseShape'
import { Frame } from './Frame'

/* 参数类型 */
type Attr = Object2DType & {
	img?: Img | null
	imgTransformer?: ImgTransformer
	moveVertices?: number[]
	rotateVertices?: number[]
	scaleVertices?: number[]
}

/* 鼠标和控制器状态的类型 */
type State = 'scale' | 'scaleX' | 'scaleY' | 'rotate' | 'move' | null

/* 图案数据类型 */
type ImgData = {
	position: Vector2
	scale: Vector2
	rotate: number
	offset: Vector2
}
/* 变换之前的暂存数据类型 */
type TransformStage = {
	clipCenter: Vector2
	clipOpposite: Vector2
	pvmInvert: Matrix3
}

// change 事件
const _changeEvent = { type: 'change' }

class ImgControler extends Object2D {
	// 要控制的图片
	_img: Img | null = null
	// 控制状态
	_controlState: State = null
	// alt 键是否按下
	_altKey = false
	// shift 键是否按下
	shiftKey = false
	// 图案本地变换基点
	localOrign = new Vector2()
	// 鼠标状态
	mouseState: State = null
	// 鼠标的裁剪坐标位
	clipMousePos = new Vector2()
	// 鼠标本地坐标位
	localMousePos = new Vector2()

	// 选中图案时的暂存数据
	controlStage: ImgData = {
		position: new Vector2(),
		scale: new Vector2(1, 1),
		rotate: 0,
		offset: new Vector2(),
	}

	// 变换前的暂存数据
	transformStage: TransformStage = {
		clipCenter: new Vector2(),
		clipOpposite: new Vector2(),
		pvmInvert: new Matrix3(),
	}
	// 图案变换器
	imgTransformer = new ImgTransformer({
		mousePos: this.localMousePos,
		orign: this.localOrign,
	})
	// 图案外框
	frame = new Frame()
	// 鼠标图案
	mouseShape = new MouseShape({
		vertives: this.frame.vertives,
		center: this.frame.center,
		mousePos: this.clipMousePos,
	})
	// 不受相机影响
	enableCamera = false

	constructor(attr: Attr = {}) {
		super()
		for (let [key, val] of Object.entries(attr)) {
			this[key] = val
		}
	}

	get img() {
		return this._img
	}
	set img(val) {
		if (this._img === val) {
			return
		}
		this._img = val
		if (val) {
			this.imgTransformer.setOption({ img: val })
			this.imgTransformer.passImgDataTo(this.controlStage)
			this.frame.img = val
		} else {
			this.mouseState = null
			this.controlState = null
		}
		this.dispatchEvent(_changeEvent)
	}

	get controlState() {
		return this._controlState
	}
	set controlState(val) {
		if (this._controlState === val) {
			return
		}
		this._controlState = val
		const { img } = this
		if (!val || !img) {
			return
		}
		// 暂存变换数据
		this.saveTransformData(img)
		if (val !== 'move') {
			// 设置变换基点localOrign
			if (val === 'rotate') {
				this.setRotateOrigin()
			} else if (val?.includes('scale')) {
				this.setScaleOrigin()
			}
			// 在不改变图案世界位的前提下，基于变换基点，偏移图案
			this.offsetImgByOrigin(this.localOrign, img)
		}
	}

	get altKey() {
		return this._altKey
	}
	set altKey(val) {
		if (this._altKey === val) {
			return
		}
		this._altKey = val
		const { img, controlState, localOrign, imgTransformer } = this
		if (!img) {
			return
		}
		if (controlState?.includes('scale')) {
			imgTransformer.restoreImg()
			this.setScaleOrigin()
			this.offsetImgByOrigin(localOrign, img)

			// 变换图案
			this.transformImg()
		}
	}

	/* 设置旋转基点 */
	setRotateOrigin() {
		const {
			localOrign,
			imgTransformer,
			transformStage: { clipCenter, pvmInvert },
		} = this
		localOrign.copy(clipCenter.clone().applyMatrix3(pvmInvert))
		imgTransformer.updateOriginToMouseStart()
	}

	/* 设置缩放基点 */
	setScaleOrigin() {
		const {
			altKey,
			localOrign,
			imgTransformer,
			transformStage: { clipCenter, clipOpposite, pvmInvert },
		} = this
		localOrign.copy(
			(altKey ? clipCenter : clipOpposite).clone().applyMatrix3(pvmInvert)
		)
		imgTransformer.updateOriginToMouseStart()
	}

	/* 暂存变换数据 */
	saveTransformData(img: Img) {
		const {
			clipMousePos,
			imgTransformer,
			frame,
			transformStage: { clipCenter, clipOpposite, pvmInvert },
		} = this
		pvmInvert.copy(img.pvmMatrix.invert())
		clipCenter.copy(frame.center)
		clipOpposite.copy(frame.opposite)
		imgTransformer.setOption({
			img,
			mouseStart: clipMousePos.clone().applyMatrix3(pvmInvert),
		})
	}

	/* 鼠标移动 */
	pointermove(mp: Vector2) {
		if (!this.img) {
			return
		}
		// 更新鼠标世界位
		this.clipMousePos.copy(mp)
		// 获取鼠标状态
		this.mouseState = this.frame.getMouseState(mp)
		if (this.controlState) {
			// 更新鼠标本地位
			this.updateLocalMousePos()
			// 变换图案
			this.transformImg()
		}
		this.dispatchEvent(_changeEvent)
	}

	/* 鼠标按下 */
	pointerdown(objects: Object2D[], mp: Vector2) {
		const scene = this.getScene()
		if (!scene) {
			return null
		}
		if (!this.img) {
			const img = this.selectObjects(scene, objects, mp)
			if (img) {
				this.img = img
				this.dispatchEvent({ type: 'selected', img })
			} else {
				return
			}
		}

		this.clipMousePos.copy(mp)
		this.mouseState = this.frame.getMouseState(mp)
		if (this.mouseState) {
			// 控制状态等于鼠标状态
			this.controlState = this.mouseState
			this.updateLocalMousePos()
		} else {
			this.img = null
		}

		this.dispatchEvent(_changeEvent)
	}

	/* 从图案集合中选择图案 */
	selectObjects(scene: Scene, objects: Object2D[], mwp: Vector2): Img | null {
		for (let img of [...objects].reverse()) {
			if (img instanceof Img && scene.isPointInObj(img, mwp)) {
				return img
			}
		}
		return null
	}

	/* 鼠标抬起 */
	pointerup() {
		if (this.controlState) {
			this.controlState = null
			this.dispatchEvent(_changeEvent)
		}
	}

	/* 键盘按下 */
	keydown(key: string, altKey: boolean, shiftKey: boolean) {
		const { img, imgTransformer, controlStage } = this
		if (img) {
			switch (key) {
				case 'Enter':
					this.img = null
					break
				case 'Escape':
					imgTransformer.copyImgData(controlStage)
					this.img = null
					break
				case 'Delete':
					img.remove()
					this.img = null
					break
			}
		}
		this.shiftKey = shiftKey
		this.altKey = altKey
		this.dispatchEvent(_changeEvent)
	}

	/* 键盘抬起 */
	keyup(altKey: boolean, shiftKey: boolean) {
		this.shiftKey = shiftKey
		this.altKey = altKey
		this.dispatchEvent(_changeEvent)
	}

	/* 更新本地鼠标位 */
	updateLocalMousePos() {
		const {
			clipMousePos,
			localMousePos,
			transformStage: { pvmInvert },
		} = this
		localMousePos.copy(clipMousePos.clone().applyMatrix3(pvmInvert))
	}

	/* 变换图案 */
	transformImg() {
		const { imgTransformer, controlState, shiftKey } = this
		if (!imgTransformer || !controlState) {
			return
		}
		imgTransformer[controlState + Number(shiftKey)]()
	}

	/* 绘图 */
	draw(ctx: CanvasRenderingContext2D) {
		const { img } = this
		if (!img) {
			return
		}
		const { mouseState, controlState, mouseShape, frame } = this
		/* 绘制外框 */
		frame.draw(ctx)
		/* 绘制鼠标 */
		const state = controlState || mouseState
		state && mouseShape.draw(ctx, state)
	}

	/* 基于本地偏移坐标系设置基点*/
	offsetImgByOrigin(localOrign: Vector2, img: Img) {
		const { offset, position, scale, rotate } = img
		// 当前的偏移量
		const curOffset = localOrign
			.clone()
			.applyMatrix3(new Matrix3().translate(-offset.x, -offset.y))
			.multiplyScalar(-1)
		// 当前偏移和原有偏移的向量差
		const d = new Vector2().subVectors(curOffset, offset)
		// 图案的offset需要基于curOffset 做反向偏移
		offset.copy(curOffset)
		// 上一级的position 再偏移回来，以确保图案的世界位不变
		position.sub(d.multiply(scale).rotate(rotate))
	}
}

export { ImgControler }
