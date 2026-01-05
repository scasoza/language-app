/**
 * Authentication Screen Component
 * Handles sign in, sign up, and password reset
 */

const AuthScreen = {
    mode: 'signin', // 'signin', 'signup', 'reset'
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
                        <p class="text-gray-400 mt-2">Master any language with AI</p>
                    </div>

                    <!-- Auth Form -->
                    <div class="w-full max-w-sm">
                        ${this.mode === 'signin' ? this.renderSignIn() : ''}
                        ${this.mode === 'signup' ? this.renderSignUp() : ''}
                        ${this.mode === 'reset' ? this.renderReset() : ''}
                    </div>

                    <!-- Error Message -->
                    ${this.error ? `
                        <div class="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm max-w-sm w-full text-center">
                            ${this.error}
                        </div>
                    ` : ''}

                    <!-- Or continue without account -->
                    <div class="mt-8 text-center">
                        <p class="text-gray-500 text-sm mb-3">Or continue without an account</p>
                        <button onclick="AuthScreen.continueAsGuest()" class="text-primary font-medium hover:underline">
                            Use Offline Mode
                        </button>
                    </div>
                </div>

                <!-- Footer -->
                <div class="p-6 text-center text-gray-500 text-xs">
                    <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
                </div>
            </div>
        `;
    },

    renderSignIn() {
        return `
            <form onsubmit="AuthScreen.handleSignIn(event)" class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">Email</label>
                    <input
                        type="email"
                        id="auth-email"
                        required
                        placeholder="you@example.com"
                        class="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </div>
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">Password</label>
                    <input
                        type="password"
                        id="auth-password"
                        required
                        placeholder="••••••••"
                        minlength="6"
                        class="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </div>
                <button
                    type="submit"
                    class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl shadow-neon hover:shadow-neon-hover transition-all disabled:opacity-50"
                    ${this.isLoading ? 'disabled' : ''}
                >
                    ${this.isLoading ? '<div class="spinner mx-auto"></div>' : 'Sign In'}
                </button>
            </form>

            <div class="mt-4 space-y-3">
                <button onclick="AuthScreen.handleGoogleSignIn()" class="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors">
                    <svg class="size-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                </button>
            </div>

            <div class="mt-6 text-center space-y-2">
                <button onclick="AuthScreen.setMode('reset')" class="text-primary text-sm hover:underline">
                    Forgot password?
                </button>
                <p class="text-gray-400 text-sm">
                    Don't have an account?
                    <button onclick="AuthScreen.setMode('signup')" class="text-primary font-medium hover:underline">Sign up</button>
                </p>
            </div>
        `;
    },

    renderSignUp() {
        return `
            <form onsubmit="AuthScreen.handleSignUp(event)" class="space-y-4">
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">Name</label>
                    <input
                        type="text"
                        id="auth-name"
                        required
                        placeholder="Your name"
                        class="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </div>
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">Email</label>
                    <input
                        type="email"
                        id="auth-email"
                        required
                        placeholder="you@example.com"
                        class="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </div>
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">Password</label>
                    <input
                        type="password"
                        id="auth-password"
                        required
                        placeholder="••••••••"
                        minlength="6"
                        class="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <p class="text-xs text-gray-500 mt-1">At least 6 characters</p>
                </div>
                <button
                    type="submit"
                    class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl shadow-neon hover:shadow-neon-hover transition-all disabled:opacity-50"
                    ${this.isLoading ? 'disabled' : ''}
                >
                    ${this.isLoading ? '<div class="spinner mx-auto"></div>' : 'Create Account'}
                </button>
            </form>

            <div class="mt-6 text-center">
                <p class="text-gray-400 text-sm">
                    Already have an account?
                    <button onclick="AuthScreen.setMode('signin')" class="text-primary font-medium hover:underline">Sign in</button>
                </p>
            </div>
        `;
    },

    renderReset() {
        return `
            <form onsubmit="AuthScreen.handleReset(event)" class="space-y-4">
                <p class="text-gray-400 text-sm text-center mb-4">
                    Enter your email and we'll send you a link to reset your password.
                </p>
                <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">Email</label>
                    <input
                        type="email"
                        id="auth-email"
                        required
                        placeholder="you@example.com"
                        class="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                </div>
                <button
                    type="submit"
                    class="w-full bg-primary text-background-dark font-bold py-3 rounded-xl shadow-neon hover:shadow-neon-hover transition-all disabled:opacity-50"
                    ${this.isLoading ? 'disabled' : ''}
                >
                    ${this.isLoading ? '<div class="spinner mx-auto"></div>' : 'Send Reset Link'}
                </button>
            </form>

            <div class="mt-6 text-center">
                <button onclick="AuthScreen.setMode('signin')" class="text-primary text-sm hover:underline">
                    Back to sign in
                </button>
            </div>
        `;
    },

    setMode(mode) {
        this.mode = mode;
        this.error = null;
        this.render();
    },

    async handleSignIn(event) {
        event.preventDefault();
        this.isLoading = true;
        this.error = null;
        this.render();

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        try {
            await SupabaseService.signIn(email, password);
            await DataStore.init(); // Reinitialize with auth
            app.navigate('home');
        } catch (error) {
            this.error = error.message || 'Failed to sign in';
            this.render();
        } finally {
            this.isLoading = false;
        }
    },

    async handleSignUp(event) {
        event.preventDefault();
        this.isLoading = true;
        this.error = null;
        this.render();

        const name = document.getElementById('auth-name').value;
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        try {
            await SupabaseService.signUp(email, password, name);
            // Show confirmation message
            this.error = null;
            app.showToast('Check your email to confirm your account!', 'success');
            this.setMode('signin');
        } catch (error) {
            this.error = error.message || 'Failed to create account';
            this.render();
        } finally {
            this.isLoading = false;
        }
    },

    async handleGoogleSignIn() {
        try {
            await SupabaseService.signInWithGoogle();
            // Will redirect to Google
        } catch (error) {
            this.error = error.message || 'Failed to sign in with Google';
            this.render();
        }
    },

    async handleReset(event) {
        event.preventDefault();
        this.isLoading = true;
        this.error = null;
        this.render();

        const email = document.getElementById('auth-email').value;

        try {
            await SupabaseService.resetPassword(email);
            app.showToast('Check your email for the reset link!', 'success');
            this.setMode('signin');
        } catch (error) {
            this.error = error.message || 'Failed to send reset email';
            this.render();
        } finally {
            this.isLoading = false;
        }
    },

    continueAsGuest() {
        // Skip auth and use localStorage
        DataStore.useSupabase = false;
        if (!localStorage.getItem('linguaflow_initialized')) {
            DataStore.resetLocal();
        }

        // Check if user needs onboarding
        if (!DataStore.isOnboarded()) {
            app.navigate('onboarding');
        } else {
            app.navigate('home');
        }
    }
};

window.AuthScreen = AuthScreen;
