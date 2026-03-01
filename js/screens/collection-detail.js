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

                    <!-- Big Study Button Overlay (if has cards) -->
                    ${cards.length > 0 && dueCards.length > 0 ? `
                        <button onclick="app.startStudySession('${collection.id}')" class="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-primary text-background-dark font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(13,242,128,0.6)] hover:scale-105 transition-transform">
                            <span class="material-symbols-outlined">play_arrow</span>
                            <span>Study ${dueCards.length} Card${dueCards.length !== 1 ? 's' : ''}</span>
                        </button>
                    ` : ''}

                    <!-- Collection info -->
                    <div class="absolute bottom-4 left-4 right-4 z-10">
                        <div class="flex items-center gap-2 mb-1">
                            <h1 class="text-2xl font-bold text-white">${collection.name}</h1>
                        </div>
                        <p class="text-sm text-white/70">${cards.length} cards${dueCards.length > 0 ? ` · ${dueCards.length} due` : ''}</p>
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

                <!-- Main Action buttons -->
                <div class="p-4 flex gap-3">
                    ${cards.length > 0 ? `
                        <button onclick="app.startStudySession('${collection.id}')" class="flex-1 bg-primary text-background-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(13,242,128,0.3)] hover:scale-[1.02] transition-transform ${dueCards.length === 0 ? 'opacity-50' : ''}">
                            <span class="material-symbols-outlined text-2xl">play_arrow</span>
                            <span class="text-lg">Study Now</span>
                        </button>
                    ` : ''}
                    <button onclick="CollectionDetailScreen.showAIEditModal()" class="${cards.length === 0 ? 'flex-1 bg-primary text-background-dark' : 'flex-1 bg-surface-dark border border-white/10 text-white'} py-4 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                        <span class="material-symbols-outlined ${cards.length === 0 ? 'text-2xl' : 'text-primary'}">edit_note</span>
                        <span class="${cards.length === 0 ? 'text-lg' : ''}">Add or Edit Cards</span>
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
                            <p class="text-slate-400">No cards yet — use the button above to add cards</p>
                        </div>
                    ` : `
                        <div class="space-y-2">
                            ${cards.map(card => this.renderCardItem(card)).join('')}
                        </div>
                    `}
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
            <div class="bg-surface-dark rounded-xl p-4 border border-white/5 flex items-center gap-3 ${this.isEditing ? 'pr-2' : ''}" data-card-id="${card.id}">
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-white truncate card-front">${card.front}</p>
                    <p class="text-sm text-slate-400 truncate card-back">${card.back}</p>
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
                <button onclick="CollectionDetailScreen.showAIEditModal()" class="w-full p-4 bg-[#1a2e25] rounded-xl text-left flex items-center gap-3 hover:bg-white/5">
                    <span class="material-symbols-outlined text-primary">edit_note</span>
                    <span>Add or Edit Cards</span>
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
                <button onclick="CollectionDetailScreen.saveCollectionInfo()" class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl">
                    Save Changes
                </button>
            </div>
        `);
    },

    saveCollectionInfo() {
        const name = document.getElementById('edit-collection-name')?.value?.trim();

        if (name) {
            DataStore.updateCollection(this.collectionId, { name });
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
        app.showLoadingOverlay('Generating cards...', 'Creating flashcards');

        try {
            const user = DataStore.getUser();
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
        if (confirm('Reset all card progress? Cards will be marked as new.') && confirm('Are you sure? This cannot be undone.')) {
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
    },

    showAIEditModal() {
        app.closeModal();

        const collection = DataStore.getCollection(this.collectionId);
        const cards = DataStore.getCards(this.collectionId);

        app.showModal(`
            <div class="flex items-center justify-between mb-3">
                <div>
                    <h3 class="text-lg font-bold">Add or Edit Cards</h3>
                    <p class="text-xs text-slate-500 mt-0.5">${collection.name} · ${cards.length} card${cards.length !== 1 ? 's' : ''}</p>
                </div>
                <button onclick="app.closeModal()" class="text-gray-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-4">
                <!-- Voice input - hero element -->
                <button id="ai-edit-audio-btn" onclick="CollectionDetailScreen.toggleEditAudioRecording()" class="w-full py-5 rounded-2xl bg-gradient-to-b from-primary/15 to-primary/5 border-2 border-primary/30 flex flex-col items-center justify-center gap-2 hover:from-primary/25 hover:to-primary/10 transition-all group">
                    <div class="size-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <span class="material-symbols-outlined text-primary text-3xl">mic</span>
                    </div>
                    <span class="text-sm font-semibold text-primary">Tap to speak</span>
                    <span class="text-xs text-slate-500">e.g. "Add 10 cards about greetings"</span>
                </button>

                <!-- Text input -->
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Or type instructions</label>
                    <textarea id="ai-edit-instructions" rows="3" placeholder="e.g., Add 20 restaurant cards, remove greeting cards, fix translations..." class="w-full bg-surface-light dark:bg-[#1a2e25] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 resize-none"></textarea>
                    <div id="ai-edit-preview" class="mt-2 flex flex-wrap gap-2"></div>
                </div>

                <!-- Quick action hints -->
                <div class="flex flex-wrap gap-2">
                    <button onclick="document.getElementById('ai-edit-instructions').value='Add 10 more cards'" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-primary/30 transition-colors">Add cards</button>
                    <button onclick="document.getElementById('ai-edit-instructions').value='Remove all cards about '" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-primary/30 transition-colors">Remove cards</button>
                    <button onclick="document.getElementById('ai-edit-instructions').value='Fix the translations for all cards'" class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-primary/30 transition-colors">Fix translations</button>
                </div>

                <!-- Image upload - secondary -->
                <button id="ai-edit-image-btn" onclick="document.getElementById('ai-edit-image-input').click()" class="w-full py-3 rounded-xl bg-surface-dark border border-white/10 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-sm">
                    <span class="material-symbols-outlined text-slate-400 text-lg">image</span>
                    <span class="text-slate-400">Attach Image</span>
                </button>
                <input type="file" id="ai-edit-image-input" accept="image/*" class="hidden" onchange="CollectionDetailScreen.handleEditImageUpload(event)" />

                <button onclick="CollectionDetailScreen.processAIEdit()" class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
                    Apply
                </button>
            </div>
        `);

        // Initialize temporary storage for this modal
        this.editAudioData = null;
        this.editImageData = null;
    },

    async toggleEditAudioRecording() {
        if (this.isEditRecording) {
            await this.stopEditAudioRecording();
        } else {
            await this.startEditAudioRecording();
        }
    },

    async startEditAudioRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.editMediaRecorder = new MediaRecorder(stream);
            this.editAudioChunks = [];

            this.editMediaRecorder.ondataavailable = (event) => {
                this.editAudioChunks.push(event.data);
            };

            this.editMediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.editAudioChunks, { type: 'audio/wav' });
                const reader = new FileReader();

                reader.onloadend = () => {
                    this.editAudioData = reader.result;
                    this.updateEditPreview();
                };

                reader.readAsDataURL(audioBlob);

                // Clean up
                stream.getTracks().forEach(track => track.stop());
            };

            this.editMediaRecorder.start();
            this.isEditRecording = true;

            const recordBtn = document.getElementById('ai-edit-audio-btn');
            if (recordBtn) {
                recordBtn.classList.add('border-red-500', 'animate-pulse');
                recordBtn.classList.remove('border-primary/30');
                const icon = recordBtn.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.classList.add('text-red-500');
                    icon.classList.remove('text-primary');
                    icon.textContent = 'stop_circle';
                }
                const label = recordBtn.querySelector('.font-semibold');
                if (label) {
                    label.textContent = 'Recording... Tap to stop';
                    label.classList.add('text-red-400');
                    label.classList.remove('text-primary');
                }
            }

            app.showToast('Recording...', 'info');
        } catch (error) {
            console.error('Audio recording error:', error);
            app.showToast('Failed to access microphone', 'error');
        }
    },

    async stopEditAudioRecording() {
        if (this.editMediaRecorder && this.isEditRecording) {
            this.editMediaRecorder.stop();
            this.isEditRecording = false;

            const recordBtn = document.getElementById('ai-edit-audio-btn');
            if (recordBtn) {
                recordBtn.classList.remove('border-red-500', 'animate-pulse');
                recordBtn.classList.add('border-primary/30');
                const icon = recordBtn.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.classList.remove('text-red-500');
                    icon.classList.add('text-primary');
                    icon.textContent = 'mic';
                }
                const label = recordBtn.querySelector('.font-semibold, .text-red-400');
                if (label) {
                    label.textContent = 'Tap to speak';
                    label.classList.remove('text-red-400');
                    label.classList.add('text-primary');
                }
            }

            app.showToast('Audio recorded!', 'success');
        }
    },

    handleEditImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            app.showToast('Please select an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            this.editImageData = reader.result;
            this.updateEditPreview();
            app.showToast('Image uploaded!', 'success');
        };
        reader.readAsDataURL(file);
    },

    updateEditPreview() {
        const previewContainer = document.getElementById('ai-edit-preview');
        if (!previewContainer) return;

        let previewHTML = '';

        if (this.editAudioData) {
            previewHTML += `
                <div class="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
                    <span class="material-symbols-outlined text-primary text-sm">mic</span>
                    <span class="text-xs font-medium">Audio recorded</span>
                    <button onclick="CollectionDetailScreen.removeEditAudio()" class="ml-2 text-gray-400 hover:text-red-500">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            `;
        }

        if (this.editImageData) {
            previewHTML += `
                <div class="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30">
                    <span class="material-symbols-outlined text-primary text-sm">image</span>
                    <span class="text-xs font-medium">Image uploaded</span>
                    <button onclick="CollectionDetailScreen.removeEditImage()" class="ml-2 text-gray-400 hover:text-red-500">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            `;
        }

        previewContainer.innerHTML = previewHTML;
    },

    removeEditAudio() {
        this.editAudioData = null;
        this.updateEditPreview();
        app.showToast('Audio removed', 'info');
    },

    removeEditImage() {
        this.editImageData = null;
        document.getElementById('ai-edit-image-input').value = '';
        this.updateEditPreview();
        app.showToast('Image removed', 'info');
    },

    async processAIEdit() {
        const instructions = document.getElementById('ai-edit-instructions')?.value?.trim();
        const audioData = this.editAudioData;
        const imageData = this.editImageData;

        // Validate inputs
        if (imageData && !audioData && !instructions) {
            app.showToast('Images cannot be used alone. Please provide text or audio.', 'error');
            return;
        }

        if (!instructions && !audioData && !imageData) {
            app.showToast('Please provide instructions, audio, or images', 'error');
            return;
        }

        if (!GeminiService.isConfigured()) {
            app.closeModal();
            app.showApiKeyModal();
            return;
        }

        app.closeModal();

        // Show non-blocking inline status banner instead of full-screen overlay
        this.showEditStatusBanner('Processing your changes...');

        try {
            const user = DataStore.getUser();
            const result = await GeminiService.editCollectionWithAI({
                collectionId: this.collectionId,
                instructions,
                audio: audioData,
                image: imageData,
                text: instructions,
                targetLanguage: user.targetLanguage,
                nativeLanguage: user.nativeLanguage
            });

            console.log('AI edit result:', result);

            // Apply changes based on AI response
            if (result.collectionUpdates && Object.keys(result.collectionUpdates).length > 0) {
                DataStore.updateCollection(this.collectionId, result.collectionUpdates);
            }

            // Remove cards if specified
            let removedCount = 0;
            if (result.removeCardIds && result.removeCardIds.length > 0) {
                result.removeCardIds.forEach(cardId => {
                    DataStore.deleteCard(cardId);
                    removedCount++;
                });
                // Remove card elements from DOM
                this.removeCardElements(result.removeCardIds);
            }

            // Add or modify cards
            let addedCount = 0;
            let modifiedCount = 0;
            if (result.cards && result.cards.length > 0) {
                if (result.action === 'modify') {
                    result.cards.forEach(card => {
                        if (card.cardId) {
                            DataStore.updateCard(card.cardId, card);
                            modifiedCount++;
                        }
                    });
                    // Update modified card elements in-place
                    this.updateCardElements(result.cards);
                } else {
                    result.cards.forEach(card => {
                        DataStore.addCard({
                            ...card,
                            collectionId: this.collectionId
                        });
                        addedCount++;
                    });
                    // Append new card elements to DOM
                    this.appendCardElements();
                }
            }

            // For mixed actions, just re-render the card list
            if (result.action === 'mixed') {
                this.refreshCardList();
            }

            this.hideEditStatusBanner();
            this.updateProgressBar();

            // Build descriptive toast
            const parts = [];
            if (addedCount > 0) parts.push(`${addedCount} added`);
            if (modifiedCount > 0) parts.push(`${modifiedCount} modified`);
            if (removedCount > 0) parts.push(`${removedCount} removed`);
            app.showToast(parts.length > 0 ? `Cards: ${parts.join(', ')}` : 'No changes needed', 'success');
        } catch (error) {
            this.hideEditStatusBanner();
            app.showToast(error.message, 'error');
        }
    },

    // --- Non-blocking status banner ---
    showEditStatusBanner(message) {
        // Remove existing banner if any
        this.hideEditStatusBanner();

        const container = document.getElementById('screen-collection-detail');
        const banner = document.createElement('div');
        banner.id = 'edit-status-banner';
        banner.className = 'fixed top-0 left-0 right-0 z-50 lg:left-72';
        banner.innerHTML = `
            <div class="mx-4 mt-4 px-4 py-3 rounded-xl bg-surface-dark border border-primary/30 flex items-center gap-3 shadow-lg backdrop-blur-sm">
                <div class="spinner shrink-0"></div>
                <span class="text-sm font-medium" id="edit-status-text">${message}</span>
            </div>
        `;
        container.appendChild(banner);
    },

    hideEditStatusBanner() {
        const banner = document.getElementById('edit-status-banner');
        if (banner) {
            banner.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => banner.remove(), 300);
        }
    },

    // --- Live DOM updates for cards ---
    removeCardElements(cardIds) {
        const listContainer = document.querySelector('#screen-collection-detail .space-y-2');
        if (!listContainer) return;

        cardIds.forEach(id => {
            const el = listContainer.querySelector(`[data-card-id="${id}"]`);
            if (el) {
                el.classList.add('opacity-0', 'scale-95', 'transition-all', 'duration-300');
                setTimeout(() => el.remove(), 300);
            }
        });

        // Update header card count
        this.updateCardCount();
    },

    updateCardElements(cards) {
        cards.forEach(card => {
            if (!card.cardId) return;
            const el = document.querySelector(`[data-card-id="${card.cardId}"]`);
            if (!el) return;

            const frontEl = el.querySelector('.card-front');
            const backEl = el.querySelector('.card-back');
            if (frontEl && card.front) frontEl.textContent = card.front;
            if (backEl && card.back) backEl.textContent = card.back;

            // Flash highlight
            el.classList.add('ring-2', 'ring-primary/50');
            setTimeout(() => el.classList.remove('ring-2', 'ring-primary/50'), 2000);
        });
    },

    appendCardElements() {
        const cards = DataStore.getCards(this.collectionId);
        const listContainer = document.querySelector('#screen-collection-detail .space-y-2');
        const emptyState = document.querySelector('#screen-collection-detail .text-center.py-12');

        // If there was an empty state, replace the card list section entirely
        if (emptyState || !listContainer) {
            this.refreshCardList();
            return;
        }

        // Find cards not yet rendered (they won't have matching DOM elements)
        const existingIds = new Set(
            Array.from(listContainer.querySelectorAll('[data-card-id]'))
                .map(el => el.dataset.cardId)
        );

        cards.forEach(card => {
            if (existingIds.has(card.id)) return;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = this.renderCardItem(card);
            const newEl = wrapper.firstElementChild;
            newEl.classList.add('opacity-0', 'translate-y-2');
            listContainer.appendChild(newEl);

            // Animate in
            requestAnimationFrame(() => {
                newEl.classList.add('transition-all', 'duration-300');
                newEl.classList.remove('opacity-0', 'translate-y-2');
            });
        });

        this.updateCardCount();
    },

    refreshCardList() {
        const cards = DataStore.getCards(this.collectionId);
        const cardSection = document.querySelector('#screen-collection-detail .flex-1.px-4.pb-24');
        if (!cardSection) return;

        cardSection.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400">Cards</h2>
                <button onclick="CollectionDetailScreen.toggleEdit()" class="text-primary text-sm font-medium">
                    ${this.isEditing ? 'Done' : 'Edit'}
                </button>
            </div>
            ${cards.length === 0 ? `
                <div class="text-center py-12">
                    <span class="material-symbols-outlined text-5xl text-slate-500 mb-3">style</span>
                    <p class="text-slate-400">No cards yet — use the button above to add cards</p>
                </div>
            ` : `
                <div class="space-y-2">
                    ${cards.map(card => this.renderCardItem(card)).join('')}
                </div>
            `}
        `;

        this.updateCardCount();
    },

    updateCardCount() {
        const cards = DataStore.getCards(this.collectionId);
        const dueCards = DataStore.getDueCards(this.collectionId);
        const countEl = document.querySelector('#screen-collection-detail .text-white\\/70');
        if (countEl) {
            countEl.textContent = `${cards.length} cards${dueCards.length > 0 ? ` · ${dueCards.length} due` : ''}`;
        }
    },

    updateProgressBar() {
        const collection = DataStore.getCollection(this.collectionId);
        const cards = DataStore.getCards(this.collectionId);
        const progress = cards.length > 0 ? Math.round((collection.mastered / cards.length) * 100) : 0;

        const progressBar = document.querySelector('#screen-collection-detail .h-2.bg-white\\/10 .h-full');
        const progressText = document.querySelector('#screen-collection-detail .text-primary');
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}%`;
    }
};

window.CollectionDetailScreen = CollectionDetailScreen;
