/**
 * Main Application Controller for LinguaFlow
 */

const app = {
    currentScreen: null,
    history: [],
    screensWithNav: ['home', 'collections', 'dialogue-settings', 'settings'],
    isInitialized: false,

    async init() {
        // Show loading screen
        this.showLoadingScreen();

        try {
            // Initialize data store (handles Supabase init)
            await DataStore.init();

            if (!DataStore.isOnboarded()) {
                // Show onboarding
                this.hideLoadingScreen();
                this.navigate('onboarding');
            } else {
                // Go to home
                this.hideLoadingScreen();
                this.navigate('home');
            }

            // Apply dark mode from settings
            const user = DataStore.getUserSync();
            document.documentElement.classList.toggle('dark', user?.settings?.darkMode ?? true);

            this.isInitialized = true;
        } catch (error) {
            console.error('App init failed:', error);
            this.hideLoadingScreen();
            // Fallback to localStorage mode
            DataStore.useSupabase = false;
            if (!DataStore.isOnboarded()) {
                this.navigate('onboarding');
            } else {
                this.navigate('home');
            }
        }
    },

    showLoadingScreen() {
        const appEl = document.getElementById('app');
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.className = 'fixed inset-0 z-[999] bg-background-dark flex flex-col items-center justify-center';
        loader.innerHTML = `
            <div class="size-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
                <span class="text-5xl">🌍</span>
            </div>
            <div class="spinner"></div>
        `;
        appEl.appendChild(loader);
    },

    hideLoadingScreen() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => loader.remove(), 300);
        }
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
        const collection = DataStore.getCollection(id);
        if (collection) {
            CollectionDetailScreen.setCollection(id);
            this.navigate('collection-detail');
        }
    },

    editCollection(id) {
        CollectionDetailScreen.setCollection(id);
        this.navigate('collection-detail');
    },

    // Collection cover image options
    collectionImages: [
        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop', // Books
        'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=300&fit=crop', // Study
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop', // Tech
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', // Food
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop', // Travel
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', // Restaurant
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // People
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Portrait
    ],
    selectedCollectionImage: null,
    customCollectionImage: null,

    showCreateCollectionModal() {
        this.selectedCollectionImage = this.collectionImages[0];
        this.customCollectionImage = null;

        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Create Collection</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-4">
                <!-- Cover Image Selection -->
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Cover Image</label>
                    <div id="collection-image-grid" class="grid grid-cols-4 gap-2 mb-2">
                        ${this.collectionImages.map((img, i) => `
                            <button onclick="app.selectCollectionImage('${img}')" class="aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-primary' : 'border-transparent'} hover:border-primary/50 transition-all">
                                <img src="${img}" class="w-full h-full object-cover" />
                            </button>
                        `).join('')}
                    </div>
                    <button onclick="app.uploadCollectionImage()" class="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-300 dark:border-white/20 hover:border-primary text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        <span class="material-symbols-outlined text-lg">add_photo_alternate</span>
                        Upload Custom Image
                    </button>
                    <div id="custom-image-preview" class="hidden mt-2 relative">
                        <img id="custom-image-img" class="w-full h-24 object-cover rounded-lg" />
                        <button onclick="app.removeCustomImage()" class="absolute top-1 right-1 size-6 rounded-full bg-black/50 flex items-center justify-center text-white">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <div class="col-span-2">
                        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Name</label>
                        <input type="text" id="collection-name" placeholder="e.g., Spanish Verbs" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                    </div>
                    <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Emoji</label>
                        <input type="text" id="collection-emoji" placeholder="🇪🇸" maxlength="2" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 text-center text-xl" />
                    </div>
                </div>

                <div>
                    <p class="text-xs text-gray-400 mb-2">Or generate with AI:</p>
                    <div>
                        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Topic</label>
                        <input type="text" id="collection-topic" placeholder="e.g., Food vocabulary, Travel phrases" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                    </div>
                </div>

                <div class="flex gap-3 pt-2">
                    <button onclick="app.createCollection(false)" class="flex-1 bg-surface-dark border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5 transition-colors">
                        Create Empty
                    </button>
                    <button onclick="app.createCollection(true)" class="flex-1 bg-primary text-background-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-xl">auto_awesome</span>
                        Generate
                    </button>
                </div>
            </div>
        `);
    },

    selectCollectionImage(url) {
        this.selectedCollectionImage = url;
        this.customCollectionImage = null;

        // Update UI
        const grid = document.getElementById('collection-image-grid');
        if (grid) {
            grid.querySelectorAll('button').forEach(btn => {
                const img = btn.querySelector('img');
                if (img && img.src === url) {
                    btn.classList.add('border-primary');
                    btn.classList.remove('border-transparent');
                } else {
                    btn.classList.remove('border-primary');
                    btn.classList.add('border-transparent');
                }
            });
        }

        // Hide custom preview
        const preview = document.getElementById('custom-image-preview');
        if (preview) preview.classList.add('hidden');
    },

    uploadCollectionImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.customCollectionImage = e.target.result;
                    this.selectedCollectionImage = null;

                    // Show custom preview
                    const preview = document.getElementById('custom-image-preview');
                    const img = document.getElementById('custom-image-img');
                    if (preview && img) {
                        img.src = e.target.result;
                        preview.classList.remove('hidden');
                    }

                    // Deselect grid images
                    const grid = document.getElementById('collection-image-grid');
                    if (grid) {
                        grid.querySelectorAll('button').forEach(btn => {
                            btn.classList.remove('border-primary');
                            btn.classList.add('border-transparent');
                        });
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    removeCustomImage() {
        this.customCollectionImage = null;
        this.selectedCollectionImage = this.collectionImages[0];

        const preview = document.getElementById('custom-image-preview');
        if (preview) preview.classList.add('hidden');

        // Reselect first image
        this.selectCollectionImage(this.collectionImages[0]);
    },

    async createCollection(withAI = false) {
        const nameInput = document.getElementById('collection-name');
        const emojiInput = document.getElementById('collection-emoji');
        const topicInput = document.getElementById('collection-topic');

        const name = nameInput?.value?.trim();
        const emoji = emojiInput?.value?.trim() || '📚';
        const topic = topicInput?.value?.trim();

        // Get selected image
        const collectionImage = this.customCollectionImage || this.selectedCollectionImage || this.collectionImages[0];

        if (withAI) {
            if (!topic) {
                this.showToast('Please enter a topic for AI generation', 'error');
                return;
            }

            if (!GeminiService.isConfigured()) {
                this.closeModal();
                this.showApiKeyModal();
                return;
            }

            this.closeModal();
            this.showLoadingOverlay('Creating your collection...', `Generating vocabulary for: ${topic}`);

            try {
                const user = DataStore.getUser();
                const result = await GeminiService.generateCollection({
                    topic,
                    targetLanguage: user.targetLanguage,
                    nativeLanguage: user.nativeLanguage,
                    cardCount: 10
                });

                // Create collection with selected image
                const collection = DataStore.addCollection({
                    name: result.name || topic,
                    emoji: result.emoji || emoji,
                    image: collectionImage
                });

                // Add cards
                if (result.cards && result.cards.length > 0) {
                    result.cards.forEach(card => {
                        DataStore.addCard({
                            ...card,
                            collectionId: collection.id
                        });
                    });
                }

                this.hideLoadingOverlay();
                this.showToast(`Created "${result.name}" with ${result.cards?.length || 0} cards!`, 'success');

                // Refresh screen
                if (this.currentScreen === 'collections') {
                    CollectionsScreen.render();
                } else if (this.currentScreen === 'home') {
                    HomeScreen.render();
                }
            } catch (error) {
                this.hideLoadingOverlay();
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
                image: collectionImage
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

    saveApiKey() {
        const input = document.getElementById('api-key-input');
        const key = input?.value?.trim();

        if (key) {
            GeminiService.setApiKey(key);
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
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Export for global access
window.app = app;
