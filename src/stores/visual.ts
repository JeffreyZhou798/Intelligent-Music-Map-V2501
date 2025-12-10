/**
 * Visual Store
 * Manages visual mappings and recommendations
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { VisualMapping, VisualScheme } from '@/types'

export const useVisualStore = defineStore('visual', () => {
  // State
  const mappings = ref<Map<string, VisualMapping>>(new Map())
  const recommendations = ref<Map<string, VisualScheme[]>>(new Map())
  const isGeneratingRecommendations = ref(false)

  // Getters
  const hasMappings = computed(() => mappings.value.size > 0)
  const allMappings = computed(() => Array.from(mappings.value.values()))

  // Actions
  function setMapping(structureId: string, mapping: VisualMapping) {
    mappings.value.set(structureId, mapping)
  }

  function getMapping(structureId: string): VisualMapping | undefined {
    return mappings.value.get(structureId)
  }

  function removeMapping(structureId: string) {
    mappings.value.delete(structureId)
  }

  function setRecommendations(structureId: string, schemes: VisualScheme[]) {
    recommendations.value.set(structureId, schemes)
  }

  function getRecommendations(structureId: string): VisualScheme[] {
    return recommendations.value.get(structureId) || []
  }

  function clearRecommendations(structureId: string) {
    recommendations.value.delete(structureId)
  }

  function setGeneratingRecommendations(generating: boolean) {
    isGeneratingRecommendations.value = generating
  }

  function clearAllMappings() {
    mappings.value.clear()
    recommendations.value.clear()
  }

  function loadMappings(loadedMappings: VisualMapping[]) {
    mappings.value.clear()
    loadedMappings.forEach(mapping => {
      mappings.value.set(mapping.structureId, mapping)
    })
  }

  return {
    // State
    mappings,
    recommendations,
    isGeneratingRecommendations,
    
    // Getters
    hasMappings,
    allMappings,
    
    // Actions
    setMapping,
    getMapping,
    removeMapping,
    setRecommendations,
    getRecommendations,
    clearRecommendations,
    setGeneratingRecommendations,
    clearAllMappings,
    loadMappings
  }
})
