/*
	DESCRIPTION: URL Rewriting

	NOTE: The content of this file can be served dynamically.
*/

var isURLEncoded = function isURLEncoded(url) {
	try {
		return decodeURI(url) != url;
	} catch (e) {
		return false;
	}
}

var checkURL = function checkURL(url) {
	
}