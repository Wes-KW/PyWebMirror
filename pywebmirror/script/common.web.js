// common.web.js

const shallow_copy = function(top, ref_obj, overwrite, obj) {
    const func_reg = {};

    // create pointers to reference object
    let keys = get_obj_props(ref_obj, overwrite);
    for (let key of keys) {
        if (overwrite.includes(key) || key in obj) {
            continue;
        }
        let desc = get_obj_prop_desc(ref_obj, key);
        if (desc.get){
            let _desc_get = desc.get;
            desc.get = function(){
                if (key in func_reg && typeof func_reg[key] === "function"){
                    return func_reg[key];
                } else {
                    return _desc_get.apply(top);
                }
            }
        }
        if (desc.set){
            let _desc_set = desc.set;
            desc.set = function(value){
                if (typeof value === "function"){
                    func_reg[key] = value;
                    value = this.__execute__.bind(this, value);
                }
                return _desc_set.apply(top, [value]);
            }
        }

        if ("value" in desc) {
            if (typeof desc.value === "function"){
                if ("prototype" in desc.value === false) {
                    let _desc_value = desc.value
                    desc.value = _desc_value.bind(top);
                }
            } else {
                desc.get = function(){
                    return top[key];
                }
                if (desc.writable === true) {
                    desc.set = function(value) {
                        return top[key] = value;
                    }
                }
                delete desc.writable;
                delete desc.value;
            }
        }

        set_obj_prop_desc(obj, key, desc);
    }
}

const deep_copy = function(top, ref_constructor, overwrite, obj) {
    if (get_proto(ref_constructor) !== get_proto(Object)) {
        deep_copy(top, get_proto(ref_constructor), overwrite, obj);
    }

    shallow_copy(top, ref_constructor.prototype, overwrite, obj);
}

const create_env_eval = function(obj) {
    // ## execute script in the current environment
    set_obj_prop_desc(obj, "__execute__", {
        writable: false,
        enumerable: false,
        configurable: false,
        value: function(func) {
            /*
                call ```
                    obj.__execute__(function(ref_obj)){
                        // To expose properties in ref_obj, write
                        //    `const example_property = ref_obj.example_property;`

                        // Then run other script in the current window environment
                        ...
                    }
                ```
            */
            if (typeof func !== "function"){
                throw new TypeError(`${typeof func} is not callable`);
            }
        
            func.apply(this, [this]);
        }
    });
}

const create_proxied_object = function(ref_obj, overwrite, obj) {
    shallow_copy(ref_obj, ref_obj, overwrite, obj);
    deep_copy(ref_obj, ref_obj.constructor, overwrite, obj);
    create_env_eval(obj);
}

const create_proxied_event_object = function(ref_obj, extra_overwrite, obj) {
    let overwrite = ["addEventListner", "removeEventListener", "dispatchEvent"];
    overwrite.push.apply(overwrite, extra_overwrite);
    create_proxied_object(ref_obj, overwrite, obj);

    // # EventTarget.[[property]]
    const func_mappings = [];

    let FuncMapping = function(func, proxied_func) {
        this.func = func;
        this.proxied_func = proxied_func;
    }

    const add_func_mapping = function(func, proxied_func){
        func_mappings.push(new FuncMapping(func, proxied_func));
    }

    const get_func_mapping = function(func){
        let temp_func_mappings = [];

        const push_back = function() {
            while (temp_func_mappings.length > 0) {
                func_mappings.push(temp_func_mappings.pop());
            }
        }

        while (func_mappings.length > 0) {
            let func_mapping = func_mappings.pop();
            if (func_mapping.func === func) {
                push_back(temp_func_mappings);
                return func_mapping.proxied_func;
            } else if (func_mapping.proxied_func === func) {
                push_back(temp_func_mappings);
                return func_mapping.func;
            } else {
                temp_func_mappings.push(func_mapping);
            }
        }
        push_back(temp_func_mappings);
        return null;
    }

    // ## addEventListener
    let addEventListener = ref_obj.addEventListener;
    if (typeof addEventListener === "function") {
        Object.defineProperty(obj, "addEventListener", {
            writable: true,
            enumerable: true,
            configurable: true,
            value: function(){
                let args = slice_args(arguments);
                let new_func = obj.__execute__.bind(obj, args[1]);
                add_func_mapping(args[1], new_func);
                args[1] = new_func;
                addEventListener.apply(ref_obj, args);
            }
        });    
    }
    
    // ## removeEventListener
    let removeEventListener = ref_obj.removeEventListener;
    if (typeof removeEventListener === "function") {
        Object.defineProperty(obj, "removeEventListener", {
            writable: true,
            enumerable: true,
            configurable: true,
            value: function(){
                let args = slice_args(arguments);
                let proxied_func = get_func_mapping(args[1]);
                args[1] = proxied_func;
                removeEventListener.apply(ref_obj, args);
            }
        });
    }

    // ## dispatchEvent
    let dispatchEvent = ref_obj.dispatchEvent;
    if (typeof dispatchEvent === "function") {
        Object.defineProperty(obj, "dispatchEvent", {
            writable: true,
            enumerable: true,
            configurable: true,
            value: function(){
                let args = slice_args(arguments);
                dispatchEvent.apply(ref_obj, args);
            }
        });
    }
}

