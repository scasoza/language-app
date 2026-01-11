#!/bin/bash
# Deploy Cloud TTS Edge Function to Supabase

echo "🚀 Deploying Cloud TTS Edge Function to Supabase"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
    exit 1
fi

# Set environment variables
echo "📝 Setting Supabase secrets..."
supabase secrets set GOOGLE_CLIENT_EMAIL="language@gen-lang-client-0018395577.iam.gserviceaccount.com"
supabase secrets set GOOGLE_PROJECT_ID="gen-lang-client-0018395577"
supabase secrets set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC0FKv4HLGhZvV+
ACzLknuFcN4Tltc+gXr60q4/m21b29r3vgbQWEeayyMLmIV2lx3ItTprcHt80+88
eriMY2vueKUiTRfAFP2SIv9gnmsvOZnbICnlCC0sVNz7zfC1aW8QzJzorJ52Zi94
MH9GyUkBxgVpto9M+Dhrx4Zpzi3Ltf5kw/2XUJFckCrwh9qDNVhT/NJkRR4oNhKk
gtu3G+B1ph8eTwqgTiLT9xtE6XeEtRBy1fRGEumm7UMifP6rf8vZ47sOiGNNiyr9
ZoiWxH12bcVbUQ1SqlgtpCHaLl3oC6VROx8uEwvbgbczOw5Vj8XIgXoSN0A6mMzS
quUXOk85AgMBAAECggEAEI+on5cq9l4gxFtZg0jHy5Y9VDWeerj/cX8L551gja6+
2OMc3w8JWcjmApBesND1vCI/mscj0i9u/GPIYl/X2pz1id2naiK8DbMig5UaJCQS
3Fo9RBsQBXhSAOXYBeUKAfRhV0wdwCOGaNIj+GN1T4CRuZ7Al8pprO7S85rSrx3Y
S/5YwTLR9n391yKTb7yleQZiQYAIS2/9LfR5rDJu9eTSko2tNrInKs2j2miz624H
SbIruaFMEmtzAkjNiJGvL2N1eacOf9i3WMReIEuuKfH8Nh9SDUiQ288bN06C2hGS
jLlhNlUd4cd5d4vFj6ZPzVhj8H23wnrHBwkJtlizEQKBgQDvMzX3xAgoOhmVH+qB
8Tp3a9SU3rSYEIegRnJKLV+LLY/iB3U4uouplKHBB4PGlbPLlhAUh5sna9xjbB9Q
w6nK76piLxGBAHQ2xTf62knO5PjEHB3xQnTUEW2RNveVjjP0Mc5dgtSYjWQ7vs/X
jBVJhPPpW3ysx+EqK3NN0BYo0QKBgQDAuoC7y5+lkW4fuuG83F7t5ZaX7F9v5/Wx
aFIycMsSCR9Ct5SMYJH1HFI9adQh69D19MnvBajgm1grrHTC64m1VAWxcvTMhsAd
8jpFRH8fSmKk0/4GXBMKtl2hRn+E3wvXJW1oLoeb89YKQO9IzLOJRTedylcRhpVQ
x9h0AJbZ6QKBgQCKQ3W8g8mbRwomks5A0ilTgjbc3mZRR6y9zjqd+eAyWOHEaz8s
zVeRbGKbazaWgU3uLg2ZcFEU1loL9iGb052/ug0ot8BMavDB//m9vJPRTbUl1oLQ
Q/O36WMF/1nZTttlGa0JjGhKzd/UURVeqJBdcMZ0aveD//19HKSHo/JLIQKBgQCh
FsInNal5ADeludSYwTFvcukOjvmuVZmc8W9SzchOiOViJIO7WbRlxYhP4Lb4q1x7
WGG4sWhYZD+sMXdevPTbZSFlEoresPq/jQl7gCcpBkmxL6gxtKAN4iQcewp3Ct+g
sp3h6JJcndCXvXLDzKV75Sj5cHiaI32GiaO4Qg3UkQKBgEJIkXOgQQNIOu+OmOqM
Mr1BdgGkDROVcdSgXhv8gUaAYoNrOu4smN4LTxDf6koFacdLEj/geEp7lD1KLdyu
5p+dRxDXvwqrEME1Ank4SVZx7XMeU43h91PUOpr1cwNo8Ag4inXxks8yStn11Kdf
JFa8fDcNlnoWgeMFE+RVWno8
-----END PRIVATE KEY-----"

echo ""
echo "✅ Secrets set successfully"
echo ""

# Deploy function
echo "🚀 Deploying function..."
supabase functions deploy cloud-tts

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Your function is now available at:"
echo "   https://YOUR_PROJECT_REF.supabase.co/functions/v1/cloud-tts"
echo ""
echo "⚙️  Don't forget to:"
echo "   1. Add CORS settings in Supabase dashboard if needed"
echo "   2. Ensure Cloud Text-to-Speech API is enabled in Google Cloud"
