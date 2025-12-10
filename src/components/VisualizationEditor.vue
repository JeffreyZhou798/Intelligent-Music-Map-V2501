<template>
  <div class="visualization-editor">
    <!-- Main Two-Column Layout: Structures + Editor -->
    <div class="main-layout">
      <!-- Left Column: Music Structures -->
      <div class="left-column">
        <div class="structures-section">
          <h3>Music Structures</h3>
          <div class="completion-info">
            <span>{{ completedCount }}/{{ totalCount }} completed</span>
          </div>
          <div class="structures-grid">
            <div 
              v-for="structure in musicStore.phraseStructures" 
              :key="structure.id"
              class="structure-card"
              :class="{ 
                'active': selectedStructure === structure.id,
                'configured': visualStore.getMapping(structure.id)
              }"
              @click="selectStructure(structure.id)"
            >
              <div class="card-header">
                <span class="structure-name">{{ structure.id }}</span>
                <span class="measure-range">M{{ structure.startMeasure }}-{{ structure.endMeasure }}</span>
                <el-tag 
                  v-if="getStructureSimilarityGroup(structure.id)"
                  :type="getSimilarityGroupColor(getStructureSimilarityGroup(structure.id))"
                  size="small"
                  round
                >
                  {{ getStructureSimilarityGroup(structure.id) }}
                </el-tag>
              </div>
              <div class="card-body">
                <el-tag 
                  v-if="structure.emotion"
                  :type="getEmotionTagType(structure.emotion.primary)"
                  size="small"
                >
                  {{ structure.emotion.primary }}
                </el-tag>
                <div class="status-icons">
                  <el-icon v-if="visualStore.getMapping(structure.id)" class="icon-configured">
                    <CircleCheckFilled />
                  </el-icon>
                  <el-icon v-else class="icon-pending">
                    <Clock />
                  </el-icon>
                  <el-icon 
                    v-if="visualStore.getMapping(structure.id)" 
                    class="icon-preview"
                    @click.stop="previewStructure(structure.id)"
                  >
                    <View />
                  </el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: AI Recommendations & Customize -->
      <div class="right-column">
        <!-- Selected Structure Header -->
        <div class="editor-panel">
          <div v-if="selectedStructure" class="editor-header">
            <div class="editor-title">
              <h3>{{ selectedStructure }}</h3>
              <span class="editor-subtitle">
                Measures {{ getSelectedStructureData?.startMeasure }} - {{ getSelectedStructureData?.endMeasure }}
              </span>
              <span 
                v-if="getSelectedStructureData?.emotion"
                class="emotion-badge"
                :class="getSelectedStructureData.emotion.primary"
              >
                {{ getSelectedStructureData.emotion.primary }}
              </span>
            </div>
          </div>
          <div v-else class="editor-header placeholder">
            <div class="editor-title">
              <h3>Select a Structure</h3>
              <span class="editor-subtitle">Click on a structure card to configure its visual elements</span>
            </div>
          </div>

          <div class="editor-content">
            <!-- AI Recommendations -->
            <div class="recommendations-section">
              <div class="section-header">
                <h4>AI Recommendations</h4>
                <el-button 
                  size="small" 
                  :icon="Refresh" 
                  :loading="isGenerating"
                  :disabled="!selectedStructure"
                  @click="regenerateRecommendations"
                >
                  Regenerate
                </el-button>
              </div>
              
              <div v-if="isGenerating" class="loading-state">
                <el-progress :percentage="generationProgress" :stroke-width="6" />
                <span>{{ generationStatusText }}</span>
              </div>
              
              <div v-else-if="currentRecommendations.length > 0" class="recommendation-options">
                <div 
                  v-for="(option, index) in currentRecommendations" 
                  :key="option.id"
                  class="recommendation-card"
                  :class="{ 'selected': selectedRecommendation === option.id }"
                  @click="selectRecommendation(option)"
                >
                  <div class="option-visual-box">
                    <div 
                      v-for="(element, idx) in option.elements.slice(0, 3)" 
                      :key="idx"
                      class="shape-icon-wrapper animated"
                      :class="element.animation?.type || 'pulse'"
                    >
                      <svg v-if="element.type === 'circle'" viewBox="0 0 40 40" class="shape-svg">
                        <circle cx="20" cy="20" r="18" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.type === 'star'" viewBox="0 0 40 40" class="shape-svg">
                        <polygon points="20,2 25,15 39,15 28,24 32,38 20,30 8,38 12,24 1,15 15,15" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.type === 'triangle'" viewBox="0 0 40 40" class="shape-svg">
                        <polygon points="20,4 38,36 2,36" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.type === 'square' || element.type === 'rect'" viewBox="0 0 40 40" class="shape-svg">
                        <rect x="4" y="4" width="32" height="32" rx="4" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.type === 'diamond'" viewBox="0 0 40 40" class="shape-svg">
                        <polygon points="20,2 38,20 20,38 2,20" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.type === 'hexagon'" viewBox="0 0 40 40" class="shape-svg">
                        <polygon points="20,2 36,10 36,30 20,38 4,30 4,10" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.type === 'pentagon'" viewBox="0 0 40 40" class="shape-svg">
                        <polygon points="20,2 38,15 32,36 8,36 2,15" :fill="element.color" />
                      </svg>
                      <svg v-else viewBox="0 0 40 40" class="shape-svg">
                        <ellipse cx="20" cy="20" rx="18" ry="14" :fill="element.color" />
                      </svg>
                    </div>
                  </div>
                  <div class="option-label">Option {{ index + 1 }}</div>
                  <div class="option-match">{{ Math.round(option.confidence * 100) }}% match</div>
                </div>
              </div>
              
              <div v-else class="empty-recommendations">
                <el-icon><Picture /></el-icon>
                <span>Select a structure to see AI recommendations</span>
              </div>
              
              <el-button 
                type="primary" 
                class="apply-btn"
                :disabled="!selectedRecommendation || !selectedStructure"
                @click="applyRecommendation"
              >
                <el-icon><Check /></el-icon>
                Apply AI Recommendation
              </el-button>
            </div>

            <!-- Customize Section -->
            <div class="customize-section">
              <div class="section-header">
                <h4>Customize</h4>
                <div class="mode-toggle">
                  <span :class="{ active: !multiElementMode }">Single</span>
                  <el-switch v-model="multiElementMode" />
                  <span :class="{ active: multiElementMode }">Multi-Element</span>
                </div>
              </div>

              <!-- Single Element Mode -->
              <template v-if="!multiElementMode">
                <div class="shape-selection">
                  <label>Shape</label>
                  <div class="shape-options">
                    <div 
                      v-for="shape in availableShapes" 
                      :key="shape.id"
                      class="shape-btn-svg"
                      :class="{ 'selected': selectedShape === shape.id }"
                      @click="selectedShape = shape.id"
                    >
                      <svg v-if="shape.id === 'circle'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <circle cx="16" cy="16" r="12" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'ellipse'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <ellipse cx="16" cy="16" rx="13" ry="9" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'square'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <rect x="5" y="5" width="22" height="22" rx="3" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'rect'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <rect x="3" y="8" width="26" height="16" rx="2" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'triangle'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,4 28,28 4,28" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'pentagon'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,3 29,12 24,28 8,28 3,12" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'hexagon'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,3 28,9 28,23 16,29 4,23 4,9" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'star'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,2 20,12 30,12 22,19 25,30 16,24 7,30 10,19 2,12 12,12" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'diamond'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,2 30,16 16,30 2,16" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else viewBox="0 0 32 32" class="shape-selector-svg">
                        <circle cx="16" cy="16" r="12" :fill="selectedShape === shape.id ? '#409eff' : '#606266'" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="color-selection">
                  <label>Color</label>
                  <div class="color-options">
                    <div 
                      v-for="color in availableColors" 
                      :key="color.id"
                      class="color-btn"
                      :class="{ 'selected': selectedColor === color.id, 'heart-btn': color.icon === 'heart' }"
                      :style="{ backgroundColor: color.icon !== 'heart' ? color.hex : 'transparent' }"
                      @click="selectedColor = color.id"
                    >
                      <svg v-if="color.icon === 'heart'" viewBox="0 0 24 24" class="heart-icon">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" :fill="color.hex"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="animation-selection">
                  <label>Animation</label>
                  <el-select v-model="selectedAnimation" placeholder="Select animation">
                    <el-option label="none" value="none" />
                    <el-option label="pulse" value="pulse" />
                    <el-option label="flash" value="flash" />
                    <el-option label="rotate" value="rotate" />
                    <el-option label="bounce" value="bounce" />
                    <el-option label="scale" value="scale" />
                    <el-option label="slide" value="slide" />
                    <el-option label="shake" value="shake" />
                    <el-option label="fade" value="fade" />
                  </el-select>
                </div>

                <div class="size-selection">
                  <label>Size</label>
                  <el-slider v-model="selectedSize" :min="20" :max="100" />
                </div>

                <el-button 
                  type="primary" 
                  class="apply-custom-btn" 
                  :disabled="!selectedStructure"
                  @click="applyCustomDesign"
                >
                  Apply Custom Design
                </el-button>
              </template>

              <!-- Multi-Element Mode -->
              <template v-else>
                <div class="multi-element-selection">
                  <label>Select Elements (click in order)</label>
                  <div class="shape-options with-numbers">
                    <div 
                      v-for="shape in availableShapes" 
                      :key="shape.id"
                      class="shape-btn-svg"
                      :class="{ 'selected': isShapeInMultiSelection(shape.id) }"
                      @click="toggleMultiShape(shape.id)"
                    >
                      <svg v-if="shape.id === 'circle'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <circle cx="16" cy="16" r="12" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'ellipse'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <ellipse cx="16" cy="16" rx="13" ry="9" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'square'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <rect x="5" y="5" width="22" height="22" rx="3" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'rect'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <rect x="3" y="8" width="26" height="16" rx="2" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'triangle'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,4 28,28 4,28" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'pentagon'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,3 29,12 24,28 8,28 3,12" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'hexagon'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,3 28,9 28,23 16,29 4,23 4,9" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'star'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,2 20,12 30,12 22,19 25,30 16,24 7,30 10,19 2,12 12,12" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else-if="shape.id === 'diamond'" viewBox="0 0 32 32" class="shape-selector-svg">
                        <polygon points="16,2 30,16 16,30 2,16" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <svg v-else viewBox="0 0 32 32" class="shape-selector-svg">
                        <circle cx="16" cy="16" r="12" :fill="isShapeInMultiSelection(shape.id) ? '#409eff' : '#606266'" />
                      </svg>
                      <span v-if="getMultiShapeOrder(shape.id)" class="order-badge">
                        {{ getMultiShapeOrder(shape.id) }}
                      </span>
                    </div>
                  </div>
                  <div v-if="multiSelectedShapes.length > 0" class="selected-order">
                    <span>Order:</span>
                    <el-tag 
                      v-for="(shapeId, idx) in multiSelectedShapes" 
                      :key="idx"
                      closable
                      @close="removeMultiShape(idx)"
                      type="primary"
                      size="small"
                    >
                      {{ idx + 1 }}. {{ shapeId }}
                    </el-tag>
                  </div>
                </div>

                <div class="color-selection">
                  <label>Colors (one per element)</label>
                  <div class="color-options large">
                    <div 
                      v-for="color in availableColors" 
                      :key="color.id"
                      class="color-btn"
                      :class="{ 'selected': isColorInMultiSelection(color.id) }"
                      :style="{ backgroundColor: color.hex }"
                      @click="toggleMultiColor(color.id)"
                    />
                  </div>
                </div>

                <div class="layout-selection">
                  <label>Combination Layout</label>
                  <div class="layout-options">
                    <div 
                      v-for="layout in layoutOptions" 
                      :key="layout.id"
                      class="layout-btn"
                      :class="{ 'selected': selectedLayout === layout.id }"
                      @click="selectedLayout = layout.id"
                    >
                      <el-icon><component :is="layout.icon" /></el-icon>
                      <span>{{ layout.name }}</span>
                    </div>
                  </div>
                  <div class="current-layout">
                    Current Layout: <span class="layout-name">{{ getLayoutName(selectedLayout) }}</span>
                  </div>
                </div>

                <div class="animation-selection">
                  <label>Animation</label>
                  <el-select v-model="selectedAnimation" placeholder="Select animation">
                    <el-option label="none" value="none" />
                    <el-option label="pulse" value="pulse" />
                    <el-option label="flash" value="flash" />
                    <el-option label="rotate" value="rotate" />
                    <el-option label="bounce" value="bounce" />
                    <el-option label="scale" value="scale" />
                    <el-option label="slide" value="slide" />
                    <el-option label="shake" value="shake" />
                    <el-option label="fade" value="fade" />
                  </el-select>
                </div>

                <div class="drag-canvas-section">
                  <label>
                    <el-icon><Pointer /></el-icon>
                    Drag Elements to Adjust Position
                    <span class="hint">(Click and drag elements)</span>
                  </label>
                  <div 
                    class="drag-canvas" 
                    ref="dragCanvasRef"
                    @mousemove="onCanvasMouseMove"
                    @mouseup="onCanvasMouseUp"
                    @mouseleave="onCanvasMouseUp"
                  >
                    <div 
                      v-for="(element, idx) in multiDragElements" 
                      :key="idx"
                      class="drag-element-svg"
                      :class="{ 'dragging': dragIndex === idx }"
                      :style="{ 
                        left: element.x + 'px', 
                        top: element.y + 'px'
                      }"
                      @mousedown.prevent="onElementMouseDown($event, idx)"
                    >
                      <svg v-if="element.shape === 'circle'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <circle cx="25" cy="25" r="22" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'ellipse'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <ellipse cx="25" cy="25" rx="23" ry="16" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'square'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <rect x="5" y="5" width="40" height="40" rx="5" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'rect'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <rect x="3" y="12" width="44" height="26" rx="4" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'triangle'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <polygon points="25,5 47,45 3,45" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'pentagon'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <polygon points="25,3 47,18 39,45 11,45 3,18" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'hexagon'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <polygon points="25,3 45,14 45,36 25,47 5,36 5,14" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'star'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <polygon points="25,3 31,18 47,18 35,28 39,45 25,36 11,45 15,28 3,18 19,18" :fill="element.color" />
                      </svg>
                      <svg v-else-if="element.shape === 'diamond'" viewBox="0 0 50 50" class="drag-shape-svg">
                        <polygon points="25,3 47,25 25,47 3,25" :fill="element.color" />
                      </svg>
                      <svg v-else viewBox="0 0 50 50" class="drag-shape-svg">
                        <circle cx="25" cy="25" r="22" :fill="element.color" />
                      </svg>
                      <span class="element-number">{{ idx + 1 }}</span>
                    </div>
                  </div>
                </div>

                <div class="multi-actions">
                  <el-button @click="clearMultiSelection">Clear All</el-button>
                  <el-button 
                    type="primary" 
                    :disabled="multiSelectedShapes.length === 0 || !selectedStructure"
                    @click="applyMultiElementDesign"
                  >
                    Apply Multi-Element Design ({{ multiSelectedShapes.length }})
                  </el-button>
                </div>
              </template>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Preview Section (Below Main Layout) -->
    <div class="preview-section-full">
      <h3>Preview</h3>
      <div class="preview-canvas-large" :class="{ 'custom-layout': hasCustomPositions }">
        <!-- Show applied scheme if exists -->
        <template v-if="appliedScheme">
          <!-- Custom layout with absolute positioning (when elements have position data) -->
          <template v-if="hasCustomPositions">
            <div class="custom-preview-container">
              <div 
                v-for="(element, idx) in appliedScheme.elements" 
                :key="idx"
                class="preview-shape-wrapper-absolute animated"
                :class="element.animation?.type || 'pulse'"
                :style="getCustomPositionStyle(element, idx)"
              >
                <svg v-if="element.type === 'circle'" :viewBox="'0 0 ' + (element.size || 60) + ' ' + (element.size || 60)" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <circle :cx="(element.size || 60) / 2" :cy="(element.size || 60) / 2" :r="(element.size || 60) / 2 - 2" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'star'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 37,22 58,22 42,36 48,57 30,45 12,57 18,36 2,22 23,22" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'triangle'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,5 57,55 3,55" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'square' || element.type === 'rect'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <rect x="5" y="5" width="50" height="50" rx="6" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'diamond'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 57,30 30,57 3,30" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'hexagon'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 54,15 54,45 30,57 6,45 6,15" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'pentagon'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 57,22 48,54 12,54 3,22" :fill="element.color" />
                </svg>
                <svg v-else viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <ellipse cx="30" cy="30" rx="27" ry="20" :fill="element.color" />
                </svg>
              </div>
            </div>
          </template>
          <!-- Standard layouts (horizontal, vertical, circular, grid) -->
          <template v-else>
            <div 
              class="applied-preview-container"
              :class="appliedScheme.layout"
            >
              <div 
                v-for="(element, idx) in appliedScheme.elements" 
                :key="idx"
                class="preview-shape-wrapper animated"
                :class="element.animation?.type || 'pulse'"
              >
                <svg v-if="element.type === 'circle'" :viewBox="'0 0 ' + (element.size || 60) + ' ' + (element.size || 60)" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <circle :cx="(element.size || 60) / 2" :cy="(element.size || 60) / 2" :r="(element.size || 60) / 2 - 2" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'star'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 37,22 58,22 42,36 48,57 30,45 12,57 18,36 2,22 23,22" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'triangle'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,5 57,55 3,55" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'square' || element.type === 'rect'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <rect x="5" y="5" width="50" height="50" rx="6" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'diamond'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 57,30 30,57 3,30" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'hexagon'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 54,15 54,45 30,57 6,45 6,15" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'pentagon'" viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <polygon points="30,3 57,22 48,54 12,54 3,22" :fill="element.color" />
                </svg>
                <svg v-else viewBox="0 0 60 60" class="preview-shape-svg" :style="{ width: (element.size || 60) + 'px', height: (element.size || 60) + 'px' }">
                  <ellipse cx="30" cy="30" rx="27" ry="20" :fill="element.color" />
                </svg>
              </div>
            </div>
          </template>
        </template>
        <!-- Show placeholder if no scheme applied -->
        <template v-else>
          <div class="preview-placeholder">
            <span>Select or create a visual scheme</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Similarity Groups Section -->
    <div v-if="musicStore.similarityGroups.length > 0" class="similarity-section">
      <h3>Similar Structure Groups</h3>
      <div class="similarity-cards">
        <div 
          v-for="group in musicStore.similarityGroups" 
          :key="group.groupId"
          class="similarity-card"
          :class="getSimilarityGroupColor(group.groupId)"
        >
          <div class="group-header">
            <el-tag :type="getSimilarityGroupColor(group.groupId)" size="small" round>
              {{ group.groupId }}
            </el-tag>
            <span class="group-title">Similar Group {{ group.groupId }}</span>
          </div>
          <div class="group-info">
            <span>{{ group.structureIds.length }} structures</span>
            <span class="similarity-score">{{ Math.round(group.similarityScore * 100) }}% similar</span>
          </div>
          <div class="group-members">
            {{ group.structureIds.join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Apply Sections -->
    <div v-if="selectedStructure && getSelectedStructureData?.emotion" class="batch-section">
      <!-- Apply to Same Emotion -->
      <div class="batch-card">
        <div class="batch-header">
          <h4>Apply to Same Emotion</h4>
          <span class="batch-count">{{ getSameEmotionCount }} structures</span>
        </div>
        <p class="batch-desc">
          Apply this visual scheme to all structures with the same emotion: 
          <span 
            class="emotion-badge inline"
            :class="getSelectedStructureData.emotion.primary"
          >
            {{ getSelectedStructureData.emotion.primary }}
          </span>
        </p>
        <el-button 
          type="success" 
          class="batch-btn"
          :disabled="!visualStore.getMapping(selectedStructure)"
          @click="applyToSameEmotion"
        >
          <el-icon><CopyDocument /></el-icon>
          Apply to All Same Emotion ({{ getSameEmotionCount }})
        </el-button>
      </div>

      <!-- Apply to Related Structures -->
      <div class="batch-card">
        <div class="batch-header">
          <h4>Apply to Related Structures</h4>
          <el-button size="small" type="primary" plain @click="analyzeRelatedStructures">
            <el-icon><Search /></el-icon>
            AI Analyze Similar Structures
          </el-button>
        </div>
        <p class="batch-desc">
          AI has identified {{ musicStore.similarityGroups.length }} similar structure groups. Select the group this structure belongs to and apply the same visual scheme with one click.
        </p>
        
        <div v-if="currentStructureSimilarityGroup" class="related-group">
          <div class="group-badge">
            <el-tag :type="getSimilarityGroupColor(currentStructureSimilarityGroup.groupId)" round>
              {{ currentStructureSimilarityGroup.groupId }}
            </el-tag>
            <span class="group-name">Similar Group {{ currentStructureSimilarityGroup.groupId }}</span>
            <span class="current-tag">Current Structure</span>
            <el-tag type="info" size="small">Current Structure</el-tag>
          </div>
          <div class="group-details">
            <p>This group contains {{ currentStructureSimilarityGroup.structureIds.length }} similar structures, average similarity: {{ Math.round(currentStructureSimilarityGroup.similarityScore * 100) }}%</p>
          </div>
          <el-button 
            type="success" 
            class="batch-btn"
            :disabled="!visualStore.getMapping(selectedStructure)"
            @click="applyToSimilarGroup"
          >
            <el-icon><CopyDocument /></el-icon>
            Apply to All Group Members ({{ currentStructureSimilarityGroup.structureIds.length }})
          </el-button>
          
          <div class="group-members-list">
            <div 
              v-for="memberId in currentStructureSimilarityGroup.structureIds.filter(id => id !== selectedStructure)" 
              :key="memberId"
              class="member-item"
            >
              <el-checkbox :model-value="true" />
              <span>{{ memberId }}</span>
              <el-tag :type="getSimilarityGroupColor(currentStructureSimilarityGroup.groupId)" size="small" round>
                {{ currentStructureSimilarityGroup.groupId }}
              </el-tag>
              <span class="member-similarity">93%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Scheme Overview (at bottom) -->
    <div class="overview-section">
      <div class="overview-header">
        <h3>Visual Scheme Overview</h3>
        <div class="overview-toggle">
          <span>Hide</span>
          <el-switch v-model="showOverview" />
          <span>Show</span>
        </div>
      </div>
      <div v-if="showOverview" class="overview-grid">
        <div 
          v-for="structure in musicStore.phraseStructures" 
          :key="structure.id"
          class="overview-card"
          :class="{ 'has-scheme': visualStore.getMapping(structure.id) }"
          @click="selectStructure(structure.id)"
        >
          <div class="overview-card-header">
            <span class="measure-label">M{{ structure.startMeasure }}-{{ structure.endMeasure }}</span>
          </div>
          <div class="overview-card-title">{{ structure.id }}</div>
          <div class="overview-visual">
            <div v-if="visualStore.getMapping(structure.id)" class="visual-elements-row">
              <div 
                v-for="(element, idx) in visualStore.getMapping(structure.id)?.scheme.elements.slice(0, 3)" 
                :key="idx"
                class="mini-shape-wrapper animated"
                :class="element.animation?.type || 'pulse'"
              >
                <svg v-if="element.type === 'circle'" viewBox="0 0 24 24" class="mini-shape-svg">
                  <circle cx="12" cy="12" r="10" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'star'" viewBox="0 0 24 24" class="mini-shape-svg">
                  <polygon points="12,2 15,9 22,9 16,14 18,22 12,18 6,22 8,14 2,9 9,9" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'triangle'" viewBox="0 0 24 24" class="mini-shape-svg">
                  <polygon points="12,3 22,21 2,21" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'square' || element.type === 'rect'" viewBox="0 0 24 24" class="mini-shape-svg">
                  <rect x="3" y="3" width="18" height="18" rx="3" :fill="element.color" />
                </svg>
                <svg v-else-if="element.type === 'diamond'" viewBox="0 0 24 24" class="mini-shape-svg">
                  <polygon points="12,2 22,12 12,22 2,12" :fill="element.color" />
                </svg>
                <svg v-else viewBox="0 0 24 24" class="mini-shape-svg">
                  <ellipse cx="12" cy="12" rx="10" ry="8" :fill="element.color" />
                </svg>
              </div>
            </div>
            <div v-else class="empty-visual">
              <el-icon><Picture /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="navigation-section">
      <el-button size="large" @click="goBack">Back</el-button>
      <el-button 
        type="primary" 
        size="large"
        :disabled="!hasAnyConfiguration"
        @click="proceedToPreview"
      >
        Proceed to Preview
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ElTag, ElSwitch, ElButton, ElIcon, ElProgress, ElSelect, ElOption, 
  ElSlider, ElCheckbox, ElNotification 
} from 'element-plus'
import { 
  CircleCheckFilled, Clock, View, Picture, Refresh, Check, CopyDocument, 
  Search, ArrowRight, CirclePlus, Pointer
} from '@element-plus/icons-vue'
import { useMusicStore } from '@/stores/music'
import { useVisualStore } from '@/stores/visual'
import { useUserStore } from '@/stores/user'
import { createAIService } from '@/services/AIServiceFactory'
import type { VisualScheme } from '@/types'

// Shape icons
import { 
  CircleCheck, Document, Star, Warning, TrendCharts, 
  Orange, Grid, Histogram, Connection, CreditCard 
} from '@element-plus/icons-vue'

const emit = defineEmits(['proceed-to-export'])

const musicStore = useMusicStore()
const visualStore = useVisualStore()
const userStore = useUserStore()

// State
const selectedStructure = ref<string | null>(null)
const showOverview = ref(true)
const multiElementMode = ref(false)
const isGenerating = ref(false)
const generationProgress = ref(0)
const generationStatusText = ref('')
const selectedRecommendation = ref<string | null>(null)
const currentRecommendations = ref<VisualScheme[]>([])

// Custom design state
const selectedShape = ref('circle')
const selectedColor = ref('blue')
const selectedAnimation = ref('pulse')
const selectedSize = ref(60)

// Multi-element mode state
const multiSelectedShapes = ref<string[]>([])
const multiSelectedColors = ref<string[]>([])
const selectedLayout = ref('horizontal')
const multiDragElements = ref<Array<{ shape: string; color: string; x: number; y: number }>>([])
const dragCanvasRef = ref<HTMLElement | null>(null)
const dragIndex = ref<number | null>(null)

// Layout options
const layoutOptions = [
  { id: 'horizontal', name: 'Serial (Horizontal)', icon: Grid },
  { id: 'vertical', name: 'Serial (Vertical)', icon: Grid },
  { id: 'circular', name: 'Circular', icon: CircleCheck },
  { id: 'clustered', name: 'Clustered', icon: Connection },
  { id: 'grid', name: 'Grid', icon: Grid },
  { id: 'custom', name: 'Custom (Drag)', icon: Pointer },
]

// Available shapes
const availableShapes = [
  { id: 'circle', name: 'Circle', icon: CircleCheck },
  { id: 'ellipse', name: 'Ellipse', icon: CirclePlus },
  { id: 'square', name: 'Square', icon: Document },
  { id: 'rect', name: 'Rectangle', icon: CreditCard },
  { id: 'triangle', name: 'Triangle', icon: Warning },
  { id: 'pentagon', name: 'Pentagon', icon: Grid },
  { id: 'hexagon', name: 'Hexagon', icon: Grid },
  { id: 'star', name: 'Star', icon: Star },
  { id: 'diamond', name: 'Diamond', icon: Orange },
]

// Available colors - expanded palette like reference screenshot
const availableColors = [
  // Row 1: Yellow to Orange gradient
  { id: 'yellow-light', hex: '#FFF59D' },
  { id: 'yellow', hex: '#FFEB3B' },
  { id: 'yellow-dark', hex: '#FDD835' },
  { id: 'amber', hex: '#FFC107' },
  { id: 'orange-light', hex: '#FFB74D' },
  { id: 'orange', hex: '#FF9800' },
  { id: 'orange-dark', hex: '#F57C00' },
  { id: 'deep-orange', hex: '#FF5722' },
  { id: 'red-light', hex: '#EF5350' },
  { id: 'red', hex: '#F44336' },
  { id: 'red-dark', hex: '#D32F2F' },
  { id: 'red-deep', hex: '#B71C1C' },
  // Row 2: Pink to Purple gradient
  { id: 'pink-light', hex: '#F48FB1' },
  { id: 'pink', hex: '#E91E63' },
  { id: 'pink-dark', hex: '#C2185B' },
  { id: 'rose', hex: '#AD1457' },
  { id: 'purple-light', hex: '#CE93D8' },
  { id: 'purple', hex: '#9C27B0' },
  { id: 'purple-dark', hex: '#7B1FA2' },
  { id: 'deep-purple', hex: '#673AB7' },
  { id: 'indigo-light', hex: '#7986CB' },
  { id: 'indigo', hex: '#3F51B5' },
  { id: 'blue-dark', hex: '#303F9F' },
  { id: 'navy', hex: '#1A237E' },
  // Row 3: Blue to Cyan gradient
  { id: 'blue-light', hex: '#64B5F6' },
  { id: 'blue', hex: '#2196F3' },
  { id: 'blue-medium', hex: '#1976D2' },
  { id: 'blue-deep', hex: '#0D47A1' },
  { id: 'light-blue', hex: '#03A9F4' },
  { id: 'cyan-light', hex: '#4DD0E1' },
  { id: 'cyan', hex: '#00BCD4' },
  { id: 'cyan-dark', hex: '#0097A7' },
  { id: 'teal-light', hex: '#4DB6AC' },
  { id: 'teal', hex: '#009688' },
  { id: 'teal-dark', hex: '#00796B' },
  { id: 'teal-deep', hex: '#004D40' },
  // Row 4: Green gradient + extras
  { id: 'green-light', hex: '#81C784' },
  { id: 'green', hex: '#4CAF50' },
  { id: 'green-dark', hex: '#388E3C' },
  { id: 'green-deep', hex: '#1B5E20' },
  { id: 'light-green', hex: '#8BC34A' },
  { id: 'lime', hex: '#CDDC39' },
  { id: 'lime-dark', hex: '#AFB42B' },
  { id: 'brown', hex: '#795548' },
  { id: 'grey', hex: '#9E9E9E' },
  { id: 'blue-grey', hex: '#607D8B' },
  { id: 'heart', hex: '#E91E63', icon: 'heart' },
]

// Computed
const getSelectedStructureData = computed(() => {
  return musicStore.phraseStructures.find(s => s.id === selectedStructure.value)
})

const getSameEmotionCount = computed(() => {
  if (!getSelectedStructureData.value?.emotion) return 0
  const emotion = getSelectedStructureData.value.emotion.primary
  return musicStore.phraseStructures.filter(s => s.emotion?.primary === emotion).length
})

const currentStructureSimilarityGroup = computed(() => {
  if (!selectedStructure.value) return null
  return musicStore.similarityGroups.find(g => 
    g.structureIds.includes(selectedStructure.value!)
  )
})

const hasAnyConfiguration = computed(() => {
  return musicStore.phraseStructures.some(s => visualStore.getMapping(s.id))
})

// Get the applied scheme for the selected structure (for Preview display)
const appliedScheme = computed(() => {
  if (!selectedStructure.value) return null
  return visualStore.getMapping(selectedStructure.value)?.scheme || null
})

// Check if the applied scheme has elements with custom positions
const hasCustomPositions = computed(() => {
  if (!appliedScheme.value) return false
  return appliedScheme.value.elements.some(el => el.position !== undefined)
})

// Completion progress
const completedCount = computed(() => {
  return musicStore.phraseStructures.filter(s => visualStore.getMapping(s.id)).length
})

const totalCount = computed(() => {
  return musicStore.phraseStructures.length
})

// Methods
const selectStructure = (structureId: string) => {
  selectedStructure.value = structureId
  selectedRecommendation.value = null
  
  // Load existing recommendations if any
  const existing = visualStore.getRecommendations(structureId)
  if (existing && existing.length > 0) {
    currentRecommendations.value = existing
  } else {
    generateRecommendations(structureId)
  }
}

const getStructureSimilarityGroup = (structureId: string): string | null => {
  const group = musicStore.similarityGroups.find(g => g.structureIds.includes(structureId))
  return group?.groupId || null
}

const getSimilarityGroupColor = (groupId: string | null): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  if (!groupId) return 'info'
  const colors: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    'A': 'primary',
    'B': 'success', 
    'C': 'warning',
    'D': 'danger'
  }
  return colors[groupId] || 'info'
}

