// init.document

var wrap_node = function wrap_node(ref_node, node) {
    // node properties 
    (function(ref_node, node){
        // properties instanceof (Node OR Element)
        var properties = [
            // document OR document fragments OR shadow roots
            "fullscreenElement", "activeElement", "pointerLockElement",
            "pictureInPictureElement", "scrollingElement", "rootElement",
            "documentElement", "currentScript",

            // node
            "firstChild", "lastChild", "nextSibling", "previousSibling",
            "ownerDocument", "parentElement", "parentNode",

            // element
            "firstElementChild", "lastElementChild", "nextElementSibling",
            "previousElementSibling"
        ];

        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            (function(property){
                set_node_property(ref_node, node, property, false);
            })(property);
        }

        // properties instanceof (NodeList OR HTMLCollection)
        var properties = ["childNodes", "children", "images", "forms", "scripts"];

        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            (function(property){
                set_node_property(ref_node, node, property, true);
            })(property);
        }

        // TODO: functions which outputs node
        // TODO: functions which outputs nodes
        // TODO: functions which takes in node
        // TODO: functions which takes in node and output node
    })(ref_node, node);

    // node attributes
    (function(ref_node, node){
        // TODO: Attributes
        // TODO: - linked: src, srcset, action, href
        // TODO: - iframe: srcdoc, contentWindow
        // NOTE: - `iframe.srcdoc` overwrites `iframe.src`
    })(ref_node, node);

    // node content
    (function(ref_node, node){
        // TODO: innerHTML/outerHTML/textContent
        // NOTE: when <iframe> is created or deleted, update 
        // NOTE: `window.pywebmirror`
    })(ref_node, node);

    // URL
    (function(ref_node, node){
        var properties = ["documentURI", "URL", "referrer", "baseURI"];
        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            (function(property){
                set_property(node, property, {
                    get: function(){
                        return get_original_url(ref_node[property]);
                    }
                }, ref_node);
            })(property);
        }

        // ## location
        var location = get_cobj(node.location, wrap_location);
        set_property(node, "location", {
            get: function() {
                return location;
            },
            set: function() {
                if (!location) {
                    throw new TypeError("Cannot set location on threaded DOM");
                }
                return location.assign(slice_args(arguments)[0]);
            }
        }, ref_node);

        // ## domain
        set_property(node, "domain", {
            get: function() {
                return location.hostname;
            },
            set: function() {
                return set_property(node, "domain", {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: slice_args(arguments)[0]
                });
            }
        }, ref_node);
    })(ref_node, node);

    // other
    (function(ref_node, node){
        // document.implementation
        var wrap_doc_imp = function wrap_doc_imp(ref_obj, obj) {
            var properties = ["createDocument", "createHTMLDocument"];
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                (function(property){
                    set_node_out_fn(ref_obj, obj, property, false);
                })(property);
            }

            wrap_obj(ref_obj, obj);
        }

        set_property(node, "implementation", {
            get: function() {
                return get_cobj(ref_node.implementation, wrap_doc_imp);
            }
        }, ref_node);
    })(ref_node, node);

    wrap_event_target(ref_node, node);
}

var update_nodes = function update_nodes(ref_nodes, nodes) {

}

var wrap_nodes = function wrap_nodes(ref_nodes, nodes) {
    // TODO: Wrap HTMLCollection, NodeList, NamedNodeMap.
    // TODO: Note that they are live objects.
    // NOTE: Call an update function when the original object
    // NOTE: changed, (usually when HTML content is changed)
}

var _node = function _node(node) {
    return get_cobj(node, wrap_node);
}

var _nodes = function _nodes(nodes) {
    return get_cobj(nodes, wrap_nodes);
}

var set_node_property = function set_node_property(ref_node, node, property, plural) {
    var desc = get_property(ref_node, property);
    var desc_get = desc.get;
    var _desc = {};
    if (plural) {
        _desc.get = function(){
            return _nodes(desc_get.call(ref_node));
        };
    } else {
        _desc.get = function(){
            return _node(desc_get.call(ref_node));
        };
    }
    set_property(node, property, _desc, ref_node);
}

var set_node_out_fn = function set_node_out_fn(ref_node, node, property, plural) {
    var desc = get_property(ref_node, property);
    var desc_value = desc.value;
    var _desc = {};
    if (plural) {
        _desc.value = function(){
            return _nodes(desc_value.apply(ref_node, slice_args(arguments)));
        }
    } else {
        _desc.value = function(){
            return _node(desc_value.apply(ref_node, slice_args(arguments)));
        }
    }
    set_property(node, property, _desc, ref_node);
}

var set_node_in_fn = function set_node_in_fn(ref_node, node, property, ranges) {
    if (!ranges) ranges = [];
    var desc = get_property(ref_node, property);
    var desc_value = desc.value;
    var _desc = {}
    _desc.value = function(){
        var args = slice_args(arguments);
        for (var i = 0; i < ranges.length; i++) {
            (function(i){
                args[i] = _node(args[i]);
            })(i);
        }
        return desc_value.apply(ref_node, args);
    }
    set_property(node, property, _desc, ref_node);
}

var set_node_fn = function set_node_fn(ref_node, node, property, ranges) {
    if (!ranges) ranges = [];
    var desc = get_property(ref_node, property);
    var desc_value = desc.value;
    var _desc = {};
    _desc.value = function(){
        var args = slice_args(arguments);
        for (var i = 0; i < ranges.length; i++) {
            (function(i){
                args[i] = _node(args[i]);
            })(i);
        }
        return _node(desc_value.apply(ref_node, args));
    }
    set_property(node, property, _desc, ref_node);
}
