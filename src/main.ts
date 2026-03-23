import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import GlobalHeader from './components/GlobalHeader.vue'
import GlobalFooter from './components/GlobalFooter.vue'

import Antd from 'ant-design-vue'
import { notification } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

// 全局统一通知位置：右上角
notification.config({
  placement: 'topRight',
})

app.component('GlobalHeader', GlobalHeader)
app.component('GlobalFooter', GlobalFooter)

app.mount('#app')





