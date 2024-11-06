from __future__ import annotations
from typing import Union, Any
from datetime import datetime, timezone
from header import Header
from attrmap import AttrMap


STR_INT_BOOL = Union[str, int, bool]
EXPIRES_FMT = "%a, %d %b %Y %H:%M:%S GMT"
ATTRMAP = AttrMap({
	"domain", "expires", "httponly", "max-age",
	"partitioned", "path", "samesite", "secure"
})


class Cookie(Header):
	"""Cookie

	Instance Attribtues:
		- domain: the domain that has access to the cookie
		- expires: the time after which the cookie will be invalid
		- httponly: whether the cookie can be accessed by JavaScript
		- max_age: maximum time (in second) the cookie will be valid
		- partitioned: whether the cookie needs to be stored using partioned storage
		- path: the path that has access to the cookie
		- samesite: whether the cookie is only accessible from the same site
		- secure: whether only sites using https has access to the cookie
	"""

	def __init__(self) -> None:
		super().__init__()
		self.expires_obj = None
		self.ckey = None
		self.cvalue = None

		for key in ATTRMAP.internal_attributes:
			self.__setattr__(key, None)

	@staticmethod
	def from_attributes(key: str, value: str, **attrs: STR_INT_BOOL) -> Cookie:
		c = Cookie()
		c.ckey = key
		c.cvalue = value

		for key in attrs:
			if key in ATTRMAP.internal_attributes:
				c.__setattr__(key, attrs[key])

		return c

	@staticmethod
	def from_attributes_expire_after(key: str, value: str, expires_in_sec: int, **attrs: Any) -> Cookie:
		c = Cookie.from_attributes(key, value, **attrs)

		now = datetime.now(timezone.utc)
		timestamp = now.timestamp() + expires_in_sec
		c.expires_obj = datetime.fromtimestamp(timestamp)
		c.expires = c.expires_obj.strftime(EXPIRES_FMT)
		c.max_age = expires_in_sec

		return c

	@staticmethod
	def from_string(text: str) -> Cookie:
		c = Cookie()
		keyvals = text.split(";")
		for keyval in keyvals:
			c.set_keyvalue(keyval.strip())

		return c

	def getattr(self, key: str) -> STR_INT_BOOL:
		if key in ATTRMAP.reference_attributes:
			return self.__getattribute__(ATTRMAP.to_internal(key))
		
		raise KeyError()

	def get_keyvalue(self, key: str) -> str:
		value = self.getattr(key)
		if value:
			if type(value) is bool:
				return f"{key}; "

			return f"{key}={value}; "

		return ""

	def setattr(self, key: str, value: STR_INT_BOOL) -> None:
		lower_key = key.lower()
		if lower_key in ATTRMAP.reference_attributes:

			if lower_key in {"httponly", "secure", "partitioned"}:
				if value is None:
					value = True

				value = bool(value)
			elif value is None:
				raise ValueError(f"Value of `{lower_key}` cannot be null.")

			match lower_key:
				case "expires":
					self.expires = value
					self.expires_obj = datetime.strptime(value, EXPIRES_FMT)
				case "max-age":
					self.max_age = int(value)
				case _:
					self.__setattr__(ATTRMAP.to_internal(lower_key), value)

		elif key != "":
			self.ckey = key
			self.cvalue = value
		else:
			raise KeyError()

	def set_keyvalue(self, keyval: str) -> None:
		keyval = keyval.split("=", 2)
		key = keyval[0].strip()
		value = None

		if len(keyval) == 2:
			value = keyval[1].strip()

		if key:
			self.setattr(key, value)

	def __str__(self) -> str:
		if not self.ckey:
			return ""

		text = f"{self.ckey}={self.cvalue}; "
		for key in ATTRMAP.reference_attributes:
			text += self.get_keyvalue(key)

		return text[0:len(text) - 2]

	def __contains__(self, key: str) -> bool:
		key = key.lower()
		if key in ATTRMAP.reference_attributes:
			return self.getattr(key) is not None

		return False
