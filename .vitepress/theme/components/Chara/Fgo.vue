<template>
  <el-config-provider>
    <div class="fgo-character-viewer" :style="backgroundStyle">
      <el-row :gutter="20">
        <el-col :span="24" :lg="6">
          <div class="search-section">
            <h2>角色搜索</h2>
            <el-input
              v-model="searchQuery"
              @input="searchCharacter"
              placeholder="搜索角色名称..."
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-scrollbar v-if="searchResults.length > 0" height="300px">
              <el-menu>
                <el-menu-item
                  v-for="result in searchResults"
                  :key="result.id"
                  @click="selectCharacter(result)"
                >
                  {{ result.name }} ({{ result.jpName }})
                </el-menu-item>
              </el-menu>
            </el-scrollbar>
          </div>
        </el-col>
        <el-col :span="24" :lg="18" v-if="selectedCharacter">
          <div class="character-display">
            <h2>{{ selectedCharacter.name }}</h2>
            <div class="main-content">
              <div class="canvas-container">
                <canvas
                  ref="canvas"
                  width="1024"
                  height="768"
                  @mousedown="startSelection"
                  @mousemove="updateSelection"
                  @mouseup="endSelection"
                  @touchstart="startSelection"
                  @touchmove="updateSelection"
                  @touchend="endSelection"
                ></canvas>
              </div>
              <div class="controls-and-preview">
                <el-card class="image-selection">
                  <template #header>
                    <div class="card-header">
                      <span>图像选择</span>
                    </div>
                  </template>
                  <el-select v-model="currentImageKey" @change="selectImage" placeholder="选择图像" class="full-width">
                    <el-option
                      v-for="(url, key) in allCharacterImages"
                      :key="key"
                      :label="key"
                      :value="key"
                    ></el-option>
                  </el-select>
                </el-card>
                
                <el-card class="aspect-ratio">
                  <template #header>
                    <div class="card-header">
                      <span>宽高比</span>
                    </div>
                  </template>
                  <el-radio-group v-model="currentAspectRatio" @change="setAspectRatio" size="small" class="full-width">
                    <el-radio-button v-for="ratio in aspectRatios" :key="ratio" :value="ratio">
                      {{ ratio }}
                    </el-radio-button>
                  </el-radio-group>
                </el-card>
                
                <el-card class="manual-selection">
                  <template #header>
                    <div class="card-header">
                      <span>手动选择</span>
                    </div>
                  </template>
                  <el-form :model="manualSelection" label-width="50px" size="small">
                    <el-form-item label="X">
                      <el-input-number v-model="manualSelection.x" :min="0" :max="1024" @change="updateManualSelection" />
                    </el-form-item>
                    <el-form-item label="Y">
                      <el-input-number v-model="manualSelection.y" :min="0" :max="768" @change="updateManualSelection" />
                    </el-form-item>
                    <el-form-item label="宽度">
                      <el-input-number v-model="manualSelection.width" :min="1" :max="1024" @change="updateManualSelection" />
                    </el-form-item>
                    <el-form-item label="高度">
                      <el-input-number v-model="manualSelection.height" :min="1" :max="768" @change="updateManualSelection" />
                    </el-form-item>
                  </el-form>
                </el-card>
                
                <el-card class="preview">
                  <template #header>
                    <div class="card-header">
                      <span>预览</span>
                    </div>
                  </template>
                  <div class="preview-container">
                    <canvas ref="previewCanvas" width="200" height="200"></canvas>
                  </div>
                </el-card>
                
                <el-card class="actions">
                  <template #header>
                    <div class="card-header">
                      <span>操作</span>
                    </div>
                  </template>
                  <el-row :gutter="10">
                    <el-col :span="12">
                      <el-button @click="previewPreviousDiff" icon="ArrowLeft" class="full-width">上一个差分</el-button>
                    </el-col>
                    <el-col :span="12">
                      <el-button @click="previewNextDiff" icon="ArrowRight" class="full-width">下一个差分</el-button>
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" class="mt-2">
                    <el-col :span="12">
                      <el-button @click="toggleColorPicker" icon="Brush" class="full-width">背景颜色</el-button>
                    </el-col>
                    <el-col :span="12">
                      <el-button @click="saveSelectedArea" icon="Download" class="full-width">保存选区</el-button>
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" class="mt-2">
                    <el-col :span="12">
                      <el-button @click="batchProcess" icon="Files" class="full-width">批量处理</el-button>
                    </el-col>
                    <el-col :span="12">
                      <el-button @click="autoDetectFace" icon="Aim" class="full-width">检测脸部</el-button>
                    </el-col>
                  </el-row>
                </el-card>
                
                <el-card v-if="showColorPicker" class="color-picker">
                  <template #header>
                    <div class="card-header">
                      <span>颜色选择器</span>
                    </div>
                  </template>
                  <div class="color-picker-container">
                    <Chrome v-model="backgroundColor" @update:modelValue="updateBackgroundColor" :disableAlpha="false" />
                  </div>
                </el-card>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import JSZip from 'jszip'
