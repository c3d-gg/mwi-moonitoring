# Terms of Service Compliance

## ⚠️ IMPORTANT: This Library is READ-ONLY

The MWI-Moonitoring library is designed to be **100% compliant** with Milky Way Idle's Terms of Service.

## What This Library Does ✅

- **READS** WebSocket messages from the game server
- **MONITORS** game events for data collection
- **TRACKS** character progress and statistics
- **ALERTS** users about game events
- **DISPLAYS** information to help players

## What This Library DOES NOT Do ❌

- **DOES NOT** send any messages to the game server
- **DOES NOT** automate gameplay
- **DOES NOT** perform actions on behalf of the player
- **DOES NOT** modify game state
- **DOES NOT** provide any WebSocket.send() capabilities

## Technical Implementation

The library uses a **read-only hook** on `MessageEvent.prototype.data`:

```javascript
// We only intercept the 'data' getter to READ messages
const dataProperty = Object.getOwnPropertyDescriptor(MessageEvent.prototype, 'data')
const originalGet = dataProperty.get

dataProperty.get = function() {
    const message = originalGet.call(this)
    // We ONLY read and pass through - never modify or send
    processMessage(message)
    return message
}
```

**No WebSocket.send() methods are hooked or exposed.**

## Acceptable Use Cases ✅

### Data Collection & Statistics
```javascript
// ✅ GOOD: Tracking inventory changes
MWIWebSocket.on('items_updated', (type, data) => {
    const totalValue = calculateInventoryValue(data.items)
    displayStatistics(totalValue)
})
```

### Alerts & Notifications
```javascript
// ✅ GOOD: Alerting when action completes
MWIWebSocket.on('action_completed', (type, data) => {
    if (data.actionType === 'fishing') {
        showNotification('Fishing completed!')
    }
})
```

### Progress Tracking
```javascript
// ✅ GOOD: Tracking experience gains
MWIWebSocket.on('experience_gained', (type, data) => {
    updateProgressBar(data.skill, data.experience)
})
```

## Unacceptable Use Cases ❌

### Automation
```javascript
// ❌ BAD: Automatic actions
MWIWebSocket.on('action_completed', (type, data) => {
    // DO NOT DO THIS - Violates TOS
    websocket.send(JSON.stringify({
        type: 'start_action',
        action: 'fishing'
    }))
})
```

### Auto-Selling
```javascript
// ❌ BAD: Automatic selling
MWIWebSocket.on('inventory_full', (type, data) => {
    // DO NOT DO THIS - Violates TOS
    autoSellItems(data.items)
})
```

### Bot Behavior
```javascript
// ❌ BAD: Any form of botting
MWIWebSocket.on('resource_depleted', (type, data) => {
    // DO NOT DO THIS - Violates TOS
    moveToNewLocation()
    startGathering()
})
```

## Developer Guidelines

1. **Never expose WebSocket.send()** - The library intentionally does not provide any way to send messages

2. **Document your addons** - Clearly state that your addon is read-only and TOS-compliant

3. **Respect the game** - This library is for enhancing the player experience, not replacing it

4. **Report violations** - If you see addons using this library to violate TOS, please report them

## Examples of TOS-Compliant Addons

- **Market Tracker** - Tracks market prices and displays trends
- **Experience Calculator** - Calculates XP rates and time to level
- **Inventory Manager** - Shows inventory value and organization tips
- **Achievement Tracker** - Tracks progress toward achievements
- **Statistics Dashboard** - Displays session statistics and graphs

## Verification

You can verify this library is read-only by:

1. Searching the code for `send(` - You'll find no WebSocket send methods
2. Checking the hook - Only `MessageEvent.prototype.data` getter is modified
3. Testing functionality - The library cannot send messages even if you try

## Contact

If you have questions about TOS compliance:
- Create an issue on GitHub
- Contact the game developers for clarification
- Review the official Milky Way Idle Terms of Service

## Disclaimer

This library is provided as-is for educational and enhancement purposes. Users are responsible for ensuring their usage complies with the game's Terms of Service. The library authors are not responsible for misuse of this tool.

---

**Remember: Play Fair, Play Fun, Respect the Game! 🎮**