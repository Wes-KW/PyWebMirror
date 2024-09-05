// util.builtin

// # Object.[[property_getter_and_setter]]
var create_proto_as = function create_proto_as(obj) {
    return Object.create(obj.constructor.prototype);
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
        try {
            var _desc = get_property(ref_obj, property);
            if (_desc){
                for (var key in _desc) {
                    if (!(key in desc)){
                        desc[key] = _desc[key];
                    }
                }
            } else {
                return;
            }
        } catch {
            return;
        }
    }
    if (desc.get) {
        make_fn_native(desc.get, "get " + property);
    }
    if (desc.set) {
        make_fn_native(desc.set, "set " + property);
    }
    if (typeof desc.value === "function") {
        make_fn_native(desc.value, property);
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

var make_fn_native = function make_fn_native(fn, name) {
    Object.defineProperty(fn, "toString", {
        value: function() {
            return "function " + name + "() { [native code] }";
        }
    });
}

// # proxy property
var proxy_property = function proxy_property(top, ref_obj, obj, property) {
    var desc = get_property(ref_obj, property);
    if (!desc) return;

    var unbounded = undefined;
    var bounded = undefined;

    if (desc.get) {
        var desc_get = desc.get;
        desc.get = function() {
            var get_value = desc_get.apply(top);
            if (bounded === get_value) {
                return unbounded;
            } else {
                return get_value;
            }
        }
    }

    if (desc.set) {
        var desc_set = desc.set;
        desc.set = function(){
            var value = slice_args(arguments)[0];
            if (typeof value === "function"){
                unbounded = value;
                bounded = value.bind(obj);
                value = bounded;
            }
            var res = desc_set.apply(top, [value]);
            var new_desc = get_property(ref_obj, property);
            if (new_desc && !is_descriptor_identical(desc, new_desc)) {
                // property is reset on the reference object
                // and hence must be done in here as well
                proxy_property(top, ref_obj, obj, property);
            }
            return res;
        }
    }

    if ("value" in desc) {
        var desc_value = desc.value;
        if (typeof desc_value === "function" && !("prototype" in desc_value)) {
            desc.value = desc_value.bind(top);
        }
    }

    set_property(obj, property, desc);
}

var shallow_copy = function shallow_copy(top, ref_obj, obj) {
    // create pointers to reference object
    var properties = get_property_keys(ref_obj);
    for (var i = 0; i < properties.length; ++i) {
        var property = properties[i];
        (function(property){
            if (!(property in obj)) {
                proxy_property(top, ref_obj, obj, property);
            }
        })(property);
    }
}

var deep_copy = function deep_copy(top, ref_obj, obj) {
    if (get_proto(ref_obj) !== Object.prototype) {
        deep_copy(top, get_proto(ref_obj), obj);
    }
    shallow_copy(top, ref_obj, obj);
}

var class_call_check = function class_call_check(instance, cls) {
    if (!(instance instanceof cls)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
