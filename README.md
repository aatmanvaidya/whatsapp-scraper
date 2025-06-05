# WhatsApp Chat Scraper

This is a WhatsApp chat scraper built using whatsapp-web.js that allows you to collect messages, images, and videos from WhatsApp chats.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A smartphone with WhatsApp installed
- A stable internet connection

## Installation

1. Clone this repository or download the files
2. Install dependencies:
```bash
npm install
```

## Setup and Usage

1. Start the scraper:
```bash
node scraper.js
```

2. When you run the script for the first time, it will generate a QR code in the terminal.

3. Open WhatsApp on your phone:
   - Go to Settings > Linked Devices
   - Tap on "Link a Device"
   - Scan the QR code shown in your terminal

4. Once connected, you'll see "Client is ready!" in the terminal.

5. To scrape a chat:
   - Open the WhatsApp chat you want to scrape
   - The chat ID will be in the format: `[number]@c.us` for individual chats or `[group-id]@g.us` for group chats
   - Send a message to the bot: `!scrape [chat-id]`
   - For example: `!scrape 1234567890@c.us` for an individual chat

## Output

The scraper will create two directories:
- `output/`: Contains JSON files with chat data
- `output/media/`: Contains downloaded media files (images, videos, etc.)

The JSON file for each chat will contain:
- Chat ID
- Chat name
- Messages array with:
  - Message ID
  - Timestamp
  - Sender
  - Message content
  - Message type
  - Media information (if any)

## Important Notes

1. The scraper uses WhatsApp Web, so your phone needs to stay connected to the internet.
2. The first time you run the scraper, it will create a `.wwebjs_auth` directory to store your session.
3. Media files are saved with their original message ID as the filename.
4. The scraper can handle large chats, but it may take some time to process all messages.
5. Make sure you have enough disk space for media files.

## Troubleshooting

1. If the QR code doesn't work:
   - Make sure your phone has a stable internet connection
   - Try closing and reopening WhatsApp
   - Restart the scraper

2. If the scraper stops working:
   - Check your internet connection
   - Make sure your phone is still connected to WhatsApp Web
   - Restart the scraper

3. If media files aren't downloading:
   - Check if you have enough disk space
   - Make sure the media files haven't expired (WhatsApp media can expire after some time)

## Security Note

This scraper uses your WhatsApp account. Make sure to:
- Keep your session data secure
- Don't share your `.wwebjs_auth` directory
- Be careful with the scraped data
- Respect privacy and data protection laws in your jurisdiction 