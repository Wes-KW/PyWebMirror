"""This file contain a HTML modifier class"""


from bs4 import BeautifulSoup as dom
from re import Match, search, sub
from urllib.parse import urlparse
from pywebmirror.modifier.abstract import Modifier
from pywebmirror.modifier.css import CSSModifier
from pywebmirror.modifier.js import JSModifier, JSMODIFIER_MAIN_SCRIPT
from pywebmirror.common.util import remove_quote


class HTMLModifier(Modifier):
    """ A HTML Modifier
    TODO: change common.js -> get_absolute_url such that href of
    TODO: <base> element is considered. <head>
    """

    worker_path: str
    server_url: str
    document: dom

    def __init__(
        self, html: bytes, url: str, main_path: str, worker_path: str, server_url: str,
        encoding: str = "utf-8", allow_url_rules: list[str] = ["^(.*)$"], deny_url_rules: list[str] = []
    ) -> None:
        """Initialize a HTML modifier"""
        self.worker_path = worker_path
        self.server_url = server_url
        self.document = dom(html.decode(encoding), "html.parser")
        super().__init__(url, main_path, encoding, allow_url_rules, deny_url_rules)

    def _add_script(self) -> None:
        """Add script to the html document"""
        if self.document.head is not None:
            script = self.document.new_tag("script")
            script.attrs["type"] = "text/javascript"
            script.attrs["id"] = "pywebmirror"

            m = JSModifier(
                "".encode(self.encoding), self.url, self.path, self.worker_path,
                self.server_url, self.encoding, self.allow_url_rules, self.deny_url_rules
            )

            script.string = m.get_modified_content(JSMODIFIER_MAIN_SCRIPT).decode(self.encoding)
            self.document.head.insert(0, script)

    def get_modified_content(self) -> bytes:
        """Return a tuple of html content bytes and encoding"""
        self._add_script()
        return str(self.document).encode(self.encoding)
