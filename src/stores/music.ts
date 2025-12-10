/**
 * Music Store
 * Manages music data and analysis results
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MusicXMLData, MusicStructure, AudioFileData, StructureEmotion, SimilarityGroup } from '@/types'

export const useMusicStore = defineStore('music', () => {
  // State
  const musicData = ref<MusicXMLData | null>(null)
  const musicXMLContent = ref<string>('')
  const audioData = ref<AudioFileData | null>(null)
  const structures = ref<MusicStructure[]>([])
  const emotions = ref<StructureEmotion[]>([])
  const similarityGroups = ref<SimilarityGroup[]>([])
  const currentStructureId = ref<string | null>(null)
  const formType = ref<string | null>(null)
  const isAnalyzing = ref(false)
  const analysisProgress = ref(0) // 0-100

  // Getters
  const hasMusicData = computed(() => musicData.value !== null)
  const hasAudioData = computed(() => audioData.value !== null)
  const currentStructure = computed(() => {
    if (!currentStructureId.value) return null
    return structures.value.find(s => s.id === currentStructureId.value) || null
  })
  const phraseStructures = computed(() => {
    return structures.value.filter(s => s.level === 'phrase')
  })
  const structuresByEmotion = computed(() => {
    const grouped = new Map<string, MusicStructure[]>()
    structures.value.forEach(s => {
      if (s.emotion) {
        const key = s.emotion.primary
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key)!.push(s)
      }
    })
    return grouped
  })
  const structuresBySimilarity = computed(() => {
    const grouped = new Map<string, MusicStructure[]>()
    structures.value.forEach(s => {
      if (s.similarityGroup) {
        if (!grouped.has(s.similarityGroup)) {
          grouped.set(s.similarityGroup, [])
        }
        grouped.get(s.similarityGroup)!.push(s)
      }
    })
    return grouped
  })

  // Actions
  function setMusicData(data: MusicXMLData, xmlContent: string) {
    musicData.value = data
    musicXMLContent.value = xmlContent
  }

  function setAudioData(data: AudioFileData) {
    audioData.value = data
  }

  function setStructures(newStructures: MusicStructure[]) {
    structures.value = newStructures
  }

  function addStructure(structure: MusicStructure) {
    structures.value.push(structure)
  }

  function updateStructure(id: string, updates: Partial<MusicStructure>) {
    const index = structures.value.findIndex(s => s.id === id)
    if (index !== -1) {
      structures.value[index] = { ...structures.value[index], ...updates }
    }
  }

  function removeStructure(id: string) {
    structures.value = structures.value.filter(s => s.id !== id)
  }

  function setCurrentStructure(id: string | null) {
    currentStructureId.value = id
  }

  function setFormType(type: string) {
    formType.value = type
  }

  function setAnalyzing(analyzing: boolean) {
    isAnalyzing.value = analyzing
  }

  function setAnalysisProgress(progress: number) {
    analysisProgress.value = Math.min(100, Math.max(0, progress))
  }

  function setEmotions(newEmotions: StructureEmotion[]) {
    emotions.value = newEmotions
    // Update structures with emotion data
    newEmotions.forEach(emotion => {
      const structure = structures.value.find(s => s.id === emotion.structureId)
      if (structure) {
        structure.emotion = emotion
      }
    })
  }

  function setSimilarityGroups(groups: SimilarityGroup[]) {
    similarityGroups.value = groups
    // Update structures with similarity group data
    groups.forEach(group => {
      group.structureIds.forEach(id => {
        const structure = structures.value.find(s => s.id === id)
        if (structure) {
          structure.similarityGroup = group.groupId
        }
      })
    })
  }

  function clearMusicData() {
    musicData.value = null
    musicXMLContent.value = ''
    audioData.value = null
    structures.value = []
    emotions.value = []
    similarityGroups.value = []
    currentStructureId.value = null
    formType.value = null
    isAnalyzing.value = false
    analysisProgress.value = 0
  }

  return {
    // State
    musicData,
    musicXMLContent,
    audioData,
    structures,
    emotions,
    similarityGroups,
    currentStructureId,
    formType,
    isAnalyzing,
    analysisProgress,
    
    // Getters
    hasMusicData,
    hasAudioData,
    currentStructure,
    phraseStructures,
    structuresByEmotion,
    structuresBySimilarity,
    
    // Actions
    setMusicData,
    setAudioData,
    setStructures,
    addStructure,
    updateStructure,
    removeStructure,
    setCurrentStructure,
    setFormType,
    setAnalyzing,
    setAnalysisProgress,
    setEmotions,
    setSimilarityGroups,
    clearMusicData
  }
})
