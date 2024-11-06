from __future__ import annotations
from typing import Union
from header import Header
from attrmap import AttrMap


STR_INT_BOOL = Union[str, int, bool]
ATTRMAP = AttrMap({
	"default-src", "script-src", "style-src", "img-src", "connect-src", 
	"font-src", "object-src", "media-src", "frame-src", "sandbox", "report-uri",
	"child-src", "form-action", "frame-ancestor", "plugin-types", "base-uri",
	"report-to", "worker-src", "manifest-src", "prefetch-src", "navigate-to",
	"require-trusted-types-for", "trusted-types", "upgrade-insecure-requests",
	"block-all-mixed-content"
})


class CSP(Header):
	"""CSP: Content Security Policy

	Instance Attributes:
		default-src, script-src, style-src, img-src, connect-src, 
		font-src, object-src, media-src, frame-src, sandbox, report-uri,
		child-src, form-action, frame-ancestor, plugin-types, base-uri,
		report-to, worker-src, manifest-src, prefetch-src, navigate-to,
		require-trusted-types-for, trusted-types, upgrade-insecure-requests,
		block-all-mixed-content

	NOTE: All instance attributes are sets of strings
	"""

	def __init__(self):
		super().__init__()
		for key in ATTRMAP.internal_attributes:
			self.__setattr__(key, None)

	@staticmethod
	def from_attributes(**attrs: set[str]) -> CSP:
		c = CSP()
		
		for key in attrs:
			if key in ATTRMAP.internal_attributes:
				c.__setattr__(key, attrs[key])

	@staticmethod
	def from_string(text: str) -> CSP:
		c = CSP()
		keyvals = text.split(";")
		for keyval in keyvals:
			c.set_keyvalue(keyval.strip())
		
		return c

	def getattr(self, key: str) -> STR_INT_BOOL:
		if key in ATTRMAP.reference_attributes:
			return self.__getattribute__(ATTRMAP.to_internal(key))
		
		raise KeyError()

	def get_keyvalue(self, key: str) -> str:
		value = self.getattr(ATTRMAP.to_internal(key))
		if value:
			return f"{key} {" ".join(self.value)}; "

		return ""

	def setattr(self, key: str, value: str) -> None:
		key = key.lower()
		if key in ATTRMAP.reference_attributes:

			values = set(value.split())
			for val in values:
				if not val:
					values.remove(val)

			self.__setattr__(ATTRMAP.to_internal(key), values)
		else:
			raise KeyError()

	def set_keyvalue(self, keyval: str) -> None:
		keyval = keyval.split(" ", 2)
		key = keyval[0]
		value = None
		if len(keyval) == 2:
			value = keyval[1]

		self.setattr(key, value)

	def __str__(self) -> str:
		text = ""
		for key in ATTRMAP.reference_attributes:
			text += self.get_keyvalue(key)
		
		return text[0:len(text) - 2]

	def __contains__(self, key: str) -> bool:
		key = key.lower()
		if key in ATTRMAP.reference_attributes:
			return self.getattr(key) is not None

		return False
