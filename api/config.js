// Vercel Edge Function to inject environment variables
// This runs on Vercel's edge network and injects env vars into the app

export const config = {
  runtime: 'edge',
};

export default function handler(request) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/[\\"`]/g, '');
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || '').replace(/[\\"`]/g, '');
  const geminiKey = (process.env.GEMINI_API_KEY || '').replace(/[\\"`]/g, '');

  return new Response(
    `window.SUPABASE_URL = "${supabaseUrl}";
window.SUPABASE_ANON_KEY = "${supabaseKey}";
window.GEMINI_API_KEY = "${geminiKey}";`,
    {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
}
