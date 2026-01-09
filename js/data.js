/**
 * Data Management for LinguaFlow
 * Uses Supabase when available, falls back to localStorage
 */

const DataStore = {
    // Flag for backend mode
    useSupabase: false,

    // Default user data
    defaultUser: {
        id: 'user_1',
        name: 'Learner',
        level: 1,
        targetLanguage: 'Spanish',
        nativeLanguage: 'English',
        streak: 0,
        totalCardsLearned: 0,
        dailyGoal: 20,
        settings: {
            audioAutoplay: false,
            hapticFeedback: true,
            darkMode: true,
            reminderTime: '20:00',
            streakFreezeAlerts: true
        },
        createdAt: new Date().toISOString()
    },

    // Default collections (empty for new users)
    defaultCollections: [],

    // Default flashcards
    defaultCards: [],

    // Generated dialogues storage
    defaultDialogues: [],

    // Initialize data store
    async init() {
        // Try to initialize Supabase
        if (window.SupabaseService) {
            const supabaseReady = await SupabaseService.init();
            this.useSupabase = supabaseReady && SupabaseService.isAuthenticated();
        }

        // If no Supabase or not authenticated, use localStorage
        if (!this.useSupabase) {
            if (!localStorage.getItem('linguaflow_initialized')) {
                this.resetLocal();
            }
        }

        return this;
    },

    // Check if using cloud storage
    isCloudEnabled() {
        return this.useSupabase;
    },

    // Reset localStorage to defaults
    resetLocal() {
        localStorage.setItem('linguaflow_user', JSON.stringify(this.defaultUser));
        localStorage.setItem('linguaflow_collections', JSON.stringify(this.defaultCollections));
        localStorage.setItem('linguaflow_cards', JSON.stringify(this.defaultCards));
        localStorage.setItem('linguaflow_dialogues', JSON.stringify(this.defaultDialogues));
        localStorage.setItem('linguaflow_initialized', 'true');
        localStorage.setItem('linguaflow_onboarded', 'false');
    },

    // Sync localStorage data to Supabase (for migration)
    async syncToCloud() {
        if (!this.useSupabase) return false;

        try {
            // Get local data
            const localUser = JSON.parse(localStorage.getItem('linguaflow_user'));
            const localCollections = JSON.parse(localStorage.getItem('linguaflow_collections')) || [];
            const localCards = JSON.parse(localStorage.getItem('linguaflow_cards')) || [];

            // Update profile
            if (localUser) {
                await SupabaseService.updateProfile({
                    name: localUser.name,
                    targetLanguage: localUser.targetLanguage,
                    nativeLanguage: localUser.nativeLanguage,
                    streak: localUser.streak,
                    totalCardsLearned: localUser.totalCardsLearned,
                    dailyGoal: localUser.dailyGoal,
                    settings: localUser.settings,
                    onboarded: true
                });
            }

            // Migrate collections and cards
            const collectionIdMap = {};
            for (const col of localCollections) {
                const newCol = await SupabaseService.addCollection({
                    name: col.name,
                    emoji: col.emoji,
                    image: col.image
                });
                collectionIdMap[col.id] = newCol.id;
            }

            // Migrate cards
            for (const card of localCards) {
                const newCollectionId = collectionIdMap[card.collectionId];
                if (newCollectionId) {
                    await SupabaseService.addCard({
                        ...card,
                        collectionId: newCollectionId
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('Sync to cloud failed:', error);
            return false;
        }
    },

    // ==================== USER METHODS ====================

    async getUser() {
        if (this.useSupabase) {
            const profile = await SupabaseService.getProfile();
            return profile || this.defaultUser;
        }
        return JSON.parse(localStorage.getItem('linguaflow_user')) || this.defaultUser;
    },

    // Sync version for places that can't use async
    getUserSync() {
        return JSON.parse(localStorage.getItem('linguaflow_user')) || this.defaultUser;
    },

    async updateUser(updates) {
        if (this.useSupabase) {
            const updated = await SupabaseService.updateProfile(updates);
            // Also update local cache
            const local = this.getUserSync();
            localStorage.setItem('linguaflow_user', JSON.stringify({ ...local, ...updates }));
            return updated;
        }
        const user = this.getUserSync();
        const updated = { ...user, ...updates };
        localStorage.setItem('linguaflow_user', JSON.stringify(updated));
        return updated;
    },

    isOnboarded() {
        if (this.useSupabase) {
            // Check localStorage cache first for faster response
            const cached = localStorage.getItem('linguaflow_onboarded');
            if (cached === 'true') return true;
        }
        return localStorage.getItem('linguaflow_onboarded') === 'true';
    },

    async setOnboarded(value = true) {
        localStorage.setItem('linguaflow_onboarded', value.toString());
        if (this.useSupabase) {
            await SupabaseService.updateProfile({ onboarded: value });
        }
    },

    // ==================== COLLECTIONS METHODS ====================

    async getCollections() {
        if (this.useSupabase) {
            return await SupabaseService.getCollections();
        }
        return JSON.parse(localStorage.getItem('linguaflow_collections')) || [];
    },

    // Sync version
    getCollectionsSync() {
        return JSON.parse(localStorage.getItem('linguaflow_collections')) || [];
    },

    async getCollection(id) {
        if (this.useSupabase) {
            return await SupabaseService.getCollection(id);
        }
        return this.getCollectionsSync().find(c => c.id === id);
    },

    async addCollection(collection) {
        if (this.useSupabase) {
            return await SupabaseService.addCollection(collection);
        }

        const collections = this.getCollectionsSync();
        const newCollection = {
            id: 'col_' + Date.now(),
            cardCount: 0,
            mastered: 0,
            dueCards: 0,
            lastStudied: null,
            createdAt: new Date().toISOString(),
            ...collection
        };
        collections.push(newCollection);
        localStorage.setItem('linguaflow_collections', JSON.stringify(collections));
        return newCollection;
    },

    async updateCollection(id, updates) {
        if (this.useSupabase) {
            return await SupabaseService.updateCollection(id, updates);
        }

        const collections = this.getCollectionsSync();
        const index = collections.findIndex(c => c.id === id);
        if (index !== -1) {
            collections[index] = { ...collections[index], ...updates };
            localStorage.setItem('linguaflow_collections', JSON.stringify(collections));
            return collections[index];
        }
        return null;
    },

    async deleteCollection(id) {
        if (this.useSupabase) {
            return await SupabaseService.deleteCollection(id);
        }

        const collections = this.getCollectionsSync().filter(c => c.id !== id);
        localStorage.setItem('linguaflow_collections', JSON.stringify(collections));
        // Also delete associated cards
        const cards = this.getCardsSync().filter(c => c.collectionId !== id);
        localStorage.setItem('linguaflow_cards', JSON.stringify(cards));
        return true;
    },

    // ==================== CARDS METHODS ====================

    async getCards(collectionId = null) {
        if (this.useSupabase) {
            return await SupabaseService.getCards(collectionId);
        }

        const cards = JSON.parse(localStorage.getItem('linguaflow_cards')) || [];
        if (collectionId) {
            return cards.filter(c => c.collectionId === collectionId);
        }
        return cards;
    },

    // Sync version
    getCardsSync(collectionId = null) {
        const cards = JSON.parse(localStorage.getItem('linguaflow_cards')) || [];
        if (collectionId) {
            return cards.filter(c => c.collectionId === collectionId);
        }
        return cards;
    },

    async getCard(id) {
        if (this.useSupabase) {
            return await SupabaseService.getCard(id);
        }
        return this.getCardsSync().find(c => c.id === id);
    },

    async getDueCards(collectionId = null) {
        if (this.useSupabase) {
            return await SupabaseService.getDueCards(collectionId);
        }

        const now = new Date();
        return this.getCardsSync(collectionId).filter(card => {
            const nextReview = new Date(card.nextReview);
            return nextReview <= now;
        });
    },

    getTotalDueCards() {
        const now = new Date();
        return this.getCardsSync().filter(card => {
            const nextReview = new Date(card.nextReview);
            return nextReview <= now;
        }).length;
    },

    async addCard(card) {
        if (this.useSupabase) {
            return await SupabaseService.addCard(card);
        }

        const cards = this.getCardsSync();
        const newCard = {
            id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            difficulty: 2,
            nextReview: new Date().toISOString(),
            lastReview: null,
            interval: 1,
            easeFactor: 2.5,
            reviewCount: 0,
            createdAt: new Date().toISOString(),
            ...card
        };
        cards.push(newCard);
        localStorage.setItem('linguaflow_cards', JSON.stringify(cards));

        // Update collection card count
        if (card.collectionId) {
            const collection = this.getCollectionsSync().find(c => c.id === card.collectionId);
            if (collection) {
                await this.updateCollection(card.collectionId, {
                    cardCount: collection.cardCount + 1,
                    dueCards: collection.dueCards + 1
                });
            }
        }

        return newCard;
    },

    async updateCard(id, updates) {
        if (this.useSupabase) {
            return await SupabaseService.updateCard(id, updates);
        }

        const cards = this.getCardsSync();
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
            cards[index] = { ...cards[index], ...updates };
            localStorage.setItem('linguaflow_cards', JSON.stringify(cards));
            return cards[index];
        }
        return null;
    },

    async deleteCard(id) {
        if (this.useSupabase) {
            return await SupabaseService.deleteCard(id);
        }

        const cards = this.getCardsSync();
        const card = cards.find(c => c.id === id);
        if (card) {
            const filtered = cards.filter(c => c.id !== id);
            localStorage.setItem('linguaflow_cards', JSON.stringify(filtered));

            // Update collection card count
            if (card.collectionId) {
                const collection = this.getCollectionsSync().find(c => c.id === card.collectionId);
                if (collection) {
                    await this.updateCollection(card.collectionId, {
                        cardCount: Math.max(0, collection.cardCount - 1)
                    });
                }
            }
            return true;
        }
        return false;
    },

    // Spaced repetition algorithm (SM-2 variant)
    async reviewCard(id, quality) {
        // quality: 0 = again, 1 = hard, 2 = good, 3 = easy
        const card = this.useSupabase
            ? await SupabaseService.getCard(id)
            : this.getCardsSync().find(c => c.id === id);

        if (!card) return null;

        let { interval, easeFactor, reviewCount } = card;

        // Adjust ease factor based on quality
        if (quality === 0) {
            // Again - reset
            interval = 1;
            easeFactor = Math.max(1.3, easeFactor - 0.2);
        } else if (quality === 1) {
            // Hard
            interval = Math.max(1, Math.round(interval * 1.2));
            easeFactor = Math.max(1.3, easeFactor - 0.15);
        } else if (quality === 2) {
            // Good
            if (reviewCount === 0) {
                interval = 1;
            } else if (reviewCount === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
        } else if (quality === 3) {
            // Easy
            if (reviewCount === 0) {
                interval = 4;
            } else {
                interval = Math.round(interval * easeFactor * 1.3);
            }
            easeFactor = easeFactor + 0.15;
        }

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        return await this.updateCard(id, {
            interval,
            easeFactor,
            reviewCount: reviewCount + 1,
            lastReview: new Date().toISOString(),
            nextReview: nextReview.toISOString()
        });
    },

    // ==================== DIALOGUES METHODS ====================

    async getDialogues() {
        if (this.useSupabase) {
            return await SupabaseService.getDialogues();
        }
        return JSON.parse(localStorage.getItem('linguaflow_dialogues')) || [];
    },

    getDialoguesSync() {
        return JSON.parse(localStorage.getItem('linguaflow_dialogues')) || [];
    },

    async addDialogue(dialogue) {
        if (this.useSupabase) {
            return await SupabaseService.addDialogue(dialogue);
        }

        const dialogues = this.getDialoguesSync();
        const newDialogue = {
            id: 'dlg_' + Date.now(),
            createdAt: new Date().toISOString(),
            ...dialogue
        };
        dialogues.push(newDialogue);
        localStorage.setItem('linguaflow_dialogues', JSON.stringify(dialogues));
        return newDialogue;
    },

    // ==================== STATISTICS ====================

    async getStats() {
        const user = this.useSupabase ? await this.getUser() : this.getUserSync();
        const collections = this.useSupabase ? await this.getCollections() : this.getCollectionsSync();
        const totalDue = this.getTotalDueCards();

        const totalMastered = collections.reduce((sum, c) => sum + (c.mastered || 0), 0);
        const totalCards = collections.reduce((sum, c) => sum + (c.cardCount || 0), 0);

        return {
            streak: user.streak || 0,
            totalCardsLearned: user.totalCardsLearned || 0,
            totalCollections: collections.length,
            totalCards,
            totalMastered,
            totalDue,
            masteryPercent: totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0
        };
    }

    getStatsSync() {
        const user = this.getUserSync();
        const collections = this.getCollectionsSync();
        const totalDue = this.getTotalDueCards();

        const totalMastered = collections.reduce((sum, c) => sum + (c.mastered || 0), 0);
        const totalCards = collections.reduce((sum, c) => sum + (c.cardCount || 0), 0);

        return {
            streak: user.streak || 0,
            totalCardsLearned: user.totalCardsLearned || 0,
            totalCollections: collections.length,
            totalCards,
            totalMastered,
            totalDue,
            masteryPercent: totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0
        };
    }
};

// Note: init() is now async and called from app.js
window.DataStore = DataStore;
