import tmi from 'tmi.js';
import { AIService } from './ai';
import { logger } from './logger';

interface BotConfig {
  username: string;
  oauth: string;
  channel: string;
  aiService: AIService;
  shouldHandleVoiceCapture?: boolean;
}

export class Bot {
  private client: tmi.Client | null = null;
  private aiService: AIService;
  private lastMessageTime: number = 0;
  private messageCount: number = 0;
  private shouldHandleVoiceCapture: boolean;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000;

  constructor(config: BotConfig) {
    this.aiService = config.aiService;
    this.shouldHandleVoiceCapture = config.shouldHandleVoiceCapture || false;

    // Validate OAuth token format
    if (!config.oauth.startsWith('oauth:')) {
      throw new Error(`Invalid OAuth token format for bot ${config.username}. Token must start with 'oauth:'`);
    }

    this.client = new tmi.Client({
      options: {
        debug: false, // Disable debug in production
        messagesLogLevel: "info"
      },
      identity: {
        username: config.username,
        password: config.oauth
      },
      channels: [config.channel],
      connection: {
        reconnect: true,
        maxReconnectAttempts: this.MAX_RECONNECT_ATTEMPTS,
        maxReconnectInterval: 30000,
        secure: true
      }
    });

    this.setupEventHandlers();

    // Setup voice capture only if this bot should handle it
    if (this.shouldHandleVoiceCapture) {
      this.setupVoiceCapture(config.channel).catch(error => {
        logger.error(`Error setting up voice capture for bot ${config.username}:`, error);
      });
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('message', async (channel: string, tags: tmi.ChatUserstate, message: string, self: boolean) => {
      if (self) return;

      try {
        // Create a rich context for message generation
        const context = {
          streamInfo: this.aiService.currentChannelInfo,
          chatMessage: message,
          username: tags['display-name'] || tags.username,
          timeSinceLastMessage: Date.now() - this.lastMessageTime,
          messageCount: this.messageCount,
          isChatMessage: true,
          fullContext: {
            currentGame: this.aiService.currentChannelInfo?.gameName,
            streamTitle: this.aiService.currentChannelInfo?.title,
            viewerCount: this.aiService.currentChannelInfo?.viewerCount
          }
        };

        // Occasionally respond to other messages
        if (Math.random() < 0.2) {
          this.aiService.emit('chatMessage', JSON.stringify(context));
        }
      } catch (error) {
        logger.error(`Error handling message for bot ${this.client?.getUsername()}:`, error);
      }
    });

    this.client.on('connected', (address: string, port: number) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info(`Bot ${this.client?.getUsername()} connected to chat at ${address}:${port}`);
    });

    this.client.on('disconnected', (reason: string) => {
      this.isConnected = false;
      logger.warn(`Bot ${this.client?.getUsername()} disconnected: ${reason}`);
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      logger.info(`Bot ${this.client?.getUsername()} attempting to reconnect (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
    });

    this.client.on('logon', () => {
      logger.info(`Bot ${this.client?.getUsername()} successfully logged in`);
    });

    // Listen for messages from AI service
    this.aiService.on('message', (message: string) => {
      if (message && message.trim() !== '') {
        const now = Date.now();
        // Only send message if enough time has passed since last message
        if (now - this.lastMessageTime >= 5000) { // 5 seconds minimum between messages
          logger.info('Sending message:', message);
          this.sendMessage(message).catch(error => {
            logger.error(`Error sending message from ${this.client?.getUsername()}:`, error);
          });
          this.messageCount++;
          this.lastMessageTime = now;
        } else {
          logger.info('Skipping message - too soon since last message');
        }
      }
    });
  }

  private async setupVoiceCapture(channel: string): Promise<void> {
    logger.info(`Setting up voice capture for channel: ${channel}`);

    try {
      // Start voice capture first, which will fetch channel info
      await this.aiService.startVoiceCapture(channel);

      // Wait for channel info to be available
      let attempts = 0;
      const maxAttempts = 5;
      while (!this.aiService.currentChannelInfo && attempts < maxAttempts) {
        logger.info('Waiting for channel info...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }

      if (!this.aiService.currentChannelInfo) {
        throw new Error('Failed to get channel info after multiple attempts');
      }

      logger.info('Channel info available:', {
        title: this.aiService.currentChannelInfo.title,
        game: this.aiService.currentChannelInfo.gameName,
        viewers: this.aiService.currentChannelInfo.viewerCount
      });
    } catch (error) {
      logger.error('Error setting up voice capture:', error);
      throw error;
    }
  }

  private async sendMessage(message: string): Promise<void> {
    if (!this.client || !message) return;

    try {
      // Extract channel name from URL if it's a full URL
      const channelUrl = process.env.TWITCH_CHANNEL!;
      const channelName = channelUrl.includes('twitch.tv/')
        ? channelUrl.split('twitch.tv/')[1].split('/')[0].split('?')[0]
        : channelUrl;

      await this.client.say(`#${channelName}`, message);
    } catch (error) {
      logger.error(`Error sending message from ${this.client?.getUsername()}:`, error);
      throw error;
    }
  }

  private cleanupVoiceCapture(): void {
    try {
      this.aiService.stopVoiceCapture();
    } catch (error) {
      logger.error(`Error cleaning up voice capture for bot ${this.client?.getUsername()}:`, error);
    }
  }

  public connect(): void {
    if (!this.client) return;

    logger.info(`Connecting bot ${this.client.getUsername()}...`);
    this.client.connect().catch((error: Error) => {
      logger.error(`Failed to connect bot ${this.client?.getUsername()}:`, error);
    });
  }

  public disconnect(): void {
    if (!this.client) return;

    logger.info(`Disconnecting bot ${this.client.getUsername()}...`);
    try {
      this.client.disconnect();
      this.cleanupVoiceCapture();
    } catch (error) {
      logger.error(`Error disconnecting bot ${this.client.getUsername()}:`, error);
    }
  }

  public isBotConnected(): boolean {
    return this.isConnected;
  }
} 