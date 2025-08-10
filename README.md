# MWI Moonitoring 🌙

High-performance **READ-ONLY** WebSocket event library for Milky Way Idle addon development. Designed for multiple addons to work together without conflicts.

🆕 **NEW in v0.2.0**: **Isolated Instances** - Each addon can now have its own configuration without affecting others!

> ⚠️ **IMPORTANT: Game TOS Compliance**  
> This library is **READ-ONLY** and only monitors WebSocket messages. It does NOT and CANNOT send messages to the game server.  
> Any automation that sends commands or modifies game state violates the game's Terms of Service.  
> This library is designed for data collection, monitoring, and alerting purposes only.

## What Can You Build?

With this **READ-ONLY** library, developers can create:

- 📊 **Statistics Dashboards** - Track XP rates, gold earned, items collected
- 🔔 **Alert Systems** - Notify when inventory is full, action completes, or rare drops occur  
- 📈 **Market Analyzers** - Monitor item prices and market trends
- 🏆 **Achievement Trackers** - Track progress toward game achievements
- 📝 **Activity Loggers** - Record gameplay sessions and analyze patterns
- 🎯 **Efficiency Calculators** - Calculate optimal skill training paths
- 🗺️ **Progress Visualizers** - Create visual representations of character progress

## Features

- 🚀 **High Performance** - Event batching, pre-filtering, and lazy parsing
- 🛡️ **Isolated Instances** - Each addon gets its own configuration and listeners
- 🔌 **Plug & Play** - Works immediately with zero configuration
- 🔄 **Backward Compatible** - Existing addons continue to work unchanged
- 🔍 **Event Discovery** - Automatically discover new game events
- 📊 **Performance Monitoring** - Built-in metrics and profiling
- 🎯 **TypeScript Support** - Full type definitions included
- 🧪 **Developer Friendly** - Comprehensive debugging tools

## Installation

### Quick Setup (Choose One)

```javascript
// ==UserScript==
// @name         Your MWI Addon
// @match        https://www.milkywayidle.com/*

// Option 1: Auto-updating (for development)
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js

// Option 2: With security verification (for production)
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js#sha256=Qh9t1oFtYxej0/XuJdu1m3MLBWQRpRbn08opWuf+2GM=

// Option 3: Specific version (most stable)
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library-v0.2.2.min.js
// ==/UserScript==
```

### Get Current Version & Hashes

📦 **Check current version**: https://cdn.c3d.gg/moonitoring/sri.json  
📋 **Copy @require lines**: Ready-to-use in the sri.json file  
🔐 **SRI Documentation**: [SRI-HASHES.md](./SRI-HASHES.md)

### Available Files

| File | Description | When to Use |
|------|-------------|-------------|
| `mwi-moonitoring-library.min.js` | Minified, latest | Production |
| `mwi-moonitoring-library.js` | Full source, latest | Debugging |
| `mwi-moonitoring-library-v0.2.2.min.js` | Version locked | Stable deployment |

### Local Development

For local testing:
```javascript
// @require file:///path/to/mwi-moonitoring-library.js
```

## 🚨 IMPORTANT: Multiple Addon Support

**Are you creating an addon that others will use alongside other addons?** Use the new isolated instances to prevent conflicts:

### ✅ Recommended: Isolated Instances (v0.2.0+)

```javascript
// ==UserScript==
// @name         My MWI Addon
// @match        https://www.milkywayidle.com/*
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Create your own isolated instance
    const myWebSocket = MWIWebSocket.createInstance({
        batchInterval: 30000,  // Your settings won't affect other addons
        debug: true,
        eventWhitelist: ['init_character_data', 'items_updated']
    });
    
    // Use your isolated instance
    myWebSocket.on('init_character_data', (eventType, data) => {
        console.log(`Welcome, ${data.character.name}!`);
    });
    
    myWebSocket.on('items_updated', (eventType, data) => {
        console.log('My addon: Inventory updated');
    });
})();
```

### ⚠️ Legacy: Shared Instance (Backward Compatible)

```javascript
// This still works but shares configuration with all other addons using the old API
(function() {
    'use strict';
    
    // ⚠️ WARNING: These settings affect ALL addons using the shared instance
    MWIWebSocket.configure({ batchInterval: 5000 }); // Might conflict!
    
    MWIWebSocket.on('items_updated', (eventType, data) => {
        console.log('Legacy addon: Inventory updated');
    });
})();
```

