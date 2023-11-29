"use strict";

var oConn = $.hdb.getConnection();


var sField = $.request.parameters.get('field');
var sTable = $.request.parameters.get('table');
var where = $.request.parameters.get('where');

//var obj = $.request.body.asString();
//obj = JSON.parse(obj);

//var sField = obj.field;
//var sTable = obj.table;
//var where = obj.where;
if (where !==""){
var sQuery = "SELECT TOP 10000 DISTINCT \"" + sField + "\" FROM \"core.models::" + sTable +"\" WHERE "+where + " ORDER BY " + sField;
}else{
var sQuery = "SELECT TOP 10000 DISTINCT \"" + sField + "\" FROM \"core.models::" + sTable +"\"" + " ORDER BY " + sField;
}

var oResultSet = oConn.executeQuery(sQuery);


	$.response.status = $.net.http.OK;
	$.response.contentType = "application/json";
	$.response.setBody(JSON.stringify(oResultSet,null,2));


oConn.close();