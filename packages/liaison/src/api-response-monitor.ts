import { EventEmitter } from 'events';
import { setInterval, clearInterval } from 'timers';
import { createHash } from 'crypto';

export interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  expectedStatus?: number;
  timeout: number;
  interval: number;
  enabled: boolean;
  lastChecked?: Date;
  lastStatus?: number;
  lastResponse?: any;
  consecutiveFailures: number;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event: string;
  payload: any;
  headers: Record<string, string>;
  timestamp: Date;
  processed: boolean;
}

export interface APIResponseEvent {
  type: 'api-response' | 'webhook-event';
  endpointId?: string;
  endpointName?: string;
  status: number;
  response: any;
  timestamp: Date;
  consecutiveFailures?: number;
  webhookEvent?: WebhookEvent;
}

export interface APIResponseMonitorConfig {
  endpoints: APIEndpoint[];
  webhookPort?: number;
  webhookPath?: string;
  maxConsecutiveFailures?: number;
  retryAttempts?: number;
}

export class APIResponseMonitor extends EventEmitter {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private config: APIResponseMonitorConfig;
  private webhookServer?: any;
  private maxConsecutiveFailures: number;
  private _retryAttempts: number;


  constructor(config: APIResponseMonitorConfig) {
    super();
    this.config = config;
    this.maxConsecutiveFailures = config.maxConsecutiveFailures || 3;
    this._retryAttempts = 0;
    
    // Initialize endpoints
    config.endpoints.forEach(endpoint => {
      this.endpoints.set(endpoint.id, endpoint);
    });
  }

  /**
   * Start monitoring all enabled endpoints
   */
  async start(): Promise<void> {
    console.log('🔍 Starting API Response Monitor...');
    
    // Start monitoring each endpoint
    for (const [id, endpoint] of this.endpoints) {
      if (endpoint.enabled) {
        this.startEndpointMonitoring(id);
      }
    }

    // Start webhook server if configured
    if (this.config.webhookPort) {
      await this.startWebhookServer();
    }

    console.log(`✅ API Response Monitor started - monitoring ${this.getActiveEndpointCount()} endpoints`);
  }

