from supabase import create_client
import os


def main():
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_KEY"]

    supabase = create_client(
        supabase_url,
        supabase_key
    )

    try:
        # Simple database activity check
        response = supabase.rpc("keepalive").execute()

        print("Supabase keepalive successful")
        print(response)

        return 0

    except Exception as e:
        print(f"Supabase keepalive failed: {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())