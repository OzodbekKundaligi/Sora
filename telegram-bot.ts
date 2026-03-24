import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.TELEGRAM_WEBAPP_URL || 'http://localhost:3000';
const botApiBase = botToken ? `https://api.telegram.org/bot${botToken}` : '';
const botLockPath = path.join(process.cwd(), '.telegram-bot.lock');

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function releaseBotLock() {
  try {
    if (fs.existsSync(botLockPath)) {
      const current = fs.readFileSync(botLockPath, 'utf8').trim();
      if (current === String(process.pid)) {
        fs.unlinkSync(botLockPath);
      }
    }
  } catch {}
}

function acquireBotLock() {
  try {
    if (fs.existsSync(botLockPath)) {
      const existingPid = Number(fs.readFileSync(botLockPath, 'utf8').trim());
      if (existingPid && isProcessAlive(existingPid)) {
        console.warn(`Another local telegram-bot.ts process is already running (PID ${existingPid}).`);
        return false;
      }
    }

    fs.writeFileSync(botLockPath, String(process.pid), 'utf8');
    return true;
  } catch (error) {
    console.warn('Telegram bot lock could not be created:', error);
    return true;
  }
}

function createLaunchButton() {
  if (webAppUrl.startsWith('https://')) {
    return {
      inline_keyboard: [[{ text: 'Sora AI', web_app: { url: webAppUrl } }]],
    };
  }

  return {
    inline_keyboard: [[{ text: 'Sora AI', url: webAppUrl }]],
  };
}

async function telegramRequest<T>(method: string, payload: Record<string, unknown>) {
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing.');
  }

  const response = await fetch(`${botApiBase}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${method} failed: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<T>;
}

async function sendStartMessage(chatId: number) {
  const text = [
    'Salom. Bu Sora AI boti.',
    'Bu yerda siz 0 dan boshlab ingliz tilini bosqichma-bosqich organasiz: A0 -> A1 -> A2 -> B1 -> B2 -> C1 -> IELTS.',
    'Pastdagi "Sora AI" tugmasini bosing va ilovani oching.',
  ].join('\n\n');

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: createLaunchButton(),
  });
}

async function handleUpdate(update: TelegramUpdate) {
  const text = update.message?.text?.trim().toLowerCase();
  const chatId = update.message?.chat.id;

  if (!chatId || !text) {
    return;
  }

  if (text === '/start' || text === '/app' || text === 'sora ai') {
    await sendStartMessage(chatId);
    return;
  }

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: 'Sora AI ilovasini ochish uchun /start deb yozing.',
    reply_markup: createLaunchButton(),
  });
}

async function runBot() {
  if (!botToken) {
    console.warn('Telegram bot is disabled. Set TELEGRAM_BOT_TOKEN in .env to start it.');
    return;
  }

  if (!acquireBotLock()) {
    return;
  }

  process.on('exit', releaseBotLock);
  process.on('SIGINT', () => {
    releaseBotLock();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    releaseBotLock();
    process.exit(0);
  });

  let offset = 0;
  console.log(`Telegram bot started. Web app: ${webAppUrl}`);
  if (/localhost|127\.0\.0\.1/i.test(webAppUrl)) {
    console.warn('TELEGRAM_WEBAPP_URL is local. The button will only open on the same machine. Use a public HTTPS URL for real Telegram devices.');
  }

  try {
    await telegramRequest('deleteWebhook', {
      drop_pending_updates: false,
    });
  } catch (error) {
    console.warn('Telegram bot could not clear webhook state:', error);
  }

  while (true) {
    try {
      const response = await telegramRequest<{ result: TelegramUpdate[] }>('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message'],
      });

      for (const update of response.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        console.warn('Another Telegram bot polling instance is already active. Current bot session will stop cleanly.');
        return;
      }
      console.error('Telegram bot polling error:', error);
      await sleep(3000);
    }
  }
}

void runBot();
