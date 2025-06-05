const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const cliProgress = require('cli-progress');

// Create output directories
const outputDir = path.join(__dirname, 'output');
fs.ensureDirSync(outputDir);

const mediaDir = path.join(outputDir, 'media');
fs.ensureDirSync(mediaDir);

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Show QR code
client.on('qr', (qr) => {
    console.log('\n🔐 QR Code received. Scan this with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// When ready
client.on('ready', () => {
    console.log('\n✅ Client is ready! You can now send !scrape [chat-id] to start scraping.');
});

// Download media helper
async function downloadMedia(message, progressBar) {
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            if (media) {
                const filename = `${message.id.id}.${media.mimetype.split('/')[1]}`;
                const filepath = path.join(mediaDir, filename);
                await fs.writeFile(filepath, media.data, 'base64');
                progressBar.increment();
                return filename;
            }
        } catch (error) {
            console.error(`\n❌ Error downloading media for message ${message.id.id}:`, error.message);
        }
    }
    return null;
}

// Format message
function formatMessage(message) {
    return {
        id: message.id.id,
        timestamp: message.timestamp,
        from: message.from,
        body: message.body,
        type: message.type,
        hasMedia: message.hasMedia,
        mediaFilename: null
    };
}

// Main scraping logic
async function scrapeChat(chatId) {
    console.log(`\n🚀 Starting to scrape chat: ${chatId}`);
    
    try {
        const messages = await client.getChatById(chatId);
        const allMessages = await messages.fetchMessages({ limit: 1000000 });

        const chatData = {
            chatId: chatId,
            chatName: messages.name,
            messages: []
        };

        console.log(`\n📊 Found ${allMessages.length} messages. Starting to process...`);

        const messageBar = new cliProgress.SingleBar({
            format: '📝 Processing Messages |{bar}| {percentage}% | {value}/{total} Messages',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        const mediaBar = new cliProgress.SingleBar({
            format: '📎 Downloading Media |{bar}| {percentage}% | {value}/{total} Files',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        const mediaCount = allMessages.filter(msg => msg.hasMedia).length;

        messageBar.start(allMessages.length, 0);
        if (mediaCount > 0) mediaBar.start(mediaCount, 0);

        for (const message of allMessages) {
            const messageData = formatMessage(message);
            if (message.hasMedia) {
                messageData.mediaFilename = await downloadMedia(message, mediaBar);
            }
            chatData.messages.push(messageData);
            messageBar.increment();
        }

        messageBar.stop();
        if (mediaCount > 0) mediaBar.stop();

        const outputFile = path.join(outputDir, `${chatId.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        await fs.writeJson(outputFile, chatData, { spaces: 2 });

        console.log(`\n✅ Scraping completed!`);
        console.log(`📁 Data saved to: ${outputFile}`);
        console.log(`📁 Media files saved in: ${mediaDir}`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Total Messages: ${allMessages.length}`);
        console.log(`   - Media Files: ${mediaCount}`);
        
    } catch (error) {
        console.error('\n❌ Error during scraping:', error);
    }
}

// 👇 Command handler (replaces old message listener)
const handleCommand = async (message) => {
    if (!message.body.startsWith('!scrape')) return;

    console.log('📥 Received command:', message.body);

    const chatId = message.body.split(' ')[1];
    if (chatId) {
        await scrapeChat(chatId.trim());
    } else {
        message.reply('⚠️ Please provide a chat ID. Usage: !scrape <chat-id>');
    }
};

// 👇 These two lines ensure it works for both your messages and others'
client.on('message_create', handleCommand); // your own messages
client.on('message', handleCommand);        // messages from others

// Initialize
client.initialize();
