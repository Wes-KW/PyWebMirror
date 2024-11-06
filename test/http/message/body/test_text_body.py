import sys
sys.path.append("./src/http/message/body/")

from textBody import TextBody


def test_original():
	i = "<!DOCTYPE html><html></html>"
	b = TextBody.from_original_value("gzip", "utf-8", i)
	assert b.to_original_value() == i


def test_raw():
	i = "<!DOCTYPE html><html></html>"
	encoding = "iso-8859-1"
	b = TextBody.from_original_value("", encoding, i)
	assert b.to_raw_value() == i.encode(encoding)
