<template>
  <div class="playback-preview">
    <!-- Score View Section -->
    <div class="section score-view-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon><Tickets /></el-icon>
          <span>Score View</span>
        </div>
        <div class="measure-info">
          Measure {{ currentMeasure }} / {{ totalMeasures }}
        </div>
      </div>
      <div class="score-timeline">
        <div 
          v-for="structure in musicStore.phraseStructures" 
          :key="structure.id"
          class="score-block"
          :class="{ 
            'active': currentStructureIndex === getStructureIndex(structure.id),
            'past': currentStructureIndex > getStructureIndex(structure.id)
          }"
          :style="{ flex: getStructureDuration(structure) }"
          @click="jumpToStructure(getStructureIndex(structure.id))"
        >
          <div class="block-header">
            <span class="measure-range">M{{ structure.startMeasure }}-{{ structure.endMeasure }}</span>
            <span class="structure-name">{{ structure.id }}</span>
          </div>
          <div class="block-emotion" v-if="structure.emotion">
            <span 
              class="emotion-label"
              :class="structure.emotion.primary"
            >
              {{ structure.emotion.primary }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Audio Playback Section -->
    <div class="section audio-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon><Headset /></el-icon>
          <span>Audio Playback</span>
        </div>
        <div class="time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}
        </div>
      </div>
      <div class="audio-timeline">
        <div 
          v-for="structure in musicStore.phraseStructures" 
          :key="structure.id"
          class="audio-block"
          :class="{ 
            'active': currentStructureIndex === getStructureIndex(structure.id),
            'past': currentStructureIndex > getStructureIndex(structure.id)
          }"
          :style="{ flex: getStructureDuration(structure) }"
        >
          <span class="audio-label">{{ structure.id }}</span>
        </div>
      </div>
      <div class="progress-bar-container">
        <el-slider 
          v-model="playbackProgress" 
          :min="0" 
          :max="100"
          :show-tooltip="false"
          @change="onProgressChange"
        />
      </div>
      
      <!-- Playback Controls -->
      <div class="playback-controls">
        <el-button :icon="DArrowLeft" circle @click="previousStructure" />
        <el-button 
          :icon="isPlaying ? VideoPause : VideoPlay" 
          type="primary"
          circle
          size="large"
          @click="togglePlayback"
        />
        <el-button :icon="DArrowRight" circle @click="nextStructure" />
        <el-button :icon="RefreshLeft" circle @click="resetPlayback" />
        <div class="volume-control">
          <el-icon><Microphone /></el-icon>
          <el-slider v-model="volume" :min="0" :max="100" style="width: 100px" />
        </div>
        <div class="speed-control">
          <span>Speed:</span>
          <el-select v-model="playbackSpeed" size="small" style="width: 80px">
            <el-option label="0.5x" :value="0.5" />
            <el-option label="1x" :value="1" />
            <el-option label="1.5x" :value="1.5" />
            <el-option label="2x" :value="2" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- Visual Music Map Section -->
    <div class="section visual-map-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon><PictureFilled /></el-icon>
          <span>Visual Music Map</span>
        </div>
        <el-tag type="success" v-if="currentStructure">
          Now: {{ currentStructure.id }}
        </el-tag>
      </div>
      <div class="visual-cards-container">
        <div 
          v-for="structure in musicStore.phraseStructures" 
          :key="structure.id"
          class="visual-card"
          :class="{ 
            'active': currentStructureIndex === getStructureIndex(structure.id),
            'configured': visualStore.getMapping(structure.id)
          }"
          @click="jumpToStructure(getStructureIndex(structure.id))"
        >
          <div class="card-visual">
            <div v-if="visualStore.getMapping(structure.id)" class="visual-elements-display">
              <!-- Custom drag layout - check if any element has position data -->
              <div 
                v-if="hasCustomPositions(structure.id)"
                class="custom-layout-container"
              >
                <div 
                  v-for="(element, idx) in visualStore.getMapping(structure.id)?.scheme.elements" 
                  :key="idx"
                  class="display-element-svg custom-positioned"
                  :class="{ 'animating': isPlaying && currentStructureIndex === getStructureIndex(structure.id), [element.animation?.type || 'pulse']: true }"
                  :style="getScaledPositionStyle(element, idx)"
                >
                  <svg v-if="element.type === 'circle'" viewBox="0 0 32 32" class="shape-svg-small">
                    <circle cx="16" cy="16" r="14" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'star'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'triangle'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,3 30,28 2,28" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'square' || element.type === 'rect'" viewBox="0 0 32 32" class="shape-svg-small">
                    <rect x="4" y="4" width="24" height="24" rx="3" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'diamond'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 30,16 16,30 2,16" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'hexagon'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 28,8 28,24 16,30 4,24 4,8" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'pentagon'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 30,12 25,28 7,28 2,12" :fill="element.color" />
                  </svg>
                  <svg v-else viewBox="0 0 32 32" class="shape-svg-small">
                    <ellipse cx="16" cy="16" rx="14" ry="10" :fill="element.color" />
                  </svg>
                </div>
              </div>
              <!-- Standard layout -->
              <div v-else class="standard-layout">
                <div 
                  v-for="(element, idx) in visualStore.getMapping(structure.id)?.scheme.elements.slice(0, 3)" 
                  :key="idx"
                  class="display-element-svg"
                  :class="{ 'animating': isPlaying && currentStructureIndex === getStructureIndex(structure.id), [element.animation?.type || 'pulse']: true }"
                >
                  <svg v-if="element.type === 'circle'" viewBox="0 0 32 32" class="shape-svg-small">
                    <circle cx="16" cy="16" r="14" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'star'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 20,12 30,12 22,18 25,28 16,22 7,28 10,18 2,12 12,12" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'triangle'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,3 30,28 2,28" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'square' || element.type === 'rect'" viewBox="0 0 32 32" class="shape-svg-small">
                    <rect x="4" y="4" width="24" height="24" rx="3" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'diamond'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 30,16 16,30 2,16" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'hexagon'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 28,8 28,24 16,30 4,24 4,8" :fill="element.color" />
                  </svg>
                  <svg v-else-if="element.type === 'pentagon'" viewBox="0 0 32 32" class="shape-svg-small">
                    <polygon points="16,2 30,12 25,28 7,28 2,12" :fill="element.color" />
                  </svg>
                  <svg v-else viewBox="0 0 32 32" class="shape-svg-small">
                    <ellipse cx="16" cy="16" rx="14" ry="10" :fill="element.color" />
                  </svg>
                </div>
              </div>
            </div>
            <div v-else class="empty-visual">
              <el-icon><Picture /></el-icon>
            </div>
            <!-- Wave indicator -->
            <div class="wave-indicator">
              <svg viewBox="0 0 50 12" class="wave-svg">
                <path d="M0,6 Q6,2 12,6 T24,6 T36,6 T50,6" fill="none" stroke="#c0c4cc" stroke-width="1.5"/>
              </svg>
            </div>
          </div>
          <div class="card-info">
            <div class="card-title">{{ structure.id }}</div>
            <div class="card-measure">M{{ structure.startMeasure }}-{{ structure.endMeasure }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="navigation-buttons">
      <el-button size="large" @click="goBackToEditor">
        <el-icon><ArrowLeft /></el-icon>
        Back to Editor
      </el-button>
      <el-button type="primary" size="large" @click="proceedToExport">
        Proceed to Export
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch } from 'vue'
import { 
  ElButton, ElSlider, ElSelect, ElOption, ElIcon, ElTag
} from 'element-plus'
import { 
  VideoPlay, VideoPause, DArrowLeft, DArrowRight, RefreshLeft,
  Tickets, Headset, PictureFilled, Picture, Microphone, ArrowLeft, ArrowRight
} from '@element-plus/icons-vue'
import { 
  CircleCheck, Document, Star, Warning, Grid, Orange, CreditCard, CirclePlus
} from '@element-plus/icons-vue'
import { useMusicStore } from '@/stores/music'
import { useVisualStore } from '@/stores/visual'

