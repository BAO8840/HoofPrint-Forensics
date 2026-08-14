"""
Supabase client. Uses the SERVICE ROLE key because this backend runs
server-side only and there's no per-user auth layer (see project decision:
analyst attribution is a free-text field, not a login system).

Never expose the service role key to the frontend — it bypasses row-level
security entirely. The frontend only ever talks to our FastAPI backend,
never directly to Supabase.
"""
import os
from supabase import create_client, Client

_SUPABASE_URL = os.environ.get("SUPABASE_URL")
_SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        if not _SUPABASE_URL or not _SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_SERVICE_KEY not set. Copy .env.example to .env "
                "and fill in your Supabase project credentials."
            )
        _client = create_client(_SUPABASE_URL, _SUPABASE_KEY)
    return _client
