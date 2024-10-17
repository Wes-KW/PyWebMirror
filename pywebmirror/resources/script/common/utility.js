/*
	DESCRIPTION: Utility Functions

	NOTE: The content of this file can be served dynamically
*/

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


var getCookie = function getCookie() {
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