const getEmotionTagType = (emotion: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    'happy': 'success',
    'sad': 'info',
    'excited': 'danger',
    'peaceful': 'success',
    'tense': 'warning'
  }
  return map[emotion] || 'info'
}

const getShapeIcon = (shapeType: string) => {
  const shape = availableShapes.find(s => s.id === shapeType)
  return shape?.icon || CircleCheck
}

const getShapeIconById = (shapeId: string) => {
  const shape = availableShapes.find(s => s.id === shapeId)
  return shape?.icon || CircleCheck
}

const getColorHex = (colorId: string): string => {
  const color = availableColors.find(c => c.id === colorId)
  return color?.hex || '#3498DB'
}

// Get custom position style for preview elements with drag positions
const getCustomPositionStyle = (element: any, idx: number) => {
  if (element.position) {
    // Scale the position from drag canvas (300x180) to preview canvas (larger)
    const scaleX = 1.5
    const scaleY = 1.2
    return {
      position: 'absolute' as const,
      left: `${element.position.x * scaleX}px`,
      top: `${element.position.y * scaleY}px`
    }
  }
  // Default positioning if no custom position
  return {
    position: 'absolute' as const,
    left: `${50 + idx * 80}px`,
    top: `${50 + Math.floor(idx / 3) * 80}px`
  }
}

