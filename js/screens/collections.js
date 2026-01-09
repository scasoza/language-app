/**
 * Collections Management Screen Component
 */

const CollectionsScreen = {
    filter: 'all',
    searchQuery: '',

    render() {
        const collections = this.getFilteredCollections();

        const container = document.getElementById('screen-collections');
        container.innerHTML = `
            <!-- Sticky Header Section -->
            <header class="sticky top-0 z-50 w-full bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 pb-2">
                <!-- Top Bar -->
                <div class="flex items-center justify-between px-4 pt-4 pb-2">
                    <h1 class="text-3xl font-bold tracking-tight">Collections</h1>
                    <button onclick="app.navigate('settings')" class="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <span class="material-symbols-outlined text-2xl">account_circle</span>
                    </button>
                </div>

                <!-- Search Bar -->
                <div class="px-4 py-2">
                    <label class="group flex items-center w-full h-12 rounded-xl bg-white dark:bg-[#224936] px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                        <span class="material-symbols-outlined text-slate-400 dark:text-[#90cbad]">search</span>
                        <input
                            id="collection-search"
                            type="text"
                            placeholder="Search decks..."
                            value="${this.searchQuery}"
                            oninput="CollectionsScreen.handleSearch(this.value)"
                            class="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-slate-400 dark:placeholder:text-[#90cbad] ml-2 h-full"
                        />
                    </label>
                </div>

                <!-- Filter Chips -->
                <div class="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
                    ${this.renderFilterChips()}
                </div>
            </header>

            <!-- Main Grid Content -->
            <main class="px-4 py-4">
                <div class="grid grid-cols-2 gap-4">
                    ${collections.map(col => this.renderCollectionCard(col)).join('')}

                    <!-- Add New Collection Card -->
                    <button onclick="app.showCreateCollectionModal()" class="group relative flex flex-col justify-center items-center overflow-hidden rounded-2xl bg-surface-dark aspect-[4/5] shadow-md hover:shadow-xl transition-all duration-300 ring-1 ring-white/5 hover:ring-primary/50 cursor-pointer border-2 border-dashed border-white/20 hover:border-primary">
                        <div class="flex flex-col items-center gap-3">
                            <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <span class="material-symbols-outlined text-primary text-3xl">add</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 group-hover:text-primary transition-colors">New Collection</span>
                        </div>
                    </button>
                </div>
            </main>

            <!-- FAB -->
            <div class="fixed bottom-24 right-4 z-40">
                <button onclick="app.showCreateCollectionModal()" class="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_0_15px_rgba(13,242,128,0.4)] text-background-dark hover:scale-110 transition-transform duration-200 active:scale-95">
                    <span class="material-symbols-outlined text-3xl font-bold">add</span>
                </button>
            </div>
        `;
    },

    renderFilterChips() {
        const filters = [
            { id: 'all', label: 'All' },
            { id: 'recent', label: 'Recently Studied' },
            { id: 'new', label: 'New' },
            { id: 'mastered', label: 'Mastered' }
        ];

        return filters.map(f => `
            <button
                onclick="CollectionsScreen.setFilter('${f.id}')"
                class="flex h-9 shrink-0 items-center justify-center rounded-full px-4 transition-all
                    ${this.filter === f.id
                        ? 'bg-primary shadow-sm shadow-primary/20'
                        : 'bg-white dark:bg-[#224936] border border-transparent hover:border-primary/50'}">
                <span class="${this.filter === f.id ? 'text-background-dark font-semibold' : 'text-slate-600 dark:text-white font-medium'} text-sm">${f.label}</span>
            </button>
        `).join('');
    },

    renderCollectionCard(col) {
        const progress = col.cardCount > 0 ? Math.round((col.mastered / col.cardCount) * 100) : 0;
        const progressText = progress === 0 ? 'Not started' : `${progress}% Mastered`;
        const progressOpacity = progress >= 75 ? '' : progress >= 50 ? '/80' : progress > 0 ? '/60' : '';

        return `
            <button onclick="app.openCollection('${col.id}')" class="group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-surface-dark aspect-[4/5] shadow-md hover:shadow-xl transition-all duration-300 ring-1 ring-white/5 hover:ring-primary/50 cursor-pointer text-left">
                <!-- Background Image -->
                <div class="absolute inset-0 z-0">
                    <img alt="${col.name}" class="h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110" src="${col.image}"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent"></div>
                </div>

                <!-- Edit Button (on hover) -->
                <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onclick="event.stopPropagation(); app.editCollection('${col.id}')" class="h-8 w-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-primary hover:text-background-dark transition-colors">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>

                <!-- Card Content -->
                <div class="relative z-10 p-4 w-full">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-2xl">${col.emoji}</span>
                    </div>
                    <h3 class="text-lg font-bold text-white leading-tight mb-1">${col.name}</h3>
                    <div class="flex items-center justify-between text-xs text-gray-300 mb-3 font-medium">
                        <span>${col.cardCount} Cards</span>
                        <span class="text-primary${progressOpacity}">${progressText}</span>
                    </div>
                    <!-- Progress Bar -->
                    <div class="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                        <div class="h-full rounded-full bg-primary ${progress >= 85 ? 'shadow-[0_0_10px_rgba(13,242,128,0.5)]' : ''}" style="width: ${progress}%"></div>
                    </div>
                </div>
            </button>
        `;
    },

    getFilteredCollections() {
        let collections = DataStore.getCollectionsSync();

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            collections = collections.filter(c =>
                c.name.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        switch (this.filter) {
            case 'recent':
                collections = collections
                    .filter(c => c.lastStudied)
                    .sort((a, b) => new Date(b.lastStudied) - new Date(a.lastStudied));
                break;
            case 'new':
                collections = collections.filter(c => !c.lastStudied || c.mastered === 0);
                break;
            case 'mastered':
                collections = collections.filter(c => {
                    const progress = c.cardCount > 0 ? (c.mastered / c.cardCount) : 0;
                    return progress >= 0.9;
                });
                break;
        }

        return collections;
    },

    setFilter(filter) {
        this.filter = filter;
        this.render();
    },

    handleSearch(query) {
        this.searchQuery = query;
        this.render();
        // Restore focus and cursor position
        const input = document.getElementById('collection-search');
        if (input) {
            input.focus();
            input.setSelectionRange(query.length, query.length);
        }
    }
};

window.CollectionsScreen = CollectionsScreen;
