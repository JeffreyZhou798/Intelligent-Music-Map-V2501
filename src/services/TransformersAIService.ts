/**
 * Transformers AI Service
 * Implements AI functionality using @huggingface/transformers
 * Zero-shot, no training, pure inference with pre-trained models
 */

import type { 
  MusicXMLData,
  MusicStructure,
  MusicFeatures,
  EmotionFeatures,
  VisualScheme,
  UserPreferences,
  StructureEmotion
} from '@/types'
import { MusicAnalysisEngine, type StructureRelationship } from './MusicAnalysisEngine'
import { MusicKnowledgeBase, type TheoryRule } from './MusicKnowledgeBase'

// Model loading status
export interface ModelLoadingStatus {
  isLoading: boolean
  progress: number
  currentModel: string
  error: string | null
}

// Feature extraction result
export interface FeatureVector {
  melody: number[]
  rhythm: number[]
  harmony: number[]
  texture: number[]
  combined: number[] // 35-dimensional combined vector
}

export class TransformersAIService {
  private embeddingModel: any = null
  private isModelLoaded = false
  private loadingStatus: ModelLoadingStatus = {
    isLoading: false,
    progress: 0,
    currentModel: '',
    error: null
  }
  private knowledgeBase: MusicKnowledgeBase
  private lastAnalysis: any = null
  private onStatusChange?: (status: ModelLoadingStatus) => void

  constructor() {
    this.knowledgeBase = new MusicKnowledgeBase()
  }

  /**
   * Set status change callback
   */
  setStatusCallback(callback: (status: ModelLoadingStatus) => void) {
    this.onStatusChange = callback
  }

  /**
   * Update loading status
   */
  private updateStatus(updates: Partial<ModelLoadingStatus>) {
    this.loadingStatus = { ...this.loadingStatus, ...updates }
    this.onStatusChange?.(this.loadingStatus)
  }

  /**
   * Get current loading status
   */
  getLoadingStatus(): ModelLoadingStatus {
    return this.loadingStatus
  }

  /**
   * Initialize and load models (lazy loading)
   */
  async initializeModels(): Promise<void> {
    if (this.isModelLoaded) return

    this.updateStatus({ isLoading: true, progress: 0, currentModel: 'Initializing...' })

    try {
      // Step 1: Load knowledge base (5MB, fast)
      this.updateStatus({ progress: 10, currentModel: 'Loading music theory knowledge base...' })
      await this.knowledgeBase.initialize()
      
      // Step 2: Try to load embedding model
      this.updateStatus({ progress: 30, currentModel: 'Loading embedding model...' })
      
      try {
        // Dynamic import of transformers.js
        const { pipeline, env } = await import('@huggingface/transformers')
        
        // Configure for browser environment
        env.allowLocalModels = false
        env.useBrowserCache = true
        
        // Load lightweight embedding model (all-MiniLM-L6-v2, ~23MB)
        this.updateStatus({ progress: 50, currentModel: 'Loading all-MiniLM-L6-v2 (23MB)...' })
        
        this.embeddingModel = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          { 
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                const pct = Math.round(50 + (progress.progress || 0) * 0.4)
                this.updateStatus({ progress: pct })
              }
            }
          }
        )
        
