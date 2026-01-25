/**
 * Supabase Client for LinguaFlow
 * Handles authentication and database operations
 */

const SupabaseService = {
    client: null,
    user: null,
    initialized: false,
    anonUserKey: 'linguaflow_anon_user_id',

    // Initialize Supabase client
    async init() {
        const supabaseUrl = window.SUPABASE_URL || localStorage.getItem('supabase_url');
        const supabaseKey = window.SUPABASE_ANON_KEY || localStorage.getItem('supabase_key');

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase not configured, using localStorage fallback');
            this.initialized = false;
            return false;
        }

        try {
            // Load Supabase client from CDN if not already loaded
            if (!window.supabase) {
                await this.loadSupabaseClient();
            }

            this.client = window.supabase.createClient(supabaseUrl, supabaseKey);

            // Check for existing session
            const { data: { session } } = await this.client.auth.getSession();
            if (session) {
                this.user = session.user;
            } else if (this.allowAnonymousAccess()) {
                this.user = { id: this.getAnonymousUserId(), isAnonymous: true };
            }

            // Listen for auth changes
            this.client.auth.onAuthStateChange((event, session) => {
                this.user = session?.user || null;
                if (event === 'SIGNED_IN') {
                    window.dispatchEvent(new CustomEvent('auth:signin', { detail: this.user }));
                } else if (event === 'SIGNED_OUT') {
                    if (this.allowAnonymousAccess()) {
                        this.user = { id: this.getAnonymousUserId(), isAnonymous: true };
                    } else {
                        window.dispatchEvent(new CustomEvent('auth:signout'));
                    }
                }
            });

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            this.initialized = false;
            return false;
        }
    },

    // Load Supabase client library from CDN
    loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.user;
    },
    isAnonymous() {
        return !!this.user?.isAnonymous;
    },
    allowAnonymousAccess() {
        return window.LINGUAFLOW_ALLOW_ANON_SUPABASE !== false;
    },
    getAnonymousUserId() {
        const existing = localStorage.getItem(this.anonUserKey);
        if (existing) return existing;
        const anonId = crypto.randomUUID();
        localStorage.setItem(this.anonUserKey, anonId);
        return anonId;
    },

    // Get current user ID
    getUserId() {
        return this.user?.id;
    },

    // ==================== AUTH METHODS ====================

    async signUp(email, password, name = '') {
        if (!this.client) throw new Error('Supabase not initialized');

        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        if (!this.client) throw new Error('Supabase not initialized');

        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        this.user = data.user;
        return data;
    },

    async signInWithGoogle() {
        if (!this.client) throw new Error('Supabase not initialized');

        const { data, error } = await this.client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
        return data;
    },

    async signOut() {
        if (!this.client) throw new Error('Supabase not initialized');

        const { error } = await this.client.auth.signOut();
        if (error) throw error;
        this.user = this.allowAnonymousAccess() ? { id: this.getAnonymousUserId(), isAnonymous: true } : null;
    },

    async resetPassword(email) {
        if (!this.client) throw new Error('Supabase not initialized');

        const { error } = await this.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw error;
    },

    // ==================== PROFILE METHODS ====================

    async getProfile() {
        if (!this.client || !this.user) return null;

        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', this.user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return this.transformProfile(data);
    },

    async updateProfile(updates) {
        if (!this.client || !this.user) return null;

        const dbUpdates = this.transformProfileForDB(updates);
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await this.client
            .from('profiles')
            .update(dbUpdates)
            .eq('id', this.user.id)
            .select()
            .single();

        if (error) throw error;
        return this.transformProfile(data);
    },

    // ==================== COLLECTIONS METHODS ====================

    async getCollections() {
        if (!this.client || !this.user) return [];

        const { data, error } = await this.client
            .from('collections')
            .select('*')
            .eq('user_id', this.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching collections:', error);
            return [];
        }
        return data.map(c => this.transformCollection(c));
    },

    async getCollection(id) {
        if (!this.client || !this.user) return null;

        const { data, error } = await this.client
            .from('collections')
            .select('*')
            .eq('id', id)
            .eq('user_id', this.user.id)
            .single();

        if (error) return null;
        return this.transformCollection(data);
    },

    async addCollection(collection) {
        if (!this.client || !this.user) return null;

        const { data, error } = await this.client
            .from('collections')
            .insert({
                user_id: this.user.id,
                name: collection.name,
                emoji: collection.emoji || '📚',
                image: collection.image,
                card_count: 0,
                mastered: 0,
                due_cards: 0
            })
            .select()
            .single();

        if (error) throw error;
        return this.transformCollection(data);
    },

    async updateCollection(id, updates) {
        if (!this.client || !this.user) return null;

        const dbUpdates = this.transformCollectionForDB(updates);
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await this.client
            .from('collections')
            .update(dbUpdates)
            .eq('id', id)
            .eq('user_id', this.user.id)
            .select()
            .single();

        if (error) throw error;
        return this.transformCollection(data);
    },

    async deleteCollection(id) {
        if (!this.client || !this.user) return false;

        const { error } = await this.client
            .from('collections')
            .delete()
            .eq('id', id)
            .eq('user_id', this.user.id);

        if (error) throw error;
        return true;
    },

    // ==================== CARDS METHODS ====================

    async getCards(collectionId = null) {
        if (!this.client || !this.user) return [];

        let query = this.client
            .from('cards')
            .select('*')
            .eq('user_id', this.user.id);

        if (collectionId) {
            query = query.eq('collection_id', collectionId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
        return data.map(c => this.transformCard(c));
    },

    async getCard(id) {
        if (!this.client || !this.user) return null;

        const { data, error } = await this.client
            .from('cards')
            .select('*')
            .eq('id', id)
            .eq('user_id', this.user.id)
            .single();

        if (error) return null;
        return this.transformCard(data);
    },

    async getDueCards(collectionId = null) {
        if (!this.client || !this.user) return [];

        let query = this.client
            .from('cards')
            .select('*')
            .eq('user_id', this.user.id)
            .lte('next_review', new Date().toISOString());

        if (collectionId) {
            query = query.eq('collection_id', collectionId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching due cards:', error);
            return [];
        }
        return data.map(c => this.transformCard(c));
    },

    async addCard(card) {
        if (!this.client || !this.user) return null;

        const { data, error } = await this.client
            .from('cards')
            .insert({
                user_id: this.user.id,
                collection_id: card.collectionId,
                front: card.front,
                back: card.back,
                reading: card.reading,
                example: card.example,
                example_translation: card.exampleTranslation,
                image: card.image,
                audio: card.audio,
                questions: Array.isArray(card.questions) ? card.questions : [],
                difficulty: card.difficulty || 2,
                interval: 1,
                ease_factor: 2.5,
                review_count: 0
            })
            .select()
            .single();

        if (error) throw error;
        return this.transformCard(data);
    },

    async updateCard(id, updates) {
        if (!this.client || !this.user) return null;

        const dbUpdates = this.transformCardForDB(updates);
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await this.client
            .from('cards')
            .update(dbUpdates)
            .eq('id', id)
            .eq('user_id', this.user.id)
            .select()
            .single();

        if (error) throw error;
        return this.transformCard(data);
    },

    async deleteCard(id) {
        if (!this.client || !this.user) return false;

        const { error } = await this.client
            .from('cards')
            .delete()
            .eq('id', id)
            .eq('user_id', this.user.id);

        if (error) throw error;
        return true;
    },

    // ==================== DIALOGUES METHODS ====================

    async getDialogues() {
        if (!this.client || !this.user) return [];

        const { data, error } = await this.client
            .from('dialogues')
            .select('*')
            .eq('user_id', this.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching dialogues:', error);
            return [];
        }
        return data.map(d => this.transformDialogue(d));
    },

    async addDialogue(dialogue) {
        if (!this.client || !this.user) return null;

        const { data, error } = await this.client
            .from('dialogues')
            .insert({
                user_id: this.user.id,
                title: dialogue.title,
                setting: dialogue.setting,
                duration: dialogue.duration,
                lines: dialogue.lines
            })
            .select()
            .single();

        if (error) throw error;
        return this.transformDialogue(data);
    },

    // ==================== TRANSFORM HELPERS ====================
    // Convert between camelCase (JS) and snake_case (DB)

    transformProfile(data) {
        if (!data) return null;
        return {
            id: data.id,
            name: data.name,
            level: data.level,
            targetLanguage: data.target_language,
            nativeLanguage: data.native_language,
            streak: data.streak,
            totalCardsLearned: data.total_cards_learned,
            dailyGoal: data.daily_goal,
            settings: data.settings,
            onboarded: data.onboarded,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    transformProfileForDB(data) {
        const result = {};
        if (data.name !== undefined) result.name = data.name;
        if (data.level !== undefined) result.level = data.level;
        if (data.targetLanguage !== undefined) result.target_language = data.targetLanguage;
        if (data.nativeLanguage !== undefined) result.native_language = data.nativeLanguage;
        if (data.streak !== undefined) result.streak = data.streak;
        if (data.totalCardsLearned !== undefined) result.total_cards_learned = data.totalCardsLearned;
        if (data.dailyGoal !== undefined) result.daily_goal = data.dailyGoal;
        if (data.settings !== undefined) result.settings = data.settings;
        if (data.onboarded !== undefined) result.onboarded = data.onboarded;
        return result;
    },

    transformCollection(data) {
        if (!data) return null;
        return {
            id: data.id,
            name: data.name,
            emoji: data.emoji,
            image: data.image,
            cardCount: data.card_count,
            mastered: data.mastered,
            dueCards: data.due_cards,
            lastStudied: data.last_studied,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    transformCollectionForDB(data) {
        const result = {};
        if (data.name !== undefined) result.name = data.name;
        if (data.emoji !== undefined) result.emoji = data.emoji;
        if (data.image !== undefined) result.image = data.image;
        if (data.cardCount !== undefined) result.card_count = data.cardCount;
        if (data.mastered !== undefined) result.mastered = data.mastered;
        if (data.dueCards !== undefined) result.due_cards = data.dueCards;
        if (data.lastStudied !== undefined) result.last_studied = data.lastStudied;
        return result;
    },

    transformCard(data) {
        if (!data) return null;
        return {
            id: data.id,
            collectionId: data.collection_id,
            front: data.front,
            back: data.back,
            reading: data.reading,
            example: data.example,
            exampleTranslation: data.example_translation,
            image: data.image,
            audio: data.audio,
            questions: Array.isArray(data.questions) ? data.questions : [],
            difficulty: data.difficulty,
            nextReview: data.next_review,
            lastReview: data.last_review,
            interval: data.interval,
            easeFactor: parseFloat(data.ease_factor),
            reviewCount: data.review_count,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    transformCardForDB(data) {
        const result = {};
        if (data.front !== undefined) result.front = data.front;
        if (data.back !== undefined) result.back = data.back;
        if (data.reading !== undefined) result.reading = data.reading;
        if (data.example !== undefined) result.example = data.example;
        if (data.exampleTranslation !== undefined) result.example_translation = data.exampleTranslation;
        if (data.image !== undefined) result.image = data.image;
        if (data.audio !== undefined) result.audio = data.audio;
        if (data.questions !== undefined) result.questions = data.questions;
        if (data.difficulty !== undefined) result.difficulty = data.difficulty;
        if (data.nextReview !== undefined) result.next_review = data.nextReview;
        if (data.lastReview !== undefined) result.last_review = data.lastReview;
        if (data.interval !== undefined) result.interval = data.interval;
        if (data.easeFactor !== undefined) result.ease_factor = data.easeFactor;
        if (data.reviewCount !== undefined) result.review_count = data.reviewCount;
        return result;
    },

    transformDialogue(data) {
        if (!data) return null;
        return {
            id: data.id,
            title: data.title,
            setting: data.setting,
            duration: data.duration,
            lines: data.lines,
            createdAt: data.created_at
        };
    }
};

// Export
window.SupabaseService = SupabaseService;