  /**
   * Stop monitoring all endpoints
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping API Response Monitor...');
    
    // Clear all monitoring intervals
    for (const [, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // Stop webhook server
    if (this.webhookServer) {
      await this.stopWebhookServer();
    }

    console.log('✅ API Response Monitor stopped');
  }

  /**
   * Add a new endpoint to monitor
   */
  addEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint);
    
    if (endpoint.enabled) {
      this.startEndpointMonitoring(endpoint.id);
    }
  }

  /**
   * Remove an endpoint from monitoring
   */
  removeEndpoint(endpointId: string): void {
    this.stopEndpointMonitoring(endpointId);
    this.endpoints.delete(endpointId);
  }

  /**
   * Update an existing endpoint
   */
  updateEndpoint(endpointId: string, updates: Partial<APIEndpoint>): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    const updatedEndpoint = { ...endpoint, ...updates };
    this.endpoints.set(endpointId, updatedEndpoint);

    // Restart monitoring if enabled status changed
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.startEndpointMonitoring(endpointId);
      } else {
        this.stopEndpointMonitoring(endpointId);
      }
    }
  }

  /**
   * Get all endpoints
   */
  getEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Get endpoint by ID
   */
  getEndpoint(endpointId: string): APIEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  /**
   * Get monitoring statistics
   */
  getStats(): {
    totalEndpoints: number;
    activeEndpoints: number;
    failedEndpoints: number;
    uptime: number;
  } {
    const totalEndpoints = this.endpoints.size;
    const activeEndpoints = this.getActiveEndpointCount();
    const failedEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.consecutiveFailures >= this.maxConsecutiveFailures).length;

    return {
      totalEndpoints,
      activeEndpoints,
      failedEndpoints,
      uptime: process.uptime()
    };
  }

  /**
   * Manually trigger endpoint check
   */
  async checkEndpoint(endpointId: string): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    await this.performEndpointCheck(endpoint);
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      // Emit webhook event for workflow processing
      const apiEvent: APIResponseEvent = {
        type: 'webhook-event',
        status: 200, // Webhook received successfully
        response: event.payload,
        timestamp: event.timestamp,
        webhookEvent: event
      };

      this.emit('api-event', apiEvent);
      
      // Mark as processed
      event.processed = true;
      
      console.log(`🪝 Processed webhook event: ${event.source}:${event.event}`);
    } catch (error) {
      console.error(`❌ Error processing webhook event:`, error);
      throw error;
    }
  }

  /**
   * Start monitoring a specific endpoint
   */
  private startEndpointMonitoring(endpointId: string): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint || !endpoint.enabled) {
      return;
    }

    // Clear existing interval if any
    this.stopEndpointMonitoring(endpointId);

    // Set up monitoring interval
    const interval = setInterval(async () => {
      await this.performEndpointCheck(endpoint);
    }, endpoint.interval * 1000);

    this.intervals.set(endpointId, interval);
    
    // Perform initial check
    this.performEndpointCheck(endpoint);
  }

  /**
   * Stop monitoring a specific endpoint
   */
  private stopEndpointMonitoring(endpointId: string): void {
    const interval = this.intervals.get(endpointId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(endpointId);
    }
  }

  /**
   * Perform endpoint health check
   */
  private async performEndpointCheck(endpoint: APIEndpoint): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Make HTTP request
      const response = await this.makeHTTPRequest(endpoint);
      const responseTime = Date.now() - startTime;

      // Update endpoint status
      endpoint.lastChecked = new Date();
      endpoint.lastStatus = response.status;
      endpoint.lastResponse = response.data;
      
      // Reset failure count on success
      if (this.isSuccessStatus(response.status, endpoint.expectedStatus)) {
        endpoint.consecutiveFailures = 0;
      } else {
        endpoint.consecutiveFailures++;
      }

      // Create API event
      const apiEvent: APIResponseEvent = {
        type: 'api-response',
        endpointId: endpoint.id,
        endpointName: endpoint.name,
        status: response.status,
        response: {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          data: response.data
        },
        timestamp: new Date(),
        consecutiveFailures: endpoint.consecutiveFailures
      };

      // Emit event for workflow processing
      this.emit('api-event', apiEvent);

      console.log(`🔍 ${endpoint.name}: ${response.status} (${responseTime}ms)${endpoint.consecutiveFailures > 0 ? ` [${endpoint.consecutiveFailures} failures]` : ''}`);

    } catch (error) {
      // Update failure count
      endpoint.consecutiveFailures++;
      endpoint.lastChecked = new Date();
      endpoint.lastStatus = 0; // Indicates failure

      // Create failure event
      const apiEvent: APIResponseEvent = {
        type: 'api-response',
        endpointId: endpoint.id,
        endpointName: endpoint.name,
        status: 0,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        },
        timestamp: new Date(),
        consecutiveFailures: endpoint.consecutiveFailures
      };

      this.emit('api-event', apiEvent);

      console.error(`❌ ${endpoint.name}: Failed [${endpoint.consecutiveFailures} consecutive failures] - ${error}`);
    }
  }

  /**
   * Make HTTP request to endpoint
   */
  private async makeHTTPRequest(endpoint: APIEndpoint): Promise<{
    status: number;
    statusText: string;
    data: any;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Liaison-API-Monitor/1.0',
          ...endpoint.headers
        },
        signal: controller.signal
      };

      const response = await fetch(endpoint.url, options);
      
      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Check if response status indicates success
   */
  private isSuccessStatus(status: number, expectedStatus?: number): boolean {
    if (expectedStatus) {
      return status === expectedStatus;
    }
    return status >= 200 && status < 300;
  }

  /**
   * Get count of active endpoints
   */
  private getActiveEndpointCount(): number {
    return Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.enabled).length;
  }

  /**
   * Start webhook server for receiving events
   */
  private async startWebhookServer(): Promise<void> {
    try {
      // Simple webhook server implementation
      const http = await import('http');
      
      this.webhookServer = http.createServer(async (req, res) => {
        if (req.method === 'POST' && req.url?.startsWith(this.config.webhookPath || '/webhook')) {
          try {
            const body = await this.parseRequestBody(req);
            const source = req.headers['x-source'] as string || 'unknown';
            const event = req.headers['x-event'] as string || 'generic';
            
            const webhookEvent: WebhookEvent = {
              id: createHash('md5').update(JSON.stringify(body) + Date.now()).digest('hex'),
              source,
              event,
              payload: body,
              headers: req.headers as Record<string, string>,
              timestamp: new Date(),
              processed: false
            };

            await this.processWebhookEvent(webhookEvent);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, eventId: webhookEvent.id }));
            
          } catch (error) {
            console.error('❌ Webhook processing error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Webhook processing failed' }));
          }
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      this.webhookServer.listen(this.config.webhookPort, () => {
        console.log(`🪝 Webhook server listening on port ${this.config.webhookPort}`);
      });

    } catch (error) {
      console.error('❌ Failed to start webhook server:', error);
      throw error;
    }
  }

  /**
   * Stop webhook server
   */
  private async stopWebhookServer(): Promise<void> {
    if (this.webhookServer) {
      return new Promise((resolve) => {
        this.webhookServer.close(() => {
          console.log('🪝 Webhook server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Parse request body
   */
  private async parseRequestBody(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
      req.on('error', reject);
    });
  }
}