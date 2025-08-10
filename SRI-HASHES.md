# Subresource Integrity (SRI) Hashes

This document contains the SRI hashes for all versions of the MWI-Moonitoring library. Use these hashes with Tampermonkey's `@require` directive to ensure the library hasn't been tampered with.

## Current Version (v0.4.1)

### Production (Minified) - Recommended
```javascript
// Option 1: Auto-updating (no hash)
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js

// Option 2: Locked to v0.2.0 with SRI hash
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js#sha256=N+NCIaE2ABMLNnATi3IuyBYdxA6H4dYI0nT+ClopGZk=

// Option 3: Versioned URL with SRI hash (most secure)
// @require https://dns.c3d.gg/mwi-moonitoring-library-v0.2.0.min.js#sha256=N+NCIaE2ABMLNnATi3IuyBYdxA6H4dYI0nT+ClopGZk=

// Alternative: MD5 hash (less secure but wider compatibility)
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js#md5=77fcf697fde88716b1590c7f9e60accb

// Alternative: Multiple hashes (Tampermonkey uses the last supported)
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js#md5=77fcf697fde88716b1590c7f9e60accb,sha256=42ROXsEoBwTtA1DZYsJo6PeKVTRK8qII+P6r19CQg8k=
```

### Development (Full)
```javascript
// Option 1: Auto-updating (no hash)
// @require https://dns.c3d.gg/mwi-moonitoring-library.js

// Option 2: Locked to v0.2.0 with SRI hash
// @require https://dns.c3d.gg/mwi-moonitoring-library.js#sha256=N+NCIaE2ABMLNnATi3IuyBYdxA6H4dYI0nT+ClopGZk=

// Alternative: MD5 hash
// @require https://dns.c3d.gg/mwi-moonitoring-library.js#md5=f341448d0321b5a2475e581e8142226c
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

### v0.4.1 - 2025-08-10
| File | SHA-256 (Base64) | SHA-256 (Hex) | MD5 (Hex) |
|------|------------------|---------------|-----------||
| mwi-moonitoring-library.min.js | `N+NCIaE2ABMLNnATi3IuyBYdxA6H4dYI0nT+ClopGZk=` | `37e34221a13600130b3670138b722ec8161dc40e87e1d608d274fe0a5a291999` | `265710b20de527da5b3cb12a05600ea3` |
| mwi-moonitoring-library.js | `oqa1MFSTuAww79QjzZ0HDtKuEZ+HIJjLbqEvJPuaf6w=` | `a2a6b5305493b80c30efd423cd9d070ed2ae119f872098cb6ea12f24fb9a7fac` | `15d526cd8dd593d7acd45ba105cd9d9a` |

### v0.2.0 - 2025-01-14
| File | SHA-256 (Base64) | SHA-256 (Hex) | MD5 (Hex) |
|------|------------------|---------------|-----------|
| mwi-moonitoring-library.min.js | `42ROXsEoBwTtA1DZYsJo6PeKVTRK8qII+P6r19CQg8k=` | `050ac00e8dc9dd42e79c06b54a64fc98eff3b7f09da49e61e885ad35c7e96f73` | `77fcf697fde88716b1590c7f9e60accb` |
| mwi-moonitoring-library.js | `96oy6cIfPJl5WNS04Gn5jICX81k2dPLtEeEQvJG+u4k=` | `f7aa32e9c21f3c997958d4b4e069f98c8097f3593674f2ed11e110bc91bebb89` | `f341448d0321b5a2475e581e8142226c` |

### v0.4.1 - 2025-08-10
| File | SHA-256 (Base64) | SHA-256 (Hex) | MD5 (Hex) |
|------|------------------|---------------|-----------||
| mwi-moonitoring-library.min.js | `N+NCIaE2ABMLNnATi3IuyBYdxA6H4dYI0nT+ClopGZk=` | `37e34221a13600130b3670138b722ec8161dc40e87e1d608d274fe0a5a291999` | `265710b20de527da5b3cb12a05600ea3` |
| mwi-moonitoring-library.js | `oqa1MFSTuAww79QjzZ0HDtKuEZ+HIJjLbqEvJPuaf6w=` | `a2a6b5305493b80c30efd423cd9d070ed2ae119f872098cb6ea12f24fb9a7fac` | `15d526cd8dd593d7acd45ba105cd9d9a` |

### v0.1.0 - 2025-01-13
| File | SHA-256 (Base64) | MD5 (Base64) |
|------|------------------|--------------|
| mwi-moonitoring-library.min.js | `UNkrwKqNKIGtrWt74QN6ajqwxCMYtO4rfNEP2ZRj/NI=` | `/20IfavMcqcXcWLF0Jd78g==` |
| mwi-moonitoring-library.js | `EkVUApZY1eawnkoSvS1TDFGPNnGrjIMx4aovaAfYdVs=` | `mg7Wy457oqewVS4zNoLDEQ==` |

## Best Practices

1. **For Development**: Use no hash for easier testing and updates
2. **For Production**: Always use SRI hashes for security
3. **Use SHA-256**: More secure than MD5
4. **Version URLs**: Consider using versioned URLs (`-v0.2.0`) for stability
5. **Update Regularly**: Check for security updates but test before updating
6. **Document Changes**: Keep track of which version your script uses

## Troubleshooting

If you get an integrity check failure:

1. **Clear Tampermonkey cache**: Settings → Clean caches
2. **Verify the hash**: Make sure you're using the correct hash for your version
3. **Check CDN status**: The CDN might be serving a cached version
4. **Try without hash**: Temporarily remove the hash to identify if it's the issue
5. **Check console**: Browser console will show specific SRI errors
6. **Use versioned URL**: Try the versioned URL like `mwi-moonitoring-library-v0.2.0.min.js`

## Example Usage

### Development Script (Auto-updating)
```javascript
// ==UserScript==
// @name         My MWI Dev Addon
// @version      1.0.0
// @match        https://www.milkywayidle.com/*
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js
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
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js#sha256=N+NCIaE2ABMLNnATi3IuyBYdxA6H4dYI0nT+ClopGZk=
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Library locked to v0.2.0 with SRI verification
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