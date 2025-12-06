# POZIMIND Setup Guide

This guide will help you get POZIMIND up and running on your local machine.

## Prerequisites

- **Node.js** v18 or higher ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- A **Google Gemini API Key** ([Get one free here](https://aistudio.google.com/app/apikey))
- Optional: API keys for **OpenAI**, **Anthropic**, **Perplexity**, **OpenRouter**, **Z.ai** (add in-app under Settings → AI Providers; no extra env vars needed)

## Quick Start (5 Minutes)

### 1. Clone & Install

```bash
git clone https://github.com/genpozi/pozimind.git
cd pozimind
npm install
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and add your Gemini API key:

```env
VITE_GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

**Where to get your API key:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into your `.env` file

### 3. (Optional) Local Ollama
If you want local models via Ollama, ensure Ollama is running on `http://localhost:11434` (default) and pull a model, e.g.:
```bash
ollama pull llama3.2
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Grant Permissions

POZIMIND needs:
- **Camera** permission (for Bio-Mirror state checks)
- **Microphone** permission (for voice journaling and Live Coach)

Your browser will prompt you when these features are first used.

## Testing the Setup

### Verify Everything Works:

1. **Smart Journal**: Try logging an entry like "Feeling tired after 3 meetings"
2. **Bio-Mirror**: Take a state check selfie (requires camera permission)
3. **Live Coach**: Start a voice conversation (requires microphone permission)

## Build for Production

```bash
npm run build
npm run preview
```

The built files will be in the `dist/` folder.

## Troubleshooting

### "API Key not found" Error

**Problem**: The app shows an error about missing API key.

**Solution**:
1. Check that `.env` file exists in project root
2. Verify the key is named `VITE_GEMINI_API_KEY` (not `API_KEY`)
3. Restart the dev server after creating/editing `.env`
4. Make sure there are no extra spaces around the `=` sign

### Camera/Microphone Not Working

**Problem**: Bio-Mirror or voice features don't work.

**Solution**:
1. Check browser permissions (click the lock icon in the address bar)
2. Use HTTPS or localhost (required for camera/mic access)
3. Try a different browser (Chrome/Edge recommended)
4. Check that no other app is using the camera/microphone

### Build Errors

**Problem**: `npm run build` fails.

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Ensure TypeScript types are installed
npm install --save-dev @types/node

# Try building again
npm run build
```

### Port Already in Use

**Problem**: "Port 5173 is already in use"

**Solution**:
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Or specify a different port
npm run dev -- --port 3000
```

## Development Tips

### Hot Reload

The dev server automatically reloads when you edit files. No manual refresh needed!

### API Rate Limits

The free Gemini API tier has rate limits:
- 60 requests per minute
- Consider adding delays between rapid requests if you hit limits

### Data Storage

All data is stored locally in your browser:
- **LocalStorage**: User settings, journal entries
- **IndexedDB**: Encrypted Bio-Mirror data, wearable sync data

Clear browser data to reset the app completely.

### Privacy Note

POZIMIND runs entirely in your browser. Your data:
- ✅ Never leaves your device (except API calls to Gemini)
- ✅ Is encrypted locally for sensitive biometric data
- ✅ Can be cleared anytime in Settings
- ❌ Is not backed up automatically (export your data regularly!)

## Next Steps

Once setup is complete:
1. Read the [HOW_TO_USE.md](./HOW_TO_USE.md) guide
2. Configure your bio-context in **Settings**
3. Set up Bio-Mirror baseline calibration
4. Start your first journal entry!

## Need Help?

- Check the [README.md](./README.md) for feature documentation
- Review the [ROADMAP.md](./ROADMAP.md) for planned features
- Open an issue on GitHub for bugs

---

*Built with ❤️ by Poziverse*
