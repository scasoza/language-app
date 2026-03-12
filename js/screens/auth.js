/**
 * Authentication Screen Component
 * Google OAuth only
 */

const AuthScreen = {
    isLoading: false,
    error: null,

    render() {
        const container = document.getElementById('screen-auth');
        if (!container) return;

        container.innerHTML = `
            <div class="min-h-screen flex flex-col bg-background-dark">
                <!-- Header -->
                <div class="flex-1 flex flex-col items-center justify-center p-6">
                    <!-- Logo -->
                    <div class="mb-8 text-center">
                        <div class="size-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-neon">
                            <span class="text-5xl">🌍</span>
                        </div>
                        <h1 class="text-3xl font-bold">
                            <span class="text-primary">Lingua</span><span class="text-white">Flow</span>
                        </h1>
                        <p class="text-gray-400 mt-2">Master any language with smart study tools</p>
                    </div>

                    <!-- Google Sign In -->
                    <div class="w-full max-w-sm">
                        <button
                            onclick="AuthScreen.handleGoogleSignIn()"
                            class="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                            ${this.isLoading ? 'disabled' : ''}
                        >
                            ${this.isLoading ? '<div class="spinner mx-auto"></div>' : `
                                <svg class="size-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                Continue with Google
                            `}
                        </button>
                    </div>

                    <!-- Error Message -->
                    ${this.error ? `
                        <div class="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm max-w-sm w-full text-center">
                            ${this.error}
                        </div>
                    ` : ''}

                </div>

                <!-- Footer -->
                <div class="p-6 text-center text-gray-500 text-xs">
                    <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
                </div>
            </div>
        `;
    },

    async handleGoogleSignIn() {
        // Check if Supabase is configured
        if (!SupabaseService.initialized && !SupabaseService.client) {
            await SupabaseService.init();
            if (!SupabaseService.client) {
                this.error = 'Backend not configured. Please contact support.';
                this.render();
                return;
            }
        }

        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            await SupabaseService.signInWithGoogle();
            // Will redirect to Google
        } catch (error) {
            this.error = error.message || 'Failed to sign in with Google';
            this.isLoading = false;
            this.render();
        }
    }
};

window.AuthScreen = AuthScreen;
