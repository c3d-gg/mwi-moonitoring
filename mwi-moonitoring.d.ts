/**
 * MWI Moonitoring - TypeScript Definitions
 * High-performance WebSocket event library for Milky Way Idle addon development
 * @version 1.0.0
 * @author mathewcst
 * @license MIT
 */

declare module 'mwi-moonitoring' {
  export = MWIWebSocket;
}

declare namespace MWIWebSocket {
  /**
   * Library version
   */
  const version: string;

  /**
   * Configuration options for the library
   */
  interface ConfigOptions {
    /** Enable event batching for performance (default: true) */
    enableBatching?: boolean;
    /** Milliseconds between batch processing (default: 100) */
    batchInterval?: number;
    /** Maximum events per batch (default: 50) */
    maxBatchSize?: number;
    /** Pre-parse JSON for performance (default: true) */
    preParsing?: boolean;
    /** Only process these event types. Empty array = all events (default: []) */
    eventWhitelist?: string[];
    /** Never process these event types (default: []) */
    eventBlacklist?: string[];
    /** Enable event discovery mode (default: false) */
    enableDiscovery?: boolean;
    /** Maximum number of discovered events to track (default: 100) */
    discoveryLimit?: number;
    /** Enable debug logging (default: false) */
    debug?: boolean;
    /** Log level: 'error' | 'warn' | 'info' | 'debug' (default: 'warn') */
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    /** Number of events to keep in history (default: 50) */
    historySize?: number;
    /** Enable event caching (default: true) */
    enableCache?: boolean;
    /** Maximum number of cached events (default: 100) */
    cacheSize?: number;
    /** Error handling strategy (default: 'isolate') */
    errorHandling?: 'isolate' | 'propagate' | 'suppress';
    /** Maximum listeners per event to prevent memory leaks (default: 100) */
    maxListenersPerEvent?: number;
  }

  /**
   * Performance metrics
   */
  interface PerformanceMetrics {
    /** Total number of events processed */
    totalEvents: number;
    /** Map of event types to their counts */
    eventsPerType: Map<string, number>;
    /** Array of recent processing times in milliseconds */
    processingTimes: number[];
    /** Average processing time in milliseconds */
    avgProcessingTime: number;
    /** Peak processing time in milliseconds */
    peakProcessingTime: number;
    /** Number of dropped events */
    droppedEvents: number;
    /** Number of errors encountered */
    errors: number;
    /** Library start timestamp */
    startTime: number;
    /** Last metrics reset timestamp */
    lastReset: number;
    /** Library uptime in milliseconds */
    uptime: number;
    /** Events processed per second */
    eventsPerSecond: string;
    /** Top 10 most frequent events */
    topEvents: Array<[string, number]>;
  }

  /**
   * Event discovery result
   */
  interface DiscoveryResult {
    /** Event type name */
    type: string;
    /** Number of times this event was seen */
    count: number;
    /** First time this event was seen */
    firstSeen: number;
    /** Last time this event was seen */
    lastSeen: number;
    /** Sample data from this event type */
    samples: Array<{
      timestamp: number;
      data: any;
    }>;
  }

  /**
   * Historical event entry
   */
  interface EventHistoryEntry {
    /** Event type */
    type: string;
    /** Event data */
    data: any;
    /** Timestamp when event was received */
    timestamp: number;
  }

  /**
   * Event callback function
   */
  type EventCallback<T = any> = (eventType: string, data: T) => void;

  /**
   * Unsubscribe function returned by on() and once()
   */
  type UnsubscribeFunction = () => void;

  // ============================================================================
  // MWI Event Type Definitions
  // ============================================================================

  /**
   * Character information in events
   */
  interface Character {
    id: number;
    userID: number;
    gameMode: 'standard' | 'ironman' | 'hardcore' | string;
    name: string;
    previousName: string;
    specialChatIconHrid: string;
    chatIconHrid: string;
    nameColorHrid: string;
    avatarHrid: string;
    avatarOutfitHrid: string;
    isOnline: boolean;
    lastOfflineTime: string;
    inactiveTime: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  }

  /**
   * Skill information
   */
  interface Skill {
    skillHrid: string;
    level: number;
    experience?: number;
  }

  /**
   * Item in inventory
   */
  interface Item {
    itemHrid: string;
    itemLocationHrid?: string;
    count: number;
    enhancementLevel?: number;
  }

