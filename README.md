# Intelligent Music Map

AI-powered music education tool based on Orff Schulwerk approach for visual music structure mapping.

## Overview

This project implements a **zero-shot learning + local AI inference + pseudo-reinforcement learning** pure frontend architecture. It uses **@huggingface/transformers** for browser-based AI inference without any server, API keys, or cloud services.

### Core Design Principles

- **Zero-Shot Inference**: Relies entirely on pre-trained models, no training or backpropagation
- **Local AI Processing**: All AI inference runs in the browser using WebGL/WASM
- **Symbol + Audio Dual-Modality Fusion**: Combines MusicXML symbolic structure with MP3 acoustic features
- **Privacy-First**: No data leaves the user's browser
- **Zero-Cost Deployment**: Pure static files, deployable on GitHub Pages or Vercel for free

## live Demo

**Try It Now**：https://intelligent-music-map-v2501.vercel.app/

## Features

### Music Analysis (AI-Powered)
- **Structure Detection**: Motives → Sub-phrases → Phrases → Periods → Themes
- **Emotion Recognition**: Happy, Sad, Excited, Peaceful, Tense
- **Similarity Grouping**: Groups A, B, C, D... based on melodic, rhythmic, harmonic features
- **Form Identification**: Sonata Form, Rondo Form, Binary Form, etc.
- **Confidence Visualization**: Solid/dashed borders based on AI confidence scores
- **Knowledge Base**: Local music theory rules with semantic search


### Visual Mapping
- **AI Recommendations**: 5 visual schemes per structure (shapes + colors + animations)
- **Custom Design**: Drag-and-drop visual element editor
- **Batch Operations**: 
  - "Apply to All Same Emotion" - Apply to structures with same emotion
  - "Apply to Related Structures" - Apply to similar structure groups
- **Shape Library**: Circle, Square, Triangle, Star, Diamond, Hexagon, Pentagon
- **Color Mapping**: Warm colors for happy/excited, cool colors for sad/peaceful
- **Animations**: Pulse, Flash, Rotate, Bounce, Scale, Slide, Shake, Fade

### Interactive Preview
- **Three-Window Synchronized Playback**:
  - Score View (measure tracking)
  - Audio Playback (with progress bar)
  - Visual Music Map (animated elements)
- **Click-to-Jump**: Click any structure to sync all three views

### Export Options
- **JSON (.mvt)**: Machine-readable, supports re-import
- **Interactive HTML**: Offline playable
- **SVG/PNG**: Visual map images
- **Annotated MusicXML**: Compatible with MuseScore, Finale

## Architecture

### Three-Layer AI Model Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERCEPTION LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ MusicXML    │  │ Audio       │  │ Multimodal          │  │
│  │ Parser      │  │ Analyzer    │  │ Fusion              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      LOGIC LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Structure   │  │ Emotion     │  │ Similarity          │  │
│  │ Segmentation│  │ Recognition │  │ Analyzer            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│              (@huggingface/transformers)                     │
│              (all-MiniLM-L6-v2 embedding model)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    OPERATION LAYER                           │
│  ┌─────────────┐  ┌─────────────────────────────────────┐   │
│  │ Visual      │  │ Pseudo-RL Preference Learner        │   │
│  │ Recommender │  │ (Reward: +1 accept, +0.5 modify, -1)│   │
│  └─────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Local AI Processing

```
User Browser → @huggingface/transformers → WebGL/WASM Backend
                     ↓
              all-MiniLM-L6-v2 (23MB)
                     ↓
              Semantic Embeddings
                     ↓
              Knowledge Base Search
```

- No API keys required
- No server needed
- Models cached in IndexedDB after first load
- Works offline after initial model download

## Quick Start

### Prerequisites
- Node.js 18+
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Local Development

1. **Install dependencies:**
```bash
cd intelligent-music-map-V25
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open browser:** http://localhost:3000

### First-Time Model Loading

On first use, the AI model (~23MB) will be downloaded and cached:
- Progress bar shows download status
- Model is cached in browser's IndexedDB
- Subsequent visits load from cache (~3 seconds)

### Test with Sample Files

Use the Mozart K.545 files in `CompositionExamples/`:
- `Mozart Piano K.545 First Movement/sonata-no-16-1st-movement-k-545.mxl`
- `Mozart Piano K.545 First Movement/sonata-no-16-1st-movement-k-545.mp3`

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Deploy! (No environment variables needed)

### GitHub Pages Deployment

```bash
npm run deploy
```

### Netlify Deployment

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`

