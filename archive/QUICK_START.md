# 🚀 MAEPLE Quick Start Guide

**Last Updated**: December 14, 2025  
**Status**: ✅ Ready for Development

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Run health check (optional but recommended)
npm run health

# 3. Start the development server
npm run dev
```

**Or use the automated script**:
```bash
./start.sh
```

The app will be available at: **http://localhost:5173**

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Vite HMR enabled) |
| `npm start` | Run health check + start dev server |
| `npm run health` | Validate environment setup |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run analyze` | Analyze bundle size |

---

## 🏥 Health Check

The health check validates:
- ✅ Node.js version (v18+ required)
- ✅ Dependencies installed
- ✅ .env file exists
- ✅ API keys configured
- ✅ Critical files present

Run: `npm run health`

---

## ⚙️ Configuration

### Required
1. Copy `.env.example` to `.env`
2. Add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_key_here
   ```
   Get your key: https://aistudio.google.com/app/apikey

### Optional
- **Supabase** (Cloud sync): Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Oura Ring** (Wearables): Add `VITE_OURA_CLIENT_ID` and `VITE_OURA_CLIENT_SECRET`

---

## 🛠️ VS Code Integration

### Tasks (Ctrl+Shift+B / Cmd+Shift+B)
- **Start Dev Server**: Background task with live reload
- **Build Production**: TypeScript compile + Vite build
- **Run Tests**: Execute test suite
- **Health Check**: Validate environment
- **Analyze Bundle**: Visualize bundle size

### Debugging (F5)
- Launch Chrome or Edge with debugger attached
- Source maps enabled for TypeScript
- Breakpoints work in original .tsx files

### Recommended Extensions
- ESLint
- Tailwind CSS IntelliSense
- Prettier
- TypeScript
- Vitest Explorer

Install all: Check `.vscode/extensions.json`

---

## 📊 Performance Metrics

Current performance:
- **Dev server startup**: ~200-400ms ⚡
- **Hot Module Replacement**: <100ms
- **Package count**: 327
- **Node version**: v24.11.1
- **Build tool**: Vite 5.4.21

---

## 🔒 Security Notes

### Known Issues
- 2 moderate vulnerabilities in esbuild/vite
- Related to dev server (not production builds)
- Fix available but requires breaking changes to Vite 7

### Recommendations
1. Monitor for Vite 7 stable release
2. Update when project is ready for breaking changes
3. Dev server is safe for local development

---

## 🐛 Troubleshooting

### "API Key not found"
- Verify `.env` file exists
- Check key is named `VITE_GEMINI_API_KEY`
- Restart dev server after editing `.env`
- No spaces around `=` sign

### Port 5173 already in use
```bash
# Find and kill process
lsof -ti:5173 | xargs kill -9
```

### Dependencies not installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Rebuild TypeScript
npm run build
```

---

## 📁 Project Structure

```
/workspaces/Maeple/
├── components/          # React components
├── services/           # Business logic & API clients
│   ├── ai/            # AI provider adapters
│   └── wearables/     # Wearable device integrations
├── stores/            # Zustand state management
├── tests/             # Test suites
├── scripts/           # Build & utility scripts
├── .vscode/           # VS Code configuration
└── public/            # Static assets
```

---

## 🎯 Next Steps

### For Development:
1. ✅ Configure Gemini API key in `.env`
2. ✅ Run `npm run health` to verify setup
3. ✅ Start coding with `npm run dev`
4. ✅ Run tests with `npm test`

### For Production:
1. Run `npm run build`
2. Test with `npm run preview`
3. Deploy `dist/` folder to hosting service
4. See [DEPLOY.md](deploy/DEPLOY.md) for deployment guides

---

## 📚 Documentation

- [Full Setup Guide](SETUP.md)
- [Development Reference](DEV_REFERENCE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](deploy/DEPLOY.md)
- [Roadmap](ROADMAP.md)

---

## ✨ Features Enabled

- 🤖 AI-powered journaling (Gemini)
- 📸 Bio-Mirror state checks (Camera API)
- 🎙️ Voice journaling (Speech Recognition)
- 💬 Live AI coach (Multiple providers)
- 📊 Health metrics dashboard
- 🔄 Offline-first with sync
- 📱 Progressive Web App (PWA)
- 🔐 End-to-end encryption

---

**Need help?** Check [SETUP.md](SETUP.md) for detailed instructions or run `npm run health` for diagnostics.
