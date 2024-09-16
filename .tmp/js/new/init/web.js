// init.web

var wrap_obj = function (ref_obj, obj) {
    deep_copy(ref_obj, ref_obj, obj);
}

var wrap_event_target = function wrap_event_target(ref_event_target, event_target) {
    var reg = new Factory();

    var add_reg = function(unbounded){
        var bounded = unbounded.bind(event_target);
        reg.add(unbounded, bounded);
        return bounded;
    }

    var remove_reg = function(bounded){
        return reg.get(bounded, true);
    }

    // ## addEventListener
    var addEventListener = ref_event_target.addEventListener;
    if (addEventListener) {
        set_property(event_target, "addEventListener", {
            value: function(){
                var args = slice_args(arguments);
                args[1] = add_reg(args[1]);
                return addEventListener.apply(ref_event_target, args);
            }
        }, ref_event_target);
    }
    
    // ## removeEventListener
    var removeEventListener = ref_event_target.removeEventListener;
    if (removeEventListener) {
        set_property(event_target, "removeEventListener", {
            value: function(){
                var args = slice_args(arguments);
                args[1] = remove_reg(args[1]);
                return removeEventListener.apply(ref_event_target, args);
            }
        }, ref_event_target);
    }

    // ## dispatchEvent
    var dispatchEvent = ref_event_target.dispatchEvent;
    if (typeof dispatchEvent === "function") {
        set_property(event_target, "dispatchEvent", {
            value: function(){
                return dispatchEvent.apply(ref_event_target, slice_args(arguments));
            }
        }, ref_event_target);
    }

    wrap_obj(ref_event_target, event_target);
}

var wrap_location = function wrap_location(ref_location, location) {
    if (!location.href.startsWith(base_url)){
        wrap_obj(ref_location, location);
        return;
    }

    // ## location.ancestorOrigins
    set_property(location, "ancestorOrigins", {
        get: function() {
            return null;
        }
    }, ref_location);

    // ## location.[[function]]
    var properties = ["assign", "replace"];
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        (function(property){
            set_property(location, property, {
                value: function() {
                    var args = slice_args(arguments);
                    args[0] = get_requested_url(url, ref_location.href);
                    return ref_location[property].apply(ref_location, args);
                }
            }, ref_location);
        })(property);
    }

    // ## location.[[UrlComponents]]
    var properties = ["href", "pathname", "protocol", "host", "hostname", "port"];
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        (function(property){
            set_property(location, property, {
                get: function() {
                    return new URL(get_original_url(ref_location.href))[property];
                },
                set: function() {
                    var url_obj = new URL(get_original_url(ref_location.href));
                    url_obj[property] = slice_args(arguments)[0];
                    return ref_location.href = get_requested_url(url_obj.href, ref_location.href);
                }
            }, ref_location);
        })(property);
    }

    // ## location.origin
    set_property(location, "origin", {
        get: function() {
            return new URL(get_original_url(ref_location.href)).origin;
        }
    }, ref_location);

    // ## toString
    set_property(location, "toString", {
        value: function() {
            return location.href;
        }
    }, ref_location);

    wrap_obj(ref_location, location);
}
