// variable.python.js

/* write this in each of the script to execute it in another context
	(function(){
		//
		// declare global variables
		// here or as the arguments
		//

		//
		//	script goes here
		//

    }).bind(context)();
*/

console.time('wrap');

var base_url = "http://www.nawaski.com/m/";
var web_default_path = "/m/";
var web_worker_path = "/w/";

// common.util.js

// # Object.[[property_getter_and_setter]]
var create_proto = function create_proto(proto) {
    return Object.create(proto.prototype);
}

var get_proto = function get_proto(obj) {
    return obj.__proto__ || Object.getPrototypeOf(obj);
}

var get_property_keys = function get_property_keys(obj) {
    return Object.getOwnPropertyNames(obj);
}

var get_property = function get_property(obj, property) {
    if (!get_property_keys(obj).includes(property) && obj !== Object.prototype) {
        return get_property(get_proto(obj), property);
    }
    return Object.getOwnPropertyDescriptor(obj, property);
}

var set_property = function set_property(obj, property, desc, ref_obj) {
    if (ref_obj) {
        var _desc = get_property(ref_obj, property);
        if (_desc){
            for (var key in _desc) {
                if (!(key in desc)){
                    desc[key] = _desc[key];
                }
            }
        }
    }
    return Object.defineProperty(obj, property, desc);
}

// # check equality of property descriptor
var is_descriptor_identical = function is_property_descriptor_identical(desc1, desc2) {
    var cross_identify = function cross_identify(desc1, desc2) {
        for (var key in desc1) {
            if (!(key in desc2)){
                return false;
            }
            if (desc1[key] !== desc2[key]) {
                return false;
            }
        }
    }
    if (!cross_identify(desc1, desc2) || !cross_identify(desc2, desc1)) {
        return false;
    }
    return true;
}

// # proxy property
var proxy_property = function proxy_property(top, ref_obj, obj, property) {
    var _desc = get_property(ref_obj, property);
    if (!_desc) return;

    var _unbounded = undefined;
    var _bounded = undefined;

    if (_desc.get) {
        var _desc_get = _desc.get;
        _desc.get = function() {
            var _get_value = _desc_get.apply(top);
            if (_bounded === _get_value) {
                return _unbounded;
            } else {
                return _get_value;
            }
        }
    }

    if (_desc.set) {
        var _desc_set = _desc.set;
        _desc.set = function(){
            var value = slice_args(arguments)[0];
            if (typeof value === "function"){
                _unbounded = value;
                _bounded = value.bind(this);
                value = _bounded;
            }
            var res = _desc_set.apply(top, [value]);
            var _new_desc = get_property(ref_obj, property);
            if (_new_desc && !is_descriptor_identical(_desc, _new_desc)) {
                // property is reset on the reference
                // object and hence must be done in here
                proxy_property(top, ref_obj, obj, property);
            }
            return res;
        }
    }

    if ("value" in _desc) {
        var _desc_value = _desc.value;
        if (typeof _desc_value === "function"){
            if ("prototype" in _desc_value === false) {
                _desc.value = _desc_value.bind(top);
            }
        }
    }

    set_property(obj, property, _desc);
}

var shallow_copy = function shallow_copy(top, ref_obj, overwrite, obj) {
    // create pointers to reference object
    var properties = get_property_keys(ref_obj);
    for (var i = 0; i < properties.length; ++i) {
        var property = properties[i];
        (function(property){
            if (!overwrite.includes(property)) {
                proxy_property(top, ref_obj, obj, property);
            }
        })(property);
    }
}

var deep_copy = function deep_copy(top, ref_obj, overwrite, obj) {
    if (get_proto(ref_obj) !== Object.prototype) {
        deep_copy(top, get_proto(ref_obj), overwrite, obj);
    }
    shallow_copy(top, ref_obj, overwrite, obj);
}

// # URL
var check_url = function check_url(url) {
    return /^https?:\/\/.+/gi.test(url);
}

var get_original_url = function get_original_url(url) {
    return url.substring(base_url.length);
}

var get_absolute_url = function get_absolute_url(rel_url, full_url) {
    return new URL(rel_url, get_original_url(full_url)).href;
}

var get_requested_url = function get_requested_url(rel_url, prefix_url, full_url) {
    if (typeof rel_url === "undefined") return "";
    if (rel_url === null) return "";
    if (rel_url === "#") return "#";
    var abs_url = get_absolute_url(rel_url, full_url);
    if (check_url(abs_url)) {
        return prefix_url + abs_url;
    } else {
        return rel_url;
    }
}

// # slice arguments
var slice_args = function slice_args(args) {
    return Array.prototype.slice.apply(args, [0, args.length]);
}

// common.web.js

