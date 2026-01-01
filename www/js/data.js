/**
 * Data Management for LinguaFlow
 * Handles localStorage persistence and state management
 */

const DataStore = {
    // Default user data
    defaultUser: {
        id: 'user_1',
        name: 'Alex',
        level: 4,
        targetLanguage: 'Spanish',
        nativeLanguage: 'English',
        streak: 7,
        totalCardsLearned: 1204,
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

    // Default collections
    defaultCollections: [
        {
            id: 'col_1',
            name: 'Spanish Verbs',
            emoji: '🇪🇸',
            cardCount: 124,
            mastered: 85,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARCnrv177dbYx-09jhwgutu8CdDwT4Ew4Ds_J-xum6bH5ncTgOvYjLbPom5Lh7kmHKrmdqFKRk1Orb95lBWOrZDO9bZpY1OjEo8GbLWTELpQhqnXhS6oblTVl0VwW0dXGgLGEB1Ty5lEOn62w6AWU1T2TX-c3MU8Jl62Fe3sFg34q7gRLSKHpp0qECTItNDSYUzpBXbknzbNEfiyqrhfZRIygO1_zUbzuU5gFG69mhxSW527PshDQNTxgnhyeFAhf3GXHiHne4ZWuE',
            dueCards: 12,
            lastStudied: new Date().toISOString()
        },
        {
            id: 'col_2',
            name: 'Kanji N5',
            emoji: '🇯🇵',
            cardCount: 80,
            mastered: 32,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOL0n63BaLF6Sf1KXv1qhk-X-od3W2pFu5uYVJ0TLdT-7PbVO4CpTLwPH1mTtIWer8941_QtlCTv1d7AcTumRCjyKjZ9sscyyLv2hoOvEZ-Wgyw5SxGT00yT4ZThjYp06hUBgRAFxJ_XdzixSWHnpicUWaX1J6_CGyaB34mCDASQtQ-gCO2DEUHPWMEXm9g6ITNiQAcxLLu8soCO04Y2yy78IGc9A-bEb6VnKCqtXBfDlXkPTMkXwBxJsAU4yPnduUbgC-FPoxIkD0',
            dueCards: 5,
            lastStudied: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'col_3',
            name: 'French Basics',
            emoji: '🇫🇷',
            cardCount: 45,
            mastered: 12,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmt0u34iTGbVdGqhJvU90Alz4Ijlnmkse_ML-y9-IXbvoqWMq0AYqcPL2KFnedkx5qXpvGOamFVE59pKcKFo30v73IXIJDy067J_VobCisyHpK_kUBuqNFfVlm650Fs9oBT0cYTJv2kbdYywNbZrK9X_NnO0cL6Xt-MdbHznHO7p5ouhJfeiLUj5LWLGJ7PD_29o_kzM0ZCiJcMUbDMdrEuEY6xmuU2vPiAWtTTSysdU2Jpb-hOALtRw8mj_wCG5YW73M9MldScNJY',
            dueCards: 0,
            lastStudied: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 'col_4',
            name: 'Business English',
            emoji: '💼',
            cardCount: 200,
            mastered: 0,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfArr_FYy3x75Pm0TSHTJFpCuI2-c0sJFQ7cq_3oi9wxmq-p8V9Bz3PHblKbaLCa11KydAYkJ4vIiqC0Ex1qMetEEaZJe1x4i7Btd6BeRuKGym5C6AnkwYyUTuu8acreyidiYEdx1w3cqH_aeYk14-RlqXbFuV4XqWf_WofNBhzIh19LK_gO7Ghy3AqAtkzAouYl80p1nwMKwqo3FLEj0kwd9eMjWk6sxNsB0nKmatfBgV1L8SMs-jwSWqOzcpxb80Ee8WhHWY2_V6',
            dueCards: 0,
            lastStudied: null
        }
    ],

    // Default flashcards
    defaultCards: [
        {
            id: 'card_1',
            collectionId: 'col_1',
            front: 'Hablar',
            back: 'To speak',
            reading: 'ah-BLAR',
            example: 'Yo hablo español.',
            exampleTranslation: 'I speak Spanish.',
            image: null,
            audio: null,
            difficulty: 2, // 1-5
            nextReview: new Date().toISOString(),
            lastReview: null,
            interval: 1,
            easeFactor: 2.5,
            reviewCount: 0
        },
        {
            id: 'card_2',
            collectionId: 'col_1',
            front: 'Comer',
            back: 'To eat',
            reading: 'ko-MER',
            example: 'Me gusta comer pizza.',
            exampleTranslation: 'I like to eat pizza.',
            image: null,
            audio: null,
            difficulty: 1,
            nextReview: new Date().toISOString(),
            lastReview: null,
            interval: 1,
            easeFactor: 2.5,
            reviewCount: 0
        },
        {
            id: 'card_3',
            collectionId: 'col_2',
            front: '猫',
            back: 'Cat',
            reading: 'Neko',
            example: 'The cat is sleeping on the mat.',
            exampleTranslation: 'Neko wa matto no ue de nete imasu.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3iuJBR1WOZ_84hq3h1rLycEAFaVJ6oj9oYYfGd7IDnpCR_K82GLn9B1zpeFIf7CLJkJhKR2fS0qpGCFTcaLNDWLEn6e4dpZ-cbqzFLbNYWVj7x6_CjlSwf5jjZSLQHhAHwcbHIciiU2uYMOXSQFG21q8tecoQdLY8QDAwez5EHBU5MO5IghZaKTcTteK1jFKPlyUe9PQXKbPn1ggx-JK8jmGw90mwq_q2rDUpdTczLPd7UHW17ayTy6YI-30wpOF7UQCwVI5mDL75',
            audio: null,
            difficulty: 1,
            nextReview: new Date().toISOString(),
            lastReview: null,
            interval: 1,
            easeFactor: 2.5,
            reviewCount: 0
        }
    ],

    // Generated dialogues storage
    defaultDialogues: [],

    // Initialize data store
    init() {
        // Check if first run
        if (!localStorage.getItem('linguaflow_initialized')) {
            this.reset();
        }
        return this;
    },

    // Reset to defaults
    reset() {
        localStorage.setItem('linguaflow_user', JSON.stringify(this.defaultUser));
        localStorage.setItem('linguaflow_collections', JSON.stringify(this.defaultCollections));
        localStorage.setItem('linguaflow_cards', JSON.stringify(this.defaultCards));
        localStorage.setItem('linguaflow_dialogues', JSON.stringify(this.defaultDialogues));
        localStorage.setItem('linguaflow_initialized', 'true');
        localStorage.setItem('linguaflow_onboarded', 'false');
    },

    // User methods
    getUser() {
        return JSON.parse(localStorage.getItem('linguaflow_user')) || this.defaultUser;
    },

    updateUser(updates) {
        const user = this.getUser();
        const updated = { ...user, ...updates };
        localStorage.setItem('linguaflow_user', JSON.stringify(updated));
        return updated;
    },

    isOnboarded() {
        return localStorage.getItem('linguaflow_onboarded') === 'true';
    },

    setOnboarded(value = true) {
        localStorage.setItem('linguaflow_onboarded', value.toString());
    },

    // Collections methods
    getCollections() {
        return JSON.parse(localStorage.getItem('linguaflow_collections')) || [];
    },

    getCollection(id) {
        return this.getCollections().find(c => c.id === id);
    },

    addCollection(collection) {
        const collections = this.getCollections();
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

    updateCollection(id, updates) {
        const collections = this.getCollections();
        const index = collections.findIndex(c => c.id === id);
        if (index !== -1) {
            collections[index] = { ...collections[index], ...updates };
            localStorage.setItem('linguaflow_collections', JSON.stringify(collections));
            return collections[index];
        }
        return null;
    },

    deleteCollection(id) {
        const collections = this.getCollections().filter(c => c.id !== id);
        localStorage.setItem('linguaflow_collections', JSON.stringify(collections));
        // Also delete associated cards
        const cards = this.getCards().filter(c => c.collectionId !== id);
        localStorage.setItem('linguaflow_cards', JSON.stringify(cards));
    },

    // Cards methods
    getCards(collectionId = null) {
        const cards = JSON.parse(localStorage.getItem('linguaflow_cards')) || [];
        if (collectionId) {
            return cards.filter(c => c.collectionId === collectionId);
        }
        return cards;
    },

    getCard(id) {
        return this.getCards().find(c => c.id === id);
    },

    getDueCards(collectionId = null) {
        const now = new Date();
        return this.getCards(collectionId).filter(card => {
            const nextReview = new Date(card.nextReview);
            return nextReview <= now;
        });
    },

    getTotalDueCards() {
        return this.getDueCards().length;
    },

    addCard(card) {
        const cards = this.getCards();
        const newCard = {
            id: 'card_' + Date.now(),
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
            const collection = this.getCollection(card.collectionId);
            if (collection) {
                this.updateCollection(card.collectionId, {
                    cardCount: collection.cardCount + 1,
                    dueCards: collection.dueCards + 1
                });
            }
        }

        return newCard;
    },

    updateCard(id, updates) {
        const cards = this.getCards();
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
            cards[index] = { ...cards[index], ...updates };
            localStorage.setItem('linguaflow_cards', JSON.stringify(cards));
            return cards[index];
        }
        return null;
    },

    // Spaced repetition algorithm (SM-2 variant)
    reviewCard(id, quality) {
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

        return this.updateCard(id, {
            interval,
            easeFactor,
            reviewCount: reviewCount + 1,
            lastReview: new Date().toISOString(),
            nextReview: nextReview.toISOString()
        });
    },

    // Dialogue methods
    getDialogues() {
        return JSON.parse(localStorage.getItem('linguaflow_dialogues')) || [];
    },

    addDialogue(dialogue) {
        const dialogues = this.getDialogues();
        const newDialogue = {
            id: 'dlg_' + Date.now(),
            createdAt: new Date().toISOString(),
            ...dialogue
        };
        dialogues.push(newDialogue);
        localStorage.setItem('linguaflow_dialogues', JSON.stringify(dialogues));
        return newDialogue;
    },

    // Statistics
    getStats() {
        const user = this.getUser();
        const collections = this.getCollections();
        const cards = this.getCards();
        const totalDue = this.getTotalDueCards();

        const totalMastered = collections.reduce((sum, c) => sum + c.mastered, 0);
        const totalCards = collections.reduce((sum, c) => sum + c.cardCount, 0);

        return {
            streak: user.streak,
            totalCardsLearned: user.totalCardsLearned,
            totalCollections: collections.length,
            totalCards,
            totalMastered,
            totalDue,
            masteryPercent: totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0
        };
    }
};

// Initialize on load
DataStore.init();
