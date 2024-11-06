import sys
sys.path.append("./src/http/message/body/")

from byteBody import ByteBody

def test_original_gzip():
	b = ByteBody.from_original_value("gzip", b"abc")
	assert b.to_original_value() == b"abc"


def test_original_deflate():
	b = ByteBody.from_original_value("deflate", b"abc")
	assert b.to_original_value() == b"abc"


def test_original_zstd():
	b = ByteBody.from_original_value("zstd", b"abc")
	assert b.to_original_value() == b"abc"


def test_original_br():
	b = ByteBody.from_original_value("br", b"abc")
	assert b.to_original_value() == b"abc"


def test_raw_gzip():
	b = ByteBody.from_original_value("gzip", b"abc")
	assert b.to_raw_value() == ByteBody.compress("gzip", b"abc")


def test_raw_no_method():
	b = ByteBody.from_original_value("", b"abc")
	assert b.to_raw_value() == b"abc"