import translations from '../../../../src/translations.json'
import noTranslations from '../../../../src/no_translation.json'
import { Chrome } from '@ckpack/vue-color'
import ColorThief from 'colorthief'
import { ElMessage } from 'element-plus'
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Brush,
  Download,
  Files,
  Aim
} from '@element-plus/icons-vue'

// 导入所需的 Element Plus 组件
import {
  ElConfigProvider,
  ElRow,
  ElCol,
  ElInput,
  ElScrollbar,
  ElMenu,
  ElMenuItem,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadioButton,
  ElButton,
  ElButtonGroup
} from 'element-plus'

declare global {
  interface Window {
    cv: any;
  }
}

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedCharacter = ref<any>(null)
const characterData = ref<any[]>([])
const canvas = ref<HTMLCanvasElement | null>(null)
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const previewCtx = ref<CanvasRenderingContext2D | null>(null)
const currentImage = ref<HTMLImageElement | null>(null)
const diffImages = ref<HTMLCanvasElement[]>([])
const currentDiffIndex = ref(0)
const selectionStart = ref({ x: 0, y: 0 })
const selectionEnd = ref({ x: 0, y: 0 })
const isSelecting = ref(false)
const backgroundColor = ref({
  r: 255,
  g: 255,
  b: 255,
  a: 1
})
const showColorPicker = ref(false)
const allCharacterImages = ref<Record<string, string>>({})
const mainColor = ref({ r: 255, g: 255, b: 255 })
const aspectRatios = ['custom', '1:1', '4:3', '16:9', '3:2', '5:4', '21:9']
const currentAspectRatio = ref('custom')
const faceDetected = ref(false)
const currentImageKey = ref('')

// 添加新的 ref
const manualSelection = ref({
  x: 0,
  y: 0,
  width: 256,
  height: 256
})

const backgroundStyle = computed(() => {
  const { r, g, b } = mainColor.value
  return {
    background: `linear-gradient(135deg, rgb(${r}, ${g}, ${b}) 0%, #ffffff 100%)`,
  }
})

onMounted(async () => {
  await loadOpenCV()
  await fetchCharacterData()
  await initFaceDetector()
})

const loadOpenCV = () => {
  return new Promise<void>((resolve) => {
    if (window.cv) {
      resolve()
    } else {
      const script = document.createElement('script')
      script.src = 'https://docs.opencv.org/4.5.2/opencv.js'
      script.async = true
      script.onload = () => resolve()
      document.body.appendChild(script)
    }
  })
}

const fetchCharacterData = async () => {
  try {
    const response = await axios.get('https://api.atlasacademy.io/export/JP/nice_servant.json')
    characterData.value = response.data
  } catch (error) {
    console.error('Error fetching character data:', error)
  }
}

