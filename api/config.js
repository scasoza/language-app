// Vercel Edge Function to inject environment variables
// This runs on Vercel's edge network and injects env vars into the app

export const config = {
  runtime: 'edge',
};

function escapeJS(str) {
  return str.replace(/[\\"'\n\r\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

export default function handler(request) {
  const supabaseUrl = escapeJS(process.env.SUPABASE_URL || '');
  const supabaseKey = escapeJS(process.env.SUPABASE_ANON_KEY || '');

  return new Response(
    `window.SUPABASE_URL = "${supabaseUrl}";
window.SUPABASE_ANON_KEY = "${supabaseKey}";`,
    {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
}
