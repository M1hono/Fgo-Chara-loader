// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import Theme from 'vitepress/theme'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import Fgo from './components/Chara/Fgo.vue'
import Layout from './Layout.vue'

export default {
  ...Theme,
  Layout,
  enhanceApp({ app }) {
    app.use(ElementPlus)
    app.component('Fgo', Fgo)
  }
}
