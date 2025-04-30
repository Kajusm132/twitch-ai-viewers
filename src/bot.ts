import tmi from 'tmi.js';
import { AIService } from './ai';
import { logger } from './logger';

interface BotConfig {
  username: string;
  oauth: string;
  channel: string;
  aiService: AIService;
  testMode?: boolean;
  shouldHandleVoiceCapture?: boolean;
}

export class Bot {
  private client: tmi.Client | null = null;
  private aiService: AIService;
  private lastMessageTime: number = 0;
  private lastTranscribedText: string = '';
  private testMode: boolean;
  private messageCount: number = 0;
  private shouldHandleVoiceCapture: boolean;

  constructor(config: BotConfig) {
    this.aiService = config.aiService;
    this.testMode = config.testMode || false;
    this.shouldHandleVoiceCapture = config.shouldHandleVoiceCapture || false;

    if (!this.testMode) {
      // Validate OAuth token format
      if (!config.oauth.startsWith('oauth:')) {
        throw new Error(`Invalid OAuth token format for bot ${config.username}. Token must start with 'oauth:'`);
      }

      this.client = new tmi.Client({
        options: {
          debug: true,
          messagesLogLevel: "info"
        },
        identity: {
          username: config.username,
          password: config.oauth
        },
        channels: [config.channel]
      });

      this.setupEventHandlers();
    }

    // Setup voice capture only if this bot should handle it
    if (this.shouldHandleVoiceCapture) {
      this.setupVoiceCapture(config.channel);
    }
  }


  private setupEventHandlers(): void {
    if (this.testMode || !this.client) return;

    this.client.on('message', async (channel: string, tags: tmi.ChatUserstate, message: string, self: boolean) => {
      if (self) return;

      if (this.testMode) {
        logger.info(`[TEST MODE] ${this.client?.getUsername()} would respond to: "${message}"`);
        return;
      }

      // Only respond to chat messages if we have a transcription context
      if (this.lastTranscribedText) {
        // Create a rich context for message generation
        const context = {
          streamInfo: this.aiService.currentChannelInfo,
          lastTranscription: this.lastTranscribedText,
          chatMessage: message,
          username: tags['display-name'] || tags.username,
          timeSinceLastMessage: Date.now() - this.lastMessageTime,
          messageCount: this.messageCount,
          isChatMessage: true,
          fullContext: {
            currentGame: this.aiService.currentChannelInfo?.gameName,
            streamTitle: this.aiService.currentChannelInfo?.title,
            viewerCount: this.aiService.currentChannelInfo?.viewerCount,
            previousTranscriptions: this.lastTranscribedText
          }
        };

        // Occasionally respond to other messages
        if (Math.random() < 0.2) {
          const response = await this.aiService.generateMessage(JSON.stringify(context));
          this.sendMessage(response);
          this.messageCount++;
          this.lastMessageTime = Date.now();
        }
      }
    });

    this.client.on('connected', (address: string, port: number) => {
      logger.info(`Bot ${this.client?.getUsername()} connected to chat at ${address}:${port}`);
    });

    this.client.on('disconnected', (reason: string) => {
      logger.warn(`Bot ${this.client?.getUsername()} disconnected: ${reason}`);
    });

    this.client.on('logon', () => {
      logger.info(`Bot ${this.client?.getUsername()} successfully logged in`);
    });

    this.client.on('notice', (channel: string, msgid: string) => {
      if (msgid === 'login_unavailable') {
        logger.error(`Authentication failed for bot ${this.client?.getUsername()}. Please check the OAuth token.`);
        logger.error('Get a new OAuth token from: https://twitchapps.com/tmi/');
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
        logger.error('Failed to get channel info after multiple attempts');
        return;
      }

      logger.info('Channel info available:', {
        title: this.aiService.currentChannelInfo.title,
        game: this.aiService.currentChannelInfo.gameName,
        viewers: this.aiService.currentChannelInfo.viewerCount
      });

      // Set up a timer to periodically check for new transcriptions
      const checkInterval = setInterval(() => {
        if (!this.aiService.isVoiceCaptureActive) {
          clearInterval(checkInterval);
        }
      }, 5000);

      this.aiService.on('transcription', async (transcribedText: string) => {
        try {
          // Only respond if the transcribed text is different from the last one and not empty
          if (transcribedText && transcribedText.trim() !== '' && transcribedText !== this.lastTranscribedText) {
            this.lastTranscribedText = transcribedText;
            logger.info(`Transcribed: ${transcribedText}`);

            // Create a rich context for message generation
            const context = {
              streamInfo: this.aiService.currentChannelInfo,
              lastTranscription: transcribedText,
              timeSinceLastMessage: Date.now() - this.lastMessageTime,
              messageCount: this.messageCount,
              isStreamerMessage: true,
              fullContext: {
                currentGame: this.aiService.currentChannelInfo?.gameName,
                streamTitle: this.aiService.currentChannelInfo?.title,
                viewerCount: this.aiService.currentChannelInfo?.viewerCount,
                previousTranscriptions: this.lastTranscribedText
              }
            };

            // Generate a response after transcription
            const response = await this.aiService.generateMessage(JSON.stringify(context));
            if (response && response.trim() !== '') {
              this.sendMessage(response);
              this.messageCount++;
              this.lastMessageTime = Date.now();
            }
          }
        } catch (error) {
          logger.error('Error processing voice data:', error);
        }
      });
    } catch (error) {
      logger.error('Error setting up voice capture:', error);
    }
  }

  private async sendMessage(message: string): Promise<void> {
    try {
      if (this.testMode) {
        if (message != '') {
          logger.info(`[TEST MODE] Bot would send: "${message}"`);
        }
        return;
      }
      if (!this.client || !message) return;
      await this.client.say(process.env.TWITCH_CHANNEL!, message);
    } catch (error) {
      logger.error(`Error sending message from ${this.client?.getUsername()}:`, error);
    }
  }

  public connect(): void {
    if (this.testMode) {
      logger.info(`[TEST MODE] Bot ${process.env.BOT1_USERNAME} would connect`);
      return;
    }
    if (!this.client) return;

    logger.info(`Connecting bot ${this.client.getUsername()}...`);
    this.client.connect().catch((error: Error) => {
      logger.error(`Failed to connect bot ${this.client?.getUsername()}:`, error);
    });
  }

  public disconnect(): void {
    if (this.testMode) {
      logger.info(`[TEST MODE] Bot ${process.env.BOT1_USERNAME} would disconnect`);
      return;
    }
    if (!this.client) return;

    logger.info(`Disconnecting bot ${this.client.getUsername()}...`);
    this.client.disconnect();
    this.aiService.stopVoiceCapture();
  }
} 