// window.wrapper.js

const get_proxied_window = function(_window) {
    try{
        if ("__env__" in _window) {
            return _window["__env__"];
        } else {
            return _window;
        }
    } catch {
        return _window;
    }
}

const create_proxied_document = function(window, _document) {
    const document = {};
    create_proxied_event_object(_document, ["location", "documentURI"], document);

    let location = window.location;
    set_obj_prop_desc(document, "location", {
        enumerable: true,
        configurable: false,
        get: function() {
            return location;
        },
        set: function(value) {
            return location = value;
        }
    });

    set_obj_prop_desc(document, "documentURI", {
        enumerable: true,
        configurable: true,
        get: function() {
            return location.href;
        },
    });

    set_obj_prop_desc(document.documentElement, "parentNode", {
        enumerable: true,
        configurable: true,
        get: function(){
            return document;
        },
    });
    return document;
}

const create_proxied_window = function(_window) {
    const window = {};
    const extra_overwrite = [
        "window", "self", "parent", "top", "open",
        "document", "DOMParser", "navigator", "history",
        "SharedWorker"
    ];

    const func_reg = {};

    create_proxied_web_object(_window, extra_overwrite, window);

    // # window
    proxy_prop(_window, window, "window", _window, window, func_reg);

    // # self
    proxy_prop(_window, window, "self", _window, window, func_reg);

    // # parent, top
    for (let item of ["parent", "top"]) {
        if (_window[item] === _window.self) {
            proxy_prop(_window, window, item, _window, window, func_reg);
        } else {
            proxy_prop(_window, window, item, _window[item], get_proxied_window(_window[item]), func_reg);
        }
    }

    // # open
    let _open = get_obj_prop_desc(_window, "open").value;
    set_obj_prop_desc(window, "open", {
        writable: true,
        enumerable: true,
        configurable: true,
        value: function() {
            let args = slice_args(arguments);
            args[0] = get_requested_url(args[0], web_default_path, _window);
            _open.apply(_window, _open);
        }
    });

    // # document
    let document = create_proxied_document(window, _window.document);
    set_obj_prop_desc(window, "document", {
        enumerable: true,
        configurable: false,
        get: function() {
            return document;
        }
    });

    // # DOMParser
    let _DOMParser = _window.DOMParser;
    if (_DOMParser) {
        let DOMParser = function(){
            set_obj_prop_desc(this, "_", {
                writable: false,
                enumerable: false,
                configurable: false,
                value: new _DOMParser()
            });
            create_proxied_event_object(this._, [""], this);
        }
    }
}