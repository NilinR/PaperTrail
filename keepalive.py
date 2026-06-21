from __future__ import annotations

import os
import re
import ssl
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def load_urls() -> list[str]:
    raw = os.getenv("KEEPALIVE_URLS", "").strip()
    if raw:
        return [url.strip() for url in re.split(r"[\n\r,]+", raw) if url.strip()]

    config_path = os.path.join(os.path.dirname(__file__), ".keepalive_urls")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as handle:
            return [line.strip() for line in handle if line.strip() and not line.strip().startswith("#")]

    return []


def ping_url(url: str) -> tuple[str, int, str]:
    if not re.match(r"^https?://", url):
        url = "https://" + url

    request = Request(url, headers={"User-Agent": "PaperTrail KeepAlive/1.0"})
    request.method = "GET"
    context = ssl.create_default_context()

    with urlopen(request, timeout=30, context=context) as response:
        return url, response.status, response.reason


def main() -> int:
    urls = load_urls()
    if not urls:
        print("ERROR: No keep-alive URLs configured.")
        print("Set KEEPALIVE_URLS or create a .keepalive_urls file in the repository root.")
        print("Example:")
        print("  KEEPALIVE_URLS='https://your-frontend.vercel.app https://your-backend.vercel.app'")
        return 1

    print("Keep-alive: pinging configured URLs...")
    errors = 0

    for url in urls:
        try:
            name, status, reason = ping_url(url)
            print(f"  {name} -> {status} {reason}")
        except HTTPError as exc:
            print(f"  {url} -> HTTP error {exc.code} {exc.reason}")
            errors += 1
        except URLError as exc:
            print(f"  {url} -> URL error {exc.reason}")
            errors += 1
        except Exception as exc:
            print(f"  {url} -> unexpected error: {exc!r}")
            errors += 1

    print("Keep-alive complete.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
