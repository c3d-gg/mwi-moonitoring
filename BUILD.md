# Build & Release Process

This document describes how to build and release new versions of the MWI-Moonitoring library.

## Quick Start

To release a new version:

```bash
./build.sh 0.4.0
```

This will:
1. Update version numbers in all files
2. Generate minified version
3. Create commit with standardized message
4. Create git tag
5. Optionally push to GitHub

## Build Script Usage

### Basic Commands

```bash
# Show help
./build.sh --help

# Dry run (preview changes without making them)
./build.sh --dry-run 0.4.0

# Build and auto-push
./build.sh -p 0.4.0

# Force build (skip git status check)
./build.sh -f 0.4.0
```

### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-d, --dry-run` | Preview changes without making them |
| `-f, --force` | Skip git status check |
| `-p, --push` | Automatically push to GitHub after build |

## Version Format

Versions must follow semantic versioning: `X.Y.Z`

- **X** (Major): Breaking changes
- **Y** (Minor): New features, backward compatible
- **Z** (Patch): Bug fixes, backward compatible

Examples: `1.0.0`, `1.2.3`, `2.0.0`

## What the Build Script Does

1. **Validates Version**
   - Checks format (X.Y.Z)
   - Ensures new version > current version

2. **Checks Requirements**
   - Git installed
   - Terser installed (`npm install -g terser`)
   - SHA256/MD5 tools available

3. **Updates Files**
   - `mwi-moonitoring-library.js` - VERSION constant
   - `mwi-moonitoring-library.min.js` - Regenerated with terser
   - `README.md` - Version references in URLs

4. **Generates Hashes**
   - SHA-256 hashes for SRI
   - MD5 hashes for compatibility
   - Displays for documentation

5. **Creates Git Commit**
   - Message: `chore(version): vX.Y.Z`
   - Includes detailed commit body

6. **Creates Git Tag**
   - Annotated tag: `vX.Y.Z`
   - Includes release notes

7. **Pushes to GitHub** (optional)
   - Pushes commits to main branch
   - Pushes tags

## Manual Release Process

If you prefer to do it manually:

```bash
# 1. Update version in library
sed -i "s/const VERSION = '[^']*'/const VERSION = '0.4.0'/" mwi-moonitoring-library.js

# 2. Generate minified version
terser mwi-moonitoring-library.js --compress --mangle --toplevel -o mwi-moonitoring-library.min.js

# 3. Update minified header
sed -i "s/@version [0-9]\+\.[0-9]\+\.[0-9]\+/@version 0.4.0/" mwi-moonitoring-library.min.js

# 4. Stage files
git add mwi-moonitoring-library.js mwi-moonitoring-library.min.js README.md

# 5. Commit
git commit -m "chore(version): v0.4.0"

# 6. Tag
git tag -a v0.4.0 -m "Release v0.4.0"

# 7. Push
git push origin main --tags
```

## After Release

Once pushed to GitHub:

1. **GitHub Action** automatically deploys to CDN
2. **Check deployment** at [GitHub Actions](https://github.com/mathewcst/mwi-moonitoring/actions)
3. **Verify CDN files**:
   - https://dns.c3d.gg/mwi-moonitoring-library.min.js
   - https://dns.c3d.gg/sri.json
   - https://dns.c3d.gg/manifest.json

## Troubleshooting

### "terser: command not found"
```bash
npm install -g terser
```

### "New version must be greater than current"
The script prevents accidental downgrades. Check current version:
```bash
grep "VERSION = " mwi-moonitoring-library.js
```

### "You have uncommitted changes"
Either commit/stash changes or use force flag:
```bash
./build.sh -f 0.4.0
```

### Dry Run First
Always test with dry-run before actual build:
```bash
./build.sh --dry-run 0.4.0
```

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.3.0 | 2025-01-14 | Developer-friendly CDN distribution |
| 0.2.0 | 2025-01-14 | Library improvements and bug fixes |
| 0.1.0 | 2025-01-13 | Initial release |