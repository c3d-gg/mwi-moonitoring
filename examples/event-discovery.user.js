// ==UserScript==
// @name         MWI Event Discovery Tool (READ-ONLY)
// @namespace    https://github.com/mathewcst/mwi-moonitoring/examples
// @version      1.0.0
// @description  READ-ONLY tool to discover and log WebSocket events in Milky Way Idle
// @author       mathewcst
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @require      https://dns.c3d.gg/mwi-moonitoring-library.min.js#sha256=UNkrwKqNKIGtrWt74QN6ajqwxCMYtO4rfNEP2ZRj/NI=
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add a floating panel for event discovery
    GM_addStyle(`
        #mwi-discovery-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 600px;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            border: 2px solid #0f0;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
        }
        #mwi-discovery-panel h3 {
            margin: 0 0 10px 0;
            color: #0f0;
            border-bottom: 1px solid #0f0;
            padding-bottom: 5px;
        }
        #mwi-discovery-panel .event-item {
            margin: 5px 0;
            padding: 5px;
            background: rgba(0, 255, 0, 0.1);
            border-left: 3px solid #0f0;
        }
        #mwi-discovery-panel .event-count {
            color: #ff0;
            font-weight: bold;
        }
        #mwi-discovery-panel button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 5px 10px;
            margin: 5px;
            cursor: pointer;
            font-weight: bold;
        }
        #mwi-discovery-panel button:hover {
            background: #0a0;
        }
        #mwi-discovery-panel .metrics {
            background: rgba(0, 100, 0, 0.3);
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
    `);

    // Create discovery panel
    const panel = document.createElement('div');
    panel.id = 'mwi-discovery-panel';
    panel.innerHTML = `
        <h3>🔍 MWI Event Discovery</h3>
        <div class="controls">
            <button id="discover-btn">Start Discovery (60s)</button>
            <button id="clear-btn">Clear</button>
            <button id="export-btn">Export</button>
            <button id="toggle-btn">Hide</button>
        </div>
        <div class="metrics" id="metrics">
            <div>Total Events: <span class="event-count" id="total-events">0</span></div>
            <div>Events/sec: <span class="event-count" id="events-per-sec">0</span></div>
            <div>Unique Types: <span class="event-count" id="unique-types">0</span></div>
        </div>
        <div id="event-list"></div>
    `;
    document.body.appendChild(panel);

    // Event tracking
    const eventCounts = new Map();
    let isDiscovering = false;
    let updateInterval = null;

    // Configure library for discovery
    MWIWebSocket.configure({
        enableDiscovery: true,
        debug: true,
        logLevel: 'info',
        historySize: 100
    });

    // Listen to all events using wildcard
    MWIWebSocket.on('*', (eventType, data) => {
        // Update event counts
        const count = eventCounts.get(eventType) || 0;
        eventCounts.set(eventType, count + 1);
        
        // Log to console
        console.log(`[MWI Event] ${eventType}:`, data);
        
        // Update UI
        updateEventList();
    });

    // Update event list display
    function updateEventList() {
        const listEl = document.getElementById('event-list');
        const sortedEvents = Array.from(eventCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        listEl.innerHTML = sortedEvents.map(([type, count]) => `
            <div class="event-item">
                <strong>${type}</strong>: <span class="event-count">${count}</span>
            </div>
        `).join('');
    }

    // Update metrics display
    function updateMetrics() {
        const metrics = MWIWebSocket.getMetrics();
        document.getElementById('total-events').textContent = metrics.totalEvents;
        document.getElementById('events-per-sec').textContent = metrics.eventsPerSecond;
        document.getElementById('unique-types').textContent = eventCounts.size;
    }

    // Start metrics update interval
    updateInterval = setInterval(updateMetrics, 1000);

    // Button handlers
    document.getElementById('discover-btn').onclick = async function() {
        if (isDiscovering) {
            console.log('Discovery already in progress');
            return;
        }
        
        isDiscovering = true;
        this.textContent = 'Discovering...';
        this.disabled = true;
        
        console.log('Starting event discovery for 60 seconds...');
        
        const events = await MWIWebSocket.discover(60000);
        
        console.log('Discovery complete!');
        console.table(events);
        
        // Update UI with discovered events
        events.forEach(event => {
            if (!eventCounts.has(event.type)) {
                eventCounts.set(event.type, event.count);
            }
        });
        updateEventList();
        
        this.textContent = 'Start Discovery (60s)';
        this.disabled = false;
        isDiscovering = false;
    };

    document.getElementById('clear-btn').onclick = function() {
        eventCounts.clear();
        MWIWebSocket.resetMetrics();
        MWIWebSocket.clear();
        updateEventList();
        updateMetrics();
        console.log('Cleared all event data');
    };

    document.getElementById('export-btn').onclick = function() {
        const exportData = {
            timestamp: new Date().toISOString(),
            metrics: MWIWebSocket.getMetrics(),
            events: Array.from(eventCounts.entries()).map(([type, count]) => ({
                type,
                count
            })),
            history: MWIWebSocket.getEventHistory(50)
        };
        
        const json = JSON.stringify(exportData, null, 2);
        console.log('Exported data:', json);
        
        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            alert('Event data copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Check console for exported data');
        });
    };

    document.getElementById('toggle-btn').onclick = function() {
        const panel = document.getElementById('mwi-discovery-panel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            this.textContent = 'Hide';
        } else {
            panel.style.display = 'none';
            this.textContent = 'Show';
        }
    };

    // Log initialization
    console.log('%c🔍 MWI Event Discovery Tool Loaded!', 'color: #0f0; font-size: 16px; font-weight: bold');
    console.log('Library version:', MWIWebSocket.version);
    console.log('Ready:', MWIWebSocket.isReady());
    console.log('Use the panel in the top-right corner to discover events');
    
    // Also log some useful commands
    console.log('%cUseful commands:', 'color: #ff0; font-weight: bold');
    console.log('MWIWebSocket.getMetrics() - Get performance metrics');
    console.log('MWIWebSocket.getEventHistory(10) - Get last 10 events');
    console.log('MWIWebSocket.discover(30000) - Discover events for 30 seconds');
    console.log('MWIWebSocket.enableProfiling(true) - Enable debug logging');
})();