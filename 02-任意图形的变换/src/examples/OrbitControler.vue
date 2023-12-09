<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { OrbitControler } from '../lmm/controler/OrbitControler'
import { Scene } from '../lmm/core/Scene'
import { Vector2 } from '../lmm/math/Vector2'
import { Img2D } from '../lmm/objects/Img2D'

// 获取父级属性
defineProps({
	size: { type: Object, default: { width: 0, height: 0 } },
})

// 对应canvas 画布的Ref对象
const canvasRef = ref<HTMLCanvasElement>()

/* 场景 */
const scene = new Scene()

/* 相机轨道控制器 */
const orbitControler = new OrbitControler(scene.camera)

/* 图案 */
const image = new Image()
image.src =
	'https://yxyy-pandora.oss-cn-beijing.aliyuncs.com/stamp-images/1.png'
const pattern = new Img2D({ image })
scene.add(pattern)

/* 测试 */
function test() {
	const imgSize = new Vector2(image.width, image.height).multiplyScalar(0.6)
	pattern.setOption({
		/* 模型矩阵 */
		rotate: 0.4,
		position: new Vector2(0, -50),
		scale: new Vector2(0.5),

		/* Img属性 */
		size: imgSize.clone(),
		offset: imgSize.clone().multiplyScalar(-0.5),
	})

	/* 渲染 */
	scene.render()
}

/* 按需渲染 */
orbitControler.addEventListener('change', () => {
  scene.render()
})

/* 滑动滚轮缩放 */
function wheel({ deltaY,clientX,clientY }: WheelEvent){
  // 基于画布中心缩放视口
  // orbitControler.doScale(deltaY)

  // 基于鼠标位置缩放口
  orbitControler.doScale(deltaY,scene.canvastoClip(new Vector2(clientX,clientY)))
}

/* 按住滚轮平移 */
function pointerdown(event: PointerEvent){
  if (event.button == 1) {
    orbitControler.pointerdown(event.clientX, event.clientY)
  }
}
function pointermove(event: PointerEvent){
  orbitControler.pointermove(event.clientX, event.clientY)
}
window.addEventListener('pointerup', (event: PointerEvent) => {
  if (event.button == 1) {
    orbitControler.pointerup()
  }
})

onMounted(() => {
	const canvas = canvasRef.value
	if (canvas) {
		scene.setOption({ canvas })
		image.onload = function () {
			test()
		}
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

<style scoped></style>
