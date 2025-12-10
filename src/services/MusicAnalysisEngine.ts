/**
 * Music Analysis Engine
 * Implements real music structure analysis algorithms
 * Based on pitch sequences, rhythm patterns, similarity detection, etc.
 */

import type { MusicXMLData, MusicStructure, Note, Measure } from '@/types'
import { StructureLevel } from '@/types'

export interface PitchSequence {
  pitches: string[]
  intervals: number[]
  contour: string
}

export interface RhythmSequence {
  durations: number[]
  pattern: string
  density: number
}

export interface StructureAnalysis {
  structures: MusicStructure[]
  relationships: StructureRelationship[]
  patterns: PatternMatch[]
}

export interface StructureRelationship {
  id1: string
  id2: string
  type: 'similar' | 'contrast' | 'transition' | 'repeat'
  similarity: number // 0-1
  description: string
}

export interface PatternMatch {
  pattern: string
  occurrences: Array<{ structureId: string; position: number }>
  type: 'melodic' | 'rhythmic' | 'combined'
}

export class MusicAnalysisEngine {
  /**
   * Main analysis function
   */
  static async analyzeMusicStructure(musicData: MusicXMLData): Promise<StructureAnalysis> {
    // Step 1: Segment into phrases (4-bar phrases as basic unit)
    const structures = this.segmentIntoStructures(musicData)
    
    // Step 2: Extract features for each structure
    const features = structures.map(s => ({
      structure: s,
      pitch: this.extractPitchSequence(musicData.measures.slice(s.startMeasure - 1, s.endMeasure)),
      rhythm: this.extractRhythmSequence(musicData.measures.slice(s.startMeasure - 1, s.endMeasure))
    }))
    
    // Step 3: Find relationships (similar, contrast, etc.)
    const relationships = this.findRelationships(features)
    
    // Step 4: Detect repeating patterns
    const patterns = this.detectPatterns(features)
    
    console.log('🎼 [Analysis] Structures:', structures.length)
    console.log('🔗 [Analysis] Relationships:', relationships.length)
    console.log('🎵 [Analysis] Patterns:', patterns.length)
    
    return {
      structures,
      relationships,
      patterns
    }
  }

  /**
   * Segment music into structural units
   */
  private static segmentIntoStructures(musicData: MusicXMLData): MusicStructure[] {
    const totalMeasures = musicData.measures.length
    const structures: MusicStructure[] = []
    
    // Use 4-bar phrases as basic unit (typical musical phrase length)
    let phraseSize = 4
    
    // Detect if there are clear phrase boundaries (rests, long notes)
    const boundaries = this.detectPhraseBoundaries(musicData.measures)
    
    if (boundaries.length > 0) {
      // Use detected boundaries
      for (let i = 0; i < boundaries.length - 1; i++) {
        structures.push({
          id: `phrase_${i + 1}`,
          level: StructureLevel.PHRASE,
          startMeasure: boundaries[i] + 1,
          endMeasure: boundaries[i + 1],
          startBeat: 1,
          endBeat: 4,
          notes: this.extractNotesFromRange(musicData.measures, boundaries[i], boundaries[i + 1]),
          children: []
        })
      }
    } else {
      // Use fixed 4-bar segmentation
      const phrasesCount = Math.ceil(totalMeasures / phraseSize)
      
      for (let i = 0; i < phrasesCount; i++) {
        const start = i * phraseSize + 1
        const end = Math.min(start + phraseSize - 1, totalMeasures)
        
        structures.push({
          id: `phrase_${i + 1}`,
          level: StructureLevel.PHRASE,
          startMeasure: start,
          endMeasure: end,
          startBeat: 1,
          endBeat: 4,
          notes: this.extractNotesFromRange(musicData.measures, start - 1, end),
          children: []
        })
      }
    }
    
    return structures
  }

