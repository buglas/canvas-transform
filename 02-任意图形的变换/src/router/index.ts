import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		component: () => import('../examples/HelloWorld.vue'),
	},
	{
		path: '/MatrixOfCanvas',
		component: () => import('../examples/MatrixOfCanvas.vue'),
	},
	{
		path: '/Camera',
		component: () => import('../examples/Camera.vue'),
	},
	{
		path: '/Img2D',
		component: () => import('../examples/Img2D.vue'),
	},
	{
		path: '/Group',
		component: () => import('../examples/Group.vue'),
	},
	{
		path: '/Scene',
		component: () => import('../examples/Scene.vue'),
	},
	{
		path: '/OrbitControler',
		component: () => import('../examples/OrbitControler.vue'),
	},
	{
		path: '/TransformControler',
		component: () => import('../examples/TransformControler.vue'),
	},
	{
		path: '/Text2D',
		component: () => import('../examples/Text2D.vue'),
	},
	{
		path: '/TShirtEffect',
		component: () => import('../examples/TShirtEffect.vue'),
	},
]
const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router