const searchCharacter = () => {
  if (searchQuery.value.trim().length < 1) {
    searchResults.value = []
    return
  }
  const query = searchQuery.value.toLowerCase()
  searchResults.value = characterData.value
    .filter(char => {
      const cnName = translations[char.name] || noTranslations[char.name] || char.name
      return cnName.toLowerCase().includes(query) || char.name.toLowerCase().includes(query)
    })
    .slice(0, 10)
    .map(char => ({
      id: char.id,
      name: translations[char.name] || noTranslations[char.name] || char.name,
      jpName: char.name
    }))
}

const selectCharacter = async (character: any) => {
  selectedCharacter.value = character
  searchResults.value = []
  searchQuery.value = ''
  await loadCharacterImages(character.id)
}

const loadCharacterImages = async (characterId: number) => {
  const character = characterData.value.find(char => char.id === characterId)
  if (character && character.extraAssets && character.extraAssets.charaFigure) {
    const { ascension, costume, story } = character.extraAssets.charaFigure
    allCharacterImages.value = { ...ascension, ...costume, ...story }
    const imageKeys = Object.keys(allCharacterImages.value)
    
    if (imageKeys.length > 0) {
      currentImageKey.value = imageKeys[0]
      await selectImage(currentImageKey.value)
    }
  }
}

const selectImage = async (key: string) => {
  const url = allCharacterImages.value[key]
  currentImage.value = await loadImage(url)
  diffImages.value = await processDiffImages(currentImage.value)
  currentDiffIndex.value = 0
  drawImage()
  updatePreview()
  // 重置选择框
  selectionStart.value = { x: 0, y: 0 }
  selectionEnd.value = { x: 256, y: 256 }
  updateManualSelection()
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

const processDiffImages = async (baseImage: HTMLImageElement): Promise<HTMLCanvasElement[]> => {
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCanvas.width = baseImage.width
  tempCanvas.height = baseImage.height
  tempCtx.drawImage(baseImage, 0, 0)

  const baseImageMat = window.cv.imread(tempCanvas)
  const diffs: HTMLCanvasElement[] = []

  // 提取身体部分（1024x768）
  const bodyMat = baseImageMat.roi(new window.cv.Rect(0, 0, 1024, 768))

  // 检测脸部
  const faceRect = detectFace(bodyMat)
  if (faceRect) {
    // 如果检测到脸部，设置选择框
    selectionStart.value = { x: faceRect.x, y: faceRect.y }
    selectionEnd.value = { x: faceRect.x + faceRect.width, y: faceRect.y + faceRect.height }
    faceDetected.value = true
  }

  // 处理差分
  for (let y = 768; y < baseImage.height; y += 256) {
    for (let x = 0; x < baseImage.width; x += 256) {
      const diffMat = baseImageMat.roi(new window.cv.Rect(x, y, 256, 256))
      const result = new window.cv.Mat()
      window.cv.matchTemplate(bodyMat, diffMat, result, window.cv.TM_SQDIFF_NORMED)
      let minMax = window.cv.minMaxLoc(result)
      let { x: maxX, y: maxY } = minMax.minLoc

      const diffCanvas = document.createElement('canvas')
      diffCanvas.width = 1024
      diffCanvas.height = 768
      const diffCtx = diffCanvas.getContext('2d')!
      diffCtx.drawImage(baseImage, 0, 0, 1024, 768, 0, 0, 1024, 768)
      diffCtx.drawImage(baseImage, x, y, 256, 256, maxX, maxY, 256, 256)

      diffs.push(diffCanvas)

      result.delete()
      diffMat.delete()
    }
  }

  bodyMat.delete()
  baseImageMat.delete()

  // 提取主色调
  const colorThief = new ColorThief()
  const dominantColor = await colorThief.getColor(baseImage)
  mainColor.value = { r: dominantColor[0], g: dominantColor[1], b: dominantColor[2] }

  return diffs
}

const detectFace = (mat: any): { x: number; y: number; width: number; height: number } | null => {
  const gray = new window.cv.Mat()
  window.cv.cvtColor(mat, gray, window.cv.COLOR_RGBA2GRAY)

  const faces = new window.cv.RectVector()
  const faceCascade = new window.cv.CascadeClassifier()
  faceCascade.load('lbpcascade_animeface.xml')

  faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, new window.cv.Size(30, 30))

  if (faces.size() > 0) {
    const face = faces.get(0)
    // 扩大检测区域
    const centerX = face.x + face.width / 2
    const centerY = face.y + face.height / 2
    const size = Math.max(256, face.width * 1.5, face.height * 1.5)
    return {
      x: Math.max(0, centerX - size / 2),
      y: Math.max(0, centerY - size / 2),
      width: Math.min(mat.cols - centerX + size / 2, size),
      height: Math.min(mat.rows - centerY + size / 2, size)
    }
  }

  gray.delete()
  faces.delete()
  faceCascade.delete()

  return null
}

