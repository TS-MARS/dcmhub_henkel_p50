$.import("utltool.core", "CoreUtility");
var CoreUtility = $.utltool.core.CoreUtility;

function onCreate(oParam) {
	var oEntityData = CoreUtility.getEntityData(oParam.connection, oParam.afterTableName);
	
	try {
	var oStatement = oParam.connection.prepareStatement("INSERT INTO \"CS.UiTableAttribute\" VALUES(?,?,?,?,?,?,?)");

			oStatement.setString(1, oEntityData.UserName);
			oStatement.setString(2, oEntityData.TabName);
			oStatement.setString(3, oEntityData.FieldName);
			oStatement.setString(4, oEntityData.ColPos);
			oStatement.setString(5, oEntityData.ColVisible);
			oStatement.setString(6, oEntityData.ColFilter);
			oStatement.setString(7, oEntityData.ColSort);

	oStatement.executeUpdate();
	oStatement.close();
	} catch (oError) {
		throw oError;
	}
}

function onUpdate(oParam) {
	var oEntityData = CoreUtility.getEntityData(oParam.connection, oParam.afterTableName);
	try {	
	var oStatement = oParam.connection.prepareStatement(
		"UPDATE \"CS.UiTableAttribute\" SET \"COLPOS\"=?, \"COLVISIBLE\"=?, \"COLFILTER\"=?, \"COLSORT\"=? WHERE \"USERNAME\"=? AND \"TABNAME\"=? AND \"FIELDNAME\"=?"
	);
			oStatement.setString(1, oEntityData.ColPos);
			oStatement.setString(2, oEntityData.ColVisible);
			oStatement.setString(3, oEntityData.ColFilter);
			oStatement.setString(4, oEntityData.ColSort);
			oStatement.setString(5, oEntityData.UserName);
			oStatement.setString(6, oEntityData.TabName);
			oStatement.setString(7, oEntityData.FieldName);

			
	oStatement.executeUpdate();
	oStatement.close();
	} catch (oError) {
		throw oError;
	}
}

function onDelete(oParam) {
	var oEntityData = CoreUtility.getEntityData(oParam.connection, oParam.beforeTableName);
	try {
	var oStatement = oParam.connection.prepareStatement("DELETE FROM \"CS.UiTableAttribute\" WHERE \"USERNAME\"=? AND \"TABNAME\"=? AND \"FIELDNAME\"=?"
	);
			oStatement.setString(1, oEntityData.UserName);
			oStatement.setString(2, oEntityData.TabName);
			oStatement.setString(3, oEntityData.FieldName);
	oStatement.executeUpdate();
	oStatement.close();
} catch (oError) {
		throw oError;
	}	
}