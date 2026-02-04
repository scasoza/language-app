#!/bin/bash
# Sync www/ directory to root for Vercel deployment
# www/ is the source of truth, root is deployment target

echo "🔄 Syncing www/ to root..."

# Copy all files from www/ to root, excluding certain directories
cp -r www/* .

# Ensure we don't copy www/ itself
rm -rf www/www 2>/dev/null

# Don't overwrite project-specific root files
git checkout HEAD -- package.json capacitor.config.ts 2>/dev/null

echo "✅ Sync complete!"
echo "Files synced from www/ → root"
