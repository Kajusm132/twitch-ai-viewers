<div align="center">

# 🎮 Twitch AI Viewers 🤖

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join%20our%20community-7289DA)](https://discord.gg/p6X5R3p9)

> 🎥 **Never Stream Alone Again!** Twitch AI Viewers is your perfect companion for those early streaming days. Whether you're just starting out or looking to make your stream more engaging, this bot provides intelligent, context-aware viewers that interact naturally with your content.

</div>

## ✨ Features & Benefits

<div align="center">

| 🎤 Audio Processing | 🤖 AI Integration | 💬 Chat Interaction | ⚙️ Configuration |
|-------------------|------------------|-------------------|-----------------|
| Real-time capture | Smart transcription | Natural responses | Flexible settings |
| Auto format conversion | Context-aware messages | Emoji support | Easy setup |
| Noise reduction | Multi-language support | Anti-spam system | Error handling |

</div>

<div align="center">

| 🎯 Perfect For | 🌟 Key Benefits |
|----------------|-----------------|
| 👶 New Streamers | Build confidence with your first virtual audience |
| 🎮 Small Communities | Keep your chat active and engaging |
| 🎥 Content Creators | Test new content with AI feedback |
| 🌍 Language Learners | Practice streaming in different languages |

</div>

## 🚀 Getting Started

<div align="center">

### 📋 What You'll Need

| 🛠️ Tool | 📝 Description | 🔗 Link |
|---------|---------------|---------|
| Node.js | Version 14 or higher | [Download](https://nodejs.org/) |
| Twitch Dev Account | For API access | [Register](https://dev.twitch.tv/console) |
| Groq API Key | For AI services | [Sign Up](https://groq.com/) |

### 🛠️ Installation Steps

<div align="left">

#### 1️⃣ Clone & Setup
```bash
# Clone the repository
git clone https://github.com/gsilvamartin/twitch-ai-viewers.git

# Navigate to project directory
cd twitch-ai-viewers

# Install dependencies
npm install
```

#### 2️⃣ Configuration
Create a `.env` file in the project root with:

```env
# Twitch Credentials
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_CHANNEL=your_channel_name

# Bot Settings
# You can add multiple bots by using the prefix BOT1_, BOT2_, etc.
BOT1_USERNAME=your_bot_username
BOT1_OAUTH_TOKEN=oauth:your_token
# Example for second bot:
# BOT2_USERNAME=your_second_bot_username
# BOT2_OAUTH_TOKEN=oauth:your_second_token

# AI Settings
GROQ_API_KEY=your_groq_api_key
ORIGINAL_STREAM_LANGUAGE=en

# Time Settings
TRANSCRIPT_DURATION=60000
MESSAGE_INTERVAL=5000
```

#### 3️⃣ Running the Application

**Development Mode**
```bash
npm run dev
```

**Production Mode**
```bash
npm run build
npm start
```

</div>

### ⚙️ Configuration Guide

| 🔧 Setting | 📝 Description | ⏱️ Default |
|------------|---------------|------------|
| `TRANSCRIPT_DURATION` | Audio processing duration (ms) | 60000 |
| `MESSAGE_INTERVAL` | Time between messages (ms) | 5000 |
| `ORIGINAL_STREAM_LANGUAGE` | Stream language | en |

</div>

## 🤖 How It Works

<div align="center">

```mermaid
graph TD
    A[Twitch Stream] --> B[Voice Capture]
    B --> C[Audio Processing]
    C --> D[Transcription]
    D --> E[AI Analysis]
    E --> F[Message Generation]
    F --> G[Chat Interaction]
    H[Game Context] --> E
    I[Chat History] --> E
```

</div>

<div align="center">

| Component | Description | Features |
|-----------|-------------|----------|
| Voice Capture | Audio Processing | FFmpeg, Real-time, Multi-format |
| Speech Recognition | Transcription | Whisper, Multi-language, Noise handling |
| AI Message Generation | Response Creation | Context-aware, Game-specific, Natural flow |
| Chat Interaction | Message Delivery | Multiple bots, Anti-spam, Rate limiting |

</div>

## 🛠️ Tech Stack

<div align="center">

| Category | Technology | Badge |
|----------|------------|-------|
| Runtime | Node.js | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) |
| Language | TypeScript | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) |
| Audio | FFmpeg | ![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white) |
| AI | Groq | ![Groq](https://img.shields.io/badge/Groq-00A67E?style=for-the-badge&logo=groq&logoColor=white) |
| Chat | Twitch | ![Twitch](https://img.shields.io/badge/Twitch-9146FF?style=for-the-badge&logo=twitch&logoColor=white) |

</div>

## 📝 Project Structure

<div align="center">

| Directory | File | Purpose |
|-----------|------|---------|
| `src/` | `main.ts` | Application entry point |
| | `bot.ts` | Twitch bot logic |
| | `ai.ts` | AI service and audio processing |
| | `logger.ts` | Logging utility |
| Root | `package.json` | Project dependencies |
| | `tsconfig.json` | TypeScript configuration |
| | `.env` | Configuration file |

</div>

## 🤝 Contributing

<div align="center">

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Open Issues](https://img.shields.io/github/issues/gsilvamartin/twitch-ai-viewers?style=for-the-badge)](https://github.com/gsilvamartin/twitch-ai-viewers/issues)

</div>

<div align="center">

| Step | Action | Command |
|------|--------|---------|
| 1. Fork | Create your copy | Click "Fork" button |
| 2. Branch | Create feature branch | ```git checkout -b feature/AmazingFeature``` |
| 3. Commit | Save your changes | ```git commit -m 'Add some AmazingFeature'``` |
| 4. Push | Upload changes | ```git push origin feature/AmazingFeature``` |
| 5. PR | Create Pull Request | Click "New Pull Request" |

</div>

---

<div align="center">

Made with ❤️ by [Guilherme Martin](https://github.com/gsilvamartin)

</div>
