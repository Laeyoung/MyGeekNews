"""Shared utilities for GeekNews scraper and backfill scripts."""

import os
import re


DEFAULT_DATA_PATH = os.path.join('data', 'geeknews_my_upvotes.json')


def parse_env_file(path='.env'):
    """Read key=value pairs from an env file."""
    creds = {}
    if os.path.exists(path):
        with open(path, 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    creds[key] = value
    return creds


def get_data_path(override=None, create_dirs=False):
    """Resolve the data file path from override, .env, or default.

    Args:
        override: Explicit path to use (skips .env lookup).
        create_dirs: If True, create parent directories if they don't exist.
    """
    if override:
        path = override
    else:
        creds = parse_env_file()
        custom_path = creds.get('GEEKNEWS_DATA_PATH')

        if custom_path and (custom_path.startswith('http://') or custom_path.startswith('https://')):
            print(f"WARNING: GEEKNEWS_DATA_PATH is a URL ({custom_path}). Cannot write to a URL.")
            print(f"Falling back to default local path '{DEFAULT_DATA_PATH}'.")
            path = DEFAULT_DATA_PATH
        elif custom_path:
            path = custom_path if os.path.isabs(custom_path) else os.path.join(os.getcwd(), custom_path)
        else:
            path = DEFAULT_DATA_PATH

    if create_dirs:
        parent = os.path.dirname(os.path.abspath(path))
        os.makedirs(parent, exist_ok=True)

    return path


def extract_topic_id(url):
    """Extract topic ID from a GeekNews URL like https://news.hada.io/topic?id=5000"""
    m = re.search(r'id=(\d+)', url)
    return int(m.group(1)) if m else None