  /**
   * Character action
   */
  interface CharacterAction {
    id: number;
    characterID: number;
    actionHrid: string;
    currentCount: number;
    targetCount: number;
    startTime: string;
    endTime: string;
    isCanceled: boolean;
    isComplete: boolean;
  }

  /**
   * Init character data event
   */
  interface InitCharacterDataEvent {
    type: 'init_character_data';
    currentTimestamp: string;
    user: any;
    character: Character;
    characterInfo: any;
    characterSetting: any;
    characterActions: CharacterAction[];
    characterSkills: Skill[];
    characterItems: Item[];
    houseActionTypeBuffsMap?: any;
    actionTypeDrinkSlotsMap?: any;
    mooPassBuffs?: any[];
    communityBuffs?: any[];
    equipmentTaskActionBuffs?: any[];
  }

  /**
   * Items updated event
   */
  interface ItemsUpdatedEvent {
    type: 'items_updated';
    characterItems: Item[];
    itemsAdded?: Item[];
    itemsRemoved?: Item[];
  }

  /**
   * Action completed event
   */
  interface ActionCompletedEvent {
    type: 'action_completed';
    actionId: number;
    items?: Item[];
    characterItems?: Item[];
    skills?: Skill[];
    characterSkills?: Skill[];
    experience?: Array<{
      skillHrid: string;
      amount: number;
    }>;
  }

  /**
   * Consumable slots updated event
   */
  interface ConsumableSlotsUpdatedEvent {
    type: 'action_type_consumable_slots_updated';
    actionTypeDrinkSlotsMap: any;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Subscribe to one or more WebSocket events
   * @param eventTypes - Event type(s) to listen for. Supports wildcards (e.g., 'action_*')
   * @param callback - Function to call when event is received
   * @returns Unsubscribe function
   * @example
   * // Listen to a single event
   * MWIWebSocket.on('init_character_data', (eventType, data) => {
   *   console.log('Character loaded:', data.character.name);
   * });
   * 
   * // Listen to multiple events
   * MWIWebSocket.on(['items_updated', 'action_completed'], (eventType, data) => {
   *   console.log(`Event ${eventType} received`);
   * });
   * 
   * // Use wildcards
   * MWIWebSocket.on('action_*', (eventType, data) => {
   *   console.log('Action event:', eventType);
   * });
   */
  function on(eventTypes: string | string[], callback: EventCallback): UnsubscribeFunction;
  function on<T>(eventTypes: string | string[], callback: EventCallback<T>): UnsubscribeFunction;

  /**
   * Subscribe to an event only once
   * @param eventType - Event type to listen for
   * @param callback - Function to call when event is received
   * @returns Unsubscribe function
   * @example
   * MWIWebSocket.once('init_character_data', (eventType, data) => {
   *   console.log('First character initialization');
   * });
   */
  function once(eventType: string, callback: EventCallback): UnsubscribeFunction;
  function once<T>(eventType: string, callback: EventCallback<T>): UnsubscribeFunction;

  /**
   * Unsubscribe from one or more events
   * @param eventTypes - Event type(s) to unsubscribe from
   * @param callback - The callback function to remove
   * @example
   * const handler = (type, data) => console.log(data);
   * MWIWebSocket.on('items_updated', handler);
   * MWIWebSocket.off('items_updated', handler);
   */
  function off(eventTypes: string | string[], callback: EventCallback): void;

  /**
   * Remove all listeners for an event or all events
   * @param eventType - Optional event type. If not provided, removes all listeners
   * @example
   * // Remove all listeners for a specific event
   * MWIWebSocket.offAll('items_updated');
   * 
   * // Remove all listeners for all events
   * MWIWebSocket.offAll();
   */
  function offAll(eventType?: string): void;

  /**
   * Manually emit an event (for testing/debugging)
   * @param eventType - Event type to emit
   * @param data - Event data to send
   * @returns Number of listeners that received the event
   * @example
   * MWIWebSocket.emit('test_event', { test: true });
   */
  function emit(eventType: string, data: any): number;

  /**
   * Discover WebSocket events for a specified duration
   * @param duration - How long to run discovery in milliseconds (default: 60000)
   * @returns Promise resolving to array of discovered events
   * @example
   * const events = await MWIWebSocket.discover(30000); // Discover for 30 seconds
   * console.log('Found events:', events);
   */
  function discover(duration?: number): Promise<DiscoveryResult[]>;

