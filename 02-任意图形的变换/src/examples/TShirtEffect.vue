<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TransformControler } from '../lmm/controler/TransformControler'
import { OrbitControler } from '../lmm/controler/OrbitControler'
import { Scene } from '../lmm/core/Scene'
import { Vector2 } from '../lmm/math/Vector2'
import { Group } from '../lmm/objects/Group'
import { ImagePromises, SelectObj } from '../lmm/objects/ObjectUtils'
import { Object2D } from '../lmm/objects/Object2D'
import { Img2D } from '../lmm/objects/Img2D'
import { Text2D } from '../lmm/objects/Text2D'

// 对应canvas 画布的Ref对象
const canvasRef = ref<HTMLCanvasElement>()

/* 场景 */
const scene = new Scene()

/* 相机轨道控制器 */
const orbitControler = new OrbitControler(scene.camera)

/* 设计尺寸 */
const size = new Vector2(400)
/* T恤偏移 */
const offset = new Vector2(-size.width / 2)

/* 文件路径 */
const path = 'https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/'

/* 图案 */
const pattern = new Img2D({
	src: path + '1.png',
	position: new Vector2(0, -100),
	offset: new Vector2(-200, -165),
	size: new Vector2(400, 330),
})

/* TShirt 投影图 */
const shirtShadow = new Img2D({
	src: path + 'shirt-shadow.jpg',
	offset,
	size,
	style: {
		globalCompositeOperation: 'multiply',
	},
})

/* TShirt 遮罩图 */
const shirtMask = new Img2D({
	src: path + 'shirt-mask.png',
	offset,
	size,
	style: {
		globalCompositeOperation: 'destination-in',
	},
})

/* 用作裁剪的图案 */
const patternMask = new Img2D({
	image: pattern.image,
	offset: pattern.offset,
	size: pattern.size,
	style: {
		globalCompositeOperation: 'destination-in',
	},
})

/* TShirt 原图 */
const shirtOrigin = new Img2D({
	src: path + 'shirt-origin.jpg',
	offset,
	size,
	style: {
		globalCompositeOperation: 'destination-over',
	},
})

scene.add(pattern, shirtShadow, shirtMask, patternMask, shirtOrigin)

/* 图片的Promise 对象集合 */
const imagePromises = ImagePromises([
	pattern.image,
	shirtOrigin.image,
	shirtMask.image,
	shirtShadow.image,
] as HTMLImageElement[])

/* 所以图片加载完成 */
function onAllImageLoaded() {
	/* 渲染 */
	scene.render()
}

/* 按需渲染 */
orbitControler.addEventListener('change', () => {
	scene.render()
})

/* 鼠标按下*/
function pointerdown(event: PointerEvent) {
	const { button, clientX, clientY } = event
	switch (button) {
		case 1:
			orbitControler.pointerdown(clientX, clientY)
			break
	}
}
/* 鼠标移动 */
function pointermove(event: PointerEvent) {
	const { clientX, clientY } = event
	orbitControler.pointermove(clientX, clientY)
}

/* 滑动滚轮缩放 */
function wheel({ deltaY }: WheelEvent) {
	orbitControler.doScale(deltaY)
}

/* 鼠标抬起 */
window.addEventListener('pointerup', (event: PointerEvent) => {
	switch (event.button) {
		case 1:
			orbitControler.pointerup()
			break
	}
})

onMounted(() => {
	const canvas = canvasRef.value
	if (canvas) {
		scene.setOption({ canvas })
		Promise.all(imagePromises).then(onAllImageLoaded)
	}
})
</script>

<template>
	<canvas
		ref="canvasRef"
		:width="size.width"
		:height="size.height"
		@pointerdown="pointerdown"
		@pointermove="pointermove"
		@wheel="wheel"
	></canvas>
</template>

<style scoped>
canvas {
	background-color: antiquewhite;
	margin-top: 50px;
	margin-left: 180px;
}
#text {
	position: absolute;
	left: 15px;
	top: 15px;
}
</style>
