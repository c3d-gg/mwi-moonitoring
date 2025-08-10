// ==UserScript==
// @name         MWI Moonitoring Library
// @namespace    https://github.com/mathewcst/mwi-moonitoring
// @version      0.1.0
// @description  High-performance WebSocket event library for Milky Way Idle addon development
// @author       c3d.gg
// @license      MIT
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @match        https://milkywayidle.com/*
// @grant        none
// ==/UserScript==

/**
 * MWI Moonitoring - WebSocket Event Library for Milky Way Idle
 *
 * A high-performance, non-blocking library for intercepting and processing
 * WebSocket events in Milky Way Idle. Designed to be used by multiple addons
 * simultaneously without conflicts.
 *
 * Usage:
 *   // In your userscript, add:
 *   // @require https://raw.githubusercontent.com/mathewcst/mwi-moonitoring/main/mwi-moonitoring.js
 *
 *   MWIWebSocket.on('init_character_data', (data) => {
 *     console.log('Character loaded:', data.character.name);
 *   });
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

  const VERSION = '1.0.0'
  const LIBRARY_NAME = 'MWI-Moonitoring'

  const DEFAULT_CONFIG = {
    // Performance
    enableBatching: true,
    batchInterval: 100, // ms between batch processing
    maxBatchSize: 50, // max events per batch
    preParsing: true, // pre-parse JSON for performance

    // Filtering
    eventWhitelist: [], // empty = all events
    eventBlacklist: [], // never process these

    // Discovery
    enableDiscovery: false,
    discoveryLimit: 100,

    // Debugging
    debug: false,
    logLevel: 'warn', // error, warn, info, debug

    // Memory
    historySize: 50,
    enableCache: true,
    cacheSize: 100,

    // Safety
    errorHandling: 'isolate', // isolate, propagate, suppress
    maxListenersPerEvent: 100, // prevent memory leaks
  }

  // Known WebSocket endpoints
  const WS_ENDPOINTS = [
    'api.milkywayidle.com/ws',
    'api-test.milkywayidle.com/ws',
  ]

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const utils = {
    /**
     * Deep clone an object (simple implementation for JSON-serializable data)
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
     */
    safeParse(json) {
      try {
        return JSON.parse(json)
      } catch (e) {
        return null
      }
    },

    /**
     * Get current timestamp
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
     * Subscribe to an event or events
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
     * Subscribe to an event once
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
     * Unsubscribe from an event
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
     * Remove all listeners for an event
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
     * Get listener count for an event
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

    /**
     * Configure the library
     */
    configure(options) {
      this.config = { ...this.config, ...options }
      this.logger = new Logger(this.config)
      this.emitter.config = this.config
      this.discovery.config = this.config
      this.queue.config = this.config

      this.logger.info('Configuration updated:', options)
    }

    /**
     * Get current configuration
     */
    getConfig() {
      return { ...this.config }
    }

    /**
     * Get event history
     */
    getEventHistory(limit) {
      if (limit) {
        return this.eventHistory.slice(-limit)
      }
      return [...this.eventHistory]
    }

    /**
     * Get cached event data
     */
    getCachedEvent(eventType) {
      return this.eventCache.get(eventType)
    }

    /**
     * Clear all data
     */
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

  const MWIWebSocket = {
    // Version
    version: VERSION,
    _initialized: true,

    // Event subscription
    on(eventTypes, callback) {
      ensureHook()
      return manager.emitter.on(eventTypes, callback)
    },

    once(eventType, callback) {
      ensureHook()
      return manager.emitter.once(eventType, callback)
    },

    off(eventTypes, callback) {
      return manager.emitter.off(eventTypes, callback)
    },

    offAll(eventType) {
      return manager.emitter.offAll(eventType)
    },

    // Event emission (for testing/debugging)
    emit(eventType, data) {
      return manager.emitter.emit(eventType, data)
    },

    // Discovery and debugging
    async discover(duration = 60000) {
      ensureHook()
      const oldConfig = manager.config.enableDiscovery
      manager.configure({ enableDiscovery: true })

      const results = await manager.discovery.start(duration)

      manager.configure({ enableDiscovery: oldConfig })
      return results
    },

    getEventHistory(limit) {
      return manager.getEventHistory(limit)
    },

    getEventTypes() {
      return manager.emitter.eventNames()
    },

    getEventCount(eventType) {
      if (eventType) {
        return manager.monitor.metrics.eventsPerType.get(eventType) || 0
      }
      return manager.monitor.metrics.totalEvents
    },

    getCachedEvent(eventType) {
      return manager.getCachedEvent(eventType)
    },

    // Performance monitoring
    getMetrics() {
      return manager.monitor.getMetrics()
    },

    resetMetrics() {
      manager.monitor.reset()
    },

    enableProfiling(enabled) {
      manager.configure({
        debug: enabled,
        logLevel: enabled ? 'debug' : 'warn',
      })
    },

    // Configuration
    configure(options) {
      manager.configure(options)
    },

    getConfig() {
      return manager.getConfig()
    },

    // Utility
    isReady() {
      return manager.isHooked
    },

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

    listenerCount(eventType) {
      return manager.emitter.listenerCount(eventType)
    },

    // Manual control (advanced usage)
    installHook() {
      manager.installHook()
      autoHookInstalled = true
    },

    removeHook() {
      manager.removeHook()
      autoHookInstalled = false
    },

    // Cleanup
    clear() {
      manager.clear()
    },

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
