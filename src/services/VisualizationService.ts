/**
 * Visualization Service
 * Generates SVG and PNG visual maps with measure annotations
 */

import type { VisualMapping, MusicStructure } from '@/types'

export class VisualizationService {
  /**
   * Generate SVG visual map with measure annotations
   */
  static generateSVG(
    mappings: VisualMapping[],
    structures: MusicStructure[],
    title: string = 'Music Visual Map'
  ): string {
    const width = 1200
    const itemHeight = 120
    const padding = 40
    const height = structures.length * itemHeight + padding * 2

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #303133; }
      .structure-label { font-family: Arial, sans-serif; font-size: 14px; fill: #606266; }
      .measure-label { font-family: Arial, sans-serif; font-size: 12px; fill: #909399; }
      .shape-label { font-family: Arial, sans-serif; font-size: 10px; fill: #606266; text-anchor: middle; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#F5F7FA"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="30" text-anchor="middle" class="title">${this.escapeXML(title)}</text>
`

    // Draw each structure with its visual elements
    structures.forEach((structure, index) => {
      const mapping = mappings.find(m => m.structureId === structure.id)
      if (!mapping) return

      const y = padding + 60 + index * itemHeight
      const elementsStartX = 400

      // Structure label
      svg += `  <!-- Structure ${structure.id} -->
  <text x="20" y="${y}" class="structure-label">${this.escapeXML(structure.id)}</text>
  <text x="20" y="${y + 20}" class="measure-label">Measures ${structure.startMeasure}-${structure.endMeasure}</text>
`

      // Draw visual elements
      const elements = mapping.scheme.elements
      const spacing = 100

      elements.forEach((element, elemIndex) => {
        const x = elementsStartX + elemIndex * spacing
        const shapeY = y - 10

        svg += this.generateShape(element.type, x, shapeY, element.color, element.size || 60)
        
        // Shape label
        svg += `  <text x="${x}" y="${shapeY + 50}" class="shape-label">${this.escapeXML(element.type)}</text>\n`
      })

      // Draw divider line
      if (index < structures.length - 1) {
        svg += `  <line x1="20" y1="${y + 60}" x2="${width - 20}" y2="${y + 60}" stroke="#E4E7ED" stroke-width="1"/>\n`
      }
    })

    svg += `</svg>`

    return svg
  }

  /**
   * Generate shape SVG element
   */
  private static generateShape(
    type: string,
    x: number,
    y: number,
    color: string,
    size: number
  ): string {
    const halfSize = size / 2

    switch (type) {
      case 'circle':
        return `  <circle cx="${x}" cy="${y}" r="${halfSize}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
      
      case 'square':
        return `  <rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
      
      case 'triangle':
        const points = `${x},${y - halfSize} ${x - halfSize},${y + halfSize} ${x + halfSize},${y + halfSize}`
        return `  <polygon points="${points}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
      
      case 'star':
        return this.generateStar(x, y, halfSize, color)
      
      case 'diamond':
        const dPoints = `${x},${y - halfSize} ${x + halfSize},${y} ${x},${y + halfSize} ${x - halfSize},${y}`
        return `  <polygon points="${dPoints}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
      
      case 'hexagon':
        return this.generateHexagon(x, y, halfSize, color)
      
      case 'wave':
        return this.generateWave(x, y, size, color)
      
      case 'bar':
        return `  <rect x="${x - halfSize / 2}" y="${y - halfSize}" width="${halfSize}" height="${size}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
      
      case 'line':
        return `  <line x1="${x - halfSize}" y1="${y}" x2="${x + halfSize}" y2="${y}" stroke="${color}" stroke-width="8" stroke-linecap="round"/>\n`
      
      case 'rect':
        return `  <rect x="${x - halfSize * 1.2}" y="${y - halfSize / 2}" width="${size * 1.2}" height="${halfSize}" fill="${color}" stroke="#fff" stroke-width="2" rx="4"/>\n`
      
      default:
        return `  <circle cx="${x}" cy="${y}" r="${halfSize}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
    }
  }

  /**
   * Generate star shape
   */
  private static generateStar(x: number, y: number, radius: number, color: string): string {
    const points: string[] = []
    const outerRadius = radius
    const innerRadius = radius * 0.4

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2
      const r = i % 2 === 0 ? outerRadius : innerRadius
      const px = x + r * Math.cos(angle)
      const py = y + r * Math.sin(angle)
      points.push(`${px.toFixed(2)},${py.toFixed(2)}`)
    }

    return `  <polygon points="${points.join(' ')}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
  }

  /**
   * Generate hexagon shape
   */
  private static generateHexagon(x: number, y: number, radius: number, color: string): string {
    const points: string[] = []

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const px = x + radius * Math.cos(angle)
      const py = y + radius * Math.sin(angle)
      points.push(`${px.toFixed(2)},${py.toFixed(2)}`)
    }

    return `  <polygon points="${points.join(' ')}" fill="${color}" stroke="#fff" stroke-width="2"/>\n`
  }

  /**
   * Generate wave shape
   */
  private static generateWave(x: number, y: number, size: number, color: string): string {
    const halfSize = size / 2
    const path = `M ${x - halfSize},${y} Q ${x - halfSize / 2},${y - halfSize / 2} ${x},${y} T ${x + halfSize},${y}`
    return `  <path d="${path}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>\n`
  }

  /**
   * Escape XML special characters
   */
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Convert SVG string to PNG blob
   */
  static async convertSVGToPNG(svgString: string, width: number = 1200): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        const img = new Image()
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
          // Set canvas size with scale for better quality
          const scale = 2
          canvas.width = width * scale
          canvas.height = (img.height / img.width) * width * scale
          
          // Scale context for high DPI
          ctx.scale(scale, scale)
          
          // Draw with white background
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, canvas.height / scale)
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, canvas.height / scale)
          
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url)
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to create PNG blob'))
              }
            },
            'image/png',
            0.95
          )
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load SVG image'))
        }

        img.src = url
      } catch (error) {
        reject(error)
      }
    })
  }
}
