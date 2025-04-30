import dotenv from 'dotenv';
import { Bot } from './bot';
import { AIService } from './ai';
import { logger } from './logger';

// Load environment variables
dotenv.config();

const TEST_MODE = process.env.TEST_MODE === 'true';

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

async function main() {
  logger.info(TEST_MODE ? 'Running in TEST MODE - Messages will only be logged to console' : 'Running in LIVE MODE - Messages will be sent to chat');

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
    logger.error('No bot credentials found in environment variables');
    throw new Error('No bot credentials found in environment variables');
  }

  logger.info(`Found ${botCredentials.length} bot(s) in environment variables`);

  // Create bots
  for (let i = 0; i < botCredentials.length; i++) {
    const { username, oauth } = botCredentials[i];
    const isFirstBot = i === 0;

    if (TEST_MODE) {
      // In test mode, just simulate bot messages
      const bot = new Bot({
        username,
        oauth,
        channel: process.env.TWITCH_CHANNEL!,
        aiService,
        testMode: true,
        shouldHandleVoiceCapture: isFirstBot
      });
      logger.info(`[TEST MODE] Created bot ${username}`);
    } else {
      // Live mode: Connect real bots
      const bot = new Bot({
        username,
        oauth,
        channel: process.env.TWITCH_CHANNEL!,
        aiService,
        testMode: false,
        shouldHandleVoiceCapture: isFirstBot
      });

      bots.push(bot);
      bot.connect();
      logger.info(`Created and connected bot ${username}`);
    }
  }

  // Handle process termination
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    if (!TEST_MODE) {
      bots.forEach(bot => bot.disconnect());
    }
    process.exit(0);
  });
}

main().catch(error => {
  logger.error('Application error:', error);
  process.exit(1);
}); 