const previewStructure = (structureId: string) => {
  ElNotification({
    title: 'Preview',
    message: `Previewing ${structureId}`,
    type: 'info',
    duration: 2000
  })
}

const generateRecommendations = async (structureId: string) => {
  isGenerating.value = true
  generationProgress.value = 0
  generationStatusText.value = 'Initializing AI model...'
  
  try {
    const aiService = createAIService()
    
    // Initialize models if needed (with progress callback)
    if ('setStatusCallback' in aiService) {
      (aiService as any).setStatusCallback((status: any) => {
        if (status.isLoading) {
          generationStatusText.value = status.currentModel || 'Loading model...'
          generationProgress.value = Math.round(status.progress * 0.35)
        }
      })
    }
    
    if ('initializeModels' in aiService) {
      await (aiService as any).initializeModels()
    }
    
    generationStatusText.value = 'Analyzing structure emotion...'
    generationProgress.value = 35
    
    // Get the structure's emotion to generate emotion-based recommendations
    const structure = musicStore.phraseStructures.find(s => s.id === structureId)
    const structureEmotion = structure?.emotion?.primary || 'peaceful'
    
    // Map emotion to EmotionFeatures
    const emotionMap: Record<string, { speed: 'fast' | 'moderate' | 'slow', intensity: 'strong' | 'moderate' | 'weak', tension: 'tense' | 'neutral' | 'relaxed' }> = {
      'happy': { speed: 'moderate', intensity: 'moderate', tension: 'relaxed' },
      'sad': { speed: 'slow', intensity: 'weak', tension: 'neutral' },
      'excited': { speed: 'fast', intensity: 'strong', tension: 'neutral' },
      'peaceful': { speed: 'slow', intensity: 'weak', tension: 'relaxed' },
      'tense': { speed: 'moderate', intensity: 'strong', tension: 'tense' }
    }
    
    const emotion = emotionMap[structureEmotion] || { speed: 'moderate', intensity: 'moderate', tension: 'neutral' }
    
    generationStatusText.value = `Generating ${structureEmotion} emotion recommendations...`
    generationProgress.value = 60
    
    const schemes = await aiService.recommendVisuals(emotion, 'phrase', userStore.preferences as any, structureId)
    
    generationProgress.value = 100
    generationStatusText.value = 'Complete!'
    
    currentRecommendations.value = schemes
    visualStore.setRecommendations(structureId, schemes)
    
    ElNotification({
      title: 'AI Recommendations Ready',
      message: `Generated ${schemes.length} visual schemes based on "${structureEmotion}" emotion`,
      type: 'success',
      duration: 3000
    })
    
  } catch (error) {
    ElNotification({
      title: 'Error',
      message: 'Failed to generate recommendations',
      type: 'error'
    })
  } finally {
    setTimeout(() => {
      isGenerating.value = false
      generationProgress.value = 0
    }, 500)
  }
}

