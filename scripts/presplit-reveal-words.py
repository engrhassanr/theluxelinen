#!/usr/bin/env python3
"""Pre-split [data-reveal-words] text into .reveal-word spans (Framer SSR parity)."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TAG_PATTERN = re.compile(
    r"<(?P<tag>h1|h2|p)\b(?P<attrs>[^>]*\bdata-reveal-words[^>]*)>(?P<body>.*?)</(?P=tag)>",
    re.DOTALL | re.IGNORECASE,
)


def split_text_nodes(content: str) -> str:
    if "reveal-word" in content:
        return content.strip()
    if re.search(r"<[a-zA-Z]", content):
        return content.strip()

    def replacer(match: re.Match[str]) -> str:
        text = match.group(0)
        parts = re.split(r"(\s+)", text)
        out: list[str] = []
        for part in parts:
            if not part:
                continue
            if re.match(r"^\s+$", part):
                out.append(part)
            else:
                out.append(f'<span class="reveal-word">{part}</span>')
        return "".join(out)

    return re.sub(r"[^<]+", replacer, content.strip())


def ensure_words_split_attr(attrs: str) -> str:
    if "data-words-split" in attrs:
        return attrs
    return f'{attrs} data-words-split="true"'


def process_html(html: str) -> str:
    def replacer(match: re.Match[str]) -> str:
        tag = match.group("tag")
        attrs = ensure_words_split_attr(match.group("attrs"))
        body = match.group("body")

        if "reveal-word" in body:
            return f"<{tag}{attrs}>{body}</{tag}>"

        split_body = split_text_nodes(body)
        if "\n" in body:
            indent = re.search(r"\n(\s*)\S", body)
            pad = indent.group(1) if indent else "            "
            return f"<{tag}{attrs}>\n{pad}{split_body}\n{pad.rstrip()}</{tag}>"

        return f"<{tag}{attrs}>{split_body}</{tag}>"

    return TAG_PATTERN.sub(replacer, html)


def main() -> None:
    for path in sorted(ROOT.rglob("*.html")):
        text = path.read_text(encoding="utf-8")
        updated = process_html(text)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            print(f"Updated {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
