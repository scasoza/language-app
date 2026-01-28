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
        // Gemini TTS voices (for dialogues)
        gemini: {
            male: ['Kore', 'Charon', 'Fenrir', 'Orus', 'Puck'],
            female: ['Aoede', 'Kari', 'Zephyr', 'Nova', 'Stella']
        },
        // Cloud TTS voices (for flashcards - reliable, language-specific)
        cloudTTS: {
            'Chinese': 'cmn-CN-Wavenet-A',
            'Spanish': 'es-ES-Wavenet-B',
            'French': 'fr-FR-Wavenet-A',
            'German': 'de-DE-Wavenet-A',
            'Japanese': 'ja-JP-Wavenet-A',
            'Korean': 'ko-KR-Wavenet-A',
            'Italian': 'it-IT-Wavenet-A',
            'Portuguese': 'pt-BR-Wavenet-A'
        }
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
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    },

    // Extract text from API response
    extractText(response) {
        return response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },

    async answerCardQuestion({ card, question }) {
        if (!question) {
            throw new Error('Question is required');
        }

        const prompt = `You are a helpful language tutor. Answer the learner's question using the flashcard context.

Flashcard context:
- Front: ${card?.front || 'N/A'}
- Back: ${card?.back || 'N/A'}
- Reading: ${card?.reading || 'N/A'}
- Example: ${card?.example || 'N/A'}

Learner question: ${question}

Provide a concise, clear answer. If the question is unrelated to the card, say so and refocus on the card.`;

        const response = await this.callAPI(this.MODELS.FLASH, prompt, {
            temperature: 0.3,
            maxTokens: 512,
            thinkingLevel: this.THINKING_LEVELS.LOW
        });

        return this.extractText(response).trim();
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
     * Generate a collection with multimodal inputs (text, audio, images) using Gemini 3 Flash
     * @param {Object} input - { topic?: string, audio?: base64, image?: base64, text?: string, targetLanguage: string, nativeLanguage: string, cardCount?: number }
     * @returns {Promise<Object>} - Collection metadata and cards
     */
    async generateCollectionMultimodal(input) {
        const { topic, audio, images = [], text, targetLanguage = 'Spanish', nativeLanguage = 'English', cardCount } = input;
        const hasImages = images && images.length > 0;

        // Validate inputs - images cannot be used alone
        if (hasImages && !audio && !text && !topic) {
            throw new Error('Images cannot be used alone. Please provide text or audio along with images.');
        }

        const isChinese = targetLanguage.toLowerCase().includes('chinese') || targetLanguage.toLowerCase().includes('mandarin');
        const readingGuide = isChinese ? 'pinyin' : 'phonetic';

        // Build dynamic prompt based on available inputs
        let inputDescription = '';
        if (topic) inputDescription += `Topic: "${topic}"\n`;
        if (text) inputDescription += `User input: "${text}"\n`;
        if (audio) inputDescription += 'Audio input provided.\n';
        if (hasImages) inputDescription += `${images.length} image${images.length > 1 ? 's' : ''} provided for context.\n`;

        const prompt = `You are a language learning expert. Create a flashcard collection for learning ${targetLanguage}.

${inputDescription}

IMPORTANT: First, check if the user has specified how many cards they want in their input (audio or text).
- If they specify a number (e.g., "create 15 cards", "I want 20 flashcards"), use that number.
- If no number is specified, use the default: ${cardCount || 10} cards.

Generate a collection with:
1. name: A catchy collection name based on the content
2. emoji: A single relevant emoji
3. description: A brief description (1 sentence)
4. cardCount: The number of cards to generate (extracted from user input or default)
5. cards: Generate exactly the number of flashcards specified, each with:
   - front: word/phrase in ${targetLanguage}
   - back: translation in ${nativeLanguage}
   - reading: ${readingGuide} pronunciation guide
   - example: example sentence in ${targetLanguage}
   - exampleTranslation: translated example in ${nativeLanguage}${isChinese ? '\n   - exampleReading: pinyin for the example sentence' : ''}

Respond ONLY with valid JSON. No markdown, no explanation.

Format:
{
  "name": "Collection Name",
  "emoji": "🌮",
  "description": "Learn food vocabulary",
  "cardCount": 10,
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

        // Build multimodal content array
        const contents = [{ parts: [{ text: prompt }] }];

        // Add audio if provided (send directly without transcription)
        if (audio) {
            contents[0].parts.push({
                inlineData: {
                    mimeType: this.detectAudioMimeType(audio),
                    data: audio.replace(/^data:audio\/\w+;base64,/, '')
                }
            });
        }

        // Add images if provided
        if (hasImages) {
            images.forEach(image => {
                // Detect mime type from data URL
                const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                contents[0].parts.push({
                    inlineData: {
                        mimeType,
                        data: image.replace(/^data:image\/\w+;base64,/, '')
                    }
                });
            });
        }

        const response = await this.callAPI(this.MODELS.FLASH, contents, {
            temperature: 0.7,
            maxTokens: 8192,
            thinkingLevel: this.THINKING_LEVELS.MEDIUM
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

            const audioData = this.extractAudio(response);

            if (!audioData) {
                console.error('❌ extractAudio returned null/empty');
                throw new Error('Failed to extract audio from API response');
            }

            console.log(`✅ Audio extracted successfully, length: ${audioData.length}`);
            return audioData;

        } catch (error) {
            console.error(`❌ TTS generation failed:`, error);
            throw error;
        }
    },

    /**
     * Generate TTS using Google Cloud TTS via Supabase Edge Function
     * This is more reliable and language-specific for flashcard audio
     * @param {string} text - Text to convert to speech
     * @param {string} language - Target language (e.g., 'Chinese', 'Spanish')
     * @returns {Promise<string>} - Base64 audio data URL
     */
    async generateCloudTTS(text, language = 'Chinese') {
        console.log(`🔊 GeminiService.generateCloudTTS called`);
        console.log(`   - Text: "${text}"`);
        console.log(`   - Language: ${language}`);

        // Get Supabase URL
        const supabaseUrl = window.SUPABASE_URL || localStorage.getItem('supabase_url');
        console.log(`🔍 Supabase URL check:`);
        console.log(`   - window.SUPABASE_URL: ${window.SUPABASE_URL || '(not set)'}`);
        console.log(`   - localStorage.supabase_url: ${localStorage.getItem('supabase_url') || '(not set)'}`);
        console.log(`   - Using: ${supabaseUrl || '(NONE - will error)'}`);

        if (!supabaseUrl) {
            throw new Error('Supabase not configured');
        }

        // Get voice for target language
        const voiceName = this.VOICES.cloudTTS[language] || 'cmn-CN-Wavenet-A';
        const languageCode = voiceName.split('-').slice(0, 2).join('-'); // e.g., 'cmn-CN'

        // Call Supabase Edge Function
        const functionUrl = `${supabaseUrl}/functions/v1/cloud-tts`;
        console.log(`🎯 Final function URL: ${functionUrl}`);

        const requestBody = {
            text,
            languageCode,
            voiceName
        };

        try {
            console.log(`🌐 Calling Supabase Edge Function...`);
            console.log(`   Request body:`, requestBody);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log(`📡 Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Edge Function error:`, errorText);
                throw new Error(`Cloud TTS failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ Cloud TTS response received`);

            if (!data.audioContent) {
                console.error('❌ No audioContent in response:', data);
                throw new Error('No audio data returned from Cloud TTS');
            }

            // Convert to data URL for playback
            const audioDataUrl = `data:audio/mp3;base64,${data.audioContent}`;
            console.log(`✅ Audio data URL created, length: ${audioDataUrl.length}`);

            return audioDataUrl;

        } catch (error) {
            console.error(`❌ Cloud TTS generation failed:`, error);
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
     * Edit a collection using AI with multimodal inputs
     * @param {Object} input - { collectionId: string, instructions: string, audio?: base64, images?: base64[], targetLanguage: string, nativeLanguage: string }
     * @returns {Promise<Object>} - Modified collection data with changes
     */
    async editCollectionWithAI(input) {
        const { collectionId, instructions, audio, images = [], text, targetLanguage = 'Spanish', nativeLanguage = 'English' } = input;
        const hasImages = images && images.length > 0;

        // Get current collection data
        const collection = DataStore.getCollection(collectionId);
        const existingCards = DataStore.getCards(collectionId);

        const isChinese = targetLanguage.toLowerCase().includes('chinese') || targetLanguage.toLowerCase().includes('mandarin');
        const readingGuide = isChinese ? 'pinyin' : 'phonetic';

        // Build prompt with instructions
        let inputDescription = '';
        if (instructions) inputDescription += `User instructions: "${instructions}"\n`;
        if (text) inputDescription += `Additional text: "${text}"\n`;
        if (audio) inputDescription += 'Audio instructions provided.\n';
        if (hasImages) inputDescription += `${images.length} image${images.length > 1 ? 's' : ''} provided for context.\n`;

        const prompt = `You are a language learning expert. Edit this flashcard collection based on user instructions.

Current collection: "${collection.name}" (${collection.emoji})
Current cards: ${existingCards.length} cards
${existingCards.slice(0, 5).map(c => `- ${c.front} → ${c.back}`).join('\n')}
${existingCards.length > 5 ? `... and ${existingCards.length - 5} more cards` : ''}

${inputDescription}

IMPORTANT:
- If the user specifies how many cards to add/create in their input, use that number.
- Otherwise, add 5 new cards by default if adding cards.
- For modifications, update existing cards as instructed.
- For deletions, specify which cards to remove.

Provide a response with:
1. action: "add", "modify", "remove", or "mixed"
2. cardCount: Number of cards affected (if applicable)
3. cards: Array of new/modified cards (only if adding or modifying), each with:
   - front, back, reading, example, exampleTranslation${isChinese ? ', exampleReading' : ''}
   - If modifying, include: cardId (from existing cards)
4. removeCardIds: Array of card IDs to remove (only if removing)
5. collectionUpdates: Object with any collection-level changes (name, emoji, description)

Respond ONLY with valid JSON:
{
  "action": "add",
  "cardCount": 5,
  "cards": [...],
  "removeCardIds": [],
  "collectionUpdates": {}
}`;

        // Build multimodal content array
        const contents = [{ parts: [{ text: prompt }] }];

        // Add audio if provided
        if (audio) {
            contents[0].parts.push({
                inlineData: {
                    mimeType: this.detectAudioMimeType(audio),
                    data: audio.replace(/^data:audio\/\w+;base64,/, '')
                }
            });
        }

        // Add images if provided
        if (hasImages) {
            images.forEach(image => {
                // Detect mime type from data URL
                const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
                contents[0].parts.push({
                    inlineData: {
                        mimeType,
                        data: image.replace(/^data:image\/\w+;base64,/, '')
                    }
                });
            });
        }

        const response = await this.callAPI(this.MODELS.FLASH, contents, {
            temperature: 0.7,
            maxTokens: 8192,
            thinkingLevel: this.THINKING_LEVELS.MEDIUM
        });

        const text_response = this.extractText(response);

        try {
            const cleaned = text_response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse AI edit response:', e, text_response);
            throw new Error('Failed to process AI editing. Please try again.');
        }
    },

    /**
     * Detect MIME type from base64 audio data URL
     * @param {string} audioData - Base64 audio data URL
     * @returns {string} - MIME type
     */
    detectAudioMimeType(audioData) {
        if (audioData.startsWith('data:')) {
            const match = audioData.match(/^data:(audio\/[^;]+);/);
            if (match) return match[1];
        }
        // Default to common formats supported by Gemini
        return 'audio/wav';
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