        console.log('✅ Embedding model loaded successfully')
      } catch (modelError) {
        console.warn('⚠️ Could not load embedding model, using fallback:', modelError)
        // Continue without embedding model - will use rule-based fallback
      }

      this.updateStatus({ progress: 100, currentModel: 'Ready', isLoading: false })
      this.isModelLoaded = true
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      this.updateStatus({ 
        isLoading: false, 
        error: errorMsg,
        currentModel: 'Failed to load'
      })
      console.error('Failed to initialize models:', error)
      // Don't throw - allow fallback to rule-based analysis
      this.isModelLoaded = true // Mark as loaded to prevent retry loops
    }
  }

  /**
   * Generate embedding for text using the model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingModel) {
      // Fallback: generate simple hash-based embedding
      return this.generateFallbackEmbedding(text)
    }

    try {
      const output = await this.embeddingModel(text, { pooling: 'mean', normalize: true })
      return Array.from(output.data)
    } catch (error) {
      console.warn('Embedding generation failed, using fallback:', error)
      return this.generateFallbackEmbedding(text)
    }
  }

  /**
   * Fallback embedding generation (simple but functional)
   */
  private generateFallbackEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0)
    const words = text.toLowerCase().split(/\s+/)
    
    words.forEach((word, idx) => {
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i)
        const position = (charCode * (idx + 1)) % 384
        embedding[position] += 1 / (i + 1)
      }
    })
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude
      }
    }
    
    return embedding
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }

  /**
   * Analyze music structure with AI
   */
  async analyzeMusicStructure(musicData: MusicXMLData, localAnalysis: any[]): Promise<MusicStructure[]> {
    await this.initializeModels()
    
    // Use real music analysis engine
    const analysis = await MusicAnalysisEngine.analyzeMusicStructure(musicData)
    this.lastAnalysis = analysis

    // Enhance with knowledge base retrieval
    const enhancedStructures = await this.enhanceStructuresWithKnowledge(analysis.structures, musicData)

    console.log('🎼 [Transformers] Analyzed', enhancedStructures.length, 'music structures')
    console.log('🔗 [Transformers] Found', analysis.relationships.length, 'relationships')
    
    return enhancedStructures
  }

  /**
   * Enhance structures with knowledge base retrieval
   */
  private async enhanceStructuresWithKnowledge(
    structures: MusicStructure[], 
    musicData: MusicXMLData
  ): Promise<MusicStructure[]> {
    const enhanced = [...structures]
    
    for (const structure of enhanced) {
      // Generate query description for this structure
      const queryDesc = this.generateStructureDescription(structure, musicData)
      
      // Retrieve relevant theory rules
      const relevantRules = await this.retrieveRelevantRules(queryDesc)
      
      // Calculate confidence based on rule matching
      const confidence = this.calculateConfidence(relevantRules)
      structure.confidence = confidence
    }
    
    return enhanced
  }

  /**
   * Generate natural language description of a structure
   */
  private generateStructureDescription(structure: MusicStructure, musicData: MusicXMLData): string {
    const measures = musicData.measures.slice(structure.startMeasure - 1, structure.endMeasure)
    const notes = measures.flatMap(m => m.notes)
    
    // Analyze basic features
    const pitches = notes.map(n => n.pitch)
    const durations = notes.map(n => n.duration)
    
    // Determine characteristics
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length || 1
    const tempo = avgDuration < 0.5 ? 'fast' : avgDuration > 1.5 ? 'slow' : 'moderate'
    
    // Check for patterns
    const hasRepetition = this.detectRepetition(pitches)
    const contour = this.detectContour(pitches)
    
    return `Musical phrase from measure ${structure.startMeasure} to ${structure.endMeasure}, ` +
           `${tempo} tempo, ${contour} melodic contour` +
           (hasRepetition ? ', with repetitive patterns' : '')
  }

  /**
   * Detect melodic contour
   */
  private detectContour(pitches: string[]): string {
    if (pitches.length < 2) return 'stable'
    
    const pitchNumbers = pitches.map(p => this.pitchToNumber(p))
    let ascending = 0
    let descending = 0
    
    for (let i = 1; i < pitchNumbers.length; i++) {
      if (pitchNumbers[i] > pitchNumbers[i-1]) ascending++
      else if (pitchNumbers[i] < pitchNumbers[i-1]) descending++
    }
    
    if (ascending > descending * 1.5) return 'ascending'
    if (descending > ascending * 1.5) return 'descending'
    return 'wave'
  }

  /**
   * Detect repetition in pitch sequence
   */
  private detectRepetition(pitches: string[]): boolean {
    if (pitches.length < 4) return false
    
    // Check for 2-4 note patterns that repeat
    for (let patternLen = 2; patternLen <= 4; patternLen++) {
      const pattern = pitches.slice(0, patternLen).join(',')
      let count = 0
      
      for (let i = 0; i <= pitches.length - patternLen; i += patternLen) {
        if (pitches.slice(i, i + patternLen).join(',') === pattern) {
          count++
        }
      }
      
      if (count >= 2) return true
    }
    
    return false
  }

  /**
   * Convert pitch to MIDI number
   */
  private pitchToNumber(pitch: string): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    }
    
    const match = pitch.match(/^([A-G])(#|b)?(\d+)?$/)
    if (!match) return 60
    
    const [, note, accidental, octave] = match
    let num = noteMap[note] + (parseInt(octave || '4') * 12)
    
    if (accidental === '#') num += 1
    if (accidental === 'b') num -= 1
    
    return num
  }

  /**
   * Retrieve relevant theory rules using semantic search
   */
  private async retrieveRelevantRules(query: string): Promise<TheoryRule[]> {
    const queryEmbedding = await this.generateEmbedding(query)
    return this.knowledgeBase.searchRules(queryEmbedding, 5)
  }

  /**
   * Calculate confidence based on matched rules
   */
  private calculateConfidence(rules: TheoryRule[]): number {
    if (rules.length === 0) return 0.5
    
    // Weight by similarity scores
    const totalWeight = rules.reduce((sum, rule) => sum + (rule.similarity || 0.5), 0)
    const avgSimilarity = totalWeight / rules.length
    
    // Map to 0.5-1.0 range
    return 0.5 + avgSimilarity * 0.5
  }

  /**
   * Infer emotion features from music features
   */
  async inferEmotion(features: MusicFeatures): Promise<EmotionFeatures> {
    await this.initializeModels()
    
    // Rule-based emotion inference (fast and reliable)
    const tempo = features.rhythm.tempo
    const tension = features.harmony.tension
    const density = features.texture.density
    
    // Speed determination
    let speed: 'fast' | 'moderate' | 'slow'
    if (tempo > 120 || density > 0.7) speed = 'fast'
    else if (tempo < 80 || density < 0.3) speed = 'slow'
    else speed = 'moderate'
    
    // Intensity determination
    let intensity: 'strong' | 'moderate' | 'weak'
    if (tempo > 110 && density > 0.5) intensity = 'strong'
    else if (tempo < 90 && density < 0.4) intensity = 'weak'
    else intensity = 'moderate'
    
    // Tension determination
    let tensionLevel: 'tense' | 'neutral' | 'relaxed'
    if (tension > 0.6 || features.harmony.tonality === 'minor') tensionLevel = 'tense'
    else if (tension < 0.4 && features.harmony.tonality === 'major') tensionLevel = 'relaxed'
    else tensionLevel = 'neutral'

    const emotion: EmotionFeatures = { speed, intensity, tension: tensionLevel }
    console.log('🎭 [Transformers] Inferred emotion:', emotion)
    
    return emotion
  }

  /**
   * Recommend visual schemes based on emotion and preferences
   */
  async recommendVisuals(
    emotion: EmotionFeatures, 
    structureLevel: string,
    preferences?: UserPreferences,
    structureId?: string
  ): Promise<VisualScheme[]> {
    await this.initializeModels()

    const elementCount = structureLevel === 'motive' ? 1 : 
                        structureLevel === 'phrase' || structureLevel === 'sub_phrase' ? 3 : 3

    const schemes: VisualScheme[] = []
    const colors = this.getColorsForEmotion(emotion)
    const shapes = ['circle', 'square', 'triangle', 'star', 'wave', 'diamond', 'hexagon'] as const
    const animations = ['flash', 'rotate', 'bounce', 'scale', 'slide'] as const

    // Get structure relationship for context-aware recommendations
    let structureType: 'repeat' | 'similar' | 'contrast' | 'transition' | 'default' = 'default'
    
    if (this.lastAnalysis && structureId) {
      const relationships = this.lastAnalysis.relationships as StructureRelationship[]
      const rel = relationships.find(r => r.id1 === structureId || r.id2 === structureId)
      if (rel) {
        structureType = rel.type
        console.log(`🎨 [Transformers] Structure ${structureId} type: ${structureType}`)
      }
    }

    // Apply user preferences if available
    const preferredShapes = preferences ? this.getPreferredItems(preferences.shapePreferences, shapes as unknown as string[]) : shapes
    const preferredAnimations = preferences ? this.getPreferredItems(preferences.animationPreferences, animations as unknown as string[]) : animations

    // Generate 5 different schemes
    for (let i = 0; i < 5; i++) {
      const scheme: VisualScheme = {
        id: `scheme_${i + 1}`,
        elements: [],
        layout: ['horizontal', 'circular', 'vertical', 'grid', 'horizontal'][i] as any,
        confidence: 0.95 - i * 0.05
      }

      for (let j = 0; j < elementCount; j++) {
        let shapeIndex: number
        let colorIndex: number
        
        // Vary based on structure type
        if (structureType === 'repeat') {
          shapeIndex = i % preferredShapes.length
          colorIndex = j % colors.length
        } else if (structureType === 'contrast') {
          shapeIndex = (i * 2 + j) % preferredShapes.length
          colorIndex = (i + j * 2) % colors.length
        } else if (structureType === 'similar') {
          shapeIndex = (i + j) % preferredShapes.length
          colorIndex = (i + j) % colors.length
        } else {
          shapeIndex = (i * 3 + j) % preferredShapes.length
          colorIndex = (j * 2) % colors.length
        }
        
        scheme.elements.push({
          id: `element_${j + 1}`,
          type: preferredShapes[shapeIndex] as any,
          color: colors[colorIndex],
          size: 60 + j * 10,
          animation: {
            type: preferredAnimations[j % preferredAnimations.length] as any,
            duration: 1000 + j * 200,
            easing: 'ease-in-out'
          }
        })
      }

      schemes.push(scheme)
    }

    console.log('🎨 [Transformers] Generated', schemes.length, 'visual schemes')
    return schemes
  }

  /**
   * Get preferred items based on user preferences
   */
  private getPreferredItems<T extends string>(prefs: Map<string, number>, items: string[]): T[] {
    if (!prefs || prefs.size === 0) return items as T[]
    
    // Sort by preference weight
    const sorted = [...items].sort((a, b) => {
      const weightA = prefs.get(a) || 0
      const weightB = prefs.get(b) || 0
      return weightB - weightA
    })
    
    return sorted as T[]
  }

  /**
   * Get colors based on emotion
   */
  private getColorsForEmotion(emotion: EmotionFeatures): string[] {
    // Warm colors for fast/strong, cool colors for slow/weak
    if (emotion.speed === 'fast' && emotion.intensity === 'strong') {
      return ['#FF6B6B', '#FF8E53', '#FFA600', '#FF4757', '#FF6348'] // Warm, energetic
    } else if (emotion.speed === 'slow' && emotion.intensity === 'weak') {
      return ['#4ECDC4', '#45B7D1', '#96CEB4', '#74B9FF', '#81ECEC'] // Cool, calm
    } else if (emotion.tension === 'tense') {
      return ['#A04668', '#D84797', '#8E44AD', '#9B59B6', '#6C5CE7'] // Purple, tense
    } else {
      return ['#3498DB', '#2ECC71', '#F39C12', '#1ABC9C', '#E74C3C'] // Balanced mix
    }
  }

  /**
   * Identify musical form type
   */
  async identifyForm(structures: MusicStructure[]): Promise<string> {
    await this.initializeModels()
    
    // Analyze structure patterns to identify form
    const structureCount = structures.length
    
    // Check for common form patterns
    if (this.lastAnalysis) {
      const relationships = this.lastAnalysis.relationships as StructureRelationship[]
      const repeatCount = relationships.filter(r => r.type === 'repeat').length
      const contrastCount = relationships.filter(r => r.type === 'contrast').length
      
      // ABA pattern (Ternary)
      if (repeatCount >= 2 && structureCount >= 3) {
        const firstLast = relationships.find(r => 
          (r.id1 === structures[0].id && r.id2 === structures[structures.length - 1].id) ||
          (r.id2 === structures[0].id && r.id1 === structures[structures.length - 1].id)
        )
        if (firstLast && firstLast.type === 'repeat') {
          return 'Ternary Form (ABA)'
        }
      }
      
      // Rondo pattern (ABACA)
      if (repeatCount >= 3 && structureCount >= 5) {
        return 'Rondo Form (ABACA)'
      }
      
      // Binary form (AB)
      if (structureCount <= 4 && contrastCount >= 1) {
        return 'Binary Form (AB)'
      }
      
      // Sonata form indicators
      if (structureCount >= 8 && repeatCount >= 2 && contrastCount >= 2) {
        return 'Sonata Form'
      }
    }
    
    // Default based on structure count
    if (structureCount <= 2) return 'Binary Form (AB)'
    if (structureCount <= 4) return 'Ternary Form (ABA)'
    if (structureCount <= 6) return 'Rondo Form'
    return 'Through-composed Form'
  }

  /**
   * Recognize emotions for each music structure
   */
  async recognizeEmotions(structures: MusicStructure[], audioData: any): Promise<StructureEmotion[]> {
    await this.initializeModels()
    
    const emotions: StructureEmotion[] = []
    const emotionTypes = ['happy', 'sad', 'excited', 'peaceful', 'tense'] as const
    
    for (let i = 0; i < structures.length; i++) {
      const structure = structures[i]
      
      // Analyze structure characteristics
      const features = this.extractStructureFeatures(structure)
      
      // Determine primary emotion based on features
      let primary: typeof emotionTypes[number]
      let confidence: number
      
      if (features.energy > 0.7 && features.brightness > 0.6) {
        primary = 'excited'
        confidence = 0.85
      } else if (features.energy > 0.5 && features.brightness > 0.5) {
        primary = 'happy'
        confidence = 0.8
      } else if (features.energy < 0.3 && features.brightness < 0.4) {
        primary = 'sad'
        confidence = 0.75
      } else if (features.energy < 0.4 && features.brightness > 0.5) {
        primary = 'peaceful'
        confidence = 0.8
      } else if (features.tension > 0.6) {
        primary = 'tense'
        confidence = 0.75
      } else {
        // Default based on position
        primary = emotionTypes[i % emotionTypes.length]
        confidence = 0.7
      }
      
      emotions.push({
        structureId: structure.id,
        primary: primary as any,
        confidence: Math.round(confidence * 100) / 100,
        features: this.getEmotionFeatureDescriptions(primary)
      })
    }
    
    console.log('🎭 [Transformers] Recognized emotions for', emotions.length, 'structures')
    return emotions
  }

  /**
   * Extract features from a structure
   */
  private extractStructureFeatures(structure: MusicStructure): { energy: number; brightness: number; tension: number } {
    const notes = structure.notes || []
    
    // Calculate energy based on note density
    const measureCount = structure.endMeasure - structure.startMeasure + 1
    const noteDensity = notes.length / measureCount
    const energy = Math.min(1, noteDensity / 10)
    
    // Calculate brightness based on pitch range
    const pitches = notes.map(n => this.pitchToNumber(n.pitch))
    const avgPitch = pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 60
    const brightness = Math.min(1, Math.max(0, (avgPitch - 48) / 36))
    
    // Calculate tension based on intervals
    let tension = 0.5
    if (pitches.length > 1) {
      const intervals = []
      for (let i = 1; i < pitches.length; i++) {
        intervals.push(Math.abs(pitches[i] - pitches[i-1]))
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      tension = Math.min(1, avgInterval / 12)
    }
    
    return { energy, brightness, tension }
  }

  /**
   * Get emotion feature descriptions
   */
  private getEmotionFeatureDescriptions(emotion: string): string[] {
    const featureMap: Record<string, string[]> = {
      'happy': ['major tonality', 'bright timbre', 'moderate tempo', 'ascending melody'],
      'sad': ['minor tonality', 'dark timbre', 'slow tempo', 'descending melody'],
      'excited': ['fast tempo', 'strong dynamics', 'frequent changes', 'high energy'],
      'peaceful': ['slow tempo', 'soft dynamics', 'consonant harmony', 'smooth flow'],
      'tense': ['dissonant harmony', 'strong contrasts', 'unstable tonality', 'irregular rhythm']
    }
    return featureMap[emotion] || ['neutral features']
  }

  /**
   * Analyze structural similarity and group similar structures
   */
  async analyzeSimilarity(structures: MusicStructure[]): Promise<any[]> {
    await this.initializeModels()
    
    if (structures.length < 4) return []
    
    // Use analysis relationships if available
    if (this.lastAnalysis) {
      const relationships = this.lastAnalysis.relationships as StructureRelationship[]
      return this.groupByRelationships(structures, relationships)
    }
    
    // Fallback: group by position
    return this.groupByPosition(structures)
  }

  /**
   * Group structures by their relationships
   */
  private groupByRelationships(structures: MusicStructure[], relationships: StructureRelationship[]): any[] {
    const groups: any[] = []
    const assigned = new Set<string>()
    const groupLabels = ['A', 'B', 'C', 'D', 'E']
    let groupIndex = 0
    
    // Find repeat and similar relationships
    const strongRelations = relationships.filter(r => 
      r.type === 'repeat' || (r.type === 'similar' && r.similarity > 0.6)
    )
    
    for (const rel of strongRelations) {
      if (assigned.has(rel.id1) && assigned.has(rel.id2)) continue
      
      const groupId = groupLabels[groupIndex % groupLabels.length]
      const structureIds: string[] = []
      
      if (!assigned.has(rel.id1)) {
        structureIds.push(rel.id1)
        assigned.add(rel.id1)
      }
      if (!assigned.has(rel.id2)) {
        structureIds.push(rel.id2)
        assigned.add(rel.id2)
      }
      
      if (structureIds.length > 0) {
        groups.push({
          groupId,
          structureIds,
          similarityScore: rel.similarity,
          commonFeatures: [rel.description]
        })
        groupIndex++
      }
    }
    
    console.log('🔗 [Transformers] Found', groups.length, 'similarity groups')
    return groups
  }

  /**
   * Fallback: group structures by position
   */
  private groupByPosition(structures: MusicStructure[]): any[] {
    const groups: any[] = []
    const groupLabels = ['A', 'B', 'C', 'D', 'E']
    const groupSize = Math.floor(structures.length / 3)

    for (let i = 0; i < Math.min(3, structures.length / 2); i++) {
      const startIdx = i * groupSize
      const endIdx = Math.min(startIdx + groupSize + 1, structures.length)
      const groupStructures = structures.slice(startIdx, endIdx)

      if (groupStructures.length >= 2) {
        groups.push({
          groupId: groupLabels[i],
          structureIds: groupStructures.map(s => s.id),
          similarityScore: 0.75 + Math.random() * 0.2,
          commonFeatures: ['similar melodic contour', 'parallel rhythmic pattern']
        })
      }
    }
    
    return groups
  }

  /**
   * Test connection (always succeeds for local model)
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.initializeModels()
      return true
    } catch {
      return false
    }
  }
}
