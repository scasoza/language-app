/**
 * DataStore Wrapper - Uses Supabase for persistence
 * Loads data from Supabase and keeps it in memory for fast access
 * Syncs back to Supabase on updates
 */

const DataStore = {
    // In-memory cache
    user: null,
    collections: [],
    cards: [],
    dialogues: [],
    onboarded: false,
    useSupabase: false,

    // Check if Supabase is available and user is authenticated
    canUseSupabase() {
        return this.useSupabase && SupabaseService && SupabaseService.initialized && SupabaseService.isAuthenticated();
    },

    // Initialize - load from Supabase
    async init() {
        console.log('Initializing DataStore...');

        // Use Supabase if it's initialized and user is authenticated
        this.useSupabase = SupabaseService && SupabaseService.initialized;

        if (this.canUseSupabase()) {
            console.log('Loading data from Supabase...');
            await this.loadFromSupabase();
        } else {
            console.log('Supabase not available, using localStorage');
            this.loadFromLocalStorage();
        }

        console.log(`DataStore initialized: ${this.collections.length} collections, ${this.cards.length} cards`);
    },

    async loadFromSupabase() {
        try {
            const timeout = (promise, ms) => Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase query timed out')), ms))
            ]);

            // Load user profile from Supabase profiles table
            const profile = await timeout(SupabaseService.getProfile(), 10000);
            if (profile) {
                this.user = profile;
                this.onboarded = profile.onboarded || false;
            } else {
                // No profile yet — new user, will be created during onboarding
                this.user = null;
                this.onboarded = false;
            }

            // Load collections, cards, and dialogues in parallel
            const [collections, cards, dialogues] = await timeout(Promise.all([
                SupabaseService.getCollections(),
                SupabaseService.getCards(),
                SupabaseService.getDialogues()
            ]), 10000);

            this.collections = collections;
            this.cards = cards.map(card => this.normalizeCard(card));
            this.dialogues = dialogues;
        } catch (error) {
            console.error('Error loading from Supabase:', error);
            this.loadFromLocalStorage();
        }
    },

    loadFromLocalStorage() {
        this.onboarded = localStorage.getItem('linguaflow_onboarded') === 'true';
        this.user = JSON.parse(localStorage.getItem('linguaflow_user') || 'null');
        this.collections = JSON.parse(localStorage.getItem('linguaflow_collections') || '[]');
        this.cards = JSON.parse(localStorage.getItem('linguaflow_cards') || '[]')
            .map(card => this.normalizeCard(card));
        this.dialogues = JSON.parse(localStorage.getItem('linguaflow_dialogues') || '[]');
    },

    saveToLocalStorage() {
        localStorage.setItem('linguaflow_onboarded', this.onboarded.toString());
        if (this.user) localStorage.setItem('linguaflow_user', JSON.stringify(this.user));
        localStorage.setItem('linguaflow_collections', JSON.stringify(this.collections));
        localStorage.setItem('linguaflow_cards', JSON.stringify(this.cards));
        localStorage.setItem('linguaflow_dialogues', JSON.stringify(this.dialogues));
    },

    normalizeCard(card) {
        if (!card) return card;
        const normalizedCard = { ...card };

        if (normalizedCard.difficulty == null) normalizedCard.difficulty = 2;
        if (normalizedCard.interval == null) normalizedCard.interval = 1;
        if (normalizedCard.easeFactor == null) normalizedCard.easeFactor = 2.5;
        if (normalizedCard.reviewCount == null) normalizedCard.reviewCount = 0;
        if (!normalizedCard.nextReview) normalizedCard.nextReview = new Date().toISOString();
        if (!Array.isArray(normalizedCard.questions)) normalizedCard.questions = [];

        return normalizedCard;
    },

    // User methods
    getUser() {
        if (!this.user) {
            return {
                name: 'Guest',
                level: 1,
                targetLanguage: 'Chinese',
                nativeLanguage: 'English',
                dailyGoal: 10,
                streak: 0,
                totalCardsLearned: 0,
                settings: {
                    darkMode: true,
                    audioAutoplay: true,
                    notifications: true,
                    excludedCollectionIds: []
                }
            };
        }

        // Ensure settings object has all default properties
        return {
            ...this.user,
            settings: {
                darkMode: true,
                audioAutoplay: true,
                notifications: true,
                excludedCollectionIds: [],
                ...this.user.settings
            }
        };
    },

    async updateUser(updates) {
        this.user = { ...this.getUser(), ...updates };

        // Always keep a local copy so settings (e.g. API key) survive transient sync failures.
        this.saveToLocalStorage();

        if (this.canUseSupabase()) {
            try {
                const syncedProfile = await SupabaseService.upsertProfile(this.user);
                if (syncedProfile) {
                    this.user = { ...this.user, ...syncedProfile };
                    this.saveToLocalStorage();
                }
            } catch (error) {
                console.error('Error syncing profile to Supabase:', error);
            }
        }

        return this.user;
    },

    isOnboarded() {
        return this.onboarded;
    },

    async setOnboarded(value = true) {
        this.onboarded = value;

        if (this.canUseSupabase()) {
            try {
                await SupabaseService.upsertProfile({ ...this.getUser(), onboarded: value });
            } catch (error) {
                console.error('Error syncing onboarded to Supabase:', error);
            }
        } else {
            this.saveToLocalStorage();
        }
    },

    // Collections methods
    getCollections() {
        return this.collections;
    },

    getCollection(id) {
        return this.collections.find(c => c.id === id);
    },

    async addCollection(collection) {
        let newCollection;

        if (this.canUseSupabase()) {
            newCollection = await SupabaseService.addCollection(collection);
            this.collections.push(newCollection);
        } else {
            newCollection = {
                id: 'col_' + Date.now(),
                cardCount: 0,
                mastered: 0,
                dueCards: 0,
                ...collection
            };
            this.collections.push(newCollection);
            this.saveToLocalStorage();
        }

        return newCollection;
    },

    async updateCollection(id, updates) {
        const index = this.collections.findIndex(c => c.id === id);
        if (index === -1) return null;

        this.collections[index] = { ...this.collections[index], ...updates };

        if (this.canUseSupabase()) {
            await SupabaseService.updateCollection(id, updates);
        } else {
            this.saveToLocalStorage();
        }

        return this.collections[index];
    },

    async deleteCollection(id) {
        this.collections = this.collections.filter(c => c.id !== id);
        this.cards = this.cards.filter(c => c.collectionId !== id);

        if (this.canUseSupabase()) {
            await SupabaseService.deleteCollection(id);
        } else {
            this.saveToLocalStorage();
        }
    },

    // Cards methods
    getCards(collectionId = null, excludedCollectionIds = []) {
        if (collectionId) {
            return this.cards.filter(c => c.collectionId === collectionId);
        }

        if (excludedCollectionIds.length === 0) {
            return this.cards;
        }

        return this.cards.filter(c => !excludedCollectionIds.includes(c.collectionId));
    },

    getCard(id) {
        return this.cards.find(c => c.id === id);
    },

    getDueCards(collectionId = null, excludedCollectionIds = []) {
        const now = new Date();
        let cards = this.cards.filter(c =>
            !c.nextReview || new Date(c.nextReview) <= now
        );

        if (collectionId) {
            cards = cards.filter(c => c.collectionId === collectionId);
        } else if (excludedCollectionIds.length > 0) {
            cards = cards.filter(c => !excludedCollectionIds.includes(c.collectionId));
        }

        return cards;
    },

    async addCard(card) {
        let newCard;

        if (this.canUseSupabase()) {
            newCard = await SupabaseService.addCard(card);
            this.cards.push(newCard);
        } else {
            newCard = {
                id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                difficulty: 2,
                interval: 1,
                easeFactor: 2.5,
                reviewCount: 0,
                nextReview: new Date().toISOString(),
                ...card
            };
            this.cards.push(newCard);
            this.saveToLocalStorage();
        }

        // Update collection card count
        await this.updateCollectionStats(card.collectionId);

        return newCard;
    },

    async updateCard(id, updates) {
        const index = this.cards.findIndex(c => c.id === id);
        if (index === -1) return null;

        this.cards[index] = { ...this.cards[index], ...updates };

        if (this.canUseSupabase()) {
            await SupabaseService.updateCard(id, updates);
        } else {
            this.saveToLocalStorage();
        }

        return this.cards[index];
    },

    async deleteCard(id) {
        const card = this.getCard(id);
        if (!card) return;

        this.cards = this.cards.filter(c => c.id !== id);

        if (this.canUseSupabase()) {
            await SupabaseService.deleteCard(id);
        } else {
            this.saveToLocalStorage();
        }

        // Update collection stats
        await this.updateCollectionStats(card.collectionId);
    },

    // Spaced repetition algorithm (SM-2 variant)
    async reviewCard(id, quality) {
        // quality: 0 = again, 1 = hard, 2 = good, 3 = easy
        const card = this.getCard(id);
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

        const updatedCard = await this.updateCard(id, {
            interval,
            easeFactor,
            reviewCount: reviewCount + 1,
            lastReview: new Date().toISOString(),
            nextReview: nextReview.toISOString()
        });

        await this.updateCollectionStats(card.collectionId);

        return updatedCard;
    },

    async updateCollectionStats(collectionId) {
        const cards = this.getCards(collectionId);
        const mastered = cards.filter(c => c.easeFactor >= 2.5).length;
        const dueCards = cards.filter(c =>
            !c.nextReview || new Date(c.nextReview) <= new Date()
        ).length;

        await this.updateCollection(collectionId, {
            cardCount: cards.length,
            mastered,
            dueCards
        });
    },

    // Dialogue methods
    async addDialogue(dialogue) {
        let newDialogue;

        if (this.canUseSupabase()) {
            newDialogue = await SupabaseService.addDialogue(dialogue);
            this.dialogues.push(newDialogue);
        } else {
            newDialogue = {
                id: 'dlg_' + Date.now(),
                createdAt: new Date().toISOString(),
                ...dialogue
            };
            this.dialogues.push(newDialogue);
            this.saveToLocalStorage();
        }

        return newDialogue;
    },

    getDialogues() {
        return this.dialogues;
    },

    // Statistics methods
    getTotalDueCards() {
        const excludedCollectionIds = this.getUser().settings?.excludedCollectionIds || [];
        return this.getDueCards(null, excludedCollectionIds).length;
    },

    getStats() {
        const user = this.getUser();
        const collections = this.getCollections();
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
    },

    // Reset all data
    async reset() {
        this.user = null;
        this.collections = [];
        this.cards = [];
        this.dialogues = [];
        this.onboarded = false;

        // Clear localStorage
        ['linguaflow_onboarded', 'linguaflow_user', 'linguaflow_collections',
         'linguaflow_cards', 'linguaflow_dialogues'].forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

window.DataStore = DataStore;