var proxy_event_obj = function proxy_event_obj(ref_obj, extra_overwrite, obj) {
    var overwrite = ["addEventListner", "removeEventListener", "dispatchEvent"];
    overwrite.push.apply(overwrite, extra_overwrite);
    deep_copy(ref_obj, ref_obj, overwrite, obj);

    // # EventTarget.[[property]]
    var func_mappings = [];

    var FuncMapping = function(func, proxied_func) {
        this.func = func;
        this.proxied_func = proxied_func;
    }

    var add_func_mapping = function(func, proxied_func){
        func_mappings.push(new FuncMapping(func, proxied_func));
    }

    var get_func_mapping = function(func){
        var temp_func_mappings = [];

        var push_back = function() {
            while (temp_func_mappings.length > 0) {
                func_mappings.push(temp_func_mappings.pop());
            }
        }

        while (func_mappings.length > 0) {
            var func_mapping = func_mappings.pop();
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
    var addEventListener = ref_obj.addEventListener;
    if (typeof addEventListener === "function") {
        set_property(obj, "addEventListener", {
            value: function(){
                var args = slice_args(arguments);
                var new_func = args[1].bind(obj);
                add_func_mapping(args[1], new_func);
                args[1] = new_func;
                addEventListener.apply(ref_obj, args);
            }
        }, ref_obj);
    }
    
    // ## removeEventListener
    var removeEventListener = ref_obj.removeEventListener;
    if (typeof removeEventListener === "function") {
        set_property(obj, "removeEventListener", {
            value: function(){
                var args = slice_args(arguments);
                var proxied_func = get_func_mapping(args[1]);
                args[1] = proxied_func;
                removeEventListener.apply(ref_obj, args);
            }
        }, ref_obj);
    }

    // ## dispatchEvent
    var dispatchEvent = ref_obj.dispatchEvent;
    if (typeof dispatchEvent === "function") {
        set_property(obj, "dispatchEvent", {
            value: function(){
                var args = slice_args(arguments);
                dispatchEvent.apply(ref_obj, args);
            }
        }, ref_obj);
    }
}

var get_proxied_location = function get_proxied_location(_location) {
    // # location
    var location = create_proto(_location.constructor);

    if (_location.href.startsWith(base_url) === false) {
        throw new Error("Illegal base url");
    }

    // ## location.[[function]]
    var keys = ["assign", "replace"];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var _desc_value = get_property(_location, key).value;
        (function(_desc_value){
            set_property(location, key, {
                value: function(url) {
                    return _desc_value.apply(_location, [get_requested_url(url, web_default_path, _location.href)]);
                }
            }, _location);
        })(_desc_value);
    }

    // ## location.ancestorOrigins
    var _ancestor_origins = _location.ancestorOrigins;
    var ancestor_origins = create_proto(_ancestor_origins.constructor);

    set_property(ancestor_origins, "length", {
        get: function(){
            return _ancestor_origins.length;
        }
    }, _ancestor_origins);

    set_property(ancestor_origins, "item", {
        value: function(index) {
            if (/^\d+\.?\d*$/gi.test(index) && index >= 0 && index < this.length){
                return get_original_url(_ancestor_origins.item(index));
            }
            return null;
        }
    }, _ancestor_origins);

    set_property(ancestor_origins, "contains", {
        value: function(url) {
            for (var i = 0; i < this.length; i++) {
                if (this.item(i) === url) {
                    return true;
                }
            }
            return false;
        }
    }, _ancestor_origins);

    for (var i = 0; i < _ancestor_origins.length; i++) {
        (function(i){
            set_property(ancestor_origins, i, {
                value: _ancestor_origins.item(i)
            }, _ancestor_origins);
        })(i);
    }

    set_property(location, "ancestorOrigins", {
        get: function(){
            return ancestor_origins;
        },
    }, _location);

    // ## location.[[OverwrittenComponents]]
    var href_desc = get_property(_location, "href");
    var properties = ["href", "pathname", "protocol", "host", "hostname", "port"];
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        (function(property){
            set_property(location, property, {
                get: function() {
                    return new URL(get_original_url(href_desc.get.apply(_location)))[property];
                },
                set: function() {
                    var url_obj = new URL(get_original_url(href_desc.get.apply(_location)));
                    url_obj[property] = slice_args(arguments)[0];
                    return href_desc.set.apply(_location, [get_requested_url(url_obj.href, web_default_path, _location.href)]);
                }
            }, _location);
        })(property);
    }

    // ## location.[[NonOverwrittenComponents]]
    var properties = ["search", "hash", "reload"];
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        (function(property){
            proxy_property(_location, _location, location, property);
        })(property);
    }

    // ## location.origin
    set_property(location, "origin", {
        get: function() {
            return new URL(get_original_url(href_desc.get.apply(_location))).origin;
        }
    }, _location);

    // ## toString
    set_property(location, "toString", {
        value: function() {
            return this.href;
        }
    }, _location);

    return location;
}

var proxy_web_obj = function proxy_web_object(ref_web_obj, extra_overwrite, obj) {
    var overwrite = ["location" , "origin", "XMLHttpRequest", "Request", "fetch", "Worker"];
    overwrite.push.apply(overwrite, extra_overwrite);
    proxy_event_obj(ref_web_obj, overwrite, obj);

    var location = get_proxied_location(ref_web_obj.location);
    set_property(obj, "location", {
        get: function(){
            return location;
        },
        set: function(){
            return location.assign(slice_args(arguments)[0]);
        }
    }, ref_web_obj);

    // # origin
    if (ref_web_obj.origin){
        set_property(obj, "origin", {
            get: function() {
                return location.origin;
            },
            set: function() {
                set_property(this, "origin", {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: slice_args(arguments)[0]
                });
            }
        }, ref_web_obj);
    }
}

var doc = create_proto(Document);
proxy_web_obj(document, [], doc);

var w = create_proto(Window);
proxy_web_obj(window, [], w);

console.timeEnd('wrap');
