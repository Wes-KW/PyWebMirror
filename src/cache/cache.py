from __future__ import annotations


class Cache:

	value: bytes

	@staticmethod
	def from_value(value: bytes) -> Cache:
		c = Cache()
		c.value = value
		return c

	@staticmethod
	def from_file(fpath: str) -> Cache:
		c = Cache()
		with open(fpath, "rb") as f:
			c.value = f.read()

		return c

	def get_value(self) -> bytes:
		return self.value
