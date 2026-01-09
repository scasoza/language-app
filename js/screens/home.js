/**
 * Home Dashboard Screen Component
 */

const HomeScreen = {
    render() {
        const user = DataStore.getUserSync();
        const stats = DataStore.getStatsSync();
        const collections = DataStore.getCollectionsSync().slice(0, 3);

        const greeting = this.getGreeting();

        const container = document.getElementById('screen-home');
        container.innerHTML = `
            <!-- Header -->
            <header class="flex items-center justify-between px-4 pt-6 pb-2 sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md">
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center size-10 rounded-full bg-orange-500/10 text-orange-500">
                        <span class="material-symbols-outlined text-2xl">local_fire_department</span>
                    </div>
                    <div class="flex flex-col">
                        <h2 class="text-sm font-medium text-slate-500 dark:text-slate-400">${greeting}</h2>
                        <h1 class="text-xl font-bold leading-tight tracking-tight">${user.name}</h1>
                    </div>
                </div>
                <button onclick="app.navigate('settings')" class="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <span class="material-symbols-outlined text-2xl text-slate-700 dark:text-slate-300">settings</span>
                </button>
            </header>

            <!-- Main Study Card -->
            <section class="p-4 w-full">
                <div class="group relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5">
                    <div class="absolute -right-16 -top-16 size-64 rounded-full bg-primary/5 blur-3xl"></div>
                    <div class="relative flex flex-col p-6 items-center text-center">
                        <div class="relative mb-6 flex items-center justify-center">
                            <div class="size-40 rounded-full border-[6px] border-slate-100 dark:border-white/10 flex items-center justify-center relative">
                                <svg class="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                                    <circle class="text-primary" cx="50" cy="50" fill="transparent" r="46"
                                        stroke="currentColor"
                                        stroke-dasharray="${290}"
                                        stroke-dashoffset="${290 - (stats.totalDue > 0 ? Math.min((stats.totalDue / 50) * 290, 290) : 0)}"
                                        stroke-linecap="round" stroke-width="8"></circle>
                                </svg>
                                <div class="flex flex-col items-center">
                                    <span class="text-5xl font-bold tracking-tighter">${stats.totalDue}</span>
                                    <span class="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Due</span>
                                </div>
                            </div>
                        </div>
                        <h3 class="text-lg font-bold mb-1">${stats.totalDue > 0 ? 'Time to review!' : 'All caught up!'}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[200px]">
                            ${stats.totalDue > 0 ? 'Keep your streak alive and master your vocabulary.' : 'Great job! Come back later for more reviews.'}
                        </p>
                        <button onclick="app.startStudySession()" class="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${stats.totalDue === 0 ? 'opacity-50 pointer-events-none' : ''}">
                            <span class="material-symbols-outlined">play_arrow</span>
                            Start Session
                        </button>
                    </div>
                </div>
            </section>

            <!-- Stats Row -->
            <section class="px-4 py-2">
                <div class="flex gap-4">
                    <div class="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-primary text-xl">calendar_month</span>
                            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Streak</p>
                        </div>
                        <p class="text-2xl font-bold">${stats.streak} Days</p>
                    </div>
                    <div class="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-blue-400 text-xl">school</span>
                            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Learned</p>
                        </div>
                        <p class="text-2xl font-bold">${stats.totalCardsLearned.toLocaleString()}</p>
                    </div>
                </div>
            </section>

            <!-- Quick Add Banner -->
            <section class="px-4 py-4">
                <button onclick="app.navigate('add-word')" class="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform active:scale-[0.98]">
                    <div class="flex flex-col items-start">
                        <span class="font-bold text-lg">New word?</span>
                        <span class="text-sm text-blue-100 opacity-90">Add it to your collection instantly.</span>
                    </div>
                    <div class="flex size-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                        <span class="material-symbols-outlined">add</span>
                    </div>
                </button>
            </section>

            <!-- Recent Collections -->
            <section class="mt-2">
                <div class="flex items-center justify-between px-4 pb-3">
                    <h3 class="text-lg font-bold leading-tight">Jump back in</h3>
                    <button onclick="app.navigate('collections')" class="text-sm font-medium text-primary hover:text-primary/80">View all</button>
                </div>
                <div class="flex overflow-x-auto no-scrollbar pb-4 pl-4 gap-4 snap-x">
                    ${collections.map(col => this.renderCollectionCard(col)).join('')}

                    <!-- Add New Collection Card -->
                    <button onclick="app.showCreateCollectionModal()" class="snap-start shrink-0 w-60 rounded-xl bg-surface-light dark:bg-surface-dark border-2 border-dashed border-slate-300 dark:border-white/10 overflow-hidden flex flex-col items-center justify-center h-[180px] hover:border-primary transition-colors group">
                        <div class="flex flex-col items-center gap-2">
                            <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <span class="material-symbols-outlined text-primary text-2xl">add</span>
                            </div>
                            <span class="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">Create Collection</span>
                        </div>
                    </button>
                </div>
            </section>
        `;
    },

    renderCollectionCard(col) {
        const progress = col.cardCount > 0 ? (col.mastered / col.cardCount) * 100 : 0;
        const progressColor = progress >= 75 ? 'bg-primary' : progress >= 50 ? 'bg-yellow-400' : 'bg-blue-400';

        return `
            <button onclick="app.openCollection('${col.id}')" class="snap-start shrink-0 w-60 rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col text-left hover:scale-[1.02] transition-transform active:scale-[0.98]">
                <div class="h-32 w-full bg-cover bg-center relative" style="background-image: url('${col.image}');">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span class="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-xs font-medium text-white border border-white/10">${col.emoji} ${col.name}</span>
                </div>
                <div class="p-3">
                    <h4 class="font-bold text-base mb-1 truncate">${col.name}</h4>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-slate-500 dark:text-slate-400">${col.dueCards} cards due</span>
                        <div class="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                            <div class="h-full ${progressColor} rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            </button>
        `;
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }
};

window.HomeScreen = HomeScreen;