## Project Structure

```
intelligent-music-map-V25/
├── src/
│   ├── components/
│   │   ├── VisualizationEditor.vue  # Visual element editor
│   │   ├── PlaybackPreview.vue      # Three-window preview
│   │   ├── ExportPanel.vue          # Export options
│   │   └── CustomVisualConfig.vue   # Custom visual settings
│   ├── services/
│   │   ├── TransformersAIService.ts # @huggingface/transformers AI
│   │   ├── MusicKnowledgeBase.ts    # Music theory knowledge base
│   │   ├── MusicAnalysisEngine.ts   # Music structure analysis
│   │   ├── PreferenceLearner.ts     # Pseudo-RL system
│   │   ├── FileService.ts           # MusicXML parsing
│   │   ├── AudioService.ts          # MP3 processing
│   │   └── VisualizationService.ts  # SVG/PNG generation
│   ├── stores/
│   │   ├── music.ts                 # Music data state
│   │   ├── visual.ts                # Visual mappings state
│   │   └── user.ts                  # User preferences state
│   ├── types/
│   │   └── index.ts                 # TypeScript definitions
│   └── views/
│       └── Home.vue                 # Main workflow page
├── vite.config.ts            # Vite configuration
└── package.json
```

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | Vue 3 + TypeScript + Vite |
| UI Framework | Element Plus |
| Animation | GSAP |
| Visualization | D3.js, SVG |
| State Management | Pinia |
| AI Inference | @huggingface/transformers |
| Embedding Model | all-MiniLM-L6-v2 (23MB) |
| Deployment | Vercel / GitHub Pages / Netlify |
| Storage | SessionStorage, IndexedDB |

## Configuration

Edit `src/config.ts`:

```typescript
export const config = {
  ai: {
    EMBEDDING_MODEL: 'Xenova/all-MiniLM-L6-v2',
    USE_BROWSER_CACHE: true,
    LAZY_LOAD: true
  },
  dev: {
    ENABLE_LOGS: true,
    ENABLE_MOCK_MODE: false  // Use mock data (skip AI)
  }
}
```

## Workflow

1. **Upload**: MusicXML (.mxl/.musicxml) + MP3 (optional)
2. **Analyze**: AI detects structures, emotions, similarities
3. **Visualize**: Select/customize visual elements for each structure
4. **Preview**: Three-window synchronized playback
5. **Export**: Save as JSON/HTML/MusicXML

## Pseudo-Reinforcement Learning

The system learns user preferences during each editing session:

| User Action | Reward | Effect |
|-------------|--------|--------|
| Accept AI recommendation | +1 | Increase preference for selected elements |
| Modify but keep similar | +0.5 | Slight increase for kept elements |
| Reject and choose different | -1 | Decrease preference for rejected elements |

Preferences are session-based and cleared after export.

## Music Knowledge Base

The system includes a local knowledge base with 30+ music theory rules:

- **Cadence Types**: Authentic, Half, Plagal, Deceptive
- **Phrase Structures**: 4-bar phrase, 8-bar period, Sentence, Period
- **Form Types**: Binary, Ternary, Sonata, Rondo, Variation
- **Tonality**: Major, Minor, Modulation
- **Texture**: Homophonic, Polyphonic, Monophonic
- **Rhythm**: Syncopation, Hemiola, Ostinato
- **Melody**: Sequence, Stepwise, Leap, Arch contour

Rules are matched using semantic similarity with the embedding model.

## Browser Compatibility

- Chrome 90+ (recommended, best WebGL support)
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

| Device | Model Load | Analysis Time |
|--------|------------|---------------|
| Desktop (8GB+ RAM) | ~10s first, ~3s cached | ~15s |
| Laptop (4-8GB RAM) | ~15s first, ~5s cached | ~25s |
| Mobile | ~30s first, ~10s cached | ~45s |

## License

MIT

## Credits

- **AI Framework**: @huggingface/transformers (Xenova)
- **Embedding Model**: all-MiniLM-L6-v2 (sentence-transformers)
- **Music Education Approach**: Orff Schulwerk
- **Development**: Music Education & AI Research Team
- **Special Thanks**: 
  - Hugging Face for transformers.js
  - MuseScore for MusicXML format support
  - Vue.js, Element Plus, GSAP, and D3.js communities

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For questions or support, please open an issue on GitHub.