const regenerateRecommendations = () => {
  if (selectedStructure.value) {
    generateRecommendations(selectedStructure.value)
  }
}

const selectRecommendation = (option: VisualScheme) => {
  selectedRecommendation.value = option.id
}

const applyRecommendation = () => {
  if (!selectedStructure.value || !selectedRecommendation.value) return
  
  const scheme = currentRecommendations.value.find(r => r.id === selectedRecommendation.value)
  if (!scheme) return
  
  visualStore.setMapping(selectedStructure.value, {
    structureId: selectedStructure.value,
    scheme,
    isCustomized: false,
    isDragged: false,
    source: 'ai',
    timestamp: Date.now()
  })
  
  ElNotification({
    title: 'Applied',
    message: 'AI recommendation applied successfully',
    type: 'success',
    duration: 2000
  })
}

const applyCustomDesign = () => {
  if (!selectedStructure.value) return
  
  const customScheme: VisualScheme = {
    id: `custom_${Date.now()}`,
    elements: [{
      id: 'elem_1',
      type: selectedShape.value as any,
      color: getColorHex(selectedColor.value),
      size: selectedSize.value,
      animation: {
        type: selectedAnimation.value as any,
        duration: 1000,
        easing: 'power2.inOut'
      }
    }],
    layout: 'horizontal',
    confidence: 1.0
  }
  
  visualStore.setMapping(selectedStructure.value, {
    structureId: selectedStructure.value,
    scheme: customScheme,
    isCustomized: true,
    isDragged: false,
    source: 'custom',
    timestamp: Date.now()
  })
  
  ElNotification({
    title: 'Applied',
    message: 'Custom design applied successfully',
    type: 'success',
    duration: 2000
  })
}

