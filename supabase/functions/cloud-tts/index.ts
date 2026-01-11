// Supabase Edge Function: cloud-tts
// Handles Cloud TTS API calls with service account authentication

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Service account credentials from environment variables
const CREDENTIALS = {
  client_email: Deno.env.get('GOOGLE_CLIENT_EMAIL') || '',
  private_key: Deno.env.get('GOOGLE_PRIVATE_KEY') || '',
  project_id: Deno.env.get('GOOGLE_PROJECT_ID') || '',
}

// Helper: Convert PEM to ArrayBuffer
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '')

  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Base64 URL encoding
function base64url(input: ArrayBuffer): string {
  const bytes = new Uint8Array(input)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Generate JWT for Google OAuth
async function createJWT(): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  const payload = {
    iss: CREDENTIALS.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encoder = new TextEncoder()
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)))
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)))
  const unsignedToken = `${headerB64}.${payloadB64}`

  // Import private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(CREDENTIALS.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsignedToken)
  )

  const signatureB64 = base64url(signature)
  return `${unsignedToken}.${signatureB64}`
}

// Get OAuth access token
async function getAccessToken(): Promise<string> {
  const jwt = await createJWT()

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })

  const data = await response.json()

  if (!data.access_token) {
    throw new Error(`OAuth failed: ${JSON.stringify(data)}`)
  }

  return data.access_token
}

// Call Cloud TTS API
async function generateTTS(text: string, languageCode: string, voiceName: string) {
  const accessToken = await getAccessToken()

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Cloud TTS failed: ${response.status} - ${error}`)
  }

  return response.json()
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, languageCode, voiceName } = await req.json()

    console.log('Cloud TTS request:', { text, languageCode, voiceName })

    if (!text || !languageCode || !voiceName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, languageCode, voiceName' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate credentials are set
    if (!CREDENTIALS.client_email || !CREDENTIALS.private_key || !CREDENTIALS.project_id) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Google credentials' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await generateTTS(text, languageCode, voiceName)

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('Cloud TTS error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    )
  }
})
