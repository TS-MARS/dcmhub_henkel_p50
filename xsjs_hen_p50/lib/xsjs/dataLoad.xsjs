"use strict";

var oConn = $.hdb.getConnection();

var sField = $.request.parameters.get("field");
var sTable = $.request.parameters.get("table");
var where = $.request.parameters.get("where");

var sTop = "1000000";

var sQuery = "SELECT TOP " + sTop + " " + sField + ' FROM "core.models::' + sTable;
if (where !== "") {
  sQuery = sQuery + '" WHERE ' + where;
} else {
  sQuery = sQuery + '"';
}
console.log(sQuery);
var oResultSet = oConn.executeQuery(sQuery);

$.response.status = $.net.http.OK;
$.response.contentType = "application/json";
$.response.setBody(JSON.stringify(oResultSet, null, 2));

oConn.close();
