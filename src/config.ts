/**
 * Application Configuration
 * Updated for @huggingface/transformers local inference
 */

// Detect environment
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

export const config = {
  /**
   * AI Model Configuration
   * Using @huggingface/transformers for local browser-based inference
   */
  ai: {
    // Embedding model for semantic search
    EMBEDDING_MODEL: 'Xenova/all-MiniLM-L6-v2',
    EMBEDDING_MODEL_SIZE: '23MB',
    
    // Audio model options (for future audio analysis)
    AUDIO_MODEL_FULL: 'facebook/wav2vec2-base-960h',
    AUDIO_MODEL_FULL_SIZE: '360MB',
    AUDIO_MODEL_LITE: 'openai/whisper-tiny',
    AUDIO_MODEL_LITE_SIZE: '39MB',
    
    // Model loading settings
    USE_BROWSER_CACHE: true,
    LAZY_LOAD: true, // Load models only when needed
    
    // Performance settings
    MAX_SEQUENCE_LENGTH: 512,
    BATCH_SIZE: 1
  },

  /**
   * Knowledge Base Configuration
   */
  knowledgeBase: {
    // Number of rules to retrieve for each query
    TOP_K_RULES: 5,
    // Minimum similarity threshold
    MIN_SIMILARITY: 0.3
  },

  /**
   * Development settings
   */
  dev: {
    ENABLE_LOGS: true,
    ENABLE_MOCK_MODE: false // Set to true to use mock service for testing
  },

  /**
   * Environment info
   */
  env: {
    isVercel,
    isLocalhost,
    isDevelopment: isLocalhost
  },

  /**
   * Performance settings based on device capabilities
   */
  performance: {
    // Detect device memory (in GB)
    getDeviceMemory: (): number => {
      if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
        return (navigator as any).deviceMemory || 4
      }
      return 4 // Default assumption
    },
    
    // Determine model tier based on device
    getModelTier: (): 'full' | 'standard' | 'lite' => {
      const memory = config.performance.getDeviceMemory()
      const isMobile = typeof navigator !== 'undefined' && 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (memory >= 8 && !isMobile) return 'full'
      if (memory >= 4) return 'standard'
      return 'lite'
    }
  },

  /**
   * Visual scheme configuration
   */
  visual: {
    // Default number of recommendations
    DEFAULT_RECOMMENDATIONS: 5,
    
    // Animation settings
    DEFAULT_ANIMATION_DURATION: 1000,
    MIN_ANIMATION_DURATION: 200,
    MAX_ANIMATION_DURATION: 5000,
    
    // Color palettes
    WARM_COLORS: ['#FF6B6B', '#FF8E53', '#FFA600', '#FF4757', '#FF6348'],
    COOL_COLORS: ['#4ECDC4', '#45B7D1', '#96CEB4', '#74B9FF', '#81ECEC'],
    TENSE_COLORS: ['#A04668', '#D84797', '#8E44AD', '#9B59B6', '#6C5CE7'],
    BALANCED_COLORS: ['#3498DB', '#2ECC71', '#F39C12', '#1ABC9C', '#E74C3C']
  }
}

/**
 * Get recommended model based on device capabilities
 */
export function getRecommendedAudioModel(): { model: string; size: string } {
  const tier = config.performance.getModelTier()
  
  if (tier === 'full') {
    return {
      model: config.ai.AUDIO_MODEL_FULL,
      size: config.ai.AUDIO_MODEL_FULL_SIZE
    }
  }
  
  return {
    model: config.ai.AUDIO_MODEL_LITE,
    size: config.ai.AUDIO_MODEL_LITE_SIZE
  }
}