const drawImage = () => {
  if (!canvas.value) return
  const context = canvas.value.getContext('2d')
  if (!context || !diffImages.value[currentDiffIndex.value]) return
  
  context.clearRect(0, 0, canvas.value.width, canvas.value.height)
  context.drawImage(diffImages.value[currentDiffIndex.value], 0, 0)
  drawSelectionBox(context)
}

const previewPreviousDiff = () => {
  if (diffImages.value.length === 0) return;
  currentDiffIndex.value = (currentDiffIndex.value - 1 + diffImages.value.length) % diffImages.value.length;
  drawImage();
  updatePreview();
}

const previewNextDiff = () => {
  if (diffImages.value.length === 0) return;
  currentDiffIndex.value = (currentDiffIndex.value + 1) % diffImages.value.length;
  drawImage();
  updatePreview();
}

const startSelection = (event: MouseEvent | TouchEvent) => {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const { clientX, clientY } = event instanceof TouchEvent ? handleTouch(event) : event

  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  const x = Math.floor((clientX - rect.left) * scaleX)
  const y = Math.floor((clientY - rect.top) * scaleY)
  selectionStart.value = { x, y }
  selectionEnd.value = { x, y }
  isSelecting.value = true
  updateManualSelectionFromCanvas()
}

const updateSelection = (event: MouseEvent | TouchEvent) => {
  if (!isSelecting.value || !canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const { clientX, clientY } = event instanceof TouchEvent ? handleTouch(event) : event

  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  const newX = Math.floor(Math.min(Math.max((clientX - rect.left) * scaleX, 0), canvas.value.width))
  const newY = Math.floor(Math.min(Math.max((clientY - rect.top) * scaleY, 0), canvas.value.height))
  
  selectionEnd.value = { x: newX, y: newY }
  
  if (currentAspectRatio.value !== 'custom') {
    applyAspectRatio()
  } else {
    drawImage()
    updatePreview()
    updateManualSelectionFromCanvas()
  }
}

const endSelection = () => {
  isSelecting.value = false
  updateManualSelectionFromCanvas()
}

const drawSelectionBox = (context: CanvasRenderingContext2D) => {
  context.strokeStyle = 'red'
  context.lineWidth = 2
  context.setLineDash([5, 5])
  const x = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const y = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const width = Math.abs(selectionEnd.value.x - selectionStart.value.x)
  const height = Math.abs(selectionEnd.value.y - selectionStart.value.y)
  context.strokeRect(x, y, width, height)
}

const updatePreview = () => {
  if (!canvas.value || !previewCanvas.value) return
  const context = previewCanvas.value.getContext('2d')
  if (!context) return
  
  // 调整截取区域，稍微缩小以避免包含虚线框
  const offset = 2 // 可以根据实际情况调整
  const sourceX = Math.min(selectionStart.value.x, selectionEnd.value.x) + offset
  const sourceY = Math.min(selectionStart.value.y, selectionEnd.value.y) + offset
  const sourceWidth = Math.abs(selectionEnd.value.x - selectionStart.value.x) - 2 * offset
  const sourceHeight = Math.abs(selectionEnd.value.y - selectionStart.value.y) - 2 * offset

  // 计算选区的宽高比
  const aspectRatio = sourceWidth / sourceHeight

  // 根据选区的宽高比调整预览画布的尺寸
  const previewSize = 200 // 可以调整预览区域的基准尺寸
  if (aspectRatio >= 1) {
    previewCanvas.value.width = previewSize
    previewCanvas.value.height = previewSize / aspectRatio
  } else {
    previewCanvas.value.height = previewSize
    previewCanvas.value.width = previewSize * aspectRatio
  }

  // 清空并绘制预览
  context.clearRect(0, 0, previewCanvas.value.width, previewCanvas.value.height)
  const { r, g, b, a } = backgroundColor.value
  context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
  context.fillRect(0, 0, previewCanvas.value.width, previewCanvas.value.height)
  
  if (canvas.value) {
    context.drawImage(
      canvas.value,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      previewCanvas.value.width,
      previewCanvas.value.height
    )
  }
}

const toggleColorPicker = () => {
  showColorPicker.value = !showColorPicker.value
}

const updateBackgroundColor = (color: any) => {
  backgroundColor.value = color.rgba
  updatePreview()
}

const saveSelectedArea = () => {
  if (!canvas.value || !selectedCharacter.value) return

  // 创建临时画布，尺寸与截取区域一致
  const offset = 2 // 与 updatePreview 中的偏移量一致
  const sourceX = Math.min(selectionStart.value.x, selectionEnd.value.x) + offset
  const sourceY = Math.min(selectionStart.value.y, selectionEnd.value.y) + offset
  const sourceWidth = Math.abs(selectionEnd.value.x - selectionStart.value.x) - 2 * offset
  const sourceHeight = Math.abs(selectionEnd.value.y - selectionStart.value.y) - 2 * offset

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = sourceWidth
  tempCanvas.height = sourceHeight
  const tempCtx = tempCanvas.getContext('2d')!

  // 填充背景色并绘制选区内容
  const { r, g, b, a } = backgroundColor.value
  tempCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  tempCtx.drawImage(
    canvas.value,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  )

  // 保存图像
  const link = document.createElement('a')
  link.download = `${selectedCharacter.value.name}_selected.png`
  link.href = tempCanvas.toDataURL()
  link.click()
}

const batchProcess = async () => {
  if (!selectedCharacter.value) return
  const zip = new JSZip()
  
  // 调整截取区域
  const offset = 2 // 与其他函数中的偏移量一致
  const sourceX = Math.min(selectionStart.value.x, selectionEnd.value.x) + offset
  const sourceY = Math.min(selectionStart.value.y, selectionEnd.value.y) + offset
  const sourceWidth = Math.abs(selectionEnd.value.x - selectionStart.value.x) - 2 * offset
  const sourceHeight = Math.abs(selectionEnd.value.y - selectionStart.value.y) - 2 * offset

  for (let i = 0; i < diffImages.value.length; i++) {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = sourceWidth
    tempCanvas.height = sourceHeight
    const tempCtx = tempCanvas.getContext('2d')!

    // 填充背景色并绘制选区内容
    const { r, g, b, a } = backgroundColor.value
    tempCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.drawImage(
      diffImages.value[i],
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    )

    // 添加到压缩包
    const base64 = tempCanvas.toDataURL().split(',')[1]
    zip.file(`${selectedCharacter.value.name}_diff_${i + 1}.png`, base64, { base64: true })
  }
  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.download = `${selectedCharacter.value.name}_batch.zip`
  link.href = URL.createObjectURL(content)
  link.click()
}

const setAspectRatio = (ratio: string) => {
  currentAspectRatio.value = ratio
  if (ratio !== 'custom') {
    applyAspectRatio()
  }
}

const applyAspectRatio = () => {
  if (currentAspectRatio.value === 'custom') return

  const [width, height] = currentAspectRatio.value.split(':').map(Number)
  const aspectRatio = width / height
  const currentWidth = Math.abs(selectionEnd.value.x - selectionStart.value.x)
  const currentHeight = Math.abs(selectionEnd.value.y - selectionStart.value.y)

  if (currentWidth / currentHeight > aspectRatio) {
    // 调整宽度
    const newWidth = currentHeight * aspectRatio
    selectionEnd.value.x = selectionStart.value.x + (selectionEnd.value.x > selectionStart.value.x ? newWidth : -newWidth)
  } else {
    // 调整高度
    const newHeight = currentWidth / aspectRatio
    selectionEnd.value.y = selectionStart.value.y + (selectionEnd.value.y > selectionStart.value.y ? newHeight : -newHeight)
  }

  drawImage()
  updatePreview()
  updateManualSelectionFromCanvas()
}

const initFaceDetector = async () => {
  if (window.cv) {
    try {
      const classifiers = [
        '/lbpcascade_animeface.xml',
        '/haarcascade_frontalface_default.xml'
      ]
      
      for (const classifier of classifiers) {
        const response = await fetch(classifier)
        const buffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)
        window.cv.FS_createDataFile('/', classifier.split('/').pop(), uint8Array, true, false, false)
      }
      console.log('Face detection classifiers loaded')
    } catch (error) {
      console.error('Error loading face detection classifiers:', error)
    }
  }
}

