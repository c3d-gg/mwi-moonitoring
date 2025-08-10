// ==UserScript==
// @name         MWI Character Tracker (READ-ONLY)
// @namespace    https://github.com/mathewcst/mwi-moonitoring/examples
// @version      2.0.0
// @description  READ-ONLY tracker for character progress and inventory changes in Milky Way Idle
// @author       mathewcst
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @require      https://cdn.c3d.gg/moonitoring/mwi-moonitoring-library.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    /**
     * MWI Character Tracker - READ-ONLY Monitoring
     * 
     * This script is TOS-compliant and only READS WebSocket data.
     * It does NOT send any commands or automate gameplay.
     * Used for tracking progress and displaying statistics only.
     * 
     * NEW IN v2.0.0: Uses isolated instance API for better performance
     * and no conflicts with other addons.
     */

    // Character state tracking
    const characterState = {
        name: null,
        level: 0,
        skills: {},
        inventory: new Map(),
        sessionStartTime: Date.now(),
        gains: {
            items: new Map(),
            experience: new Map()
        }
    };

    // Load saved state
    const savedState = GM_getValue('character_state', {});
    if (savedState.name) {
        Object.assign(characterState, savedState);
        characterState.inventory = new Map(savedState.inventory || []);
        characterState.gains.items = new Map(savedState.gains?.items || []);
        characterState.gains.experience = new Map(savedState.gains?.experience || []);
    }

    // Create isolated instance for this addon with optimal configuration
    const tracker = MWIWebSocket.createInstance({
        eventWhitelist: [
            'init_character_data',
            'items_updated',
            'action_completed',
            'skills_updated',
            'level_up'
        ],
        enableBatching: true,
        batchInterval: 500, // Process every 500ms
        debug: false,
        historySize: 50,     // Keep moderate history for review
        cacheSize: 20        // Small cache for performance
    });
    
    console.log(`%c✨ Character Tracker using isolated instance: ${tracker.id}`, 'color: #00ff00; font-style: italic;');

    // Handle character initialization
    tracker.on('init_character_data', (eventType, data) => {
        console.log(`%c🎮 Character Initialized: ${data.character.name}`, 'color: #00ff00; font-size: 14px; font-weight: bold');
        
        // Update character state
        characterState.name = data.character.name;
        characterState.level = data.characterSkills?.find(s => s.skillHrid === '/skills/total_level')?.level || 0;
        
        // Store skills
        if (data.characterSkills) {
            data.characterSkills.forEach(skill => {
                const skillName = skill.skillHrid.replace('/skills/', '');
                characterState.skills[skillName] = skill.level;
            });
        }
        
        // Store inventory
        if (data.characterItems) {
            characterState.inventory.clear();
            data.characterItems.forEach(item => {
                if (item.count > 0) {
                    characterState.inventory.set(item.itemHrid, item.count);
                }
            });
        }
        
        // Save state
        saveState();
        
        // Display summary
        displayCharacterSummary();
    });

    // Track inventory changes
    tracker.on('items_updated', (eventType, data) => {
        const changes = [];
        
        data.characterItems.forEach(item => {
            const oldCount = characterState.inventory.get(item.itemHrid) || 0;
            const newCount = item.count;
            
            if (newCount !== oldCount) {
                const diff = newCount - oldCount;
                changes.push({
                    item: item.itemHrid,
                    diff: diff,
                    newCount: newCount
                });
                
                // Update inventory
                if (newCount > 0) {
                    characterState.inventory.set(item.itemHrid, newCount);
                } else {
                    characterState.inventory.delete(item.itemHrid);
                }
                
                // Track gains
                if (diff > 0) {
                    const totalGains = characterState.gains.items.get(item.itemHrid) || 0;
                    characterState.gains.items.set(item.itemHrid, totalGains + diff);
                }
            }
        });
        
        if (changes.length > 0) {
            console.log('📦 Inventory changes:', changes);
            
            // Notify for valuable items
            changes.forEach(change => {
                if (change.item.includes('gem') || change.item.includes('diamond')) {
                    GM_notification({
                        title: 'Valuable Item!',
                        text: `${change.diff > 0 ? '+' : ''}${change.diff} ${change.item}`,
                        timeout: 3000
                    });
                }
            });
        }
        
        saveState();
    });

    // Track action completions
    tracker.on('action_completed', (eventType, data) => {
        console.log('✅ Action completed');
        
        // Track experience gains
        if (data.characterSkills) {
            data.characterSkills.forEach(skill => {
                const skillName = skill.skillHrid.replace('/skills/', '');
                const oldLevel = characterState.skills[skillName] || 0;
                
                if (skill.level > oldLevel) {
                    console.log(`📈 Level up! ${skillName}: ${oldLevel} → ${skill.level}`);
                    characterState.skills[skillName] = skill.level;
                    
                    // Track total level
                    if (skillName === 'total_level') {
                        characterState.level = skill.level;
                        GM_notification({
                            title: 'Level Up!',
                            text: `Total level: ${skill.level}`,
                            timeout: 5000
                        });
                    }
                }
            });
        }
        
        saveState();
    });

    // Save state to storage
    function saveState() {
        const stateToSave = {
            ...characterState,
            inventory: Array.from(characterState.inventory.entries()),
            gains: {
                items: Array.from(characterState.gains.items.entries()),
                experience: Array.from(characterState.gains.experience.entries())
            }
        };
        GM_setValue('character_state', stateToSave);
    }

    // Display character summary
    function displayCharacterSummary() {
        const sessionTime = ((Date.now() - characterState.sessionStartTime) / 1000 / 60).toFixed(1);
        const totalItems = Array.from(characterState.inventory.values()).reduce((sum, count) => sum + count, 0);
        const uniqueItems = characterState.inventory.size;
        const topGains = Array.from(characterState.gains.items.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        console.log('%c═══════════════════════════════════════', 'color: #00ffff');
        console.log(`%c📊 Character: ${characterState.name} (Level ${characterState.level})`, 'color: #00ff00; font-weight: bold');
        console.log(`%c⏱️ Session Time: ${sessionTime} minutes`, 'color: #ffff00');
        console.log(`%c📦 Inventory: ${totalItems} items (${uniqueItems} unique)`, 'color: #00ffff');
        
        if (topGains.length > 0) {
            console.log('%c🏆 Top Gains This Session:', 'color: #ff00ff; font-weight: bold');
            topGains.forEach(([item, count]) => {
                console.log(`   ${item.replace('/items/', '')}: +${count}`);
            });
        }
        
        console.log('%c═══════════════════════════════════════', 'color: #00ffff');
    }

    // Add console commands
    window.MWITracker = {
        summary: displayCharacterSummary,
        
        inventory: () => {
            console.table(Array.from(characterState.inventory.entries()).map(([item, count]) => ({
                item: item.replace('/items/', ''),
                count
            })));
        },
        
        gains: () => {
            console.table(Array.from(characterState.gains.items.entries()).map(([item, count]) => ({
                item: item.replace('/items/', ''),
                gained: count
            })));
        },
        
        reset: () => {
            characterState.gains.items.clear();
            characterState.gains.experience.clear();
            characterState.sessionStartTime = Date.now();
            saveState();
            console.log('Session gains reset');
        },
        
        export: () => {
            const exportData = {
                character: characterState.name,
                level: characterState.level,
                inventory: Array.from(characterState.inventory.entries()),
                gains: Array.from(characterState.gains.items.entries()),
                sessionTime: Date.now() - characterState.sessionStartTime
            };
            console.log(JSON.stringify(exportData, null, 2));
            return exportData;
        },
        
        metrics: () => {
            const metrics = tracker.getMetrics();
            console.log('%c📈 Performance Metrics:', 'color: #00ff00; font-weight: bold');
            console.log(`Instance ID: ${tracker.id}`);
            console.log(`Events processed: ${metrics.totalEvents}`);
            console.log(`Events/sec: ${metrics.eventsPerSecond}`);
            console.log(`Avg processing time: ${metrics.avgProcessingTime.toFixed(2)}ms`);
            console.log(`Peak processing time: ${metrics.peakProcessingTime.toFixed(2)}ms`);
            return metrics;
        },
        
        // Debug functions
        instance: () => tracker,
        globalInfo: () => MWIWebSocket.getInstanceInfo()
    };

    // Display help on load
    console.log('%c🎮 MWI Character Tracker Loaded!', 'color: #00ff00; font-size: 16px; font-weight: bold');
    console.log('%cAvailable commands:', 'color: #ffff00; font-weight: bold');
    console.log('MWITracker.summary() - Show character summary');
    console.log('MWITracker.inventory() - Show current inventory');
    console.log('MWITracker.gains() - Show session gains');
    console.log('MWITracker.reset() - Reset session tracking');
    console.log('MWITracker.export() - Export character data');
    console.log('MWITracker.metrics() - Show performance metrics');

    // Wait for instance to be ready
    tracker.waitForReady().then(() => {
        console.log('%c✅ Character Tracker instance ready', 'color: #00ff00');
        console.log(`Instance ID: ${tracker.id}`);
        console.log('Listening for character events...');
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        tracker.destroy();
        saveState();
    });
})();