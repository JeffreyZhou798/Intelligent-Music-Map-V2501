/**
 * Audio Service
 * Handles audio file processing and playback
 */

import type { AudioFileData } from '@/types'

export class AudioService {
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /**
   * Parse MP3 file and create AudioFileData
   */
  async parseAudioFile(file: File): Promise<AudioFileData> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available')
    }

    // Create object URL for playback
    const url = URL.createObjectURL(file)

    // Decode audio data
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

    return {
      file,
      audioBuffer,
      duration: audioBuffer.duration,
      url
    }
  }

  /**
   * Extract audio features for analysis
   */
  async extractAudioFeatures(audioBuffer: AudioBuffer) {
    const channelData = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    
    // Calculate basic features
    const energy = this.calculateEnergy(channelData)
    const zeroCrossingRate = this.calculateZeroCrossingRate(channelData)
    const spectralCentroid = this.calculateSpectralCentroid(channelData, sampleRate)
    
    return {
      energy,
      zeroCrossingRate,
      spectralCentroid,
      duration: audioBuffer.duration,
      sampleRate
    }
  }

  /**
   * Calculate energy (RMS)
   */
  private calculateEnergy(data: Float32Array): number {
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i]
    }
    return Math.sqrt(sum / data.length)
  }

  /**
   * Calculate zero crossing rate
   */
  private calculateZeroCrossingRate(data: Float32Array): number {
    let crossings = 0
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
        crossings++
      }
    }
    return crossings / data.length
  }

  /**
   * Calculate spectral centroid (simplified)
   */
  private calculateSpectralCentroid(data: Float32Array, sampleRate: number): number {
    // Simplified calculation - in production, use FFT
    const nyquist = sampleRate / 2
    let weightedSum = 0
    let sum = 0
    
    for (let i = 0; i < Math.min(data.length, 1024); i++) {
      const magnitude = Math.abs(data[i])
      const frequency = (i / 1024) * nyquist
      weightedSum += frequency * magnitude
      sum += magnitude
    }
    
    return sum > 0 ? weightedSum / sum : 0
  }

  /**
   * Map audio time to measure number
   */
  mapTimeToMeasure(time: number, totalDuration: number, totalMeasures: number): number {
    const measureDuration = totalDuration / totalMeasures
    return Math.floor(time / measureDuration) + 1
  }

  /**
   * Map measure to audio time
   */
  mapMeasureToTime(measure: number, totalDuration: number, totalMeasures: number): number {
    const measureDuration = totalDuration / totalMeasures
    return (measure - 1) * measureDuration
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export const audioService = new AudioService()
