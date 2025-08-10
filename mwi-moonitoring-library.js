/**
 * MWI Moonitoring - READ-ONLY WebSocket Event Library for Milky Way Idle
 * @version 0.1.1
 * @author c3d.gg
 * @license MIT
 * @homepage https://github.com/mathewcst/mwi-moonitoring
 *
 * ⚠️ TOS COMPLIANCE WARNING:
 * This library is READ-ONLY and only monitors incoming WebSocket messages.
 * It does NOT and CANNOT send messages to the game server.
 * Any automation that sends commands violates the game's Terms of Service.
 * 
 * A high-performance, non-blocking library for intercepting and processing
 * WebSocket events in Milky Way Idle. Designed to be used by multiple addons
 * simultaneously without conflicts.
 *
 * IMPORTANT: This is a LIBRARY, not a userscript. Use it via @require:
 * // @require https://cdn.c3d.gg/mwi-moonitoring-library.min.js
 *
 * @example
 * // In your userscript header:
 * // @require https://cdn.c3d.gg/mwi-moonitoring-library.min.js
 *
 * // In your script (READ-ONLY operations):
 * MWIWebSocket.on('init_character_data', (eventType, data) => {
 *   console.log('Character loaded:', data.character.name);
 *   // ✅ OK: Reading and displaying data
 *   // ❌ NOT OK: Sending commands or automating gameplay
 * });
 *
 * @credits Original WebSocket hook technique by YangLeda
 */

