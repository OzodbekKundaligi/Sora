import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';

const isWindows = process.platform === 'win32';
const runner = path.join(process.cwd(), 'node_modules', '.bin', isWindows ? 'tsx.cmd' : 'tsx');
const baseEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'production',
};

function startProcess(name: string, entry: string) {
  const child = isWindows
    ? spawn('cmd.exe', ['/d', '/s', '/c', `${runner} ${entry}`], {
        cwd: process.cwd(),
        env: baseEnv,
        stdio: ['inherit', 'pipe', 'pipe'],
      })
    : spawn(runner, [entry], {
        cwd: process.cwd(),
        env: baseEnv,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr?.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  return child;
}

const children: ChildProcess[] = [];
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGINT');
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
    process.exit(exitCode);
  }, 400);
}

function wireProcess(name: string, child: ChildProcess, optional = false) {
  children.push(child);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;

    if (optional && code === 0) {
      process.stdout.write(`[${name}] stopped.\n`);
      return;
    }

    const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    process.stderr.write(`[${name}] exited with ${detail}.\n`);
    shutdown(code ?? 1);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function main() {
  process.stdout.write('[start] Starting production site and bot...\n');
  wireProcess('site', startProcess('site', 'server.ts'));
  wireProcess('bot', startProcess('bot', 'run-bot.ts'), true);
}

main();
