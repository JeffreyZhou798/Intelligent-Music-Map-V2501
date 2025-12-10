/**
 * File Service
 * Handles parsing and export of MusicXML and MVT files
 */

import JSZip from 'jszip'
import type { MusicXMLData, MVTData, VisualMapping, Measure, Note } from '@/types'

export class FileService {
  /**
   * Parse MusicXML file using DOMParser (browser-native)
   * Supports both .musicxml/.xml and compressed .mxl formats
   */
  static async parseMusicXML(file: File): Promise<MusicXMLData> {
    try {
      let text: string
      
      // Check if file is .mxl (compressed MusicXML)
      if (file.name.toLowerCase().endsWith('.mxl')) {
        text = await this.extractMXL(file)
      } else {
        text = await file.text()
      }
      
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        throw new Error('Failed to parse MusicXML file. Please ensure it is a valid MusicXML document.')
      }

      // Extract basic information
      const scorePartwise = xmlDoc.querySelector('score-partwise')
      if (!scorePartwise) {
        throw new Error('Invalid MusicXML format: score-partwise element not found')
      }

      const workTitle = xmlDoc.querySelector('work work-title')?.textContent || 'Untitled'
      const creator = xmlDoc.querySelector('identification creator')?.textContent || 'Unknown'
      
      // Extract time and key signature from first measure attributes
      const firstAttributes = xmlDoc.querySelector('part measure attributes')
      const timeBeats = firstAttributes?.querySelector('time beats')?.textContent || '4'
      const timeBeatType = firstAttributes?.querySelector('time beat-type')?.textContent || '4'
      const fifths = firstAttributes?.querySelector('key fifths')?.textContent || '0'
      
      const timeSignature = `${timeBeats}/${timeBeatType}`
      const keySignature = this.fifthsToKey(parseInt(fifths))

      const musicData: MusicXMLData = {
        title: workTitle,
        composer: creator,
        timeSignature,
        keySignature,
        measures: this.extractMeasuresFromXML(xmlDoc)
      }

      return musicData
    } catch (error) {
      throw new Error('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  /**
   * Public method to extract MusicXML content from .mxl file
   */
  static async extractMXLContent(file: File): Promise<string> {
    return this.extractMXL(file)
  }

  /**
   * Extract MusicXML content from compressed .mxl file
   */
  private static async extractMXL(file: File): Promise<string> {
    const zip = new JSZip()
    const contents = await zip.loadAsync(file)
    
    // MXL files contain a META-INF/container.xml that points to the main XML file
    // Or we can look for the .xml file directly
    const containerFile = contents.file('META-INF/container.xml')
    
    let xmlFileName: string | null = null
    
    if (containerFile) {
      // Parse container.xml to find the rootfile
      const containerXml = await containerFile.async('string')
      const parser = new DOMParser()
      const containerDoc = parser.parseFromString(containerXml, 'text/xml')
      const rootfile = containerDoc.querySelector('rootfile')
      xmlFileName = rootfile?.getAttribute('full-path') || null
    }
    
    // If no container.xml or rootfile not found, search for XML files
    if (!xmlFileName) {
      const xmlFiles = Object.keys(contents.files).filter(
        name => name.endsWith('.xml') && !name.includes('META-INF')
      )
      if (xmlFiles.length > 0) {
        xmlFileName = xmlFiles[0]
      }
    }
    
    if (!xmlFileName) {
      throw new Error('No MusicXML file found in .mxl archive')
    }
    
    const xmlFile = contents.file(xmlFileName)
    if (!xmlFile) {
      throw new Error(`Could not find ${xmlFileName} in .mxl archive`)
    }
    
    const xmlContent = await xmlFile.async('string')
    console.log(`✅ [FileService] Extracted MusicXML from .mxl: ${xmlFileName}`)
    return xmlContent
  }

  /**
   * Convert fifths to key signature
   */
  private static fifthsToKey(fifths: number): string {
    const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#']
    const flatKeys = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']
    
    if (fifths >= 0) {
      return keys[Math.min(fifths, keys.length - 1)]
    } else {
      return flatKeys[Math.min(Math.abs(fifths), flatKeys.length - 1)]
    }
  }

  /**
   * Extract measures from MusicXML XML document (browser DOM)
   */
  private static extractMeasuresFromXML(xmlDoc: Document): Measure[] {
    const measures: Measure[] = []
    const measureElements = xmlDoc.querySelectorAll('part measure')

    measureElements.forEach((measureElement, index) => {
      measures.push({
        number: index + 1,
        notes: this.extractNotesFromElement(measureElement as Element),
        chords: []
      })
    })

    return measures
  }

  /**
   * Extract notes from a measure element (browser DOM)
   */
  private static extractNotesFromElement(measureElement: Element): Note[] {
    const notes: Note[] = []
    const noteElements = measureElement.querySelectorAll('note')
    const measureNumber = measureElement.getAttribute('number') || '1'

    noteElements.forEach((noteElement) => {
      // Skip rests
      if (noteElement.querySelector('rest')) {
        return
      }

      const pitchElement = noteElement.querySelector('pitch')
      if (!pitchElement) {
        return
      }

      const step = pitchElement.querySelector('step')?.textContent || 'C'
      const octave = pitchElement.querySelector('octave')?.textContent || '4'
      const alter = pitchElement.querySelector('alter')?.textContent || ''
      
      const durationText = noteElement.querySelector('duration')?.textContent || '1'
      const duration = parseFloat(durationText)

      // Format alter as accidental symbol
      let accidental = ''
      if (alter === '1') accidental = '#'
      else if (alter === '-1') accidental = 'b'
      else if (alter) accidental = alter

      notes.push({
        pitch: `${step}${accidental}${octave}`,
        duration,
        measure: parseInt(measureNumber),
        beat: 1 // Simplified, should calculate from divisions
      })
    })

    return notes
  }

  /**
   * Parse MVT file (ZIP containing MusicXML, JSON, SVG)
   */
  static async parseMVT(file: File): Promise<MVTData> {
    try {
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)

      // Extract MusicXML
      const musicXMLFile = contents.file(/\.musicxml$/i)[0] || contents.file(/\.xml$/i)[0]
      if (!musicXMLFile) {
        throw new Error('No MusicXML file found in MVT package')
      }
      const musicXML = await musicXMLFile.async('string')

      // Extract JSON config
      const jsonFile = contents.file(/music_visual_map\.json$/i)[0]
      let visualMap: VisualMapping[] = []
      let metadata = {
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }

      if (jsonFile) {
        const jsonContent = await jsonFile.async('string')
        const jsonData = JSON.parse(jsonContent)
        visualMap = jsonData.visualMap || []
        metadata = jsonData.metadata || metadata
      }

      return {
        musicXML,
        visualMap,
        metadata
      }
    } catch (error) {
      throw new Error('Failed to parse MVT file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  /**
   * Add color annotations to MusicXML based on visual mappings with structure information
   * Uses proper MusicXML format and adds lyric annotations for visual scheme info
   */
  static addColorAnnotationsToMusicXMLWithStructures(
    musicXML: string,
    visualMap: VisualMapping[],
    structures: any[]
  ): string {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(musicXML, 'text/xml')

      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        console.warn('Failed to parse MusicXML for color annotation')
        return musicXML
      }

      const parts = xmlDoc.querySelectorAll('part')

      parts.forEach(part => {
        const measures = part.querySelectorAll('measure')

        measures.forEach(measure => {
          const measureNumber = parseInt(measure.getAttribute('number') || '0')

          // Find which structure this measure belongs to
          for (const mapping of visualMap) {
            const structure = structures.find(s => s.id === mapping.structureId)
            if (!structure) continue

            // Check if this measure is within the structure's range
            if (measureNumber >= structure.startMeasure && measureNumber <= structure.endMeasure) {
              if (mapping.scheme.elements.length === 0) continue

              // Get the first element's color (primary color for this structure)
              const primaryColor = mapping.scheme.elements[0].color

              // Convert hex color to ARGB format for MusicXML (AARRGGBB in hex)
              const colorHex = primaryColor.replace('#', '').toUpperCase()
              const argbColor = `#FF${colorHex}` // FF = fully opaque

              // Create visual scheme description
              const schemeDesc = mapping.scheme.elements
                .map(e => `${e.type}(${e.color})`)
                .join(' + ')

              // Add color to all notes in this measure
              const notes = measure.querySelectorAll('note')
              let isFirstNoteInMeasure = measureNumber === structure.startMeasure
              
              notes.forEach((note, noteIndex) => {
                // Skip rests
                if (note.querySelector('rest')) return

                const isChord = note.querySelector('chord')
                
                // Apply color to all notes (including chord notes)
                // Add color attribute directly to note element
                note.setAttribute('color', argbColor)

                // Also try setting color on notehead
                let notehead = note.querySelector('notehead')
                if (!notehead) {
                  notehead = xmlDoc.createElement('notehead')
                  const pitch = note.querySelector('pitch')
                  if (pitch) {
                    // Insert after pitch
                    if (pitch.nextSibling) {
                      note.insertBefore(notehead, pitch.nextSibling)
                    } else {
                      note.appendChild(notehead)
                    }
                  }
                }
                if (notehead) {
                  notehead.setAttribute('color', argbColor)
                }

                // Set color on stem and beam
                let stem = note.querySelector('stem')
                if (stem) {
                  stem.setAttribute('color', argbColor)
                }

                let beam = note.querySelector('beam')
                if (beam) {
                  beam.setAttribute('color', argbColor)
                }

                // Add lyric annotation at first note of structure
                if (isFirstNoteInMeasure && noteIndex === 0 && !isChord) {
                  // Add lyric to show structure info
                  const lyric = xmlDoc.createElement('lyric')
                  lyric.setAttribute('number', '2') // Use lyric line 2
                  lyric.setAttribute('color', argbColor)
                  
                  const syllabic = xmlDoc.createElement('syllabic')
                  syllabic.textContent = 'single'
                  
                  const text = xmlDoc.createElement('text')
                  text.textContent = `[${structure.id}: ${schemeDesc}]`
                  
                  lyric.appendChild(syllabic)
                  lyric.appendChild(text)
                  note.appendChild(lyric)
                  
                  isFirstNoteInMeasure = false
                }
              })

              break // Found the structure, no need to check others
            }
          }
        })
      })

      const serializer = new XMLSerializer()
      const result = serializer.serializeToString(xmlDoc)
      
      console.log('✅ [FileService] Added color annotations to MusicXML')
      return result
    } catch (error) {
      console.error('❌ [FileService] Failed to add color annotations:', error)
      return musicXML
    }
  }

  /**
   * Export MVT file (ZIP package with all project data)
   */
  static async exportMVT(
    musicXML: string,
    visualMap: VisualMapping[],
    structures: any[],
    svgContent?: string,
    pngBlob?: Blob,
    projectData?: {
      musicData?: any
      formType?: string
      emotions?: any[]
      similarityGroups?: any[]
    }
  ): Promise<Blob> {
    try {
      const zip = new JSZip()

      // Add color-annotated MusicXML file
      const annotatedXML = this.addColorAnnotationsToMusicXMLWithStructures(
        musicXML,
        visualMap,
        structures
      )
      zip.file('music.musicxml', annotatedXML)

      // Add complete project JSON for re-import (machine-readable)
      const projectJson = {
        // Core music data
        musicData: projectData?.musicData || null,
        xmlContent: musicXML,
        
        // Analysis results
        structures,
        formType: projectData?.formType || null,
        emotions: projectData?.emotions || [],
        similarityGroups: projectData?.similarityGroups || [],
        
        // Visual mappings
        visualMappings: visualMap,
        
        // Metadata
        metadata: {
          createdAt: new Date().toISOString(),
          version: '2.0.0',
          format: 'imm-project' // Intelligent Music Map project format
        }
      }
      zip.file('project.json', JSON.stringify(projectJson, null, 2))

      // Add legacy visual map JSON for backward compatibility
      const legacyJsonData = {
        visualMap,
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0.0'
        }
      }
      zip.file('music_visual_map.json', JSON.stringify(legacyJsonData, null, 2))

      // Add SVG if provided
      if (svgContent) {
        zip.file('music_visual_map.svg', svgContent)
      }

      // Add PNG if provided
      if (pngBlob) {
        zip.file('music_visual_map.png', pngBlob)
      }

      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' })
      return blob
    } catch (error) {
      throw new Error('Failed to create MVT file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  /**
   * Export standalone JSON project file for re-import
   */
  static exportProjectJSON(
    musicXML: string,
    musicData: any,
    structures: any[],
    formType: string | null,
    emotions: any[],
    similarityGroups: any[],
    visualMappings: VisualMapping[]
  ): Blob {
    const projectJson = {
      musicData,
      xmlContent: musicXML,
      structures,
      formType,
      emotions,
      similarityGroups,
      visualMappings,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '2.0.0',
        format: 'imm-project'
      }
    }
    
    const jsonString = JSON.stringify(projectJson, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  }

  /**
   * Export SVG to PNG
   */
  static async convertSVGToPNG(svgElement: SVGSVGElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        const svgData = new XMLSerializer().serializeToString(svgElement)
        const img = new Image()

        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create PNG blob'))
            }
          }, 'image/png')
        }

        img.onerror = () => {
          reject(new Error('Failed to load SVG image'))
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Download file to browser
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
