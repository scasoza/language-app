/**
 * Main Application Controller for LinguaFlow
 */

const app = {
    currentScreen: null,
    history: [],
    screensWithNav: ['home', 'collections', 'dialogue-settings', 'settings'],

    init() {
        // Check if onboarded
        if (DataStore.isOnboarded()) {
            this.navigate('home');
        } else {
            this.navigate('onboarding');
        }

        // Apply dark mode from settings
        const user = DataStore.getUser();
        document.documentElement.classList.toggle('dark', user.settings.darkMode);
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
            this.startStudySession(id);
        }
    },

    editCollection(id) {
        app.showToast('Edit feature coming soon!', 'info');
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
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Collection Name</label>
                    <input type="text" id="collection-name" placeholder="e.g., Spanish Verbs" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                </div>

                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Emoji</label>
                    <input type="text" id="collection-emoji" placeholder="🇪🇸" maxlength="2" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                </div>

                <div class="pt-2">
                    <p class="text-sm text-gray-400 mb-3">Or generate with AI:</p>
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

    async createCollection(withAI = false) {
        const nameInput = document.getElementById('collection-name');
        const emojiInput = document.getElementById('collection-emoji');
        const topicInput = document.getElementById('collection-topic');

        const name = nameInput?.value?.trim();
        const emoji = emojiInput?.value?.trim() || '📚';
        const topic = topicInput?.value?.trim();

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

            this.showToast('Generating collection with AI...', 'info');

            try {
                const user = DataStore.getUser();
                const result = await GeminiService.generateCollection({
                    topic,
                    targetLanguage: user.targetLanguage,
                    nativeLanguage: user.nativeLanguage,
                    cardCount: 10
                });

                // Create collection
                const collection = DataStore.addCollection({
                    name: result.name || topic,
                    emoji: result.emoji || emoji,
                    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACoj-K0BPLOsYgV7-kqnQ3Kc8RBHW-0dcMMAhvSRkQ9ZzBFf2E0zVC4OppgQuRCDoEe8wgyID-EmbYHgtToi4z5vB-Z4s4LmS--R63bk6jkHtSTeQ04kp2YZKiH_2m2Tx4Ae2ZXZf2p5b05vQ_762DRKbKFh2-ZmJEXgv8Mq3JqZ7NSczx15tr9mhlZ0bWsI3m9EvNSXPFpnE2rBr17lGdGDW_cR4acoKubrJmny_uToJsfMlRaXOmoPCpNoM52buN0LRFwWNki6yU'
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

                this.closeModal();
                this.showToast(`Created "${result.name}" with ${result.cards?.length || 0} cards!`, 'success');

                // Refresh screen
                if (this.currentScreen === 'collections') {
                    CollectionsScreen.render();
                } else if (this.currentScreen === 'home') {
                    HomeScreen.render();
                }
            } catch (error) {
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
