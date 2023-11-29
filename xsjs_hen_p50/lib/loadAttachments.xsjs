/*eslint*/
'use strict';

function loadAttachments(SapObject, ObjectId) {
	try {
		var connection = $.hdb.getConnection();
		var initPointers = connection.loadProcedure("att::initCustomTOA_bySapObject");
		initPointers(SapObject, ObjectId + '%');

	} catch(e) {
		//TODO: handle error
	}
}

var object = $.request.parameters.get("SapObject");
var id  = $.request.parameters.get("ObjectId");
loadAttachments(object, id);