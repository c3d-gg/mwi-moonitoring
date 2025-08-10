# MWI Moonitoring 🌙

High-performance **READ-ONLY** WebSocket event library for Milky Way Idle addon development. Zero configuration, maximum performance, no conflicts.

> ⚠️ **IMPORTANT: Game TOS Compliance**  
> This library is **READ-ONLY** and only monitors WebSocket messages. It does NOT and CANNOT send messages to the game server.  
> Any automation that sends commands or modifies game state violates the game's Terms of Service.  
> This library is designed for data collection, monitoring, and alerting purposes only.

## Features

- 🚀 **High Performance** - Event batching, pre-filtering, and lazy parsing
- 🔌 **Plug & Play** - Works immediately with zero configuration
- 🛡️ **Non-Blocking** - Multiple addons can use it simultaneously without conflicts
- 🔍 **Event Discovery** - Automatically discover new game events
- 📊 **Performance Monitoring** - Built-in metrics and profiling
- 🎯 **TypeScript Support** - Full type definitions included
- 🧪 **Developer Friendly** - Comprehensive debugging tools

## Installation

### Method 1: CDN @require (Recommended)

Add this line to your userscript header:

```javascript
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js
```

#### With Subresource Integrity (SRI)

For enhanced security, use SRI hashes to ensure the library hasn't been tampered with:

```javascript
// Minified version with SHA-256 (recommended)
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js#sha256=UNkrwKqNKIGtrWt74QN6ajqwxCMYtO4rfNEP2ZRj/NI=

// Full version with SHA-256
// @require https://dns.c3d.gg/mwi-moonitoring-library.js#sha256=EkVUApZY1eawnkoSvS1TDFGPNnGrjIMx4aovaAfYdVs=

// Alternative: MD5 hash (wider compatibility)
// @require https://dns.c3d.gg/mwi-moonitoring-library.min.js#md5=/20IfavMcqcXcWLF0Jd78g==
```

Available CDN options:
- `https://dns.c3d.gg/mwi-moonitoring-library.js` - Full version
- `https://dns.c3d.gg/mwi-moonitoring-library.min.js` - Minified (recommended)
- `https://dns.c3d.gg/mwi-moonitoring-library-v0.1.0.min.js` - Specific version (stable)

### Method 2: Local Development

```javascript
// @require file:///path/to/mwi-moonitoring-library.js
```

## Quick Start

```javascript
// ==UserScript==
// @name         My MWI Addon
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Listen for character initialization
    MWIWebSocket.on('init_character_data', (eventType, data) => {
        console.log(`Welcome, ${data.character.name}!`);
        console.log(`Level: ${data.characterSkills.find(s => s.skillHrid === '/skills/total_level')?.level}`);
    });
    
    // Listen for inventory changes
    MWIWebSocket.on('items_updated', (eventType, data) => {
        console.log('Inventory updated:', data.characterItems.length, 'items');
    });
    
    // Listen for multiple events
    MWIWebSocket.on(['action_started', 'action_completed'], (eventType, data) => {
        console.log(`Action event: ${eventType}`);
    });
})();
```

## API Reference

### Event Subscription

#### `on(eventTypes, callback)`
Subscribe to one or more events.

```javascript
// Single event
MWIWebSocket.on('items_updated', (eventType, data) => {
    console.log('Items:', data.characterItems);
});

// Multiple events
MWIWebSocket.on(['action_started', 'action_completed'], (eventType, data) => {
    console.log(`Event: ${eventType}`);
});

// Wildcard support
MWIWebSocket.on('action_*', (eventType, data) => {
    console.log('Any action event:', eventType);
});

// Unsubscribe
const unsubscribe = MWIWebSocket.on('items_updated', handler);
unsubscribe(); // Remove listener
```

#### `once(eventType, callback)`
Subscribe to an event only once.

```javascript
MWIWebSocket.once('init_character_data', (eventType, data) => {
    console.log('First character load only');
});
```

#### `off(eventTypes, callback)`
Unsubscribe from events.

```javascript
const handler = (type, data) => console.log(data);
MWIWebSocket.on('items_updated', handler);
MWIWebSocket.off('items_updated', handler);
```

