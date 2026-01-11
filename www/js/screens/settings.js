/**
 * Settings/Profile Screen Component
 */

const SettingsScreen = {
    render() {
        console.log('SettingsScreen.render() called');
        const container = document.getElementById('screen-settings');

        if (!container) {
            console.error('screen-settings container not found!');
            return;
        }

        try {
            const user = DataStore.getUser();
            const stats = DataStore.getStats();
            const apiConfigured = GeminiService.isConfigured();

            container.innerHTML = `
            <!-- Top App Bar -->
            <header class="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 justify-between border-b border-slate-200 dark:border-slate-800">
                <button onclick="app.goBack()" class="text-slate-900 dark:text-white hover:text-primary transition-colors flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <span class="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 class="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Profile & Settings</h2>
                <div class="w-10"></div>
            </header>

            <main class="flex-1 overflow-y-auto pb-10">
                <!-- Profile Header -->
                <section class="flex p-6 flex-col items-center">
                    <div class="relative group cursor-pointer">
                        <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 ring-4 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/30 to-blue-500/30 flex items-center justify-center">
                            <span class="material-symbols-outlined text-5xl text-white/80">person</span>
                        </div>
                        <div class="absolute bottom-0 right-0 bg-primary text-background-dark p-1.5 rounded-full shadow-lg border-2 border-background-dark flex items-center justify-center">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </div>
                    </div>

                    <div class="flex flex-col items-center justify-center mt-4 gap-1">
                        <h1 class="text-2xl font-bold leading-tight">${user.name}</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium uppercase tracking-wider">Level ${user.level}</span>
                            <span class="w-1 h-1 rounded-full bg-slate-400"></span>
                            <span class="text-slate-500 dark:text-slate-400 text-sm font-medium">${user.targetLanguage} Learner</span>
                        </div>

                        <!-- Stats Badges -->
                        <div class="flex gap-3 mt-4 w-full justify-center">
                            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <span class="material-symbols-outlined text-orange-500 text-[18px]">local_fire_department</span>
                                <span class="text-orange-600 dark:text-orange-400 text-sm font-bold">${stats.streak} Day Streak</span>
                            </div>
                            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                <span class="material-symbols-outlined text-primary text-[18px]">style</span>
                                <span class="text-primary text-sm font-bold">${stats.totalCardsLearned.toLocaleString()} Cards</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- API Key Section -->
                <div class="px-4 mb-6">
                    <button onclick="app.showApiKeyModal()" class="w-full bg-gradient-to-r ${apiConfigured ? 'from-primary to-emerald-400' : 'from-amber-500 to-orange-500'} p-4 rounded-xl shadow-lg flex items-center justify-between text-background-dark hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer">
                        <div class="flex flex-col text-left">
                            <span class="font-bold text-lg leading-tight">${apiConfigured ? 'API Connected' : 'Setup API Key'}</span>
                            <span class="text-sm font-medium opacity-80">${apiConfigured ? 'Tap to change key' : 'Enable AI-powered features'}</span>
                        </div>
                        <div class="bg-white/20 p-2 rounded-full">
                            <span class="material-symbols-outlined text-2xl">${apiConfigured ? 'edit' : 'key'}</span>
                        </div>
                    </button>
                </div>

                <!-- Learning Goals Section -->
                <div class="px-4">
                    <h3 class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider px-2 mb-2">Learning Goals</h3>
                    <div class="bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                        <!-- Daily Goal Segmented Button -->
                        <div class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-primary">flag</span>
                                    <span class="font-medium">Daily Goal</span>
                                </div>
                            </div>
                            <div class="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-lg">
                                ${[10, 20, 30].map(goal => `
                                    <button onclick="SettingsScreen.setDailyGoal(${goal})" class="flex-1 py-2 text-sm font-medium rounded-md transition-all ${user.dailyGoal === goal
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}">${goal} Cards</button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Target Language -->
                        <button onclick="SettingsScreen.showLanguageSelector()" class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors w-full">
                            <div class="flex items-center gap-3">
                                <div class="bg-blue-500/10 p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-blue-500 text-[20px]">translate</span>
                                </div>
                                <span class="font-medium">Target Language</span>
                            </div>
                            <div class="flex items-center gap-2 text-slate-400">
                                <span class="text-sm font-semibold">${user.targetLanguage}</span>
                                <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                            </div>
                        </button>

                        <!-- Audio Auto-play -->
                        <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div class="flex items-center gap-3">
                                <div class="bg-purple-500/10 p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-purple-500 text-[20px]">volume_up</span>
                                </div>
                                <span class="font-medium">Audio Auto-play</span>
                            </div>
                            <div class="relative inline-block w-12 align-middle select-none">
                                <input type="checkbox" ${user.settings.audioAutoplay ? 'checked' : ''} onchange="SettingsScreen.toggleSetting('audioAutoplay')" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-slate-300 dark:border-slate-600 appearance-none cursor-pointer transition-all duration-300 ${user.settings.audioAutoplay ? 'right-0 border-primary' : 'left-0'}" />
                                <label class="toggle-label block overflow-hidden h-6 rounded-full ${user.settings.audioAutoplay ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'} cursor-pointer"></label>
                            </div>
                        </div>

                        <!-- Dark Mode -->
                        <div class="flex items-center justify-between p-4">
                            <div class="flex items-center gap-3">
                                <div class="bg-slate-500/10 p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-slate-500 text-[20px]">dark_mode</span>
                                </div>
                                <span class="font-medium">Dark Mode</span>
                            </div>
                            <div class="relative inline-block w-12 align-middle select-none">
                                <input type="checkbox" ${user.settings.darkMode ? 'checked' : ''} onchange="SettingsScreen.toggleDarkMode()" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-slate-300 dark:border-slate-600 appearance-none cursor-pointer transition-all duration-300 ${user.settings.darkMode ? 'right-0 border-primary' : 'left-0'}" />
                                <label class="toggle-label block overflow-hidden h-6 rounded-full ${user.settings.darkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'} cursor-pointer"></label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Account Section -->
                <div class="px-4 mt-6">
                    <h3 class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider px-2 mb-2">Account</h3>
                    <div class="bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                        <button onclick="SettingsScreen.editProfile()" class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors w-full group">
                            <div class="flex items-center gap-3">
                                <div class="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-300 text-[20px]">person</span>
                                </div>
                                <span class="font-medium">Edit Profile</span>
                            </div>
                            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary text-[20px]">chevron_right</span>
                        </button>

                        <button onclick="SettingsScreen.exportData()" class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors w-full group">
                            <div class="flex items-center gap-3">
                                <div class="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-300 text-[20px]">download</span>
                                </div>
                                <span class="font-medium">Export Data</span>
                            </div>
                            <span class="material-symbols-outlined text-slate-400 group-hover:text-primary text-[20px]">chevron_right</span>
                        </button>

                        <button onclick="SettingsScreen.resetData()" class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors w-full group">
                            <div class="flex items-center gap-3">
                                <div class="bg-red-500/10 p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-red-500 text-[20px]">delete</span>
                                </div>
                                <span class="font-medium text-red-500">Reset All Data</span>
                            </div>
                            <span class="material-symbols-outlined text-slate-400 group-hover:text-red-500 text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                <!-- Version Info -->
                <div class="mt-8 text-center">
                    <p class="text-xs text-slate-400 dark:text-slate-600 font-medium">LinguaFlow v1.0.0</p>
                    <p class="text-xs text-slate-400 dark:text-slate-600">Powered by Gemini AI</p>
                </div>
            </main>
        `;
        } catch (error) {
            console.error('Error rendering settings screen:', error);
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-screen p-6 text-center">
                    <div class="mb-8">
                        <span class="material-symbols-outlined text-6xl text-rose-400">error</span>
                    </div>
                    <h1 class="text-3xl font-bold mb-2">Settings Error</h1>
                    <p class="text-slate-400 mb-4 max-w-xs">Could not load settings.</p>
                    <p class="text-xs text-slate-500 mb-8 font-mono">${error.message || 'Unknown error'}</p>
                    <button onclick="app.navigate('home')" class="bg-primary text-background-dark font-bold py-4 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        <span class="material-symbols-outlined inline-block mr-2">home</span>
                        Back to Home
                    </button>
                </div>
            `;
        }
    },

    setDailyGoal(goal) {
        DataStore.updateUser({ dailyGoal: goal });
        this.render();
        app.showToast(`Daily goal set to ${goal} cards`, 'success');
    },

    toggleSetting(setting) {
        const user = DataStore.getUser();
        const newSettings = { ...user.settings, [setting]: !user.settings[setting] };
        DataStore.updateUser({ settings: newSettings });
        this.render();
    },

    toggleDarkMode() {
        const user = DataStore.getUser();
        const newSettings = { ...user.settings, darkMode: !user.settings.darkMode };
        DataStore.updateUser({ settings: newSettings });

        // Toggle class on HTML element
        document.documentElement.classList.toggle('dark', newSettings.darkMode);

        this.render();
    },

    showLanguageSelector() {
        const languages = ['Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Italian', 'Portuguese'];

        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Select Language</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="space-y-2">
                ${languages.map(lang => `
                    <button onclick="SettingsScreen.setLanguage('${lang}')" class="w-full p-4 bg-surface-light dark:bg-[#1a2e25] rounded-xl text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between">
                        <span class="font-medium">${lang}</span>
                        ${DataStore.getUser().targetLanguage === lang ? '<span class="material-symbols-outlined text-primary">check</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `);
    },

    setLanguage(language) {
        DataStore.updateUser({ targetLanguage: language });
        app.closeModal();
        this.render();
        app.showToast(`Target language set to ${language}`, 'success');
    },

    editProfile() {
        const user = DataStore.getUser();

        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Edit Profile</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Name</label>
                    <input type="text" id="profile-name" value="${user.name}" class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50" />
                </div>
                <button onclick="SettingsScreen.saveProfile()" class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl">
                    Save Changes
                </button>
            </div>
        `);
    },

    saveProfile() {
        const nameInput = document.getElementById('profile-name');
        if (nameInput && nameInput.value.trim()) {
            DataStore.updateUser({ name: nameInput.value.trim() });
            app.closeModal();
            this.render();
            app.showToast('Profile updated', 'success');
        }
    },

    exportData() {
        const data = {
            user: DataStore.getUser(),
            collections: DataStore.getCollections(),
            cards: DataStore.getCards(),
            dialogues: DataStore.getDialogues()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `linguaflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
        app.showToast('Data exported successfully', 'success');
    },

    resetData() {
        app.showModal(`
            <div class="text-center py-4">
                <div class="size-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-3xl text-red-500">warning</span>
                </div>
                <h3 class="text-xl font-bold mb-2">Reset All Data?</h3>
                <p class="text-gray-400 mb-6">This will delete all your collections, cards, and progress. This action cannot be undone.</p>
                <div class="flex gap-3">
                    <button onclick="app.closeModal()" class="flex-1 bg-surface-dark border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button onclick="SettingsScreen.confirmReset()" class="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors">
                        Reset
                    </button>
                </div>
            </div>
        `);
    },

    confirmReset() {
        DataStore.reset();
        app.closeModal();
        app.showToast('All data has been reset', 'success');
        app.navigate('onboarding');
    }
};

window.SettingsScreen = SettingsScreen;