const emit = defineEmits(['back-to-editor', 'proceed-to-export'])

const musicStore = useMusicStore()
const visualStore = useVisualStore()

// Audio element for playback
const audioElement = ref<HTMLAudioElement | null>(null)

// Playback state
const isPlaying = ref(false)
const currentStructureIndex = ref(0)
const playbackProgress = ref(0)
const volume = ref(80)
const playbackSpeed = ref(1)
const currentTime = ref(0)
let playbackInterval: number | null = null
let audioUpdateInterval: number | null = null

// Computed
const totalMeasures = computed(() => musicStore.musicData?.measures.length || 73)
const totalDuration = computed(() => musicStore.audioData?.duration || 265)

const currentMeasure = computed(() => {
  const structure = musicStore.phraseStructures[currentStructureIndex.value]
  return structure?.startMeasure || 1
})

const currentStructure = computed(() => {
  return musicStore.phraseStructures[currentStructureIndex.value] || null
})

const maxStructureIndex = computed(() => Math.max(0, musicStore.phraseStructures.length - 1))

// Initialize audio element
onMounted(() => {
  if (musicStore.audioData?.url) {
    audioElement.value = new Audio(musicStore.audioData.url)
    audioElement.value.volume = volume.value / 100
    audioElement.value.playbackRate = playbackSpeed.value
    
    // Listen for time updates
    audioElement.value.addEventListener('timeupdate', onAudioTimeUpdate)
    audioElement.value.addEventListener('ended', onAudioEnded)
  }
})

