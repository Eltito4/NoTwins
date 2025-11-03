# Security Configuration Guide

## Overview

This document outlines the security measures implemented for API key management and sensitive data protection in the NoTwins project.

## API Key Integration

### Anthropic Claude AI API Key

The Anthropic API key has been securely integrated into the project using environment variables.

**Location**: `/server/.env` (git-ignored)

**Configuration**:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Environment File Structure

The project uses the following environment file structure:

1. **`.env`** (server/root) - **NEVER committed to git**
   - Contains actual API keys and sensitive credentials
   - Used for local development and production deployment
   - Protected by `.gitignore`

2. **`.env.example`** - **Committed to git as template**
   - Contains placeholder values
   - Documents required environment variables
   - Safe to share publicly

3. **`.env.development`** (if present) - **NEVER committed to git**
   - Local development overrides
   - Protected by `.gitignore`

## Security Measures Implemented

### 1. Git Ignore Configuration

The following patterns are excluded from version control:

```gitignore
# Root .gitignore
.env
.env.local
.env.development
.env.development.local
.env.test.local
.env.production.local
server/.env
server/.env.local
server/.env.development
server/.env.production

# Server .gitignore
.env
.env.local
.env.development
.env.production
.env.*.local
```

### 2. Removed from Git History

The following files were removed from git tracking to prevent accidental exposure:
- `server/.env.development`
- `.env.developement` (typo filename)
- `.env.production`

**Action taken**: Files removed from git index but preserved locally with sanitized placeholders.

### 3. Environment Variable Loading

The application uses `dotenv` to load environment variables securely:

```javascript
// server/index.js
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });
```

### 4. API Key Validation

The Claude utility module validates API key presence before initialization:

```javascript
// server/utils/claude/index.js
function initializeClaude() {
  const API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!API_KEY) {
    logger.error('Missing ANTHROPIC_API_KEY environment variable');
    return null;
  }
  // ... initialization code
}
```

## Current Secrets

### Secrets in Use

1. **ANTHROPIC_API_KEY** - Claude AI API key (✓ Secured)
2. **MONGODB_URI** - MongoDB connection string with credentials (✓ Secured)
3. **JWT_SECRET** - JWT signing secret (✓ Secured)
4. **SCRAPER_API_KEY** - ScraperAPI key (✓ Secured, optional)
5. **GOOGLE_CLOUD_PRIVATE_KEY** - Google Cloud service account key (✓ Secured, legacy)
6. **GOOGLE_AI_API_KEY** - Gemini API key (✓ Secured, legacy)

### Legacy Credentials

The following credentials are kept for backward compatibility but are no longer actively used:
- Google Cloud Vision API credentials
- Google AI (Gemini) API key

These can be removed from `.env` files if Claude AI fully replaces their functionality.

## Security Best Practices

### For Developers

1. **Never commit `.env` files**
   - Always check `git status` before committing
   - Use `git diff` to verify no sensitive data is staged

2. **Rotate API keys if exposed**
   - If an API key is accidentally committed, rotate it immediately
   - Update all deployment environments

3. **Use placeholder values in examples**
   - `.env.example` should only contain placeholders
   - Format: `API_KEY=your-api-key-here`

4. **Verify `.gitignore` before committing**
   ```bash
   git check-ignore -v server/.env
   # Should output: .gitignore:XX:.env  server/.env
   ```

5. **Test environment loading locally**
   ```bash
   cd server
   node test-config.js
   ```

### For Deployment

1. **Set environment variables via hosting platform**
   - Render.com: Dashboard → Environment Variables
   - Netlify: Site settings → Environment Variables
   - Heroku: Config Vars

2. **Never use `.env` files in production**
   - Use platform-specific secret management
   - Enable environment variable encryption if available

3. **Regularly audit access logs**
   - Monitor API usage for unusual patterns
   - Set up rate limiting and usage alerts

## Verification Checklist

Before committing changes:

- [ ] Run `git status` and verify no `.env` files are staged
- [ ] Check `git diff` for any API keys or secrets
- [ ] Verify `.gitignore` includes all sensitive files
- [ ] Test application with environment variables loaded
- [ ] Confirm `.env.example` only has placeholders

## Testing Configuration

To verify your configuration:

```bash
cd server
node test-config.js
```

Expected output:
```
=== Environment Configuration Test ===

ANTHROPIC_API_KEY: ✓ Set (sk-ant-api03-...)
MONGODB_URI: ✓ Set
JWT_SECRET: ✓ Set
SCRAPER_API_KEY: ✓ Set

=== Testing Claude AI Integration ===

Claude Status: {
  "initialized": true,
  "hasApiKey": true,
  "status": "connected"
}

✅ Configuration test completed!
```

## Incident Response

If an API key is compromised:

1. **Immediately rotate the key**
   - Anthropic Console: https://console.anthropic.com/settings/keys
   - Generate new key and update `.env` files

2. **Update all environments**
   - Local development
   - Staging
   - Production

3. **Revoke old key**
   - Delete compromised key from provider console

4. **Audit usage**
   - Check API usage logs for unauthorized access
   - Review git history: `git log -p -- '*.env*'`

5. **Document the incident**
   - Record what was exposed and when
   - Document remediation steps taken

## Contact

For security concerns, contact:
- Project maintainer: [Your contact]
- Security email: [security@yourdomain.com]

---

**Last Updated**: November 3, 2025
**Security Review**: Completed
**Status**: ✅ All secrets secured
