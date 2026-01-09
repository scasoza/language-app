/**
 * Onboarding Screen Component
 */

const OnboardingScreen = {
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

    render() {
        const container = document.getElementById('screen-onboarding');
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
                <button onclick="OnboardingScreen.complete()" class="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary text-background-dark text-lg font-bold leading-normal tracking-wide shadow-[0_4px_14px_rgba(13,242,128,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
                    <span class="truncate">Get Started</span>
                </button>
            </div>

            <!-- iOS Home Indicator Safe Area -->
            <div class="h-1 bg-transparent w-full"></div>
        `;

        this.initScrollHandler();
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

    complete() {
        DataStore.setOnboarded(true);
        app.navigate('home');
    }
};

window.OnboardingScreen = OnboardingScreen;
