/**
 * Main Application Controller for LinguaFlow
 */

const app = {
    currentScreen: null,
    history: [],
    screensWithNav: ['home', 'collections', 'dialogue-settings', 'settings'],

    async init() {
        console.log('🚀 Initializing LinguaFlow...');
        this.registerSupabaseWarnings();
        this.registerAuthEvents();

        // Initialize Supabase
        await SupabaseService.init();
        console.log('✅ Supabase initialized:', SupabaseService.initialized);

        if (SupabaseService.initialized && !SupabaseService.isAuthenticated()) {
            const cleared = DataStore.clearLocalDataOnce();
            if (cleared) {
                console.log('🧹 Cleared local storage data for a fresh Supabase login.');
            }
            this.navigate('auth');
            console.log('✅ App initialized');
            return;
        }

        await this.handleAuthenticatedSession();
        console.log('✅ App initialized');
    },

    navigate(screenId, addToHistory = true) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        // Show target screen
        const screen = document.getElementById(`screen-${screenId}`);
        if (screen) {
            screen.classList.add('active');

            // Render screen content
            this.renderScreen(screenId);

            // Update navigation
            this.updateNavigation(screenId);

            // Add to history
            if (addToHistory && this.currentScreen !== screenId) {
                this.history.push(this.currentScreen);
            }

            this.currentScreen = screenId;
        }
    },

    renderScreen(screenId) {
        switch (screenId) {
            case 'auth':
                AuthScreen.render();
                break;
            case 'onboarding':
                OnboardingScreen.render();
                break;
            case 'home':
                HomeScreen.render();
                break;
            case 'collections':
                CollectionsScreen.render();
                break;
            case 'collection-detail':
                CollectionDetailScreen.render();
                break;
            case 'add-word':
                AddWordScreen.render();
                break;
            case 'study':
                StudyScreen.render();
                break;
            case 'dialogue-settings':
                DialogueSettingsScreen.render();
                break;
            case 'dialogue-practice':
                DialoguePracticeScreen.render();
                break;
            case 'settings':
                SettingsScreen.render();
                break;
        }
    },

    updateNavigation(screenId) {
        const nav = document.getElementById('bottom-nav');

        // Show/hide nav based on screen
        if (this.screensWithNav.includes(screenId)) {
            nav.classList.remove('hidden');
        } else {
            nav.classList.add('hidden');
        }

        // Update active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const navScreen = btn.dataset.nav;
            if (navScreen === screenId) {
                btn.classList.remove('text-slate-400');
                btn.classList.add('text-primary');
            } else {
                btn.classList.remove('text-primary');
                btn.classList.add('text-slate-400');
            }
        });
    },

    goBack() {
        if (this.history.length > 0) {
            const prevScreen = this.history.pop();
            if (prevScreen) {
                this.navigate(prevScreen, false);
            } else {
                this.navigate('home', false);
            }
        } else {
            this.navigate('home', false);
        }
    },

    registerAuthEvents() {
        window.addEventListener('auth:signout', () => {
            this.navigate('auth');
        });
    },

    async handleAuthenticatedSession() {
        await DataStore.init();
        this.maybeShowSupabaseWarning();

        const user = DataStore.getUser();
        this.applyUserSettings(user);

        if (DataStore.isOnboarded()) {
            this.navigate('home');
        } else {
            this.navigate('onboarding');
        }
    },

    applyUserSettings(user) {
        if (user && user.geminiApiKey) {
            console.log('📝 Loading API key from user profile');
            GeminiService.API_KEY = user.geminiApiKey;
            localStorage.setItem('gemini_api_key', user.geminiApiKey);
        } else {
            const apiKey = localStorage.getItem('gemini_api_key');
            if (apiKey) {
                console.log('📝 Loading API key from localStorage');
                GeminiService.API_KEY = apiKey;
            }
        }

        if (user) {
            document.documentElement.classList.toggle('dark', user.settings.darkMode);
        }
    },

    // Study session
    startStudySession(collectionId = null) {
        StudyScreen.init(collectionId);
        this.navigate('study');
    },

    endStudySession() {
        this.navigate('home');
    },

    // Collection actions
    openCollection(id) {
        console.log('Opening collection:', id);
        const collection = DataStore.getCollection(id);
        if (collection) {
            console.log('Collection found:', collection.name);
            CollectionDetailScreen.setCollection(id);
            this.navigate('collection-detail');
        } else {
            console.error('Collection not found:', id);
            this.showToast('Collection not found', 'error');
            this.navigate('collections');
        }
    },

    editCollection(id) {
        CollectionDetailScreen.setCollection(id);
        this.navigate('collection-detail');
    },

    showCreateCollectionModal() {
        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Create Collection</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Collection Name (Optional)</label>
                    <input type="text" id="collection-name" placeholder="e.g., Spanish Verbs (or let AI decide)" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                </div>

                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Emoji (Optional)</label>
                    <input type="text" id="collection-emoji" placeholder="🇪🇸 (or let AI decide)" maxlength="2" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                </div>

                <div class="pt-2 border-t border-white/10">
                    <div class="flex items-center justify-between mb-3">
                        <p class="text-sm font-bold text-primary">✨ Generate with AI</p>
                        <div class="flex gap-2">
                            <button id="audio-record-btn" onclick="app.toggleAudioRecording()" class="size-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors" title="Record audio for AI">
                                <span class="material-symbols-outlined text-primary text-xl">mic</span>
                            </button>
                            <button id="image-upload-btn" onclick="document.getElementById('ai-image-input').click()" class="size-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors" title="Upload image">
                                <span class="material-symbols-outlined text-primary text-xl">image</span>
                            </button>
                            <input type="file" id="ai-image-input" accept="image/*" class="hidden" onchange="app.handleImageUpload(event)" />
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Describe what you want</label>
                        <textarea id="collection-topic" rows="3" placeholder="Type or record audio: 'I want to learn 15 common Spanish phrases for ordering food at restaurants'" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 resize-none"></textarea>
                        <div id="multimodal-preview" class="mt-2 flex flex-wrap gap-2"></div>
                        <p class="text-xs text-slate-500 mt-1">💡 Tip: Use text, audio, images, or any combination. Specify card count in your description!</p>
                    </div>
                </div>

                <div class="flex gap-3 pt-2">
                    <button onclick="app.createCollection(false)" class="flex-1 bg-surface-dark border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5 transition-colors">
                        Create Empty
                    </button>
                    <button onclick="app.createCollection(true)" class="flex-1 bg-primary text-background-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform">
                        <span class="material-symbols-outlined text-xl">auto_awesome</span>
                        Generate
                    </button>
                </div>
            </div>
        `);
    },

    async createCollection(withAI = false) {
        const nameInput = document.getElementById('collection-name');
        const emojiInput = document.getElementById('collection-emoji');
        const topicInput = document.getElementById('collection-topic');

        const name = nameInput?.value?.trim();
        const emoji = emojiInput?.value?.trim() || '📚';
        const topic = topicInput?.value?.trim();

        if (withAI) {
            // Get multimodal inputs
            const audioData = this.recordedAudioData;
            const imageData = this.uploadedImageData;

            // Validate inputs - images cannot be used alone
            if (imageData && !audioData && !topic) {
                this.showToast('Images cannot be used alone. Please provide text or audio.', 'error');
                return;
            }

            // At least one input is required
            if (!topic && !audioData && !imageData) {
                this.showToast('Please provide text, audio, or images to generate cards', 'error');
                return;
            }

            if (!GeminiService.isConfigured()) {
                this.closeModal();
                this.showApiKeyModal();
                return;
            }

            // Close modal
            this.closeModal();

            // Add placeholder card to collections screen
            const placeholderId = 'placeholder-' + Date.now();
            this.showPlaceholderCollection(placeholderId, topic || 'AI Collection', emoji);

            try {
                const user = DataStore.getUser();
                this.showToast('Generating with AI...', 'info');

                // Use multimodal API if audio or image is provided
                const result = await GeminiService.generateCollectionMultimodal({
                    topic: name || topic,
                    text: topic,
                    audio: audioData,
                    image: imageData,
                    targetLanguage: user.targetLanguage,
                    nativeLanguage: user.nativeLanguage,
                    cardCount: 10,  // Default, but AI will extract from text if specified
                    onBatchProgress: (progress) => {
                        const { status, batchNumber, expectedBatches, generatedCount, requestedCount } = progress;
                        const batchLabel = expectedBatches > 1
                            ? `Batch ${batchNumber} of ${expectedBatches}`
                            : 'Batch 1';
                        if (status === 'failed') {
                            this.updatePlaceholderCollectionMessage(
                                placeholderId,
                                `${batchLabel} failed. Continuing...`
                            );
                            return;
                        }
                        const countLabel = requestedCount
                            ? `${generatedCount} of ${requestedCount} cards`
                            : `${generatedCount} cards`;
                        this.updatePlaceholderCollectionMessage(
                            placeholderId,
                            `Generating with AI... ${batchLabel} (${countLabel})`
                        );
                    }
                });

                // Clear multimodal data after use
                this.recordedAudioData = null;
                this.uploadedImageData = null;

                console.log('Generated collection:', result);

                // Create collection (AWAIT the async operation!)
                const collection = await DataStore.addCollection({
                    name: result.name || topic,
                    emoji: result.emoji || emoji,
                    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACoj-K0BPLOsYgV7-kqnQ3Kc8RBHW-0dcMMAhvSRkQ9ZzBFf2E0zVC4OppgQuRCDoEe8wgyID-EmbYHgtToi4z5vB-Z4s4LmS--R63bk6jkHtSTeQ04kp2YZKiH_2m2Tx4Ae2ZXZf2p5b05vQ_762DRKbKFh2-ZmJEXgv8Mq3JqZ7NSczx15tr9mhlZ0bWsI3m9EvNSXPFpnE2rBr17lGdGDW_cR4acoKubrJmny_uToJsfMlRaXOmoPCpNoM52buN0LRFwWNki6yU'
                });

                console.log('Collection created:', collection);

                // Add cards (AWAIT each async operation!)
                if (result.cards && result.cards.length > 0) {
                    console.log(`Adding ${result.cards.length} cards...`);

                    // Add cards sequentially to ensure they all save
                    for (let i = 0; i < result.cards.length; i++) {
                        const card = result.cards[i];
                        try {
                            const newCard = await DataStore.addCard({
                                ...card,
                                collectionId: collection.id
                            });
                            console.log(`Card ${i + 1}/${result.cards.length} added:`, newCard);
                        } catch (cardError) {
                            console.error(`Error adding card ${i + 1}:`, cardError);
                        }
                    }
                }

                // Remove placeholder
                this.removePlaceholderCollection(placeholderId);

                // Verify cards were actually added
                const savedCards = DataStore.getCards(collection.id);
                console.log(`Verification: ${savedCards.length} cards in collection ${collection.id}`);

                if (result.batchErrors && result.batchErrors.length > 0) {
                    this.showToast(
                        `Created "${result.name}" with ${savedCards.length} of ${result.requestedCardCount || savedCards.length} cards (some batches failed).`,
                        'info'
                    );
                } else {
                    this.showToast(`Created "${result.name}" with ${savedCards.length} cards!`, 'success');
                }

                // Refresh screen
                if (this.currentScreen === 'collections') {
                    CollectionsScreen.render();
                } else if (this.currentScreen === 'home') {
                    HomeScreen.render();
                }
            } catch (error) {
                console.error('Error creating collection:', error);
                this.removePlaceholderCollection(placeholderId);
                this.showToast(error.message, 'error');
            }
        } else {
            if (!name) {
                this.showToast('Please enter a collection name', 'error');
                return;
            }

            const collection = DataStore.addCollection({
                name,
                emoji,
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACoj-K0BPLOsYgV7-kqnQ3Kc8RBHW-0dcMMAhvSRkQ9ZzBFf2E0zVC4OppgQuRCDoEe8wgyID-EmbYHgtToi4z5vB-Z4s4LmS--R63bk6jkHtSTeQ04kp2YZKiH_2m2Tx4Ae2ZXZf2p5b05vQ_762DRKbKFh2-ZmJEXgv8Mq3JqZ7NSczx15tr9mhlZ0bWsI3m9EvNSXPFpnE2rBr17lGdGDW_cR4acoKubrJmny_uToJsfMlRaXOmoPCpNoM52buN0LRFwWNki6yU'
            });

            this.closeModal();
            this.showToast(`Created "${name}"`, 'success');

            // Refresh screen
            if (this.currentScreen === 'collections') {
                CollectionsScreen.render();
            } else if (this.currentScreen === 'home') {
                HomeScreen.render();
            }
        }
    },

    // Modal system
    showModal(content) {
        const container = document.getElementById('modal-container');
        const contentEl = document.getElementById('modal-content');
        contentEl.innerHTML = content;
        container.classList.remove('hidden');
    },

    closeModal() {
        const container = document.getElementById('modal-container');
        container.classList.add('hidden');
    },

    // API Key Modal
    showApiKeyModal() {
        const currentKey = GeminiService.getApiKey();
        const maskedKey = currentKey ? currentKey.slice(0, 8) + '...' + currentKey.slice(-4) : '';

        this.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Gemini API Key</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <p class="text-sm text-gray-400 mb-4">
                Enter your Google AI Studio API key to enable AI-powered features like dialogue generation and auto-translation.
            </p>

            <div class="mb-4">
                <a href="https://aistudio.google.com/apikey" target="_blank" class="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                    Get your API key from Google AI Studio
                    <span class="material-symbols-outlined text-sm">open_in_new</span>
                </a>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">API Key</label>
                    <input type="password" id="api-key-input" placeholder="AIza..." value="${currentKey}" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 font-mono text-sm" />
                    ${currentKey ? `<p class="text-xs text-gray-500 mt-1">Current: ${maskedKey}</p>` : ''}
                </div>

                <button onclick="app.saveApiKey()" class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl">
                    Save API Key
                </button>
            </div>
        `);
    },

    async saveApiKey() {
        const input = document.getElementById('api-key-input');
        const key = input?.value?.trim();

        if (key) {
            await GeminiService.setApiKey(key);
            this.closeModal();
            this.showToast('API key saved!', 'success');

            // Refresh current screen
            this.renderScreen(this.currentScreen);
        } else {
            this.showToast('Please enter an API key', 'error');
        }
    },

    // Loading overlay with tips
    loadingTips: [
        'Did you know? Spaced repetition can improve retention by 200%!',
        'Tip: Review cards right before you forget them for best results.',
        'Fun fact: Your brain forms stronger memories while you sleep!',
        'Pro tip: Learning in context helps you remember vocabulary better.',
        'Tip: Try to use new words in sentences to reinforce learning.',
        'Did you know? Music can help with language learning!',
        'Pro tip: Consistency beats intensity - study a little every day.',
        'Fun fact: Bilingual brains are better at multitasking!'
    ],

    showLoadingOverlay(title = 'Loading...', subtitle = '') {
        const tip = this.loadingTips[Math.floor(Math.random() * this.loadingTips.length)];

        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'fixed inset-0 z-[200] bg-background-dark/95 backdrop-blur-sm flex flex-col items-center justify-center p-8';
        overlay.innerHTML = `
            <div class="relative mb-8">
                <div class="size-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <span class="material-symbols-outlined text-3xl text-primary animate-pulse">auto_awesome</span>
                </div>
            </div>
            <h2 class="text-2xl font-bold mb-2 text-center" data-loading-title>${title}</h2>
            <p class="text-slate-400 text-center mb-8" data-loading-subtitle>${subtitle}</p>
            <div class="max-w-sm p-4 rounded-xl bg-surface-dark border border-white/5">
                <p class="text-sm text-slate-300 text-center italic">"${tip}"</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    updateLoadingOverlay(title = null, subtitle = null) {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;

        if (title !== null) {
            const titleEl = overlay.querySelector('[data-loading-title]');
            if (titleEl) titleEl.textContent = title;
        }

        if (subtitle !== null) {
            const subtitleEl = overlay.querySelector('[data-loading-subtitle]');
            if (subtitleEl) subtitleEl.textContent = subtitle;
        }
    },

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.remove(), 300);
        }
    },

    // Voice input for creating collections
    recognition: null,
    isListening: false,
    voiceInputBaseText: '', // Store the text that was there before voice input started

    startVoiceInput() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.showToast('Voice input not supported in this browser', 'error');
            return;
        }

        const topicInput = document.getElementById('collection-topic');
        const voiceBtn = document.getElementById('voice-input-btn');

        if (!this.recognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false; // Only final results to avoid duplication
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                // Save the current text as baseline
                this.voiceInputBaseText = topicInput.value;

                voiceBtn.classList.add('bg-red-500/20', 'border-red-500', 'animate-pulse');
                voiceBtn.querySelector('.material-symbols-outlined').classList.add('text-red-500');
                voiceBtn.querySelector('.material-symbols-outlined').classList.remove('text-primary');
                this.showToast('Listening... Speak now!', 'info');
            };

            this.recognition.onresult = (event) => {
                // Build complete transcript from ALL final results in this session
                let completeTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        completeTranscript += event.results[i][0].transcript + ' ';
                    }
                }

                if (completeTranscript) {
                    // Update field: base text + space (if needed) + complete transcript
                    const trimmedBase = this.voiceInputBaseText.trim();
                    const separator = (trimmedBase && !trimmedBase.endsWith(' ')) ? ' ' : '';
                    topicInput.value = trimmedBase + separator + completeTranscript.trim();
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceInput();
                if (event.error !== 'no-speech') {
                    this.showToast('Voice input error: ' + event.error, 'error');
                }
            };

            this.recognition.onend = () => {
                this.stopVoiceInput();
            };
        }

        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.recognition.start();
        }
    },

    stopVoiceInput() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;

            const voiceBtn = document.getElementById('voice-input-btn');
            if (voiceBtn) {
                voiceBtn.classList.remove('bg-red-500/20', 'border-red-500', 'animate-pulse');
                voiceBtn.querySelector('.material-symbols-outlined').classList.remove('text-red-500');
                voiceBtn.querySelector('.material-symbols-outlined').classList.add('text-primary');
            }
        }
    },

    // Audio recording for AI (captures raw audio without transcription)
    async toggleAudioRecording() {
        if (this.isRecording) {
            await this.stopAudioRecording();
        } else {
            await this.startAudioRecording();
        }
    },

    async startAudioRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const reader = new FileReader();

                reader.onloadend = () => {
                    this.recordedAudioData = reader.result; // base64 data URL
                    this.updateMultimodalPreview();
                };

                reader.readAsDataURL(audioBlob);

                // Clean up
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            const recordBtn = document.getElementById('audio-record-btn');
            if (recordBtn) {
                recordBtn.classList.add('bg-red-500/20', 'border-red-500', 'animate-pulse');
                recordBtn.querySelector('.material-symbols-outlined').classList.add('text-red-500');
                recordBtn.querySelector('.material-symbols-outlined').classList.remove('text-primary');
            }

            this.showToast('Recording audio... Click again to stop', 'info');
        } catch (error) {
            console.error('Audio recording error:', error);
            this.showToast('Failed to access microphone', 'error');
        }
    },

    async stopAudioRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            const recordBtn = document.getElementById('audio-record-btn');
            if (recordBtn) {
                recordBtn.classList.remove('bg-red-500/20', 'border-red-500', 'animate-pulse');
                recordBtn.querySelector('.material-symbols-outlined').classList.remove('text-red-500');
                recordBtn.querySelector('.material-symbols-outlined').classList.add('text-primary');
            }

            this.showToast('Audio recorded!', 'success');
        }
    },

    // Image upload handler
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            this.uploadedImageData = reader.result; // base64 data URL
            this.updateMultimodalPreview();
            this.showToast('Image uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    },

    // Update multimodal preview in the modal
    updateMultimodalPreview() {
        const previewContainer = document.getElementById('multimodal-preview');
        if (!previewContainer) return;

        let previewHTML = '';

        if (this.recordedAudioData) {
            previewHTML += `
                <div class="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
                    <span class="material-symbols-outlined text-primary text-sm">mic</span>
                    <span class="text-xs font-medium">Audio recorded</span>
                    <button onclick="app.removeAudio()" class="ml-2 text-gray-400 hover:text-red-500">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            `;
        }

        if (this.uploadedImageData) {
            previewHTML += `
                <div class="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
                    <span class="material-symbols-outlined text-primary text-sm">image</span>
                    <span class="text-xs font-medium">Image uploaded</span>
                    <button onclick="app.removeImage()" class="ml-2 text-gray-400 hover:text-red-500">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            `;
        }

        previewContainer.innerHTML = previewHTML;
    },

    removeAudio() {
        this.recordedAudioData = null;
        this.updateMultimodalPreview();
        this.showToast('Audio removed', 'info');
    },

    removeImage() {
        this.uploadedImageData = null;
        document.getElementById('ai-image-input').value = '';
        this.updateMultimodalPreview();
        this.showToast('Image removed', 'info');
    },

    isProduction() {
        const { hostname, protocol } = window.location;
        if (protocol === 'file:') return false;
        const localHosts = ['localhost', '127.0.0.1', '[::1]'];
        return Boolean(hostname) && !localHosts.includes(hostname);
    },

    registerSupabaseWarnings() {
        window.addEventListener('supabase:missing-config', (event) => {
            const message = event.detail?.message || 'Supabase configuration missing.';
            this.showToast(message, 'error');
            if (this.isProduction()) {
                this.showSupabaseWarningBanner(message);
            }
        });

        window.addEventListener('supabase:init-failed', () => {
            const message = 'Supabase failed to initialize. Using offline storage.';
            this.showToast(message, 'error');
            if (this.isProduction()) {
                this.showSupabaseWarningBanner(message);
            }
        });
    },

    maybeShowSupabaseWarning() {
        if (!this.isProduction()) return;
        if (SupabaseService.initialized) return;

        const message = SupabaseService.missingConfig?.message
            || 'Supabase is unavailable. Using offline storage.';

        this.showSupabaseWarningBanner(message);
    },

    showSupabaseWarningBanner(message) {
        const appContainer = document.getElementById('app');
        if (!appContainer) return;

        let banner = document.getElementById('supabase-warning-banner');
        if (banner) {
            const messageNode = banner.querySelector('[data-banner-message]');
            if (messageNode) messageNode.textContent = message;
            return;
        }

        banner = document.createElement('div');
        banner.id = 'supabase-warning-banner';
        banner.className = 'sticky top-0 z-[60] w-full px-4 pt-4';
        banner.innerHTML = `
            <div class="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-100/90 px-4 py-3 text-amber-950 shadow-lg dark:border-amber-200/20 dark:bg-amber-500/10 dark:text-amber-100">
                <span class="material-symbols-outlined text-base">warning</span>
                <div class="flex-1 text-sm">
                    <p class="font-semibold">Supabase unavailable</p>
                    <p class="text-xs text-amber-900/80 dark:text-amber-100/80" data-banner-message>${message}</p>
                </div>
                <button type="button" class="text-amber-900/70 hover:text-amber-900 dark:text-amber-100/80 dark:hover:text-amber-100" onclick="document.getElementById('supabase-warning-banner')?.remove()">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        `;

        appContainer.prepend(banner);
    },

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');

        const colors = {
            success: 'bg-primary text-background-dark',
            error: 'bg-red-500 text-white',
            info: 'bg-surface-dark text-white border border-white/10'
        };

        const icons = {
            success: 'check_circle',
            error: 'error',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${colors[type]} animate-in fade-in slide-in-from-top-4 duration-300`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-xl">${icons[type]}</span>
            <span class="font-medium text-sm">${message}</span>
        `;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-[-10px]');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Placeholder collection card for AI generation
    showPlaceholderCollection(id, topic, emoji = '✨') {
        // Only add placeholder if we're on collections screen
        if (this.currentScreen === 'collections') {
            CollectionsScreen.addPlaceholder(id, topic, emoji);
        }
    },

    updatePlaceholderCollectionMessage(id, message) {
        if (this.currentScreen === 'collections') {
            CollectionsScreen.updatePlaceholderMessage(id, message);
        }
    },

    removePlaceholderCollection(id) {
        // Remove placeholder from collections screen
        if (this.currentScreen === 'collections') {
            CollectionsScreen.removePlaceholder(id);
        }
    },

    // Debug Console (for mobile debugging)
    debugLogs: [],
    maxDebugLogs: 100,

    addDebugLog(message, type = 'log') {
        const timestamp = new Date().toLocaleTimeString();
        this.debugLogs.push({ message, type, timestamp });

        // Keep only last 100 logs
        if (this.debugLogs.length > this.maxDebugLogs) {
            this.debugLogs.shift();
        }

        // Update UI if console is open
        const debugOutput = document.getElementById('debug-output');
        if (debugOutput && !document.getElementById('debug-console').classList.contains('hidden')) {
            this.renderDebugConsole();
        }
    },

    renderDebugConsole() {
        const debugOutput = document.getElementById('debug-output');
        if (!debugOutput) return;

        debugOutput.innerHTML = this.debugLogs.map(log => {
            const colors = {
                log: 'text-slate-300',
                warn: 'text-yellow-400',
                error: 'text-red-400',
                info: 'text-blue-400'
            };

            return `
                <div class="${colors[log.type] || 'text-slate-300'}">
                    <span class="text-slate-500">[${log.timestamp}]</span> ${log.message}
                </div>
            `;
        }).join('');

        // Auto-scroll to bottom
        debugOutput.scrollTop = debugOutput.scrollHeight;
    },

    toggleDebugConsole() {
        const console = document.getElementById('debug-console');
        console.classList.toggle('hidden');

        if (!console.classList.contains('hidden')) {
            this.renderDebugConsole();
        }
    },

    clearDebugConsole() {
        this.debugLogs = [];
        this.renderDebugConsole();
    },

    copyDebugLogs() {
        const logsText = this.debugLogs.map(log =>
            `[${log.timestamp}] ${log.message}`
        ).join('\n');

        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(logsText).then(() => {
                app.showToast('Logs copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.fallbackCopyDebugLogs(logsText);
            });
        } else {
            this.fallbackCopyDebugLogs(logsText);
        }
    },

    fallbackCopyDebugLogs(text) {
        // Fallback for browsers without clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            app.showToast('Logs copied!', 'success');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            app.showToast('Could not copy. Please select all and copy manually.', 'error');
        }
        document.body.removeChild(textarea);
    }
};

// Override console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    if (window.app) {
        app.addDebugLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'log');
    }
};

console.error = function(...args) {
    originalConsoleError.apply(console, args);
    if (window.app) {
        app.addDebugLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'error');
    }
};

console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    if (window.app) {
        app.addDebugLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'warn');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Export for global access
window.app = app;