;(function (global) {
  'use strict'

  // Prevent multiple initializations
  if (global.MWIWebSocket && global.MWIWebSocket._initialized) {
    return
  }

  // ============================================================================
  // Configuration and Constants
  // ============================================================================

  const VERSION = '0.1.1'
  const LIBRARY_NAME = 'MWI-Moonitoring'

  /**
   * @typedef {Object} ConfigOptions
   * @property {boolean} [enableBatching=true] - Enable event batching for performance
   * @property {number} [batchInterval=100] - Milliseconds between batch processing
   * @property {number} [maxBatchSize=50] - Maximum events per batch
   * @property {boolean} [preParsing=true] - Pre-parse JSON for performance optimization
   * @property {string[]} [eventWhitelist=[]] - Only process these event types (empty = all)
   * @property {string[]} [eventBlacklist=[]] - Never process these event types
   * @property {boolean} [enableDiscovery=false] - Track unknown events for discovery
   * @property {number} [discoveryLimit=100] - Maximum number of discovered events to track
   * @property {boolean} [debug=false] - Enable debug logging
   * @property {'error'|'warn'|'info'|'debug'} [logLevel='warn'] - Logging level
   * @property {number} [historySize=50] - Number of events to keep in history
   * @property {boolean} [enableCache=true] - Enable event caching
   * @property {number} [cacheSize=100] - Maximum number of cached events
   * @property {'isolate'|'propagate'|'suppress'} [errorHandling='isolate'] - Error handling strategy
   * @property {number} [maxListenersPerEvent=100] - Maximum listeners per event to prevent memory leaks
   */
  const DEFAULT_CONFIG = {
    // Performance
    enableBatching: true,
    batchInterval: 100,
    maxBatchSize: 50,
    preParsing: true,

    // Filtering
    eventWhitelist: [],
    eventBlacklist: [],

    // Discovery
    enableDiscovery: false,
    discoveryLimit: 100,

    // Debugging
    debug: false,
    logLevel: 'warn',

    // Memory
    historySize: 50,
    enableCache: true,
    cacheSize: 100,

    // Safety
    errorHandling: 'isolate',
    maxListenersPerEvent: 100,
  }

  // Known WebSocket endpoints for Milky Way Idle
  const WS_ENDPOINTS = [
    'api.milkywayidle.com/ws',
    'api-test.milkywayidle.com/ws',
  ]

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const utils = {
    /**
     * Deep clone an object (for JSON-serializable data)
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone(obj) {
      if (obj === null || typeof obj !== 'object') return obj
      if (obj instanceof Date) return new Date(obj.getTime())
      if (obj instanceof Array) return obj.map((item) => utils.deepClone(item))
      if (obj instanceof Object) {
        const cloned = {}
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            cloned[key] = utils.deepClone(obj[key])
          }
        }
        return cloned
      }
    },

    /**
     * Check if a string matches a pattern with wildcards
     * @param {string} str - String to test
     * @param {string} pattern - Pattern with optional wildcards (*)
     * @returns {boolean} True if matches
     */
    matchesPattern(str, pattern) {
      if (!pattern.includes('*')) {
        return str === pattern
      }
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return regex.test(str)
    },

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Minimum time between executions in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
      let inThrottle
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args)
          inThrottle = true
          setTimeout(() => (inThrottle = false), limit)
        }
      }
    },

    /**
     * Safe JSON parse with error handling
     * @param {string} json - JSON string to parse
     * @returns {Object|null} Parsed object or null if invalid
     */
    safeParse(json) {
      try {
        return JSON.parse(json)
      } catch (e) {
        return null
      }
    },

    /**
     * Get high-resolution timestamp
     * @returns {number} Current timestamp in milliseconds
     */
    now() {
      return performance.now()
    },
  }

  // ============================================================================
  // Logger System
  // ============================================================================

  class Logger {
    constructor(config) {
      this.config = config
      this.levels = { error: 0, warn: 1, info: 2, debug: 3 }
    }

    _shouldLog(level) {
      if (!this.config.debug) return false
      return this.levels[level] <= this.levels[this.config.logLevel]
    }

    _format(level, message, ...args) {
      const prefix = `[${LIBRARY_NAME}] [${level.toUpperCase()}]`
      return [prefix, message, ...args]
    }

    error(message, ...args) {
      if (this._shouldLog('error')) {
        console.error(...this._format('error', message, ...args))
      }
    }

    warn(message, ...args) {
      if (this._shouldLog('warn')) {
        console.warn(...this._format('warn', message, ...args))
      }
    }

    info(message, ...args) {
      if (this._shouldLog('info')) {
        console.info(...this._format('info', message, ...args))
      }
    }

    debug(message, ...args) {
      if (this._shouldLog('debug')) {
        console.log(...this._format('debug', message, ...args))
      }
    }
  }

  // ============================================================================
  // Event Emitter
  // ============================================================================

  class EventEmitter {
    constructor(config, logger) {
      this.config = config
      this.logger = logger
      this.events = new Map()
      this.onceEvents = new Set()
    }

    /**
     * Subscribe to one or more events
     * @param {string|string[]} eventTypes - Event type(s) to subscribe to
     * @param {Function} callback - Function to call when event occurs
     * @returns {Function} Unsubscribe function
     */
    on(eventTypes, callback) {
      if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function')
      }

      const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes]

      types.forEach((type) => {
        if (!this.events.has(type)) {
          this.events.set(type, new Set())
        }

        const listeners = this.events.get(type)

        // Check max listeners
        if (listeners.size >= this.config.maxListenersPerEvent) {
          this.logger.warn(
            `Max listeners (${this.config.maxListenersPerEvent}) reached for event: ${type}`
          )
          return
        }

        listeners.add(callback)
        this.logger.debug(`Listener added for event: ${type}`)
      })

      // Return unsubscribe function
      return () => this.off(eventTypes, callback)
    }

    /**
     * Subscribe to an event only once
     * @param {string} eventType - Event type to subscribe to
     * @param {Function} callback - Function to call when event occurs
     * @returns {Function} Unsubscribe function
     */
    once(eventType, callback) {
      const wrapper = (...args) => {
        this.off(eventType, wrapper)
        callback(...args)
      }

      this.onceEvents.add(wrapper)
      return this.on(eventType, wrapper)
    }

    /**
     * Unsubscribe from one or more events
     * @param {string|string[]} eventTypes - Event type(s) to unsubscribe from
     * @param {Function} callback - Callback function to remove
     */
    off(eventTypes, callback) {
      const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes]

      types.forEach((type) => {
        const listeners = this.events.get(type)
        if (listeners) {
          listeners.delete(callback)
          if (listeners.size === 0) {
            this.events.delete(type)
          }
          this.logger.debug(`Listener removed for event: ${type}`)
        }
      })
    }

    /**
     * Remove all listeners for an event or all events
     * @param {string} [eventType] - Optional event type. If not provided, removes all listeners
     */
    offAll(eventType) {
      if (eventType) {
        this.events.delete(eventType)
        this.logger.debug(`All listeners removed for event: ${eventType}`)
      } else {
        this.events.clear()
        this.onceEvents.clear()
        this.logger.debug('All listeners removed')
      }
    }

    /**
     * Emit an event to all listeners
     * @param {string} eventType - Event type to emit
     * @param {*} data - Event data
     * @returns {number} Number of listeners that received the event
     */
    emit(eventType, data) {
      const listeners = new Set()

      // Direct listeners
      if (this.events.has(eventType)) {
        this.events
          .get(eventType)
          .forEach((listener) => listeners.add(listener))
      }

      // Wildcard listeners
      this.events.forEach((eventListeners, pattern) => {
        if (pattern.includes('*') && utils.matchesPattern(eventType, pattern)) {
          eventListeners.forEach((listener) => listeners.add(listener))
        }
      })

      // Execute listeners
      listeners.forEach((listener) => {
        try {
          if (this.config.errorHandling === 'isolate') {
            // Isolate errors to prevent affecting other listeners
            setTimeout(() => {
              try {
                listener(eventType, data)
              } catch (error) {
                this.logger.error(`Error in listener for ${eventType}:`, error)
              }
            }, 0)
          } else if (this.config.errorHandling === 'suppress') {
            try {
              listener(eventType, data)
            } catch (error) {
              this.logger.error(`Error in listener for ${eventType}:`, error)
            }
          } else {
            listener(eventType, data)
          }
        } catch (error) {
          this.logger.error(`Fatal error in listener for ${eventType}:`, error)
        }
      })

      return listeners.size
    }

    /**
     * Get number of listeners for an event
     * @param {string} [eventType] - Event type to check. If not provided, returns total listeners
     * @returns {number} Number of listeners
     */
    listenerCount(eventType) {
      if (!eventType) {
        let total = 0
        this.events.forEach((listeners) => (total += listeners.size))
        return total
      }

      const listeners = this.events.get(eventType)
      return listeners ? listeners.size : 0
    }

    /**
     * Get all registered event types
     * @returns {string[]} Array of event type names
     */
    eventNames() {
      return Array.from(this.events.keys())
    }
  }

  // ============================================================================
  // Performance Monitor
  // ============================================================================

  class PerformanceMonitor {
    constructor() {
      this.metrics = {
        totalEvents: 0,
        eventsPerType: new Map(),
        processingTimes: [],
        avgProcessingTime: 0,
        peakProcessingTime: 0,
        droppedEvents: 0,
        errors: 0,
        startTime: Date.now(),
        lastReset: Date.now(),
      }

      this.maxSamples = 1000
    }

    recordEvent(eventType, processingTime) {
      this.metrics.totalEvents++

      // Update per-type counter
      const count = this.metrics.eventsPerType.get(eventType) || 0
      this.metrics.eventsPerType.set(eventType, count + 1)

      // Record processing time
      this.metrics.processingTimes.push(processingTime)
      if (this.metrics.processingTimes.length > this.maxSamples) {
        this.metrics.processingTimes.shift()
      }

      // Update statistics
      this.metrics.avgProcessingTime =
        this.metrics.processingTimes.reduce((a, b) => a + b, 0) /
        this.metrics.processingTimes.length

      if (processingTime > this.metrics.peakProcessingTime) {
        this.metrics.peakProcessingTime = processingTime
      }
    }

    recordError() {
      this.metrics.errors++
    }

    recordDropped() {
      this.metrics.droppedEvents++
    }

    getMetrics() {
      const uptime = Date.now() - this.metrics.startTime
      const rate = this.metrics.totalEvents / (uptime / 1000)

      return {
        ...this.metrics,
        uptime: uptime,
        eventsPerSecond: rate.toFixed(2),
        topEvents: Array.from(this.metrics.eventsPerType.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
      }
    }

    reset() {
      this.metrics.totalEvents = 0
      this.metrics.eventsPerType.clear()
      this.metrics.processingTimes = []
      this.metrics.avgProcessingTime = 0
      this.metrics.peakProcessingTime = 0
      this.metrics.droppedEvents = 0
      this.metrics.errors = 0
      this.metrics.lastReset = Date.now()
    }
  }

  // ============================================================================
  // Event Discovery System
  // ============================================================================

  class EventDiscovery {
    constructor(config, logger) {
      this.config = config
      this.logger = logger
      this.discoveries = new Map()
      this.isDiscovering = false
      this.discoveryResolve = null
    }

    /**
     * Start event discovery
     * @param {number} duration - Duration in milliseconds
     * @returns {Promise<Object[]>} Promise resolving to discovered events
     */
    start(duration = 60000) {
      if (this.isDiscovering) {
        return Promise.reject(new Error('Discovery already in progress'))
      }

      this.isDiscovering = true
      this.discoveries.clear()
      this.logger.info(`Starting event discovery for ${duration}ms`)

      return new Promise((resolve) => {
        this.discoveryResolve = resolve

        setTimeout(() => {
          this.stop()
        }, duration)
      })
    }

    stop() {
      if (!this.isDiscovering) return

      this.isDiscovering = false
      const results = this.getResults()
      this.logger.info(
        `Discovery complete. Found ${results.length} event types`
      )

      if (this.discoveryResolve) {
        this.discoveryResolve(results)
        this.discoveryResolve = null
      }
    }

    record(eventType, data) {
      if (!this.isDiscovering) return
      if (this.discoveries.size >= this.config.discoveryLimit) return

      if (!this.discoveries.has(eventType)) {
        this.discoveries.set(eventType, {
          type: eventType,
          count: 0,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          samples: [],
        })
      }

      const discovery = this.discoveries.get(eventType)
      discovery.count++
      discovery.lastSeen = Date.now()

      if (discovery.samples.length < 3) {
        discovery.samples.push({
          timestamp: Date.now(),
          data: utils.deepClone(data),
        })
      }
    }

    getResults() {
      return Array.from(this.discoveries.values()).sort(
        (a, b) => b.count - a.count
      )
    }
  }

  // ============================================================================
  // Message Queue for Batching
  // ============================================================================

  class MessageQueue {
    constructor(config, processor) {
      this.config = config
      this.processor = processor
      this.queue = []
      this.timer = null
      this.processing = false
      this.logger = null // Will be set when config is updated
    }

    updateConfig(newConfig) {
      const oldInterval = this.config.batchInterval
      this.config = newConfig
      this.logger = new Logger(this.config) // Create logger for debug messages
      
      // If batchInterval changed and we have a running timer, restart it
      if (oldInterval !== newConfig.batchInterval && this.timer) {
        this.logger.debug(`Restarting batch timer: ${oldInterval}ms → ${newConfig.batchInterval}ms`)
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.flush(), this.config.batchInterval)
      }
    }

    add(message) {
      if (!this.config.enableBatching) {
        // Process immediately if batching is disabled
        this.processor([message])
        return
      }

      this.queue.push(message)

      // Start timer if not already running
      if (!this.timer) {
        if (this.logger) {
          this.logger.debug(`Starting batch timer with ${this.config.batchInterval}ms interval (queue: ${this.queue.length})`)
        }
        this.timer = setTimeout(() => this.flush(), this.config.batchInterval)
      }

      // Flush if queue is full
      if (this.queue.length >= this.config.maxBatchSize) {
        this.flush()
      }
    }

    flush() {
      if (this.processing || this.queue.length === 0) return

      this.processing = true

      // Clear timer
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }

      // Process batch
      const batch = this.queue.splice(0, this.config.maxBatchSize)

      try {
        this.processor(batch)
      } catch (error) {
        console.error('[MWI-Moonitoring] Batch processing error:', error)
      } finally {
        this.processing = false

        // Schedule next batch if queue has items
        if (this.queue.length > 0 && !this.timer) {
          if (this.logger) {
            this.logger.debug(`Scheduling next batch timer with ${this.config.batchInterval}ms interval (remaining: ${this.queue.length})`)
          }
          this.timer = setTimeout(() => this.flush(), this.config.batchInterval)
        }
      }
    }

    clear() {
      this.queue = []
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    }

    size() {
      return this.queue.length
    }
  }

  // ============================================================================
  // Main WebSocket Hook Manager
  // ============================================================================

  class WebSocketHookManager {
    constructor() {
      this.config = { ...DEFAULT_CONFIG }
      this.logger = new Logger(this.config)
      this.emitter = new EventEmitter(this.config, this.logger)
      this.monitor = new PerformanceMonitor()
      this.discovery = new EventDiscovery(this.config, this.logger)
      this.queue = new MessageQueue(this.config, this.processBatch.bind(this))
      this.queue.updateConfig(this.config) // Initialize logger

      this.isHooked = false
      this.originalGet = null
      this.eventHistory = []
      this.eventCache = new Map()

      this._initialized = true
    }

    /**
     * Install the WebSocket hook
     */
    installHook() {
      if (this.isHooked) {
        this.logger.debug('WebSocket already hooked')
        return
      }

      try {
        const dataProperty = Object.getOwnPropertyDescriptor(
          MessageEvent.prototype,
          'data'
        )

        if (!dataProperty || !dataProperty.get) {
          throw new Error('Cannot access MessageEvent.prototype.data')
        }

        this.originalGet = dataProperty.get
        const self = this

        dataProperty.get = function hookedGet() {
          const socket = this.currentTarget

          // Check if this is a WebSocket
          if (!(socket instanceof WebSocket)) {
            return self.originalGet.call(this)
          }

          // Check if this is an MWI WebSocket
          const isMWISocket = WS_ENDPOINTS.some(
            (endpoint) => socket.url && socket.url.indexOf(endpoint) > -1
          )

          if (!isMWISocket) {
            return self.originalGet.call(this)
          }

          // Get the original message
          const message = self.originalGet.call(this)

          // Prevent infinite loop
          Object.defineProperty(this, 'data', { value: message })

          // Process the message asynchronously to avoid blocking
          setTimeout(() => self.processMessage(message), 0)

          return message
        }

        Object.defineProperty(MessageEvent.prototype, 'data', dataProperty)

        this.isHooked = true
        this.logger.info('WebSocket hook installed successfully')
      } catch (error) {
        this.logger.error('Failed to install WebSocket hook:', error)
        throw error
      }
    }

    /**
     * Remove the WebSocket hook
     */
    removeHook() {
      if (!this.isHooked || !this.originalGet) {
        return
      }

      try {
        const dataProperty = Object.getOwnPropertyDescriptor(
          MessageEvent.prototype,
          'data'
        )

        dataProperty.get = this.originalGet
        Object.defineProperty(MessageEvent.prototype, 'data', dataProperty)

        this.isHooked = false
        this.originalGet = null
        this.logger.info('WebSocket hook removed')
      } catch (error) {
        this.logger.error('Failed to remove WebSocket hook:', error)
      }
    }

    /**
     * Process a WebSocket message
     */
    processMessage(message) {
      const startTime = utils.now()

      try {
        // Quick type check for performance
        if (typeof message !== 'string' || message.length < 2) {
          return
        }

        // Quick JSON check
        if (message[0] !== '{' && message[0] !== '[') {
          return
        }

        // Pre-filtering for performance (check if message contains "type" field)
        if (this.config.preParsing && !message.includes('"type"')) {
          return
        }

        // Parse JSON
        const data = utils.safeParse(message)
        if (!data || !data.type) {
          return
        }

        // Check blacklist
        if (this.config.eventBlacklist.includes(data.type)) {
          this.monitor.recordDropped()
          return
        }

        // Check whitelist
        if (
          this.config.eventWhitelist.length > 0 &&
          !this.config.eventWhitelist.includes(data.type)
        ) {
          this.monitor.recordDropped()
          return
        }

        // Add to queue for batch processing
        this.queue.add({
          type: data.type,
          data: data,
          timestamp: Date.now(),
        })

        // Record for discovery
        if (this.config.enableDiscovery || this.discovery.isDiscovering) {
          this.discovery.record(data.type, data)
        }

        // Record performance metrics
        const processingTime = utils.now() - startTime
        this.monitor.recordEvent(data.type, processingTime)
      } catch (error) {
        this.monitor.recordError()
        this.logger.error('Error processing message:', error)
      }
    }

    /**
     * Process a batch of messages
     */
    processBatch(messages) {
      const startTime = utils.now()

      messages.forEach((msg) => {
        try {
          // Add to history
          if (this.eventHistory.length >= this.config.historySize) {
            this.eventHistory.shift()
          }
          this.eventHistory.push(msg)

          // Cache management
          if (this.config.enableCache) {
            this.eventCache.set(msg.type, msg)

            // Limit cache size
            if (this.eventCache.size > this.config.cacheSize) {
              const firstKey = this.eventCache.keys().next().value
              this.eventCache.delete(firstKey)
            }
          }

          // Emit to listeners
          const listenerCount = this.emitter.emit(msg.type, msg.data)

          if (listenerCount > 0) {
            this.logger.debug(
              `Event ${msg.type} emitted to ${listenerCount} listeners`
            )
          }
        } catch (error) {
          this.monitor.recordError()
          this.logger.error(`Error processing event ${msg.type}:`, error)
        }
      })

      const batchTime = utils.now() - startTime
      if (batchTime > 10) {
        this.logger.warn(
          `Batch processing took ${batchTime.toFixed(2)}ms for ${
            messages.length
          } messages`
        )
      }
    }

    configure(options) {
      const oldConfig = { ...this.config }
      this.config = { ...this.config, ...options }
      
      // Create new logger with updated config
      this.logger = new Logger(this.config)
      
      // Update components with new config
      this.emitter.config = this.config
      this.discovery.config = this.config
      this.queue.updateConfig(this.config)

      this.logger.info('Configuration updated:', {
        ...options,
        _batchIntervalChanged: oldConfig.batchInterval !== this.config.batchInterval
      })
    }

    getConfig() {
      return { ...this.config }
    }

    getEventHistory(limit) {
      if (limit) {
        return this.eventHistory.slice(-limit)
      }
      return [...this.eventHistory]
    }

    getCachedEvent(eventType) {
      return this.eventCache.get(eventType)
    }

    clear() {
      this.eventHistory = []
      this.eventCache.clear()
      this.queue.clear()
      this.monitor.reset()
      this.logger.info('All data cleared')
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  const manager = new WebSocketHookManager()

  // Auto-install hook when first listener is added
  let autoHookInstalled = false
  const ensureHook = () => {
    if (!autoHookInstalled) {
      manager.installHook()
      autoHookInstalled = true
    }
  }

  /**
   * @typedef {Object} PerformanceMetrics
   * @property {number} totalEvents - Total number of events processed
   * @property {Map<string, number>} eventsPerType - Map of event types to their counts
   * @property {number[]} processingTimes - Array of recent processing times
   * @property {number} avgProcessingTime - Average processing time in milliseconds
   * @property {number} peakProcessingTime - Peak processing time in milliseconds
   * @property {number} droppedEvents - Number of dropped events
   * @property {number} errors - Number of errors encountered
   * @property {number} startTime - Library start timestamp
   * @property {number} uptime - Library uptime in milliseconds
   * @property {string} eventsPerSecond - Events processed per second
   * @property {Array<[string, number]>} topEvents - Top 10 most frequent events
   */

  /**
   * @typedef {Object} DiscoveryResult
   * @property {string} type - Event type name
   * @property {number} count - Number of times this event was seen
   * @property {number} firstSeen - First time this event was seen (timestamp)
   * @property {number} lastSeen - Last time this event was seen (timestamp)
   * @property {Object[]} samples - Sample data from this event type
   */

  /**
   * @typedef {Object} EventHistoryEntry
   * @property {string} type - Event type
   * @property {*} data - Event data
   * @property {number} timestamp - Timestamp when event was received
   */

  const MWIWebSocket = {
    // Version
    version: VERSION,
    _initialized: true,

    /**
     * Subscribe to one or more WebSocket events
     * @param {string|string[]} eventTypes - Event type(s) to listen for. Supports wildcards (e.g., 'action_*')
     * @param {Function} callback - Function to call when event is received. Receives (eventType, data)
     * @returns {Function} Unsubscribe function - call this to remove the listener
     * @example
     * // Listen to a single event
     * const unsubscribe = MWIWebSocket.on('init_character_data', (eventType, data) => {
     *   console.log('Character loaded:', data.character.name);
     * });
     *
     * // Later, unsubscribe
     * unsubscribe();
     *
     * @example
     * // Listen to multiple events
     * MWIWebSocket.on(['items_updated', 'action_completed'], (eventType, data) => {
     *   console.log(`Event ${eventType} received`);
     * });
     *
     * @example
     * // Use wildcards
     * MWIWebSocket.on('action_*', (eventType, data) => {
     *   console.log('Any action event:', eventType);
     * });
     */
    on(eventTypes, callback) {
      ensureHook()
      return manager.emitter.on(eventTypes, callback)
    },

    /**
     * Subscribe to an event only once
     * @param {string} eventType - Event type to listen for
     * @param {Function} callback - Function to call when event is received. Receives (eventType, data)
     * @returns {Function} Unsubscribe function - call this to remove the listener
     * @example
     * MWIWebSocket.once('init_character_data', (eventType, data) => {
     *   console.log('This will only fire once');
     * });
     */
    once(eventType, callback) {
      ensureHook()
      return manager.emitter.once(eventType, callback)
    },

    /**
     * Unsubscribe from one or more events
     * @param {string|string[]} eventTypes - Event type(s) to unsubscribe from
     * @param {Function} callback - The exact callback function that was used to subscribe
     * @example
     * const handler = (type, data) => console.log(data);
     * MWIWebSocket.on('items_updated', handler);
     * // Later...
     * MWIWebSocket.off('items_updated', handler);
     */
    off(eventTypes, callback) {
      return manager.emitter.off(eventTypes, callback)
    },

    /**
     * Remove all listeners for an event or all events
     * @param {string} [eventType] - Optional event type. If not provided, removes ALL listeners
     * @example
     * // Remove all listeners for a specific event
     * MWIWebSocket.offAll('items_updated');
     *
     * @example
     * // Remove ALL listeners for ALL events
     * MWIWebSocket.offAll();
     */
    offAll(eventType) {
      return manager.emitter.offAll(eventType)
    },

    /**
     * Manually emit an event (for testing/debugging)
     * @param {string} eventType - Event type to emit
     * @param {*} data - Event data to send to listeners
     * @returns {number} Number of listeners that received the event
     * @example
     * // Test your event handlers
     * MWIWebSocket.emit('test_event', { test: true });
     */
    emit(eventType, data) {
      return manager.emitter.emit(eventType, data)
    },

    /**
     * Discover WebSocket events for a specified duration
     * @param {number} [duration=60000] - How long to run discovery in milliseconds
     * @returns {Promise<DiscoveryResult[]>} Promise resolving to array of discovered events
     * @example
     * // Discover events for 30 seconds
     * const events = await MWIWebSocket.discover(30000);
     * events.forEach(event => {
     *   console.log(`Event: ${event.type}, Count: ${event.count}`);
     * });
     */
    async discover(duration = 60000) {
      ensureHook()
      const oldConfig = manager.config.enableDiscovery
      manager.configure({ enableDiscovery: true })

      const results = await manager.discovery.start(duration)

      manager.configure({ enableDiscovery: oldConfig })
      return results
    },

    /**
     * Get event history
     * @param {number} [limit] - Optional limit on number of events to return
     * @returns {EventHistoryEntry[]} Array of historical events
     * @example
     * // Get last 10 events
     * const recentEvents = MWIWebSocket.getEventHistory(10);
     *
     * @example
     * // Get all history
     * const allEvents = MWIWebSocket.getEventHistory();
     */
    getEventHistory(limit) {
      return manager.getEventHistory(limit)
    },

    /**
     * Get all registered event types (that have listeners)
     * @returns {string[]} Array of event type names
     * @example
     * const eventTypes = MWIWebSocket.getEventTypes();
     * console.log('Currently listening for:', eventTypes);
     */
    getEventTypes() {
      return manager.emitter.eventNames()
    },

    /**
     * Get count of events processed
     * @param {string} [eventType] - Optional event type to get count for
     * @returns {number} Number of events processed
     * @example
     * // Get total events processed
     * const total = MWIWebSocket.getEventCount();
     *
     * @example
     * // Get count for specific event type
     * const itemUpdates = MWIWebSocket.getEventCount('items_updated');
     */
    getEventCount(eventType) {
      if (eventType) {
        return manager.monitor.metrics.eventsPerType.get(eventType) || 0
      }
      return manager.monitor.metrics.totalEvents
    },

    /**
     * Get cached event data for a specific event type
     * @param {string} eventType - Event type to get cached data for
     * @returns {EventHistoryEntry|undefined} Cached event data or undefined if not found
     * @example
     * // Get the last 'items_updated' event data
     * const lastItemUpdate = MWIWebSocket.getCachedEvent('items_updated');
     * if (lastItemUpdate) {
     *   console.log('Last update:', lastItemUpdate.data);
     * }
     */
    getCachedEvent(eventType) {
      return manager.getCachedEvent(eventType)
    },

    /**
     * Get performance metrics
     * @returns {PerformanceMetrics} Performance metrics object
     * @example
     * const metrics = MWIWebSocket.getMetrics();
     * console.log(`Processed ${metrics.totalEvents} events`);
     * console.log(`Average processing time: ${metrics.avgProcessingTime}ms`);
     * console.log(`Events per second: ${metrics.eventsPerSecond}`);
     */
    getMetrics() {
      return manager.monitor.getMetrics()
    },

    /**
     * Reset performance metrics
     * @example
     * // Reset all performance counters
     * MWIWebSocket.resetMetrics();
     */
    resetMetrics() {
      manager.monitor.reset()
    },

    /**
     * Enable or disable profiling/debug mode
     * @param {boolean} enabled - Whether to enable profiling
     * @example
     * // Enable debug logging
     * MWIWebSocket.enableProfiling(true);
     *
     * // Disable debug logging
     * MWIWebSocket.enableProfiling(false);
     */
    enableProfiling(enabled) {
      manager.configure({
        debug: enabled,
        logLevel: enabled ? 'debug' : 'warn',
      })
    },

    /**
     * Configure the library
     * @param {ConfigOptions} options - Configuration options to apply
     * @example
     * MWIWebSocket.configure({
     *   debug: true,
     *   enableBatching: false,
     *   eventWhitelist: ['init_character_data', 'items_updated'],
     *   logLevel: 'debug'
     * });
     */
    configure(options) {
      manager.configure(options)
    },

    /**
     * Get current configuration
     * @returns {ConfigOptions} Current configuration object
     * @example
     * const config = MWIWebSocket.getConfig();
     * console.log('Debug mode:', config.debug);
     */
    getConfig() {
      return manager.getConfig()
    },

    /**
     * Check if the library is ready (hook installed)
     * @returns {boolean} True if WebSocket hook is installed and ready
     * @example
     * if (MWIWebSocket.isReady()) {
     *   console.log('Library is ready to receive events');
     * }
     */
    isReady() {
      return manager.isHooked
    },

    /**
     * Wait for the library to be ready
     * @returns {Promise<void>} Promise that resolves when the library is ready
     * @example
     * await MWIWebSocket.waitForReady();
     * console.log('Library is now ready');
     */
    waitForReady() {
      return new Promise((resolve) => {
        if (manager.isHooked) {
          resolve()
        } else {
          ensureHook()
          // Give hook time to install
          setTimeout(resolve, 100)
        }
      })
    },

    /**
     * Get number of listeners for an event
     * @param {string} [eventType] - Optional event type. If not provided, returns total listeners
     * @returns {number} Number of listeners
     * @example
     * // Get listeners for specific event
     * const itemListeners = MWIWebSocket.listenerCount('items_updated');
     *
     * @example
     * // Get total number of listeners across all events
     * const totalListeners = MWIWebSocket.listenerCount();
     */
    listenerCount(eventType) {
      return manager.emitter.listenerCount(eventType)
    },

    /**
     * Manually install the WebSocket hook (advanced usage)
     * Note: This is usually done automatically when you add the first listener
     * @example
     * MWIWebSocket.installHook();
     */
    installHook() {
      manager.installHook()
      autoHookInstalled = true
    },

    /**
     * Manually remove the WebSocket hook (advanced usage)
     * Warning: This will stop ALL event processing
     * @example
     * MWIWebSocket.removeHook();
     */
    removeHook() {
      manager.removeHook()
      autoHookInstalled = false
    },

    /**
     * Clear all cached data and history
     * Does NOT remove listeners
     * @example
     * // Clear all cached events and history
     * MWIWebSocket.clear();
     */
    clear() {
      manager.clear()
    },

    /**
     * Completely destroy the library instance
     * Removes hook, clears all listeners and data
     * @example
     * // Complete cleanup
     * MWIWebSocket.destroy();
     */
    destroy() {
      manager.removeHook()
      manager.emitter.offAll()
      manager.clear()
      autoHookInstalled = false
    },
  }

  // ============================================================================
  // Export to global scope
  // ============================================================================

  // Make available globally
  global.MWIWebSocket = MWIWebSocket

  // Also export for module systems if available
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MWIWebSocket
  }

  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return MWIWebSocket
    })
  }

  // Log initialization
  console.log(
    `[${LIBRARY_NAME}] v${VERSION} loaded successfully. Use MWIWebSocket.on() to subscribe to events.`
  )
})(typeof window !== 'undefined' ? window : this)
