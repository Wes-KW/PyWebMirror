# PyWebMirror

PyWebMirror is a python based server that proxies http/https request.

## Dependencies
- Curl
- OpenSSL
- Python 3.5+ and dependencies listed in [requirements.txt](https://github.com/Wes-KW/PyWebMirror/blob/main/requirements.txt)

## Getting Started

1. Make sure you have installed all [dependencies](#dependencies)

2. Install PyWebMirror
```shell
python3 -m pip install pywebmirror
```

3. Save the [configuration file](https://github.com/Wes-KW/PyWebMirror/blob/main/config.json) into `~/.config/pywebmirror/pywebmirror.json`

4. Start pywebmirror
```shell
python3 -m pywebmirror
```

5. Navigate to `{base_url}{website_url}` in any browser where `{base_url}` equals to `{server.scheme}://{server.name}:{server.port}/main/`.

For example, if your server scheme is `http`, name is `localhost`, port is `8080`, and you want to navigate to `google.com`, type `http://localhost:8080/main/https://www.google.com` in the browser.

## Documentation
Will be created soon 😀
