/**
 * User Store
 * Manages user preferences and AI service status
 * Updated for @huggingface/transformers (no API key needed)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PreferenceLearner } from '@/services/PreferenceLearner'
import type { UserPreferences, UserAction } from '@/types'

export interface ModelStatus {
  isLoading: boolean
  isReady: boolean
  progress: number
  currentModel: string
  error: string | null
}

export const useUserStore = defineStore('user', () => {
  // State
  const preferenceLearner = ref<PreferenceLearner>(new PreferenceLearner())
  const modelStatus = ref<ModelStatus>({
    isLoading: false,
    isReady: false,
    progress: 0,
    currentModel: '',
    error: null
  })
  
  // Legacy compatibility - always return a dummy key since we don't need API keys anymore
  const apiKey = ref<string>('local-transformers')
  const isApiKeyDialogVisible = ref(false)

  // Getters
  const hasApiKey = computed(() => true) // Always true - no API key needed
  const preferences = computed<UserPreferences>(() => preferenceLearner.value.getPreferences())
  const isModelReady = computed(() => modelStatus.value.isReady)
  const isModelLoading = computed(() => modelStatus.value.isLoading)

  // Actions
  function updateModelStatus(status: Partial<ModelStatus>) {
    modelStatus.value = { ...modelStatus.value, ...status }
  }

  function setModelReady() {
    modelStatus.value = {
      isLoading: false,
      isReady: true,
      progress: 100,
      currentModel: 'Ready',
      error: null
    }
  }

  function setModelError(error: string) {
    modelStatus.value = {
      ...modelStatus.value,
      isLoading: false,
      error
    }
  }

  // Legacy API key functions (kept for compatibility, but no-op)
  function loadApiKey() {
    return true // Always return true
  }

  function saveApiKey(_key: string) {
    // No-op - we don't need API keys
    isApiKeyDialogVisible.value = false
  }

  function clearApiKey() {
    // No-op
  }

  function showApiKeyDialog() {
    // No-op - we don't show API key dialog anymore
    isApiKeyDialogVisible.value = false
  }

  function hideApiKeyDialog() {
    isApiKeyDialogVisible.value = false
  }

  // Preference learning functions
  function recordUserAction(action: UserAction) {
    preferenceLearner.value.recordAction(action)
  }

  function clearPreferences() {
    preferenceLearner.value.clearPreferences()
  }

  function getPreferenceStatistics() {
    return preferenceLearner.value.getStatistics()
  }

  return {
    // State
    apiKey,
    isApiKeyDialogVisible,
    modelStatus,
    
    // Getters
    hasApiKey,
    preferences,
    isModelReady,
    isModelLoading,
    
    // Actions
    updateModelStatus,
    setModelReady,
    setModelError,
    loadApiKey,
    saveApiKey,
    clearApiKey,
    showApiKeyDialog,
    hideApiKeyDialog,
    recordUserAction,
    clearPreferences,
    getPreferenceStatistics
  }
})
