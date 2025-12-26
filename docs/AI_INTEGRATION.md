# AI Integration Guide

**Sprint 24**: Local-first AI Suggestion Layer for Project Hub

---

## Overview

Gesu Ecosystem includes an **optional** AI suggestion feature that helps enhance blueprints with:

- Better phase/step titles
- Improved descriptions
- Additional DoD (Definition of Done) items

**Key Principles**:

1. **Local-first**: AI runs on your machine via Ollama (no cloud required)
2. **Non-destructive**: AI generates suggestions only; you apply what you want
3. **Privacy**: Your data never leaves your machine
4. **Optional**: App works fully without AI enabled

---

## Quick Start

### 1. Install Ollama

**Easiest Method (Recommended for beginners):**

1. Go to **[ollama.ai/download](https://ollama.ai/download)**
2. Click **"Download for Windows"**
3. Run the installer (OllamaSetup.exe)
4. Follow the installation wizard
5. Ollama will start automatically after installation

**Alternative (Command Line):**

```bash
# Windows PowerShell (if you know how)
winget install Ollama.Ollama
```

### 2. Download a Model

After Ollama is installed, open **Command Prompt** or **PowerShell** and run:

```bash
ollama pull llama3.2
```

> **Tip**: This downloads the model (~2GB). It only needs to be done once.

### 3. Verify Ollama is Running

Ollama runs automatically in the background after installation. You should see the Ollama icon (🦙) in your system tray (bottom-right corner of Windows).

If it's not running, search for "Ollama" in the Windows Start menu and open it.

### 4. Enable in App

1. Go to **Settings** → **AI Suggestions**
2. Toggle **Enable AI Suggestions**
3. Set provider to **Ollama (Local)**
4. Click **Test Connection**
5. If connected, you're ready!

---

## Using AI Suggestions

1. Open **Project Hub** → **Standards** tab
2. Select a blueprint
3. Click **"Enhance with AI"** button
4. Wait for suggestions to load
5. Review the suggestions in the modal
6. Check the ones you want to apply
7. Click **"Apply Selected"**
8. Changes are applied to your draft (not saved yet)
9. Save the blueprint to persist changes

---

## Providers

### Ollama (Recommended)

- **Endpoint**: `http://localhost:11434`
- **Models**: `llama3.2`, `mistral`, `codellama`, etc.
- **Requirements**: 8GB+ RAM for small models

### Mock (Testing)

- Always returns valid sample suggestions
- No network required
- Useful for UI testing and development

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                    User Clicks                       │
│               "Enhance with AI"                      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Build Prompt with:                      │
│   • Blueprint snapshot (phases, nodes)               │
│   • Current UI language (en/id)                      │
│   • Max suggestions (default: 3)                     │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           Send to AI Provider                        │
│   • Ollama: POST /api/generate                       │
│   • 30s timeout with AbortController                 │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         Validate Response with Zod                   │
│   • Schema version check                             │
│   • Operation types validated                        │
│   • Invalid responses discarded                      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│          Display in Modal                            │
│   • Checkboxes for each suggestion                   │
│   • Preview of operations                            │
│   • Apply/Cancel buttons                             │
└─────────────────────┴───────────────────────────────┘
```

---

## Safety Guarantees

| Guarantee          | Implementation                       |
| ------------------ | ------------------------------------ |
| No direct writes   | AI layer never writes to disk        |
| Schema validation  | Zod schemas reject invalid responses |
| ID stability       | AI cannot change blueprint/node IDs  |
| Timeout protection | 30s max request time                 |
| Graceful fallback  | No-AI mode always works              |

---

## Troubleshooting

### "AI not available"

- Check if Ollama is running: `ollama serve`
- Verify endpoint in Settings
- Try "Test Connection" button

### "Connection failed"

- Ollama might not be installed
- Port 11434 might be blocked
- Check firewall settings

### "Invalid AI response"

- Model might be too small/wrong
- Try a different model (e.g., `llama3.2`)
- Check Ollama logs for errors

### Slow responses

- First request loads model into memory
- Subsequent requests are faster
- Consider a smaller model for speed

---

## Technical Details

### Files

```
src/services/ai/
├── AIProvider.ts      # Interface + Zod schemas
├── OllamaProvider.ts  # Ollama HTTP client
├── MockProvider.ts    # Test provider
├── prompts.ts         # Prompt templates
└── index.ts           # Factory + exports

src/components/ai/
├── AIEnhanceButton.tsx    # Trigger button
└── AISuggestionModal.tsx  # Diff preview modal
```

### Settings Schema

```typescript
ai: {
  enabled: boolean; // default: false
  provider: "none" | "ollama" | "mock";
  endpoint: string; // default: http://localhost:11434
  model: string; // default: llama3.2
}
```

---

_Last updated: 2025-12-24_