const applyToSameEmotion = () => {
  if (!selectedStructure.value || !getSelectedStructureData.value?.emotion) return
  
  const mapping = visualStore.getMapping(selectedStructure.value)
  if (!mapping) return
  
  const emotion = getSelectedStructureData.value.emotion.primary
  const sameEmotionStructures = musicStore.phraseStructures.filter(
    s => s.emotion?.primary === emotion && s.id !== selectedStructure.value
  )
  
  sameEmotionStructures.forEach(structure => {
    visualStore.setMapping(structure.id, {
      ...mapping,
      structureId: structure.id,
      timestamp: Date.now()
    })
  })
  
  ElNotification({
    title: 'Batch Applied',
    message: `Applied to ${sameEmotionStructures.length} structures with same emotion`,
    type: 'success',
    duration: 3000
  })
}

const applyToSimilarGroup = () => {
  if (!selectedStructure.value || !currentStructureSimilarityGroup.value) return
  
  const mapping = visualStore.getMapping(selectedStructure.value)
  if (!mapping) return
  
  const groupMembers = currentStructureSimilarityGroup.value.structureIds.filter(
    id => id !== selectedStructure.value
  )
  
  groupMembers.forEach(structureId => {
    visualStore.setMapping(structureId, {
      ...mapping,
      structureId,
      timestamp: Date.now()
    })
  })
  
  ElNotification({
    title: 'Batch Applied',
    message: `Applied to ${groupMembers.length} similar structures`,
    type: 'success',
    duration: 3000
  })
}