#### `offAll([eventType])`
Remove all listeners.

```javascript
// Remove all listeners for specific event
MWIWebSocket.offAll('items_updated');

// Remove all listeners
MWIWebSocket.offAll();
```

### Event Discovery

#### `discover(duration)`
Discover all WebSocket events for a specified duration.

```javascript
// Discover events for 60 seconds
const events = await MWIWebSocket.discover(60000);
events.forEach(event => {
    console.log(`Event: ${event.type}, Count: ${event.count}`);
});
```

### Performance Monitoring

#### `getMetrics()`
Get performance metrics.

```javascript
const metrics = MWIWebSocket.getMetrics();
console.log(`Total events: ${metrics.totalEvents}`);
console.log(`Events/sec: ${metrics.eventsPerSecond}`);
console.log(`Avg processing: ${metrics.avgProcessingTime}ms`);
console.log(`Top events:`, metrics.topEvents);
```

#### `enableProfiling(enabled)`
Enable debug logging and profiling.

```javascript
MWIWebSocket.enableProfiling(true);  // Enable
MWIWebSocket.enableProfiling(false); // Disable
```

### Configuration

#### `configure(options)`
Customize library behavior.

```javascript
MWIWebSocket.configure({
    // Performance
    enableBatching: true,        // Batch events (default: true)
    batchInterval: 100,          // ms between batches (default: 100)
    maxBatchSize: 50,           // Max events per batch (default: 50)
    
    // Filtering
    eventWhitelist: ['items_updated', 'action_completed'], // Only these events
    eventBlacklist: ['ping', 'pong'],                     // Never these events
    
    // Discovery
    enableDiscovery: true,       // Track unknown events
    discoveryLimit: 100,         // Max discovered events
    
    // Debugging
    debug: true,                 // Enable debug logging
    logLevel: 'debug',          // 'error' | 'warn' | 'info' | 'debug'
    
    // Memory
    historySize: 50,            // Events to keep in history
    enableCache: true,          // Cache parsed events
});
```

### Utilities

#### `getEventHistory(limit)`
Get recent events.

```javascript
// Last 10 events
const recent = MWIWebSocket.getEventHistory(10);

// All history
const all = MWIWebSocket.getEventHistory();
```

#### `getEventTypes()`
Get all event types with active listeners.

```javascript
const types = MWIWebSocket.getEventTypes();
console.log('Listening for:', types);
```

#### `listenerCount([eventType])`
Get number of listeners.

```javascript
// For specific event
const count = MWIWebSocket.listenerCount('items_updated');

// Total listeners
const total = MWIWebSocket.listenerCount();
```

#### `waitForReady()`
Wait for library initialization.

```javascript
await MWIWebSocket.waitForReady();
console.log('Library ready!');
```

## Known Events

### Character & Profile
- `init_character_data` - Full character initialization
- `character_updated` - Character stats changed
- `level_up` - Character or skill leveled up

### Inventory & Items
- `items_updated` - Inventory changed
- `item_added` - New item acquired
- `item_removed` - Item consumed/sold
- `equipment_changed` - Equipment updated

### Actions & Skills
- `action_started` - Action initiated
- `action_completed` - Action finished
- `action_cancelled` - Action stopped
- `action_queue_updated` - Queue modified
- `skills_updated` - Skill experience changed

### Combat
- `combat_started` - Battle begun
- `combat_round` - Combat round completed
- `combat_ended` - Battle finished
- `enemy_defeated` - Enemy killed

### Market & Trading
- `market_listing_created` - Item listed
- `market_listing_sold` - Item sold
- `market_listing_cancelled` - Listing removed
- `trade_completed` - Trade executed

### Buffs & Consumables
- `buff_added` - Buff applied
- `buff_removed` - Buff expired
- `consumable_used` - Item consumed
- `action_type_consumable_slots_updated` - Consumable slots changed

## Example Addons

### Inventory Overflow Alert

