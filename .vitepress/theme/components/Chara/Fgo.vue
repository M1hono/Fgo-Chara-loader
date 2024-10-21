<template>
    <div class="fgo-character-viewer" :style="backgroundStyle">
      <div class="search-section">
        <input
          v-model="searchQuery"
          @input="searchCharacter"
          placeholder="搜索角色名称..."
        />
        <ul v-if="searchResults.length > 0" class="search-results">
          <li
            v-for="result in searchResults"
            :key="result.id"
            @click="selectCharacter(result)"
          >
            {{ result.name }}
          </li>
        </ul>
      </div>
      <div v-if="selectedCharacter" class="character-display">
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
            ></canvas>
          </div>
          <div class="controls-and-preview">
            <div class="image-controls">
              <button
                v-for="(url, key) in allCharacterImages"
                :key="key"
                @click="selectImage(url, key)"
                class="image-button"
              >
                {{ key }}
              </button>
            </div>
            <div class="aspect-ratio-controls">
              <button
                v-for="ratio in aspectRatios"
                :key="ratio"
                @click="setAspectRatio(ratio)"
                :class="{ active: currentAspectRatio === ratio }"
              >
                {{ ratio }}
              </button>
            </div>
            <div class="preview-container">
              <canvas ref="previewCanvas" width="200" height="200"></canvas>
            </div>
            <div class="action-controls">
              <button @click="previewNextDiff">预览下一个差分</button>
              <button @click="toggleColorPicker">选择背景颜色</button>
              <button @click="saveSelectedArea">保存选中区域</button>
              <button @click="batchProcess">批量处理</button>
            </div>
            <Chrome v-if="showColorPicker" v-model="backgroundColor" @update:modelValue="updateBackgroundColor" />
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue'
  import axios from 'axios'
  import JSZip from 'jszip'
  import nameMapping from '../../../../nameMapping.json'
  import { Chrome } from '@ckpack/vue-color'
  import ColorThief from 'colorthief'
  
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
  const backgroundColor = ref({ hex: '#FFFFFF' })
  const showColorPicker = ref(false)
  const allCharacterImages = ref<Record<string, string>>({})
  const mainColor = ref({ r: 255, g: 255, b: 255 })
  const aspectRatios = ['custom', '1:1', '4:3', '16:9']
  const currentAspectRatio = ref('custom')
  
  const backgroundStyle = computed(() => {
    const { r, g, b } = mainColor.value
    return {
      background: `linear-gradient(135deg, rgb(${r}, ${g}, ${b}) 0%, #ffffff 100%)`,
    }
  })
  
  onMounted(async () => {
    await loadOpenCV()
    await fetchCharacterData()
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
      const response = await axios.get('https://api.atlasacademy.io/export/NA/nice_servant.json')
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
        const cnName = nameMapping[char.name] || char.name
        return cnName.toLowerCase().includes(query) || char.name.toLowerCase().includes(query)
      })
      .slice(0, 10)
      .map(char => ({
        id: char.id,
        name: nameMapping[char.name] || char.name
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
      const imageUrls = Object.values(allCharacterImages.value)
      
      if (imageUrls.length > 0) {
        await selectImage(imageUrls[0], Object.keys(allCharacterImages.value)[0])
      }
    }
  }
  
  const selectImage = async (url: string, key: string) => {
    currentImage.value = await loadImage(url)
    diffImages.value = await processDiffImages(currentImage.value)
    currentDiffIndex.value = 0
    drawImage()
    updatePreview()
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
  
  const drawImage = () => {
    if (!canvas.value) return
    const context = canvas.value.getContext('2d')
    if (!context || !diffImages.value[currentDiffIndex.value]) return
    
    context.clearRect(0, 0, canvas.value.width, canvas.value.height)
    context.drawImage(diffImages.value[currentDiffIndex.value], 0, 0)
    if (isSelecting.value) {
      drawSelectionBox(context)
    }
  }
  
  const previewNextDiff = () => {
    currentDiffIndex.value = (currentDiffIndex.value + 1) % diffImages.value.length
    drawImage()
    updatePreview()
  }
  
  const startSelection = (event: MouseEvent) => {
    if (!canvas.value) return
    const rect = canvas.value.getBoundingClientRect()

    const scaleX = canvas.value.width / rect.width
    const scaleY = canvas.value.height / rect.height

    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY
    selectionStart.value = { x, y }
    selectionEnd.value = { x, y }
    isSelecting.value = true
  }
  
  const updateSelection = (event: MouseEvent) => {
    if (!isSelecting.value || !canvas.value) return
    const rect = canvas.value.getBoundingClientRect()

    const scaleX = canvas.value.width / rect.width
    const scaleY = canvas.value.height / rect.height

    const newX = Math.min(Math.max((event.clientX - rect.left) * scaleX, 0), canvas.value.width)
    const newY = Math.min(Math.max((event.clientY - rect.top) * scaleY, 0), canvas.value.height)
    
    if (currentAspectRatio.value !== 'custom') {
      const [width, height] = currentAspectRatio.value.split(':').map(Number)
      const aspectRatio = width / height
      const currentWidth = newX - selectionStart.value.x
      const currentHeight = newY - selectionStart.value.y
      const aspectRatioValue = Math.abs(currentWidth / currentHeight)

      if (aspectRatioValue > aspectRatio) {
        // 调整宽度
        const adjustedWidth = Math.abs(currentHeight * aspectRatio)
        selectionEnd.value.x = selectionStart.value.x + (currentWidth > 0 ? adjustedWidth : -adjustedWidth)
        selectionEnd.value.y = newY
      } else {
        // 调整高度
        const adjustedHeight = Math.abs(currentWidth / aspectRatio)
        selectionEnd.value.x = newX
        selectionEnd.value.y = selectionStart.value.y + (currentHeight > 0 ? adjustedHeight : -adjustedHeight)
      }
    } else {
      selectionEnd.value.x = newX
      selectionEnd.value.y = newY
    }
    
    drawImage()
    updatePreview()
  }
  
  const endSelection = () => {
    isSelecting.value = false
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
    context.fillStyle = backgroundColor.value.hex
    context.fillRect(0, 0, previewCanvas.value.width, previewCanvas.value.height)
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
  
  const toggleColorPicker = () => {
    showColorPicker.value = !showColorPicker.value
  }
  
  const updateBackgroundColor = (color: any) => {
    backgroundColor.value = color
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
    tempCtx.fillStyle = backgroundColor.value.hex
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
      tempCtx.fillStyle = backgroundColor.value.hex
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
    // 仅当比例不是 'custom' 且正在选择时，调整选区
    if (ratio !== 'custom' && isSelecting.value) {
      const [width, height] = ratio.split(':').map(Number)
      const aspectRatio = width / height
      const currentWidth = selectionEnd.value.x - selectionStart.value.x
      const adjustedHeight = currentWidth / aspectRatio
      selectionEnd.value.y = selectionStart.value.y + adjustedHeight
      drawImage()
      updatePreview()
    }
  }
  
  watch([selectedCharacter, currentImage], () => {
    drawImage()
    updatePreview()
  })
  </script>
  
  <style scoped>
  .fgo-character-viewer {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Arial', sans-serif;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: background 0.5s ease;
  }
  
  .main-content {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }
  
  .canvas-container {
    flex: 1;
    min-width: 300px;
  }
  
  .controls-and-preview {
    flex: 0 0 300px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .image-controls, .aspect-ratio-controls, .action-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .image-button, .aspect-ratio-controls button, .action-controls button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background-color: rgba(74, 144, 226, 0.8);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .image-button:hover, .aspect-ratio-controls button:hover, .action-controls button:hover {
    background-color: rgba(58, 123, 200, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .preview-container {
    width: 100%;
    height: 200px;
    border: 1px solid #ccc;
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
  
  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    white-space: nowrap; /* 防止按钮文字换行 */
  }
  
  .chrome-picker {
    margin-top: 1rem;
  }
  </style>
  














