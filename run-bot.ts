import { spawn } from 'node:child_process';

type Candidate = {
  command: string;
  args: string[];
};

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat?: { id?: number };
    text?: string;
  };
};

const script = 'telegram_bot.py';
const DEFAULT_BOT_TOKEN = '8613251282:AAED129hQ2froittgyZX0Q1G9hv06imOxiE';
const DEFAULT_WEB_APP_URL = 'https://sora-production-658d.up.railway.app';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || DEFAULT_BOT_TOKEN;
const WEB_APP_URL = process.env.TELEGRAM_WEBAPP_URL || process.env.WEB_APP_URL || DEFAULT_WEB_APP_URL;
const BOT_API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : '';
const candidates: Candidate[] = [];

if (process.env.PYTHON_BIN) {
  candidates.push({ command: process.env.PYTHON_BIN, args: [] });
}

if (process.platform === 'win32') {
  candidates.push({ command: 'py', args: ['-3'] });
}

candidates.push(
  { command: '/opt/venv/bin/python', args: [] },
  { command: '/opt/venv/bin/python3', args: [] },
  { command: 'python3.11', args: [] },
  { command: 'python3', args: [] },
  { command: 'python', args: [] },
);

function spawnPython(candidate: Candidate, extraArgs: string[], pipeOutput = true) {
  if (process.platform === 'win32') {
    const fullCommand = [candidate.command, ...candidate.args, ...extraArgs].join(' ');
    return spawn('cmd.exe', ['/d', '/s', '/c', fullCommand], {
      stdio: pipeOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
  }

  return spawn(candidate.command, [...candidate.args, ...extraArgs], {
    stdio: pipeOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });
}

function canRun(candidate: Candidate) {
  return new Promise<boolean>((resolve) => {
    const child = spawnPython(candidate, ['--version']);

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve(false);
    }, 2000);

    child.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(false);
    });

    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

async function pickPython() {
  for (const candidate of candidates) {
    if (await canRun(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function telegramRequest<T>(method: string, payload: Record<string, unknown>) {
  if (!BOT_TOKEN) {
    throw new Error('Telegram bot token is missing.');
  }

  const response = await fetch(`${BOT_API_BASE}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json() as { ok?: boolean; result?: T; description?: string; error_code?: number };
  if (!response.ok || !data.ok) {
    throw new Error(`${method} failed: ${data.error_code ?? response.status} ${data.description ?? response.statusText}`);
  }

  return data.result as T;
}

function createLaunchButton() {
  if (WEB_APP_URL.startsWith('https://')) {
    return { inline_keyboard: [[{ text: 'Sora AI', web_app: { url: WEB_APP_URL } }]] };
  }

  return { inline_keyboard: [[{ text: 'Sora AI', url: WEB_APP_URL }]] };
}

async function sendStartMessage(chatId: number) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: [
      'Salom. Bu Sora AI boti.',
      'Bu yerda siz 0 dan boshlab ingliz tilini bosqichma-bosqich organasiz: A0 -> A1 -> A2 -> B1 -> B2 -> C1 -> IELTS.',
      'Pastdagi "Sora AI" tugmasini bosing va ilovani oching.',
    ].join('\n\n'),
    reply_markup: createLaunchButton(),
  });
}

async function handleUpdate(update: TelegramUpdate) {
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim().toLowerCase();

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

async function runNodeBot() {
  process.stdout.write(`[bot] Python topilmadi, Node fallback bot ishga tushyapti. Web app: ${WEB_APP_URL}\n`);

  try {
    const bot = await telegramRequest<{ id: number; username?: string }>('getMe', {});
    process.stdout.write(`[bot] Telegram bot connected as @${bot.username ?? 'unknown'} (id: ${bot.id}).\n`);
  } catch (error) {
    process.stderr.write(`[bot] Could not verify Telegram bot credentials: ${String(error)}\n`);
    process.exit(1);
  }

  try {
    await telegramRequest('deleteWebhook', { drop_pending_updates: false });
  } catch (error) {
    process.stderr.write(`[bot] Could not clear webhook state: ${String(error)}\n`);
  }

  let offset = 0;

  while (true) {
    try {
      const updates = await telegramRequest<TelegramUpdate[]>('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message'],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      const message = String(error);
      if (message.includes('409')) {
        process.stdout.write('[bot] Another Telegram polling instance is active. Current bot session will stop cleanly.\n');
        process.exit(0);
      }

      process.stderr.write(`[bot] Telegram polling error: ${message}\n`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function main() {
  const python = await pickPython();

  if (!python) {
    await runNodeBot();
    return;
  }

  const bot = spawnPython(python, [script], false);

  bot.on('error', async (error) => {
    process.stderr.write(`[bot] Could not start telegram_bot.py: ${String(error)}\n`);
    await runNodeBot();
  });

  bot.on('exit', async (code) => {
    if (code === 0) {
      process.exit(0);
    }

    process.stderr.write(`[bot] telegram_bot.py exited with code ${code ?? 1}. Falling back to Node bot.\n`);
    await runNodeBot();
  });
}

void main();
