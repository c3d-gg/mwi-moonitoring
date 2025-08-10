# Subresource Integrity (SRI) Hashes

This document contains the SRI hashes for all versions of the MWI-Moonitoring library. Use these hashes with Tampermonkey's `@require` directive to ensure the library hasn't been tampered with.

## Current Version (v0.1.0)

### Production (Minified) - Recommended
```javascript
// Option 1: Auto-updating (no hash)
// @require https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js

// Option 2: Locked to v0.1.0 with SRI hash
// @require https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js#sha256=B1qInUUpyIGexRNfoJj/paN/D7KXpXCikNsJYkFlDBA=

// Option 3: Versioned URL with SRI hash (most secure)
// @require https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library-v0.1.0.min.js#sha256=B1qInUUpyIGexRNfoJj/paN/D7KXpXCikNsJYkFlDBA=

// Alternative: MD5 hash (less secure but wider compatibility)
// @require https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js#md5=4462cd2ba60ffcd6cd58ff19b7c5c815
```

### Development (Full)
```javascript
// Option 1: Auto-updating (no hash)
// @require https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.js

// Option 2: Locked to v0.1.0 with SRI hash
// @require https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.js#sha256=Qh6W7xeY9Qv4eQ8vKSxqIkOQVYXWLbxtZjFvBGx0jLs=

// Alternative: MD5 hash
// @require https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.js#md5=c4ceb75a0b6588a9e5230ea5a9a9e3c7
```

## When to Use Which Option

### Use Auto-updating (no hash)
- During development
- When you want automatic bug fixes
- For personal scripts where you trust the CDN

### Use SRI Hash
- For production deployment
- When distributing to other users
- When security is critical
- To prevent unexpected breaking changes

### Use Versioned URL with Hash
- For maximum security and stability
- When you need a specific tested version
- For critical production scripts

## How SRI Works

Subresource Integrity (SRI) is a security feature that enables browsers and userscript managers to verify that resources they fetch haven't been manipulated. It works by:

1. **Hash Generation**: A cryptographic hash of the file content is generated
2. **Hash Verification**: When the resource is fetched, its hash is computed and compared to the expected hash
3. **Security**: If hashes don't match, the resource is rejected, protecting against:
   - CDN compromises
   - Man-in-the-middle attacks
   - Accidental file corruption

## Tampermonkey Support

Tampermonkey supports SRI through the `@require` directive:

```javascript
// @require <url>#<algorithm>=<base64-hash>
// @require <url>#<algorithm>-<hex-hash>
```

Supported algorithms:
- `sha256` - SHA-256 hash (recommended)
- `md5` - MD5 hash (wider compatibility but less secure)
- `sha384`, `sha512` - Depends on browser's `window.crypto` support

## Generating Hashes

To generate SRI hashes for new versions:

### Using Linux/Mac/WSL Commands
```bash
# SHA-256 (hex)
sha256sum mwi-moonitoring-library.min.js

# SHA-256 (base64 for SRI)
sha256sum mwi-moonitoring-library.min.js | cut -d' ' -f1 | xxd -r -p | base64

# MD5 (hex)
md5sum mwi-moonitoring-library.min.js

# MD5 (base64)
md5sum mwi-moonitoring-library.min.js | cut -d' ' -f1 | xxd -r -p | base64
```

### Using OpenSSL
```bash
# SHA-256
openssl dgst -sha256 -binary file.js | openssl base64 -A

# MD5
openssl dgst -md5 -binary file.js | openssl base64 -A
```

### Using PowerShell (Windows)
```powershell
# SHA-256
$hash = Get-FileHash -Algorithm SHA256 -Path "file.js"
[Convert]::ToBase64String([byte[]]::new($hash.Hash.Length/2))

# MD5
$hash = Get-FileHash -Algorithm MD5 -Path "file.js"
[Convert]::ToBase64String([byte[]]::new($hash.Hash.Length/2))
```

### Using Online Tools
- https://www.srihash.org/
- https://report-uri.com/home/sri_hash

## Version History

### v0.1.0 - 2025-08-10 (Initial Release)
| File | SHA-256 (Base64) | SHA-256 (Hex) | MD5 (Hex) |
|------|------------------|---------------|-----------|
| mwi-moonitoring-library.min.js | `B1qInUUpyIGexRNfoJj/paN/D7KXpXCikNsJYkFlDBA=` | `075a889d4529c8819ec5135fa098ffa5a37f0fb297a570a290db096241650c10` | `4462cd2ba60ffcd6cd58ff19b7c5c815` |
| mwi-moonitoring-library.js | `Qh6W7xeY9Qv4eQ8vKSxqIkOQVYXWLbxtZjFvBGx0jLs=` | `646246fe23e67586fe05909d8b93dc222c29cdf94780b4ea0565b1326920ebf9` | `c4ceb75a0b6588a9e5230ea5a9a9e3c7` |

## Best Practices

1. **For Development**: Use no hash for easier testing and updates
2. **For Production**: Always use SRI hashes for security
3. **Use SHA-256**: More secure than MD5
4. **Version URLs**: Consider using versioned URLs (`-v0.1.0`) for stability
5. **Update Regularly**: Check for security updates but test before updating
6. **Document Changes**: Keep track of which version your script uses

## Troubleshooting

If you get an integrity check failure:

1. **Clear Tampermonkey cache**: Settings → Clean caches
2. **Verify the hash**: Make sure you're using the correct hash for your version
3. **Check CDN status**: The CDN might be serving a cached version
4. **Try without hash**: Temporarily remove the hash to identify if it's the issue
5. **Check console**: Browser console will show specific SRI errors
6. **Use versioned URL**: Try the versioned URL like `mwi-moonitoring-library-v0.1.0.min.js`

## Example Usage

### Development Script (Auto-updating)
```javascript
// ==UserScript==
// @name         My MWI Dev Addon
// @version      1.0.0
// @match        https://www.milkywayidle.com/*
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Library auto-updates with CDN
    MWIWebSocket.on('init_character_data', (eventType, data) => {
        console.log('Character initialized:', data);
    });
})();
```

### Production Script (Locked Version)
```javascript
// ==UserScript==
// @name         My MWI Production Addon
// @version      1.0.0
// @match        https://www.milkywayidle.com/*
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js#sha256=B1qInUUpyIGexRNfoJj/paN/D7KXpXCikNsJYkFlDBA=
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Library locked to v0.1.0 with SRI verification
    MWIWebSocket.on('init_character_data', (eventType, data) => {
        console.log('Character initialized:', data);
    });
})();
```

## Security Notes

1. **HTTPS Only**: Always use HTTPS URLs for the CDN
2. **Verify Hashes**: Double-check hashes when updating
3. **Monitor Changes**: Be aware of library updates
4. **Test Updates**: Test new versions before updating production scripts
5. **Report Issues**: Report any security concerns to the repository

---

For more information, see the [Tampermonkey documentation on Subresource Integrity](https://www.tampermonkey.net/documentation.php#api:@resource).