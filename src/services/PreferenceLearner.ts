/**
 * Preference Learner Service
 * Implements pseudo-reinforcement learning to learn user preferences
 */

import type { UserAction, UserPreferences, VisualScheme, VisualElement } from '@/types'

export class PreferenceLearner {
  private actions: UserAction[] = []
  private preferences: UserPreferences = {
    colorPreferences: new Map(),
    shapePreferences: new Map(),
    animationPreferences: new Map(),
    layoutPreferences: new Map()
  }

  /**
   * Record user action
   */
  recordAction(action: UserAction): void {
    // Calculate reward
    action.reward = this.calculateReward(action)
    
    // Store action
    this.actions.push(action)
    
    // Update preferences based on reward
    this.updatePreferences(action)
  }

  /**
   * Calculate reward based on user behavior
   * +1: User accepted AI recommendation
   * +0.5: User modified recommendation but kept similar type
   * -1: User rejected and completely changed
   */
  calculateReward(action: UserAction): number {
    if (!action.isCustomized) {
      // User directly accepted the recommendation
      return 1.0
    }

    // Calculate similarity between recommended and selected scheme
    const topRecommendation = action.recommendedSchemes[0]
    if (!topRecommendation) {
      return -1.0
    }

    const similarity = this.calculateSimilarity(topRecommendation, action.selectedScheme)

    if (similarity > 0.7) {
      // User modified but kept similar style
      return 0.5
    } else {
      // User completely rejected the recommendation
      return -1.0
    }
  }

  /**
   * Calculate similarity between two visual schemes
   */
  private calculateSimilarity(scheme1: VisualScheme, scheme2: VisualScheme): number {
    let similarityScore = 0
    let totalFactors = 0

    // Compare layout
    totalFactors++
    if (scheme1.layout === scheme2.layout) {
      similarityScore += 1
    }

    // Compare number of elements
    totalFactors++
    const elementCountDiff = Math.abs(scheme1.elements.length - scheme2.elements.length)
    similarityScore += Math.max(0, 1 - elementCountDiff / 5)

    // Compare element types
    const types1 = scheme1.elements.map(e => e.type).sort()
    const types2 = scheme2.elements.map(e => e.type).sort()
    const commonTypes = types1.filter(t => types2.includes(t)).length
    totalFactors++
    similarityScore += commonTypes / Math.max(types1.length, types2.length)

    // Compare colors (simplified - just check if any colors are similar)
    const colors1 = scheme1.elements.map(e => e.color)
    const colors2 = scheme2.elements.map(e => e.color)
    const commonColors = colors1.filter(c => colors2.includes(c)).length
    totalFactors++
    similarityScore += commonColors / Math.max(colors1.length, colors2.length)

    // Compare animation types
    const animations1 = scheme1.elements.map(e => e.animation.type).sort()
    const animations2 = scheme2.elements.map(e => e.animation.type).sort()
    const commonAnimations = animations1.filter(a => animations2.includes(a)).length
    totalFactors++
    similarityScore += commonAnimations / Math.max(animations1.length, animations2.length)

    return similarityScore / totalFactors
  }

  /**
   * Update user preferences based on action and reward
   */
  updatePreferences(action: UserAction): void {
    const { selectedScheme, reward } = action

    // Update color preferences
    selectedScheme.elements.forEach((element: VisualElement) => {
      const currentWeight = this.preferences.colorPreferences.get(element.color) || 0
      this.preferences.colorPreferences.set(element.color, currentWeight + reward)
    })

    // Update shape preferences
    selectedScheme.elements.forEach((element: VisualElement) => {
      const currentWeight = this.preferences.shapePreferences.get(element.type) || 0
      this.preferences.shapePreferences.set(element.type, currentWeight + reward)
    })

    // Update animation preferences
    selectedScheme.elements.forEach((element: VisualElement) => {
      const currentWeight = this.preferences.animationPreferences.get(element.animation.type) || 0
      this.preferences.animationPreferences.set(element.animation.type, currentWeight + reward)
    })

    // Update layout preferences
    const currentLayoutWeight = this.preferences.layoutPreferences.get(selectedScheme.layout) || 0
    this.preferences.layoutPreferences.set(selectedScheme.layout, currentLayoutWeight + reward)

    // Normalize weights to prevent unbounded growth
    this.normalizePreferences()
  }

  /**
   * Normalize preference weights
   */
  private normalizePreferences(): void {
    this.normalizeMap(this.preferences.colorPreferences)
    this.normalizeMap(this.preferences.shapePreferences)
    this.normalizeMap(this.preferences.animationPreferences)
    this.normalizeMap(this.preferences.layoutPreferences)
  }

  /**
   * Normalize a preference map
   */
  private normalizeMap(map: Map<string, number>): void {
    const values = Array.from(map.values())
    if (values.length === 0) return

    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min

    if (range === 0) return

    map.forEach((value, key) => {
      const normalized = (value - min) / range
      map.set(key, normalized)
    })
  }

  /**
   * Get current preferences
   */
  getPreferences(): UserPreferences {
    return this.preferences
  }

  /**
   * Get all recorded actions
   */
  getActions(): UserAction[] {
    return this.actions
  }

  /**
   * Clear all preferences and actions
   */
  clearPreferences(): void {
    this.actions = []
    this.preferences = {
      colorPreferences: new Map(),
      shapePreferences: new Map(),
      animationPreferences: new Map(),
      layoutPreferences: new Map()
    }
  }

  /**
   * Get preference statistics
   */
  getStatistics() {
    return {
      totalActions: this.actions.length,
      acceptedRecommendations: this.actions.filter(a => a.reward === 1.0).length,
      modifiedRecommendations: this.actions.filter(a => a.reward === 0.5).length,
      rejectedRecommendations: this.actions.filter(a => a.reward === -1.0).length,
      averageReward: this.actions.length > 0 
        ? this.actions.reduce((sum, a) => sum + a.reward, 0) / this.actions.length 
        : 0
    }
  }
}