const analyzeRelatedStructures = () => {
  ElNotification({
    title: 'Analyzing',
    message: 'AI is analyzing related structures...',
    type: 'info',
    duration: 2000
  })
  
  // Simulate AI clustering completion
  setTimeout(() => {
    ElNotification({
      title: 'AI Clustering Complete',
      message: `Found ${musicStore.similarityGroups.length} similar structure groups`,
      type: 'success',
      duration: 4000
    })
  }, 1500)
}

// Multi-element methods
const isShapeInMultiSelection = (shapeId: string): boolean => {
  return multiSelectedShapes.value.includes(shapeId)
}

const getMultiShapeOrder = (shapeId: string): number | null => {
  const index = multiSelectedShapes.value.indexOf(shapeId)
  return index >= 0 ? index + 1 : null
}

const toggleMultiShape = (shapeId: string) => {
  const index = multiSelectedShapes.value.indexOf(shapeId)
  if (index >= 0) {
    multiSelectedShapes.value.splice(index, 1)
  } else {
    multiSelectedShapes.value.push(shapeId)
    updateDragElements()
  }
}

const removeMultiShape = (index: number) => {
  multiSelectedShapes.value.splice(index, 1)
  updateDragElements()
}

const isColorInMultiSelection = (colorId: string): boolean => {
  return multiSelectedColors.value.includes(colorId)
}

const toggleMultiColor = (colorId: string) => {
  const index = multiSelectedColors.value.indexOf(colorId)
  if (index >= 0) {
    multiSelectedColors.value.splice(index, 1)
  } else {
    multiSelectedColors.value.push(colorId)
    updateDragElements()
  }
}

const getLayoutName = (layoutId: string): string => {
  const layout = layoutOptions.find(l => l.id === layoutId)
  return layout?.name || layoutId
}

