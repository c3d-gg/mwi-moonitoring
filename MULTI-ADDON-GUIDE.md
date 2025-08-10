# Multi-Addon Configuration Guide

This guide demonstrates how multiple Tampermonkey addons can use MWI-Moonitoring without interfering with each other.

## The Problem (Before v0.2.0)

When multiple addons used the library, their configurations would conflict:

### Addon A (Inventory Monitor)
```javascript
// ==UserScript==
// @name         Inventory Monitor A
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// ==/UserScript==

// Addon A needs 30-second batching for efficiency
MWIWebSocket.configure({ batchInterval: 30000 });

MWIWebSocket.on('items_updated', (eventType, data) => {
    console.log('Addon A: Checking inventory...');
});
```

### Addon B (Action Tracker) 
```javascript
// ==UserScript==
// @name         Action Tracker B
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// ==/UserScript==

// Addon B needs fast 1-second response for timing
MWIWebSocket.configure({ batchInterval: 1000 }); // ❌ Overwrites Addon A!

MWIWebSocket.on('action_completed', (eventType, data) => {
    console.log('Addon B: Action completed!');
});
```

**Result**: Addon B's 1-second batching overwrites Addon A's 30-second setting, causing Addon A to process events much faster than intended, wasting resources.

## The Solution (v0.2.0+)

Each addon creates its own isolated instance:

### Addon A (Inventory Monitor) - Updated
```javascript
// ==UserScript==
// @name         Inventory Monitor A
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Create isolated instance with Addon A's requirements
    const inventoryMonitor = MWIWebSocket.createInstance({
        batchInterval: 30000,    // 30-second batching for efficiency
        eventWhitelist: ['items_updated'], // Only inventory events
        debug: false,
        historySize: 20
    });

    inventoryMonitor.on('items_updated', (eventType, data) => {
        console.log('Addon A: Checking inventory...', data.characterItems.length, 'items');
        
        // Check for valuable items
        const valuableItems = data.characterItems.filter(item => 
            item.itemHrid.includes('diamond') || item.itemHrid.includes('ruby')
        );
        
        if (valuableItems.length > 0) {
            console.log('Addon A: Found valuable items!', valuableItems);
        }
    });
})();
```

### Addon B (Action Tracker) - Updated
```javascript
// ==UserScript==
// @name         Action Tracker B
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Create isolated instance with Addon B's requirements  
    const actionTracker = MWIWebSocket.createInstance({
        batchInterval: 1000,     // 1-second batching for responsiveness
        eventWhitelist: ['action_started', 'action_completed'],
        debug: true,
        logLevel: 'info',
        historySize: 100         // Keep more history for analysis
    });

    let actionStartTime = null;
    let totalActions = 0;
    let totalTime = 0;

    actionTracker.on('action_started', (eventType, data) => {
        actionStartTime = Date.now();
        console.log('Addon B: Action started -', data.actionHrid);
    });

    actionTracker.on('action_completed', (eventType, data) => {
        if (actionStartTime) {
            const duration = Date.now() - actionStartTime;
            totalActions++;
            totalTime += duration;
            
            console.log(`Addon B: Action completed in ${duration}ms`);
            console.log(`Addon B: Average time: ${(totalTime / totalActions).toFixed(0)}ms`);
            
            actionStartTime = null;
        }
    });
})();
```

## Results

✅ **Addon A**: Processes inventory updates every 30 seconds efficiently  
✅ **Addon B**: Gets immediate action notifications with 1-second batching  
✅ **No Conflicts**: Each addon has isolated configuration  
✅ **Shared Hook**: Only one WebSocket hook for optimal performance  

## Instance Information

You can check how many instances are active:

```javascript
const info = MWIWebSocket.getInstanceInfo();
console.log('Active instances:', info.count);
console.log('Instance details:', info.instances);
console.log('Global hook installed:', info.globalHookInstalled);
```

## Best Practices

### 1. Always Create Instances
```javascript
// ❌ Don't use shared instance for addons
MWIWebSocket.configure({ ... });

// ✅ Create your own instance
const myAddon = MWIWebSocket.createInstance({ ... });
```

### 2. Optimize for Your Use Case
```javascript
// Fast response addon
const fastAddon = MWIWebSocket.createInstance({
    batchInterval: 500,
    eventWhitelist: ['action_completed', 'combat_ended']
});

// Slow analysis addon  
const analysisAddon = MWIWebSocket.createInstance({
    batchInterval: 60000,
    eventWhitelist: ['items_updated'],
    historySize: 1000
});
```

### 3. Clean Up Resources
```javascript
// When your addon is disabled/unloaded
window.addEventListener('beforeunload', () => {
    myAddon.destroy(); // Cleanup instance
});
```

### 4. Debug Individual Addons
```javascript
// Enable debugging for just your addon
const myAddon = MWIWebSocket.createInstance({
    debug: true,
    logLevel: 'debug'
});

// Check your addon's metrics
console.log('My addon metrics:', myAddon.getMetrics());
```

## Migration Checklist

- [ ] Replace `MWIWebSocket.configure()` with `createInstance()`
- [ ] Replace `MWIWebSocket.on()` with `instance.on()`
- [ ] Optimize configuration for your specific use case
- [ ] Add cleanup with `instance.destroy()` if needed
- [ ] Test that your addon works alongside others
- [ ] Update your addon's documentation

## Common Issues

### "My addon is too slow/fast"
Adjust the `batchInterval` for your needs:
```javascript
const myAddon = MWIWebSocket.createInstance({
    batchInterval: 5000 // Process every 5 seconds
});
```

### "Too many events being processed"
Use event filtering:
```javascript
const myAddon = MWIWebSocket.createInstance({
    eventWhitelist: ['items_updated', 'action_completed'] // Only these events
});
```

### "Memory usage is high"
Reduce history and cache:
```javascript
const myAddon = MWIWebSocket.createInstance({
    historySize: 10,   // Keep fewer events in history
    cacheSize: 20,     // Cache fewer events
    enableCache: false // Or disable caching entirely
});
```

### "Debugging conflicts with other addons"
Use instance-specific debugging:
```javascript
// Instead of global debugging
MWIWebSocket.enableProfiling(true); // ❌ Affects everyone

// Use instance debugging
const myAddon = MWIWebSocket.createInstance({
    debug: true,       // ✅ Only your addon
    logLevel: 'debug'
});
```