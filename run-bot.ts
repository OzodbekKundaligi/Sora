import { spawn } from 'node:child_process';

type Candidate = {
  command: string;
  args: string[];
};

const script = 'telegram_bot.py';
const candidates: Candidate[] = [];

if (process.env.PYTHON_BIN) {
  candidates.push({ command: process.env.PYTHON_BIN, args: [] });
}

if (process.platform === 'win32') {
  candidates.push({ command: 'py', args: ['-3'] });
}

candidates.push(
  { command: 'python3', args: [] },
  { command: 'python', args: [] },
);

function canRun(candidate: Candidate) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(candidate.command, [...candidate.args, '--version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
      env: process.env,
    });

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

async function main() {
  const python = await pickPython();

  if (!python) {
    console.warn(
      'Python interpreter was not found. Install Python 3 or set PYTHON_BIN in .env so telegram_bot.py can run.',
    );
    process.exit(0);
  }

  const child = spawn(python.command, [...python.args, script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error('Could not start telegram_bot.py:', error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

void main();
