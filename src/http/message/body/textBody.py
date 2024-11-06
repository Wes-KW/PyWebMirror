from __future__ import annotations
from byteBody import ByteBody

class TextBody(ByteBody):

	encoding: str

	def __init__(self, compress_method: str, encoding: str) -> None:
		super().__init__(compress_method)
		self.encoding = encoding

	@staticmethod
	def from_original_value(compress_method: str, encoding: str, original: str) -> TextBody:
		t = TextBody(compress_method, encoding)
		t.value = ByteBody.compress(t.compress_method, original.encode(encoding))
		return t

	@staticmethod
	def from_raw_value(compress_method: str, encoding: str, raw: bytes) -> TextBody:
		t = TextBody(compress_method, encoding)
		t.value = raw
		return t

	def to_original_value(self) -> str:
		return super().to_original_value().decode(self.encoding)

	def to_raw_value(self) -> str:
		return super().to_raw_value()
