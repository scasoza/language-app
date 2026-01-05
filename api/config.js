// Vercel Edge Function to inject environment variables
// This runs on Vercel's edge network and injects env vars into the app

export const config = {
  runtime: 'edge',
};

export default function handler(request) {
  const config = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  };

  return new Response(
    `window.SUPABASE_URL = "${config.SUPABASE_URL}";
window.SUPABASE_ANON_KEY = "${config.SUPABASE_ANON_KEY}";`,
    {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
}