const autoDetectFace = () => {
  if (!currentImage.value) return

  const faceRect = detectFace(window.cv.imread(currentImage.value))
  if (faceRect) {
    selectionStart.value = { x: faceRect.x, y: faceRect.y }
    selectionEnd.value = { x: faceRect.x + faceRect.width, y: faceRect.y + faceRect.height }
    faceDetected.value = true
    drawImage()
    updatePreview()
    ElMessage.success('成功检测到人脸')
  } else {
    ElMessage.warning('未检测到人脸，请尝试手动选择')
    faceDetected.value = false
  }
}

const handleTouch = (event: TouchEvent) => {
  event.preventDefault()
  const touch = event.touches[0]
  return {
    clientX: touch.clientX,
    clientY: touch.clientY
  }
}

// 添加 updateManualSelection 函数
const updateManualSelection = () => {
  selectionStart.value = { x: manualSelection.value.x, y: manualSelection.value.y }
  selectionEnd.value = {
    x: manualSelection.value.x + manualSelection.value.width,
    y: manualSelection.value.y + manualSelection.value.height
  }
  if (currentAspectRatio.value !== 'custom') {
    applyAspectRatio()
  } else {
    drawImage()
    updatePreview()
  }
}

// 添加 updateManualSelectionFromCanvas 函数
const updateManualSelectionFromCanvas = () => {
  manualSelection.value = {
    x: Math.min(selectionStart.value.x, selectionEnd.value.x),
    y: Math.min(selectionStart.value.y, selectionEnd.value.y),
    width: Math.abs(selectionEnd.value.x - selectionStart.value.x),
    height: Math.abs(selectionEnd.value.y - selectionStart.value.y)
  }
}

watch([selectedCharacter, currentImage], () => {
  drawImage()
  updatePreview()
})
</script>

<style scoped>
.fgo-character-viewer {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  font-family: 'Arial', sans-serif;
  border-radius: 10px;
  transition: background 0.5s ease;
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.search-section {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.main-content {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.canvas-container {
  flex: 1;
  min-width: 300px;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.controls-and-preview {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-container {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

canvas {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-picker-container {
  margin-top: 1rem;
}

.full-width {
  width: 100%;
}

.mt-2 {
  margin-top: 0.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .controls-and-preview {
    flex: 1;
  }

  .search-section {
    margin-bottom: 1rem;
  }
}
</style>

