sap.ui.define([], function () {
	"use strict";

	return {
		columnLabelConverter: function (sValue, oTable) {
			var sName = "";
			this._oDialog.getModel("tables").getData().columns.forEach(function (oColumn) {
				if (oColumn.column_property === sValue) {
					sName = oColumn.column_name;
				}
			});
			return sName;
		}
	};
});