import axios from 'axios';
import { EventEmitter } from 'events';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { FfmpegCommand } from 'fluent-ffmpeg';
import { Groq } from 'groq-sdk';
import { logger } from './logger';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

interface TwitchChannelInfo {
  title: string;
  description: string;
  gameName: string;
  viewerCount: number;
  isLive: boolean;
}

export class AIService extends EventEmitter {
  private groq: Groq | null = null;
  private isCapturing: boolean = false;
  private currentProcess: FfmpegCommand | null = null;
  private tempAudioFile: string | null = null;
  private accessToken: string | null = null;
  private _currentChannelInfo: TwitchChannelInfo | null = null;
  private lastMessageTime: number = 0;
  private messageInterval: number;

  constructor() {
    super();
    logger.info('AIService initialized');
    this.messageInterval = parseInt(process.env.MESSAGE_INTERVAL || '5000');

    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
      logger.info('Groq client initialized');
    }
  }

  public get currentChannelInfo(): TwitchChannelInfo | null {
    return this._currentChannelInfo;
  }

  private set currentChannelInfo(info: TwitchChannelInfo | null) {
    this._currentChannelInfo = info;
  }

  private async generateAccessToken(): Promise<string> {
    try {
      logger.info('Generating new access token...');
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          grant_type: 'client_credentials',
          scope: 'user:read:email channel:read:stream_key channel:manage:broadcast'
        }
      });

      const { access_token } = response.data;
      logger.info('New access token generated successfully');
      return access_token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw error;
    }
  }

  private async getChannelInfo(channelName: string): Promise<TwitchChannelInfo> {
    try {
      logger.info('Fetching channel info for:', channelName);

      if (!this.accessToken) {
        this.accessToken = await this.generateAccessToken();
      }

      // First, get the user ID from the channel name
      const userResponse = await axios.get(`https://api.twitch.tv/helix/users?login=${channelName}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (userResponse.data.data.length === 0) {
        throw new Error(`Channel "${channelName}" not found`);
      }

      const userId = userResponse.data.data[0].id;
      logger.info('Found user ID:', userId);

      // Now get the channel info using the user ID
      const channelResponse = await axios.get(`https://api.twitch.tv/helix/channels?broadcaster_id=${userId}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      const channelData = channelResponse.data.data[0];

      // Get stream info to check if live and get current game
      const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      const streamData = streamResponse.data.data[0];

      const channelInfo: TwitchChannelInfo = {
        title: streamData?.title || channelData.title,
        description: channelData.description,
        gameName: streamData?.game_name || 'Not specified',
        viewerCount: streamData?.viewer_count || 0,
        isLive: !!streamData
      };

      logger.info('Channel info retrieved:', {
        title: channelInfo.title,
        game: channelInfo.gameName,
        viewers: channelInfo.viewerCount,
        isLive: channelInfo.isLive
      });

      return channelInfo;
    } catch (error) {
      logger.error('Error fetching channel info:', error);
      if (axios.isAxiosError(error)) {
        logger.error('API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  public get isVoiceCaptureActive(): boolean {
    return this.isCapturing;
  }

  public async startVoiceCapture(channel: string): Promise<void> {
    if (this.isCapturing) {
      return;
    }

    try {
      // Extract channel name from URL if it's a full URL
      const channelName = channel.startsWith('https://www.twitch.tv/')
        ? channel.split('/').pop()
        : channel;

      if (!channelName) {
        throw new Error('Invalid channel name');
      }

      logger.info('Starting voice capture for channel:', channelName);

      // Get channel info before starting capture
      this.currentChannelInfo = await this.getChannelInfo(channelName);

      if (!this.currentChannelInfo.isLive) {
        throw new Error(`Channel "${channelName}" is not currently live`);
      }

      this.isCapturing = true;
      // Start the capture loop in the background
      this.captureLoop(channel).catch(error => {
        logger.error('Error in capture loop:', error);
        this.stopVoiceCapture();
      });
    } catch (error) {
      logger.error('Error starting voice capture:', error);
      throw error;
    }
  }

  private async captureLoop(channel: string): Promise<void> {
    while (this.isCapturing) {
      try {
        const streamUrl = await this.getStreamUrl(channel);
        this.tempAudioFile = join(tmpdir(), `twitch-audio-${Date.now()}.wav`);

        await new Promise<void>((resolve, reject) => {
          this.currentProcess = ffmpeg(streamUrl)
            .inputOptions([
              '-user_agent', 'Mozilla/5.0',
              '-loglevel', 'error',
              '-f', 'hls',
            ])
            .outputOptions([
              '-f', 'wav',
              '-acodec', 'pcm_s16le',
              '-ac', '1',
              '-ar', '16000',
              '-vn'
            ])
            .duration(parseInt(process.env.TRANSCRIPT_DURATION || '60000') / 1000)
            .on('error', (err: Error) => {
              this.stopVoiceCapture();
              reject(err);
            })
            .on('end', () => {
              this.processAudioChunk().then(resolve).catch(reject);
            })
            .save(this.tempAudioFile!);
        });
      } catch (error) {
        logger.error('Error in capture loop:', error);
        this.stopVoiceCapture();
      }
    }
  }

  public stopVoiceCapture(): void {
    if (!this.isCapturing) {
      return;
    }

    if (this.currentProcess) {
      this.currentProcess.kill('SIGKILL');
      this.currentProcess = null;
    }

    if (this.tempAudioFile) {
      try {
        unlinkSync(this.tempAudioFile);
      } catch (error) { }
      this.tempAudioFile = null;
    }

    this.isCapturing = false;
    logger.info('Voice capture stopped');
  }

  private async processAudioChunk(): Promise<void> {
    if (!this.tempAudioFile) {
      return;
    }

    try {
      // Check if file exists before trying to read it
      if (!existsSync(this.tempAudioFile)) {
        logger.warn('Temporary audio file not found:', this.tempAudioFile);
        return;
      }

      const audioData = await this.readAudioFile(this.tempAudioFile);

      // Ensure we have valid audio data
      if (!Buffer.isBuffer(audioData) || audioData.length === 0) {
        logger.warn('Invalid or empty audio data received');
        return;
      }

      const transcribedText = await this.processAudioToText(audioData);
      if (transcribedText) {
        logger.info('Transcription received:', transcribedText);
        this.emit('transcription', transcribedText);

        // Only generate and send message if enough time has passed since last message
        const now = Date.now();
        if (now - this.lastMessageTime >= this.messageInterval) {
          const message = await this.generateMessage(JSON.stringify({
            lastTranscription: transcribedText,
            isStreamerMessage: true
          }));

          if (message) {
            this.lastMessageTime = now;
            this.emit('message', message);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing audio chunk:', error);
    } finally {
      // Always clean up the temporary file
      try {
        if (this.tempAudioFile && existsSync(this.tempAudioFile)) {
          unlinkSync(this.tempAudioFile);
        }
      } catch (error) {
        logger.error('Error cleaning up temporary file:', error);
      }
      this.tempAudioFile = null;
    }
  }

  private readAudioFile(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      fs.readFile(filePath, (err: Error | null, data: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  public async processAudioToText(audioData: Buffer): Promise<string> {
    try {
      const language = process.env.ORIGINAL_STREAM_LANGUAGE || 'en';
      const tempFile = join(tmpdir(), `whisper-${Date.now()}.wav`);
      const fs = require('fs');
      fs.writeFileSync(tempFile, audioData);

      if (!this.groq) {
        throw new Error('Groq client not initialized. Please set GROQ_API_KEY in environment variables.');
      }

      const response = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: "whisper-large-v3-turbo",
        language: language,
        response_format: "text"
      });

      // Clean up the temporary file
      fs.unlinkSync(tempFile);

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid transcription response from Groq');
      }

      return response;
    } catch (error) {
      logger.error('Error processing audio to text with Groq:', error);
      throw error;
    }
  }

  public async generateMessage(context?: string): Promise<string> {
    try {
      // If no channel info is available yet, don't generate a message
      if (!this.currentChannelInfo) {
        logger.warn('No channel info available for message generation');
        return '';
      }

      let parsedContext: any = {};
      try {
        if (context) {
          parsedContext = JSON.parse(context);
        }
      } catch (error) {
        logger.error('Error parsing context:', error);
        parsedContext = { rawText: context };
      }

      // Don't generate messages without transcription context
      if (!parsedContext.lastTranscription && !parsedContext.chatMessage) {
        logger.info('Transcription is being generated and will be available soon');
        return '';
      }

      // Don't generate messages if the transcription is too short
      if (parsedContext.lastTranscription && parsedContext.lastTranscription.length < 10) {
        logger.warn('Transcription too short for message generation');
        return '';
      }

      const channelContext = `
        Channel Title: ${this.currentChannelInfo.title}
        Game: ${this.currentChannelInfo.gameName}
        Viewers: ${this.currentChannelInfo.viewerCount}
        Description: ${this.currentChannelInfo.description}
        Language: ${process.env.ORIGINAL_STREAM_LANGUAGE || 'en'}
      `;

      const lastTranscription = parsedContext.lastTranscription ? `
        The streamer just said: "${parsedContext.lastTranscription}"
      ` : '';

      const chatContext = parsedContext.chatMessage ? `
        A viewer just said: "${parsedContext.chatMessage}"
      ` : '';

      const timeContext = parsedContext.timeSinceLastMessage ? `
        Time since last message: ${Math.floor(parsedContext.timeSinceLastMessage / 1000)} seconds
      ` : '';

      const messageCountContext = parsedContext.messageCount ? `
        Total messages sent: ${parsedContext.messageCount}
      ` : '';

      const prompt = `
        You are a Twitch viewer watching this stream. Generate a natural, engaging message that a real viewer would type in chat.
        
        Stream Context:
        ${channelContext}
        
        ${lastTranscription}
        ${chatContext}
        ${timeContext}
        ${messageCountContext}
        
        Guidelines:
        - Write as if you're a real viewer enjoying the stream
        - Keep messages short and casual (max 50 characters)
        - Use emojis occasionally but naturally
        - If there's a game being played, you can comment on it
        - If there's a transcription available, you can respond to what the streamer said
        - If there's a chat message, you can respond to it naturally
        - Write in the stream's language (${process.env.ORIGINAL_STREAM_LANGUAGE || 'en'})
        - Don't mention that you're a bot or AI
        - Don't use excessive emojis or caps
        - Don't spam or use repetitive messages
        - Don't use commands or special characters
        - Keep it natural and conversational
        - Consider the time since the last message and message count to vary your responses
        - IMPORTANT: Do NOT repeat what the streamer said. Instead, respond naturally to it.
        - IMPORTANT: Generate JUST the chat message, not any other text or comments.
      `;

      logger.info('Generating message with context:', {
        channel: this.currentChannelInfo.title,
        game: this.currentChannelInfo.gameName,
        transcription: parsedContext.lastTranscription,
        isStreamerMessage: parsedContext.isStreamerMessage
      });

      if (!this.groq) {
        throw new Error('Groq client not initialized. Please set GROQ_API_KEY in environment variables.');
      }

      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a Twitch viewer watching a stream. Generate natural, engaging messages that a real viewer would type in chat. Never repeat what the streamer said - instead, respond naturally to it."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      });

      const message = response.choices[0].message?.content?.trim() || '';
      if (message) {
        logger.info('Generated message:', message);
      } else {
        logger.warn('Empty message generated by Groq');
      }
      return message;
    } catch (error) {
      logger.error('Error generating message:', error);
      return '';
    }
  }

  private async getStreamUrl(channel: string): Promise<string> {
    try {
      // Extract channel name from URL if it's a full URL
      const channelName = channel.startsWith('https://www.twitch.tv/')
        ? channel.split('/').pop()
        : channel;

      if (!channelName) {
        throw new Error('Invalid channel name');
      }

      // Generate new access token if not available
      if (!this.accessToken) {
        this.accessToken = await this.generateAccessToken();
      }

      // First, check if the channel exists
      const userResponse = await axios.get(`https://api.twitch.tv/helix/users?login=${channelName}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (userResponse.data.data.length === 0) {
        throw new Error(`Channel "${channelName}" does not exist`);
      }

      const userId = userResponse.data.data[0].id;

      // Then check if the stream is live and get stream info
      const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (streamResponse.data.data.length === 0) {
        throw new Error(`Channel "${channelName}" is not currently live`);
      }

      // Get the stream access token and signature using the new endpoint
      const tokenResponse = await axios.post(`https://gql.twitch.tv/gql`, {
        operationName: "PlaybackAccessToken",
        variables: {
          isLive: true,
          login: channelName,
          isVod: false,
          vodID: "",
          playerType: "site"
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: "0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712"
          }
        }
      }, {
        headers: {
          'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!tokenResponse.data.data?.streamPlaybackAccessToken) {
        throw new Error('Failed to get stream access token');
      }

      const { value: token, signature } = tokenResponse.data.data.streamPlaybackAccessToken;

      if (!token || !signature) {
        throw new Error('Invalid token or signature received');
      }

      // Get the stream URL from the stream info
      return `https://usher.ttvnw.net/api/channel/hls/${channelName}.m3u8?client_id=kimne78kx3ncx6brgo4mv6wki5h1ko&token=${encodeURIComponent(token)}&sig=${signature}`;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Try to generate a new token and retry
          this.accessToken = await this.generateAccessToken();
          return this.getStreamUrl(channel);
        } else if (error.response?.status === 404) {
          logger.error('Channel not found. Please check the channel name.');
        } else {
          logger.error('Error getting stream URL:', error.message);
        }
      } else {
        logger.error('Error getting stream URL:', error);
      }
      throw error;
    }
  }
} 