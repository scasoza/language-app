/**
 * Gemini API Service for LinguaFlow
 * Handles AI-powered features:
 * - Collection creation with Gemini 3 Flash (multimodal)
 * - Dialogue audio generation with Gemini 2.5 Flash TTS
 */

const GeminiService = {
    // API configuration
    API_KEY: '', // Set via setApiKey()
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',

    // Model IDs
    MODELS: {
        FLASH: 'gemini-3-flash-preview', // For text/multimodal generation (Gemini 3 Flash)
        TTS: 'gemini-2.5-flash-preview-tts' // For text-to-speech
    },

    // Thinking levels for Gemini 3 (controls reasoning depth)
    THINKING_LEVELS: {
        MINIMAL: 'minimal',  // Fastest, simple tasks
        LOW: 'low',          // Quick responses
        MEDIUM: 'medium',    // Balanced (default)
        HIGH: 'high'         // Most thorough reasoning
    },

    // Available TTS voices
    VOICES: {
        male: ['Kore', 'Charon', 'Fenrir', 'Orus', 'Puck'],
        female: ['Aoede', 'Kari', 'Zephyr', 'Nova', 'Stella']
    },

    // Set API key
    async setApiKey(key) {
        this.API_KEY = key;
        localStorage.setItem('gemini_api_key', key);

        // Also save to user profile for persistence across sessions
        if (typeof DataStore !== 'undefined' && DataStore.updateUser) {
            try {
                await DataStore.updateUser({ geminiApiKey: key });
            } catch (error) {
                console.error('Failed to save API key to user profile:', error);
            }
        }
    },

    // Get API key from storage
    getApiKey() {
        if (!this.API_KEY) {
            // Try to get from user profile first (more persistent)
            if (typeof DataStore !== 'undefined' && DataStore.getUser) {
                const user = DataStore.getUser();
                if (user && user.geminiApiKey) {
                    this.API_KEY = user.geminiApiKey;
                    // Also update localStorage for offline access
                    localStorage.setItem('gemini_api_key', user.geminiApiKey);
                    return this.API_KEY;
                }
            }

            // Fallback to localStorage
            this.API_KEY = localStorage.getItem('gemini_api_key') || '';
        }
        return this.API_KEY;
    },

    // Check if API is configured
    isConfigured() {
        return !!this.getApiKey();
    },

    // Generic API call
    async callAPI(model, contents, config = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key not configured. Please add your API key in settings.');
        }

        const url = `${this.BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

        const body = {
            contents: Array.isArray(contents) ? contents : [{ parts: [{ text: contents }] }],
            generationConfig: {
                temperature: config.temperature || 0.7,
                topP: config.topP || 0.95,
                topK: config.topK || 40,
                maxOutputTokens: config.maxTokens || 2048,
                ...config.generationConfig
            }
        };

        // Add thinking level for Gemini 3 models (controls reasoning depth)
        if (model.includes('gemini-3') && config.thinkingLevel) {
            body.generationConfig.thinkingConfig = {
                thinkingLevel: config.thinkingLevel
            };
        }

        // Add speech config for TTS
        if (config.speechConfig) {
            body.generationConfig.responseModalities = ['AUDIO'];
            body.generationConfig.speechConfig = config.speechConfig;
        }

        try {
            console.log(`🌐 Calling API: ${url.substring(0, 100)}...`);
            console.log(`📤 Request body:`, JSON.stringify(body, null, 2));

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            console.log(`📥 Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API error response:`, errorText);
                let errorMessage = 'API request failed';
                try {
                    const error = JSON.parse(errorText);
                    errorMessage = error.error?.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText.substring(0, 200);
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Gemini API Error:', error);
            throw error;
        }
    },

    // Extract text from API response
    extractText(response) {
        return response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    // Extract audio from TTS response and convert PCM to WAV
    extractAudio(response) {
        console.log('🔍 extractAudio: parsing API response');

        if (!response) {
            console.error('❌ Response is null/undefined');
            return null;
        }

        if (!response.candidates || response.candidates.length === 0) {
            console.error('❌ No candidates in response:', response);
            return null;
        }

        const part = response?.candidates?.[0]?.content?.parts?.[0];
        if (!part) {
            console.error('❌ No parts in response');
            return null;
        }

        if (!part.inlineData || !part.inlineData.data) {
            console.error('❌ No inlineData in part:', part);
            return null;
        }

        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'audio/L16;rate=24000';

        console.log(`📦 Audio data found:`);
        console.log(`   - MIME type: ${mimeType}`);
        console.log(`   - Data size: ${base64Data.length} chars`);

        // If it's already a standard format, return directly
        if (mimeType.includes('wav') || mimeType.includes('mp3') || mimeType.includes('mpeg')) {
            console.log('✅ Using audio as-is (standard format)');
            return `data:${mimeType};base64,${base64Data}`;
        }

        // Convert PCM (L16) to WAV for browser playback
        console.log('🔄 Converting PCM to WAV...');
        try {
            const pcmData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            console.log(`   - PCM data size: ${pcmData.length} bytes`);

            const wavData = this.pcmToWav(pcmData, 24000, 1, 16);
            console.log(`   - WAV data size: ${wavData.byteLength} bytes`);

            const wavBase64 = btoa(String.fromCharCode(...new Uint8Array(wavData)));
            console.log('✅ Conversion successful');

            return `data:audio/wav;base64,${wavBase64}`;
        } catch (e) {
            console.error('❌ Audio conversion error:', e);
            console.log('⚠️ Trying fallback: using raw data');
            // Fallback: try to play as-is
            return `data:audio/wav;base64,${base64Data}`;
        }
    },

    // Convert raw PCM data to WAV format
    pcmToWav(pcmData, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);
        const dataSize = pcmData.length;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset, str) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size
        view.setUint16(20, 1, true); // AudioFormat (PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        // Copy PCM data
        const uint8View = new Uint8Array(buffer, 44);
        uint8View.set(pcmData);

        return buffer;
    },

    /**
     * Generate flashcards from text/image using Gemini 3 Flash
     * @param {Object} input - { text: string, image?: base64 string, targetLanguage: string, nativeLanguage: string }
     * @returns {Promise<Array>} - Array of generated flashcards
     */
    async generateFlashcards(input) {
        const { text, image, targetLanguage = 'Spanish', nativeLanguage = 'English', count = 5 } = input;

        const isChinese = targetLanguage.toLowerCase().includes('chinese') || targetLanguage.toLowerCase().includes('mandarin');
        const readingGuide = isChinese ? 'pinyin' : 'phonetic';

        const prompt = `You are a language learning expert. Generate ${count} flashcards for learning ${targetLanguage} from ${nativeLanguage}.

${image ? 'Based on the image provided, ' : ''}Generate flashcards for: "${text}"

For each flashcard, provide:
1. front: The word/phrase in ${targetLanguage}
2. back: The translation in ${nativeLanguage}
3. reading: ${readingGuide} pronunciation guide
4. example: An example sentence using the word in ${targetLanguage}
5. exampleTranslation: Translation of the example sentence${isChinese ? '\n6. exampleReading: Pinyin for the example sentence' : ''}

Respond ONLY with a valid JSON array of flashcard objects. No markdown, no explanation.

Example format:
[
  {
    "front": "${isChinese ? '你好' : 'Hola'}",
    "back": "Hello",
    "reading": "${isChinese ? 'nǐ hǎo' : 'OH-lah'}",
    "example": "${isChinese ? '你好，你好吗？' : '¡Hola, ¿cómo estás?'}",
    "exampleTranslation": "Hello, how are you?"${isChinese ? ',\n    "exampleReading": "nǐ hǎo, nǐ hǎo ma?"' : ''}
  }
]`;

        const contents = [{ parts: [{ text: prompt }] }];

        // Add image if provided
        if (image) {
            contents[0].parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: image.replace(/^data:image\/\w+;base64,/, '')
                }
            });
        }

        const response = await this.callAPI(this.MODELS.FLASH, contents, {
            temperature: 0.5,
            maxTokens: 4096,
            thinkingLevel: this.THINKING_LEVELS.LOW // Fast generation for simple flashcards
        });

        const text_response = this.extractText(response);

        // Parse JSON response
        try {
            // Clean up the response (remove markdown code blocks if present)
            const cleaned = text_response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse flashcards:', e, text_response);
            throw new Error('Failed to generate flashcards. Please try again.');
        }
    },

    /**
     * Generate a collection based on topic/image using Gemini 3 Flash
     * @param {Object} input - { topic: string, image?: base64, language: string }
     * @returns {Promise<Object>} - Collection metadata and cards
     */
    async generateCollection(input) {
        const { topic, image, targetLanguage = 'Spanish', nativeLanguage = 'English', cardCount = 10 } = input;

        const isChinese = targetLanguage.toLowerCase().includes('chinese') || targetLanguage.toLowerCase().includes('mandarin');
        const readingGuide = isChinese ? 'pinyin' : 'phonetic';

        const prompt = `You are a language learning expert. Create a flashcard collection for learning ${targetLanguage}.

Topic: "${topic}"
${image ? 'Use the provided image as context for the vocabulary.' : ''}

Generate a collection with:
1. name: A catchy collection name
2. emoji: A single relevant emoji
3. description: A brief description (1 sentence)
4. cards: ${cardCount} flashcards with front, back, reading, example, exampleTranslation${isChinese ? ', exampleReading' : ''}

Respond ONLY with valid JSON. No markdown, no explanation.

Format:
{
  "name": "Collection Name",
  "emoji": "🌮",
  "description": "Learn food vocabulary",
  "cards": [
    {
      "front": "word in ${targetLanguage}",
      "back": "translation in ${nativeLanguage}",
      "reading": "${readingGuide} for the word",
      "example": "example sentence in ${targetLanguage}",
      "exampleTranslation": "translated example in ${nativeLanguage}"${isChinese ? ',\n      "exampleReading": "pinyin for the example sentence"' : ''}
    }
  ]
}`;

        const contents = [{ parts: [{ text: prompt }] }];

        if (image) {
            contents[0].parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: image.replace(/^data:image\/\w+;base64,/, '')
                }
            });
        }

        const response = await this.callAPI(this.MODELS.FLASH, contents, {
            temperature: 0.7,
            maxTokens: 8192,
            thinkingLevel: this.THINKING_LEVELS.MEDIUM // More reasoning for comprehensive collection
        });

        const text_response = this.extractText(response);

        try {
            const cleaned = text_response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse collection:', e, text_response);
            throw new Error('Failed to generate collection. Please try again.');
        }
    },

    /**
     * Generate a dialogue for language practice using Gemini 3 Flash
     * @param {Object} options - { scenario, vocabulary, complexity, length, targetLanguage }
     * @returns {Promise<Object>} - Generated dialogue with speakers and lines
     */
    async generateDialogue(options) {
        const {
            scenario = 'ordering food at a restaurant',
            vocabulary = [],
            complexity = 'intermediate', // beginner, intermediate, advanced
            length = 'medium', // short (5), medium (10), long (15)
            targetLanguage = 'Spanish',
            nativeLanguage = 'English'
        } = options;

        const turnCount = length === 'short' ? 5 : length === 'long' ? 15 : 10;

        const prompt = `You are a language learning dialogue generator. Create a realistic conversation for practicing ${targetLanguage}.

Scenario: ${scenario}
Complexity: ${complexity} level
${vocabulary.length > 0 ? `Include these vocabulary words: ${vocabulary.join(', ')}` : ''}

Generate a dialogue with approximately ${turnCount} turns between two speakers (A and B).
- Speaker A is the learner (customer/client)
- Speaker B is the native speaker (staff/service provider)

For each line, include:
1. speaker: "A" or "B"
2. text: The dialogue line in ${targetLanguage}
3. translation: English translation
4. highlightedWords: Array of vocabulary words used (if any)

Also provide:
- title: A descriptive title for the dialogue
- setting: Brief description of the setting
- duration: Estimated duration in minutes

Respond ONLY with valid JSON:
{
  "title": "Ordering at a Café",
  "setting": "A cozy coffee shop in Madrid",
  "duration": 2,
  "lines": [
    {
      "speaker": "B",
      "text": "Buenos días, ¿qué desea?",
      "translation": "Good morning, what would you like?",
      "highlightedWords": []
    }
  ]
}`;

        const response = await this.callAPI(this.MODELS.FLASH, prompt, {
            temperature: 0.8,
            maxTokens: 4096,
            thinkingLevel: this.THINKING_LEVELS.MEDIUM // Good reasoning for natural dialogue
        });

        const text_response = this.extractText(response);

        try {
            const cleaned = text_response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse dialogue:', e, text_response);
            throw new Error('Failed to generate dialogue. Please try again.');
        }
    },

    /**
     * Generate audio for dialogue using Gemini 2.5 Flash TTS (best for multi-speaker)
     * @param {Object} dialogue - The dialogue object with lines
     * @param {Object} voiceConfig - { speakerA: voice, speakerB: voice }
     * @returns {Promise<string>} - Base64 audio data URL
     */
    async generateDialogueAudio(dialogue, voiceConfig = {}) {
        const { speakerA = 'Puck', speakerB = 'Kore' } = voiceConfig;

        // Build the TTS prompt with speaker labels
        let ttsPrompt = `TTS the following conversation between ${speakerA} (Speaker A) and ${speakerB} (Speaker B):\n\n`;

        dialogue.lines.forEach(line => {
            const speaker = line.speaker === 'A' ? speakerA : speakerB;
            ttsPrompt += `${speaker}: ${line.text}\n`;
        });

        const speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    {
                        speaker: speakerA,
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: speakerA }
                        }
                    },
                    {
                        speaker: speakerB,
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: speakerB }
                        }
                    }
                ]
            }
        };

        const response = await this.callAPI(this.MODELS.TTS, ttsPrompt, {
            speechConfig,
            temperature: 0.3
        });

        return this.extractAudio(response);
    },

    /**
     * Generate TTS for a single text using Gemini 2.5 Flash TTS
     * @param {string} text - Text to convert to speech
     * @param {string} voice - Voice name
     * @param {string} style - Style instructions (optional)
     * @returns {Promise<string>} - Base64 audio data URL
     */
    async generateTTS(text, voice = 'Kore', style = '') {
        console.log(`🎙️ GeminiService.generateTTS called`);
        console.log(`   - Text: "${text}"`);
        console.log(`   - Voice: ${voice}`);
        console.log(`   - Model: ${this.MODELS.TTS}`);

        let prompt = text;
        if (style) {
            prompt = `${style}\n\nText: ${text}`;
        }

        const speechConfig = {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
            }
        };

        try {
            const response = await this.callAPI(this.MODELS.TTS, prompt, {
                speechConfig,
                temperature: 0.3
            });

            console.log(`📡 TTS API response received`);
            console.log(`📋 Full response structure:`, JSON.stringify(response, null, 2));

            const audioData = this.extractAudio(response);

            if (!audioData) {
                console.error('❌ extractAudio returned null/empty');
                console.error('❌ Response details:', JSON.stringify(response));
                throw new Error('Failed to extract audio from API response');
            }

            console.log(`✅ Audio extracted successfully, length: ${audioData.length}`);
            return audioData;

        } catch (error) {
            console.error(`❌ TTS generation failed:`, error);
            console.error(`❌ Error details:`, error.message, error.stack);
            throw error;
        }
    },

    /**
     * Translate text using Gemini 3 Flash
     * @param {string} text - Text to translate
     * @param {string} from - Source language
     * @param {string} to - Target language
     * @returns {Promise<string>} - Translated text
     */
    async translate(text, from, to) {
        const prompt = `Translate the following text from ${from} to ${to}. Respond with ONLY the translation, no explanation.

Text: "${text}"`;

        const response = await this.callAPI(this.MODELS.FLASH, prompt, {
            temperature: 0.3,
            maxTokens: 1024,
            thinkingLevel: this.THINKING_LEVELS.MINIMAL // Fast translation
        });

        return this.extractText(response).trim();
    },

    /**
     * Explain a word or phrase
     * @param {string} text - Word/phrase to explain
     * @param {string} language - The language of the text
     * @returns {Promise<Object>} - Explanation with grammar, usage, etc.
     */
    async explainWord(text, language = 'Spanish') {
        const prompt = `You are a ${language} language tutor. Explain the following word/phrase in detail for a learner:

Word/Phrase: "${text}"

Provide:
1. meaning: Simple definition
2. partOfSpeech: noun, verb, adjective, etc.
3. pronunciation: Phonetic guide
4. usage: When/how to use it
5. examples: 2-3 example sentences with translations
6. relatedWords: 3-4 related vocabulary words
7. tips: Any helpful tips for remembering

Respond with valid JSON only.`;

        const response = await this.callAPI(this.MODELS.FLASH, prompt, {
            temperature: 0.5,
            maxTokens: 2048,
            thinkingLevel: this.THINKING_LEVELS.MEDIUM // Good reasoning for comprehensive explanation
        });

        const text_response = this.extractText(response);

        try {
            const cleaned = text_response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            return { meaning: text_response };
        }
    }
};

// Export for use
window.GeminiService = GeminiService;
