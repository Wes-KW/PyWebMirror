import sys
sys.path.append("./src/http/message/header/")

from header import Header


def test_header_init_with_nothing():
	h = Header()
	assert h.value is None


def test_header_init_with_header_text():
	h = Header.from_string("123")
	assert h.value == "123"


def test_header_to_text():
	h = Header.from_string("123")
	assert str(h) == "123"
