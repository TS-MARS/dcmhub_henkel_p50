"use strict";
// if(!$.session.hasAppPrivilege("Adhocquery"))
// {
// 	$.response.setBody("Not Authorized");
// 	$.response.contentType = "text/plain";
// 	$.response.status = $.net.http.UNAUTHORIZED;
// }
//else{
var oConn = $.hdb.getConnection();


var sQuery = $.request.parameters.get('query');
// validate query to ensure only SELECT is used
var validate = sQuery.match(/INSERT|DELETE|MODIFY/ig);

if(validate === null){
var oResultSet = oConn.executeQuery(sQuery);

	$.response.status = $.net.http.OK;
	$.response.contentType = "application/json";
	$.response.setBody(JSON.stringify(oResultSet,null,2));
}else
{
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	$.response.setBody("Only SELECT is allowed in Query!!");
}

oConn.close();
//}