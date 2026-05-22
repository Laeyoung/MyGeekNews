"""
LLM batch categorization for GeekNews upvotes that the rule-based categorizer
in src/lib/categorize.ts failed to classify (category == "기타").

Usage:
    export ANTHROPIC_API_KEY=sk-...
    python3 categorize_llm.py
    python3 categorize_llm.py --force  # re-classify everything

Strategy:
- Reads data/geeknews_my_upvotes.json
- For each article missing a `category` field (or where category == "기타"):
    - Send (title, description) to Haiku with a fixed taxonomy
    - Store result in-place: `category`, `tags` (free-form 1-3), `category_source: "llm"`
- Saves progress every 25 articles. Idempotent — safe to re-run.

Cost: at <500 input tokens & ~30 output tokens per call, ~$0.001/call.
For 200 unmatched articles, total ~$0.20.
"""

import argparse
import json
import os
import sys
import tempfile
import time
from pathlib import Path

# Reuse the project's helpers if available
sys.path.insert(0, str(Path(__file__).parent))
try:
    from geeknews_utils import get_data_path
except ImportError:
    def get_data_path(create_dirs=False):
        return Path(__file__).parent / "data" / "geeknews_my_upvotes.json"

try:
    from anthropic import Anthropic
    from anthropic import APIStatusError, APIConnectionError, RateLimitError
except ImportError:
    print("Install: pip install anthropic", file=sys.stderr)
    sys.exit(1)


def atomic_write_json(path: Path, data) -> None:
    """Write JSON to `path` atomically via a sibling temp file + os.replace."""
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    fd, tmp = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent)
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(payload)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise

# Must mirror src/lib/categorize.ts exactly
TAXONOMY = [
    "AI · LLM",
    "웹 · 인프라",
    "개발도구 · OSS",
    "데이터베이스",
    "보안",
    "산업 · 커리어",
    "에세이 · 의견",
    "Show GN",
    "기타",
]

SYSTEM = """You classify Korean tech-news article snippets into ONE category from a fixed taxonomy.
Respond with ONLY a single JSON object on one line: {"category": "<one of taxonomy>", "tags": ["t1","t2"]}
- tags: 1-3 short keyword tags (English or Korean). No spaces, no punctuation.
- Choose "기타" ONLY when nothing else fits.
"""

USER_TMPL = """Taxonomy: {taxonomy}

Title: {title}
Description: {description}

JSON:"""


def classify_one(client: Anthropic, title: str, description: str, max_retries: int = 3) -> dict:
    last_err: Exception | None = None
    for attempt in range(max_retries):
        try:
            msg = client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=120,
                system=SYSTEM,
                messages=[{
                    "role": "user",
                    "content": USER_TMPL.format(
                        taxonomy=", ".join(TAXONOMY),
                        title=title,
                        description=(description or "")[:600],
                    ),
                }],
            )
            break
        except (RateLimitError, APIConnectionError) as e:
            last_err = e
            time.sleep(2 ** attempt)
        except APIStatusError as e:
            last_err = e
            if 500 <= getattr(e, "status_code", 0) < 600:
                time.sleep(2 ** attempt)
            else:
                raise
    else:
        raise last_err if last_err else RuntimeError("classify_one: exhausted retries")

    if not msg.content:
        raise ValueError("empty response from Claude (stop_reason="
                         f"{getattr(msg, 'stop_reason', '?')})")
    text = msg.content[0].text.strip()
    # Tolerate code fences / stray prose
    if text.startswith("```"):
        text = text.strip("`").lstrip("json").strip()
    try:
        out = json.loads(text)
    except json.JSONDecodeError:
        # last-ditch: find first {...}
        start, end = text.find("{"), text.rfind("}")
        if not (0 <= start < end):
            raise ValueError(f"unparseable LLM response: {text[:200]!r}")
        out = json.loads(text[start:end + 1])
    if not isinstance(out, dict) or not out:
        raise ValueError(f"empty/non-dict LLM response: {text[:200]!r}")

    cat = out.get("category", "기타")
    if cat not in TAXONOMY:
        cat = "기타"
    tags = out.get("tags") or []
    if isinstance(tags, str):
        tags = [tags]
    tags = [str(t).strip() for t in tags][:3]
    return {"category": cat, "tags": tags}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="Re-classify every article")
    ap.add_argument("--limit", type=int, default=None, help="Max articles to process")
    ap.add_argument("--sleep", type=float, default=0.3, help="Delay between API calls")
    args = ap.parse_args()

    data_path = Path(get_data_path(create_dirs=False))
    if not data_path.exists():
        print(f"Data file not found: {data_path}", file=sys.stderr)
        sys.exit(1)

    articles = json.loads(data_path.read_text(encoding="utf-8"))
    client = Anthropic()  # picks up ANTHROPIC_API_KEY

    def needs_classify(a: dict) -> bool:
        if "category" not in a:
            return True
        if a.get("category") in (None, "", "기타") and a.get("category_source") != "llm":
            return True
        return False

    todo = [i for i, a in enumerate(articles) if args.force or needs_classify(a)]
    if args.limit:
        todo = todo[: args.limit]

    print(f"To classify: {len(todo)} / {len(articles)} articles")
    if not todo:
        return

    processed = 0
    for idx in todo:
        a = articles[idx]
        try:
            out = classify_one(client, a["title"], a.get("description", ""))
            a["category"] = out["category"]
            a["tags"] = out["tags"]
            a["category_source"] = "llm"
            processed += 1
            print(f"  [{processed}/{len(todo)}] {out['category']:<14} | {a['title'][:70]}")
        except Exception as e:
            print(f"  ! failed on {a.get('url')}: {e}", file=sys.stderr)
            time.sleep(2)
            continue

        # Save every 25
        if processed % 25 == 0:
            atomic_write_json(data_path, articles)
            print(f"  -- checkpoint saved ({processed} done)")

        time.sleep(args.sleep)

    atomic_write_json(data_path, articles)
    print(f"Done. Saved {data_path}")


if __name__ == "__main__":
    main()
