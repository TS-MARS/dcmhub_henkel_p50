sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("tool_hen_p50.controller.launchpad", {
		onInit: function () {
		},
		onPressReporting: function () {
				this._router = sap.ui.core.UIComponent.getRouterFor(this);
				this._router.navTo("reporting");
		},
		onPressAdhocQuery: function () {
			this._router = sap.ui.core.UIComponent.getRouterFor(this);
			this._router.navTo("adhocQuery");
		}
	});
});