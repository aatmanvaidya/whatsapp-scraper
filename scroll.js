// scroll_up_chat.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
require("dotenv").config();

// Initialize WhatsApp client with visible browser
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false, // Show the browser UI
    args: ["--no-sandbox"],
  },
});

// Show QR code when needed
client.on("qr", (qr) => {
  console.log("\n🔐 QR Code received. Scan this with your WhatsApp:");
  qrcode.generate(qr, { small: true });
});

// When client is ready
client.on("ready", async () => {
  console.log("\n✅ Client is ready!");

  try {
    // Get chat ID from .env
    const chatId = process.env.CHAT_ID;
    if (!chatId) {
      console.error("❌ No CHAT_ID found in .env file");
      process.exit(1);
    }

    // Get the chat
    const chat = await client.getChatById(chatId);
    console.log(`\n📱 Found chat: ${chat.name}`);

    const page = client.pupPage;
    await page.waitForTimeout(2000);

    await page.waitForSelector("span[title]", { timeout: 10000 });

    const found = await page.evaluate((targetName) => {
      const chats = Array.from(document.querySelectorAll("span[title]"));
      for (let chat of chats) {
        if (chat.title.trim() === targetName.trim()) {
          chat.click();
          return true;
        }
      }
      return false;
    }, chat.name);

    if (!found) {
      console.error(`❌ Could not find chat with name: "${chat.name}"`);
    } else {
      console.log("✅ Chat clicked successfully!");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
});

// Start the client
client.initialize();
