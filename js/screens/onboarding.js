/**
 * Onboarding Screen Component with Language Selection
 */

const OnboardingScreen = {
    currentStep: 0, // 0 = welcome slides, 1 = language selection, 2 = name entry
    currentSlide: 0,

    slides: [
        {
            icon: 'visibility',
            title: 'Learn Visually',
            description: 'Grasp complex concepts instantly with high-contrast imagery designed for memory retention.'
        },
        {
            icon: 'all_inclusive',
            title: 'Never Forget',
            description: 'Smart spaced repetition algorithms ensure you review material at the perfect cognitive moment.'
        },
        {
            icon: 'touch_app',
            title: 'Flow State Input',
            description: 'Frictionless swipe and tap gestures designed to keep you in the zone while you learn.'
        }
    ],

    languages: [
        { code: 'Spanish', flag: '🇪🇸', name: 'Spanish' },
        { code: 'French', flag: '🇫🇷', name: 'French' },
        { code: 'German', flag: '🇩🇪', name: 'German' },
        { code: 'Italian', flag: '🇮🇹', name: 'Italian' },
        { code: 'Portuguese', flag: '🇵🇹', name: 'Portuguese' },
        { code: 'Japanese', flag: '🇯🇵', name: 'Japanese' },
        { code: 'Korean', flag: '🇰🇷', name: 'Korean' },
        { code: 'Chinese', flag: '🇨🇳', name: 'Chinese' },
        { code: 'Russian', flag: '🇷🇺', name: 'Russian' },
        { code: 'Arabic', flag: '🇸🇦', name: 'Arabic' }
    ],

    selectedLanguage: null,
    userName: '',

    render() {
        const container = document.getElementById('screen-onboarding');

        switch (this.currentStep) {
            case 0:
                this.renderWelcomeSlides(container);
                break;
            case 1:
                this.renderLanguageSelection(container);
                break;
            case 2:
                this.renderNameEntry(container);
                break;
        }
    },

    renderWelcomeSlides(container) {
        container.innerHTML = `
            <!-- Status Bar Placeholder -->
            <div class="h-12 w-full flex items-end justify-between px-6 pb-2 text-xs font-medium text-slate-400">
                <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div class="flex gap-1.5 items-center">
                    <span class="material-symbols-outlined text-[16px]">signal_cellular_alt</span>
                    <span class="material-symbols-outlined text-[16px]">wifi</span>
                    <span class="material-symbols-outlined text-[16px]">battery_full</span>
                </div>
            </div>

            <!-- Carousel Section -->
            <div class="flex-1 flex flex-col justify-center">
                <!-- Slides Container -->
                <div id="onboarding-slides" class="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-full items-center">
                    ${this.slides.map((slide, index) => `
                        <div class="snap-center shrink-0 w-full px-6 flex flex-col items-center justify-center gap-8 text-center" data-slide="${index}">
                            <div class="relative w-64 h-64 rounded-full bg-gradient-to-tr from-[#1a382b] to-[#2c5e46] flex items-center justify-center shadow-[0_0_40px_-10px_rgba(13,242,128,0.15)] ring-1 ring-white/10">
                                <span class="material-symbols-outlined text-8xl text-primary drop-shadow-[0_0_15px_rgba(13,242,128,0.6)]">${slide.icon}</span>
                            </div>
                            <div class="max-w-[85%]">
                                <h2 class="text-3xl font-bold tracking-tight mb-3 text-white">${slide.title}</h2>
                                <p class="text-gray-400 text-base font-light leading-relaxed">${slide.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Pagination Dots -->
                <div id="onboarding-dots" class="flex w-full flex-row items-center justify-center gap-2.5 py-6">
                    ${this.slides.map((_, index) => `
                        <div class="h-2 ${index === 0 ? 'w-8 bg-primary shadow-[0_0_8px_rgba(13,242,128,0.6)]' : 'w-2 bg-[#31684d]'} rounded-full transition-all duration-300" data-dot="${index}"></div>
                    `).join('')}
                </div>
            </div>

            <!-- Bottom Actions Section -->
            <div class="flex flex-col gap-3 px-6 pb-10 pt-2 w-full max-w-sm mx-auto">
                <!-- Primary Action -->
                <button onclick="OnboardingScreen.nextStep()" class="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary text-background-dark text-lg font-bold leading-normal tracking-wide shadow-[0_4px_14px_rgba(13,242,128,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
                    <span class="truncate">Get Started</span>
                </button>

            </div>
        `;

        this.initScrollHandler();
    },

    renderLanguageSelection(container) {
        container.innerHTML = `
            <div class="flex flex-col h-screen">
                <!-- Header -->
                <div class="pt-12 pb-6 px-6">
                    <button onclick="OnboardingScreen.prevStep()" class="mb-4 size-10 rounded-full bg-white/5 flex items-center justify-center">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 class="text-3xl font-bold mb-2">What language do you want to learn?</h1>
                    <p class="text-slate-400">You can always change this later in settings</p>
                </div>

                <!-- Language Grid -->
                <div class="flex-1 overflow-y-auto px-6 pb-6">
                    <div class="grid grid-cols-2 gap-3">
                        ${this.languages.map(lang => `
                            <button onclick="OnboardingScreen.selectLanguage('${lang.code}')" class="p-4 rounded-2xl border-2 ${this.selectedLanguage === lang.code ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-dark'} flex flex-col items-center gap-2 hover:border-primary/50 transition-all">
                                <span class="text-4xl">${lang.flag}</span>
                                <span class="font-medium">${lang.name}</span>
                                ${this.selectedLanguage === lang.code ? '<span class="material-symbols-outlined text-primary text-sm">check_circle</span>' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Continue Button -->
                <div class="p-6 border-t border-white/5">
                    <button onclick="OnboardingScreen.nextStep()" class="w-full h-14 rounded-xl font-bold text-lg ${this.selectedLanguage ? 'bg-primary text-background-dark' : 'bg-white/10 text-white/50 pointer-events-none'} transition-all">
                        Continue
                    </button>
                </div>
            </div>
        `;
    },

    renderNameEntry(container) {
        container.innerHTML = `
            <div class="flex flex-col h-screen">
                <!-- Header -->
                <div class="pt-12 pb-6 px-6">
                    <button onclick="OnboardingScreen.prevStep()" class="mb-4 size-10 rounded-full bg-white/5 flex items-center justify-center">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 class="text-3xl font-bold mb-2">What should we call you?</h1>
                    <p class="text-slate-400">This helps personalize your learning experience</p>
                </div>

                <!-- Name Input -->
                <div class="flex-1 px-6">
                    <input
                        type="text"
                        id="user-name-input"
                        placeholder="Enter your name"
                        value="${this.userName}"
                        oninput="OnboardingScreen.userName = this.value"
                        class="w-full h-14 px-4 rounded-xl bg-surface-dark border border-white/10 text-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        autofocus
                    />

                    <!-- Language Summary -->
                    <div class="mt-6 p-4 rounded-xl bg-surface-dark border border-white/5">
                        <p class="text-sm text-slate-400 mb-1">Learning</p>
                        <div class="flex items-center gap-2">
                            <span class="text-2xl">${this.languages.find(l => l.code === this.selectedLanguage)?.flag || '🌐'}</span>
                            <span class="font-bold text-lg">${this.selectedLanguage}</span>
                        </div>
                    </div>
                </div>

                <!-- Complete Button -->
                <div class="p-6 border-t border-white/5">
                    <button onclick="OnboardingScreen.complete()" class="w-full h-14 rounded-xl bg-primary text-background-dark font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        <span class="material-symbols-outlined">rocket_launch</span>
                        Start Learning
                    </button>
                </div>
            </div>
        `;

        // Focus input
        setTimeout(() => {
            document.getElementById('user-name-input')?.focus();
        }, 100);
    },

    initScrollHandler() {
        const slidesContainer = document.getElementById('onboarding-slides');
        if (!slidesContainer) return;

        slidesContainer.addEventListener('scroll', () => {
            const slideWidth = slidesContainer.offsetWidth;
            const scrollPosition = slidesContainer.scrollLeft;
            const newSlide = Math.round(scrollPosition / slideWidth);

            if (newSlide !== this.currentSlide) {
                this.currentSlide = newSlide;
                this.updateDots();
            }
        });
    },

    updateDots() {
        const dots = document.querySelectorAll('#onboarding-dots [data-dot]');
        dots.forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.classList.remove('w-2', 'bg-[#31684d]');
                dot.classList.add('w-8', 'bg-primary', 'shadow-[0_0_8px_rgba(13,242,128,0.6)]');
            } else {
                dot.classList.remove('w-8', 'bg-primary', 'shadow-[0_0_8px_rgba(13,242,128,0.6)]');
                dot.classList.add('w-2', 'bg-[#31684d]');
            }
        });
    },

    selectLanguage(code) {
        this.selectedLanguage = code;
        this.render();
    },

    nextStep() {
        if (this.currentStep < 2) {
            this.currentStep++;
            this.render();
        }
    },

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    },

    complete() {
        const name = this.userName.trim() || 'Learner';

        // Save user preferences
        DataStore.updateUser({
            name: name,
            targetLanguage: this.selectedLanguage || 'Spanish',
            nativeLanguage: 'English'
        });

        DataStore.setOnboarded(true);

        // Reset state
        this.currentStep = 0;
        this.selectedLanguage = null;
        this.userName = '';

        app.navigate('home');
    }
};

window.OnboardingScreen = OnboardingScreen;
