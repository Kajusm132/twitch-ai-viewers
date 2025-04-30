<div align="center">

# 🎮 Twitch AI Viewers 🤖

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/discord/your-discord-server?label=Discord&logo=discord)](https://discord.gg/your-invite-link)

> 🎥 **Never Stream Alone Again!** Twitch AI Viewers is your perfect companion for those early streaming days. Whether you're just starting out or looking to make your stream more engaging, this bot provides intelligent, context-aware viewers that interact naturally with your content.

> 🤖 **Your First Virtual Audience** - Perfect for new streamers who want to build confidence and create a welcoming atmosphere. The AI viewers engage with your content, respond to your commentary, and help create a more dynamic streaming experience.

> 💡 **Why Use Twitch AI Viewers?**
> - 🎯 Perfect for new streamers building their community
> - 🤝 Never feel like you're talking to an empty chat
> - 🎮 Natural interactions that respond to your gameplay
> - 🎤 Context-aware responses to your commentary
> - 🌟 Create a more engaging streaming environment

![Twitch AI Viewers Demo](https://via.placeholder.com/800x400?text=Twitch+AI+Viewers+Demo)

</div>

## ✨ Features

<div align="center">

| 🎤 Audio Processing | 🤖 AI Integration | 💬 Chat Interaction | ⚙️ Configuration |
|-------------------|------------------|-------------------|-----------------|
| Real-time capture | Smart transcription | Natural responses | Flexible settings |
| Auto format conversion | Context-aware messages | Emoji support | Easy setup |
| Noise reduction | Multi-language support | Anti-spam system | Error handling |

</div>

## 🎯 Perfect For

<div align="center">

| 👶 New Streamers | 🎮 Small Communities | 🎥 Content Creators | 🌍 Language Learners |
|----------------|-------------------|-------------------|-------------------|
| Build confidence with your first virtual audience | Keep your chat active and engaging | Test new content with AI feedback | Practice streaming in different languages |
| Learn streaming basics with AI support | Create a welcoming atmosphere | Get instant reactions to your content | Improve language skills while streaming |
| Overcome initial streaming anxiety | Grow your community naturally | Experiment with different styles | Connect with international viewers |

</div>

## 🌟 Key Benefits

- **Build Confidence**
  - Practice your streaming skills with AI viewers
  - Get comfortable with live commentary
  - Develop your unique streaming style

- **Engage Your Audience**
  - Create a more dynamic chat environment
  - Keep the conversation flowing
  - Make your stream more interactive

- **Improve Your Content**
  - Get instant feedback on your commentary
  - Test different streaming approaches
  - Learn what works best for your audience

- **Grow Your Community**
  - Create a welcoming atmosphere for new viewers
  - Maintain chat activity during slow periods
  - Build momentum for your stream

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/gsilvamartin/twitch-ai-viewers.git
cd twitch-ai-viewers

# Install dependencies
npm install

# Start in development mode
npm run dev
```

## 📋 Prerequisites

- **Node.js** (version 14 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation with `node --version`

- **Twitch Developer Account**
  - Register at [Twitch Developer Console](https://dev.twitch.tv/console)
  - Create a new application
  - Note your Client ID and Client Secret

- **Groq API Key**
  - Sign up at [Groq](https://groq.com/)
  - Generate an API key from your dashboard

## 🔧 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/gsilvamartin/twitch-ai-viewers.git
cd twitch-ai-viewers
```

2. **Install dependencies:**
```bash
npm install
```
This will automatically install FFmpeg and all other required dependencies.

3. **Configure environment variables:**
Create a `.env` file in the project root with the following variables:

```env
# Twitch Credentials
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret

# Bot Settings
BOT_USERNAME=your_bot_username
BOT_OAUTH_TOKEN=oauth:your_token

# AI Settings
GROQ_API_KEY=your_groq_api_key
ORIGINAL_STREAM_LANGUAGE=en # or other language

# Time Settings
TRANSCRIPT_DURATION=60000 # duration in milliseconds
MESSAGE_INTERVAL=5000 # interval between messages in milliseconds
```

## 🎮 Usage

### Development Mode
```bash
npm run dev
```
This starts the bot with hot-reloading enabled, perfect for development and testing.

### Production Mode
```bash
npm run build
npm start
```
This compiles the TypeScript code and runs the optimized version.

### Advanced Usage

<details>
<summary>📊 Customizing Message Generation</summary>

- Adjust `MESSAGE_INTERVAL` to control how often the bot sends messages
- Modify `TRANSCRIPT_DURATION` to change audio chunk size
- Set `ORIGINAL_STREAM_LANGUAGE` to match the stream's language

</details>

<details>
<summary>👀 Monitoring</summary>

- Check the console for real-time logs
- Monitor message generation and audio processing
- View error reports and system status

</details>

## ⚙️ Configuration

### Environment Variables

| Category | Variable | Description |
|----------|----------|-------------|
| Twitch | `TWITCH_CLIENT_ID` | Your Twitch application Client ID |
| Twitch | `TWITCH_CLIENT_SECRET` | Your Twitch application Client Secret |
| Bot | `BOT_USERNAME` | The username of your bot account |
| Bot | `BOT_OAUTH_TOKEN` | OAuth token (format: oauth:xxxxxxxx) |
| AI | `GROQ_API_KEY` | Your Groq API key |
| AI | `ORIGINAL_STREAM_LANGUAGE` | Stream language (default: 'en') |
| Timing | `TRANSCRIPT_DURATION` | Audio chunk length in ms (default: 60000) |
| Timing | `MESSAGE_INTERVAL` | Message interval in ms (default: 5000) |

## 🛠️ Tech Stack

<div align="center">

| Category | Technology |
|----------|------------|
| Runtime | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) |
| Language | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) |
| Audio | ![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white) |
| AI | ![Groq](https://img.shields.io/badge/Groq-00A67E?style=for-the-badge&logo=groq&logoColor=white) |
| Chat | ![Twitch](https://img.shields.io/badge/Twitch-9146FF?style=for-the-badge&logo=twitch&logoColor=white) |

</div>

## 📝 Project Structure

```plaintext
twitch-ai-viewers/
├── src/
│   ├── main.ts          # Application entry point
│   ├── bot.ts           # Twitch bot logic
│   ├── ai.ts            # AI service and audio processing
│   └── logger.ts        # Logging utility
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── .env                 # Configuration file (not versioned)
```

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork the project**
2. **Create your feature branch**
```bash
git checkout -b feature/AmazingFeature
```

3. **Commit your changes**
```bash
git commit -m 'Add some AmazingFeature'
```

4. **Push to the branch**
```bash
git push origin feature/AmazingFeature
```

5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write clear commit messages
- Include tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

<div align="center">

| Service | Description |
|---------|-------------|
| [Twitch](https://www.twitch.tv/) | For the amazing streaming platform and API |
| [Groq](https://groq.com/) | For the powerful AI services |
| [FFmpeg](https://ffmpeg.org/) | For robust audio processing |
| Open Source Community | For their invaluable contributions |

</div>

## 📞 Support

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Join%20our%20community-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/your-invite-link)
[![GitHub Issues](https://img.shields.io/badge/GitHub-Issues-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/gsilvamartin/twitch-ai-viewers/issues)

</div>

---

<div align="center">

Made with ❤️ by [Your Name](https://github.com/gsilvamartin)

</div>
