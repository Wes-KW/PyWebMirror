import sys
sys.path.append("./src/http/message/header/")

from cookie import Cookie


def test_cookie_init_with_nothing():
	c = Cookie()
	items = {
		"ckey", "cvalue", "expires", "domain", "path", "httponly",
		"secure", "max_age", "partitioned", "samesite", "secure"
	}
	assert all(c.__getattribute__(item) is None for item in items)


def test_cookie_init_with_attributes():
	c = Cookie.from_attributes("a", "b", domain="me.v", httponly=True)
	assert c.ckey == "a" and c.cvalue == "b" and c.domain == "me.v" and c.httponly == True


def test_cookie_init_with_attributes_and_expire_after_20_seconds():
	c = Cookie.from_attributes_expire_after("a", "b", 20)
	assert c.ckey == "a" and c.cvalue == "b" and c.max_age == 20


def test_cookie_init_with_cookie_text():
	c = Cookie.from_string("sessionId=38afes7a8; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/; Domain=me.v; ")
	assert c.ckey == "sessionId" and c.cvalue == "38afes7a8"
	assert c.path == "/" and c.domain == "me.v"
	assert round(c.expires_obj.timestamp()) == 1445412480


def test_cookie_to_text_empty():
	c = Cookie()
	assert str(c) == ""


def test_cookie_to_text_simple():
	c = Cookie.from_attributes("nice", "ok", secure=True)
	assert str(c) == "nice=ok; secure"


def test_cookie_to_text_complex():
	c = Cookie.from_string("id=a3fWa; max-age=2592000")
	assert str(c) == "id=a3fWa; max-age=2592000"


def test_cookie_contain_simple():
	c = Cookie.from_string("id=a3fWa; max-age=2592000")
	assert "Max-Age" in c and "id" not in c


def test_cookie_contain_complex():
	c = Cookie.from_string("ddaaa.cc2=1123331; Secure; Partitioned")
	assert "Secure" in c and "Partitioned" in c