  /**
   * Get event history
   * @param limit - Optional limit on number of events to return
   * @returns Array of historical events
   * @example
   * // Get last 10 events
   * const recentEvents = MWIWebSocket.getEventHistory(10);
   * 
   * // Get all history
   * const allEvents = MWIWebSocket.getEventHistory();
   */
  function getEventHistory(limit?: number): EventHistoryEntry[];

  /**
   * Get all registered event types
   * @returns Array of event type names that have listeners
   * @example
   * const eventTypes = MWIWebSocket.getEventTypes();
   * console.log('Listening for:', eventTypes);
   */
  function getEventTypes(): string[];

  /**
   * Get count of events processed
   * @param eventType - Optional event type to get count for
   * @returns Number of events processed
   * @example
   * // Get total events
   * const total = MWIWebSocket.getEventCount();
   * 
   * // Get events for specific type
   * const itemUpdates = MWIWebSocket.getEventCount('items_updated');
   */
  function getEventCount(eventType?: string): number;

  /**
   * Get cached event data for a specific event type
   * @param eventType - Event type to get cached data for
   * @returns Cached event data or undefined
   * @example
   * const lastItemUpdate = MWIWebSocket.getCachedEvent('items_updated');
   */
  function getCachedEvent(eventType: string): EventHistoryEntry | undefined;

  /**
   * Get performance metrics
   * @returns Performance metrics object
   * @example
   * const metrics = MWIWebSocket.getMetrics();
   * console.log(`Processed ${metrics.totalEvents} events`);
   * console.log(`Average time: ${metrics.avgProcessingTime}ms`);
   */
  function getMetrics(): PerformanceMetrics;

  /**
   * Reset performance metrics
   * @example
   * MWIWebSocket.resetMetrics();
   */
  function resetMetrics(): void;

  /**
   * Enable or disable profiling/debug mode
   * @param enabled - Whether to enable profiling
   * @example
   * MWIWebSocket.enableProfiling(true); // Enable debug logging
   */
  function enableProfiling(enabled: boolean): void;

  /**
   * Configure the library
   * @param options - Configuration options to apply
   * @example
   * MWIWebSocket.configure({
   *   debug: true,
   *   enableBatching: false,
   *   eventWhitelist: ['init_character_data', 'items_updated']
   * });
   */
  function configure(options: ConfigOptions): void;

  /**
   * Get current configuration
   * @returns Current configuration object
   * @example
   * const config = MWIWebSocket.getConfig();
   * console.log('Debug mode:', config.debug);
   */
  function getConfig(): ConfigOptions;

  /**
   * Check if the library is ready (hook installed)
   * @returns True if WebSocket hook is installed
   * @example
   * if (MWIWebSocket.isReady()) {
   *   console.log('Library is ready');
   * }
   */
  function isReady(): boolean;

  /**
   * Wait for the library to be ready
   * @returns Promise that resolves when ready
   * @example
   * await MWIWebSocket.waitForReady();
   * console.log('Library is now ready');
   */
  function waitForReady(): Promise<void>;

  /**
   * Get number of listeners for an event
   * @param eventType - Optional event type. If not provided, returns total listeners
   * @returns Number of listeners
   * @example
   * // Get listeners for specific event
   * const itemListeners = MWIWebSocket.listenerCount('items_updated');
   * 
   * // Get total listeners
   * const totalListeners = MWIWebSocket.listenerCount();
   */
  function listenerCount(eventType?: string): number;

  /**
   * Manually install the WebSocket hook (advanced usage)
   * @example
   * MWIWebSocket.installHook();
   */
  function installHook(): void;

  /**
   * Manually remove the WebSocket hook (advanced usage)
   * @example
   * MWIWebSocket.removeHook();
   */
  function removeHook(): void;

  /**
   * Clear all cached data and history
   * @example
   * MWIWebSocket.clear();
   */
  function clear(): void;

  /**
   * Completely destroy the library instance
   * Removes hook, clears all listeners and data
   * @example
   * MWIWebSocket.destroy();
   */
  function destroy(): void;
}

/**
 * Global MWIWebSocket object
 */
declare const MWIWebSocket: typeof MWIWebSocket;