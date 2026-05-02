# Sakhi AI

**Empowering ASHAs with Offline-First Voice Intelligence**

## 🏗 Offline-First Architecture

1. **Voice → Whisper.cpp WASM**: The AI inference runs completely on-device in the background.
2. **Data → IndexedDB**: Local database survives application kills and offline stints seamlessly.
3. **Sync → Outbox Pattern**: Data is securely cached and automatically syncs to the server when connection resumes (even on 2G).
4. **Build → 1 Codebase**: A single React codebase deployed seamlessly to the Web and as a native Android APK via Capacitor.

## 📊 Tech Validation

- **Tested Hardware**: Redmi 9A, 2GB RAM, Android 10
- **Whisper Inference**: 6.2s average completion time
- **Total App Size**: 52MB (inclusive of the on-device AI model)
- **Offline Resilience**: 100% of core features are fully functional on Airplane Mode
