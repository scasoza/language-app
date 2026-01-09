/**
 * Dialogue Practice Interaction Screen Component
 */

const DialoguePracticeScreen = {
    dialogue: null,
    currentLineIndex: 0,
    isPlaying: false,
    audioElement: null,
    showTranslations: {},
    autoPlayEnabled: false,
    lineAudioCache: {},

    setDialogue(dialogue) {
        this.dialogue = dialogue;
        this.currentLineIndex = 0;
        this.showTranslations = {};
        this.isPlaying = false;
        this.autoPlayEnabled = false;
        this.lineAudioCache = {};
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
    },

    render() {
        const container = document.getElementById('screen-dialogue-practice');

        if (!this.dialogue) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-screen p-6 text-center">
                    <span class="material-symbols-outlined text-6xl text-gray-400 mb-4">forum</span>
                    <h2 class="text-xl font-bold mb-2">No Dialogue Loaded</h2>
                    <p class="text-gray-400 mb-6">Generate a new dialogue to practice</p>
                    <button onclick="app.navigate('dialogue-settings')" class="bg-primary text-background-dark font-bold py-3 px-6 rounded-xl">
                        Create Dialogue
                    </button>
                </div>
            `;
            return;
        }

        const { title, setting, duration, lines } = this.dialogue;
        const visibleLines = lines.slice(0, this.currentLineIndex + 3);

        container.innerHTML = `
            <div class="relative flex min-h-screen w-full flex-col">
                <!-- Header -->
                <header class="sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
                    <button onclick="app.navigate('dialogue-settings')" class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/5 transition-colors">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div class="flex flex-col items-center">
                        <h1 class="text-sm font-bold tracking-wide uppercase">Practice Mode</h1>
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Dialogue ${this.currentLineIndex + 1}/${lines.length}</span>
                    </div>
                    <button onclick="DialoguePracticeScreen.showOptions()" class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/5 transition-colors">
                        <span class="material-symbols-outlined">more_vert</span>
                    </button>
                </header>

                <main class="flex-1 overflow-y-auto pb-32">
                    <!-- Scene Header -->
                    <div class="relative w-full h-48 group overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-100 dark:from-[#1a2e25] dark:to-surface-dark flex items-center justify-center">
                            <span class="material-symbols-outlined text-6xl text-primary opacity-50 drop-shadow-lg">storefront</span>
                        </div>
                        <div class="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-transparent to-black/20"></div>
                        <div class="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-background-dark uppercase tracking-wider">${setting || 'Practice'}</span>
                                    <span class="flex items-center gap-1 text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                                        <span class="material-symbols-outlined text-[12px]">schedule</span> ${duration || 2} min
                                    </span>
                                </div>
                                <h2 class="text-2xl font-bold text-white leading-tight drop-shadow-sm">${title}</h2>
                            </div>
                            <button onclick="DialoguePracticeScreen.generateAudio()" class="size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all shadow-lg active:scale-95">
                                <span class="material-symbols-outlined">${this.isPlaying ? 'pause' : 'play_arrow'}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Dialogue Lines -->
                    <div class="px-5 py-6 space-y-8">
                        ${visibleLines.map((line, index) => this.renderLine(line, index)).join('')}

                        <!-- Upcoming line placeholder -->
                        ${this.currentLineIndex < lines.length - 1 ? `
                            <div class="flex ${lines[this.currentLineIndex + 1]?.speaker === 'A' ? 'flex-row-reverse' : ''} gap-4 opacity-40">
                                <div class="shrink-0 pt-1">
                                    <div class="size-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 font-bold text-sm">
                                        ${lines[this.currentLineIndex + 1]?.speaker === 'A' ? 'You' : '?'}
                                    </div>
                                </div>
                                <div class="flex flex-col gap-2 max-w-[85%] ${lines[this.currentLineIndex + 1]?.speaker === 'A' ? 'items-end' : ''}">
                                    <div class="h-12 w-48 bg-gray-200 dark:bg-white/5 rounded-2xl ${lines[this.currentLineIndex + 1]?.speaker === 'A' ? 'rounded-tr-sm' : 'rounded-tl-sm'}"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </main>

                <!-- Bottom Action Bar -->
                <div class="absolute bottom-0 left-0 right-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 p-4 z-50">
                    <div class="flex items-center justify-between gap-4">
                        <button onclick="DialoguePracticeScreen.showVocab()" class="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                            <div class="p-2 rounded-full hover:bg-white/5">
                                <span class="material-symbols-outlined">menu_book</span>
                            </div>
                            <span class="text-[10px] font-bold uppercase">Vocab</span>
                        </button>

                        <button onclick="DialoguePracticeScreen.nextLine()" class="flex-1 h-14 bg-primary rounded-2xl flex items-center justify-center gap-2 shadow-neon hover:shadow-neon-hover active:scale-[0.98] transition-all text-background-dark">
                            <span class="material-symbols-outlined text-[28px]">${this.currentLineIndex < lines.length - 1 ? 'arrow_forward' : 'check'}</span>
                            <span class="font-bold text-lg">${this.currentLineIndex < lines.length - 1 ? 'Next' : 'Complete'}</span>
                        </button>

                        <button onclick="DialoguePracticeScreen.toggleAuto()" class="flex flex-col items-center gap-1 ${this.autoPlayEnabled ? 'text-primary' : 'text-gray-400 hover:text-primary'} transition-colors">
                            <div class="p-2 rounded-full hover:bg-white/5 ${this.autoPlayEnabled ? 'bg-primary/10 ring-1 ring-primary/40' : ''}">
                                <span class="material-symbols-outlined">${this.autoPlayEnabled ? 'pause_circle' : 'settings_voice'}</span>
                            </div>
                            <span class="text-[10px] font-bold uppercase">${this.autoPlayEnabled ? 'Auto On' : 'Auto'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderLine(line, index) {
        const isUser = line.speaker === 'A';
        const isCurrent = index === this.currentLineIndex;
        const isPast = index < this.currentLineIndex;
        const showTranslation = this.showTranslations[index];

        return `
            <div class="flex ${isUser ? 'flex-row-reverse' : ''} gap-4 group ${!isCurrent && !isPast ? 'opacity-50' : ''}">
                <div class="shrink-0 pt-1">
                    ${isUser ? `
                        <div class="size-10 rounded-full bg-primary shadow-neon flex items-center justify-center text-background-dark font-bold text-sm ring-2 ring-white dark:ring-white/10">
                            You
                        </div>
                    ` : `
                        <div class="size-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-white/10 relative">
                            <span class="material-symbols-outlined text-[20px]">person</span>
                            <div class="absolute -bottom-1 -right-1 bg-surface-light dark:bg-surface-dark rounded-full p-0.5">
                                <span class="material-symbols-outlined text-blue-500 text-[14px]">volume_up</span>
                            </div>
                        </div>
                    `}
                </div>

                <div class="flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : ''}">
                    <div class="flex items-baseline justify-between ${isUser ? 'pr-1 flex-row-reverse' : 'pl-1'} w-full">
                        <span class="text-[11px] font-bold ${isUser ? 'text-primary' : 'text-gray-400'} uppercase tracking-wider">
                            ${isUser ? 'Your Turn' : 'Speaker'}
                        </span>
                    </div>

                    <div class="relative ${isUser
                        ? 'bg-primary/10 border border-primary/30 rounded-tr-sm'
                        : 'bg-white dark:bg-[#1a2e25] border border-gray-100 dark:border-white/5 rounded-tl-sm'} rounded-2xl p-4 text-[16px] leading-relaxed shadow-sm ${isCurrent ? 'ring-2 ring-primary/50' : ''}">
                        ${this.highlightWords(line.text, line.highlightedWords || [])}
                    </div>

                    <!-- Translation (if shown) -->
                    ${showTranslation ? `
                        <div class="text-sm text-gray-400 italic px-1">${line.translation}</div>
                    ` : ''}

                    <!-- Action buttons -->
                    <div class="flex ${isUser ? 'flex-wrap justify-end' : ''} gap-2 ${isUser ? 'pr-1' : 'pl-1'}">
                        ${isUser ? `
                            <button onclick="DialoguePracticeScreen.playLine(${index})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-background-dark shadow-neon hover:shadow-neon-hover transition-all text-[11px] font-bold uppercase tracking-wide">
                                <span class="material-symbols-outlined text-[14px]">play_arrow</span> Play
                            </button>
                            <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                <span class="material-symbols-outlined text-[14px]">mic</span> Record
                            </button>
                        ` : `
                            <button onclick="DialoguePracticeScreen.playLine(${index})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                <span class="material-symbols-outlined text-[14px]">play_arrow</span>
                            </button>
                            <button onclick="DialoguePracticeScreen.toggleTranslation(${index})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                <span class="material-symbols-outlined text-[14px]">translate</span> ${showTranslation ? 'Hide' : 'Translate'}
                            </button>
                        `}
                    </div>

                    <!-- Tip for user lines -->
                    ${isUser && isCurrent ? `
                        <div class="w-full mt-2 bg-gray-50 dark:bg-black/20 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                            <div class="flex items-start gap-3">
                                <span class="material-symbols-outlined text-primary mt-0.5 text-[18px]">lightbulb</span>
                                <div>
                                    <p class="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                        ${line.highlightedWords?.length > 0
                                            ? `<span class="text-primary font-bold">${line.highlightedWords[0]}</span> is vocabulary from your collection.`
                                            : 'Try speaking this phrase out loud for better retention.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    highlightWords(text, words) {
        if (!words || words.length === 0) return text;

        let result = text;
        words.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            result = result.replace(regex, '<span class="text-primary font-semibold">$1</span>');
        });
        return result;
    },

    toggleTranslation(index) {
        this.showTranslations[index] = !this.showTranslations[index];
        this.render();
    },

    async getLineAudio(index, options = {}) {
        const { silent = false } = options;
        if (!GeminiService.isConfigured()) {
            app.showToast('Set up API key for audio', 'info');
            return null;
        }

        const line = this.dialogue.lines[index];
        if (!line) return null;

        if (this.lineAudioCache[index]) {
            return this.lineAudioCache[index];
        }

        try {
            if (!silent) {
                app.showToast('Generating audio...', 'info');
            }
            const audio = await GeminiService.generateTTS(line.text);
            if (audio) {
                this.lineAudioCache[index] = audio;
                return audio;
            }
            return null;
        } catch (error) {
            if (!silent) {
                app.showToast('Audio generation failed', 'error');
            }
            return null;
        }
    },

    async playLine(index, options = {}) {
        const { silent = false } = options;
        const line = this.dialogue?.lines?.[index];
        if (!line) return false;

        const audioSrc = await this.getLineAudio(index, { silent });
        if (!audioSrc) return false;

        if (this.audioElement) {
            this.audioElement.pause();
        }

        return new Promise((resolve) => {
            const audioEl = new Audio(audioSrc);
            this.audioElement = audioEl;
            this.isPlaying = true;

            audioEl.onended = () => {
                this.isPlaying = false;
                this.audioElement = null;
                this.render();
                resolve(true);
            };

            audioEl.onerror = () => {
                this.isPlaying = false;
                this.audioElement = null;
                app.showToast('Audio playback failed', 'error');
                resolve(false);
            };

            audioEl.play().catch(() => {
                this.isPlaying = false;
                this.audioElement = null;
                app.showToast('Audio playback failed', 'error');
                resolve(false);
            });
        });
    },

    async generateAudio() {
        this.stopAutoPlay();

        if (this.isPlaying) {
            if (this.audioElement) {
                this.audioElement.pause();
            }
            this.isPlaying = false;
            this.render();
            return;
        }

        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        try {
            app.showToast('Generating full dialogue audio...', 'info');
            const audio = await GeminiService.generateDialogueAudio(this.dialogue, {
                speakerA: 'Puck',
                speakerB: 'Kore'
            });

            if (audio) {
                this.audioElement = new Audio(audio);
                this.audioElement.play();
                this.isPlaying = true;

                this.audioElement.onended = () => {
                    this.isPlaying = false;
                    this.render();
                };

                this.render();
            }
        } catch (error) {
            app.showToast(error.message, 'error');
        }
    },

    nextLine() {
        if (this.currentLineIndex < this.dialogue.lines.length - 1) {
            this.currentLineIndex++;
            this.render();

            // Scroll to new line
            setTimeout(() => {
                const main = document.querySelector('#screen-dialogue-practice main');
                if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
            }, 100);
        } else {
            // Complete
            this.showComplete();
        }
    },

    showComplete() {
        app.showModal(`
            <div class="text-center py-6">
                <div class="size-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 pulse-glow">
                    <span class="material-symbols-outlined text-4xl text-primary">celebration</span>
                </div>
                <h3 class="text-2xl font-bold mb-2">Well Done!</h3>
                <p class="text-gray-400 mb-6">You completed the dialogue practice</p>
                <div class="flex gap-3">
                    <button onclick="app.closeModal(); DialoguePracticeScreen.restart()" class="flex-1 bg-surface-dark border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5 transition-colors">
                        Practice Again
                    </button>
                    <button onclick="app.closeModal(); app.navigate('dialogue-settings')" class="flex-1 bg-primary text-background-dark font-bold py-3 rounded-xl">
                        New Dialogue
                    </button>
                </div>
            </div>
        `);
    },

    restart() {
        this.stopAutoPlay();
        this.currentLineIndex = 0;
        this.showTranslations = {};
        this.render();
    },

    showVocab() {
        const words = [];
        this.dialogue.lines.forEach(line => {
            if (line.highlightedWords) {
                words.push(...line.highlightedWords);
            }
        });
        const uniqueWords = [...new Set(words)];

        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Vocabulary</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            ${uniqueWords.length === 0
                ? '<p class="text-center text-gray-400 py-8">No highlighted vocabulary in this dialogue</p>'
                : `<div class="space-y-2">
                    ${uniqueWords.map(word => `
                        <div class="p-3 bg-surface-light dark:bg-[#1a2e25] rounded-xl flex items-center justify-between">
                            <span class="font-medium">${word}</span>
                            <button onclick="DialoguePracticeScreen.explainWord('${word}')" class="text-primary text-sm font-bold">Explain</button>
                        </div>
                    `).join('')}
                </div>`}
        `);
    },

    async explainWord(word) {
        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        app.showToast('Getting explanation...', 'info');

        try {
            const explanation = await GeminiService.explainWord(word, DataStore.getUserSync().targetLanguage);

            app.showModal(`
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-primary">${word}</h3>
                    <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Meaning</p>
                        <p class="text-white">${explanation.meaning || 'N/A'}</p>
                    </div>
                    ${explanation.pronunciation ? `
                        <div>
                            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Pronunciation</p>
                            <p class="text-white">${explanation.pronunciation}</p>
                        </div>
                    ` : ''}
                    ${explanation.usage ? `
                        <div>
                            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Usage</p>
                            <p class="text-white">${explanation.usage}</p>
                        </div>
                    ` : ''}
                    ${explanation.examples ? `
                        <div>
                            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Examples</p>
                            <ul class="space-y-1">
                                ${explanation.examples.map(ex => `<li class="text-white text-sm">• ${ex}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `);
        } catch (error) {
            app.showToast(error.message, 'error');
        }
    },

    showOptions() {
        app.showModal(`
            <div class="space-y-2">
                <button onclick="app.closeModal(); DialoguePracticeScreen.restart()" class="w-full p-4 bg-surface-light dark:bg-[#1a2e25] rounded-xl text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary">replay</span>
                    <span class="font-medium">Restart Dialogue</span>
                </button>
                <button onclick="app.closeModal(); DialoguePracticeScreen.generateAudio()" class="w-full p-4 bg-surface-light dark:bg-[#1a2e25] rounded-xl text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary">volume_up</span>
                    <span class="font-medium">Generate Audio</span>
                </button>
                <button onclick="app.closeModal(); app.navigate('dialogue-settings')" class="w-full p-4 bg-surface-light dark:bg-[#1a2e25] rounded-xl text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary">add</span>
                    <span class="font-medium">New Dialogue</span>
                </button>
            </div>
        `);
    },

    toggleAuto() {
        if (this.autoPlayEnabled) {
            this.stopAutoPlay();
            app.showToast('Auto-play paused', 'info');
            this.render();
            return;
        }

        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        this.autoPlayEnabled = true;
        app.showToast('Auto-play started', 'success');
        this.render();
        this.startAutoPlay();
    },

    async startAutoPlay() {
        if (!this.dialogue) return;

        // Ensure any previous playback is stopped
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }

        while (this.autoPlayEnabled && this.currentLineIndex < this.dialogue.lines.length) {
            const played = await this.playLine(this.currentLineIndex, { silent: true });
            if (!played || !this.autoPlayEnabled) break;

            if (this.currentLineIndex < this.dialogue.lines.length - 1) {
                this.currentLineIndex++;
                this.render();
            } else {
                this.autoPlayEnabled = false;
                this.showComplete();
                break;
            }
        }

        this.render();
    },

    stopAutoPlay() {
        this.autoPlayEnabled = false;
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        this.isPlaying = false;
    }
};

window.DialoguePracticeScreen = DialoguePracticeScreen;
