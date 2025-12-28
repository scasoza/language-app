# LinguaFlow - AI Language Learning App

An AI-powered language learning app with flashcards, spaced repetition, and dialogue practice. Built with Gemini 3 Flash for intelligent content generation and Gemini 2.5 Flash TTS for natural multi-speaker audio.

## Features

- **Smart Flashcards**: Create flashcards with AI-generated translations, examples, and pronunciations
- **Spaced Repetition**: SM-2 algorithm for optimal memory retention
- **AI Dialogue Practice**: Generate realistic conversations with customizable scenarios
- **Multi-Speaker Audio**: Natural dialogue audio with Gemini 2.5 Flash TTS
- **Collection Management**: Organize vocabulary into themed collections
- **Offline Support**: PWA with service worker for offline functionality
- **Dark Mode**: Beautiful dark theme optimized for learning

## Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS, Material Symbols
- **AI**: Gemini 3 Flash (text/multimodal), Gemini 2.5 Flash TTS (audio)
- **Mobile**: Capacitor for native Android/iOS apps
- **Storage**: LocalStorage with optional cloud sync

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for Android build)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Then open `http://localhost:3000` in your browser.

### Setting up API Key

1. Open the app
2. Go to Settings (Profile icon)
3. Click "Setup API Key"
4. Enter your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Building for Android (Play Store)

### 1. Generate App Icons

Generate icons from the SVG in `www/icons/icon.svg`:

```bash
# Using a tool like sharp or imagemagick
# Generate all required sizes: 72, 96, 128, 144, 152, 192, 384, 512
```

Or use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html).

### 2. Initialize Android Platform

```bash
# Add Android platform
npx cap add android

# Sync web assets to Android
npx cap sync android
```

### 3. Configure Android Project

Open `android/app/src/main/AndroidManifest.xml` and verify permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 4. Build Release APK/AAB

```bash
# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Choose Android App Bundle (AAB) for Play Store
# 3. Create/select your keystore
# 4. Build the release bundle
```

### 5. Play Store Submission

1. Create a [Google Play Developer account](https://play.google.com/console)
2. Create a new app in Play Console
3. Upload your AAB file
4. Fill in store listing details:
   - App name: LinguaFlow
   - Short description: AI-powered language learning with smart flashcards
   - Full description: Master any language with AI-powered flashcards...
   - Screenshots (phone, tablet, 7" tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)
5. Set up pricing and distribution
6. Submit for review

## Project Structure

```
linguaflow/
├── src/                    # Source files (development)
│   ├── index.html
│   └── js/
│       ├── app.js          # Main application controller
│       ├── data.js         # LocalStorage data management
│       ├── gemini-service.js # Gemini API integration
│       └── screens/        # Screen components
├── www/                    # Built web assets (Capacitor uses this)
├── android/                # Android native project (after cap add)
├── capacitor.config.ts     # Capacitor configuration
└── package.json
```

## Gemini AI Integration

### Gemini 3 Flash (Text Generation)

Used for:
- Flashcard generation with translations and examples
- Collection creation from topics
- Dialogue generation
- Word explanations

Features the `thinkingLevel` parameter for controlling reasoning depth:
- `minimal`: Fast responses for simple tasks
- `low`: Quick translations
- `medium`: Balanced for dialogue generation
- `high`: Thorough for complex explanations

### Gemini 2.5 Flash TTS (Audio)

Used for:
- Multi-speaker dialogue audio
- Single word/phrase pronunciation
- Supports 30+ voices in 24 languages

## License

MIT License - feel free to use and modify for your own projects.

## Support

For issues and feature requests, please open a GitHub issue.