// Watch volume changes
watch(volume, (newVolume) => {
  if (audioElement.value) {
    audioElement.value.volume = newVolume / 100
  }
})

// Watch playback speed changes
watch(playbackSpeed, (newSpeed) => {
  if (audioElement.value) {
    audioElement.value.playbackRate = newSpeed
  }
})

// Audio time update handler - implements three-way sync
const onAudioTimeUpdate = () => {
  if (!audioElement.value) return
  
  currentTime.value = audioElement.value.currentTime
  playbackProgress.value = (currentTime.value / totalDuration.value) * 100
  
  // Find which structure corresponds to current time
  const newIndex = findStructureIndexByTime(currentTime.value)
  if (newIndex !== currentStructureIndex.value && newIndex >= 0) {
    currentStructureIndex.value = newIndex
  }
}

const onAudioEnded = () => {
  isPlaying.value = false
  stopPlayback()
}

// Find structure index by audio time
const findStructureIndexByTime = (time: number): number => {
  const structures = musicStore.phraseStructures
  for (let i = 0; i < structures.length; i++) {
    const structure = structures[i]
    const startTime = getStructureStartTime(structure)
    const endTime = getStructureEndTime(structure)
    if (time >= startTime && time < endTime) {
      return i
    }
  }
  return structures.length - 1
}

// Get structure start time in seconds
const getStructureStartTime = (structure: any): number => {
  if (structure.startTime !== undefined) return structure.startTime
  const measureDuration = totalDuration.value / totalMeasures.value
  return (structure.startMeasure - 1) * measureDuration
}

// Get structure end time in seconds
const getStructureEndTime = (structure: any): number => {
  if (structure.endTime !== undefined) return structure.endTime
  const measureDuration = totalDuration.value / totalMeasures.value
  return structure.endMeasure * measureDuration
}

// Methods
const getStructureIndex = (structureId: string) => {
  return musicStore.phraseStructures.findIndex(s => s.id === structureId)
}

const getStructureDuration = (structure: any) => {
  return structure.endMeasure - structure.startMeasure + 1
}

