/**
 * Collection Detail/Edit Screen Component
 */

const CollectionDetailScreen = {
    collectionId: null,
    isEditing: false,

    setCollection(id) {
        this.collectionId = id;
        this.isEditing = false;
    },

    render() {
        const container = document.getElementById('screen-collection-detail');
        const collection = DataStore.getCollection(this.collectionId);

        if (!collection) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-screen p-6">
                    <span class="material-symbols-outlined text-6xl text-slate-400 mb-4">error</span>
                    <p class="text-slate-400">Collection not found</p>
                    <button onclick="app.navigate('collections')" class="mt-4 px-6 py-2 bg-primary text-background-dark rounded-xl font-bold">
                        Back to Collections
                    </button>
                </div>
            `;
            return;
        }

        const cards = DataStore.getCards(this.collectionId);
        const dueCards = DataStore.getDueCards(this.collectionId);
        const progress = cards.length > 0 ? Math.round((collection.mastered / cards.length) * 100) : 0;

        container.innerHTML = `
            <div class="flex flex-col min-h-screen">
                <!-- Header with cover image -->
                <div class="relative h-48 bg-cover bg-center" style="background-image: url('${collection.image}')">
                    <div class="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent"></div>

                    <!-- Back button -->
                    <button onclick="app.navigate('collections')" class="absolute top-4 left-4 z-10 size-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <span class="material-symbols-outlined text-white">arrow_back</span>
                    </button>

                    <!-- Menu button -->
                    <button onclick="CollectionDetailScreen.showMenu()" class="absolute top-4 right-4 z-10 size-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <span class="material-symbols-outlined text-white">more_vert</span>
                    </button>

                    <!-- Collection info -->
                    <div class="absolute bottom-4 left-4 right-4 z-10">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-3xl">${collection.emoji}</span>
                            <h1 class="text-2xl font-bold text-white">${collection.name}</h1>
                        </div>
                        <p class="text-sm text-white/70">${cards.length} cards · ${dueCards.length} due</p>
                    </div>
                </div>

                <!-- Progress bar -->
                <div class="px-4 py-3 bg-surface-dark border-b border-white/5">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-slate-400 uppercase tracking-wider">Progress</span>
                        <span class="text-sm font-bold text-primary">${progress}%</span>
                    </div>
                    <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full bg-primary rounded-full transition-all" style="width: ${progress}%"></div>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="p-4 flex gap-3">
                    <button onclick="app.startStudySession('${collection.id}')" class="flex-1 bg-primary text-background-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${cards.length === 0 ? 'opacity-50 pointer-events-none' : ''}">
                        <span class="material-symbols-outlined">play_arrow</span>
                        Study Now
                    </button>
                    <button onclick="CollectionDetailScreen.addCard()" class="size-14 bg-surface-dark border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/5">
                        <span class="material-symbols-outlined text-primary">add</span>
                    </button>
                </div>

                <!-- Cards list -->
                <div class="flex-1 px-4 pb-24">
                    <div class="flex items-center justify-between mb-3">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400">Cards</h2>
                        <button onclick="CollectionDetailScreen.toggleEdit()" class="text-primary text-sm font-medium">
                            ${this.isEditing ? 'Done' : 'Edit'}
                        </button>
                    </div>

                    ${cards.length === 0 ? `
                        <div class="text-center py-12">
                            <span class="material-symbols-outlined text-5xl text-slate-500 mb-3">style</span>
                            <p class="text-slate-400 mb-4">No cards yet</p>
                            <button onclick="CollectionDetailScreen.addCard()" class="px-6 py-3 bg-primary text-background-dark rounded-xl font-bold inline-flex items-center gap-2">
                                <span class="material-symbols-outlined">add</span>
                                Add First Card
                            </button>
                        </div>
                    ` : `
                        <div class="space-y-2">
                            ${cards.map(card => this.renderCardItem(card)).join('')}
                        </div>
                    `}
                </div>

                <!-- FAB for adding cards -->
                <div class="fixed bottom-24 right-4 z-40">
                    <button onclick="CollectionDetailScreen.addCard()" class="flex size-14 items-center justify-center rounded-full bg-primary shadow-lg text-background-dark hover:scale-105 transition-transform">
                        <span class="material-symbols-outlined text-2xl">add</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderCardItem(card) {
        const masteryLevel = card.easeFactor >= 2.5 ? 'high' : card.easeFactor >= 2.0 ? 'medium' : 'low';
        const masteryColors = {
            high: 'bg-primary/20 text-primary',
            medium: 'bg-amber-500/20 text-amber-400',
            low: 'bg-slate-500/20 text-slate-400'
        };

        return `
            <div class="bg-surface-dark rounded-xl p-4 border border-white/5 flex items-center gap-3 ${this.isEditing ? 'pr-2' : ''}">
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-white truncate">${card.front}</p>
                    <p class="text-sm text-slate-400 truncate">${card.back}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded-lg text-xs font-medium ${masteryColors[masteryLevel]}">
                        ${masteryLevel === 'high' ? 'Mastered' : masteryLevel === 'medium' ? 'Learning' : 'New'}
                    </span>
                    ${this.isEditing ? `
                        <button onclick="CollectionDetailScreen.editCard('${card.id}')" class="size-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                            <span class="material-symbols-outlined text-sm text-slate-400">edit</span>
                        </button>
                        <button onclick="CollectionDetailScreen.deleteCard('${card.id}')" class="size-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20">
                            <span class="material-symbols-outlined text-sm text-red-400">delete</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    toggleEdit() {
        this.isEditing = !this.isEditing;
        this.render();
    },

    addCard() {
        AddWordScreen.presetCollectionId = this.collectionId;
        app.navigate('add-word');
    },

    editCard(cardId) {
        const card = DataStore.getCards().find(c => c.id === cardId);
        if (!card) return;

        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Edit Card</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Front</label>
                    <input type="text" id="edit-card-front" value="${card.front}" class="w-full bg-[#1a2e25] border border-white/10 rounded-xl px-4 py-3" />
                </div>
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Back</label>
                    <input type="text" id="edit-card-back" value="${card.back}" class="w-full bg-[#1a2e25] border border-white/10 rounded-xl px-4 py-3" />
                </div>
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Example</label>
                    <input type="text" id="edit-card-example" value="${card.example || ''}" class="w-full bg-[#1a2e25] border border-white/10 rounded-xl px-4 py-3" />
                </div>
                <button onclick="CollectionDetailScreen.saveCardEdit('${cardId}')" class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl">
                    Save Changes
                </button>
            </div>
        `);
    },

    saveCardEdit(cardId) {
        const front = document.getElementById('edit-card-front')?.value?.trim();
        const back = document.getElementById('edit-card-back')?.value?.trim();
        const example = document.getElementById('edit-card-example')?.value?.trim();

        if (front && back) {
            DataStore.updateCard(cardId, { front, back, example });
            app.closeModal();
            app.showToast('Card updated!', 'success');
            this.render();
        }
    },

    deleteCard(cardId) {
        if (confirm('Delete this card?')) {
            DataStore.deleteCard(cardId);
            app.showToast('Card deleted', 'success');
            this.render();
        }
    },

    showMenu() {
        const collection = DataStore.getCollection(this.collectionId);

        app.showModal(`
            <div class="space-y-2">
                <button onclick="CollectionDetailScreen.editCollectionInfo()" class="w-full p-4 bg-[#1a2e25] rounded-xl text-left flex items-center gap-3 hover:bg-white/5">
                    <span class="material-symbols-outlined text-slate-400">edit</span>
                    <span>Edit Collection Info</span>
                </button>
                <button onclick="CollectionDetailScreen.generateMoreCards()" class="w-full p-4 bg-[#1a2e25] rounded-xl text-left flex items-center gap-3 hover:bg-white/5">
                    <span class="material-symbols-outlined text-primary">auto_awesome</span>
                    <span>Generate More Cards with AI</span>
                </button>
                <button onclick="CollectionDetailScreen.resetProgress()" class="w-full p-4 bg-[#1a2e25] rounded-xl text-left flex items-center gap-3 hover:bg-white/5">
                    <span class="material-symbols-outlined text-amber-400">restart_alt</span>
                    <span>Reset Progress</span>
                </button>
                <button onclick="CollectionDetailScreen.deleteCollection()" class="w-full p-4 bg-red-500/10 rounded-xl text-left flex items-center gap-3 hover:bg-red-500/20">
                    <span class="material-symbols-outlined text-red-400">delete</span>
                    <span class="text-red-400">Delete Collection</span>
                </button>
            </div>
        `);
    },

    editCollectionInfo() {
        const collection = DataStore.getCollection(this.collectionId);
        app.closeModal();

        app.showModal(`
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Edit Collection</h3>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Name</label>
                    <input type="text" id="edit-collection-name" value="${collection.name}" class="w-full bg-[#1a2e25] border border-white/10 rounded-xl px-4 py-3" />
                </div>
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Emoji</label>
                    <input type="text" id="edit-collection-emoji" value="${collection.emoji}" maxlength="2" class="w-full bg-[#1a2e25] border border-white/10 rounded-xl px-4 py-3" />
                </div>
                <button onclick="CollectionDetailScreen.saveCollectionInfo()" class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl">
                    Save Changes
                </button>
            </div>
        `);
    },

    saveCollectionInfo() {
        const name = document.getElementById('edit-collection-name')?.value?.trim();
        const emoji = document.getElementById('edit-collection-emoji')?.value?.trim();

        if (name) {
            DataStore.updateCollection(this.collectionId, { name, emoji: emoji || '📚' });
            app.closeModal();
            app.showToast('Collection updated!', 'success');
            this.render();
        }
    },

    async generateMoreCards() {
        app.closeModal();

        if (!GeminiService.isConfigured()) {
            app.showApiKeyModal();
            return;
        }

        const collection = DataStore.getCollection(this.collectionId);
        app.showLoadingOverlay('Generating cards...', 'Creating flashcards with AI');

        try {
            const user = DataStore.getUserSync();
            const result = await GeminiService.generateCollection({
                topic: collection.name,
                targetLanguage: user.targetLanguage,
                nativeLanguage: user.nativeLanguage,
                cardCount: 5
            });

            if (result.cards && result.cards.length > 0) {
                result.cards.forEach(card => {
                    DataStore.addCard({
                        ...card,
                        collectionId: this.collectionId
                    });
                });
                app.hideLoadingOverlay();
                app.showToast(`Added ${result.cards.length} new cards!`, 'success');
                this.render();
            }
        } catch (error) {
            app.hideLoadingOverlay();
            app.showToast(error.message, 'error');
        }
    },

    resetProgress() {
        app.closeModal();
        if (confirm('Reset all card progress in this collection? Cards will be marked as new.')) {
            const cards = DataStore.getCards(this.collectionId);
            cards.forEach(card => {
                DataStore.updateCard(card.id, {
                    easeFactor: 2.5,
                    interval: 1,
                    nextReview: new Date().toISOString(),
                    reviewCount: 0
                });
            });
            DataStore.updateCollection(this.collectionId, { mastered: 0 });
            app.showToast('Progress reset!', 'success');
            this.render();
        }
    },

    deleteCollection() {
        app.closeModal();
        if (confirm('Delete this collection and all its cards? This cannot be undone.')) {
            // Delete all cards in collection
            const cards = DataStore.getCards(this.collectionId);
            cards.forEach(card => DataStore.deleteCard(card.id));

            // Delete collection
            DataStore.deleteCollection(this.collectionId);

            app.showToast('Collection deleted', 'success');
            app.navigate('collections');
        }
    }
};

window.CollectionDetailScreen = CollectionDetailScreen;
