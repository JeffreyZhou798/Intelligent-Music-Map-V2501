/**
 * Mock AI Service for Testing
 * Returns fake data to test UI without real API calls
 */

import type { 
  MusicXMLData,
  MusicStructure,
  MusicFeatures,
  EmotionFeatures,
  VisualScheme,
  UserPreferences
} from '@/types'
import { MusicAnalysisEngine, type StructureRelationship } from './MusicAnalysisEngine'

export class MockAIService {
  /**
   * Real AI music structure analysis using MusicAnalysisEngine
   */
  async analyzeMusicStructure(musicData: MusicXMLData, _localAnalysis: any[]): Promise<MusicStructure[]> {
    // Simulate network delay
    await this.delay(1000)

    // Use real music analysis engine
    const analysis = await MusicAnalysisEngine.analyzeMusicStructure(musicData)
    
    // Store analysis results for use in recommendations
    this.lastAnalysis = analysis

    console.log('🎼 [AI] Analyzed', analysis.structures.length, 'music structures')
    console.log('🔗 [AI] Found', analysis.relationships.length, 'relationships')
    console.log('🎵 [AI] Detected', analysis.patterns.length, 'patterns')
    
    return analysis.structures
  }

  private lastAnalysis: any = null

  /**
   * Simulate emotion inference
   */
  async inferEmotion(features: MusicFeatures): Promise<EmotionFeatures> {
    await this.delay(500)

    // Simple logic based on tempo
    const tempo = features.rhythm.tempo
    const speed = tempo > 120 ? 'fast' : tempo < 80 ? 'slow' : 'moderate'
    const intensity = tempo > 110 ? 'strong' : tempo < 90 ? 'weak' : 'moderate'
    const tension = features.harmony.tension > 0.6 ? 'tense' : 
                    features.harmony.tension < 0.4 ? 'relaxed' : 'neutral'

    const emotion: EmotionFeatures = {
      speed: speed as any,
      intensity: intensity as any,
      tension: tension as any
    }

    console.log('🎭 [MOCK] Inferred emotion:', emotion)
    return emotion
  }

  /**
   * Generate visual recommendations based on music structure analysis
   * Now generates 5 recommendations with structural awareness
   */
  async recommendVisuals(
    emotion: EmotionFeatures, 
    structureLevel: string,
    _preferences?: UserPreferences,
    structureId?: string
  ): Promise<VisualScheme[]> {
    await this.delay(800)

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
        console.log(`🎨 [AI] Structure ${structureId} type: ${structureType} (similarity: ${rel.similarity.toFixed(2)})`)
      }
    }

    // Generate 5 different schemes based on structure type
    for (let i = 0; i < 5; i++) {
      const scheme: VisualScheme = {
        id: `scheme_${i + 1}`,
        elements: [],
        layout: ['horizontal', 'circular', 'vertical', 'grid', 'horizontal'][i] as any,
        confidence: 0.95 - i * 0.05
      }

      for (let j = 0; j < elementCount; j++) {
        // Vary recommendations based on structure type
        let shapeIndex: number
        let colorIndex: number
        
        if (structureType === 'repeat') {
          // For repeating structures, use similar shapes and colors
          shapeIndex = i % shapes.length
          colorIndex = j % colors.length
        } else if (structureType === 'contrast') {
          // For contrasting structures, use different shapes and colors
          shapeIndex = (i * 2 + j) % shapes.length
          colorIndex = (i + j * 2) % colors.length
        } else if (structureType === 'similar') {
          // For similar structures, slight variations
          shapeIndex = (i + j) % shapes.length
          colorIndex = (i + j) % colors.length
        } else if (structureType === 'transition') {
          // For transitions, use gradual changes
          shapeIndex = (i + j * 2) % shapes.length
          colorIndex = j % colors.length
        } else {
          // Default variety
          shapeIndex = (i * 3 + j) % shapes.length
          colorIndex = (j * 2) % colors.length
        }
        
        scheme.elements.push({
          id: `element_${j + 1}`,
          type: shapes[shapeIndex],
          color: colors[colorIndex],
          size: 60 + j * 10,
          animation: {
            type: animations[j % animations.length],
            duration: 1000 + j * 200,
            easing: 'ease-in-out'
          }
        })
      }

      schemes.push(scheme)
    }

    console.log('🎨 [AI] Generated', schemes.length, 'visual schemes for', structureType, 'structure')
    return schemes
  }

  /**
   * Simulate form identification
   */
  async identifyForm(structures: MusicStructure[]): Promise<string> {
    await this.delay(500)

    const forms = [
      'Binary Form (AB)',
      'Ternary Form (ABA)',
      'Rondo Form (ABACA)',
      'Sonata Form',
      'Theme and Variations',
      'Verse-Chorus Form'
    ]

    // Simple logic: choose based on structure count
    const form = structures.length <= 2 ? forms[0] :
                 structures.length <= 4 ? forms[1] :
                 structures.length <= 6 ? forms[2] : forms[3]

    console.log('🎭 [MOCK] Identified form:', form)
    return form
  }

  /**
   * Get colors based on emotion
   */
  private getColorsForEmotion(emotion: EmotionFeatures): string[] {
    if (emotion.speed === 'fast' && emotion.intensity === 'strong') {
      return ['#FF6B6B', '#FF8E53', '#FFA600'] // Warm, energetic
    } else if (emotion.speed === 'slow' && emotion.intensity === 'weak') {
      return ['#4ECDC4', '#45B7D1', '#96CEB4'] // Cool, calm
    } else if (emotion.tension === 'tense') {
      return ['#A04668', '#D84797', '#8E44AD'] // Purple, tense
    } else {
      return ['#3498DB', '#2ECC71', '#F39C12'] // Balanced
    }
  }

  /**
   * Recognize emotions for each music structure
   */
  async recognizeEmotions(structures: MusicStructure[], audioData: any): Promise<any[]> {
    await this.delay(1000)

    const emotions = ['happy', 'sad', 'excited', 'peaceful', 'tense']
    
    return structures.map((s, index) => {
      // Assign emotions based on position and measure numbers
      const emotionIndex = index % emotions.length
      const confidence = 0.7 + Math.random() * 0.25
      
      return {
        structureId: s.id,
        primary: emotions[emotionIndex],
        confidence: Math.round(confidence * 100) / 100,
        features: this.getEmotionFeatures(emotions[emotionIndex])
      }
    })
  }

  /**
   * Analyze structural similarity
   */
  async analyzeSimilarity(structures: MusicStructure[]): Promise<any[]> {
    await this.delay(1000)

    if (structures.length < 4) {
      return []
    }

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
          commonFeatures: [
            'similar melodic contour',
            'parallel rhythmic pattern',
            'related harmonic progression'
          ]
        })
      }
    }

    console.log('🔗 [MOCK] Found', groups.length, 'similarity groups')
    return groups
  }

  /**
   * Get emotion features description
   */
  private getEmotionFeatures(emotion: string): string[] {
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
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
