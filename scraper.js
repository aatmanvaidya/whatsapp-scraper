const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
fs.ensureDirSync(outputDir);

// Create media directory if it doesn't exist
const mediaDir = path.join(outputDir, 'media');
fs.ensureDirSync(mediaDir);

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Generate QR Code
client.on('qr', (qr) => {
    console.log('QR Code received. Scan this with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// When client is ready
client.on('ready', () => {
    console.log('Client is ready!');
});

// Function to download media
async function downloadMedia(message) {
    if (message.hasMedia) {
        const media = await message.downloadMedia();
        if (media) {
            const filename = `${message.id.id}.${media.mimetype.split('/')[1]}`;
            const filepath = path.join(mediaDir, filename);
            await fs.writeFile(filepath, media.data, 'base64');
            return filename;
        }
    }
    return null;
}

// Function to format message data
function formatMessage(message) {
    return {
        id: message.id.id,
        timestamp: message.timestamp,
        from: message.from,
        body: message.body,
        type: message.type,
        hasMedia: message.hasMedia,
        mediaFilename: null // Will be updated if media is downloaded
    };
}

// Main scraping function
async function scrapeChat(chatId) {
    console.log(`Starting to scrape chat: ${chatId}`);
    
    try {
        // Get all messages from the chat
        const messages = await client.getChatById(chatId);
        const allMessages = await messages.fetchMessages({ limit: 1000000 }); // Large limit to get all messages
        
        const chatData = {
            chatId: chatId,
            chatName: messages.name,
            messages: []
        };

        console.log(`Found ${allMessages.length} messages. Starting to process...`);

        // Process each message
        for (const message of allMessages) {
            const messageData = formatMessage(message);
            
            // Download media if present
            if (message.hasMedia) {
                messageData.mediaFilename = await downloadMedia(message);
            }
            
            chatData.messages.push(messageData);
            
            // Log progress every 100 messages
            if (chatData.messages.length % 100 === 0) {
                console.log(`Processed ${chatData.messages.length} messages...`);
            }
        }

        // Save chat data to JSON file
        const outputFile = path.join(outputDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        await fs.writeJson(outputFile, chatData, { spaces: 2 });
        
        console.log(`Scraping completed! Data saved to: ${outputFile}`);
        console.log(`Media files saved in: ${mediaDir}`);
        
    } catch (error) {
        console.error('Error during scraping:', error);
    }
}

// Handle incoming messages
client.on('message', async (message) => {
    if (message.body.startsWith('!scrape')) {
        const chatId = message.body.split(' ')[1];
        if (chatId) {
            await scrapeChat(chatId);
        } else {
            message.reply('Please provide a chat ID to scrape. Usage: !scrape <chat-id>');
        }
    }
});

// Initialize the client
client.initialize(); 