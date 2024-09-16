from mitmproxy import http

"""
Select which responses should be streamed.

Enable response streaming for all HTTP flows.
This is equivalent to passing `--set stream_large_bodies=1` to mitmproxy.
"""


def request(flow: http.HTTPFlow):
    """
    Enables streaming for all responses.
    This is equivalent to passing `--set stream_large_bodies=1` to mitmproxy.
    """
    flow.request.url = "http://me.v:8080/main/" + flow.request.pretty_url