  /**
   * Detect phrase boundaries using rests and long notes
   */
  private static detectPhraseBoundaries(measures: Measure[]): number[] {
    const boundaries = [0] // Start with measure 0
    
    for (let i = 1; i < measures.length; i++) {
      const measure = measures[i]
      const prevMeasure = measures[i - 1]
      
      // Check for long notes at end of previous measure
      const hasLongNote = prevMeasure.notes.some(n => n.duration >= 2)
      
      // Check for rests at beginning of current measure
      const hasRest = measure.notes.length === 0
      
      // Phrase boundary typically at multiples of 4
      const isMultipleOf4 = (i + 1) % 4 === 0
      
      if ((hasLongNote || hasRest) && isMultipleOf4) {
        boundaries.push(i)
      }
    }
    
    boundaries.push(measures.length) // End boundary
    
    return boundaries
  }

  /**
   * Extract notes from measure range
   */
  private static extractNotesFromRange(measures: Measure[], start: number, end: number): Note[] {
    const notes: Note[] = []
    for (let i = start; i < Math.min(end, measures.length); i++) {
      notes.push(...measures[i].notes)
    }
    return notes
  }

  /**
   * Extract pitch sequence and intervals
   */
  private static extractPitchSequence(measures: Measure[]): PitchSequence {
    const notes: Note[] = []
    measures.forEach(m => notes.push(...m.notes))
    
    const pitches = notes.map(n => n.pitch)
    const pitchNumbers = pitches.map(p => this.pitchToNumber(p))
    
    // Calculate intervals (semitone differences)
    const intervals: number[] = []
    for (let i = 1; i < pitchNumbers.length; i++) {
      intervals.push(pitchNumbers[i] - pitchNumbers[i - 1])
    }
    
    // Determine contour
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    let contour = 'stable'
    if (avgInterval > 1) contour = 'ascending'
    else if (avgInterval < -1) contour = 'descending'
    else if (intervals.some(i => Math.abs(i) > 3)) contour = 'wave'
    
    return { pitches, intervals, contour }
  }

  /**
   * Extract rhythm sequence and density
   */
  private static extractRhythmSequence(measures: Measure[]): RhythmSequence {
    const notes: Note[] = []
    measures.forEach(m => notes.push(...m.notes))
    
    const durations = notes.map(n => n.duration)
    
    // Calculate density (notes per measure)
    const density = notes.length / measures.length
    
    // Create rhythm pattern string (simplified)
    const pattern = durations.map(d => {
      if (d <= 0.5) return 'S' // Short
      else if (d <= 1) return 'M' // Medium
      else return 'L' // Long
    }).join('')
    
    return { durations, pattern, density }
  }