## Why Use Isolated Instances?

**Problem**: Multiple addons sharing configuration
```javascript
// Addon A sets 30-second batching
MWIWebSocket.configure({ batchInterval: 30000 });

// Addon B overwrites it with 1-second batching  
MWIWebSocket.configure({ batchInterval: 1000 }); // ❌ Conflicts!
```

**Solution**: Each addon gets its own instance
```javascript
// Addon A - isolated
const addonA = MWIWebSocket.createInstance({ batchInterval: 30000 });

// Addon B - isolated  
const addonB = MWIWebSocket.createInstance({ batchInterval: 1000 });

// ✅ No conflicts! Each addon has its own settings
```
```

## API Reference

### Creating Instances

#### `MWIWebSocket.createInstance([config])` 🆕
Create an isolated instance with its own configuration and listeners.

```javascript
// Create instance with custom config
const myWebSocket = MWIWebSocket.createInstance({
    batchInterval: 30000,
    debug: true,
    eventWhitelist: ['init_character_data', 'items_updated']
});

// Each instance has the full API
myWebSocket.on('items_updated', handler);
myWebSocket.configure({ debug: false });
myWebSocket.getMetrics();

// Clean up when done
myWebSocket.destroy();
```

**Instance Properties:**
- `id` - Unique instance identifier
- `version` - Library version
- All API methods listed below

### Global API (Shared Instance)

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

⚠️ **WARNING**: Using the global `configure()` affects ALL addons using the shared instance. For isolated configuration, create an instance with `createInstance()`.

```javascript
// ❌ Affects all addons using shared instance
MWIWebSocket.configure({
    batchInterval: 30000  // This changes it for everyone!
});

