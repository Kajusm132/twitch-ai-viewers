import { Bot } from './bot';
import { AIService } from './ai';
import { logger } from './logger';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'TWITCH_CHANNEL',
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'GROQ_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize AI service
const aiService = new AIService();

// Create and connect bots
const bots: Bot[] = [];

async function shutdown() {
  logger.info('Shutting down...');
  
  // Disconnect all bots
  for (const bot of bots) {
    try {
      bot.disconnect();
    } catch (error) {
      logger.error('Error disconnecting bot:', error);
    }
  }
  
  // Give some time for cleanup
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  process.exit(0);
}

async function main() {
  try {
    logger.info('Starting Twitch AI Viewers');

    // Find all bot credentials in environment variables
    const botCredentials: { username: string; oauth: string }[] = [];
    let botIndex = 1;

    while (true) {
      const username = process.env[`BOT${botIndex}_USERNAME`];
      const oauth = process.env[`BOT${botIndex}_OAUTH`];

      if (!username || !oauth) {
        break;
      }

      botCredentials.push({ username, oauth });
      botIndex++;
    }

    if (botCredentials.length === 0) {
      throw new Error('No bot credentials found in environment variables');
    }

    logger.info(`Found ${botCredentials.length} bot(s) in environment variables`);

    // Extract channel name from URL if it's a full URL
    const channelUrl = process.env.TWITCH_CHANNEL!;
    const channelName = channelUrl.includes('twitch.tv/') 
      ? channelUrl.split('twitch.tv/')[1].split('/')[0].split('?')[0]
      : channelUrl;

    logger.info(`Setting up voice capture for channel: ${channelUrl}`);

    // Create and connect bots
    for (const credentials of botCredentials) {
      try {
        const bot = new Bot({
          username: credentials.username,
          oauth: credentials.oauth,
          channel: channelName,
          aiService,
          shouldHandleVoiceCapture: true
        });

        bots.push(bot);
        bot.connect();
      } catch (error) {
        logger.error(`Error creating bot ${credentials.username}:`, error);
      }
    }

    // Handle process termination
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled rejection:', error);
      shutdown();
    });

  } catch (error) {
    logger.error('Error in main:', error);
    await shutdown();
  }
}

main(); 