  /**
   * Find relationships between structures
   */
  private static findRelationships(features: Array<{
    structure: MusicStructure
    pitch: PitchSequence
    rhythm: RhythmSequence
  }>): StructureRelationship[] {
    const relationships: StructureRelationship[] = []
    
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const f1 = features[i]
        const f2 = features[j]
        
        // Calculate pitch similarity using LCS (Longest Common Subsequence)
        const pitchSim = this.calculateSequenceSimilarity(f1.pitch.intervals, f2.pitch.intervals)
        
        // Calculate rhythm similarity
        const rhythmSim = this.calculateStringSimilarity(f1.rhythm.pattern, f2.rhythm.pattern)
        
        // Combined similarity
        const similarity = (pitchSim + rhythmSim) / 2
        
        // Determine relationship type
        let type: 'similar' | 'contrast' | 'transition' | 'repeat'
        let description = ''
        
        if (similarity > 0.8) {
          type = 'repeat'
          description = `Phrase ${i + 1} and ${j + 1} are nearly identical (${(similarity * 100).toFixed(0)}% similar)`
        } else if (similarity > 0.6) {
          type = 'similar'
          description = `Phrase ${i + 1} and ${j + 1} share similar melodic/rhythmic patterns (${(similarity * 100).toFixed(0)}% similar)`
        } else if (similarity < 0.3) {
          type = 'contrast'
          description = `Phrase ${i + 1} and ${j + 1} provide strong contrast`
        } else {
          type = 'transition'
          description = `Phrase ${i + 1} transitions to ${j + 1} with moderate variation`
        }
        
        relationships.push({
          id1: f1.structure.id,
          id2: f2.structure.id,
          type,
          similarity,
          description
        })
      }
    }
    
    return relationships
  }

  /**
   * Detect repeating patterns
   */
  private static detectPatterns(features: Array<{
    structure: MusicStructure
    pitch: PitchSequence
    rhythm: RhythmSequence
  }>): PatternMatch[] {
    const patterns: PatternMatch[] = []
    const seenPatterns = new Map<string, PatternMatch>()
    
    // Check melodic patterns (interval sequences)
    features.forEach((f, idx) => {
      const intervalStr = f.pitch.intervals.slice(0, 4).join(',') // First 4 intervals as pattern
      
      if (intervalStr.length > 0) {
        if (seenPatterns.has(intervalStr)) {
          seenPatterns.get(intervalStr)!.occurrences.push({
            structureId: f.structure.id,
            position: idx
          })
        } else {
          seenPatterns.set(intervalStr, {
            pattern: intervalStr,
            occurrences: [{ structureId: f.structure.id, position: idx }],
            type: 'melodic'
          })
        }
      }
    })
    
    // Check rhythmic patterns
    features.forEach((f, idx) => {
      const rhythmPattern = f.rhythm.pattern.slice(0, 8) // First 8 notes
      const key = `rhythm:${rhythmPattern}`
      
      if (rhythmPattern.length > 0) {
        if (seenPatterns.has(key)) {
          seenPatterns.get(key)!.occurrences.push({
            structureId: f.structure.id,
            position: idx
          })
        } else {
          seenPatterns.set(key, {
            pattern: rhythmPattern,
            occurrences: [{ structureId: f.structure.id, position: idx }],
            type: 'rhythmic'
          })
        }
      }
    })
    
    // Only keep patterns that occur more than once
    seenPatterns.forEach(pattern => {
      if (pattern.occurrences.length > 1) {
        patterns.push(pattern)
      }
    })
    
    return patterns
  }

  /**
   * Calculate sequence similarity using normalized edit distance
   */
  private static calculateSequenceSimilarity(seq1: number[], seq2: number[]): number {
    if (seq1.length === 0 || seq2.length === 0) return 0
    
    const maxLen = Math.max(seq1.length, seq2.length)
    const minLen = Math.min(seq1.length, seq2.length)
    
    // Calculate edit distance for common length
    let matches = 0
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(seq1[i] - seq2[i]) <= 1) { // Allow 1 semitone tolerance
        matches++
      }
    }
    
    return matches / maxLen
  }

  /**
   * Calculate string similarity using LCS-based method
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (str1.length === 0 || str2.length === 0) return 0
    
    const lcsLength = this.longestCommonSubsequence(str1, str2)
    const maxLen = Math.max(str1.length, str2.length)
    
    return lcsLength / maxLen
  }

  /**
   * Longest Common Subsequence (LCS) algorithm
   */
  private static longestCommonSubsequence(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }
    
    return dp[m][n]
  }

  /**
   * Convert pitch notation to MIDI number
   */
  private static pitchToNumber(pitch: string): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    }
    
    const match = pitch.match(/^([A-G])(#|b)?(\d+)$/)
    if (!match) return 60 // Default to middle C
    
    const [, note, accidental, octave] = match
    let num = noteMap[note] + parseInt(octave) * 12
    
    if (accidental === '#') num += 1
    if (accidental === 'b') num -= 1
    
    return num
  }

  /**
   * Get structure type label for display
   */
  static getStructureTypeLabel(type: 'similar' | 'contrast' | 'transition' | 'repeat'): string {
    const labels = {
      similar: 'Similar',
      contrast: 'Contrast',
      transition: 'Transition',
      repeat: 'Repeat'
    }
    return labels[type]
  }
}