// ✅ Only affects your addon
const myWebSocket = MWIWebSocket.createInstance({
    batchInterval: 30000  // Isolated to your addon
});
```

**Configuration Options:**
```javascript
{
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
};
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
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    
    // Create isolated instance for this addon
    const alertSystem = MWIWebSocket.createInstance({
        batchInterval: 5000, // Check every 5 seconds
        eventWhitelist: ['items_updated'], // Only track inventory
        debug: false
    });
    
    const TRACKED_ITEMS = ['/items/milk', '/items/butter', '/items/egg'];
    const MAX_QUANTITY = 10000;
    
    alertSystem.on('items_updated', (eventType, data) => {
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
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Create isolated instance for action tracking
    const actionTracker = MWIWebSocket.createInstance({
        batchInterval: 1000, // Quick response for action timing
        eventWhitelist: ['action_started', 'action_completed'],
        debug: true,
        logLevel: 'info'
    });
    
    let actionStartTime = null;
    let totalActions = 0;
    let totalTime = 0;
    
    actionTracker.on('action_started', (eventType, data) => {
        actionStartTime = Date.now();
        console.log('Action started:', data.actionHrid);
    });
    
    actionTracker.on('action_completed', (eventType, data) => {
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

### Multi-Addon Compatibility Example

```javascript
// ==UserScript==
// @name         MWI Rare Item Notifier
// @match        https://www.milkywayidle.com/*
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';
    
    // Each addon creates its own isolated instance
    const rareItemMonitor = MWIWebSocket.createInstance({
        batchInterval: 10000, // Check every 10 seconds
        eventWhitelist: ['items_updated'], // Only inventory events
        debug: false,
        historySize: 10 // Keep minimal history
    });
    
    const RARE_ITEMS = ['/items/diamond', '/items/ruby', '/items/emerald'];
    let lastNotification = {};
    
    rareItemMonitor.on('items_updated', (eventType, data) => {
        const rareItems = data.characterItems.filter(item => 
            RARE_ITEMS.includes(item.itemHrid) && item.count > 0
        );
        
        rareItems.forEach(item => {
            // Prevent spam notifications
            if (lastNotification[item.itemHrid] !== item.count) {
                GM_notification({
                    title: 'Rare Item Detected!',
                    text: `${item.count} × ${item.itemHrid.replace('/items/', '')}`,
                    timeout: 3000
                });
                lastNotification[item.itemHrid] = item.count;
            }
        });
    });
    
    // Cleanup when script is disabled (optional)
    window.addEventListener('beforeunload', () => {
        rareItemMonitor.destroy();
    });
})();
```

## Performance Tips

### For Addon Developers

1. **Use Isolated Instances**: Create your own instance to avoid conflicts
2. **Configure Filtering**: Use `eventWhitelist` to only process events you need
3. **Optimize Batching**: Adjust `batchInterval` for your addon's needs
4. **Limit Memory Usage**: Reduce `historySize` and `cacheSize` if not needed
5. **Clean Up**: Call `instance.destroy()` when your addon is disabled
6. **Use Specific Events**: Avoid wildcards when possible

### Multi-Addon Scenarios

```javascript
// ✅ Good: Each addon optimized independently
const fastAddon = MWIWebSocket.createInstance({
    batchInterval: 100,     // Fast response needed
    eventWhitelist: ['action_completed']
});

const slowAddon = MWIWebSocket.createInstance({
    batchInterval: 30000,   // Batch for 30 seconds
    eventWhitelist: ['items_updated']
});

// ❌ Bad: Shared instance with conflicting needs
MWIWebSocket.configure({ batchInterval: 100 });   // Fast addon sets this
MWIWebSocket.configure({ batchInterval: 30000 }); // Slow addon overwrites it
```

## Troubleshooting

### Library not working?
```javascript
// Check if library is loaded
console.log('MWI Moonitoring version:', MWIWebSocket.version);

// Check if hook is installed
console.log('Is ready:', MWIWebSocket.isReady());

// Get instance information
console.log('Instance info:', MWIWebSocket.getInstanceInfo());

// Enable debug mode (affects all addons using shared instance)
MWIWebSocket.enableProfiling(true);

// Or enable debug for your instance only
const myWebSocket = MWIWebSocket.createInstance({ debug: true });
```

### Not receiving events?
```javascript
// For shared instance
console.log('Shared listeners:', MWIWebSocket.listenerCount());
console.log('Shared event types:', MWIWebSocket.getEventTypes());

// For your isolated instance
const myWebSocket = MWIWebSocket.createInstance();
console.log('My listeners:', myWebSocket.listenerCount());
console.log('My event types:', myWebSocket.getEventTypes());

// Discover events
const events = await myWebSocket.discover(30000);
console.log('Discovered:', events);
```

### Performance issues?
```javascript
// Check global instance info
const info = MWIWebSocket.getInstanceInfo();
console.log('Active instances:', info.count);
console.log('Global hook installed:', info.globalHookInstalled);

// Check metrics for your instance
const myWebSocket = MWIWebSocket.createInstance();
const metrics = myWebSocket.getMetrics();
console.log('My metrics:', metrics);

// Optimize your instance (doesn't affect others)
myWebSocket.configure({
    eventWhitelist: ['items_updated'], // Only needed events
    historySize: 10,                   // Reduce history
    cacheSize: 20,                     // Reduce cache
    batchInterval: 5000                // Batch for 5 seconds
});
```

## Migration Guide

### Upgrading from v0.1.x to v0.2.0

Your existing code will continue to work, but you should migrate to isolated instances:

#### Before (v0.1.x)
```javascript
// Old way - shared configuration
MWIWebSocket.configure({ batchInterval: 30000 });
MWIWebSocket.on('items_updated', handler);
```

#### After (v0.2.0+)
```javascript
// New way - isolated instance
const myWebSocket = MWIWebSocket.createInstance({ 
    batchInterval: 30000 
});
myWebSocket.on('items_updated', handler);
```

#### Benefits of Migration
- ✅ No configuration conflicts with other addons
- ✅ Independent performance tuning
- ✅ Cleaner debugging (separate metrics per addon)
- ✅ Better memory management

## Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Opera  
- ⚠️ Safari (limited testing)

**Tampermonkey Compatibility:**
- ✅ Tampermonkey (all browsers)
- ✅ Greasemonkey (Firefox)
- ✅ Violentmonkey (all browsers)

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
- 🔄 [Migration Guide](https://github.com/mathewcst/mwi-moonitoring/wiki/Migration-Guide)
- 🤝 [Multi-Addon Best Practices](https://github.com/mathewcst/mwi-moonitoring/wiki/Multi-Addon-Guide)

---

Made with ❤️ for the Milky Way Idle community
