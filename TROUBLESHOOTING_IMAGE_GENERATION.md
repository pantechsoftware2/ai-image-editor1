# Fixing "Failed to generate images" Error

## Symptoms

```
Generation error: Error: Failed to generate images
```

This error occurs when the image generation API fails. Here's how to fix it:

---

## Step-by-Step Troubleshooting

### Step 1: Verify Google Cloud Project Exists

```bash
# List your projects
gcloud projects list

# Set the correct project
gcloud config set project YOUR_PROJECT_ID

# Verify it's set
gcloud config get-value project
```

**Expected Output:** Your GCP project ID

---

### Step 2: Check Environment Variables

Verify `.env.local` has all required variables:

```bash
# Check file exists in project root
cat .env.local
```

**Should contain:**
```
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_REGION=us-central1
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

⚠️ **CRITICAL:** After editing `.env.local`, **stop and restart** `npm run dev`

---

### Step 3: Verify Google Cloud Credentials

```bash
# Check if credentials are configured
gcloud auth application-default print-access-token

# If token is printed = ✅ Credentials working
# If error = ❌ Need to set up credentials
```

**If credentials not found:**
```bash
# Login with your Google account
gcloud auth application-default login

# This creates: ~/.config/gcloud/application_default_credentials.json
```

---

### Step 4: Enable Required APIs

```bash
# Enable Vertex AI
gcloud services enable aiplatform.googleapis.com

# Enable Storage API
gcloud services enable storage.googleapis.com

# Verify APIs are enabled
gcloud services list --enabled | grep aiplatform
```

**Expected Output:** Should show `aiplatform.googleapis.com`

---

### Step 5: Check Browser Console for Detailed Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. Trigger image generation
4. Look for logs that show:

```javascript
// Good logs:
🚀 Generating images with prompt: ...
🔐 Initializing Vertex AI with project: my-project
✅ Vertex AI initialized
✅ Generative model loaded
🚀 Calling Imagen-4 API...
📦 Response received: success
✨ Generated 4 images

// Bad logs (indicates problem):
❌ Error in generateImages: ...
🔴 Imagen-4 API error: ...
```

---

### Step 6: Common Error Messages & Fixes

#### Error: "GOOGLE_CLOUD_PROJECT_ID environment variable is required"

**Cause:** Environment variable not set

**Fix:**
```bash
# 1. Create/update .env.local
echo "GOOGLE_CLOUD_PROJECT_ID=my-project-id" >> .env.local

# 2. Restart dev server
# - Stop: Ctrl+C in terminal
# - Restart: npm run dev

# 3. Test again
```

---

#### Error: "Authentication failed" or "Permission denied"

**Cause:** Google Cloud credentials not configured

**Fix:**
```bash
# 1. Login with gcloud
gcloud auth application-default login

# 2. Login credentials stored at:
# Windows: %APPDATA%\gcloud\application_default_credentials.json
# macOS: ~/.config/gcloud/application_default_credentials.json
# Linux: ~/.config/gcloud/application_default_credentials.json

# 3. Verify it worked
gcloud auth application-default print-access-token

# 4. Restart npm run dev
```

---

#### Error: "The caller does not have permission aiplatform.endpoints.predict"

**Cause:** Service account lacks permissions

**Fix:**
```bash
# Grant Vertex AI admin role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=user:your-email@gmail.com \
  --role=roles/aiplatform.admin

# Or for service accounts:
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:account@project.iam.gserviceaccount.com \
  --role=roles/aiplatform.admin
```

**Note:** IAM changes take ~5 minutes to propagate. Wait and try again.

---

#### Error: "Quota exceeded" or "Rate limit exceeded"

**Cause:** Too many API calls or quota limit reached

**Fix:**
1. Go to [GCP Console > Quotas](https://console.cloud.google.com/quotas)
2. Search for "Imagen" or "Vertex AI"
3. Check current usage vs limits
4. Request quota increase if needed

---

### Step 7: Test with Direct API Call (Advanced)

```bash
# Test Vertex AI API directly
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/imagen-4.0-fast-generate:predict \
  -d '{
    "instances": [{
      "prompt": "a coffee cup"
    }],
    "parameters": {
      "sampleCount": 1
    }
  }'

# Expected: JSON with generated image
# If error: Copy error message and check below
```

---

## Quick Debug Checklist

Run these commands in order:

```bash
# 1. Project
gcloud config get-value project
# ✅ Should show: your-project-id

# 2. Credentials
gcloud auth application-default print-access-token
# ✅ Should show: long token string

# 3. APIs enabled
gcloud services list --enabled | grep aiplatform
# ✅ Should show: aiplatform.googleapis.com

# 4. Environment
cat .env.local | grep GOOGLE_CLOUD_PROJECT_ID
# ✅ Should show: GOOGLE_CLOUD_PROJECT_ID=your-id

# 5. Restart dev server
npm run dev
# ✅ Should start without errors
```

---

## Still Not Working?

### Gather Debug Info

```bash
# Create debug file
gcloud config list > gcloud_config.txt
gcloud auth list > gcloud_auth.txt
gcloud services list --enabled > gcloud_services.txt

# Share with support along with:
# - Browser console error message (F12 > Console)
# - npm run dev output
# - .env.local (WITHOUT keys/secrets)
```

### Contact Support

Include:
1. Full error message from browser console
2. Output of `gcloud config get-value project`
3. Output of `gcloud auth list`
4. Output of `npm run dev` (first 50 lines)

---

## Key Points to Remember

1. **Environment variables**: Must be in `.env.local` at project root
2. **Restart required**: Always restart `npm run dev` after changing `.env.local`
3. **Credentials**: Run `gcloud auth application-default login` once
4. **APIs**: Ensure `aiplatform.googleapis.com` is enabled
5. **Permissions**: IAM changes take 5 minutes to propagate
6. **Logs**: Check browser console (F12) for detailed error messages

---

## Verification Commands

```bash
# All systems go ✅
gcloud auth application-default print-access-token 2>/dev/null && \
gcloud services list --enabled 2>/dev/null | grep -q aiplatform && \
echo "✅ Google Cloud setup verified!"

# Or if something is wrong ❌
# Run individual commands to find the issue
```

---

**Last Updated:** January 6, 2026
