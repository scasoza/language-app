/**
 * Study Session Screen Component
 * Implements spaced repetition flashcard review
 */

const StudyScreen = {
    cards: [],
    currentIndex: 0,
    isFlipped: false,
    sessionStats: {
        total: 0,
        reviewed: 0,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0
    },
    collectionId: null,
    isPlayingAudio: false,
    isPlayingExampleAudio: false,
    playbackSpeed: 1.0, // 1.0 = normal, 0.75 = slower, 0.5 = very slow
    isPlayingWordAudio: false,

    init(collectionId = null, studyAll = false) {
        console.log('StudyScreen.init() called with collectionId:', collectionId);
        try {
            this.collectionId = collectionId;
            const user = DataStore.getUser();
            const excludedCollectionIds = user.settings?.excludedCollectionIds || [];
            // Get due cards first, but if none due and studyAll, get all cards
            this.cards = DataStore.getDueCards(collectionId, excludedCollectionIds);

            // Defensive check: ensure cards is an array
            if (!Array.isArray(this.cards)) {
                console.error('getDueCards returned non-array:', this.cards);
                this.cards = [];
            }

            if (this.cards.length === 0 && (studyAll || collectionId)) {
                // No due cards - get all cards for this collection to allow practice
                this.cards = DataStore.getCards(collectionId, excludedCollectionIds);

                // Defensive check: ensure cards is an array
                if (!Array.isArray(this.cards)) {
                    console.error('getCards returned non-array:', this.cards);
                    this.cards = [];
                }
            }

            console.log('StudyScreen initialized with', this.cards.length, 'cards');

            this.currentIndex = 0;
            this.isFlipped = false;
            this.sessionStats = {
                total: this.cards.length,
                reviewed: 0,
                again: 0,
                hard: 0,
                good: 0,
                easy: 0
            };

            // Prefetching disabled for now - focus on making on-demand generation work reliably
            // TODO: Re-enable once TTS is working consistently
            // if (GeminiService.isConfigured() && this.cards.length > 0) {
            //     this.prefetchAudio();
            // }
        } catch (error) {
            console.error('Error in StudyScreen.init():', error);
            // Set safe defaults
            this.cards = [];
            this.currentIndex = 0;
            this.isFlipped = false;
            this.sessionStats = {
                total: 0,
                reviewed: 0,
                again: 0,
                hard: 0,
                good: 0,
                easy: 0
            };
        }
    },

    // Prefetch audio for upcoming cards
    async prefetchAudio() {
        const maxPrefetch = Math.min(3, this.cards.length);
        console.log(`Prefetching audio for ${maxPrefetch} cards...`);

        for (let i = 0; i < maxPrefetch; i++) {
            const card = this.cards[i];
            if (card && !card.audio && card.front) {
                try {
                    console.log(`Prefetching audio for card ${i + 1}: "${card.front}"`);
                    const audioData = await GeminiService.generateTTS(card.front);
                    if (audioData) {
                        await DataStore.updateCard(card.id, { audio: audioData });
                        card.audio = audioData;
                        console.log(`Audio prefetched for card ${i + 1}`);
                    }
                } catch (error) {
                    console.error(`Failed to prefetch audio for card ${i + 1}:`, error);
                    // Continue with next card even if one fails
                }
            }
        }
    },

    render() {
        console.log('StudyScreen.render() called');
        const container = document.getElementById('screen-study');

        // Critical defensive check
        if (!container) {
            console.error('screen-study container not found!');
            return;
        }

        if (this.cards.length === 0 || this.currentIndex >= this.cards.length) {
            this.renderComplete();
            return;
        }

        try {
            const card = this.cards[this.currentIndex];
            if (!card) {
                console.error('Card not found at index:', this.currentIndex);
                this.renderComplete();
                return;
            }

            const collection = DataStore.getCollection(card.collectionId);
            const progress = ((this.currentIndex + 1) / this.cards.length) * 100;

            container.innerHTML = `
            <div class="relative flex h-screen w-full flex-col overflow-hidden">
                <!-- Header Section -->
                <header class="flex flex-col w-full z-10 pt-safe-top">
                    <!-- Progress Bar -->
                    <div class="w-full h-1 bg-surface-dark/30">
                        <div class="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(13,242,128,0.5)]" style="width: ${progress}%"></div>
                    </div>

                    <!-- Top App Bar -->
                    <div class="flex items-center justify-between px-4 py-3">
                        <button onclick="app.endStudySession()" class="flex items-center justify-center size-10 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors text-slate-400 hover:text-white">
                            <span class="material-symbols-outlined text-[24px]">close</span>
                        </button>
                        <div class="flex flex-col items-center">
                            <h2 class="text-sm font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase text-[10px] leading-tight">Reviewing</h2>
                            <span class="text-base font-bold">${collection?.name || 'Mixed Review'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="event.stopPropagation(); StudyScreen.togglePlaybackSpeed()" class="flex items-center justify-center px-2 h-8 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors">
                                <span class="text-xs font-bold text-primary">${this.playbackSpeed}x</span>
                            </button>
                            <div class="flex items-center justify-center">
                                <span class="text-sm font-bold text-primary tabular-nums tracking-wide">${this.currentIndex + 1}<span class="text-slate-500 font-normal">/${this.cards.length}</span></span>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content Area: Flashcard -->
                <main class="flex-1 flex flex-col items-center justify-center px-4 py-2 w-full" onclick="StudyScreen.flip()">
                    <!-- Card Container -->
                    <div class="relative w-full h-full max-h-[600px] flex flex-col bg-white dark:bg-card-dark rounded-3xl overflow-y-auto shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_0_50px_rgba(13,242,128,0.05)] border border-slate-200 dark:border-white/5 transition-all duration-300">
                        <!-- Visual Anchor / Context Image -->
                        ${card.image ? `
                            <div class="relative w-full h-[35%] bg-slate-100 dark:bg-surface-dark overflow-hidden group">
                                <div class="absolute inset-0 bg-cover bg-center opacity-80" style="background-image: url('${card.image}');"></div>
                                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-card-dark"></div>
                                ${card.audio ? `
                                    <button onclick="event.stopPropagation(); StudyScreen.playAudio()" class="absolute top-4 right-4 size-10 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary hover:text-background-dark transition-all duration-200 shadow-lg ring-1 ring-white/10">
                                        <span class="material-symbols-outlined text-[24px]">volume_up</span>
                                    </button>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="h-[20%]"></div>
                        `}

                        <!-- Card Content -->
                        <div class="flex-1 flex flex-col items-center p-6 text-center relative z-10 ${card.image ? '-mt-6' : ''} overflow-y-auto">
                            <!-- Question (Front) -->
                            <div class="flex flex-col items-center gap-1 mb-8">
                                ${this.isChinese(card.front) && card.reading ? `
                                    <!-- Chinese with ruby annotations -->
                                    <h1 class="${this.getResponsiveFontClass(card.front)} font-bold mb-2 tracking-wide drop-shadow-lg break-words max-w-full leading-loose">
                                        ${this.generatePinyinRuby(card.front, card.reading)}
                                    </h1>
                                ` : `
                                    <!-- Non-Chinese or no reading -->
                                    <h1 class="${this.getResponsiveFontClass(card.front)} font-bold mb-2 tracking-tighter drop-shadow-lg break-words max-w-full">${card.front}</h1>
                                    ${card.reading ? `<p class="text-base md:text-xl text-slate-400 dark:text-primary/80 font-medium break-words max-w-full px-2">(${card.reading})</p>` : ''}
                                `}

                                <!-- Pronunciation button on front (only when not flipped) -->
                                ${!this.isFlipped ? `
                                    <button onclick="event.stopPropagation(); StudyScreen.playAudio()" class="mt-4 size-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all group">
                                        <span class="material-symbols-outlined text-primary group-hover:text-background-dark text-2xl">volume_up</span>
                                    </button>
                                ` : ''}
                            </div>

                            <!-- Answer Section (Revealed on flip) -->
                            ${this.isFlipped ? `
                                <div class="flex flex-col items-center w-full gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <!-- Divider -->
                                    <div class="w-12 h-1 rounded-full bg-slate-200 dark:bg-white/10 mb-2"></div>

                                    <!-- Translation -->
                                    <h3 class="text-2xl md:text-3xl font-bold text-primary tracking-tight break-words max-w-full px-2">${card.back}</h3>

                                    <!-- Action buttons -->
                                    <div class="flex items-center gap-2">
                                        <button onclick="event.stopPropagation(); StudyScreen.playAudio()" class="size-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all group" title="Replay audio">
                                            <span class="material-symbols-outlined text-primary group-hover:text-background-dark">replay</span>
                                        </button>
                                        <button onclick="event.stopPropagation(); StudyScreen.showGrammarBreakdown()" class="size-10 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center hover:bg-amber-500 hover:text-background-dark transition-all group" title="Grammar breakdown">
                                            <span class="material-symbols-outlined text-amber-500 group-hover:text-background-dark">school</span>
                                        </button>
                                    </div>

                                    <!-- Context Sentence -->
                                    ${card.example ? `
                                        <div class="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-surface-dark/50 w-full border border-slate-100 dark:border-white/5 max-w-full">
                                            <div class="flex items-center justify-between mb-2 gap-2">
                                                <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold text-left">Example <span class="text-[10px] font-normal normal-case">(tap words to hear)</span></p>
                                                <button onclick="event.stopPropagation(); StudyScreen.playExampleAudio()" class="size-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all group flex-shrink-0">
                                                    <span class="material-symbols-outlined text-primary group-hover:text-background-dark text-base">volume_up</span>
                                                </button>
                                            </div>
                                            ${this.isChinese(card.example) && card.exampleReading ? `
                                                <!-- Chinese example with clickable ruby annotations -->
                                                <p class="text-base md:text-lg text-slate-700 dark:text-slate-200 leading-loose font-medium break-words">
                                                    ${this.generatePinyinRuby(card.example, card.exampleReading, true)}
                                                </p>
                                            ` : `
                                                <!-- Non-Chinese example with clickable words -->
                                                <p class="text-base md:text-lg text-slate-700 dark:text-slate-200 leading-snug font-medium break-words">
                                                    ${this.makeTextClickable(card.example)}
                                                </p>
                                                ${card.exampleReading ? `<p class="text-sm text-primary/70 mt-1 break-words">${card.exampleReading}</p>` : ''}
                                            `}
                                            ${card.exampleTranslation ? `<p class="text-sm text-slate-400 dark:text-slate-500 mt-1 italic break-words">(${card.exampleTranslation})</p>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            ` : `
                                <div class="flex-1 flex items-center justify-center">
                                    <p class="text-slate-400 text-sm">Tap to reveal answer</p>
                                </div>
                            `}
                        </div>
                    </div>
                </main>

                <!-- Footer / Action Zone -->
                <footer class="p-4 pb-6 z-10">
                    ${this.isFlipped ? `
                        <div class="grid grid-cols-4 gap-3 w-full max-w-md mx-auto">
                            <!-- Again Button -->
                            <button onclick="event.stopPropagation(); StudyScreen.answer(0)" class="group flex flex-col items-center gap-1">
                                <div class="h-14 w-full rounded-2xl bg-rose-500/10 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-active:scale-95 transition-transform">
                                    <span class="material-symbols-outlined">replay</span>
                                </div>
                                <span class="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Again</span>
                            </button>

                            <!-- Hard Button -->
                            <button onclick="event.stopPropagation(); StudyScreen.answer(1)" class="group flex flex-col items-center gap-1">
                                <div class="h-14 w-full rounded-2xl bg-amber-500/10 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-active:scale-95 transition-transform">
                                    <span class="material-symbols-outlined">sentiment_neutral</span>
                                </div>
                                <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Hard</span>
                            </button>

                            <!-- Good Button (Primary) -->
                            <button onclick="event.stopPropagation(); StudyScreen.answer(2)" class="group flex flex-col items-center gap-1">
                                <div class="h-14 w-full rounded-2xl bg-primary shadow-[0_0_15px_rgba(13,242,128,0.3)] flex items-center justify-center text-background-dark group-active:scale-95 transition-transform">
                                    <span class="material-symbols-outlined font-bold">check</span>
                                </div>
                                <span class="text-[10px] font-bold text-primary uppercase tracking-wider">Good</span>
                            </button>

                            <!-- Easy Button -->
                            <button onclick="event.stopPropagation(); StudyScreen.answer(3)" class="group flex flex-col items-center gap-1">
                                <div class="h-14 w-full rounded-2xl bg-sky-500/10 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-active:scale-95 transition-transform">
                                    <span class="material-symbols-outlined">sentiment_very_satisfied</span>
                                </div>
                                <span class="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Easy</span>
                            </button>
                        </div>
                    ` : `
                        <button onclick="event.stopPropagation(); StudyScreen.flip()" class="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                            <span class="material-symbols-outlined">visibility</span>
                            Show Answer
                        </button>
                    `}
                </footer>
            </div>

            <!-- Background decorative element -->
            <div class="fixed inset-0 pointer-events-none -z-10 bg-background-dark">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px] opacity-50 mix-blend-screen"></div>
            </div>
        `;
        } catch (error) {
            console.error('Error rendering study card:', error);
            // Show error state instead of green screen
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-screen p-6 text-center">
                    <div class="mb-8">
                        <span class="material-symbols-outlined text-6xl text-rose-400">error</span>
                    </div>
                    <h1 class="text-3xl font-bold mb-2">Something Went Wrong</h1>
                    <p class="text-slate-400 mb-4 max-w-xs">There was an error loading the study session.</p>
                    <p class="text-xs text-slate-500 mb-8 font-mono">${error.message || 'Unknown error'}</p>
                    <button onclick="app.navigate('home')" class="bg-primary text-background-dark font-bold py-4 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        <span class="material-symbols-outlined inline-block mr-2">home</span>
                        Back to Home
                    </button>
                </div>
            `;
        }
    },

    renderComplete() {
        console.log('StudyScreen.renderComplete() called');
        const container = document.getElementById('screen-study');

        // Defensive check
        if (!container) {
            console.error('screen-study container not found in renderComplete!');
            return;
        }

        try {
            const { reviewed, again, hard, good, easy, total } = this.sessionStats;
            const accuracy = reviewed > 0 ? Math.round(((good + easy) / reviewed) * 100) : 0;

        // Check if this is "no cards" vs "session complete"
        const noCards = total === 0 && reviewed === 0;

        if (noCards) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-screen p-6 text-center">
                    <div class="mb-8 relative">
                        <div class="size-32 rounded-full bg-surface-dark flex items-center justify-center">
                            <span class="material-symbols-outlined text-6xl text-slate-400">style</span>
                        </div>
                    </div>

                    <h1 class="text-3xl font-bold mb-2">No Cards Yet</h1>
                    <p class="text-slate-400 mb-8 max-w-xs">This collection is empty. Add some flashcards to start studying!</p>

                    <div class="flex flex-col gap-3 w-full max-w-sm">
                        <button onclick="app.navigate('add-word')" class="w-full bg-primary text-background-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                            <span class="material-symbols-outlined">add</span>
                            Add Flashcard
                        </button>
                        <button onclick="app.navigate('collections')" class="w-full bg-surface-dark border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                            <span class="material-symbols-outlined">arrow_back</span>
                            Back to Collections
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-screen p-6 text-center">
                <!-- Success Animation -->
                <div class="mb-8 relative">
                    <div class="size-32 rounded-full bg-primary/20 flex items-center justify-center pulse-glow">
                        <span class="material-symbols-outlined text-6xl text-primary">celebration</span>
                    </div>
                </div>

                <h1 class="text-3xl font-bold mb-2">Session Complete!</h1>
                <p class="text-slate-400 mb-8">Great job on your review session</p>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                    <div class="bg-surface-dark rounded-2xl p-4 border border-white/5">
                        <p class="text-3xl font-bold text-primary">${reviewed}</p>
                        <p class="text-xs text-slate-400 uppercase tracking-wider">Cards Reviewed</p>
                    </div>
                    <div class="bg-surface-dark rounded-2xl p-4 border border-white/5">
                        <p class="text-3xl font-bold text-primary">${accuracy}%</p>
                        <p class="text-xs text-slate-400 uppercase tracking-wider">Accuracy</p>
                    </div>
                </div>

                <!-- Breakdown -->
                <div class="flex gap-4 mb-8">
                    <div class="flex items-center gap-2">
                        <div class="size-3 rounded-full bg-rose-500"></div>
                        <span class="text-sm text-slate-400">Again: ${again}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="size-3 rounded-full bg-amber-500"></div>
                        <span class="text-sm text-slate-400">Hard: ${hard}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="size-3 rounded-full bg-primary"></div>
                        <span class="text-sm text-slate-400">Good: ${good}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="size-3 rounded-full bg-sky-500"></div>
                        <span class="text-sm text-slate-400">Easy: ${easy}</span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-3 w-full max-w-sm">
                    <button onclick="app.navigate('home')" class="w-full bg-primary text-background-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        <span class="material-symbols-outlined">home</span>
                        Back to Home
                    </button>
                    <button onclick="StudyScreen.restart()" class="w-full bg-surface-dark border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                        <span class="material-symbols-outlined">replay</span>
                        Study More
                    </button>
                </div>
            </div>
        `;
        } catch (error) {
            console.error('Error in renderComplete():', error);
            // Fallback UI
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-screen p-6 text-center">
                    <div class="mb-8">
                        <span class="material-symbols-outlined text-6xl text-slate-400">check_circle</span>
                    </div>
                    <h1 class="text-3xl font-bold mb-2">Session Complete</h1>
                    <p class="text-slate-400 mb-8 max-w-xs">Great work! Continue learning by reviewing more cards.</p>
                    <button onclick="app.navigate('home')" class="bg-primary text-background-dark font-bold py-4 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        <span class="material-symbols-outlined inline-block mr-2">home</span>
                        Back to Home
                    </button>
                </div>
            `;
        }
    },

    async flip() {
        if (!this.isFlipped) {
            this.isFlipped = true;
            this.render();
            // Don't auto-play audio - let user click button if they want it
        }
    },

    answer(quality) {
        // quality: 0=again, 1=hard, 2=good, 3=easy
        const card = this.cards[this.currentIndex];

        // Update card with spaced repetition
        DataStore.reviewCard(card.id, quality);

        // Update session stats
        this.sessionStats.reviewed++;
        if (quality === 0) this.sessionStats.again++;
        else if (quality === 1) this.sessionStats.hard++;
        else if (quality === 2) this.sessionStats.good++;
        else if (quality === 3) this.sessionStats.easy++;

        // Move to next card
        this.currentIndex++;
        this.isFlipped = false;

        // Prefetching disabled - focus on making on-demand generation work reliably first
        // TODO: Re-enable once TTS is working consistently

        this.render();
    },

    async playAudio() {
        // Prevent overlapping audio playback
        if (this.isPlayingAudio) {
            console.log('⏸️ Audio already playing, ignoring request');
            return;
        }

        const card = this.cards[this.currentIndex];
        if (!card) {
            console.error('No card available for audio playback');
            return;
        }

        console.log(`🔊 playAudio() called for card: "${card.front}"`);
        console.log(`   - Has cached audio: ${!!card.audio}`);
        console.log(`   - API configured: ${GeminiService.isConfigured()}`);
        console.log(`   - API key: ${GeminiService.getApiKey() ? GeminiService.getApiKey().substring(0, 10) + '...' : 'NOT SET'}`);

        this.isPlayingAudio = true;

        try {
            let audioData = card.audio;

            // Generate TTS if no audio exists
            if (!audioData) {
                if (!GeminiService.isConfigured()) {
                    app.showToast('Configure Gemini API key in Settings to enable audio', 'error');
                    return;
                }

                app.showToast('Generating pronunciation...', 'info');
                console.log(`🎙️ Generating TTS for: "${card.front}"`);

                // Get target language for proper voice selection
                const collection = DataStore.getCollection(card.collectionId);
                const user = DataStore.getUser();
                const targetLanguage = collection?.targetLanguage || user?.targetLanguage || 'Spanish';

                try {
                    // Try Cloud TTS first (more reliable, language-specific)
                    // Timeout: 10 seconds (Cloud TTS is faster than Gemini)
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                    );

                    try {
                        audioData = await Promise.race([
                            GeminiService.generateCloudTTS(card.front, targetLanguage),
                            timeoutPromise
                        ]);
                    } catch (cloudError) {
                        // If Cloud TTS fails (403/404) or Supabase not configured, fall back to Gemini TTS
                        if (cloudError.message && (cloudError.message.includes('403') || cloudError.message.includes('404') || cloudError.message.includes('not configured'))) {
                            console.warn('⚠️ Cloud TTS not available, falling back to Gemini TTS');
                            app.showToast('Using Gemini TTS', 'info');

                            // Fallback to Gemini TTS with retry logic
                            const geminiTimeout = new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 20000)
                            );

                            audioData = await Promise.race([
                                GeminiService.generateTTS(card.front),
                                geminiTimeout
                            ]);
                        } else {
                            throw cloudError;
                        }
                    }

                    if (!audioData) {
                        throw new Error('API returned empty audio data');
                    }

                    console.log(`✅ TTS generated successfully, audio data length: ${audioData.length}`);

                    // Save audio to card for future use
                    await DataStore.updateCard(card.id, { audio: audioData });
                    card.audio = audioData;
                    console.log('💾 Audio saved to card');
                    app.showToast('Pronunciation ready!', 'success');

                } catch (genError) {
                    if (genError.message === 'Timeout') {
                        console.error('❌ TTS generation timed out');
                        app.showToast('Audio generation timed out. Please try again.', 'error');
                    } else if (genError.message.includes('API key')) {
                        console.error('❌ API key error:', genError);
                        app.showToast('Invalid API key. Please check Settings.', 'error');
                    } else if (genError.message.includes('quota')) {
                        console.error('❌ API quota exceeded:', genError);
                        app.showToast('API quota exceeded. Try again later.', 'error');
                    } else {
                        console.error('❌ TTS generation failed:', genError);
                        app.showToast(`Error: ${genError.message}`, 'error');
                    }
                    return;
                }
            }

            // Play audio
            if (audioData) {
                console.log(`▶️ Playing audio at ${this.playbackSpeed}x speed...`);
                const audio = new Audio(audioData);
                audio.volume = 1.0;
                audio.playbackRate = this.playbackSpeed; // Apply playback speed

                // Reset flag when audio ends or on error
                audio.addEventListener('ended', () => {
                    this.isPlayingAudio = false;
                    console.log('✅ Audio playback completed');
                });

                audio.addEventListener('error', () => {
                    this.isPlayingAudio = false;
                    console.error('❌ Audio playback error');
                });

                await audio.play().catch(e => {
                    console.error('❌ Audio playback failed:', e);
                    app.showToast('Could not play audio', 'error');
                    this.isPlayingAudio = false;
                });

                console.log('✅ Audio playing');
            } else {
                console.warn('⚠️ No audio data available after generation attempt');
                this.isPlayingAudio = false;
            }
        } catch (error) {
            console.error('❌ Unexpected error in playAudio():', error);
            app.showToast(`Audio error: ${error.message}`, 'error');
            this.isPlayingAudio = false;
        }
    },

    async playExampleAudio() {
        // Prevent overlapping audio playback
        if (this.isPlayingExampleAudio) {
            console.log('⏸️ Example audio already playing, ignoring request');
            return;
        }

        const card = this.cards[this.currentIndex];
        if (!card || !card.example) {
            console.error('No example available for audio playback');
            return;
        }

        console.log(`🔊 playExampleAudio() called for card: "${card.front}"`);
        console.log(`   - Has cached example audio: ${!!card.exampleAudio}`);
        console.log(`   - API configured: ${GeminiService.isConfigured()}`);
        console.log(`   - API key: ${GeminiService.getApiKey() ? GeminiService.getApiKey().substring(0, 10) + '...' : 'NOT SET'}`);

        this.isPlayingExampleAudio = true;

        try {
            let audioData = card.exampleAudio;

            // Generate TTS if no audio exists
            if (!audioData) {
                if (!GeminiService.isConfigured()) {
                    app.showToast('Configure Gemini API key in Settings to enable audio', 'error');
                    return;
                }

                app.showToast('Generating example audio...', 'info');
                console.log(`🎙️ Generating example TTS for: "${card.example}"`);

                // Get target language for proper voice selection
                const collection = DataStore.getCollection(card.collectionId);
                const user = DataStore.getUser();
                const targetLanguage = collection?.targetLanguage || user?.targetLanguage || 'Spanish';

                try {
                    // Try Cloud TTS first (more reliable, language-specific)
                    // Timeout: 10 seconds (Cloud TTS is faster than Gemini)
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 10000)
                    );

                    try {
                        audioData = await Promise.race([
                            GeminiService.generateCloudTTS(card.example, targetLanguage),
                            timeoutPromise
                        ]);
                    } catch (cloudError) {
                        // If Cloud TTS fails (403/404) or Supabase not configured, fall back to Gemini TTS
                        if (cloudError.message && (cloudError.message.includes('403') || cloudError.message.includes('404') || cloudError.message.includes('not configured'))) {
                            console.warn('⚠️ Cloud TTS not available, falling back to Gemini TTS');
                            app.showToast('Using Gemini TTS', 'info');

                            // Fallback to Gemini TTS with retry logic
                            const geminiTimeout = new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 20000)
                            );

                            audioData = await Promise.race([
                                GeminiService.generateTTS(card.example),
                                geminiTimeout
                            ]);
                        } else {
                            throw cloudError;
                        }
                    }

                    if (!audioData) {
                        throw new Error('API returned empty audio data');
                    }

                    console.log(`✅ Example TTS generated successfully, audio data length: ${audioData.length}`);

                    // Save audio to card for future use
                    await DataStore.updateCard(card.id, { exampleAudio: audioData });
                    card.exampleAudio = audioData;
                    console.log('💾 Example audio saved to card');
                    app.showToast('Example pronunciation ready!', 'success');

                } catch (genError) {
                    if (genError.message === 'Timeout') {
                        console.error('❌ Example TTS generation timed out');
                        app.showToast('Audio generation timed out. Please try again.', 'error');
                    } else if (genError.message.includes('API key')) {
                        console.error('❌ API key error:', genError);
                        app.showToast('API key issue. Please check your settings.', 'error');
                    } else {
                        console.error('❌ Example TTS generation failed:', genError);
                        app.showToast('Failed to generate example audio. Try again later.', 'error');
                    }
                    return;
                }
            }

            // Play audio if available
            if (audioData) {
                try {
                    const audio = new Audio(audioData);
                    audio.playbackRate = this.playbackSpeed; // Apply playback speed

                    // Reset flag when audio ends or on error
                    audio.addEventListener('ended', () => {
                        this.isPlayingExampleAudio = false;
                        console.log('✅ Example audio playback completed');
                    });

                    audio.addEventListener('error', () => {
                        this.isPlayingExampleAudio = false;
                        console.error('❌ Example audio playback error');
                    });

                    await audio.play().catch(e => {
                        console.error('Failed to play example audio:', e);
                        app.showToast('Failed to play audio', 'error');
                        this.isPlayingExampleAudio = false;
                    });
                } catch (playError) {
                    console.error('Failed to play example audio:', playError);
                    app.showToast('Failed to play audio', 'error');
                    this.isPlayingExampleAudio = false;
                }
            } else {
                this.isPlayingExampleAudio = false;
            }
        } catch (error) {
            console.error('Error playing example audio:', error);
            app.showToast('Audio playback error', 'error');
            this.isPlayingExampleAudio = false;
        }
    },

    restart() {
        this.init(this.collectionId);
        this.render();
    },

    // Toggle playback speed between 1.0x, 0.75x, and 0.5x
    togglePlaybackSpeed() {
        if (this.playbackSpeed === 1.0) {
            this.playbackSpeed = 0.75;
        } else if (this.playbackSpeed === 0.75) {
            this.playbackSpeed = 0.5;
        } else {
            this.playbackSpeed = 1.0;
        }
        this.render();
        app.showToast(`Playback speed: ${this.playbackSpeed}x`, 'success');
    },

    // Play pronunciation for an individual word/character
    async playWordAudio(word) {
        if (!word || this.isPlayingWordAudio) {
            console.log('⏸️ Word audio already playing or no word provided');
            return;
        }

        this.isPlayingWordAudio = true;

        try {
            const card = this.cards[this.currentIndex];
            const collection = DataStore.getCollection(card?.collectionId);
            const user = DataStore.getUser();
            const targetLanguage = collection?.targetLanguage || user?.targetLanguage || 'Spanish';

            console.log(`🔊 Generating TTS for word: "${word}"`);

            // Generate TTS for the word
            let audioData;
            try {
                audioData = await GeminiService.generateCloudTTS(word.trim(), targetLanguage);
            } catch (cloudError) {
                console.warn('⚠️ Cloud TTS failed, falling back to Gemini TTS');
                audioData = await GeminiService.generateTTS(word.trim());
            }

            if (audioData) {
                const audio = new Audio(audioData);
                audio.volume = 1.0;
                audio.playbackRate = this.playbackSpeed;

                audio.addEventListener('ended', () => {
                    this.isPlayingWordAudio = false;
                });

                audio.addEventListener('error', () => {
                    this.isPlayingWordAudio = false;
                });

                await audio.play().catch(e => {
                    console.error('❌ Word audio playback failed:', e);
                    this.isPlayingWordAudio = false;
                });
            } else {
                this.isPlayingWordAudio = false;
            }
        } catch (error) {
            console.error('Error playing word audio:', error);
            this.isPlayingWordAudio = false;
        }
    },

    // Show grammar breakdown for the current card
    async showGrammarBreakdown() {
        const card = this.cards[this.currentIndex];
        if (!card) return;

        const collection = DataStore.getCollection(card.collectionId);
        const user = DataStore.getUser();
        const targetLanguage = collection?.targetLanguage || user?.targetLanguage || 'Spanish';

        try {
            app.showToast('Analyzing grammar...', 'info');

            const explanation = await GeminiService.explainWord(card.front, targetLanguage);

            app.showModal(`
                <div class="space-y-4">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-2xl font-bold text-white">Grammar Breakdown</h2>
                        <button onclick="app.closeModal()" class="size-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-slate-400">close</span>
                        </button>
                    </div>

                    <div class="bg-surface-dark/50 rounded-xl p-4 border border-white/5">
                        <p class="text-3xl font-bold text-primary mb-2">${card.front}</p>
                        ${card.reading ? `<p class="text-slate-400">${card.reading}</p>` : ''}
                    </div>

                    ${explanation.meaning ? `
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Meaning</p>
                            <p class="text-white">${explanation.meaning}</p>
                        </div>
                    ` : ''}

                    ${explanation.partOfSpeech ? `
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Part of Speech</p>
                            <p class="text-white capitalize">${explanation.partOfSpeech}</p>
                        </div>
                    ` : ''}

                    ${explanation.pronunciation ? `
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Pronunciation</p>
                            <p class="text-white">${explanation.pronunciation}</p>
                        </div>
                    ` : ''}

                    ${explanation.usage ? `
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Usage</p>
                            <p class="text-white">${explanation.usage}</p>
                        </div>
                    ` : ''}

                    ${explanation.examples && Array.isArray(explanation.examples) && explanation.examples.length > 0 ? `
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold">Examples</p>
                            <div class="space-y-2">
                                ${explanation.examples.map(ex => `
                                    <div class="bg-surface-dark/30 rounded-lg p-3 border border-white/5">
                                        <p class="text-white mb-1">${ex.sentence || ex}</p>
                                        ${ex.translation ? `<p class="text-sm text-slate-400 italic">${ex.translation}</p>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${explanation.relatedWords && Array.isArray(explanation.relatedWords) && explanation.relatedWords.length > 0 ? `
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold">Related Words</p>
                            <div class="flex flex-wrap gap-2">
                                ${explanation.relatedWords.map(word => `
                                    <span class="px-3 py-1 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm">
                                        ${typeof word === 'string' ? word : word.word || ''}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${explanation.tips ? `
                        <div>
                            <p class="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Tips</p>
                            <p class="text-white">${explanation.tips}</p>
                        </div>
                    ` : ''}
                </div>
            `, 'Grammar Breakdown');

        } catch (error) {
            console.error('Error showing grammar breakdown:', error);
            app.showToast('Failed to load grammar breakdown', 'error');
        }
    },

    // Helper function to determine responsive font size based on text length
    getResponsiveFontClass(text) {
        if (!text) return 'text-6xl md:text-7xl';
        const length = text.length;

        if (length <= 5) return 'text-6xl md:text-7xl';  // Very short
        if (length <= 15) return 'text-5xl md:text-6xl'; // Short
        if (length <= 30) return 'text-4xl md:text-5xl'; // Medium
        if (length <= 50) return 'text-3xl md:text-4xl'; // Long
        return 'text-2xl md:text-3xl';                    // Very long
    },

    // Helper function to check if text is Chinese
    isChinese(text) {
        if (!text) return false;
        // Check if text contains Chinese characters (CJK Unified Ideographs)
        return /[\u4e00-\u9fa5]/.test(text);
    },

    // Generate ruby-annotated HTML for Chinese text with pinyin (clickable for individual word pronunciation)
    generatePinyinRuby(chineseText, pinyinText, makeClickable = false) {
        if (!chineseText || !pinyinText) return chineseText;

        // Remove parentheses from pinyin if present
        const cleanPinyin = pinyinText.replace(/[()（）]/g, '').trim();

        // Split pinyin by spaces
        const pinyinSyllables = cleanPinyin.split(/\s+/);

        // Split Chinese text into characters, grouping common multi-character words
        const chineseChars = this.segmentChinese(chineseText);

        // If counts don't match, try simple character-by-character
        if (pinyinSyllables.length !== chineseChars.length) {
            // Fall back to character-by-character if mismatch
            const chars = chineseText.split('');
            // If still mismatch, just return plain text with pinyin below
            if (pinyinSyllables.length < chars.length) {
                return chineseText;
            }
        }

        // Build ruby HTML with optional click handlers
        let html = '';
        for (let i = 0; i < chineseChars.length && i < pinyinSyllables.length; i++) {
            const char = chineseChars[i];
            const escapedChar = char.replace(/'/g, "\\'");

            if (makeClickable) {
                html += `<ruby class="cursor-pointer hover:text-primary transition-colors" onclick="event.stopPropagation(); StudyScreen.playWordAudio('${escapedChar}')">${char}<rt class="text-sm font-normal pointer-events-none">${pinyinSyllables[i]}</rt></ruby>`;
            } else {
                html += `<ruby>${char}<rt class="text-sm font-normal">${pinyinSyllables[i]}</rt></ruby>`;
            }
        }

        return html;
    },

    // Segment Chinese text into words/characters for pinyin matching
    segmentChinese(text) {
        if (!text) return [];

        // For now, use a simple character-by-character split
        // In a production app, you might use a proper Chinese word segmentation library
        const chars = [];
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            // Skip non-Chinese characters (punctuation, etc.)
            if (/[\u4e00-\u9fa5]/.test(char)) {
                chars.push(char);
            } else {
                // Include punctuation as-is
                if (chars.length > 0 && !(/[\u4e00-\u9fa5]/.test(chars[chars.length - 1]))) {
                    chars[chars.length - 1] += char;
                } else {
                    chars.push(char);
                }
            }
        }
        return chars;
    },

    // Make text clickable for word-by-word pronunciation
    makeTextClickable(text) {
        if (!text) return text;

        // Split by spaces and punctuation
        const words = text.match(/[\w'-]+|[^\w\s]/g) || [];

        return words.map(word => {
            // Don't make punctuation clickable
            if (/^[^\w\s]$/.test(word)) {
                return word;
            }

            const escapedWord = word.replace(/'/g, "\\'");
            return `<span class="cursor-pointer hover:text-primary transition-colors inline-block" onclick="event.stopPropagation(); StudyScreen.playWordAudio('${escapedWord}')">${word}</span>`;
        }).join(' ');
    }
};

window.StudyScreen = StudyScreen;
