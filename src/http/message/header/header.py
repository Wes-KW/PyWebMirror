from __future__ import annotations
from typing import Optional


class Header:

	value: Optional[str]

	def __init__(self) -> None:
		self.value = None

	@staticmethod
	def from_attributes(value: str) -> Header:
		h = Header()
		h.value = value
		return h

	@staticmethod
	def from_string(text: str) -> Header:
		return Header.from_attributes(text)

	def __str__(self):
		if not self.value:
			return ""

		return self.value
