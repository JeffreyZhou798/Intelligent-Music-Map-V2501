/**
 * AI Service Factory
 * Returns the appropriate AI service based on configuration
 * Now uses @huggingface/transformers for local inference
 */

import { config } from '@/config'
import { TransformersAIService } from './TransformersAIService'
import { MockAIService } from './MockAIService'

// Singleton instance for TransformersAIService
let transformersServiceInstance: TransformersAIService | null = null

/**
 * Create or get AI service instance
 * @param apiKey - Not used for Transformers service, kept for API compatibility
 */
export function createAIService(apiKey?: string) {
  if (config.dev.ENABLE_MOCK_MODE) {
    console.log('🎭 [MOCK MODE] Using Mock AI Service for testing')
    return new MockAIService()
  }
  
  // Use singleton pattern for TransformersAIService to avoid reloading models
  if (!transformersServiceInstance) {
    console.log('🤖 [TRANSFORMERS] Creating new TransformersAIService instance')
    transformersServiceInstance = new TransformersAIService()
  } else {
    console.log('🤖 [TRANSFORMERS] Reusing existing TransformersAIService instance')
  }
  
  return transformersServiceInstance
}

/**
 * Get the current AI service instance (if exists)
 */
export function getAIServiceInstance(): TransformersAIService | MockAIService | null {
  if (config.dev.ENABLE_MOCK_MODE) {
    return new MockAIService()
  }
  return transformersServiceInstance
}

/**
 * Reset the AI service instance (useful for testing)
 */
export function resetAIService(): void {
  transformersServiceInstance = null
  console.log('🔄 [AI Service] Instance reset')
}
