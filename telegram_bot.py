import atexit
import json
import os
import re
import signal
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ENV_PATH = ROOT / ".env"
LOCK_PATH = ROOT / ".telegram-bot.lock"
TOKEN_PATTERN = re.compile(r"^\d{6,}:[A-Za-z0-9_-]{20,}$")
DEFAULT_BOT_TOKEN = "8613251282:AAED129hQ2froittgyZX0Q1G9hv06imOxiE"
DEFAULT_WEB_APP_URL = "https://sora-production-658d.up.railway.app"


def load_env() -> None:
    if not ENV_PATH.exists():
        return

    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env()

BOT_TOKEN = (
    os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    or os.getenv("BOT_TOKEN", "").strip()
    or DEFAULT_BOT_TOKEN
)
WEB_APP_URL = (
    os.getenv("TELEGRAM_WEBAPP_URL", "").strip()
    or os.getenv("WEB_APP_URL", "").strip()
    or DEFAULT_WEB_APP_URL
)
BOT_API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}" if BOT_TOKEN else ""


def sleep(seconds: float) -> None:
    time.sleep(seconds)


def is_process_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def release_lock(*_args) -> None:
    try:
        if LOCK_PATH.exists() and LOCK_PATH.read_text(encoding="utf-8").strip() == str(os.getpid()):
            LOCK_PATH.unlink()
    except OSError:
        pass


def acquire_lock() -> bool:
    try:
        if LOCK_PATH.exists():
            existing = LOCK_PATH.read_text(encoding="utf-8").strip()
            existing_pid = int(existing) if existing.isdigit() else 0
            if existing_pid and is_process_alive(existing_pid):
                print(f"Another local telegram_bot.py process is already running (PID {existing_pid}).")
                return False
        LOCK_PATH.write_text(str(os.getpid()), encoding="utf-8")
        return True
    except OSError as error:
        print(f"Telegram bot lock warning: {error}")
        return True


def telegram_request(method: str, payload: dict) -> dict:
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is missing.")

    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{BOT_API_BASE}/{method}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            raw = response.read().decode("utf-8")
            data = json.loads(raw)
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} failed: {error.code} {details}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"{method} failed: {error}") from error

    if not data.get("ok"):
        raise RuntimeError(
            f"{method} failed: {data.get('error_code')} {data.get('description')}"
        )

    return data


def has_valid_token_shape(token: str) -> bool:
    return bool(TOKEN_PATTERN.match(token))


def validate_bot_connection() -> None:
    result = telegram_request("getMe", {}).get("result", {})
    username = result.get("username", "unknown")
    bot_id = result.get("id", "unknown")
    print(f"Telegram bot connected as @{username} (id: {bot_id}).")


def create_launch_button() -> dict:
    if WEB_APP_URL.startswith("https://"):
        return {"inline_keyboard": [[{"text": "Sora AI", "web_app": {"url": WEB_APP_URL}}]]}
    return {"inline_keyboard": [[{"text": "Sora AI", "url": WEB_APP_URL}]]}


def send_start_message(chat_id: int) -> None:
    text = "\n\n".join(
        [
            "Salom. Bu Sora AI boti.",
            "Bu yerda siz 0 dan boshlab ingliz tilini bosqichma-bosqich organasiz: A0 -> A1 -> A2 -> B1 -> B2 -> C1 -> IELTS.",
            'Pastdagi "Sora AI" tugmasini bosing va ilovani oching.',
        ]
    )
    telegram_request(
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": text,
            "reply_markup": create_launch_button(),
        },
    )


def handle_update(update: dict) -> None:
    message = update.get("message") or {}
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = (message.get("text") or "").strip().lower()

    if not chat_id or not text:
        return

    if text in {"/start", "/app", "sora ai"}:
        send_start_message(chat_id)
        return

    telegram_request(
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": "Sora AI ilovasini ochish uchun /start deb yozing.",
            "reply_markup": create_launch_button(),
        },
    )


def run_bot() -> int:
    if not BOT_TOKEN:
        print("Telegram bot is disabled. Set TELEGRAM_BOT_TOKEN or update DEFAULT_BOT_TOKEN in telegram_bot.py.")
        return 0

    if not has_valid_token_shape(BOT_TOKEN):
        print("Telegram bot token format is invalid. Update DEFAULT_BOT_TOKEN in telegram_bot.py or TELEGRAM_BOT_TOKEN in .env.")
        return 1

    if not acquire_lock():
        return 0

    atexit.register(release_lock)
    signal.signal(signal.SIGINT, lambda *_: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))

    print(f"Telegram bot started. Web app: {WEB_APP_URL}")
    if "localhost" in WEB_APP_URL.lower() or "127.0.0.1" in WEB_APP_URL.lower():
        print("TELEGRAM_WEBAPP_URL is local. Use a public HTTPS URL for real Telegram devices.")

    try:
        validate_bot_connection()
    except Exception as error:  # noqa: BLE001
        message = str(error)
        if "404" in message or "401" in message:
            print("Telegram bot token is invalid or revoked. Create a fresh token in BotFather, then update DEFAULT_BOT_TOKEN in telegram_bot.py or TELEGRAM_BOT_TOKEN in .env.")
            return 1
        print(f"Telegram bot could not verify credentials: {error}")
        return 1

    try:
        telegram_request("deleteWebhook", {"drop_pending_updates": False})
    except Exception as error:  # noqa: BLE001
        message = str(error)
        if "404" in message or "401" in message:
            print("Telegram bot token is invalid or revoked. Update DEFAULT_BOT_TOKEN in telegram_bot.py or TELEGRAM_BOT_TOKEN in .env.")
            return 1
        print(f"Telegram bot could not clear webhook state: {error}")

    offset = 0
    while True:
        try:
            response = telegram_request(
                "getUpdates",
                {
                    "offset": offset,
                    "timeout": 25,
                    "allowed_updates": ["message"],
                },
            )

            for update in response.get("result", []):
                offset = update.get("update_id", 0) + 1
                handle_update(update)
        except Exception as error:  # noqa: BLE001
            message = str(error)
            if "409" in message:
                print("Another Telegram bot polling instance is already active. Current bot session will stop cleanly.")
                return 0
            if "404" in message or "401" in message:
                print("Telegram bot token is invalid or revoked. Update DEFAULT_BOT_TOKEN in telegram_bot.py or TELEGRAM_BOT_TOKEN in .env.")
                return 1
            print(f"Telegram bot polling error: {error}")
            sleep(3)


if __name__ == "__main__":
    sys.exit(run_bot())
