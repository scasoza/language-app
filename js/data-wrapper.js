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

    // Initialize - load from Supabase
    async init() {
        console.log('📦 Initializing DataStore...');

        // Check if Supabase is configured
        this.useSupabase = SupabaseService && SupabaseService.initialized;

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
            console.log('✅ Loading data from Supabase...');
            await this.loadFromSupabase();
        } else {
            console.log('⚠️ Supabase not authenticated, using localStorage');
            this.loadFromLocalStorage();
        }

        console.log('✅ DataStore initialized');
    },

    async loadFromSupabase() {
        try {
            // Load user profile
            this.user = await SupabaseService.getProfile();
            if (this.user) {
                this.onboarded = this.user.onboarded;
            }

            // Load collections
            this.collections = await SupabaseService.getCollections();

            // Load cards
            this.cards = await SupabaseService.getCards();

            // Load dialogues
            this.dialogues = await SupabaseService.getDialogues();
        } catch (error) {
            console.error('Error loading from Supabase:', error);
            this.loadFromLocalStorage();
        }
    },

    loadFromLocalStorage() {
        this.onboarded = localStorage.getItem('linguaflow_onboarded') === 'true';
        this.user = JSON.parse(localStorage.getItem('linguaflow_user') || 'null');
        this.collections = JSON.parse(localStorage.getItem('linguaflow_collections') || '[]');
        this.cards = JSON.parse(localStorage.getItem('linguaflow_cards') || '[]');
        this.dialogues = JSON.parse(localStorage.getItem('linguaflow_dialogues') || '[]');
    },

    saveToLocalStorage() {
        localStorage.setItem('linguaflow_onboarded', this.onboarded.toString());
        if (this.user) localStorage.setItem('linguaflow_user', JSON.stringify(this.user));
        localStorage.setItem('linguaflow_collections', JSON.stringify(this.collections));
        localStorage.setItem('linguaflow_cards', JSON.stringify(this.cards));
        localStorage.setItem('linguaflow_dialogues', JSON.stringify(this.dialogues));
    },

    // User methods
    getUser() {
        return this.user || {
            name: 'Guest',
            level: 1,
            targetLanguage: 'Spanish',
            nativeLanguage: 'English',
            settings: { darkMode: true }
        };
    },

    async updateUser(updates) {
        this.user = { ...this.user, ...updates };

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
            await SupabaseService.updateProfile(updates);
        } else {
            this.saveToLocalStorage();
        }

        return this.user;
    },

    isOnboarded() {
        return this.onboarded;
    },

    setOnboarded(value = true) {
        this.onboarded = value;
        if (!this.useSupabase) {
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

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
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

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
            await SupabaseService.updateCollection(id, updates);
        } else {
            this.saveToLocalStorage();
        }

        return this.collections[index];
    },

    async deleteCollection(id) {
        this.collections = this.collections.filter(c => c.id !== id);
        this.cards = this.cards.filter(c => c.collectionId !== id);

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
            await SupabaseService.deleteCollection(id);
        } else {
            this.saveToLocalStorage();
        }
    },

    // Cards methods
    getCards(collectionId = null) {
        if (collectionId) {
            return this.cards.filter(c => c.collectionId === collectionId);
        }
        return this.cards;
    },

    getCard(id) {
        return this.cards.find(c => c.id === id);
    },

    getDueCards(collectionId = null) {
        const now = new Date();
        let cards = this.cards.filter(c =>
            !c.nextReview || new Date(c.nextReview) <= now
        );

        if (collectionId) {
            cards = cards.filter(c => c.collectionId === collectionId);
        }

        return cards;
    },

    async addCard(card) {
        let newCard;

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
            newCard = await SupabaseService.addCard(card);
            this.cards.push(newCard);
        } else {
            newCard = {
                id: 'card_' + Date.now(),
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

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
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

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
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

        return await this.updateCard(id, {
            interval,
            easeFactor,
            reviewCount: reviewCount + 1,
            lastReview: new Date().toISOString(),
            nextReview: nextReview.toISOString()
        });
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

        if (this.useSupabase && SupabaseService.isAuthenticated()) {
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
        return this.getDueCards().length;
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
    }
};

window.DataStore = DataStore;
