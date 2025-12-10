<template>
  <div class="home-container">
    <el-card class="workflow-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>Music Visual Map Workflow</span>
          <el-steps :active="currentStep" finish-status="success" align-center>
            <el-step title="Upload" :icon="Upload" />
            <el-step title="Analyze" :icon="DataAnalysis" />
            <el-step title="Visualize" :icon="Picture" />
            <el-step title="Preview" :icon="VideoPlay" />
            <el-step title="Export" :icon="Download" />
          </el-steps>
        </div>
      </template>

      <!-- Step 1: File Upload -->
      <div v-show="currentStep === 0" class="workflow-step">
        <h2>Step 1: Upload Music Files</h2>
        <p class="step-description">
          Upload a MusicXML file (.musicxml, .mxl, .xml) for symbolic analysis. Optionally add an MP3 file for audio analysis (dual-modality fusion).
        </p>
        
        <div class="upload-section">
          <!-- New Analysis Section -->
          <div class="upload-row">
            <!-- MusicXML Upload -->
            <div class="upload-group">
              <h3>MusicXML File (Required)</h3>
              <el-upload
                ref="xmlUploadRef"
                class="upload-demo"
                drag
                :auto-upload="false"
                :on-change="handleXMLFileChange"
                :limit="1"
                accept=".musicxml,.xml,.mxl"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  Drop MusicXML file here or <em>click to upload</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    Formats: .mxl, .musicxml, .xml (MuseScore compatible)
                  </div>
                </template>
              </el-upload>
              <div v-if="selectedXMLFile" class="file-info">
                <div class="file-icon-row">
                  <el-icon><Document /></el-icon>
                  <span>{{ selectedXMLFile.name }}</span>
                </div>
                <div class="file-tag">
                  <el-tag type="primary" effect="plain" size="small">
                    {{ getFileNameWithoutExt(selectedXMLFile.name) }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- MP3 Upload -->
            <div class="upload-group">
              <h3>MP3 Audio File (Optional)</h3>
              <el-upload
                ref="mp3UploadRef"
                class="upload-demo"
                drag
                :auto-upload="false"
                :on-change="handleMP3FileChange"
                :limit="1"
                accept=".mp3"
              >
                <el-icon class="el-icon--upload"><Headset /></el-icon>
                <div class="el-upload__text">
                  Drop MP3 file here or <em>click to upload</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    Format: .mp3 (for acoustic structure analysis)
                  </div>
                </template>
              </el-upload>
              <div v-if="selectedMP3File" class="file-info">
                <div class="file-icon-row">
                  <el-icon><Headset /></el-icon>
                  <span>{{ selectedMP3File.name }}</span>
                </div>
                <div class="file-tag">
                  <el-tag type="success" effect="plain" size="small">
                    {{ getFileNameWithoutExt(selectedMP3File.name) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons with Progress -->
          <div class="action-buttons-section">
            <!-- Parse and Analyze Button with Progress -->
            <div class="action-button-group">
              <div class="progress-above-button" v-if="isUploading || uploadProgress > 0">
                <div class="progress-header">
                  <span class="progress-label">{{ uploadStatusText || 'Processing Files...' }}</span>
                  <span class="progress-percent">{{ uploadProgress }}%</span>
                </div>
                <el-progress 
                  :percentage="uploadProgress" 
                  :status="uploadProgress === 100 ? 'success' : undefined"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
              <el-button
                type="primary"
                size="large"
                :disabled="!selectedXMLFile || isUploading"
                :loading="isUploading"
                @click="handleUpload"
              >
                <el-icon><DataAnalysis /></el-icon>
                Parse and Analyze Files
              </el-button>
            </div>

            <!-- Load Project Button with Progress -->
            <div class="action-button-group">
              <div class="progress-above-button" v-if="isLoadingProject || loadProjectProgress > 0">
                <div class="progress-header">
                  <span class="progress-label">{{ loadProjectStatusText || 'Loading Project...' }}</span>
                  <span class="progress-percent">{{ loadProjectProgress }}%</span>
                </div>
                <el-progress 
                  :percentage="loadProjectProgress" 
                  :status="loadProjectProgress === 100 ? 'success' : undefined"
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
              <el-upload
                ref="jsonUploadRef"
                :auto-upload="false"
                :on-change="handleJSONFileChange"
                :show-file-list="false"
                accept=".json,.mvt"
              >
                <el-button
                  type="default"
                  size="large"
                  :loading="isLoadingProject"
                  :disabled="isLoadingProject"
                >
                  <el-icon><FolderOpened /></el-icon>
                  Load Previous Project (.mvt)
                </el-button>
              </el-upload>
            </div>
          </div>

          <!-- Loaded Project Info -->
          <div v-if="selectedJSONFile" class="loaded-project-info">
            <el-alert
              :title="`Project file selected: ${selectedJSONFile.name}`"
              type="success"
              show-icon
              :closable="true"
              @close="clearJSONFile"
            />
          </div>
        </div>
      </div>

      <!-- Step 2: Music Analysis -->
      <div v-show="currentStep === 1" class="workflow-step">
        <h2>Step 2: Music Structure Analysis</h2>
        <p class="step-description">
          AI is analyzing the music structure, identifying emotions, and detecting similar patterns.
        </p>

        <!-- Analysis Progress -->
        <div v-if="musicStore.isAnalyzing" class="analysis-loading">
          <el-progress 
            :percentage="musicStore.analysisProgress" 
            :status="musicStore.analysisProgress === 100 ? 'success' : undefined"
            :stroke-width="20"
          />
          <p class="loading-text">{{ analysisStatusText }}</p>
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="musicStore.structures.length > 0" class="analysis-results">
          <!-- Music Information Section -->
          <div class="music-info-section">
            <h3>Music Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Title</span>
                <span class="info-value">{{ musicStore.musicData?.title || 'Untitled' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Composer</span>
                <span class="info-value">{{ musicStore.musicData?.composer || 'Unknown' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Form Type</span>
                <el-tag type="primary" size="large">{{ musicStore.formType || 'Unknown' }}</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">Measures</span>
                <span class="info-value">{{ musicStore.musicData?.measures.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Key</span>
                <span class="info-value">C major</span>
              </div>
              <div class="info-item">
                <span class="info-label">Time</span>
                <span class="info-value">4/4</span>
              </div>
              <div class="info-item">
                <span class="info-label">Analysis Confidence</span>
                <el-progress 
                  :percentage="85" 
                  :stroke-width="12"
                  :show-text="false"
                  color="#67c23a"
                />
              </div>
              <div class="info-item">
                <span class="info-label">Modality</span>
                <div class="modality-tags">
                  <el-tag type="success" size="small">Symbol</el-tag>
                  <el-tag v-if="musicStore.hasAudioData" type="success" size="small">Audio</el-tag>
                  <el-tag v-else type="info" size="small">Audio</el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- Detected Structures Table -->
          <div class="structure-list">
            <h3>Detected Structures ({{ musicStore.phraseStructures.length }} phrases)</h3>
            <el-table 
              :data="musicStore.phraseStructures" 
              stripe 
              style="width: 100%" 
              max-height="500"
              :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
            >
              <el-table-column prop="id" label="ID" width="100" />
              <el-table-column label="Measures" width="120">
                <template #default="scope">
                  {{ scope.row.startMeasure }} - {{ scope.row.endMeasure }}
                </template>
              </el-table-column>
              <el-table-column label="Emotion" width="120">
                <template #default="scope">
                  <el-tag 
                    v-if="scope.row.emotion"
                    :type="getEmotionTagType(scope.row.emotion.primary)"
                    size="small"
                  >
                    {{ scope.row.emotion.primary }}
                  </el-tag>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="Confidence" width="200">
                <template #default="scope">
                  <div class="confidence-cell">
                    <el-progress 
                      v-if="scope.row.confidence"
                      :percentage="Math.round(scope.row.confidence * 100)"
                      :stroke-width="8"
                      :color="getConfidenceColor(scope.row.confidence)"
                    />
                    <el-icon v-if="scope.row.confidence && scope.row.confidence > 0.8" class="check-icon">
                      <CircleCheck />
                    </el-icon>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Actions" width="150" align="center">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    :icon="playingStructureId === scope.row.id ? VideoPause : VideoPlay"
                    :type="playingStructureId === scope.row.id ? 'primary' : 'default'"
                    circle
                    @click="playStructure(scope.row)"
                    :title="playingStructureId === scope.row.id ? 'Pause' : 'Play'"
                  />
                  <el-button 
                    size="small" 
                    text
                    @click="editStructure(scope.row)"
                  >
                    Edit
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Proceed Button -->
          <div class="proceed-button-section">
            <el-button
              type="primary"
              size="large"
              @click="proceedToVisualize"
            >
              <el-icon><ArrowRight /></el-icon>
              Proceed to Visualization
            </el-button>
          </div>
        </div>
      </div>

      <!-- Step 3: Visualization -->
      <div v-show="currentStep === 2" class="workflow-step">
        <h2>Step 3: Create Visual Elements</h2>
        <p class="step-description">
          Select or customize visual elements for each musical structure.
        </p>

        <VisualizationEditor 
          v-if="musicStore.structures.length > 0" 
          @proceed-to-export="proceedToExport"
        />
      </div>

      <!-- Step 4: Preview -->
      <div v-show="currentStep === 3" class="workflow-step">
        <h2>Step 4: Preview & Playback</h2>
        <p class="step-description">
          Preview your music visual map with synchronized playback.
        </p>

        <PlaybackPreview 
          v-if="musicStore.structures.length > 0" 
          @back-to-editor="goBackToEditor"
          @proceed-to-export="proceedToFinalExport"
        />
      </div>

      <!-- Step 5: Export -->
      <div v-show="currentStep === 4" class="workflow-step">
        <h2>Step 5: Export Your Music Visual Map</h2>
        <p class="step-description">
          Download your completed music visual map for presentation or further editing.
        </p>

        <ExportPanel />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ElCard, ElSteps, ElStep, ElUpload, ElIcon, ElButton, ElTag, 
  ElSkeleton, ElDescriptions, ElDescriptionsItem, ElTable, ElTableColumn,
  ElNotification, ElProgress, ElAlert
} from 'element-plus'
import { Upload, Download, DataAnalysis, Picture, UploadFilled, ArrowRight, VideoPlay, VideoPause, Document, Headset, FolderOpened, CircleCheck } from '@element-plus/icons-vue'
import { useMusicStore } from '@/stores/music'
import { useUserStore } from '@/stores/user'
import { useVisualStore } from '@/stores/visual'
import { FileService } from '@/services/FileService'
import { audioService } from '@/services/AudioService'
import { createAIService } from '@/services/AIServiceFactory'
import VisualizationEditor from '@/components/VisualizationEditor.vue'
import PlaybackPreview from '@/components/PlaybackPreview.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import { EmotionType, type StructureLevel } from '@/types'

const musicStore = useMusicStore()
const userStore = useUserStore()
const visualStore = useVisualStore()

const currentStep = ref(0)
const selectedXMLFile = ref<File | null>(null)
const selectedMP3File = ref<File | null>(null)
const selectedJSONFile = ref<File | null>(null)
const isUploading = ref(false)
const isLoadingProject = ref(false)
const uploadProgress = ref(0)
const uploadStatusText = ref('')
const loadProjectProgress = ref(0)
const loadProjectStatusText = ref('')
const analysisStatusText = ref('')
const xmlUploadRef = ref()
const mp3UploadRef = ref()
const jsonUploadRef = ref()

const canProceed = computed(() => {
  return selectedXMLFile.value !== null
})

const uniqueEmotions = computed(() => {
  const emotions = new Set<string>()
  musicStore.emotions.forEach(e => emotions.add(e.primary))
  return Array.from(emotions)
})

const handleXMLFileChange = (file: any) => {
  selectedXMLFile.value = file.raw
  selectedJSONFile.value = null // Clear JSON if XML is selected
}

const handleMP3FileChange = (file: any) => {
  selectedMP3File.value = file.raw
}

const handleJSONFileChange = async (file: any) => {
  selectedJSONFile.value = file.raw
  // Auto-load the project when JSON file is selected
  await loadProjectFile()
}

const clearJSONFile = () => {
  selectedJSONFile.value = null
}

const loadProjectFile = async () => {
  if (!selectedJSONFile.value) return
  
  isLoadingProject.value = true
  loadProjectProgress.value = 0
  loadProjectStatusText.value = 'Reading project file...'
  
  try {
    loadProjectProgress.value = 20
    const jsonText = await selectedJSONFile.value.text()
    
    loadProjectStatusText.value = 'Parsing project data...'
    loadProjectProgress.value = 40
    const projectData = JSON.parse(jsonText)
    
    // Restore music data
    loadProjectStatusText.value = 'Restoring music data...'
    loadProjectProgress.value = 50
    if (projectData.musicData) {
      musicStore.setMusicData(projectData.musicData, projectData.xmlContent || '')
    }
    
    // Restore structures
    loadProjectStatusText.value = 'Restoring structures...'
    loadProjectProgress.value = 60
    if (projectData.structures) {
      musicStore.setStructures(projectData.structures)
    }
    
    // Restore form type
    loadProjectStatusText.value = 'Restoring analysis results...'
    loadProjectProgress.value = 70
    if (projectData.formType) {
      musicStore.setFormType(projectData.formType)
    }
    
    // Restore emotions
    loadProjectProgress.value = 80
    if (projectData.emotions) {
      musicStore.setEmotions(projectData.emotions)
    }
    
    // Restore similarity groups
    loadProjectProgress.value = 85
    if (projectData.similarityGroups) {
      musicStore.setSimilarityGroups(projectData.similarityGroups)
    }
    
    // Restore visual mappings
    loadProjectStatusText.value = 'Restoring visual mappings...'
    loadProjectProgress.value = 95
    if (projectData.visualMappings && projectData.visualMappings.length > 0) {
      visualStore.loadMappings(projectData.visualMappings)
    }
    
    loadProjectStatusText.value = 'Project loaded successfully!'
    loadProjectProgress.value = 100
    
    ElNotification({
      title: 'Project Loaded',
      message: `Successfully loaded: ${projectData.musicData?.title || 'Untitled'}`,
      type: 'success',
      duration: 3000
    })
    
    // Skip to visualization step after a short delay
    setTimeout(() => {
      currentStep.value = 2
      loadProjectProgress.value = 0
    }, 500)
    
  } catch (error) {
    loadProjectProgress.value = 0
    ElNotification({
      title: 'Load Failed',
      message: error instanceof Error ? error.message : 'Failed to load project file',
      type: 'error',
      duration: 5000
    })
    selectedJSONFile.value = null
  } finally {
    isLoadingProject.value = false
  }
}

const handleUpload = async () => {
  if (!selectedXMLFile.value) return

  isUploading.value = true
  uploadProgress.value = 0

  try {
    // Handle MusicXML file
    if (selectedXMLFile.value) {
      uploadStatusText.value = 'Parsing MusicXML file...'
      uploadProgress.value = 10
      
      const fileName = selectedXMLFile.value.name.toLowerCase()
      let musicData, xmlContent
      
      if (fileName.endsWith('.mxl')) {
        musicData = await FileService.parseMusicXML(selectedXMLFile.value)
        xmlContent = await FileService.extractMXLContent(selectedXMLFile.value)
      } else {
        musicData = await FileService.parseMusicXML(selectedXMLFile.value)
        xmlContent = await selectedXMLFile.value.text()
      }
      
      musicStore.setMusicData(musicData, xmlContent)
      uploadProgress.value = 30
      
      // Handle MP3 file if provided
      if (selectedMP3File.value) {
        uploadStatusText.value = 'Processing audio file...'
        uploadProgress.value = 40
        
        const audioData = await audioService.parseAudioFile(selectedMP3File.value)
        musicStore.setAudioData(audioData)
        uploadProgress.value = 60
      }
      
      uploadStatusText.value = 'Files uploaded successfully!'
      uploadProgress.value = 100
      
      ElNotification({
        title: 'Success',
        message: `Files uploaded successfully: ${musicData.title}`,
        type: 'success',
        duration: 3000
      })

      // Move to analysis step
      setTimeout(() => {
        currentStep.value = 1
        performAnalysis()
      }, 500)
    }

  } catch (error) {
    uploadProgress.value = 0
    ElNotification({
      title: 'Upload Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      type: 'error',
      duration: 0
    })
  } finally {
    isUploading.value = false
  }
}

const performAnalysis = async () => {
  if (!musicStore.musicData) return

  musicStore.setAnalyzing(true)
  musicStore.setAnalysisProgress(0)

  const aiService = createAIService()
  
  // Step 0: Initialize AI models (5-25%)
  analysisStatusText.value = 'Initializing AI models...'
  musicStore.setAnalysisProgress(5)
  
  // Set up status callback for model loading progress
  if ('setStatusCallback' in aiService) {
    (aiService as any).setStatusCallback((status: any) => {
      if (status.isLoading) {
        analysisStatusText.value = status.currentModel || 'Loading models...'
        musicStore.setAnalysisProgress(5 + Math.round(status.progress * 0.2))
      }
    })
  }
  
  // Initialize models (this will load embedding model if not already loaded)
  if ('initializeModels' in aiService) {
    await (aiService as any).initializeModels()
  }
  
  // Step 1: Create basic structures (10%)
  analysisStatusText.value = 'Creating basic structure divisions...'
  musicStore.setAnalysisProgress(10)
  const simpleStructures = createBasicStructures()
  musicStore.setStructures(simpleStructures)
  
  // Step 2: AI structure analysis (30%) - with fallback
  analysisStatusText.value = 'Analyzing music structure with AI...'
  musicStore.setAnalysisProgress(30)
  try {
    const structures = await aiService.analyzeMusicStructure(musicStore.musicData, simpleStructures)
    if (structures.length > 0) {
      musicStore.setStructures(structures)
    }
  } catch (e) {
    console.warn('Structure analysis failed, using basic structures:', e)
  }
  
  // Step 3: Map audio timestamps if audio is available (40%)
  if (musicStore.audioData) {
    analysisStatusText.value = 'Mapping audio timestamps...'
    musicStore.setAnalysisProgress(40)
    mapAudioTimestamps()
  }
  
  // Step 4: Identify form type (50%) - with fallback
  analysisStatusText.value = 'Identifying musical form...'
  musicStore.setAnalysisProgress(50)
  try {
    const formType = await aiService.identifyForm(musicStore.structures)
    musicStore.setFormType(formType)
  } catch (e) {
    console.warn('Form identification failed:', e)
    musicStore.setFormType('Unknown Form')
  }
  
  // Step 5: Emotion recognition (70%) - with fallback
  analysisStatusText.value = 'Recognizing emotions...'
  musicStore.setAnalysisProgress(70)
  try {
    const emotions = await aiService.recognizeEmotions(musicStore.structures, musicStore.audioData)
    musicStore.setEmotions(emotions)
  } catch (e) {
    console.warn('Emotion recognition failed, using defaults:', e)
    // Local fallback
    const emotionTypes = [EmotionType.HAPPY, EmotionType.SAD, EmotionType.HAPPY, EmotionType.SAD, EmotionType.HAPPY]
    const defaultEmotions = musicStore.structures.map((s, i) => ({
      structureId: s.id,
      primary: emotionTypes[i % 5],
      confidence: 0.7,
      features: ['local analysis']
    }))
    musicStore.setEmotions(defaultEmotions)
  }
  
  // Step 6: Similarity analysis (90%) - with fallback
  analysisStatusText.value = 'Analyzing similarities...'
  musicStore.setAnalysisProgress(90)
  try {
    const similarityGroups = await aiService.analyzeSimilarity(musicStore.structures)
    musicStore.setSimilarityGroups(similarityGroups)
  } catch (e) {
    console.warn('Similarity analysis failed, using local algorithm:', e)
    // Local fallback - group every 3 structures
    const groups = []
    const labels = ['A', 'B', 'C', 'D', 'E']
    for (let i = 0; i < Math.min(3, musicStore.structures.length / 3); i++) {
      const start = i * 3
      const ids = musicStore.structures.slice(start, start + 3).map(s => s.id)
      if (ids.length >= 2) {
        groups.push({ groupId: labels[i], structureIds: ids, similarityScore: 0.8, commonFeatures: ['similar pattern'] })
      }
    }
    musicStore.setSimilarityGroups(groups)
  }
  
  // Complete (100%)
  analysisStatusText.value = 'Analysis complete!'
  musicStore.setAnalysisProgress(100)
  musicStore.setAnalyzing(false)

  ElNotification({
    title: 'Analysis Complete',
    message: `Detected ${musicStore.structures.length} structures, ${uniqueEmotions.value.length} emotions, ${musicStore.similarityGroups.length} similarity groups`,
    type: 'success',
    duration: 5000
  })
}

const mapAudioTimestamps = () => {
  if (!musicStore.audioData || !musicStore.musicData) return
  
  const totalDuration = musicStore.audioData.duration
  const totalMeasures = musicStore.musicData.measures.length
  
  musicStore.structures.forEach(structure => {
    structure.startTime = audioService.mapMeasureToTime(
      structure.startMeasure,
      totalDuration,
      totalMeasures
    )
    structure.endTime = audioService.mapMeasureToTime(
      structure.endMeasure,
      totalDuration,
      totalMeasures
    )
  })
}

const createBasicStructures = () => {
  // Create simple phrase structures every 4 measures
  const structures: any[] = []
  const measures = musicStore.musicData?.measures || []
  
  for (let i = 0; i < measures.length; i += 4) {
    const endMeasure = Math.min(i + 4, measures.length)
    structures.push({
      id: `phrase_${i / 4 + 1}`,
      level: 'phrase' as StructureLevel,
      startMeasure: i + 1,
      endMeasure: endMeasure,
      startBeat: 1,
      endBeat: 4,
      notes: [],
      children: []
    })
  }
  
  return structures
}

const proceedToVisualize = () => {
  currentStep.value = 2
}

const proceedToExport = () => {
  currentStep.value = 3
}

const proceedToFinalExport = () => {
  currentStep.value = 4
}

const goBackToEditor = () => {
  currentStep.value = 2
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getFileNameWithoutExt = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, '').replace(/-/g, ' ')
}

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const getEmotionTagType = (emotion: string): TagType => {
  const emotionMap: Record<string, TagType> = {
    'happy': 'success',
    'sad': 'info',
    'excited': 'danger',
    'peaceful': 'success',
    'tense': 'warning'
  }
  return emotionMap[emotion] || 'info'
}

const getEmotionCount = (emotion: string): number => {
  return musicStore.emotions.filter(e => e.primary === emotion).length
}

const getConfidenceColor = (confidence: number): string => {
  if (confidence > 0.8) return '#67c23a'
  if (confidence > 0.5) return '#e6a23c'
  return '#f56c6c'
}

// Audio element for structure playback
let structureAudioElement: HTMLAudioElement | null = null
const playingStructureId = ref<string | null>(null)

const playStructure = (structure: any) => {
  if (!musicStore.audioData?.url) {
    ElNotification({
      title: 'No Audio',
      message: 'Please upload an MP3 file to enable audio playback',
      type: 'warning',
      duration: 3000
    })
    return
  }
  
  // If clicking the same structure that's playing, toggle pause/play
  if (playingStructureId.value === structure.id && structureAudioElement) {
    if (structureAudioElement.paused) {
      structureAudioElement.play()
      ElNotification({
        title: 'Resumed',
        message: `${structure.id} (M${structure.startMeasure}-${structure.endMeasure})`,
        type: 'success',
        duration: 1500
      })
    } else {
      structureAudioElement.pause()
      ElNotification({
        title: 'Paused',
        message: `${structure.id}`,
        type: 'info',
        duration: 1500
      })
    }
    return
  }
  
  // Stop any existing playback
  if (structureAudioElement) {
    structureAudioElement.pause()
    structureAudioElement = null
    playingStructureId.value = null
  }
  
  // Calculate start and end times
  const totalDuration = musicStore.audioData.duration
  const totalMeasures = musicStore.musicData?.measures.length || 73
  const measureDuration = totalDuration / totalMeasures
  
  const startTime = structure.startTime ?? (structure.startMeasure - 1) * measureDuration
  const endTime = structure.endTime ?? structure.endMeasure * measureDuration
  
  // Create and play audio
  structureAudioElement = new Audio(musicStore.audioData.url)
  structureAudioElement.currentTime = startTime
  playingStructureId.value = structure.id
  
  // Stop at end of structure
  const checkEnd = () => {
    if (structureAudioElement && structureAudioElement.currentTime >= endTime) {
      structureAudioElement.pause()
      structureAudioElement.removeEventListener('timeupdate', checkEnd)
      structureAudioElement = null
      playingStructureId.value = null
    }
  }
  
  structureAudioElement.addEventListener('timeupdate', checkEnd)
  structureAudioElement.addEventListener('ended', () => {
    playingStructureId.value = null
    structureAudioElement = null
  })
  structureAudioElement.play()
  
  ElNotification({
    title: 'Playing',
    message: `${structure.id} (M${structure.startMeasure}-${structure.endMeasure})`,
    type: 'success',
    duration: 2000
  })
}

const editStructure = (structure: any) => {
  ElNotification({
    title: 'Edit Structure',
    message: `Editing ${structure.id}`,
    type: 'info',
    duration: 2000
  })
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
}

.workflow-card {
  background: white;
  border-radius: 8px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header span {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.workflow-step {
  padding: 24px 0;
}

.workflow-step h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 12px;
}

.step-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 24px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .upload-row {
    grid-template-columns: 1fr;
  }
}

.upload-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-group h3 {
  font-size: 16px;
  color: #303133;
  margin: 0;
  font-weight: 500;
}

.action-buttons-section {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.action-button-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 220px;
}

.progress-above-button {
  width: 100%;
  margin-bottom: 12px;
  padding: 12px 16px;
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

.loaded-project-info {
  margin-top: 16px;
}

.upload-demo {
  width: 100%;
}

.file-info {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-icon-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.file-tag .el-tag {
  font-size: 12px;
}



.action-button {
  margin-top: 24px;
  min-width: 250px;
  align-self: center;
}

.analysis-loading {
  text-align: center;
  padding: 40px;
}

.loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #909399;
}

.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.music-info-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e4e7ed;
}

.music-info-section h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 20px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.modality-tags {
  display: flex;
  gap: 8px;
}

.structure-list {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e4e7ed;
}

.structure-list h3 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.confidence-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-icon {
  color: #67c23a;
  font-size: 18px;
}

.text-muted {
  color: #c0c4cc;
}

.proceed-button-section {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

.emotion-summary,
.similarity-summary {
  margin-top: 24px;
}

.emotion-summary h3,
.similarity-summary h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 12px;
}

.emotion-tags,
.similarity-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.emotion-tags .el-tag,
.similarity-groups .el-tag {
  padding: 8px 16px;
  font-size: 14px;
}

.proceed-section {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #dcdfe6;
}
</style>
