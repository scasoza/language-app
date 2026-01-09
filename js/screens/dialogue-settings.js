/**
 * Dialogue Generator Settings Screen Component
 */

const DialogueSettingsScreen = {
    settings: {
        format: 'dialogue', // dialogue or monologue
        scenario: 'ordering-food',
        vocabulary: ['restaurant', 'coffee'],
        complexity: 3, // 1-5
        length: 'medium' // short, medium, long
    },
    isGenerating: false,
    generatedDialogue: null,

    scenarios: [
        { id: 'ordering-food', icon: 'storefront', label: 'Ordering Food' },
        { id: 'business', icon: 'business_center', label: 'Business' },
        { id: 'travel', icon: 'flight', label: 'Travel' },
        { id: 'health', icon: 'medical_services', label: 'Health' },
        { id: 'shopping', icon: 'shopping_bag', label: 'Shopping' },
        { id: 'social', icon: 'group', label: 'Social' }
    ],

    vocabularyChips: [
        { id: 'restaurant', icon: 'restaurant', label: 'Restaurant' },
        { id: 'coffee', icon: 'coffee', label: 'Coffee' },
        { id: 'payment', icon: 'payments', label: 'Payment' },
        { id: 'late', icon: 'schedule', label: 'Late' },
        { id: 'directions', icon: 'directions', label: 'Directions' },
        { id: 'greeting', icon: 'waving_hand', label: 'Greetings' }
    ],

    render() {
        const container = document.getElementById('screen-dialogue-settings');
        const complexityLabel = this.getComplexityLabel();
        const lengthTurns = this.settings.length === 'short' ? '~5' : this.settings.length === 'long' ? '~15' : '~10';

        container.innerHTML = `
            <div class="relative flex min-h-screen w-full flex-col">
                <!-- Header -->
                <header class="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
                    <button onclick="app.goBack()" class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/5 transition-colors">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 class="text-base font-semibold tracking-wide uppercase opacity-80">Practice Studio</h1>
                    <button onclick="DialogueSettingsScreen.showHistory()" class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/5 transition-colors">
                        <span class="material-symbols-outlined">history</span>
                    </button>
                </header>

                <main class="flex-1 overflow-y-auto pb-12 flex flex-col">
                    <!-- Hero -->
                    <div class="px-6 py-4">
                        <h2 class="text-3xl font-bold leading-tight tracking-tight">Create your<br/><span class="text-primary drop-shadow-[0_0_15px_rgba(13,242,128,0.2)]">Practice Scene</span></h2>
                    </div>

                    <!-- Format Toggle -->
                    <div class="px-6 mb-6">
                        <div class="bg-gray-200 dark:bg-surface-dark p-1 rounded-2xl flex relative">
                            <button onclick="DialogueSettingsScreen.setFormat('dialogue')" class="flex-1 py-3 rounded-xl ${this.settings.format === 'dialogue' ? 'bg-surface-light dark:bg-accent-gray shadow-sm text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-black/5 dark:hover:bg-white/5'} text-sm flex items-center justify-center gap-2 transition-all">
                                <span class="material-symbols-outlined ${this.settings.format === 'dialogue' ? 'text-primary' : ''}">forum</span>
                                Dialogue
                            </button>
                            <button onclick="DialogueSettingsScreen.setFormat('monologue')" class="flex-1 py-3 rounded-xl ${this.settings.format === 'monologue' ? 'bg-surface-light dark:bg-accent-gray shadow-sm text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400 font-medium hover:bg-black/5 dark:hover:bg-white/5'} text-sm flex items-center justify-center gap-2 transition-all">
                                <span class="material-symbols-outlined ${this.settings.format === 'monologue' ? 'text-primary' : ''}">person</span>
                                Monologue
                            </button>
                        </div>
                    </div>

                    <!-- Scenario Selection -->
                    <section class="mb-8">
                        <div class="px-6 flex justify-between items-end mb-4">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Scenario</h3>
                            <span class="text-xs text-primary font-medium cursor-pointer hover:underline">View All</span>
                        </div>
                        <div class="flex gap-4 px-6 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
                            ${this.scenarios.map(s => `
                                <button onclick="DialogueSettingsScreen.setScenario('${s.id}')" class="snap-center shrink-0 w-40 flex flex-col gap-2 group cursor-pointer">
                                    <div class="aspect-[4/3] rounded-2xl ${this.settings.scenario === s.id
                                        ? 'bg-gradient-to-br from-surface-light to-gray-100 dark:from-surface-dark dark:to-black border-2 border-primary shadow-neon'
                                        : 'bg-surface-light dark:bg-surface-dark border-2 border-transparent hover:border-gray-300 dark:hover:border-white/10'} relative overflow-hidden transition-all group-active:scale-95">
                                        <div class="absolute inset-0 flex items-center justify-center ${this.settings.scenario === s.id ? 'text-primary' : 'text-gray-400'}">
                                            <span class="material-symbols-outlined text-4xl">${s.icon}</span>
                                        </div>
                                        ${this.settings.scenario === s.id ? '<div class="absolute bottom-2 right-2 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded">Selected</div>' : ''}
                                    </div>
                                    <p class="text-center text-sm ${this.settings.scenario === s.id ? 'font-semibold text-white' : 'font-medium text-gray-500 dark:text-gray-400'}">${s.label}</p>
                                </button>
                            `).join('')}
                        </div>
                    </section>

                    <!-- Vocabulary Selection -->
                    <section class="mb-8">
                        <div class="px-6 flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vocabulary</h3>
                            <button class="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">Edit List</button>
                        </div>
                        <div class="flex gap-3 px-6 overflow-x-auto no-scrollbar">
                            ${this.vocabularyChips.map(v => {
                                const isActive = this.settings.vocabulary.includes(v.id);
                                return `
                                    <button onclick="DialogueSettingsScreen.toggleVocabulary('${v.id}')" class="flex shrink-0 items-center justify-center gap-x-2 rounded-xl py-2.5 px-4 transition-transform active:scale-95 ${isActive
                                        ? 'bg-primary shadow-neon border border-primary text-background-dark'
                                        : 'bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400'}">
                                        <span class="material-symbols-outlined text-lg">${v.icon}</span>
                                        <span class="text-sm ${isActive ? 'font-bold' : 'font-medium'}">${v.label}</span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </section>

                    <!-- Parameters Card -->
                    <section class="px-6 mb-8 flex-1">
                        <div class="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                            <!-- Complexity Slider -->
                            <div class="mb-8">
                                <div class="flex justify-between items-end mb-4">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-gray-400">psychology</span>
                                        <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300">Complexity</h3>
                                    </div>
                                    <span class="text-primary text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">${complexityLabel}</span>
                                </div>
                                <div class="relative h-6 flex items-center">
                                    <div class="absolute w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div class="absolute h-1.5 bg-primary rounded-full" style="width: ${(this.settings.complexity / 5) * 100}%"></div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value="${this.settings.complexity}"
                                        onchange="DialogueSettingsScreen.setComplexity(this.value)"
                                        class="w-full relative z-10 cursor-pointer h-6"
                                    />
                                </div>
                                <div class="flex justify-between mt-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                    <span>Easy</span>
                                    <span>Expert</span>
                                </div>
                            </div>

                            <!-- Length Toggle -->
                            <div>
                                <div class="flex justify-between items-end mb-4">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-gray-400">straighten</span>
                                        <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300">Length</h3>
                                    </div>
                                    <span class="text-gray-500 dark:text-gray-400 text-xs font-medium">${lengthTurns} Turns</span>
                                </div>
                                <div class="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-black/20 p-1 rounded-xl">
                                    ${['short', 'medium', 'long'].map(len => `
                                        <button onclick="DialogueSettingsScreen.setLength('${len}')" class="py-2 rounded-lg text-xs ${this.settings.length === len
                                            ? 'font-bold text-background-dark bg-white dark:bg-primary shadow-sm'
                                            : 'font-semibold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5'} transition-colors capitalize">${len}</button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Generate Button -->
                    <div class="px-6 mt-auto mb-6">
                        <button onclick="DialogueSettingsScreen.generate()" class="w-full group relative overflow-hidden rounded-2xl bg-primary p-1 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_0_20px_rgba(13,242,128,0.4)] ${this.isGenerating ? 'opacity-50 pointer-events-none' : ''}">
                            <div class="relative bg-gradient-to-r from-primary to-[#0bc769] rounded-xl py-4 flex items-center justify-center gap-3 border border-white/20">
                                ${this.isGenerating
                                    ? '<div class="spinner"></div><span class="text-background-dark font-bold text-lg">Generating...</span>'
                                    : '<span class="material-symbols-outlined text-background-dark animate-pulse">auto_awesome</span><span class="text-background-dark font-bold text-lg tracking-wide">Generate Dialogue</span>'}
                            </div>
                        </button>
                    </div>
                </main>
            </div>
        `;
    },

    setFormat(format) {
        this.settings.format = format;
        this.render();
    },

    setScenario(scenario) {
        this.settings.scenario = scenario;
        this.render();
    },

    toggleVocabulary(vocab) {
        const index = this.settings.vocabulary.indexOf(vocab);
        if (index >= 0) {
            this.settings.vocabulary.splice(index, 1);
        } else {
            this.settings.vocabulary.push(vocab);
        }
        this.render();
    },

    setComplexity(value) {
        this.settings.complexity = parseInt(value);
        this.render();
    },

    setLength(length) {
        this.settings.length = length;
        this.render();
    },

    getComplexityLabel() {
        const labels = ['A1 Beginner', 'A2 Elementary', 'B1 Intermediate', 'B2 Upper-Int', 'C1 Advanced'];
        return labels[this.settings.complexity - 1] || 'B1 Intermediate';
    },

    async generate() {
        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        this.isGenerating = true;

        // Show loading overlay with fun subtitle
        const scenario = this.scenarios.find(s => s.id === this.settings.scenario);
        app.showLoadingOverlay(
            'Creating your dialogue...',
            `Setting the scene: ${scenario?.label || 'conversation'}`
        );

        try {
            const complexity = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'][this.settings.complexity - 1];

            const dialogue = await GeminiService.generateDialogue({
                scenario: scenario?.label || 'general conversation',
                vocabulary: this.settings.vocabulary,
                complexity,
                length: this.settings.length,
                targetLanguage: DataStore.getUserSync().targetLanguage,
                nativeLanguage: DataStore.getUserSync().nativeLanguage
            });

            if (dialogue) {
                this.generatedDialogue = dialogue;
                DataStore.addDialogue(dialogue);

                app.hideLoadingOverlay();

                // Navigate to practice screen
                DialoguePracticeScreen.setDialogue(dialogue);
                app.navigate('dialogue-practice');
            }
        } catch (error) {
            app.hideLoadingOverlay();
            app.showToast(error.message, 'error');
        } finally {
            this.isGenerating = false;
        }
    },

    showHistory() {
        const dialogues = DataStore.getDialogues();

        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Recent Dialogues</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            ${dialogues.length === 0
                ? '<p class="text-center text-gray-400 py-8">No dialogues generated yet</p>'
                : `<div class="space-y-3">
                    ${dialogues.slice(-10).reverse().map(d => `
                        <button onclick="DialogueSettingsScreen.loadDialogue('${d.id}')" class="w-full p-4 bg-surface-light dark:bg-[#1a2e25] rounded-xl text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                            <h4 class="font-bold">${d.title}</h4>
                            <p class="text-sm text-gray-400">${d.setting}</p>
                            <p class="text-xs text-gray-500 mt-1">${new Date(d.createdAt).toLocaleDateString()}</p>
                        </button>
                    `).join('')}
                </div>`}
        `);
    },

    loadDialogue(id) {
        const dialogues = DataStore.getDialogues();
        const dialogue = dialogues.find(d => d.id === id);
        if (dialogue) {
            app.closeModal();
            DialoguePracticeScreen.setDialogue(dialogue);
            app.navigate('dialogue-practice');
        }
    }
};

window.DialogueSettingsScreen = DialogueSettingsScreen;