```javascript
// ==UserScript==
// @name         MWI Inventory Overflow Alert
// @match        https://www.milkywayidle.com/*
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    
    const TRACKED_ITEMS = ['/items/milk', '/items/butter', '/items/egg'];
    const MAX_QUANTITY = 10000;
    
    MWIWebSocket.on('items_updated', (eventType, data) => {
        const overflowing = data.characterItems.filter(item => 
            TRACKED_ITEMS.includes(item.itemHrid) && item.count > MAX_QUANTITY
        );
        
        if (overflowing.length > 0) {
            // READ-ONLY: Alert user that items are overflowing
            GM_notification({
                title: 'Inventory Overflow!',
                text: `${overflowing.length} item types exceeding ${MAX_QUANTITY}`,
                timeout: 5000
            });
            console.log('Overflowing items:', overflowing);
        }
    });
})();
```

### Action Time Tracker

```javascript
// ==UserScript==
// @name         MWI Action Time Tracker
// @match        https://www.milkywayidle.com/*
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    let actionStartTime = null;
    let totalActions = 0;
    let totalTime = 0;
    
    MWIWebSocket.on('action_started', (eventType, data) => {
        actionStartTime = Date.now();
        console.log('Action started:', data.actionHrid);
    });
    
    MWIWebSocket.on('action_completed', (eventType, data) => {
        if (actionStartTime) {
            const duration = Date.now() - actionStartTime;
            totalActions++;
            totalTime += duration;
            
            console.log(`Action completed in ${duration}ms`);
            console.log(`Average: ${(totalTime / totalActions).toFixed(0)}ms`);
            
            actionStartTime = null;
        }
    });
})();
```

### Inventory Monitor

```javascript
// ==UserScript==
// @name         MWI Inventory Monitor
// @match        https://www.milkywayidle.com/*
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    
    const VALUABLE_ITEMS = ['/items/diamond', '/items/ruby', '/items/emerald'];
    
    MWIWebSocket.on('items_updated', (eventType, data) => {
        const valuable = data.characterItems.filter(item => 
            VALUABLE_ITEMS.includes(item.itemHrid)
        );
        
        valuable.forEach(item => {
            if (item.count > 0) {
                GM_notification({
                    title: 'Valuable Item!',
                    text: `You have ${item.count} ${item.itemHrid}`,
                    timeout: 5000
                });
            }
        });
    });
})();
```

## Performance Tips

1. **Use Event Filtering**: Configure whitelists to only process events you need
2. **Batch Processing**: Keep batching enabled for better performance
3. **Limit History**: Reduce `historySize` if you don't need event history
4. **Clean Up**: Always call `offAll()` when your addon is disabled
5. **Use Wildcards Sparingly**: Specific event names are faster than wildcards

## Troubleshooting

### Library not working?
```javascript
// Check if library is loaded
console.log('MWI Moonitoring version:', MWIWebSocket.version);

// Check if hook is installed
console.log('Is ready:', MWIWebSocket.isReady());

// Enable debug mode
MWIWebSocket.enableProfiling(true);
```

### Not receiving events?
```javascript
// Check listener count
console.log('Listeners:', MWIWebSocket.listenerCount());

// Check event types
console.log('Event types:', MWIWebSocket.getEventTypes());

// Discover events
const events = await MWIWebSocket.discover(30000);
console.log('Discovered:', events);
```

### Performance issues?
```javascript
// Check metrics
const metrics = MWIWebSocket.getMetrics();
console.log('Metrics:', metrics);

// Optimize configuration
MWIWebSocket.configure({
    eventWhitelist: ['items_updated'], // Only needed events
    historySize: 10,                   // Reduce history
    cacheSize: 20                      // Reduce cache
});
```

## Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Opera
- ⚠️ Safari (limited testing)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Credits

- Original WebSocket hook technique by [YangLeda](https://github.com/YangLeda/Userscripts-For-MilkyWayIdle)
- Inspired by MWITools and the MWI addon community

## License

MIT License - See [LICENSE](LICENSE) file for details

## Support

- 🐛 [Report Issues](https://github.com/mathewcst/mwi-moonitoring/issues)
- 💬 [Discussions](https://github.com/mathewcst/mwi-moonitoring/discussions)
- 📖 [Documentation](https://github.com/mathewcst/mwi-moonitoring/wiki)

---

Made with ❤️ for the Milky Way Idle community
