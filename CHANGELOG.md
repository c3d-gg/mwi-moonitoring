# Changelog

All notable changes to MWI-Moonitoring will be documented in this file.

## [0.2.0] - 2024-01-XX

### 🎉 Major Features
- **Isolated Instances**: Added `MWIWebSocket.createInstance()` for conflict-free multi-addon support
- **Global Hook Sharing**: Single efficient WebSocket hook shared across all instances
- **Per-Instance Configuration**: Each instance can have independent settings without affecting others

### 🔧 New APIs
- `MWIWebSocket.createInstance(config)` - Create isolated instance with custom configuration
- `MWIWebSocket.getInstanceInfo()` - Get information about all active instances
- `instance.destroy()` - Clean up individual instances
- `instance.id` - Unique identifier for each instance

### ⚡ Performance Improvements
- **Shared Hook Architecture**: More efficient than multiple hooks
- **Isolated Processing**: Each instance processes only its relevant events
- **Memory Management**: Better cleanup and resource management per instance

### 🛠️ Breaking Changes
- None! Full backward compatibility maintained
- Existing addons continue to work unchanged
- Old API now uses a shared default instance

### 📚 Documentation
- Updated README with multi-addon examples
- Added comprehensive Migration Guide
- Created Multi-Addon Best Practices guide
- Updated all examples to show both old and new patterns

### ⚠️ Warnings & Deprecations
- Added warnings when using global `configure()` to highlight potential conflicts
- Guidance provided for migrating to isolated instances

### 🔍 Developer Experience
- Enhanced logging shows instance IDs for better debugging
- Configuration conflicts are now clearly identified
- Better error isolation between addons

---

## [0.1.1] - 2024-01-XX

### 🐛 Bug Fixes
- Fixed WebSocket hook installation race conditions
- Improved error handling in event processing
- Better memory management for event history

### 🔧 Improvements
- Enhanced performance monitoring
- Better event discovery functionality
- Improved TypeScript definitions

---

## [0.1.0] - 2024-01-XX

### 🎉 Initial Release
- WebSocket message interception for Milky Way Idle
- Event-driven architecture with subscription model
- High-performance event batching and filtering
- Built-in performance monitoring and metrics
- Event discovery system for unknown events
- Comprehensive configuration options
- Full TypeScript support
- Browser and Tampermonkey compatibility

### 🔧 Core Features
- Event subscription (`on`, `once`, `off`, `offAll`)
- Wildcard pattern support for event types
- Configurable batching and throttling
- Event history and caching
- Performance profiling and debugging tools
- Memory leak prevention with listener limits

### 📚 Documentation
- Complete API reference
- Example userscripts and addons
- Performance optimization guide
- Troubleshooting documentation