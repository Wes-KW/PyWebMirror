/*
	DESCRIPTION: Server Constants

	NOTE: This is only a reference to constant loaded by
	NOTE: the server. The content of this file should be
	NOTE: created by python and should not be served
	NOTE: dynamically.
*/

var getToken = function getToken() {
	return getCookie()["__PyWebMirror_TOKEN"];
}

var PROTOS = ["http", "https"];
var HOST = "me.v";
var PORT = "";
var CMETHOD = "rsa";
var TOKEN = getToken();
var ALLOWRULES = [];
var DENYRULES = [];
