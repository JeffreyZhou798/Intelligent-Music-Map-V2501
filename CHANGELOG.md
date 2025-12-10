# Changelog

## [2.5.1] - 2024-12-10

### Bug Fixes
- **Project Import**: Fixed visual mappings not being restored when loading saved `.json` or `.mvt` project files
  - Added `useVisualStore` import to Home.vue
  - Now calls `visualStore.loadMappings()` when loading project data
  - Visualization step (Step 3) now correctly displays saved visual mappings
- **Export Panel**: Fixed checkbox click issue in export options
- **GitHub Actions**: Removed obsolete ZHIPU_API_KEY environment variable from deploy workflow

---

## [2.5.0] - 2024-12-10

### Major Changes - AI Architecture Migration

This version migrates from Zhipu AI cloud API to local browser-based AI using `@huggingface/transformers`.

#### Added
- **TransformersAIService**: New AI service using `@huggingface/transformers` for local inference
- **MusicKnowledgeBase**: Local music theory knowledge base with 30+ rules
  - Cadence types (Authentic, Half, Plagal, Deceptive)
  - Phrase structures (4-bar, 8-bar, Sentence, Period)
  - Form types (Binary, Ternary, Sonata, Rondo, Variation)
  - Tonality, Texture, Rhythm, and Melody rules
- **Semantic Search**: Uses all-MiniLM-L6-v2 embedding model for knowledge retrieval
- **Model Caching**: Models cached in IndexedDB for fast subsequent loads
- **Offline Support**: Full functionality after initial model download

#### Removed
- **ZhipuAIService**: Removed cloud API dependency
- **ApiKeyService**: No longer needed
- **ApiKeyDialog.vue**: Removed API key input component
- **local-proxy.js**: Removed development proxy server
- **api/zhipu.js**: Removed Vercel serverless function

#### Changed
- **config.ts**: Updated for local AI configuration
- **AIServiceFactory.ts**: Now creates TransformersAIService
- **user.ts store**: Removed API key management, added model status tracking
- **App.vue**: Simplified header, removed API key UI
- **Home.vue**: Updated to use new AI service with progress callbacks
- **VisualizationEditor.vue**: Updated AI service calls
- **package.json**: 
  - Added `@huggingface/transformers` dependency
  - Removed `axios`, `cors`, `dotenv`, `express` dependencies
  - Updated version to 2.5.0
- **vite.config.ts**: Optimized for transformers.js
- **vercel.json**: Simplified, removed API proxy configuration
- **README.md**: Updated documentation for new architecture

### Benefits
- **Zero Cost**: No API fees, no server costs
- **Privacy**: All data processed locally in browser
- **Offline**: Works without internet after initial setup
- **No API Keys**: Users can start immediately without registration
- **Faster**: No network latency for AI operations (after model load)

### Technical Notes
- Embedding model: `Xenova/all-MiniLM-L6-v2` (~23MB)
- Model loads on first use (lazy loading)
- Fallback to rule-based analysis if model fails to load
- Compatible with all modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
