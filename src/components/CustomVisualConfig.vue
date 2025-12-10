<template>
  <div class="custom-visual-config">
    <el-card>
      <template #header>
        <h3>Custom Visual Configuration</h3>
      </template>

      <div class="config-sections">
        <!-- Shape Selection -->
        <div class="config-section">
          <h4>1. Select Shapes (Click in order)</h4>
          <p class="section-description">Choose shapes to represent musical elements. Click shapes in the order you want them to appear.</p>
          
          <div class="shape-grid">
            <div 
              v-for="shape in availableShapes" 
              :key="shape.id"
              class="shape-option"
              :class="{ 
                'selected': isShapeSelected(shape.id),
                'disabled': !canSelectMore && !isShapeSelected(shape.id)
              }"
              @click="toggleShape(shape)"
            >
              <div class="shape-preview" :class="`shape-${shape.id}`">
                <component :is="getShapeIcon(shape.id)" class="shape-icon" />
              </div>
              <div class="shape-label">{{ shape.name }}</div>
              <div v-if="isShapeSelected(shape.id)" class="selection-order">
                {{ getSelectionOrder(shape.id) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Color Selection -->
        <div class="config-section">
          <h4>2. Select Colors (Click in order)</h4>
          <p class="section-description">Choose colors for your shapes. Click colors in the order they will be applied to shapes.</p>
          
          <div class="color-grid">
            <div 
              v-for="color in availableColors" 
              :key="color.id"
              class="color-option"
              :class="{ 
                'selected': isColorSelected(color.id),
                'disabled': !canSelectMoreColors && !isColorSelected(color.id)
              }"
              @click="toggleColor(color)"
            >
              <div class="color-preview" :style="{ backgroundColor: color.hex }"></div>
              <div class="color-label">{{ color.name }}</div>
              <div v-if="isColorSelected(color.id)" class="selection-order">
                {{ getColorSelectionOrder(color.id) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div v-if="selectedShapes.length > 0 && selectedColors.length > 0" class="config-section preview-section">
          <h4>3. Preview Visual Combination</h4>
          <p class="section-description">This is how your visual elements will appear for each music structure.</p>
          
          <div class="preview-container">
            <div 
              v-for="(shape, index) in selectedShapes" 
              :key="index"
              class="preview-element"
            >
              <div 
                class="preview-shape" 
                :class="`shape-${shape.id}`"
                :style="{ 
                  backgroundColor: getColorForIndex(index),
                  borderColor: getColorForIndex(index)
                }"
              >
                <component :is="getShapeIcon(shape.id)" class="preview-icon" />
              </div>
              <div class="preview-label">
                {{ shape.name }} - {{ getColorNameForIndex(index) }}
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <el-button @click="resetSelection" size="large">
              <el-icon><Refresh /></el-icon>
              Reset Selection
            </el-button>
            <el-button 
              type="primary" 
              size="large"
              @click="applyConfiguration"
              :disabled="!isConfigurationValid"
            >
              <el-icon><Check /></el-icon>
              Apply to Structure
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElCard, ElButton, ElIcon, ElNotification } from 'element-plus'
import { 
  Check, Refresh, CircleCheck, Document, Star, 
  Histogram, TrendCharts, Warning, Connection,
  CreditCard, Grid, Orange
} from '@element-plus/icons-vue'

interface ShapeOption {
  id: string
  name: string
  icon: any
}

interface ColorOption {
  id: string
  name: string
  hex: string
}

const props = defineProps<{
  structureId: string
  maxElements?: number
}>()

const emit = defineEmits<{
  (e: 'apply', config: { shapes: ShapeOption[], colors: ColorOption[] }): void
}>()

// Available shapes (10 options)
const availableShapes = ref<ShapeOption[]>([
  { id: 'circle', name: 'Circle', icon: CircleCheck },
  { id: 'square', name: 'Square', icon: Document },
  { id: 'star', name: 'Star', icon: Star },
  { id: 'triangle', name: 'Triangle', icon: Warning },
  { id: 'wave', name: 'Wave', icon: TrendCharts },
  { id: 'diamond', name: 'Diamond', icon: Orange },
  { id: 'hexagon', name: 'Hexagon', icon: Grid },
  { id: 'bar', name: 'Bar', icon: Histogram },
  { id: 'line', name: 'Line', icon: Connection },
  { id: 'rect', name: 'Rectangle', icon: CreditCard }
])

// Available colors (10 options)
const availableColors = ref<ColorOption[]>([
  { id: 'red', name: 'Red', hex: '#FF6B6B' },
  { id: 'blue', name: 'Blue', hex: '#4ECDC4' },
  { id: 'green', name: 'Green', hex: '#2ECC71' },
  { id: 'yellow', name: 'Yellow', hex: '#F39C12' },
  { id: 'purple', name: 'Purple', hex: '#9B59B6' },
  { id: 'orange', name: 'Orange', hex: '#E67E22' },
  { id: 'pink', name: 'Pink', hex: '#FF85C0' },
  { id: 'teal', name: 'Teal', hex: '#16A085' },
  { id: 'indigo', name: 'Indigo', hex: '#5C7CFA' },
  { id: 'coral', name: 'Coral', hex: '#FA8072' }
])

const selectedShapes = ref<ShapeOption[]>([])
const selectedColors = ref<ColorOption[]>([])
const maxElementsAllowed = computed(() => props.maxElements || 5)

const canSelectMore = computed(() => selectedShapes.value.length < maxElementsAllowed.value)
const canSelectMoreColors = computed(() => selectedColors.value.length < maxElementsAllowed.value)

const isShapeSelected = (shapeId: string) => {
  return selectedShapes.value.some(s => s.id === shapeId)
}

const isColorSelected = (colorId: string) => {
  return selectedColors.value.some(c => c.id === colorId)
}

const getSelectionOrder = (shapeId: string) => {
  const index = selectedShapes.value.findIndex(s => s.id === shapeId)
  return index >= 0 ? `#${index + 1}` : ''
}

const getColorSelectionOrder = (colorId: string) => {
  const index = selectedColors.value.findIndex(c => c.id === colorId)
  return index >= 0 ? `#${index + 1}` : ''
}

const toggleShape = (shape: ShapeOption) => {
  const index = selectedShapes.value.findIndex(s => s.id === shape.id)
  
  if (index >= 0) {
    // Remove if already selected
    selectedShapes.value.splice(index, 1)
  } else if (canSelectMore.value) {
    // Add if not at max
    selectedShapes.value.push(shape)
  } else {
    ElNotification({
      title: 'Maximum Reached',
      message: `You can select up to ${maxElementsAllowed.value} shapes`,
      type: 'warning',
      duration: 2000
    })
  }
}

const toggleColor = (color: ColorOption) => {
  const index = selectedColors.value.findIndex(c => c.id === color.id)
  
  if (index >= 0) {
    // Remove if already selected
    selectedColors.value.splice(index, 1)
  } else if (canSelectMoreColors.value) {
    // Add if not at max
    selectedColors.value.push(color)
  } else {
    ElNotification({
      title: 'Maximum Reached',
      message: `You can select up to ${maxElementsAllowed.value} colors`,
      type: 'warning',
      duration: 2000
    })
  }
}

const getColorForIndex = (index: number) => {
  if (index < selectedColors.value.length) {
    return selectedColors.value[index].hex
  }
  return '#CCCCCC'
}

const getColorNameForIndex = (index: number) => {
  if (index < selectedColors.value.length) {
    return selectedColors.value[index].name
  }
  return 'Default'
}

const getShapeIcon = (shapeId: string) => {
  const shape = availableShapes.value.find(s => s.id === shapeId)
  return shape?.icon || CircleCheck
}

const isConfigurationValid = computed(() => {
  return selectedShapes.value.length > 0 && 
         selectedColors.value.length > 0 &&
         selectedShapes.value.length === selectedColors.value.length
})

const resetSelection = () => {
  selectedShapes.value = []
  selectedColors.value = []
}

const applyConfiguration = () => {
  if (!isConfigurationValid.value) {
    ElNotification({
      title: 'Invalid Configuration',
      message: 'Please select the same number of shapes and colors',
      type: 'warning',
      duration: 3000
    })
    return
  }

  emit('apply', {
    shapes: selectedShapes.value,
    colors: selectedColors.value
  })

  ElNotification({
    title: 'Configuration Applied',
    message: 'Custom visual configuration has been applied successfully',
    type: 'success',
    duration: 2000
  })
}
</script>

<style scoped>
.custom-visual-config {
  margin-top: 24px;
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section h4 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-description {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

/* Shape Grid */
.shape-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.shape-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #DCDFE6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.shape-option:hover:not(.disabled) {
  border-color: #409EFF;
  background-color: #F0F9FF;
  transform: translateY(-2px);
}

.shape-option.selected {
  border-color: #67C23A;
  background-color: #F0F9FF;
}

.shape-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shape-preview {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #F5F7FA;
}

.shape-icon {
  width: 40px;
  height: 40px;
  color: #606266;
}

.shape-label {
  font-size: 12px;
  color: #606266;
  text-align: center;
}

.selection-order {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background-color: #67C23A;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

/* Color Grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #DCDFE6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.color-option:hover:not(.disabled) {
  border-color: #409EFF;
  background-color: #F5F7FA;
  transform: translateY(-2px);
}

.color-option.selected {
  border-color: #67C23A;
  background-color: #F5F7FA;
}

.color-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid #E4E7ED;
}

.color-label {
  font-size: 12px;
  color: #606266;
  text-align: center;
}

/* Preview Section */
.preview-section {
  background-color: #F5F7FA;
  padding: 20px;
  border-radius: 8px;
}

.preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-element {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-shape {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 3px solid;
  transition: transform 0.3s;
}

.preview-shape:hover {
  transform: scale(1.1);
}

.preview-icon {
  width: 50px;
  height: 50px;
  color: white;
}

.preview-label {
  font-size: 12px;
  color: #606266;
  text-align: center;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