const create_proxied_web_object = function(ref_web_obj, extra_overwrite, obj) {
    let overwrite = ["location" , "origin", "XMLHttpRequest", "Request", "fetch", "Worker"];
    overwrite.push.apply(overwrite, extra_overwrite);
    create_proxied_event_object(ref_web_obj, overwrite, obj);
    const func_reg = {};

    // # location
    const location_init = {};
    const _location = ref_web_obj.location;

    if (_location.href.startsWith(base_url) === false) {
        throw new Error("Illegal base url");
    }

    // ## location.[[function]]
    let keys = ["assign", "replace"];
    for (let key of keys) {
        let desc = get_obj_prop_desc(_location, key);
        let _desc_value = desc.value;
        desc.value = function(url) {
            return _desc_value.apply(_location, [get_requested_url(url, web_default_path, ref_web_obj)]);
        }
        set_obj_prop_desc(location_init, key, desc);
    }
    let reload_desc = get_obj_prop_desc(_location, "reload");
    reload_desc.value = reload_desc.value.bind(_location);
    set_obj_prop_desc(location_init, "reload", reload_desc);

    set_obj_prop_desc(location_init, "toString", {
        writable: false,
        enumerable: true,
        configurable: false,
        value: function() {
            return this.href;
        }
    });

    // ## location.ancestorOrigins
    const ancestor_origins_init = {};
    const _ancestor_origins = _location.ancestorOrigins;

    set_obj_prop_desc(ancestor_origins_init, "length", {
        enumerable: false,
        configurable: false,
        get: function(){
            return _ancestor_origins.length;
        }
    });

    set_obj_prop_desc(ancestor_origins_init, "item", {
        writable: false,
        enumerable: false,
        configurable: false,
        value: function(index) {
            if (/^\d+\.?\d*$/gi.test(index) && index >= 0 && index < this.length){
                return get_original_url(_ancestor_origins.item(index));
            }
            return null;
        }
    });

    set_obj_prop_desc(ancestor_origins_init, "contains", {
        writable: false,
        enumerable: false,
        configurable: false,
        value: function(url) {
            for (let i=0; i<this.length; i++) {
                if (this.item(i) === url) {
                    return true;
                }
            }
            return false;
        }
    });

    for (let i = 0;i < _ancestor_origins.length; i++) {
        set_obj_prop_desc(ancestor_origins_init, i, {
            writable: false,
            enumerable: true,
            configurable: true,
            value: _ancestor_origins.item(i)
        });
    }

    set_obj_prop_desc(location_init, "ancestorOrigins", {
        enumerable: true,
        configurable: false,
        get: function(){
            return ancestor_origins_init;
        },
    });

    const href_desc = get_obj_prop_desc(_location, "href");
    const location_props_overwrite = ["href", "pathname", "protocol", "host", "hostname", "port"]
    const location_props_no_overwrite = ["search", "hash"];

    // ## location.[[location_props_overwrite]]
    for (let location_prop of location_props_overwrite) {
        set_obj_prop_desc(location_init, location_prop, {
            enumerable: true,
            configurable: false,
            get: function() {
                return new URL(get_original_url(href_desc.get.apply(_location)))[location_prop];
            },
            set: function(value) {
                let url_obj = new URL(get_original_url(href_desc.get.apply(_location)));
                url_obj[location_prop] = value;
                return href_desc.set.apply(_location, [get_requested_url(url_obj.href, web_default_path, ref_web_obj)]);
            }
        });
    }

    // ## location.[[location_props_no_overwrite]]
    for (let location_prop of location_props_no_overwrite) {
        let desc = get_obj_prop_desc(_location, location_prop);
        set_obj_prop_desc(location_init, location_prop, {
            enumerable: true,
            configurable: false,
            get: function() {
                return desc.get.apply(_location);
            },
            set: function(value) {
                return desc.set.apply(_location, [value]);
            }
        });
    }

    // ## location.origin
    set_obj_prop_desc(location_init, "origin", {
        enumerable: true,
        configurable: false,
        get: function() {
            return new URL(get_original_url(href_desc.get.apply(_location))).origin;
        }
    });

    set_obj_prop_desc(obj, "location", {
        enumerable: true,
        configurable: false,
        get: function(){
            return location_init;
        },
        set: function(value){
            return location_init.assign(value);
        }
    });

    // # origin
    if (ref_web_obj.origin){
        proxy_prop(ref_web_obj, obj, "origin", _location.origin, location_init.origin, func_reg);
    }

    // # XMLHttpRequest
    let _XMLHttpRequest = ref_web_obj.XMLHttpRequest;
    if (_XMLHttpRequest) {
        let XMLHttpRequest = function() {
            set_obj_prop_desc(this, "_", {
                writable: false,
                enumerable: false,
                configurable: false,
                value: new _XMLHttpRequest()
            });
            create_proxied_event_object(this._, ["open"], this);
            set_obj_prop_desc(this, "open", {
                writable: true,
                enumerable: true,
                configurable: true,
                value: function(){
                    let args = slice_args(arguments);
                    args[1] = get_requested_url(args[1], web_default_path, ref_web_obj);
                    return this._.open.apply(this._, args);
                }
            });
        }

        set_obj_prop_desc(obj, "XMLHttpRequest", {
            writable: true,
            enumerable: false,
            configurable: true,
            value: XMLHttpRequest
        });
    }

    // # Request
    let _Request = ref_web_obj.Request;
    if (_Request) {
        let Request = function(){
            let args = [null];
            args.push.apply(args, slice_args(arguments));
            args[1] = get_requested_url(args[1], web_default_path, ref_web_obj);
            set_obj_prop_desc(this, "_", {
                writable: false,
                enumerable: false,
                configurable: false,
                value: new Function.bind.apply(_Request, args)
            });
            create_proxied_event_object(this._, [], this);
        }

        set_obj_prop_desc(obj, "Request", {
            writable: true,
            enumerable: false,
            configurable: true,
            value: Request
        });
    }

    // # fetch
    let _fetch = ref_web_obj.fetch;
    if (_fetch) {
        set_obj_prop_desc(obj, "fetch", {
            writable: true,
            enumerable: true,
            configurable: true,
            value: function(){
                let args = slice_args(arguments);
                if (typeof args[0] === "string"){
                    args[0] = get_requested_url(args[0], web_default_path, ref_web_obj);
                }
                return _fetch.apply(ref_web_obj, args).then(function(response){
                    return response;
                });
            }
        });
    }

    // # Worker
    let _Worker = ref_web_obj.Worker;
    if (_Worker) {
        let Worker = function(){
            let args = [null];
            args.push.apply(args, slice_args(arguments));
            args[1] = get_requested_url(args[1], web_default_path, ref_web_obj);
            set_obj_prop_desc(this, "_", {
                writable: false,
                enumerable: false,
                configurable: false,
                value: new Function.bind.apply(_Worker, args)
            });
            create_proxied_event_object(this._, [], this);
        }

        set_obj_prop_desc(obj, "Worker", {
            writable: true,
            enumerable: false,
            configurable: true,
            value: Worker
        });
    }
}
