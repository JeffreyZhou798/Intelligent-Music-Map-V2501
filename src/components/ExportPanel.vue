<template>
  <div class="export-panel">
    <!-- Export Options Section -->
    <div class="export-options-section">
      <h3>Export Options</h3>
      <div class="options-list">
        <div 
          v-for="option in exportOptions" 
          :key="option.id"
          class="option-item"
          :class="{ 'selected': selectedFormats.includes(option.id) }"
          @click="toggleFormat(option.id)"
        >
          <el-checkbox 
            :model-value="selectedFormats.includes(option.id)"
          />
          <div class="option-info">
            <span class="option-title">{{ option.title }}</span>
            <span class="option-desc">{{ option.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Summary Section -->
    <div class="project-summary-section">
      <h3>Project Summary</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Title</span>
          <span class="summary-value">{{ musicStore.musicData?.title || 'Untitled' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Composer</span>
          <span class="summary-value">{{ musicStore.musicData?.composer || 'Unknown' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Structures</span>
          <span class="summary-value">{{ musicStore.phraseStructures.length }} phrases</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Visual Mappings</span>
          <span class="summary-value">{{ completedMappings }} completed</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Form Type</span>
          <span class="summary-value">{{ musicStore.formType || 'Unknown' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Analysis Confidence</span>
          <span class="summary-value">100%</span>
        </div>
      </div>
    </div>

    <!-- Export Actions -->
    <div class="export-actions">
      <!-- Export Progress -->
      <div class="progress-container" v-if="isExporting || exportProgress > 0">
        <div class="progress-header">
          <span class="progress-label">{{ exportStatusText || 'Exporting...' }}</span>
          <span class="progress-percent">{{ exportProgress }}%</span>
        </div>
        <el-progress 
          :percentage="exportProgress" 
          :status="exportProgress === 100 ? 'success' : undefined"
          :stroke-width="8"
          :show-text="false"
        />
      </div>
      
      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          :loading="isExporting"
          :disabled="selectedFormats.length === 0 || isExporting"
          @click="handleExport"
        >
          <el-icon><Download /></el-icon>
          Export Music Visual Map
        </el-button>
        <el-button
          size="large"
          @click="startNew"
        >
          <el-icon><Plus /></el-icon>
          Start New Project
        </el-button>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="exportSuccess" class="success-alert">
      <el-alert
        title="Export Successful!"
        type="success"
        description="Your music visual map has been downloaded. Preference data has been cleared."
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElCheckbox, ElButton, ElIcon, ElProgress, ElAlert, ElNotification, ElMessageBox } from 'element-plus'
import { Download, Plus } from '@element-plus/icons-vue'
import { useMusicStore } from '@/stores/music'
import { useVisualStore } from '@/stores/visual'
import { useUserStore } from '@/stores/user'
import { FileService } from '@/services/FileService'
import { VisualizationService } from '@/services/VisualizationService'

const musicStore = useMusicStore()
const visualStore = useVisualStore()
const userStore = useUserStore()

// Export options
const exportOptions = [
  { id: 'html', title: 'Interactive HTML', description: 'Standalone file with animations (offline playable)' },
  { id: 'json', title: 'JSON Data', description: 'Machine-readable format for re-import' },
  { id: 'musicxml', title: 'Annotated MusicXML', description: 'Original score with structure annotations' },
  { id: 'svg', title: 'SVG Visual Map', description: 'Vector graphics of visual elements' },
  { id: 'preferences', title: 'Include Preferences', description: 'Save your visual preferences for next time' },
]

const selectedFormats = ref(['html', 'json', 'musicxml', 'svg'])
const isExporting = ref(false)
const exportSuccess = ref(false)
const exportProgress = ref(0)
const exportStatusText = ref('')

const completedMappings = computed(() => {
  return musicStore.phraseStructures.filter(s => visualStore.getMapping(s.id)).length
})

const toggleFormat = (formatId: string) => {
  const index = selectedFormats.value.indexOf(formatId)
  if (index >= 0) {
    selectedFormats.value.splice(index, 1)
  } else {
    selectedFormats.value.push(formatId)
  }
}

const handleExport = async () => {
  if (selectedFormats.value.length === 0) {
    ElNotification({
      title: 'No Format Selected',
      message: 'Please select at least one export format',
      type: 'warning',
      duration: 3000
    })
    return
  }

  isExporting.value = true
  exportProgress.value = 0
  exportStatusText.value = 'Preparing export...'

  try {
    let svgContent: string | undefined
    let pngBlob: Blob | undefined

    // Generate SVG if selected
    exportProgress.value = 20
    if (selectedFormats.value.includes('svg')) {
      exportStatusText.value = 'Generating SVG visual map...'
      svgContent = VisualizationService.generateSVG(
        visualStore.allMappings,
        musicStore.structures,
        musicStore.musicData?.title || 'Music Visual Map'
      )
      exportProgress.value = 40
    }

    // Create MVT package
    exportStatusText.value = 'Creating export package...'
    exportProgress.value = 60
    
    const blob = await FileService.exportMVT(
      musicStore.musicXMLContent,
      visualStore.allMappings,
      musicStore.structures,
      svgContent,
      pngBlob,
      {
        musicData: musicStore.musicData,
        formType: musicStore.formType,
        emotions: musicStore.emotions,
        similarityGroups: musicStore.similarityGroups
      }
    )
    
    exportProgress.value = 80

    // Download file
    exportStatusText.value = 'Downloading file...'
    const fileName = `${musicStore.musicData?.title || 'Untitled'}_export`
    FileService.downloadFile(blob, `${fileName}.zip`)
    exportProgress.value = 100

    exportStatusText.value = 'Export completed!'
    exportSuccess.value = true

    // Clear preferences after successful export
    userStore.clearPreferences()

    ElNotification({
      title: 'Export Successful',
      message: 'Your music visual map has been downloaded',
      type: 'success',
      duration: 5000
    })

  } catch (error) {
    exportProgress.value = 0
    ElNotification({
      title: 'Export Failed',
      message: error instanceof Error ? error.message : 'Failed to export file',
      type: 'error',
      duration: 0
    })
  } finally {
    isExporting.value = false
  }
}

const startNew = () => {
  ElMessageBox.confirm(
    'This will clear all current data and start a new project. Continue?',
    'Start New Project',
    {
      confirmButtonText: 'Yes, Start New',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  ).then(() => {
    // Reset all stores
    musicStore.clearMusicData()
    visualStore.clearAllMappings()
    userStore.clearPreferences()
    
    exportSuccess.value = false
    
    // Reload page to start fresh
    window.location.reload()
  }).catch(() => {
    // User cancelled
  })
}
</script>

<style scoped>
.export-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Export Options Section */
.export-options-section h3,
.project-summary-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.option-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 15px;
  font-weight: 500;
  color: #409eff;
}

.option-desc {
  font-size: 13px;
  color: #909399;
}

/* Project Summary Section */
.project-summary-section {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #e4e7ed;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: white;
}

.summary-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.summary-value {
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

/* Export Actions */
.export-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.progress-container {
  width: 100%;
  max-width: 400px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 13px;
  color: #0369a1;
  font-weight: 500;
}

.progress-percent {
  font-size: 14px;
  color: #0ea5e9;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

/* Success Alert */
.success-alert {
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
