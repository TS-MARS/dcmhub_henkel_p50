/*eslint*/
'use strict';

function doesFileExist(filename) {
	try {
		var connection = $.hdb.getConnection();
		var getFileContentProc = connection.loadProcedure("att::doesFileExist");
		var results = getFileContentProc(filename);
		if (results.OM_FILE_EXIST.valueOf() === (1).valueOf()){
			$.response.setBody("true");
			return true;
		} else {
			$.response.setBody("false");
			return false;
		}
	} catch(e) {
		$.response.setBody("false");
		return false;
	}
}

var filename = $.request.parameters.get("file");
doesFileExist(filename);
