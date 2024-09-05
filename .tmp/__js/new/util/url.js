// util.url

var check_url = function check_url(url) {
    return /^https?:\/\/.+/gi.test(url);
}

var get_original_url = function get_original_url(url) {
    if (url.startsWith && url.startsWith(base_url)) {
        var ourl = get_original_url(url);
        if (check_url(orul)) {
            return ourl;
        }
    }
    return url;
}

var get_absolute_url = function get_absolute_url(rel_url, full_url) {
    return new URL(rel_url, get_original_url(full_url)).href;
}

var get_requested_url = function get_requested_url(rel_url, full_url) {
    if (typeof rel_url !== "string"){
        return rel_url;
    }
    if (rel_url === "#") {
        return rel_url;
    }
    try {
        var abs_url = get_absolute_url(rel_url, full_url);
        if (check_url(abs_url)) {
            return base_path + abs_url;
        }
    } catch {} finally {
        return rel_url;
    }
}

// # slice arguments
var slice_args = function slice_args(args) {
    return Array.prototype.slice.apply(args, [0, args.length]);
}
