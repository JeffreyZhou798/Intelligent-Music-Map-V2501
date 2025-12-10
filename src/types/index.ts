// Music structure levels
export enum StructureLevel {
  MOTIVE = 'motive',
  SUB_PHRASE = 'sub_phrase',
  PHRASE = 'phrase',
  PERIOD = 'period',
  THEME = 'theme'
}

// Music structure
export interface MusicStructure {
  id: string
  level: StructureLevel
  startMeasure: number
  endMeasure: number
  startBeat: number
  endBeat: number
  startTime?: number // audio timestamp in seconds
  endTime?: number // audio timestamp in seconds
  notes: Note[]
  parent?: string
  children: string[]
  emotion?: StructureEmotion
  similarityGroup?: string
  confidence?: number
}

// Note representation
export interface Note {
  pitch: string
  duration: number
  measure: number
  beat: number
}

// MusicXML data
export interface MusicXMLData {
  title: string
  composer: string
  measures: Measure[]
  timeSignature: string
  keySignature: string
}

export interface Measure {
  number: number
  notes: Note[]
  chords?: string[]
}

// Visual elements
export interface VisualElement {
  id: string
  type: 'circle' | 'ellipse' | 'square' | 'triangle' | 'star' | 'wave' | 'diamond' | 'hexagon' | 'pentagon' | 'bar' | 'line' | 'rect' | 'arrow-up' | 'arrow-down' | 'lightning' | 'explosion' | 'curve' | 'custom'
  color: string // HEX color
  size: number
  position?: { x: number; y: number } // for custom drag positioning
  animation: AnimationType
}

export interface AnimationType {
  type: 'flash' | 'rotate' | 'bounce' | 'scale' | 'slide' | 'pulse' | 'spin' | 'jump' | 'shake' | 'fade' | 'none'
  duration: number // milliseconds
  easing: string // GSAP easing function
}

export interface VisualScheme {
  id: string
  elements: VisualElement[]
  layout: 'horizontal' | 'vertical' | 'circular' | 'grid' | 'custom' | 'clustered'
  confidence: number // recommendation confidence
}

// Visual mapping
export interface VisualMapping {
  structureId: string
  scheme: VisualScheme
  isCustomized: boolean
  isDragged: boolean // user manually positioned elements
  timestamp: number
  source: 'ai' | 'custom' | 'applied' // how this mapping was created
}

// Music features
export interface MusicFeatures {
  melody: {
    range: number // pitch range
    contour: 'ascending' | 'descending' | 'wave' | 'stable'
    intervals: number[] // interval distribution
  }
  rhythm: {
    tempo: number // BPM
    complexity: number // rhythmic complexity
    syncopation: boolean // has syncopation
  }
  harmony: {
    chords: string[] // chord sequence
    tonality: 'major' | 'minor' | 'modal'
    tension: number // harmonic tension
  }
  texture: {
    voices: number // number of voices
    density: number // note density
  }
}

// Emotion features
export interface EmotionFeatures {
  speed: 'fast' | 'moderate' | 'slow'
  intensity: 'strong' | 'moderate' | 'weak'
  tension: 'tense' | 'neutral' | 'relaxed'
}

// Emotion types
export enum EmotionType {
  HAPPY = 'happy',
  SAD = 'sad',
  EXCITED = 'excited',
  PEACEFUL = 'peaceful',
  TENSE = 'tense'
}

// Structure emotion
export interface StructureEmotion {
  structureId: string
  primary: EmotionType
  secondary?: EmotionType
  confidence: number
  features: string[]
}

// Similarity group
export interface SimilarityGroup {
  groupId: string // A, B, C, etc.
  structureIds: string[]
  similarityScore: number
  commonFeatures: string[]
}

// Audio file data
export interface AudioFileData {
  file: File
  audioBuffer: AudioBuffer | null
  duration: number
  url: string
}

// User action
export interface UserAction {
  structureId: string
  recommendedSchemes: VisualScheme[]
  selectedScheme: VisualScheme
  isCustomized: boolean
  reward: number // +1, +0.5, -1
  timestamp: number
}

// User preferences
export interface UserPreferences {
  colorPreferences: Map<string, number> // color -> weight
  shapePreferences: Map<string, number> // shape -> weight
  animationPreferences: Map<string, number> // animation -> weight
  layoutPreferences: Map<string, number> // layout -> weight
}

// MVT file data
export interface MVTData {
  musicXML: string
  visualMap: VisualMapping[]
  metadata: {
    createdAt: string
    version: string
  }
}

// AI Model Status (for @huggingface/transformers)
export interface ModelLoadingStatus {
  isLoading: boolean
  progress: number
  currentModel: string
  error: string | null
}

// Feature Vector for music analysis
export interface FeatureVector {
  melody: number[]
  rhythm: number[]
  harmony: number[]
  texture: number[]
  combined: number[] // 35-dimensional combined vector
}

// Theory Rule from Knowledge Base
export interface TheoryRule {
  id: string
  name: string
  description: string
  category: string
  confidence: number
  similarity?: number
}

// Playback state
export interface PlaybackState {
  isPlaying: boolean
  currentTime: number // seconds
  duration: number
  currentStructure: string | null
}

// Error types
export enum ErrorType {
  FILE_PARSE_ERROR = 'FILE_PARSE_ERROR',
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_CALL_FAILED = 'API_CALL_FAILED',
  MUSIC_ANALYSIS_FAILED = 'MUSIC_ANALYSIS_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  PLAYBACK_ERROR = 'PLAYBACK_ERROR'
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
  timestamp: number
}

// Export options
export interface ExportOptions {
  includeMusicXML: boolean
  includeJSON: boolean
  includeSVG: boolean
  includePNG: boolean
  includeAnnotatedXML: boolean
}
