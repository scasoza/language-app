/**
 * Main Application Controller for LinguaFlow
 */

const app = {
    currentScreen: null,
    history: [],
    screensWithNav: ['home', 'collections', 'dialogue-settings', 'settings'],

    async init() {
        console.log('🚀 Initializing LinguaFlow...');

        // Initialize Supabase
        await SupabaseService.init();
        console.log('✅ Supabase initialized:', SupabaseService.initialized);

        // Initialize DataStore with Supabase backend
        await DataStore.init();

        // Load API key from user profile if it exists
        const user = DataStore.getUser();
        if (user && user.geminiApiKey) {
            console.log('📝 Loading API key from user profile');
            GeminiService.API_KEY = user.geminiApiKey;
            localStorage.setItem('gemini_api_key', user.geminiApiKey);
        } else {
            // Try to load from localStorage as fallback
            const apiKey = localStorage.getItem('gemini_api_key');
            if (apiKey) {
                console.log('📝 Loading API key from localStorage');
                GeminiService.API_KEY = apiKey;
            }
        }

        // Check if onboarded
        if (DataStore.isOnboarded()) {
            this.navigate('home');
        } else {
            this.navigate('onboarding');
        }

        // Apply dark mode from settings
        if (user) {
            document.documentElement.classList.toggle('dark', user.settings.darkMode);
        }

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
        this.collectionMedia = { image: null, audio: null };
        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Create Collection</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Collection Name</label>
                    <input type="text" id="collection-name" placeholder="e.g., Spanish Verbs" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                </div>

                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Emoji</label>
                    <input type="text" id="collection-emoji" placeholder="🇪🇸" maxlength="2" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                </div>

                <div class="pt-2 border-t border-white/10">
                    <p class="text-sm font-bold text-primary mb-3">✨ Generate with AI</p>
                    <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Describe what you want</label>
                        <textarea id="collection-topic" rows="3" placeholder="Type: 'I want to learn common Spanish phrases for ordering food at restaurants'" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 resize-none"></textarea>
                        <div class="grid grid-cols-2 gap-3 mt-3">
                            <button id="collection-image-btn" onclick="app.addCollectionImage()" class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-white/10 px-3 py-3 hover:border-primary/50 transition-colors">
                                <span id="collection-image-icon" class="material-symbols-outlined text-primary">add_a_photo</span>
                                <span id="collection-image-label" class="text-xs font-medium text-slate-500">Add Image</span>
                            </button>
                            <button id="collection-audio-btn" onclick="app.addCollectionAudio()" class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-white/10 px-3 py-3 hover:border-primary/50 transition-colors">
                                <span id="collection-audio-icon" class="material-symbols-outlined text-primary">mic</span>
                                <span id="collection-audio-label" class="text-xs font-medium text-slate-500">Add Audio</span>
                            </button>
                        </div>
                        <p class="text-xs text-slate-500 mt-2">Add text or audio (images need text or audio). Default is 10 cards unless you specify a number.</p>
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
        const { image, audio } = this.collectionMedia || {};

        if (withAI) {
            if (!topic && !audio) {
                this.showToast('Please enter text or add audio for AI generation', 'error');
                return;
            }

            if (image && !topic && !audio) {
                this.showToast('Images need text or audio context', 'error');
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
            this.showPlaceholderCollection(placeholderId, topic || name || 'AI Collection', emoji);

            try {
                const user = DataStore.getUser();
                this.showToast('Generating with AI...', 'info');

                const result = await GeminiService.generateCollection({
                    topic,
                    targetLanguage: user.targetLanguage,
                    nativeLanguage: user.nativeLanguage,
                    cardCount: 10,
                    image,
                    audio
                });

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

                this.showToast(`Created "${result.name}" with ${savedCards.length} cards!`, 'success');

                // Refresh screen
                if (this.currentScreen === 'collections') {
                    CollectionsScreen.render();
                } else if (this.currentScreen === 'home') {
                    HomeScreen.render();
                }
                this.collectionMedia = { image: null, audio: null };
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
            this.collectionMedia = { image: null, audio: null };
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
            <h2 class="text-2xl font-bold mb-2 text-center">${title}</h2>
            <p class="text-slate-400 text-center mb-8">${subtitle}</p>
            <div class="max-w-sm p-4 rounded-xl bg-surface-dark border border-white/5">
                <p class="text-sm text-slate-300 text-center italic">"${tip}"</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.remove(), 300);
        }
    },

    addCollectionImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.collectionMedia.image = event.target.result;
                    this.updateCollectionMediaUI();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    addCollectionAudio() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.collectionMedia.audio = event.target.result;
                    this.updateCollectionMediaUI();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    updateCollectionMediaUI() {
        const imageLabel = document.getElementById('collection-image-label');
        const imageIcon = document.getElementById('collection-image-icon');
        const audioLabel = document.getElementById('collection-audio-label');
        const audioIcon = document.getElementById('collection-audio-icon');

        if (imageLabel && imageIcon) {
            imageLabel.textContent = this.collectionMedia.image ? 'Image Added' : 'Add Image';
            imageIcon.textContent = this.collectionMedia.image ? 'check_circle' : 'add_a_photo';
        }

        if (audioLabel && audioIcon) {
            audioLabel.textContent = this.collectionMedia.audio ? 'Audio Added' : 'Add Audio';
            audioIcon.textContent = this.collectionMedia.audio ? 'graphic_eq' : 'mic';
        }
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

    removePlaceholderCollection(id) {
        // Remove placeholder from collections screen
        if (this.currentScreen === 'collections') {
            CollectionsScreen.removePlaceholder(id);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Export for global access
window.app = app;
