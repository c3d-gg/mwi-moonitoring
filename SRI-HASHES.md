# Subresource Integrity (SRI) Hashes

This document contains the SRI hashes for all versions of the MWI-Moonitoring library. Use these hashes with Tampermonkey's `@require` directive to ensure the library hasn't been tampered with.

## Current Version (v0.1.0)

### Production (Minified)
```javascript
// SHA-256 (Recommended)
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js#sha256=UNkrwKqNKIGtrWt74QN6ajqwxCMYtO4rfNEP2ZRj/NI=

// MD5 (Fallback)
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js#md5=/20IfavMcqcXcWLF0Jd78g==
```

### Development (Full)
```javascript
// SHA-256 (Recommended)
// @require https://dns.c3d.gg/mwi-moonitoring-library.js#sha256=EkVUApZY1eawnkoSvS1TDFGPNnGrjIMx4aovaAfYdVs=

// MD5 (Fallback)
// @require https://dns.c3d.gg/mwi-moonitoring-library.js#md5=mg7Wy457oqewVS4zNoLDEQ==
```

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
```

Supported algorithms:
- `sha256` - SHA-256 hash (recommended)
- `md5` - MD5 hash (wider compatibility but less secure)
- `sha384`, `sha512` - Depends on browser support

## Generating Hashes

To generate SRI hashes for new versions:

### Using OpenSSL (Linux/Mac/WSL)
```bash
# SHA-256
openssl dgst -sha256 -binary file.js | openssl base64 -A

# MD5
openssl dgst -md5 -binary file.js | openssl base64 -A
```

### Using PowerShell (Windows)
```powershell
# SHA-256
[Convert]::ToBase64String((Get-FileHash -Algorithm SHA256 -Path "file.js").Hash)

# MD5
[Convert]::ToBase64String((Get-FileHash -Algorithm MD5 -Path "file.js").Hash)
```

### Using Online Tools
- https://www.srihash.org/
- https://report-uri.com/home/sri_hash

## Version History

### v0.1.0 (Current)
| File | SHA-256 | MD5 |
|------|---------|-----|
| mwi-moonitoring-library.min.js | `UNkrwKqNKIGtrWt74QN6ajqwxCMYtO4rfNEP2ZRj/NI=` | `/20IfavMcqcXcWLF0Jd78g==` |
| mwi-moonitoring-library.js | `EkVUApZY1eawnkoSvS1TDFGPNnGrjIMx4aovaAfYdVs=` | `mg7Wy457oqewVS4zNoLDEQ==` |

## Best Practices

1. **Always use SRI** for production userscripts to ensure security
2. **Use SHA-256** when possible (more secure than MD5)
3. **Update hashes** whenever the library is updated
4. **Test with SRI** before deploying to ensure hashes are correct
5. **Document hashes** for each version for user reference

## Troubleshooting

If you get an integrity check failure:

1. **Verify the hash** is correct for your version
2. **Check the CDN** hasn't cached an old version
3. **Try the MD5 hash** if SHA-256 isn't supported
4. **Remove SRI temporarily** to test if it's the issue
5. **Check browser console** for specific error messages

## Example Usage

```javascript
// ==UserScript==
// @name         My MWI Addon
// @version      1.0.0
// @match        https://www.milkywayidle.com/*
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js#sha256=UNkrwKqNKIGtrWt74QN6ajqwxCMYtO4rfNEP2ZRj/NI=
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Access the library securely
    const MWIWebSocket = window.MWIWebSocket;
    
    // Your code here
    MWIWebSocket.on('init_character_data', (data) => {
        console.log('Character initialized:', data);
    });
})();
```