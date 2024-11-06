from __future__ import annotations
import zlib
import brotli
import zstd

class ByteBody:

	value: bytes
	compress_method: str

	def __init__(self, compress_method: str):
		self.compress_method = compress_method.lower()

	@staticmethod
	def from_original_value(compress_method: str, original: bytes) -> ByteBody:
		b = ByteBody(compress_method)
		b.value = ByteBody.compress(b.compress_method, original)
		return b

	@staticmethod
	def from_raw_value(compress_method: str, raw: bytes) -> ByteBody:
		b = ByteBody(compress_method)
		b.value = raw
		return b

	@staticmethod
	def decompress(compress_method: str, value: bytes) -> bytes:
		match compress_method:
			case "gzip":
				return zlib.decompress(value, 16 + zlib.MAX_WBITS)
			case "deflate":
				return zlib.decompress(value, -zlib.MAX_WBITS)
			case "br":
				return brotli.decompress(value)
			case "zstd":
				return zstd.decompress(value)
			case _:
				return value

	@staticmethod
	def compress(compress_method: str, value: bytes) -> bytes:
		match compress_method:
			case "gzip":
				return zlib.compress(value, zlib.DEFLATED, 16 + zlib.MAX_WBITS)
			case "deflate":
				return zlib.compress(value, zlib.DEFLATED, -zlib.MAX_WBITS)
			case "br":
				return brotli.compress(value)
			case "zstd":
				return zstd.compress(value)
			case _:
				return value

	def to_original_value(self) -> bytes:
		return ByteBody.decompress(self.compress_method, self.value)

	def to_raw_value(self) -> bytes:
		return self.value
