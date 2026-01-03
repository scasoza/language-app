/**
 * Add New Word/Flashcard Screen Component
 * Supports multimodal input: text, image, or audio
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
    presetCollectionId: null,
    inputMode: 'text', // 'text', 'image', 'audio'
    isRecording: false,
    mediaRecorder: null,
    audioChunks: [],

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
            <main class="flex-1 w-full max-w-md mx-auto p-4 flex flex-col gap-5 overflow-y-auto pb-8">
                <!-- Input Mode Tabs -->
                <section class="flex gap-2 p-1 bg-gray-100 dark:bg-surface-dark rounded-xl">
                    <button onclick="AddWordScreen.setInputMode('text')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${this.inputMode === 'text' ? 'bg-white dark:bg-accent-gray text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
                        <span class="material-symbols-outlined text-lg ${this.inputMode === 'text' ? 'text-primary' : ''}">edit</span>
                        Type
                    </button>
                    <button onclick="AddWordScreen.setInputMode('image')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${this.inputMode === 'image' ? 'bg-white dark:bg-accent-gray text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
                        <span class="material-symbols-outlined text-lg ${this.inputMode === 'image' ? 'text-primary' : ''}">photo_camera</span>
                        Photo
                    </button>
                    <button onclick="AddWordScreen.setInputMode('audio')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${this.inputMode === 'audio' ? 'bg-white dark:bg-accent-gray text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
                        <span class="material-symbols-outlined text-lg ${this.inputMode === 'audio' ? 'text-primary' : ''}">mic</span>
                        Audio
                    </button>
                </section>

                ${this.renderInputSection(user)}

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

                <!-- Generated Content Preview (when using image/audio) -->
                ${(this.inputMode !== 'text' && this.formData.front) ? `
                    <section class="bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                            <span class="text-xs font-bold uppercase tracking-wider text-primary">AI Generated</span>
                        </div>
                        <p class="text-2xl font-bold">${this.formData.front}</p>
                        ${this.formData.back ? `<p class="text-gray-500 dark:text-gray-400 mt-1">${this.formData.back}</p>` : ''}
                    </section>
                ` : ''}

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

                <!-- Media Preview (collapsed in text mode) -->
                ${this.inputMode === 'text' ? `
                    <section class="grid grid-cols-2 gap-3">
                        <!-- Audio Card -->
                        <button onclick="AddWordScreen.generateAudio()" class="relative flex flex-col items-center justify-center gap-2 h-24 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:bg-surface-light dark:hover:bg-surface-dark hover:border-primary transition-all group overflow-hidden">
                            <div class="h-8 w-8 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <span class="material-symbols-outlined text-primary text-lg">${this.formData.audio ? 'graphic_eq' : 'volume_up'}</span>
                            </div>
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">${this.formData.audio ? 'Audio Ready' : 'Generate Audio'}</span>
                        </button>

                        <!-- Image Card -->
                        <button onclick="AddWordScreen.addImage()" class="relative flex flex-col items-center justify-center gap-2 h-24 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:bg-surface-light dark:hover:bg-surface-dark hover:border-primary transition-all group overflow-hidden">
                            ${this.formData.image ? `
                                <img src="${this.formData.image}" class="absolute inset-0 w-full h-full object-cover opacity-50" />
                                <div class="absolute inset-0 bg-black/40"></div>
                                <span class="relative material-symbols-outlined text-white text-xl">check_circle</span>
                                <span class="relative text-xs font-medium text-white">Image Added</span>
                            ` : `
                                <div class="h-8 w-8 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <span class="material-symbols-outlined text-primary text-lg">add_a_photo</span>
                                </div>
                                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Add Photo</span>
                            `}
                        </button>
                    </section>
                ` : ''}

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

                <!-- AI Generate Button (only in text mode) -->
                ${this.inputMode === 'text' ? `
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
                ` : ''}
            </main>
        `;
    },

    renderInputSection(user) {
        switch (this.inputMode) {
            case 'text':
                return `
                    <!-- Text Input -->
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
                `;

            case 'image':
                return `
                    <!-- Image Input -->
                    <section class="flex flex-col gap-4">
                        ${this.formData.image ? `
                            <div class="relative rounded-2xl overflow-hidden">
                                <img src="${this.formData.image}" class="w-full h-48 object-cover" />
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <button onclick="AddWordScreen.clearImage()" class="absolute top-2 right-2 size-8 rounded-full bg-black/50 flex items-center justify-center text-white">
                                    <span class="material-symbols-outlined text-lg">close</span>
                                </button>
                                <button onclick="AddWordScreen.generateFromImage()" class="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-background-dark font-bold shadow-lg ${this.isLoading ? 'opacity-50' : ''}">
                                    ${this.isLoading ? '<div class="spinner"></div>' : '<span class="material-symbols-outlined">auto_awesome</span>'}
                                    ${this.isLoading ? 'Analyzing...' : 'Generate Vocabulary from Photo'}
                                </button>
                            </div>
                        ` : `
                            <button onclick="AddWordScreen.captureImage()" class="flex flex-col items-center justify-center gap-4 h-48 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-primary bg-gray-50 dark:bg-surface-dark transition-all">
                                <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-4xl text-primary">photo_camera</span>
                                </div>
                                <div class="text-center">
                                    <p class="font-bold text-gray-700 dark:text-gray-300">Take or Upload Photo</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">AI will identify vocabulary</p>
                                </div>
                            </button>
                        `}
                        <p class="text-xs text-center text-gray-400">
                            Take a photo of text, objects, or signs and AI will generate vocabulary cards
                        </p>
                    </section>
                `;

            case 'audio':
                return `
                    <!-- Audio Input -->
                    <section class="flex flex-col gap-4">
                        <div class="flex flex-col items-center justify-center gap-4 py-8 rounded-2xl border-2 border-dashed ${this.isRecording ? 'border-red-500 bg-red-500/5' : 'border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-surface-dark'}">
                            <button onclick="AddWordScreen.toggleRecording()" class="size-20 rounded-full ${this.isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'} flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95">
                                <span class="material-symbols-outlined text-4xl ${this.isRecording ? 'text-white' : 'text-background-dark'}">${this.isRecording ? 'stop' : 'mic'}</span>
                            </button>
                            <div class="text-center">
                                <p class="font-bold text-gray-700 dark:text-gray-300">
                                    ${this.isRecording ? 'Recording... Tap to stop' : 'Tap to Record'}
                                </p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    ${this.isRecording ? 'Speak clearly in your target language' : 'Say a word or phrase to learn'}
                                </p>
                            </div>
                            ${this.formData.audio ? `
                                <div class="flex items-center gap-3 mt-2 px-4 py-2 bg-surface-dark rounded-full">
                                    <button onclick="AddWordScreen.playRecordedAudio()" class="size-8 rounded-full bg-primary flex items-center justify-center">
                                        <span class="material-symbols-outlined text-background-dark text-lg">play_arrow</span>
                                    </button>
                                    <span class="text-sm text-gray-400">Audio recorded</span>
                                    <button onclick="AddWordScreen.clearAudio()" class="text-gray-400 hover:text-white">
                                        <span class="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        ${this.formData.audio && !this.formData.front ? `
                            <button onclick="AddWordScreen.transcribeAudio()" class="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-background-dark font-bold shadow-lg ${this.isLoading ? 'opacity-50' : ''}">
                                ${this.isLoading ? '<div class="spinner"></div>' : '<span class="material-symbols-outlined">auto_awesome</span>'}
                                ${this.isLoading ? 'Transcribing...' : 'Transcribe & Generate Card'}
                            </button>
                        ` : ''}
                        <p class="text-xs text-center text-gray-400">
                            Record a word or phrase and AI will transcribe and generate a flashcard
                        </p>
                    </section>
                `;
        }
    },

    setInputMode(mode) {
        this.inputMode = mode;
        this.suggestions = [];
        this.render();
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
            const flexContainer = container.querySelector('.flex');
            if (flexContainer) {
                flexContainer.innerHTML = this.suggestions.map(s => `
                    <button onclick="AddWordScreen.applySuggestion('${s.type}')" class="flex items-center gap-2 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-full px-4 py-2 hover:border-primary/50 transition-all whitespace-nowrap group">
                        <span class="material-symbols-outlined text-sm text-primary">${s.icon}</span>
                        <span class="text-sm font-medium">${s.label}</span>
                    </button>
                `).join('');
            }
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

    // Image Mode Methods
    captureImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Prefer rear camera on mobile
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

    clearImage() {
        this.formData.image = null;
        this.render();
    },

    async generateFromImage() {
        if (!this.formData.image) {
            app.showToast('Please add an image first', 'error');
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
                text: 'Identify the main subject or text in this image and create vocabulary',
                image: this.formData.image,
                targetLanguage: user.targetLanguage,
                nativeLanguage: user.nativeLanguage,
                count: 1
            });

            if (cards && cards.length > 0) {
                const card = cards[0];
                this.formData.front = card.front || '';
                this.formData.back = card.back || '';
                this.formData.reading = card.reading || '';
                this.formData.example = card.example || '';
                this.formData.exampleTranslation = card.exampleTranslation || '';
                app.showToast('Vocabulary generated from image!', 'success');
            }
        } catch (error) {
            app.showToast(error.message, 'error');
        } finally {
            this.isLoading = false;
            this.render();
        }
    },

    // Audio Mode Methods
    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    },

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = () => {
                    this.formData.audio = reader.result;
                    this.render();
                };
                reader.readAsDataURL(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.render();
        } catch (error) {
            app.showToast('Could not access microphone', 'error');
        }
    },

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    },

    playRecordedAudio() {
        if (this.formData.audio) {
            const audio = new Audio(this.formData.audio);
            audio.play();
        }
    },

    clearAudio() {
        this.formData.audio = null;
        this.render();
    },

    async transcribeAudio() {
        if (!this.formData.audio) {
            app.showToast('Please record audio first', 'error');
            return;
        }

        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        this.isLoading = true;
        this.render();

        try {
            // For now, show a placeholder - full transcription would require Whisper or similar
            // We'll use the text-based AI to generate a card
            app.showToast('Audio transcription coming soon! For now, type the word.', 'info');
            this.inputMode = 'text';
        } catch (error) {
            app.showToast(error.message, 'error');
        } finally {
            this.isLoading = false;
            this.render();
        }
    },

    // Text Mode Methods
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

    addImage() {
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

            // Reset form but keep collection selected
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
        this.inputMode = 'text';
        this.isRecording = false;
    }
};

window.AddWordScreen = AddWordScreen;
