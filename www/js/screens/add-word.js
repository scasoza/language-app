/**
 * Add New Word/Flashcard Screen Component
 */

const AddWordScreen = {
    formData: {
        front: '',
        back: '',
        reading: '',
        example: '',
        exampleTranslation: '',
        collectionId: null,
        image: null,
        audio: null
    },
    isLoading: false,
    suggestions: [],
    presetCollectionId: null, // Set this before navigating to pre-select a collection

    render() {
        const user = DataStore.getUser();
        const collections = DataStore.getCollections();

        // Apply preset collection if set
        if (this.presetCollectionId && !this.formData.collectionId) {
            this.formData.collectionId = this.presetCollectionId;
        }

        const container = document.getElementById('screen-add-word');
        container.innerHTML = `
            <!-- Header -->
            <header class="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
                <button onclick="app.goBack()" class="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                    <span class="material-symbols-outlined text-2xl text-slate-600 dark:text-gray-300">close</span>
                </button>
                <h1 class="text-lg font-bold tracking-tight">New Flashcard</h1>
                <button onclick="AddWordScreen.save()" class="bg-primary hover:bg-primary/90 text-background-dark px-4 py-1.5 rounded-full text-sm font-bold transition-colors shadow-[0_0_15px_rgba(13,242,128,0.3)] disabled:opacity-50" ${this.isLoading ? 'disabled' : ''}>
                    ${this.isLoading ? '<div class="spinner mx-2"></div>' : 'Save'}
                </button>
            </header>

            <!-- Main Content -->
            <main class="flex-1 w-full max-w-md mx-auto p-4 flex flex-col gap-6 overflow-y-auto pb-8">
                <!-- Primary Input Area -->
                <section class="flex flex-col gap-2">
                    <div class="relative group">
                        <input
                            id="word-input"
                            type="text"
                            autofocus
                            placeholder="Type a word..."
                            value="${this.formData.front}"
                            oninput="AddWordScreen.handleWordInput(this.value)"
                            class="w-full bg-transparent border-none text-4xl font-bold placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-0 px-0 py-2 caret-primary"
                        />
                        <div class="h-0.5 w-full bg-gray-200 dark:bg-white/10 group-focus-within:bg-primary transition-colors duration-300 rounded-full"></div>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        ${user.targetLanguage}
                        <span class="material-symbols-outlined align-middle text-sm mx-1">arrow_forward</span>
                        ${user.nativeLanguage}
                    </p>
                </section>

                <!-- Smart Suggestions (Chips) -->
                <section id="suggestions-container" class="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide ${this.suggestions.length === 0 ? 'hidden' : ''}">
                    <div class="flex gap-2">
                        ${this.suggestions.map(s => `
                            <button onclick="AddWordScreen.applySuggestion('${s.type}')" class="flex items-center gap-2 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-full px-4 py-2 hover:border-primary/50 transition-all whitespace-nowrap group">
                                <span class="material-symbols-outlined text-sm text-primary">${s.icon}</span>
                                <span class="text-sm font-medium">${s.label}</span>
                            </button>
                        `).join('')}
                    </div>
                </section>

                <!-- Translation Input -->
                <section class="flex flex-col gap-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-primary">Translation</label>
                    <input
                        id="translation-input"
                        type="text"
                        placeholder="Enter translation..."
                        value="${this.formData.back}"
                        oninput="AddWordScreen.updateField('back', this.value)"
                        class="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </section>

                <!-- Reading/Pronunciation -->
                <section class="flex flex-col gap-2">
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Pronunciation</label>
                    <input
                        type="text"
                        placeholder="Phonetic reading..."
                        value="${this.formData.reading}"
                        oninput="AddWordScreen.updateField('reading', this.value)"
                        class="w-full bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </section>

                <!-- Media Grid -->
                <section class="grid grid-cols-2 gap-3">
                    <!-- Audio Card -->
                    <button onclick="AddWordScreen.recordAudio()" class="relative flex flex-col items-center justify-center gap-2 h-32 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:bg-surface-light dark:hover:bg-surface-dark hover:border-primary transition-all group overflow-hidden">
                        <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="h-10 w-10 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <span class="material-symbols-outlined text-primary text-xl">${this.formData.audio ? 'graphic_eq' : 'mic'}</span>
                        </div>
                        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">${this.formData.audio ? 'Audio Added' : 'Record Audio'}</span>
                    </button>

                    <!-- Image Card -->
                    <button onclick="AddWordScreen.addImage()" class="relative flex flex-col items-center justify-center gap-2 h-32 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:bg-surface-light dark:hover:bg-surface-dark hover:border-primary transition-all group overflow-hidden">
                        ${this.formData.image ? `
                            <img src="${this.formData.image}" class="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <div class="absolute inset-0 bg-black/40"></div>
                            <span class="relative material-symbols-outlined text-white text-2xl">check_circle</span>
                            <span class="relative text-xs font-medium text-white">Image Added</span>
                        ` : `
                            <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div class="h-10 w-10 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <span class="material-symbols-outlined text-primary text-xl">add_a_photo</span>
                            </div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Add Photo</span>
                        `}
                    </button>
                </section>

                <!-- Example Sentence -->
                <section>
                    <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5">
                        <div class="flex items-center gap-2 mb-2 text-primary">
                            <span class="material-symbols-outlined text-sm">edit_note</span>
                            <label class="text-xs font-bold uppercase tracking-wider">Example Sentence</label>
                        </div>
                        <textarea
                            placeholder="Add an example sentence..."
                            rows="2"
                            oninput="AddWordScreen.updateField('example', this.value)"
                            class="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none leading-relaxed"
                        >${this.formData.example}</textarea>
                        <textarea
                            placeholder="Translation of example..."
                            rows="2"
                            oninput="AddWordScreen.updateField('exampleTranslation', this.value)"
                            class="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none leading-relaxed mt-2 pt-2 border-t border-gray-100 dark:border-white/5"
                        >${this.formData.exampleTranslation}</textarea>
                    </div>
                </section>

                <!-- Collection Selection -->
                <section>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Add to Collection</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${collections.map(col => `
                            <button
                                onclick="AddWordScreen.selectCollection('${col.id}')"
                                class="flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${this.formData.collectionId === col.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-gray-200 dark:border-white/10 hover:border-primary/50'}"
                            >
                                <span class="text-xl">${col.emoji}</span>
                                <span class="text-sm font-medium truncate">${col.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </section>

                <!-- AI Generate Button -->
                <section class="mt-auto pt-4">
                    <button onclick="AddWordScreen.generateWithAI()" class="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg hover:scale-[1.02] transition-transform active:scale-[0.98] group ${this.isLoading ? 'opacity-50 pointer-events-none' : ''}">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 h-8 w-8 rounded-lg flex items-center justify-center">
                                <span class="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div class="flex flex-col items-start">
                                <span class="text-sm font-bold">Auto-fill with AI</span>
                                <span class="text-xs text-white/70">Generate translation & examples</span>
                            </div>
                        </div>
                        <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </section>
            </main>
        `;
    },

    handleWordInput(value) {
        this.formData.front = value;

        // Generate suggestions based on input
        if (value.length >= 2) {
            this.suggestions = [
                { type: 'translate', icon: 'translate', label: `Translate: ${value}` },
                { type: 'audio', icon: 'volume_up', label: 'Auto-Audio' }
            ];
        } else {
            this.suggestions = [];
        }

        // Re-render suggestions only
        const container = document.getElementById('suggestions-container');
        if (container) {
            container.classList.toggle('hidden', this.suggestions.length === 0);
            container.querySelector('.flex').innerHTML = this.suggestions.map(s => `
                <button onclick="AddWordScreen.applySuggestion('${s.type}')" class="flex items-center gap-2 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-full px-4 py-2 hover:border-primary/50 transition-all whitespace-nowrap group">
                    <span class="material-symbols-outlined text-sm text-primary">${s.icon}</span>
                    <span class="text-sm font-medium">${s.label}</span>
                </button>
            `).join('');
        }
    },

    updateField(field, value) {
        this.formData[field] = value;
    },

    selectCollection(id) {
        this.formData.collectionId = id;
        this.render();
    },

    async applySuggestion(type) {
        if (type === 'translate') {
            await this.generateWithAI();
        } else if (type === 'audio') {
            await this.generateAudio();
        }
    },

    async generateWithAI() {
        if (!this.formData.front) {
            app.showToast('Please enter a word first', 'error');
            return;
        }

        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        this.isLoading = true;
        this.render();

        try {
            const user = DataStore.getUser();
            const cards = await GeminiService.generateFlashcards({
                text: this.formData.front,
                targetLanguage: user.targetLanguage,
                nativeLanguage: user.nativeLanguage,
                count: 1
            });

            if (cards && cards.length > 0) {
                const card = cards[0];
                this.formData.back = card.back || '';
                this.formData.reading = card.reading || '';
                this.formData.example = card.example || '';
                this.formData.exampleTranslation = card.exampleTranslation || '';
                app.showToast('Generated with AI!', 'success');
            }
        } catch (error) {
            app.showToast(error.message, 'error');
        } finally {
            this.isLoading = false;
            this.render();
        }
    },

    async generateAudio() {
        if (!this.formData.front) {
            app.showToast('Please enter a word first', 'error');
            return;
        }

        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        this.isLoading = true;
        this.render();

        try {
            const audio = await GeminiService.generateTTS(this.formData.front);
            if (audio) {
                this.formData.audio = audio;
                app.showToast('Audio generated!', 'success');

                // Play preview
                const audioEl = new Audio(audio);
                audioEl.play();
            }
        } catch (error) {
            app.showToast(error.message, 'error');
        } finally {
            this.isLoading = false;
            this.render();
        }
    },

    recordAudio() {
        // For now, use TTS generation
        this.generateAudio();
    },

    addImage() {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.formData.image = e.target.result;
                    this.render();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    async save() {
        if (!this.formData.front || !this.formData.back) {
            app.showToast('Please enter word and translation', 'error');
            return;
        }

        if (!this.formData.collectionId) {
            app.showToast('Please select a collection', 'error');
            return;
        }

        this.isLoading = true;
        this.render();

        try {
            const card = DataStore.addCard({
                ...this.formData
            });

            app.showToast('Flashcard saved!', 'success');

            // Reset form
            this.formData = {
                front: '',
                back: '',
                reading: '',
                example: '',
                exampleTranslation: '',
                collectionId: this.formData.collectionId,
                image: null,
                audio: null
            };
            this.suggestions = [];

            this.render();
        } catch (error) {
            app.showToast(error.message, 'error');
        } finally {
            this.isLoading = false;
        }
    },

    reset() {
        this.formData = {
            front: '',
            back: '',
            reading: '',
            example: '',
            exampleTranslation: '',
            collectionId: null,
            image: null,
            audio: null
        };
        this.suggestions = [];
        this.isLoading = false;
        this.presetCollectionId = null;
    }
};

window.AddWordScreen = AddWordScreen;
