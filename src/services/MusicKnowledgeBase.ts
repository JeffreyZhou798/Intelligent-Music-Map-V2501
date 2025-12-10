/**
 * Music Knowledge Base
 * Local knowledge base for music theory rules
 * Implements semantic search using embeddings
 */

export interface TheoryRule {
  id: string
  name: string
  description: string
  category: 'cadence' | 'phrase' | 'form' | 'tonality' | 'texture' | 'rhythm' | 'melody'
  features: {
    chordProgression?: number[]
    melodyContour?: string
    rhythmPattern?: string
  }
  applicablePeriods: string[]
  confidence: number
  embedding?: number[]
  similarity?: number // Set during search
}

export class MusicKnowledgeBase {
  private rules: TheoryRule[] = []
  private isInitialized = false

  /**
   * Initialize the knowledge base with pre-defined rules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Load music theory rules
    this.rules = this.createTheoryRules()
    
    // Pre-compute simple embeddings for rules (fallback)
    for (const rule of this.rules) {
      rule.embedding = this.generateSimpleEmbedding(rule.description)
    }

    this.isInitialized = true
    console.log(`📚 [KnowledgeBase] Loaded ${this.rules.length} music theory rules`)
  }

  /**
   * Create music theory rules
   */
  private createTheoryRules(): TheoryRule[] {
    return [
      // Cadence types
      {
        id: 'cadence_authentic',
        name: 'Authentic Cadence',
        description: 'Dominant chord resolving to tonic chord (V-I), melody descends to tonic note, creates strong sense of closure',
        category: 'cadence',
        features: { chordProgression: [5, 1], melodyContour: 'descending' },
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.95
      },
      {
        id: 'cadence_half',
        name: 'Half Cadence',
        description: 'Any chord resolving to dominant chord, creates sense of incompleteness, often at phrase midpoint',
        category: 'cadence',
        features: { chordProgression: [1, 5] },
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.9
      },
      {
        id: 'cadence_plagal',
        name: 'Plagal Cadence',
        description: 'Subdominant chord resolving to tonic (IV-I), also called Amen cadence, softer closure',
        category: 'cadence',
        features: { chordProgression: [4, 1] },
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.85
      },
      {
        id: 'cadence_deceptive',
        name: 'Deceptive Cadence',
        description: 'Dominant chord resolving to submediant (V-vi), unexpected resolution, extends phrase',
        category: 'cadence',
        features: { chordProgression: [5, 6] },
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.85
      },

      // Phrase structure rules
      {
        id: 'phrase_4bar',
        name: 'Four-bar Phrase',
        description: 'Standard phrase length of four measures, common in classical music, creates balanced structure',
        category: 'phrase',
        features: { rhythmPattern: '4-bar' },
        applicablePeriods: ['classical', 'romantic'],
        confidence: 0.9
      },
      {
        id: 'phrase_8bar',
        name: 'Eight-bar Period',
        description: 'Two four-bar phrases forming antecedent-consequent relationship, standard period structure',
        category: 'phrase',
        features: { rhythmPattern: '8-bar' },
        applicablePeriods: ['classical', 'romantic'],
        confidence: 0.9
      },
      {
        id: 'phrase_sentence',
        name: 'Sentence Structure',
        description: 'Basic idea (2 bars) repeated with variation, then continuation and cadence (4 bars)',
        category: 'phrase',
        features: { rhythmPattern: 'sentence' },
        applicablePeriods: ['classical'],
        confidence: 0.85
      },
      {
        id: 'phrase_period',
        name: 'Period Structure',
        description: 'Antecedent phrase ending with half cadence, consequent phrase ending with authentic cadence',
        category: 'phrase',
        features: { rhythmPattern: 'period' },
        applicablePeriods: ['classical', 'romantic'],
        confidence: 0.9
      },

      // Form types
      {
        id: 'form_binary',
        name: 'Binary Form',
        description: 'Two contrasting sections (AB), each typically repeated, common in dance movements',
        category: 'form',
        features: {},
        applicablePeriods: ['baroque', 'classical'],
        confidence: 0.9
      },
      {
        id: 'form_ternary',
        name: 'Ternary Form',
        description: 'Three-part form (ABA), first section returns after contrasting middle section',
        category: 'form',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.9
      },
      {
        id: 'form_sonata',
        name: 'Sonata Form',
        description: 'Exposition with two themes, development section, recapitulation returning to tonic',
        category: 'form',
        features: {},
        applicablePeriods: ['classical', 'romantic'],
        confidence: 0.95
      },
      {
        id: 'form_rondo',
        name: 'Rondo Form',
        description: 'Main theme alternates with contrasting episodes (ABACA or ABACABA)',
        category: 'form',
        features: {},
        applicablePeriods: ['classical', 'romantic'],
        confidence: 0.9
      },
      {
        id: 'form_variation',
        name: 'Theme and Variations',
        description: 'Theme presented then varied through melodic, harmonic, rhythmic, or textural changes',
        category: 'form',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.9
      },

      // Tonality rules
      {
        id: 'tonality_major',
        name: 'Major Tonality',
        description: 'Bright, happy character, major third above tonic, stable and resolved feeling',
        category: 'tonality',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.95
      },
      {
        id: 'tonality_minor',
        name: 'Minor Tonality',
        description: 'Dark, sad character, minor third above tonic, often more dramatic or melancholic',
        category: 'tonality',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.95
      },
      {
        id: 'tonality_modulation',
        name: 'Modulation',
        description: 'Change of key center, often to dominant or relative major/minor, creates contrast',
        category: 'tonality',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.85
      },

      // Texture rules
      {
        id: 'texture_homophonic',
        name: 'Homophonic Texture',
        description: 'Single melody with chordal accompaniment, most common in classical period',
        category: 'texture',
        features: {},
        applicablePeriods: ['classical', 'romantic'],
        confidence: 0.9
      },
      {
        id: 'texture_polyphonic',
        name: 'Polyphonic Texture',
        description: 'Multiple independent melodic lines, common in baroque fugues and inventions',
        category: 'texture',
        features: {},
        applicablePeriods: ['baroque', 'classical'],
        confidence: 0.9
      },
      {
        id: 'texture_monophonic',
        name: 'Monophonic Texture',
        description: 'Single unaccompanied melodic line, used for emphasis or contrast',
        category: 'texture',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.85
      },

      // Rhythm rules
      {
        id: 'rhythm_syncopation',
        name: 'Syncopation',
        description: 'Emphasis on weak beats or off-beats, creates rhythmic tension and energy',
        category: 'rhythm',
        features: { rhythmPattern: 'syncopated' },
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.85
      },
      {
        id: 'rhythm_hemiola',
        name: 'Hemiola',
        description: 'Temporary shift from triple to duple meter feel, common before cadences',
        category: 'rhythm',
        features: { rhythmPattern: 'hemiola' },
        applicablePeriods: ['baroque', 'classical'],
        confidence: 0.8
      },
      {
        id: 'rhythm_ostinato',
        name: 'Ostinato',
        description: 'Repeated rhythmic or melodic pattern, provides foundation and continuity',
        category: 'rhythm',
        features: { rhythmPattern: 'ostinato' },
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.85
      },

      // Melody rules
      {
        id: 'melody_sequence',
        name: 'Melodic Sequence',
        description: 'Repetition of melodic pattern at different pitch levels, creates momentum',
        category: 'melody',
        features: { melodyContour: 'sequential' },
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.9
      },
      {
        id: 'melody_stepwise',
        name: 'Stepwise Motion',
        description: 'Melody moves by adjacent scale degrees, smooth and singable character',
        category: 'melody',
        features: { melodyContour: 'stepwise' },
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.85
      },
      {
        id: 'melody_leap',
        name: 'Melodic Leap',
        description: 'Large interval jump in melody, creates emphasis and dramatic effect',
        category: 'melody',
        features: { melodyContour: 'leaping' },
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.85
      },
      {
        id: 'melody_arch',
        name: 'Arch Contour',
        description: 'Melody rises to climax then descends, common phrase shape',
        category: 'melody',
        features: { melodyContour: 'arch' },
        applicablePeriods: ['baroque', 'classical', 'romantic'],
        confidence: 0.85
      },

      // Emotion-related rules
      {
        id: 'emotion_energetic',
        name: 'Energetic Character',
        description: 'Fast tempo, strong dynamics, rhythmic drive, ascending patterns, major mode',
        category: 'melody',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.85
      },
      {
        id: 'emotion_calm',
        name: 'Calm Character',
        description: 'Slow tempo, soft dynamics, smooth legato, consonant harmony, stable rhythm',
        category: 'melody',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.85
      },
      {
        id: 'emotion_dramatic',
        name: 'Dramatic Character',
        description: 'Strong contrasts, dissonance, dynamic extremes, irregular rhythm, tension',
        category: 'melody',
        features: {},
        applicablePeriods: ['baroque', 'classical', 'romantic', 'modern'],
        confidence: 0.85
      },
      {
        id: 'emotion_playful',
        name: 'Playful Character',
        description: 'Light staccato, quick tempo, major mode, simple harmony, dance-like rhythm',
        category: 'melody',
        features: {},
        applicablePeriods: ['classical', 'romantic'],
        confidence: 0.85
      }
    ]
  }