const updateDragElements = () => {
  multiDragElements.value = multiSelectedShapes.value.map((shape, idx) => ({
    shape,
    color: getColorHex(multiSelectedColors.value[idx] || 'blue'),
    x: 50 + (idx % 3) * 80,
    y: 50 + Math.floor(idx / 3) * 80
  }))
}

const clearMultiSelection = () => {
  multiSelectedShapes.value = []
  multiSelectedColors.value = []
  multiDragElements.value = []
}

// Mouse-based drag implementation
const onElementMouseDown = (event: MouseEvent, index: number) => {
  dragIndex.value = index
  if (dragCanvasRef.value) {
    const rect = dragCanvasRef.value.getBoundingClientRect()
    dragOffset.x = event.clientX - rect.left - multiDragElements.value[index].x
    dragOffset.y = event.clientY - rect.top - multiDragElements.value[index].y
  }
}

const onCanvasMouseMove = (event: MouseEvent) => {
  if (dragIndex.value === null || !dragCanvasRef.value) return
  
  const rect = dragCanvasRef.value.getBoundingClientRect()
  let x = event.clientX - rect.left - dragOffset.x
  let y = event.clientY - rect.top - dragOffset.y
  
  // Constrain to canvas bounds
  x = Math.max(0, Math.min(x, rect.width - 50))
  y = Math.max(0, Math.min(y, rect.height - 50))
  
  multiDragElements.value[dragIndex.value].x = x
  multiDragElements.value[dragIndex.value].y = y
}

const onCanvasMouseUp = () => {
  dragIndex.value = null
}

// Drag offset for smooth dragging
const dragOffset = { x: 0, y: 0 }

const applyMultiElementDesign = () => {
  if (!selectedStructure.value || multiSelectedShapes.value.length === 0) return
  
  // Check if any element has been dragged from default position
  const hasCustomPositions = multiDragElements.value.some((el, idx) => {
    const defaultX = 50 + (idx % 3) * 80
    const defaultY = 50 + Math.floor(idx / 3) * 80
    return Math.abs(el.x - defaultX) > 5 || Math.abs(el.y - defaultY) > 5
  })
  
  // Use 'custom' layout if elements have been dragged, otherwise use selected layout
  const effectiveLayout = hasCustomPositions ? 'custom' : selectedLayout.value
  
  // Always include drag positions for multi-element designs
  const elements = multiSelectedShapes.value.map((shapeId, idx) => {
    const dragElement = multiDragElements.value[idx]
    return {
      id: `elem_${idx + 1}`,
      type: shapeId as any,
      color: getColorHex(multiSelectedColors.value[idx] || 'blue'),
      size: selectedSize.value,
      position: dragElement 
        ? { x: dragElement.x, y: dragElement.y } 
        : undefined,
      animation: {
        type: selectedAnimation.value as any,
        duration: 1000,
        easing: 'power2.inOut'
      }
    }
  })
  
  const customScheme: VisualScheme = {
    id: `multi_${Date.now()}`,
    elements,
    layout: effectiveLayout as any,
    confidence: 1.0
  }
  
  visualStore.setMapping(selectedStructure.value, {
    structureId: selectedStructure.value,
    scheme: customScheme,
    isCustomized: true,
    isDragged: hasCustomPositions,
    source: 'custom',
    timestamp: Date.now()
  })
  
  ElNotification({
    title: 'Applied',
    message: `Multi-element design with ${elements.length} elements applied`,
    type: 'success',
    duration: 2000
  })
}

const goBack = () => {
  // Emit event to go back
}

const proceedToPreview = () => {
  emit('proceed-to-export')
}
</script>