// Check if a structure has custom positions
const hasCustomPositions = (structureId: string): boolean => {
  const mapping = visualStore.getMapping(structureId)
  if (!mapping) return false
  return mapping.scheme.elements.some(el => el.position !== undefined)
}

// Get scaled position style for custom layout elements
const getScaledPositionStyle = (element: any, idx: number) => {
  if (element.position) {
    // Scale from drag canvas to card size (roughly 1/3)
    return {
      left: `${element.position.x / 3}px`,
      top: `${element.position.y / 3}px`
    }
  }
  // Default positioning
  return {
    left: `${10 + (idx % 3) * 25}px`,
    top: `${10 + Math.floor(idx / 3) * 25}px`
  }
}

const getShapeIcon = (shapeType: string) => {
  const shapes: Record<string, any> = {
    'circle': CircleCheck,
    'ellipse': CirclePlus,
    'square': Document,
    'rect': CreditCard,
    'triangle': Warning,
    'pentagon': Grid,
    'hexagon': Grid,
    'star': Star,
    'diamond': Orange,
  }
  return shapes[shapeType] || CircleCheck
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const togglePlayback = () => {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

const startPlayback = () => {
  isPlaying.value = true
  
  // If we have audio, play it
  if (audioElement.value) {
    audioElement.value.play()
  } else {
    // Fallback: simulate playback without audio
    const intervalTime = 2000 / playbackSpeed.value
    playbackInterval = window.setInterval(() => {
      if (currentStructureIndex.value < maxStructureIndex.value) {
        currentStructureIndex.value++
        updateProgress()
      } else {
        stopPlayback()
      }
    }, intervalTime)
  }
}

const stopPlayback = () => {
  isPlaying.value = false
  
  if (audioElement.value) {
    audioElement.value.pause()
  }
  
  if (playbackInterval) {
    clearInterval(playbackInterval)
    playbackInterval = null
  }
}

const resetPlayback = () => {
  stopPlayback()
  currentStructureIndex.value = 0
  playbackProgress.value = 0
  currentTime.value = 0
  
  if (audioElement.value) {
    audioElement.value.currentTime = 0
  }
}

const previousStructure = () => {
  if (currentStructureIndex.value > 0) {
    currentStructureIndex.value--
    syncAudioToStructure()
  }
}

const nextStructure = () => {
  if (currentStructureIndex.value < maxStructureIndex.value) {
    currentStructureIndex.value++
    syncAudioToStructure()
  }
}

// Three-way sync: Jump to structure and sync audio
const jumpToStructure = (index: number) => {
  currentStructureIndex.value = index
  syncAudioToStructure()
}

// Sync audio position to current structure
const syncAudioToStructure = () => {
  const structure = musicStore.phraseStructures[currentStructureIndex.value]
  if (!structure) return
  
  const startTime = getStructureStartTime(structure)
  currentTime.value = startTime
  playbackProgress.value = (startTime / totalDuration.value) * 100
  
  if (audioElement.value) {
    audioElement.value.currentTime = startTime
  }
}

const updateProgress = () => {
  const total = musicStore.phraseStructures.length
  playbackProgress.value = ((currentStructureIndex.value + 1) / total) * 100
  currentTime.value = (playbackProgress.value / 100) * totalDuration.value
}

const onProgressChange = (val: number) => {
  const newTime = (val / 100) * totalDuration.value
  currentTime.value = newTime
  
  // Find and set the corresponding structure
  const newIndex = findStructureIndexByTime(newTime)
  currentStructureIndex.value = newIndex
  
  if (audioElement.value) {
    audioElement.value.currentTime = newTime
  }
}

const goBackToEditor = () => {
  emit('back-to-editor')
}

const proceedToExport = () => {
  emit('proceed-to-export')
}

onUnmounted(() => {
  stopPlayback()
  
  // Clean up audio element
  if (audioElement.value) {
    audioElement.value.removeEventListener('timeupdate', onAudioTimeUpdate)
    audioElement.value.removeEventListener('ended', onAudioEnded)
    audioElement.value.pause()
    audioElement.value = null
  }
  
  if (audioUpdateInterval) {
    clearInterval(audioUpdateInterval)
    audioUpdateInterval = null
  }
})
</script>


<style scoped>
.playback-preview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Section Common Styles */
.section {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.measure-info,
.time-display {
  font-size: 14px;
  color: #909399;
}

/* Score View Section */
.score-timeline {
  display: flex;
  gap: 2px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.score-block {
  background: #e8eaed;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
  text-align: center;
}

.score-block:hover {
  background: #d4d7dc;
}

.score-block.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.score-block.past {
  background: #c0c4cc;
}

.block-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 4px;
}

.measure-range {
  font-size: 11px;
  opacity: 0.8;
}

.structure-name {
  font-size: 12px;
  font-weight: 500;
}

.block-emotion {
  margin-top: 4px;
}

.emotion-label {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.emotion-label.happy {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.emotion-label.peaceful {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.emotion-label.sad {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
}

.emotion-label.excited {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.emotion-label.tense {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.score-block.active .emotion-label {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Audio Section */
.audio-timeline {
  display: flex;
  gap: 1px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.audio-block {
  background: #f5f7fa;
  padding: 8px 4px;
  text-align: center;
  transition: all 0.3s;
  min-width: 60px;
}

.audio-block.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.audio-block.past {
  background: #c0c4cc;
}

.audio-label {
  font-size: 11px;
  color: #606266;
}

.audio-block.active .audio-label,
.audio-block.past .audio-label {
  color: white;
}

.progress-bar-container {
  padding: 0 8px;
  margin-bottom: 16px;
}

/* Playback Controls */
.playback-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.volume-control,
.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

/* Visual Music Map Section */
.visual-cards-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
}

.visual-card {
  flex-shrink: 0;
  width: 120px;
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.visual-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
}

.visual-card.active {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.visual-card.configured {
  border-color: #67c23a;
}

.card-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 80px;
  justify-content: center;
}

.visual-elements-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.standard-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.custom-layout-container {
  position: relative;
  width: 100%;
  height: 60px;
}

.display-element.custom-positioned {
  position: absolute;
  width: 20px;
  height: 20px;
}

.display-element {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.display-element.animating {
  animation: pulse-animation 1s infinite;
}

/* SVG Shape Elements */
.display-element-svg {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.display-element-svg.custom-positioned {
  position: absolute;
}

.shape-svg-small {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

/* Animation classes for SVG elements */
.display-element-svg.animating.pulse {
  animation: pulse-animation 1s infinite;
}

.display-element-svg.animating.flash {
  animation: flash-animation 1s infinite;
}

.display-element-svg.animating.rotate {
  animation: rotate-animation 2s linear infinite;
}

.display-element-svg.animating.bounce {
  animation: bounce-animation 1s infinite;
}

.display-element-svg.animating.scale {
  animation: scale-animation 1.2s infinite;
}

.display-element-svg.animating.shake {
  animation: shake-animation 0.5s infinite;
}

.display-element-svg.animating.fade {
  animation: fade-animation 1.5s infinite;
}

.element-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.empty-visual {
  color: #c0c4cc;
  font-size: 32px;
}

.wave-indicator {
  margin-top: 4px;
}

.wave-svg {
  width: 50px;
  height: 12px;
}

.card-info {
  margin-top: 8px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.card-measure {
  font-size: 11px;
  color: #909399;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

/* Animations */
@keyframes pulse-animation {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes flash-animation {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes rotate-animation {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce-animation {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes scale-animation {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes shake-animation {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes fade-animation {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive */
@media (max-width: 768px) {
  .playback-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .visual-cards-container {
    flex-wrap: nowrap;
  }
}
</style>
