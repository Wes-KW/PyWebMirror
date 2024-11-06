import sys
sys.path.append("./src/cache/")

from cache import Cache

def test_raw():
	c = Cache.from_value(b"123")
	assert c.get_value() == b"123"


def test_file():
	fpath = "/proc/cpuinfo"
	c = Cache.from_file(fpath)
	with open(fpath, "rb") as f:
		assert c.get_value() == f.read()
