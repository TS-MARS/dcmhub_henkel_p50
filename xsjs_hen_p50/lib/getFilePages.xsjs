/*eslint*/
'use strict';

function getFilePagesCount(filename) {
	var connection				= $.hdb.getConnection();
	var getFilePagesCountProc	= connection.loadProcedure("att::getFilePagesCount");
	var result					= getFilePagesCountProc(filename);
	return result.OM_PAGES;                         
}

var filename = $.request.parameters.get("file");
var pages    = getFilePagesCount(filename);
$.response.setBody(pages);