import sys
import types
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

requests_stub = types.ModuleType('requests')
requests_stub.Session = object
sys.modules.setdefault('requests', requests_stub)

bs4_stub = types.ModuleType('bs4')
bs4_stub.BeautifulSoup = object
sys.modules.setdefault('bs4', bs4_stub)

from scrape_geeknews import extract_title


class FakeElement:
    def __init__(self, text='', selectors=None):
        self.text = text
        self.selectors = selectors or {}

    def select_one(self, selector):
        return self.selectors.get(selector)

    def get_text(self, *args, **kwargs):
        if kwargs.get('strip'):
            return self.text.strip()
        return self.text


class ExtractTitleTest(unittest.TestCase):
    def test_extracts_current_topic_heading_markup(self):
        row = FakeElement(selectors={
            '.topictitle .topic-title-heading': FakeElement(
                ' agentmemory - AI 코딩 에이전트용 영구 메모리 시스템 '
            )
        })

        self.assertEqual(
            extract_title(row),
            'agentmemory - AI 코딩 에이전트용 영구 메모리 시스템',
        )

    def test_falls_back_to_legacy_h1_markup(self):
        row = FakeElement(selectors={
            '.topictitle h1': FakeElement('Legacy GeekNews title')
        })

        self.assertEqual(extract_title(row), 'Legacy GeekNews title')

    def test_skips_placeholder_title_and_uses_next_selector(self):
        row = FakeElement(selectors={
            '.topictitle .topic-title-heading': FakeElement('No Title'),
            '.topictitle a[id^="tr"]': FakeElement('Fallback anchor title'),
        })

        self.assertEqual(extract_title(row), 'Fallback anchor title')

    def test_returns_placeholder_when_no_title_exists(self):
        self.assertEqual(extract_title(FakeElement()), 'No Title')


if __name__ == '__main__':
    unittest.main()
