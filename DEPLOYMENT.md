# Thanaweya Amma Math Copilot - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Auto-Update Server Setup](#auto-update-server-setup)
5. [Code Signing Setup](#code-signing-setup)
6. [Building the Application](#building-the-application)
7. [Testing the Build](#testing-the-build)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| npm | 9+ | Package manager |
| Git | 2+ | Version control |
| Electron | 44.6.0 | Desktop framework |
| electron-builder | 26.15.3 | Packaging tool |

### Required Tools for Windows Build on Linux

```bash
# Install wine (for code signing in development)
sudo apt update
sudo apt install wine64 -y

# Install rpm for Linux builds (optional)
sudo apt install rpm -y

# Install fpm for deb builds (optional)
sudo apt install ruby ruby-dev build-essential
sudo gem install fpm
```

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/abueid201224/thanawaya.git
cd thanawaya
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Install electron-updater (already included in package.json)
npm install electron-updater --save-dev --legacy-peer-deps
```

### 3. Create Environment Files

#### For Development:
```bash
# .env.development
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

#### For Production:
```bash
# .env.production
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
UPDATE_FEED_URL=https://updates.yourdomain.com/updates
CERTIFICATE_PASSWORD=your-certificate-password-here
```

---

## Supabase Configuration

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create new project: `thanaweya-math-copilot`
3. Note your project URL and keys

### Step 2: Set Up Database Schema

Run the SQL scripts in order:

```bash
# Using psql
psql -h YOUR-PROJECT-REF.supabase.co -p 5432 -U postgres -d postgres

# Execute schema scripts
\i database/supabase/001_create_student_profiles_table.sql
\i database/supabase/002_enable_rls.sql
```

Or use Supabase SQL Editor to run the scripts.

### Step 3: Create Admin User

```sql
-- Update admin user metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'ahmed.hamada.gana.2012@gmail.com';

-- Or create via authService.signUp with role: 'admin'
```

### Step 4: Test Connection

```bash
# Test Supabase connection
npm run dev
# Try to register/login
```

---

## Auto-Update Server Setup

### Option A: GitHub Releases (Recommended)

1. **Configure electron-builder.yml:**
```yaml
publish:
  - provider: "github"
    owner: "abueid201224"
    repo: "thanawaya"
    token: "${GITHUB_TOKEN}"
```

2. **Create GitHub Personal Access Token:**
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens
   - Create new token with `repo` scope
   - Set as `GITHUB_TOKEN` environment variable

3. **Test publish:**
```bash
# Dry run
npm run build:all
electron-builder --win --x64 --config electron-builder.yml --dry-run

# Actual publish
GITHUB_TOKEN=your-token-here electron-builder --win --x64 --config electron-builder.yml --publish always
```

### Option B: Self-Hosted Server

1. **Set up server** (see `server/updates/README.md`)

2. **Configure electron-builder.yml:**
```yaml
publish:
  - provider: "generic"
    url: "https://updates.yourdomain.com/updates"
    channel: "stable"
```

3. **Set environment variable:**
```bash
export UPDATE_FEED_URL="https://updates.yourdomain.com/updates"
```

4. **Upload files manually:**
```bash
# After building
scp release/* user@server:/var/www/updates/files/
scp server/updates/app-update.yml user@server:/var/www/updates/
```

---

## Code Signing Setup

### Step 1: Obtain Code Signing Certificate

Recommended providers:
- [DigiCert](https://www.digicert.com/) - Most trusted
- [Sectigo](https://sectigo.com/) - Good alternative
- [Comodo](https://comodo.com/) - Budget option

**Important:** For Windows SmartScreen reputation, use a certificate from a trusted CA.

### Step 2: Convert Certificate to PFX Format

```bash
# From PEM to PFX
openssl pkcs12 -export -out cert.pfx -inkey private.key -in certificate.crt -certfile ca_bundle.crt

# From CER to PFX (if you have .cer and .key)
openssl pkcs12 -export -out cert.pfx -inkey private.key -in certificate.cer
```

### Step 3: Place Certificate File

```bash
# Create installer-assets directory if not exists
mkdir -p installer-assets

# Copy certificate
cp cert.pfx installer-assets/

# Set permissions
chmod 600 installer-assets/cert.pfx
```

### Step 4: Configure electron-builder.yml

```yaml
win:
  sign: true
  signingHashAlgorithms:
    - "sha256"
  rfc3161TimeStampServer: "http://timestamp.digicert.com"
  certificateFile: "installer-assets/cert.pfx"
  certificatePassword: "${CERTIFICATE_PASSWORD}"
```

### Step 5: Test Signing

```bash
# Build with signing
CERTIFICATE_PASSWORD=your-password-here npm run package:win

# Check if files are signed (on Windows)
# Right-click .exe → Properties → Digital Signatures
```

### For Development (Without Certificate)

```yaml
win:
  sign: false  # Disable signing for development
```

---

## Building the Application

### Development Build

```bash
# Start development server
npm run dev

# Access at http://localhost:3000
```

### Production Build

#### Step 1: Build Web App

```bash
npm run build
```

This creates optimized files in `dist/` directory.

#### Step 2: Build Electron Main Process

```bash
npm run build:electron
```

This creates files in `dist-electron/` directory.

#### Step 3: Package for Windows

```bash
# Full build and package
npm run package:win

# Or step by step
npm run build:all
electron-builder --win --x64 --config electron-builder.yml
```

#### Build for Different Targets

```bash
# NSIS Installer only
electron-builder --win --x64 --config electron-builder.yml --target nsis

# Portable only
electron-builder --win --x64 --config electron-builder.yml --target portable

# Both (default)
electron-builder --win --x64 --config electron-builder.yml
```

### Build Output

After successful build, files will be in `release/` directory:
```
release/
├── ThanaweyaAmmaMathCopilot-Setup-1.0.0.exe      # NSIS Installer
├── ThanaweyaAmmaMathCopilot-Portable-1.0.0.exe  # Portable
├── win-unpacked/                                    # Unpacked files
│   ├── Thanaweya Amma Math Copilot.exe
│   └── resources/
│       └── app.asar
└── builder-debug.yml                              # Build info
```

---

## Testing the Build

### Test on Windows

1. **Copy files to Windows machine:**
```bash
# From Linux to Windows (using scp)
scp release/* user@windows-pc:C:\Users\user\Downloads\thanaweya\
```

2. **Run the installer:**
- Double-click `ThanaweyaAmmaMathCopilot-Setup-1.0.0.exe`
- Follow installation steps
- Check desktop shortcut is created

3. **Run the portable version:**
- Extract `ThanaweyaAmmaMathCopilot-Portable-1.0.0.exe`
- Double-click to run
- No installation required

### Test Features

#### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Register new user
- [ ] Register with existing email (should show error)
- [ ] Continue as guest
- [ ] Password reset
- [ ] Email verification

#### Settings
- [ ] Open settings modal
- [ ] Edit profile information
- [ ] Save changes
- [ ] Change theme
- [ ] Change language
- [ ] Admin registration

#### Auto-Update
- [ ] Check for updates (if server configured)
- [ ] Download update (if available)
- [ ] Install update

#### Code Signing
- [ ] Check digital signature (right-click .exe → Properties → Digital Signatures)
- [ ] Run on Windows without SmartScreen warnings (if using trusted certificate)

### Verify Build Size

```bash
# Check app.asar size (should be < 15MB)
du -sh release/win-unpacked/resources/app.asar

# Or on Windows
# Right-click app.asar → Properties → Size
```

---

## Production Deployment

### Step 1: Final Testing

1. Test on clean Windows 10/11 machine
2. Test all features
3. Test update mechanism
4. Verify code signing

### Step 2: Prepare Release

```bash
# Create release directory
mkdir -p releases/v1.0.0

# Copy build files
cp -r release/* releases/v1.0.0/

# Create checksums
sha256sum releases/v1.0.0/* > releases/v1.0.0/SHA256SUMS

# Package as zip
zip -r releases/thanaweya-v1.0.0.zip releases/v1.0.0/
```

### Step 3: Publish Release

#### GitHub Releases:
```bash
# Create GitHub release
gh release create v1.0.0 --title "Version 1.0.0" --notes "First production release"

# Upload files
gh release upload v1.0.0 release/*
```

#### Self-Hosted:
```bash
# Upload to your server
scp -r releases/v1.0.0/* user@server:/var/www/downloads/thanaweya/

# Update download links on your website
```

### Step 4: Update Auto-Update Server

1. Update `app-update.yml` with new version info
2. Generate new SHA256 hashes
3. Upload to update server
4. Verify update server is responding

---

## Configuration Checklist

### Before Production Deployment

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] RLS policies configured
- [ ] Admin user created
- [ ] Code signing certificate obtained
- [ ] Certificate in PFX format
- [ ] Certificate placed in `installer-assets/`
- [ ] Auto-update server configured
- [ ] Environment variables set
- [ ] All features tested
- [ ] Build size verified (< 15MB)
- [ ] Code signing verified
- [ ] Update mechanism tested

---

## Troubleshooting

### Build Errors

#### "wine not found"
```bash
# Install wine
sudo apt install wine64 -y

# Or disable signing in development
electron-builder.yml:
  win:
    sign: false
```

#### "Module not found"
```bash
# Install missing dependencies
npm install

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### "TypeScript errors"
```bash
# Run TypeScript check
npm run lint

# Fix any type errors
```

### Supabase Errors

#### "Permission denied"
- Check RLS policies are correct
- Verify user is authenticated
- Test with admin user to see if data exists

#### "Table not found"
- Run the schema scripts
- Check table names are correct

#### "Connection failed"
- Verify Supabase URL and key
- Check internet connection
- Test with Supabase dashboard

### Code Signing Errors

#### "Certificate not found"
- Verify certificate file path
- Check file permissions
- Ensure certificate is in PFX format

#### "Invalid password"
- Verify certificate password
- Set `CERTIFICATE_PASSWORD` environment variable

#### "Signing failed"
- Check wine is installed (on Linux)
- Try on Windows machine
- Verify certificate is valid

### Auto-Update Errors

#### "No update available"
- Check `currentVersion` in app-update.yml
- Verify update server URL
- Test server response with curl

#### "Download failed"
- Verify SHA256 hashes
- Check file sizes
- Test file URLs with browser

#### "Installation failed"
- Check write permissions
- Verify user has admin rights
- Test on clean machine

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon public key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `UPDATE_FEED_URL` | No | Auto-update server URL |
| `CERTIFICATE_PASSWORD` | No | Code signing certificate password |
| `GITHUB_TOKEN` | No | GitHub token for publishing |
| `NODE_ENV` | No | Set to "production" for production builds |

---

## Useful Commands

```bash
# Clean build
npm run clean

# Full build
npm run build:all

# Package for Windows
npm run package:win

# Verify build
npm run verify-build

# Start development
npm run dev

# Check TypeScript
npm run lint

# Preview production build
npm run preview
```

---

## File Structure

```
thanawaya/
├── database/                    # Database scripts
│   └── supabase/               # Supabase configuration
│       ├── 001_create_student_profiles_table.sql
│       ├── 002_enable_rls.sql
│       └── README.md
│
├── server/                     # Server files
│   └── updates/               # Auto-update configuration
│       ├── app-update.yml
│       └── README.md
│
├── installer-assets/           # Installer assets
│   ├── icon.ico               # Application icon
│   ├── icon.png
│   └── cert.pfx.placeholder   # Code signing certificate
│
├── electron/                   # Electron files
│   ├── main.ts                # Main process
│   ├── preload.ts             # Preload script
│   └── types.ts               # Type definitions
│
├── src/                       # Application source
│   ├── components/            # React components
│   ├── services/              # Services
│   ├── types/                 # TypeScript types
│   └── ...
│
├── electron-builder.yml        # Packaging configuration
├── package.json               # Project configuration
└── DEPLOYMENT.md              # This file
```

---

## Support

For issues:
- Check the [Troubleshooting](#troubleshooting) section
- Review logs in `release/` directory
- Check `main.log` in user data directory
- Consult [electron-builder documentation](https://www.electron.build/)
- Ask in the project discussions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-XX-XX | Initial production release |

---

**Last Updated:** 2026-10-17
**Documentation Version:** 1.0.0
