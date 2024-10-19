/*
	DESCRIPTION: Server Constants and Utilities

	NOTE: You should define the following
	NOTE: constants before using this script
	NOTE: in your python server

	CONSTANT: $PORTS -- e.g. {"http": 80, "https": 443}
	CONSTANT: $HOST -- e.g. "localhost"
	CONSTANT: $CMETHOD -- e.g. "base64"
	CONSTANT: $ALLOWRULES -- e.g.["https?:\/\/"]
	CONSTANT: $DENYRULES -- e.g. []
*/

var PORTS = $PORTS;
var HOST = $HOST;
var CMETHOD = $CMETHOD;
var ALLOWRULES = $ALLOWRULES;
var DENYRULES = $DENYRULES;
var TOKEN = getToken();


var getCookie = function getCookie() {
	var split = function split(separator, count) {
		var list = String.prototype.split.call(this, separator);
	
		if (!count || count > list.length) {
			count = list.length;
		}
	
		var nList = [];
		var extra = [];
		for (var i = 0; i < list.length; i++) {
			if (nList.length < count - 1) {
				nList.push(list[i]);
			} else {
				extra.push(list[i]);
			}
		}
	
		nList.push(extra.join(separator));
		return nList;
	}

	var cookieList = document.cookie.split("; ");
	var cookieSet = {};
	for (var i = 0; i < cookieList.length; i++) {
		var keyValuePair = split.call(cookieList[i], "=", 2);
		if (keyValuePair.length != 2) {
			continue;
		}
		cookieSet[keyValuePair[0]] = keyValuePair[1];
	}
	return cookieSet;
}


var getToken = function getToken() {
	return getCookie()["__PyWebMirror_TOKEN"];
}


var isURIDecoded = function isURIDecoded(url) {
	try {
		return decodeURI(url) == url;
	} catch {
		return true;
	}
}


var URIEncode = function URIEncode(url) {
	if (isURIDecoded(url)) {
		return encodeURI(url);
	} else {
		return url;
	}
}


var URIDecode = function URIDecode(url) {
	if (isURIDecoded(url)) {
		return url;
	} else {
		return decodeURI(url);
	}
}


var base64Encode = function base64Encode(url) {
	return btoa(URIEncode(url));
}


var base64Decode = function base64Decode(url) {
	return URIDecode(atob(url));
}


var rewriteURL = function rewriteURL(url) {
	
}