<style scoped>
.visualization-editor {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Main Two-Column Layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1200px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-column {
  display: flex;
  flex-direction: column;
}

/* Editor Panel in Right Column */
.editor-panel {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.editor-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.editor-header.placeholder .editor-title h3 {
  color: #909399;
}

.editor-header.placeholder .editor-subtitle {
  color: #c0c4cc;
}

.editor-title h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #303133;
}

.editor-subtitle {
  font-size: 14px;
  color: #909399;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Empty Recommendations State */
.empty-recommendations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
  gap: 12px;
}

.empty-recommendations .el-icon {
  font-size: 32px;
}

/* Structures Section */
.structures-section h3,
.similarity-section h3,
.overview-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.structures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.structure-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.structure-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.structure-card.active {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
}

.structure-card.configured {
  border-color: #67c23a;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.structure-name {
  font-weight: 600;
  color: #303133;
}

.measure-range {
  font-size: 12px;
  color: #909399;
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-icons {
  display: flex;
  gap: 8px;
}

.icon-configured {
  color: #67c23a;
  font-size: 18px;
}

.icon-pending {
  color: #909399;
  font-size: 18px;
}

.icon-preview {
  color: #409eff;
  font-size: 18px;
  cursor: pointer;
}

/* Similarity Section */
.similarity-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.similarity-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.similarity-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px;
  min-width: 200px;
  flex: 1;
}

.similarity-card.primary { border-left: 4px solid #409eff; }
.similarity-card.success { border-left: 4px solid #67c23a; }
.similarity-card.warning { border-left: 4px solid #e6a23c; }
.similarity-card.danger { border-left: 4px solid #f56c6c; }

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.group-title {
  font-weight: 600;
  color: #303133;
}

.group-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.similarity-score {
  color: #67c23a;
  font-weight: 500;
}

.group-members {
  font-size: 12px;
  color: #909399;
}

/* Overview Section */
.overview-section {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.overview-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.overview-card {
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.overview-card.has-scheme {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-color: #67c23a;
}

.overview-card-header {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.overview-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.overview-visual {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-elements {
  display: flex;
  gap: 4px;
}

.visual-elements-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.visual-elements-stack .mini-element {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave-indicator {
  margin-top: 4px;
}

.wave-svg {
  width: 40px;
  height: 12px;
}

.wave-indicator.empty .wave-svg path {
  stroke-dasharray: 4 2;
}

.mini-element {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-icon {
  width: 16px;
  height: 16px;
  color: white;
}

/* Mini shape SVG styles for overview */
.visual-elements-row {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.mini-shape-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-shape-svg {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
}

.empty-visual {
  color: #c0c4cc;
  font-size: 24px;
}

/* Editor Panel */
.editor-panel {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.editor-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
}

.editor-subtitle {
  font-size: 14px;
  color: #909399;
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 1fr 300px;
  gap: 24px;
}

@media (max-width: 1200px) {
  .editor-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .editor-content {
    grid-template-columns: 1fr;
  }
}

/* Recommendations Section */
.recommendations-section,
.customize-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  color: #606266;
}

.recommendation-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.recommendation-card {
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.recommendation-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.recommendation-card.selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #e8f4ff 100%);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
}

.option-visual {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
  min-height: 50px;
  align-items: center;
}

.option-element {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-top: 8px;
}

.option-match {
  font-size: 11px;
  color: #67c23a;
  font-weight: 500;
}

/* Rich visual options - like reference image */
.option-visual-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
  min-height: 90px;
  padding: 16px 12px;
  background: linear-gradient(180deg, #e8f4fc 0%, #d4ecf9 100%);
  border-radius: 12px;
  margin-bottom: 8px;
}

.shape-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.shape-svg {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.visual-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.option-element-rich {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.option-icon-rich {
  width: 22px;
  height: 22px;
  color: white;
}

.option-wave {
  margin-top: 4px;
}

.wave-svg-small {
  width: 50px;
  height: 10px;
}

/* Emotion badge styles */
.emotion-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid;
}

.emotion-badge.happy {
  color: #67c23a;
  border-color: #67c23a;
  background: #f0f9eb;
}

.emotion-badge.peaceful {
  color: #409eff;
  border-color: #409eff;
  background: #ecf5ff;
}

.emotion-badge.sad {
  color: #909399;
  border-color: #909399;
  background: #f4f4f5;
}

.emotion-badge.excited {
  color: #f56c6c;
  border-color: #f56c6c;
  background: #fef0f0;
}

.emotion-badge.tense {
  color: #e6a23c;
  border-color: #e6a23c;
  background: #fdf6ec;
}

.emotion-badge.inline {
  margin-left: 8px;
}

/* Current tag */
.current-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #409eff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.apply-btn,
.apply-custom-btn {
  width: 100%;
}

/* Customize Section */
.mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #909399;
}

.mode-toggle span.active {
  color: #409eff;
  font-weight: 500;
}

.shape-selection,
.color-selection,
.animation-selection,
.size-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shape-selection label,
.color-selection label,
.animation-selection label,
.size-selection label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.shape-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.shape-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.shape-btn:hover {
  border-color: #409eff;
}

.shape-btn.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

/* SVG Shape Button Styles */
.shape-btn-svg {
  width: 44px;
  height: 44px;
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  position: relative;
}

.shape-btn-svg:hover {
  border-color: #409eff;
  background: #f5f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.shape-btn-svg.selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #e8f4ff 100%);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
}

.shape-selector-svg {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s;
}

.shape-btn-svg:hover .shape-selector-svg {
  transform: scale(1.1);
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.selected {
  border-color: #303133;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #303133;
}

/* Heart button styles */
.color-btn.heart-btn {
  border: 2px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-btn.heart-btn:hover {
  border-color: #E91E63;
}

.heart-icon {
  width: 20px;
  height: 20px;
}

/* Preview Section */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-section label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.preview-canvas {
  background: #f0f2f5;
  border-radius: 12px;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-element {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.preview-icon {
  color: white;
}

/* Multi Element Preview */
.multi-preview-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.multi-preview-container.horizontal {
  flex-direction: row;
}

.multi-preview-container.vertical {
  flex-direction: column;
}

.multi-preview-container.circular {
  position: relative;
  width: 150px;
  height: 150px;
}

.multi-preview-container.circular .multi-preview-element {
  position: absolute;
}

.multi-preview-container.circular .multi-preview-element:nth-child(1) {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
}

.multi-preview-container.circular .multi-preview-element:nth-child(2) {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.multi-preview-container.circular .multi-preview-element:nth-child(3) {
  top: 50%;
  left: 50%;
  transform: translate(-50%, 0);
}

.multi-preview-container.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.multi-preview-element {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Batch Section */
.batch-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.batch-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.batch-count {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.batch-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
}

.batch-btn {
  width: 100%;
  margin-bottom: 16px;
}

.related-group {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.group-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.group-name {
  font-weight: 600;
  color: #303133;
}

.group-details {
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
}

.group-details p {
  margin: 4px 0;
}

.group-members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.member-similarity {
  margin-left: auto;
  font-size: 13px;
  color: #67c23a;
}

/* Navigation Section */
.navigation-section {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

/* Multi-Element Mode Styles */
.multi-element-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.multi-element-selection label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.shape-options.with-numbers .shape-btn,
.shape-options.with-numbers .shape-btn-svg {
  position: relative;
}

.order-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.selected-order {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.selected-order span {
  font-size: 13px;
  color: #606266;
}

.color-options.large .color-btn {
  width: 32px;
  height: 32px;
}

/* Layout Selection */
.layout-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layout-selection label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.layout-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #606266;
}

.layout-btn:hover {
  border-color: #409eff;
}

.layout-btn.selected {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
}

.current-layout {
  font-size: 13px;
  color: #909399;
}

.current-layout .layout-name {
  color: #409eff;
  font-weight: 500;
}

/* Drag Canvas */
.drag-canvas-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drag-canvas-section label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.drag-canvas-section .hint {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.drag-canvas {
  position: relative;
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px dashed #c0c4cc;
  border-radius: 12px;
  overflow: visible;
  /* Grid background */
  background-image: 
    linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}

.drag-element {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.drag-element:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.drag-element:active {
  cursor: grabbing;
}

.drag-icon {
  width: 30px;
  height: 30px;
  color: white;
}

/* SVG Drag Element Styles */
.drag-element-svg {
  position: absolute;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: filter 0.2s, transform 0.2s;
}

.drag-element-svg:hover {
  transform: scale(1.1);
}

.drag-element-svg:active {
  cursor: grabbing;
}

.drag-element-svg.dragging {
  cursor: grabbing;
  transform: scale(1.15);
  z-index: 100;
}

.drag-shape-svg {
  width: 50px;
  height: 50px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
}

.drag-element-svg .element-number {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #303133;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.element-number {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #303133;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* Multi Actions */
.multi-actions {
  display: flex;
  gap: 12px;
}

.multi-actions .el-button {
  flex: 1;
}

/* Dragging state */
.drag-element.dragging {
  cursor: grabbing;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
  z-index: 100;
}

/* Completion Info */
.completion-info {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

/* Preview Section Full Width */
.preview-section-full {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
}

.preview-section-full h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.preview-canvas-large {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 12px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.preview-canvas-large.custom-layout {
  position: relative;
  min-height: 250px;
}

.preview-placeholder {
  color: #909399;
  font-size: 14px;
}

/* Custom Preview Container for drag positions */
.custom-preview-container {
  position: relative;
  width: 100%;
  height: 220px;
  min-width: 500px;
  /* Grid background similar to drag canvas */
  background-image: 
    linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  border-radius: 8px;
}

.preview-shape-wrapper-absolute {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

/* Applied Preview Container */
.applied-preview-container {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.applied-preview-container.horizontal {
  flex-direction: row;
}

.applied-preview-container.vertical {
  flex-direction: column;
}

.applied-preview-container.circular {
  position: relative;
  width: 200px;
  height: 200px;
}

.applied-preview-container.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.applied-preview-element {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-shape-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-shape-svg {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

/* Animation Classes */
.animated.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.animated.flash {
  animation: flash 1s ease-in-out infinite;
}

.animated.rotate {
  animation: rotate 2s linear infinite;
}

.animated.bounce {
  animation: bounce 1s ease infinite;
}

.animated.scale {
  animation: scale 1.2s ease-in-out infinite;
}

.animated.slide {
  animation: slide 1.5s ease-in-out infinite;
}

.animated.shake {
  animation: shake 0.5s ease-in-out infinite;
}

.animated.fade {
  animation: fade 1.5s ease-in-out infinite;
}

.animated.none {
  animation: none;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes scale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes slide {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes fade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
