// init.window

var update_window = function update_window(ref_window, window) {
    for (var i = 0; i < ref_window.length; i++) {
        (function(i){
            set_property(window, i, {
                value: get_proxied_window(ref_window[i])
            }, ref_window);
        })(i);
    }
}

var wrap_window = function wrap_window(ref_window, window) {
    // update window
    update_window(ref_window, window);

    // ## self & frames & globalThis
    var properties = ["self", "frames", "globalThis"];
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        (function(property){
            set_property(window, property, {
                get: function(){
                    return window;
                },
                set: function(){
                    return set_property(window, property, {
                        enumerable: true,
                        writable: true,
                        configurable: true,
                        value: slice_args(arguments)[0]
                    });
                }
            }, ref_window);
        })(property);
    }

    // ## location
    var _location = ref_window.location;
    var location = get_cobj(_location, wrap_location);
    set_property(web_obj, "location", {
        get: function(){
            return location;
        },
        set: function(){
            return location.assign(slice_args(arguments)[0]);
        }
    }, ref_web_obj);

    // # origin
    if (ref_web_obj.origin){
        set_property(web_obj, "origin", {
            get: function() {
                return location.origin;
            },
            set: function() {
                return set_property(web_obj, "origin", {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: slice_args(arguments)[0]
                });
            }
        }, ref_web_obj);
    }

    // TODO: If the current window url is "about:blank",
    // TODO: inherit the location from the closest ancestor
    // TODO: where url is not "about:blank".
    // TODO: _location = ...

    // fetch
    if (ref_web_obj.fetch){
        var wrap_response = function wrap_response(ref_response, response) {
            set_property(response, "url", {
                get: function(){
                    return get_original_url(ref_response.url);
                }
            }, ref_response);

            wrap_obj(ref_response, response);
        }

        set_property(web_obj, "fetch", {
            value: function(){
                var args = slice_args(arguments);
                args[0] = get_requested_url(args[0], _location.href);
                return ref_web_obj.fetch.apply(ref_web_obj, args).then(function(response){
                    return get_cobj(response, wrap_response);
                });
            }
        }, ref_web_obj);
    }

    // Request
    if (ref_web_obj.Request){
        var Request = function Request() {
            class_call_check(this, Request);
            var args = [null];
            args.concat(slice_args(arguments));
            args[1] = get_requested_url(args[1], _location.href);
            var request = new (Function.bind.apply(ref_web_obj.Request, args));
            wrap_obj(request, this);
        }

        set_property(web_obj, "Request", {
            value: Request
        }, ref_web_obj);
    }

    // Worker
    if (ref_web_obj.Worker){
        var Worker = function Worker() {
            class_call_check(this, Worker);
            var args = [null];
            args.concat(slice_args(arguments));
            args[1] = get_requested_url(args[1], _location.href);
            var worker = new (Function.bind.apply(ref_web_obj.Worker, args));
            wrap_event_target(worker, this);
        }

        set_property(web_obj, "Worker", {
            value: Worker
        }, ref_web_obj);
    }

    // Shared Worker
    if (ref_web_obj.SharedWorker){
        var SharedWorker = function SharedWorker() {
            class_call_check(this, SharedWorker);
            var args = [null];
            args.concat(slice_args(arguments));
            args[1] = get_requested_url(args[1], _location.href);
            var shared_worker = new (Function.bind.apply(ref_web_obj.SharedWorker, args));
            wrap_event_target(shared_worker, this);
        }

        set_property(web_obj, "SharedWorker", {
            value: SharedWorker
        }, ref_web_obj);
    }

    // ## window
    set_property(window, "window", {
        get: function(){
            return window;
        }
    }, ref_window);

    // ## top
    set_property(window, "top", {
        get: function(){
            return get_proxied_window(ref_window.top);
        }
    }, ref_window);

    // ## parent
    set_property(window, "parent", {
        get: function(){
            return get_proxied_window(ref_window.parent);
        },
        set: function(){
            return set_property(window, property, {
                enumerable: true,
                writable: true,
                configurable: true,
                value: slice_args(arguments)[0]
            });
        }
    }, ref_window);

    // ## XMLHttpRequest
    var XMLHttpRequest = function XMLHttpRequest() {
        class_call_check(this, XMLHttpRequest);
        var xhr = new ref_window.XMLHttpRequest();
        set_property(this, "open", {
            value: function() {
                var args = slice_args(arguments);
                args[1] = get_requested_url(args[1], _location.href);
                return xhr.open.apply(xhr, args);
            }
        }, xhr);

        set_property(this, "responseXML", {
            get: function() {
                return get_cobj(xhr.responseXML, wrap_document);
            }
        }, xhr);

        wrap_event_target(xhr, this);
    }

    set_property(window, "XMLHttpRequest", {
        value: XMLHttpRequest
    }, ref_window);

    // ## Document
    var Document = function Document() {
        class_call_check(this, Document);
        var document = new ref_window.Document();
        wrap_node(document, this);
    }

    set_property(window, "Document", {
        value: Document
    }, ref_window);

    // ## Document Fragment
    var DocumentFragment = function DocumentFragment() {
        class_call_check(this, DocumentFragment);
        var document_fragment = new ref_window.DocumentFragment();
        wrap_node(document_fragment, this);
    }

    set_property(window, "DocumentFragment", {
        value: DocumentFragment
    }, ref_window);

    // ## DOMs
    var properties = ["document", "frameElement"];
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        (function(property){
            set_node_property(ref_window, window, property, false);
        })(property);
    }

    // ## history
    var wrap_history = function wrap_history(ref_obj, obj) {
        var properties = ["replaceState", "pushState"];

        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            (function(property){
                set_property(obj, property, {
                    value: function(){
                        var args = slice_args(arguments);
                        args[0] = get_requested_url(args[0], _location.href);
                        return ref_obj[property].apply(property, args);
                    }
                }, ref_obj);
            })(property);
        }

        wrap_obj(ref_obj, obj);
    }

    set_property(window, "history", {
        get: function() {
            return get_cobj(ref_window.history, wrap_history);
        }
    }, ref_window);

    // ## navigator & clientInformation
    var wrap_navigator = function wrap_navigator(ref_nav, nav) {
        if (ref_nav.sendBeacon) {
            set_property(nav, "sendBeacon", {
                value: function() {
                    var args = slice_args(arguments);
                    args[0] = get_requested_url(args[0], _location.href);
                    return ref_nav.sendBeacon.apply(ref_nav, args);
                }
            }, ref_nav);
        }

        if (ref_nav.serviceWorker) {
            var wrap_sw = function wrap_sw(ref_sw, sw) {
                // ### scriptURL
                set_property(sw, "scriptURL", {
                    get: function(){
                        return get_original_url(ref_sw.scriptURL);
                    }
                }, ref_sw);
            
                wrap_event_target(ref_sw, sw);
            }

            var wrap_sw_container = function wrap_sw_container(ref_sw_container, sw_container) {
                // ## register
                set_property(sw_container, "register", {
                    value: function() {
                        var args = slice_args(arguments);
                        args[0] = get_requested_url(args[0], _location.href);
                        if (args[1] && args[1].scope) {
                            args[1].scope = get_requested_url(args[1].scope, _location.href);
                        }
                        return ref_sw_container.register.apply(ref_sw_container, args);
                    }
                }, ref_sw_container);
            
                var wrap_sw_reg = function wrap_sw_reg(ref_sw_reg, sw_reg) {
                    var properties = ["installing", "waiting", "active"];
                    for (var i = 0; i < properties.length; i++){
                        var property = properties[i];
                        (function(property){
                            set_property(sw_reg, property, {
                                get: function(){
                                    return get_cobj(ref_sw_reg[property], wrap_sw);
                                }
                            }, ref_sw_reg);
                        })(property);
                    }
                
                    set_property(sw_reg, "scope", {
                        get: function() {
                            return get_original_url(ref_sw_reg.scope);
                        }
                    }, ref_sw_reg);

                    wrap_event_target(ref_sw_reg, sw_reg);
                }
            
                // ## controller
                set_property(sw_container, "controller", {
                    get: function() {
                        get_cobj(ref_sw_container.controller, wrap_sw);
                    }
                }, ref_sw_container);
            
                // ## ready
                set_property(sw_container, "ready", {
                    get: function() {
                        return ref_sw_container.ready.then(function(reg){
                            return get_cobj(reg, wrap_sw_reg);
                        });
                    }
                }, ref_sw_container);
            
                // ## getRegistration
                set_property(sw_container, "getRegistration", {
                    value: function() {
                        var args = slice_args(arguments);
                        args[0] = get_requested_url(args[0], _location.href);
                        return ref_sw_container.getRegistration.apply(ref_sw_container, args).then(function(reg){
                            return get_cobj(reg, wrap_sw_reg);
                        });
                    }
                }, ref_sw_container);
            
                // ## getRegistrations
                set_property(sw_container, "getRegistrations", {
                    value: function() {
                        return ref_sw_container.getRegistrations.apply(ref_sw_container).then(function(regs){
                            var new_regs = [];
                            for (var i = 0; i < regs.length; i++) {
                                new_regs[i] = get_cobj(regs[i], wrap_sw_reg);
                            }
                            return new_regs;
                        });
                    }
                }, ref_sw_container);

                wrap_event_target(ref_sw_container, sw_container);
            }

            set_property(nav, "serviceWorker", {
                get: function() {
                    return get_cobj(ref_nav.serviceWorker, wrap_sw_container);
                }
            }, ref_nav);
        }

        wrap_obj(ref_nav, nav);
    }

    set_property(window, "navigator", {
        get: function() {
            return get_cobj(ref_window.navigator, wrap_navigator);
        }
    }, ref_window);

    if (ref_window.clientInformation) {
        set_property(window, "clientInformation", {
            get: function() {
                return get_cobj(ref_window.clientInformation, wrap_navigator);
            },
            set: function() {
                return set_property(window, "clientInformation", {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: slice_args(arguments)[0]
                });
            }
        }, ref_window);
    }

    // ## trustedTypes
    var wrap_trusted_types = function wrap_trusted_types(ref_ttypes, ttypes) {
        var wrap_trusted_types_policy = function wrap_trusted_types_policy(ref_ttp, ttp) {
            set_property(ttp, "createScriptURL", {
                value: function() {
                    var args = slice_args(arguments);
                    args[0] = get_requested_url(args[0], _location.href);
                    return ref_ttp.createScriptURL.apply(ref_ttp, args);
                }
            }, ref_ttp);

            wrap_obj(ref_ttp, ttp);
        }

        set_property(ttypes, "createPolicy", {
            value: function() {
                return get_cobj(
                    ref_ttypes.createPolicy(slice_args(arguments)),
                    wrap_trusted_types_policy
                );
            }
        }, ref_ttypes);

        wrap_obj(ref_ttypes, ttypes);
    }

    set_property(window, "trustedTypes", {
        get: function() {
            return get_cobj(ref_window.trustedTypes, wrap_trusted_types);
        }
    }, ref_window);

    // open
    set_property(window, "open", {
        value: function() {
            var args = slice_args(arguments);
            args[0] = get_requested_url(args[0], _location.href);
            return get_proxied_window(ref_window.open.apply(ref_window, args));
        }
    }, ref_window);

    wrap_event_target(ref_window, window);
}

var get_proxied_window = function get_proxied_window(_window) {
    try {
        var wrapped = _window.pywebmirror;
        var addr = _window.location.href;
        if (wrapped instanceof _window.constructor) {
            return wrapped;
        } else if (get_original_url(addr) !== addr || addr === "about:blank") {
            var window = create_proto_as(_window);
            wrap_window(_window, window);
            _window.pywebmirror = window;
            return window;
        } else {
            return _window;
        }
    } catch {} finally {
        return _window;
    }
}

get_proxied_window(window);
