import os
from urllib.parse import urlparse
from supabase import create_client


def main():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")

    # Check that GitHub secrets exist
    if not supabase_url:
        print("ERROR: SUPABASE_URL secret is missing")
        return 1

    if not supabase_key:
        print("ERROR: SUPABASE_KEY secret is missing")
        return 1

    # Validate the URL before trying to connect
    parsed = urlparse(supabase_url)

    if parsed.scheme != "https" or not parsed.hostname:
        print("ERROR: SUPABASE_URL is invalid")
        print(f"Received URL: {supabase_url}")
        return 1

    print(f"Connecting to Supabase: {parsed.hostname}")

    try:
        supabase = create_client(
            supabase_url,
            supabase_key
        )

        # Call the PostgreSQL keepalive function
        response = supabase.rpc("keepalive").execute()

        print("Supabase keepalive successful")
        print(response)

        return 0

    except Exception as e:
        print(f"Supabase keepalive failed: {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