  /**
   * Generate simple embedding for text (fallback when model not available)
   */
  private generateSimpleEmbedding(text: string): number[] {
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
   * Calculate cosine similarity
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
   * Search for relevant rules using embedding similarity
   */
  searchRules(queryEmbedding: number[], topK: number = 5): TheoryRule[] {
    const scored = this.rules.map(rule => ({
      rule,
      similarity: this.cosineSimilarity(queryEmbedding, rule.embedding || [])
    }))
    
    // Sort by similarity
    scored.sort((a, b) => b.similarity - a.similarity)
    
    // Return top K with similarity scores
    return scored.slice(0, topK).map(item => ({
      ...item.rule,
      similarity: item.similarity
    }))
  }

  /**
   * Search rules by category
   */
  searchByCategory(category: TheoryRule['category']): TheoryRule[] {
    return this.rules.filter(rule => rule.category === category)
  }

  /**
   * Get all rules
   */
  getAllRules(): TheoryRule[] {
    return this.rules
  }

  /**
   * Get rule by ID
   */
  getRuleById(id: string): TheoryRule | undefined {
    return this.rules.find(rule => rule.id === id)
  }

  /**
   * Update rule embedding (when model is available)
   */
  updateRuleEmbedding(ruleId: string, embedding: number[]): void {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      rule.embedding = embedding
    }
  }

  /**
   * Get rules count
   */
  getRulesCount(): number {
    return this.rules.length
  }
}
