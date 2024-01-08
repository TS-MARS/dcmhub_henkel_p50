sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/SearchField",
	"sap/ui/model/type/String",
	"sap/ui/core/BusyIndicator"
], function (Controller, ODataModel, JSONModel, NumberFormat, Fragment, Filter, FilterOperator, SearchField, String, BusyIndicator) {
	"use strict";

	return Controller.extend("tool_hen_p50.controller.asset", {
		onInit: function () {
			var oComponent = this.getOwnerComponent(); //Returns the Component
			var oF10Model = oComponent.getModel("F10Set");
			this.getView().setModel(oF10Model);

			this._oClient = this.getView().byId("client");
			this._oCompanyCode = this.getView().byId("companycode");
			this._oAssetNo = this.getView().byId("assetno");
			this._oAssetClass = this.getView().byId("assetclass");
			this._oSubNumber = this.getView().byId("subnumber");
			this._oYear = this.getView().byId("year");
			this._oDepArea = this.getView().byId("deparea");
			this._oBusArea = this.getView().byId("busarea");
			this.getView().addStyleClass("sapUiSizeCompact"); // make everything inside this View appear in Compact mode

			var that = this;
			var oPersonalizationService = sap.ushell.Container.getService("Personalization");
			var oScope = {
				keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
				writeFrequency: oPersonalizationService.constants.writeFrequency.HIGH,
				clientStorageAllowed: true,
				validity: Infinity
			};
			var variantModel;
			oPersonalizationService.getContainer("sap.ushell.variant.asset", oScope, oComponent)
				.fail(function () {
					jQuery.sap.log.error("Loading personalization data failed.");
				})
				.done(function (oContainer) {
					that._oContainer = oContainer;
					variantModel = new sap.ui.model.json.JSONModel(oContainer.getItemKeys());
					that.getView().setModel(variantModel, "variants");
				});
		},

		onNavButtonPressMain: function () {

			this._router = sap.ui.core.UIComponent.getRouterFor(this);
			this._router.navTo("launchpad", {}, true);

		},
		// Next button on the main page at the footer. Navigates to the main table content display
// Code Changed 05 Dec 2020
		onPressNext: function (oEvent) {

			var oView = this.getView();
			var oController = oView.getController();
			var oClient = oView.byId("client").getValue();
			var oCCode = oView.byId("companycode").getTokens()[0].getKey();

			if (oView.byId("assetno").getTokens().length == 0) {
				var oAssetNo = '*';
			} else {
				var oAssetNo = oView.byId("assetno").getTokens()[0].getKey();
			}
			if (oView.byId("assetclass").getTokens().length == 0) {
				var oAssetClass = '*';
			} else {
				var oAssetClass = oView.byId("assetclass").getTokens()[0].getKey();
			}

			if (oView.byId("busarea").getValue() == '') {
				var oBusArea = '*';
			} else {
				var oBusArea = oView.byId("busarea").getValue();
			}

			if (oView.byId("subnumber").getValue() == '') {
				var oSubNumber = '*';
			} else {
				var oSubNumber = oView.byId("subnumber").getValue();
			}

			var oDepArea = oView.byId("deparea").getValue();
			var oYear = oView.byId("year").getValue();
			var oVersion = oView.byId("version").getValue();

			//retrieve the content calculation
			this._modelCalculation(oClient, oCCode, oAssetClass, oAssetNo, oDepArea, oYear, oVersion, oBusArea, oSubNumber).then(function (
				oModel) {
				var oTableModel = oView.byId("tableId");
				oView.setModel(oModel, "data");
				//	oTableModel.setModel(oModel);
			});

			this.byId("pageContainer").to(this.getView().createId("page2"));
			this.byId("nextButtonId").setVisible(false);
		},

		onNavButtonPress: function (oEvent) {
			this.byId("pageContainer").to(this.getView().createId("page1"));
			this.byId("nextButtonId").setVisible(true);
		},
// Code Changed 05 Dec 2020
		_modelCalculation: function (oClient, oCCode, oAssetClass, oAssetNo, oDepArea, oYear, oVersion, oBusArea, oSubNumber) {
			var that = this;
			BusyIndicator.show(0);

			var oComponent = this.getOwnerComponent(); //Returns the Component
			var oAssetModel = oComponent.getModel("assetHistorySheetSet");

			var dataInput = [{
				"oClient": oClient,
				"oCCode": oCCode,
				"oAssetClass": oAssetClass,
				"oAssetNo": oAssetNo,
				"oDepArea": oDepArea,
				"oYear": oYear,
				"oVersion": oVersion,
				"oBusArea": oBusArea,
				"oSubNumber": oSubNumber
			}];
			var oInputModel = new JSONModel(dataInput);
			this.getView().setModel(oInputModel, "oInputModel");

			var layout = this.getView().byId("lineitems").getSelectedKey();
			//			var bcf = this.getOwnerComponent().getView().getModel("i18n").getResourceBundle().getText("bcf");
			var oTableModel = new JSONModel();

			return new Promise(function (resolve, reject) {

				oAssetModel.read(
					"/assetsParameters(IP_MANDT='" + oClient + "',IP_ANLN1='" + oAssetNo + "',IP_ANLN2='" + oSubNumber + "',IP_AFABE='" + oDepArea +
					"',IP_ANLKL='" +
					oAssetClass + "',IP_BUKRS='" + oCCode + "',IP_GSBER='" + oBusArea + "',IP_GJAHR='" + oYear +
					"')/Results", {
						sorters: [new sap.ui.model.Sorter("BUKRS"), new sap.ui.model.Sorter("GSBER"), new sap.ui.model.Sorter("ANLKL"), new sap.ui.model
							.Sorter("ANLN1")
						],
						success: function (oResult) {
							var dataArray = [];

							//Asset Class Total
							var dataObject1 = {
								"TXTYP": 'T',

								"apcfystart": 0,
								"currentapc": 0,
								"depfystart": 0,
								"depforyear": 0,
								"accumuldep": 0,
								"bkvalfystart": 0,
								"currbkval": 0
							};

							//Business Area Total
							var dataObject2 = {
								"TXTYP": 'T',

								"apcfystart": 0,
								"currentapc": 0,
								"depfystart": 0,
								"depforyear": 0,
								"accumuldep": 0,
								"bkvalfystart": 0,
								"currbkval": 0
							};

							//Company Code Total
							var dataObject3 = {
								"TXTYP": 'T',

								"apcfystart": 0,
								"currentapc": 0,
								"depfystart": 0,
								"depforyear": 0,
								"accumuldep": 0,
								"bkvalfystart": 0,
								"currbkval": 0
							};

							for (var i = 0; i < oResult.results.length; i++) {
								var dataObject = {};
								dataObject.busarea = oResult.results[i].GSBER;
								dataObject.assetclass = oResult.results[i].ANLKL;
								dataObject.assetno = oResult.results[i].ANLN1;
								dataObject.desc = oResult.results[i].ANLHTXT;
								dataObject.apcfystart = oResult.results[i].KANSW;
								dataObject.currentapc = oResult.results[i].KANSW * 1 + oResult.results[i].ANSWL * 1;
								dataObject.depfystart = oResult.results[i].KNAFA;
								dataObject.depforyear = oResult.results[i].NAFAP;
								dataObject.accumuldep = oResult.results[i].KNAFA * 1 + oResult.results[i].NAFAP * 1 + oResult.results[i].NAFAV * 1;
								dataObject.bkvalfystart = dataObject.apcfystart * 1 + dataObject.depfystart * 1;

								dataObject.currbkval = dataObject.currentapc + dataObject.accumuldep;
								
								if (layout == 'listassets') {
									/*that.getView().byId("tableId").getColumns()[0].setVisible(true);
									that.getView().byId("tableId").getColumns()[1].setVisible(false);*/
									that.getView().byId("tableId").setVisible(true);
									that.getView().byId("tableId1").setVisible(false);
									dataArray.push(dataObject);

								} else {
								/*	that.getView().byId("tableId").getColumns()[0].setVisible(false);
									that.getView().byId("tableId").getColumns()[1].setVisible(true);*/
									that.getView().byId("tableId").setVisible(false);
									that.getView().byId("tableId1").setVisible(true);
								}

								dataObject1.companycode = "* "+oResult.results[i].BUKRS;
								dataObject1.busarea = oResult.results[i].GSBER;
								dataObject1.assetclass = oResult.results[i].ANLKL;
								dataObject1.apcfystart += oResult.results[i].KANSW * 1;
								dataObject1.currentapc += oResult.results[i].KANSW * 1 + oResult.results[i].ANSWL * 1;
								dataObject1.depfystart += oResult.results[i].KNAFA * 1;
								dataObject1.depforyear += oResult.results[i].NAFAP * 1;
								dataObject1.accumuldep += oResult.results[i].KNAFA * 1 + oResult.results[i].NAFAP * 1 + oResult.results[i].NAFAV * 1;
								dataObject1.bkvalfystart += dataObject.apcfystart * 1 + dataObject.depfystart * 1;
								dataObject1.currbkval += dataObject.currentapc * 1 + dataObject.accumuldep * 1;

								dataObject2.companycode = "**** "+oResult.results[i].BUKRS;
								dataObject2.busarea = oResult.results[i].GSBER;
								dataObject2.apcfystart += oResult.results[i].KANSW * 1;
								dataObject2.currentapc += oResult.results[i].KANSW * 1 + oResult.results[i].ANSWL * 1;
								dataObject2.depfystart += oResult.results[i].KNAFA * 1;
								dataObject2.depforyear += oResult.results[i].NAFAP * 1;
								dataObject2.accumuldep += oResult.results[i].KNAFA * 1 + oResult.results[i].NAFAP * 1 + oResult.results[i].NAFAV * 1;
								dataObject2.bkvalfystart += dataObject.apcfystart * 1 + dataObject.depfystart * 1;
								dataObject2.currbkval += dataObject.currentapc * 1 + dataObject.accumuldep * 1;
								
								dataObject3.companycode = "***** "+oResult.results[i].BUKRS;
								dataObject3.apcfystart += oResult.results[i].KANSW * 1;
								dataObject3.currentapc += oResult.results[i].KANSW * 1 + oResult.results[i].ANSWL * 1;
								dataObject3.depfystart += oResult.results[i].KNAFA * 1;
								dataObject3.depforyear += oResult.results[i].NAFAP * 1;
								dataObject3.accumuldep += oResult.results[i].KNAFA * 1 + oResult.results[i].NAFAP * 1 + oResult.results[i].NAFAV * 1;
								dataObject3.bkvalfystart += dataObject.apcfystart * 1 + dataObject.depfystart * 1;
								dataObject3.currbkval += dataObject.currentapc * 1 + dataObject.accumuldep * 1;

								if (i < oResult.results.length - 1) {

									if ((oResult.results[i].ANLKL !== oResult.results[i + 1].ANLKL || oResult.results[i].GSBER !== oResult.results[i +
											1].GSBER)) {
										/*dataArray.push({
											"assetno": "* Asset Class" + oResult.results[i].ANLKL,
											"grouping": "* " + oResult.results[i].BUKRS + " - " + oResult.results[i].GSBER + " - " + oResult.results[i].ANLKL,
											"TXTYP": 'T'
										});*/
										
										dataArray.push(dataObject1);
										dataObject1 = {
											"TXTYP": 'T',
											"assetclass": '',
											"assetno": '',
											"apcfystart": 0,
											"currentapc": 0,
											"depfystart": 0,
											"depforyear": 0,
											"accumuldep": 0,
											"bkvalfystart": 0,
											"currbkval": 0
										};
									}

									if (oResult.results[i].GSBER !== oResult.results[i + 1].GSBER) {
										
										dataArray.push(dataObject2);
										dataObject2 = {
											"TXTYP": 'T',
											"assetclass": '',
											"assetno": '',
											"apcfystart": 0,
											"currentapc": 0,
											"depfystart": 0,
											"depforyear": 0,
											"accumuldep": 0,
											"bkvalfystart": 0,
											"currbkval": 0
										};
									}
									if (oResult.results[i].BUKRS !== oResult.results[i + 1].BUKRS) {
										/*dataArray.push({
											"assetno": "***** Company Code" + oResult.results[i].BUKRS,
											"grouping": "***** " + oResult.results[i].BUKRS,
											"TXTYP": 'T'
										});*/
										dataArray.push(dataObject3);
										dataObject3 = {
											"TXTYP": 'T',
											"assetclass": '',
											"assetno": '',
											"apcfystart": 0,
											"currentapc": 0,
											"depfystart": 0,
											"depforyear": 0,
											"accumuldep": 0,
											"bkvalfystart": 0,
											"currbkval": 0
										};
									}
								}
							}
							/*dataArray.push({
								"assetno": "* Asset Class" + oResult.results[i - 1].ANLKL,
								"grouping": "* " + oResult.results[i - 1].BUKRS + " - " + oResult.results[i - 1].GSBER + " - " + oResult.results[i - 1].ANLKL,
								"TXTYP": 'T'
							});*/
							dataArray.push(dataObject1);
							/*dataArray.push({
								"assetno": "**** Business Area " + oResult.results[i - 1].GSBER,
								"grouping": "**** " + oResult.results[i - 1].BUKRS + " - " + oResult.results[i - 1].GSBER,
								"TXTYP": 'T'
							});*/

							dataArray.push(dataObject2);
							/*dataArray.push({
								"assetno": "***** Company Code " + oResult.results[i - 1].BUKRS,
								"grouping": "***** " + oResult.results[i - 1].BUKRS,
								"TXTYP": 'T'
							});
*/
							dataArray.push(dataObject3);
							BusyIndicator.hide();
							oTableModel.setData(dataArray);
							resolve(oTableModel);
						},
						error: function (oError) {
							that.onPressNext();
						}

					});

			});

		},

		showCompanyCode: function () {
			var e = new JSONModel();
			e.setData({
				cols: [{
					label: "Client",
					template: "MANDT"
				}, {
					label: "Company Code",
					template: "BUKRS"
				}, {
					label: "Company Name",
					template: "BUTXT"
				}]
			});
			var t = e.getData().cols;
			this._oBasicSearchFieldCompanyCode = new SearchField({
				showSearchButton: false
			});
			this._oValueHelpDialogCompanyCode = sap.ui.xmlfragment("tool_hen_p50.view.fragment.CompanyCodeFragment", this);
			this.getView().addDependent(this._oValueHelpDialogCompanyCode);
			this._oValueHelpDialogCompanyCode.setRangeKeyFields([{
				label: "Company Code",
				key: "BUKRS",
				type: "string",
				typeInstance: new String({}, {
					maxLength: 7
				})
			}]);
			this._oValueHelpDialogCompanyCode.getTableAsync().then(function (t) {
				var o = this.getView().byId("client")._getSelectedItemText();
				if (o == "") {
					o = null;
				}
				var a;
				this._oValueHelpDialogCompanyCode.getFilterBar().setBasicSearch(this._oBasicSearchFieldCompanyCode);
				this.getView().getModel().read("/t001", {
					filters: [new sap.ui.model.Filter({
						path: "MANDT",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: o
					})],
					success: function (e, o) {
						a = new sap.ui.model.json.JSONModel(e.results);
						t.setModel(a);
						t.bindRows("/");
					}
				});
				t.setModel(e, "columns");
				this._oValueHelpDialogCompanyCode.update();
			}.bind(this));
			this._oValueHelpDialogCompanyCode.setTokens(this._oCompanyCode.getTokens());
			this._oValueHelpDialogCompanyCode.open();
		},
		onValueHelpOkPress: function (e) {
			var t = e.getParameter("tokens");
			this._oCompanyCode.setTokens(t);
			this._oValueHelpDialogCompanyCode.close();
		},
		onValueHelpCancelPress: function () {
			this._oValueHelpDialogCompanyCode.close();
		},
		onValueHelpAfterClose: function () {
			this._oValueHelpDialogCompanyCode.destroy();
		},
		onFilterBarSearchCompanyCode: function (e) {
			var t = this._oBasicSearchFieldCompanyCode.getValue(),
				o = e.getParameter("selectionSet");
			var a = o.reduce(function (e, t) {
				if (t.getValue()) {
					e.push(new Filter({
						path: t.getName(),
						operator: FilterOperator.Contains,
						value1: t.getValue()
					}));
				}
				return e;
			}, []);
			a.push(new Filter({
				filters: [new Filter({
					path: "MANDT",
					operator: FilterOperator.Contains,
					value1: t
				}), new Filter({
					path: "BUKRS",
					operator: FilterOperator.Contains,
					value1: t
				}), new Filter({
					path: "BUTXT",
					operator: FilterOperator.Contains,
					value1: t
				})],
				and: false
			}));
			this._filterTableCompanyCode(new Filter({
				filters: a,
				and: true
			}));
		},
		_filterTableCompanyCode: function (e) {
			var t = this._oValueHelpDialogCompanyCode;
			t.getTableAsync().then(function (o) {
				if (o.bindRows) {
					o.getBinding("rows").filter(e);
				}
				if (o.bindItems) {
					o.getBinding("items").filter(e);
				}
				t.update();
			});
		},
// Code Changed 05 Dec 2020
		onSaveVariant: function (oEvent) {
			var variant = {
				"client": this._oClient.getValue(),
				"companycode": {
					"key": this._oCompanyCode.getTokens()[0].getKey(),
					"text": this._oCompanyCode.getTokens()[0].getText()
				},
				"assetno": {
					"key": (this._oAssetNo.getTokens().length > 0 ? this._oAssetNo.getTokens()[0].getKey():''),
					"text": (this._oAssetNo.getTokens().length > 0 ? this._oAssetNo.getTokens()[0].getText():'')
				},
				"assetclass": {
						"key": (this._oAssetClass.getTokens().length > 0 ? this._oAssetClass.getTokens()[0].getKey():''),
					"text": (this._oAssetClass.getTokens().length > 0 ? this._oAssetClass.getTokens()[0].getText():'')
				},
				"year": this._oYear.getValue(),
				"subnumber":this._oSubNumber.getValue(),
				"deparea": this._oDepArea.getValue(),
				"busarea": this._oBusArea.getValue()
			};
			this._oContainer.setItemValue(oEvent.getParameters("name").name, variant);
			this._oContainer.save()
				.fail(function () {

				})
				.done(function () {

				});
		},
		onDeleteVariant: function (sdelItem) {
			for (var i = 0; i < sdelItem.length; i++) {
				this._oContainer.delItem(sdelItem[i]);
			}
			this._oContainer.save()
				.fail(function () {

				})
				.done(function () {

				});
		},
		onChange: function (oEvent) {

			var changedVariant = this._oContainer.getItemValue(oEvent.getSource().getSelectionKey());
			if (oEvent.getSource().getSelectionKey() == "*standard*") {
				this.standardVariantReset();
			} else {
				this._oClient.setValue(changedVariant.client);
				this._oCompanyCode.setTokens(
					[new sap.m.Token({
						key: changedVariant.companycode.key,
						text: changedVariant.companycode.text
					})]
				);
				if(changedVariant.assetno.key !='')
				{this._oAssetNo.setTokens(
					[new sap.m.Token({
						key: changedVariant.assetno.key,
						text: changedVariant.assetno.text
					})]
				);}
				this._oAssetClass.setTokens(
					[new sap.m.Token({
						key: changedVariant.assetclass.key,
						text: changedVariant.assetclass.text
					})]
				);

				this._oYear.setValue(changedVariant.year);

				this._oSubNumber.setValue(changedVariant.subnumber);
				this._oDepArea.setValue(changedVariant.deparea);
				this._oBusArea.setValue(changedVariant.busarea);
			}
		},
		onManage: function (oEvent) {
			this.onDeleteVariant(oEvent.getParameters().deleted);
		},
		standardVariantReset: function () {
			this._oClient.setValue("");
			this._oCustomer.destroyTokens();
			this._oAssetNo.setValue("");
			this._oAssetClass.setValue("");
			this._oSubNumber.setValue("");
			this._oDepArea.setValue("");
			this._oBusArea.setValue("");
			this._oYear.setValue("");
		},
		//New Code 05 Dec 2020
		searchAsset: function () {
			var oComponent = this.getOwnerComponent(); //Returns the Component
			var that = this;
			var oAssetModel = oComponent.getModel("assetHistorySheetSet");
			oAssetModel.read("/assets_search", {
				filters: [new sap.ui.model.Filter({
						path: "BUKRS",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: that._oCompanyCode.getTokens()[0].getKey()
					}),
					new sap.ui.model.Filter({
						path: "ANLN1",
						operator: sap.ui.model.FilterOperator.StartsWith,
						value1: that._oAssetNo.getValue()
					})
				],
				success: function (oResult) {

					that.getView().setModel(new sap.ui.model.json.JSONModel(oResult.results), "asset");

				}
			});
		},
		searchAssetClass: function () {
			var oComponent = this.getOwnerComponent(); //Returns the Component
			var that = this;
			var oAssetModel = oComponent.getModel("assetHistorySheetSet");
			oAssetModel.read("/assetClass_search", {
				filters: [new sap.ui.model.Filter({
						path: "MANDT",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: that._oClient.getValue()
					}),
					new sap.ui.model.Filter({
						path: "ANLKL",
						operator: sap.ui.model.FilterOperator.StartsWith,
						value1: that._oAssetClass.getValue()
					})
				],
				success: function (oResult) {

					that.getView().setModel(new sap.ui.model.json.JSONModel(oResult.results), "assetClass");

				}
			});
		},
		showAssetNo: function () {
			var e = new JSONModel();
			e.setData({
				cols: [{
					label: "Client",
					template: "MANDT"
				},
				{
					label: "Company Code",
					template: "BUKRS"
				},{
					label: "Asset No",
					template: "ANLN1"
				}]
			});
			var t = e.getData().cols;
			this._oBasicSearchFieldAssetNo = new SearchField({
				showSearchButton: false
			});
			this._oValueHelpDialogAssetNo = sap.ui.xmlfragment("tool_hen_p50.view.fragment.AssetNoFragment", this);
			this.getView().addDependent(this._oValueHelpDialogAssetNo);
			this._oValueHelpDialogAssetNo.setRangeKeyFields([{
				label: "Asset No",
				key: "ANLN1",
				type: "string",
				typeInstance: new String({}, {
					maxLength: 7
				})
			}]);
			this._oValueHelpDialogAssetNo.getTableAsync().then(function (t) {
			var o = this.getView().byId("client")._getSelectedItemText();
				if (o == "") {
					o = null;
				}
				var k = this.getView().byId("companycode").getTokens()[0].getKey();
				if (k == "") {
					k = null;
				}
						
				var a;
				BusyIndicator.show(0);
				this._oValueHelpDialogAssetNo.getFilterBar().setBasicSearch(this._oBasicSearchFieldAssetNo);
				this.getView().getModel("assetHistorySheetSet").read("/assets_search", {
					filters: [new sap.ui.model.Filter({
						path: "MANDT",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: o
					}),
					new sap.ui.model.Filter({
						path: "BUKRS",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: k
					})],
					success: function (e, o) {
						a = new sap.ui.model.json.JSONModel(e.results);
						t.setModel(a);
						t.bindRows("/");
						BusyIndicator.hide();
					}
				});
				t.setModel(e, "columns");
				this._oValueHelpDialogAssetNo.update();
			}.bind(this));
			this._oValueHelpDialogAssetNo.setTokens(this._oAssetNo.getTokens());
			this._oValueHelpDialogAssetNo.open();
		},
		onValueHelpOkPressAssetNo: function (e) {
			var t = e.getParameter("tokens");
			this._oAssetNo.setTokens(t);
			this._oValueHelpDialogAssetNo.close();
		},
		onValueHelpCancelPressAssetNos: function () {
			this._oValueHelpDialogAssetNo.close();
		},
		onValueHelpAfterCloseAssetNo: function () {
			this._oValueHelpDialogAssetNo.destroy();
		},
		onFilterBarSearchAssetNo: function (e) {
			var t = this._oBasicSearchFieldAssetNo.getValue(),
				o = e.getParameter("selectionSet");
			var a = o.reduce(function (e, t) {
				if (t.getValue()) {
					e.push(new Filter({
						path: t.getName(),
						operator: FilterOperator.Contains,
						value1: t.getValue()
					}));
				}
				return e;
			}, []);
			a.push(new Filter({
				filters: [new Filter({
					path: "MANDT",
					operator: FilterOperator.Contains,
					value1: t
				}), new Filter({
					path: "ANLN1",
					operator: FilterOperator.Contains,
					value1: t
				})],
				and: false
			}));
			this._filterTableAssetNo(new Filter({
				filters: a,
				and: true
			}));
		},
		_filterTableAssetNo: function (e) {
			var t = this._oValueHelpDialogAssetNo;
			t.getTableAsync().then(function (o) {
				if (o.bindRows) {
					o.getBinding("rows").filter(e);
				}
				if (o.bindItems) {
					o.getBinding("items").filter(e);
				}
				t.update();
			});
		},
		showAssetClass: function () {
			var e = new JSONModel();
			e.setData({
				cols: [{
					label: "Client",
					template: "MANDT"
				},  {
					label: "Asset Class",
					template: "ANLKL"
				}]
			});
			var t = e.getData().cols;
			this._oBasicSearchFieldAssetClass = new SearchField({
				showSearchButton: false
			});
			this._oValueHelpDialogAssetClass = sap.ui.xmlfragment("tool_hen_p50.view.fragment.AssetClassFragment", this);
			this.getView().addDependent(this._oValueHelpDialogAssetClass);
			this._oValueHelpDialogAssetClass.setRangeKeyFields([{
				label: "Asset Class",
				key: "ANLKL",
				type: "string",
				typeInstance: new String({}, {
					maxLength: 7
				})
			}]);
			this._oValueHelpDialogAssetClass.getTableAsync().then(function (t) {
			var o = this.getView().byId("client")._getSelectedItemText();
				if (o == "") {
					o = null;
				}
						
				var a;
				BusyIndicator.show(0);
				this._oValueHelpDialogAssetClass.getFilterBar().setBasicSearch(this._oBasicSearchFieldAssetClass);
				this.getView().getModel("assetHistorySheetSet").read("/assetClass_search", {
					filters: [new sap.ui.model.Filter({
						path: "MANDT",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: o
					})],
					success: function (e, o) {
						a = new sap.ui.model.json.JSONModel(e.results);
						t.setModel(a);
						t.bindRows("/");
						BusyIndicator.hide();
					}
				});
				t.setModel(e, "columns");
				this._oValueHelpDialogAssetClass.update();
			}.bind(this));
			this._oValueHelpDialogAssetClass.setTokens(this._oAssetClass.getTokens());
			this._oValueHelpDialogAssetClass.open();
		},
		onValueHelpOkPressAssetClass: function (e) {
			var t = e.getParameter("tokens");
			this._oAssetClass.setTokens(t);
			this._oValueHelpDialogAssetClass.close();
		},
		onValueHelpCancelPressAssetClass: function () {
			this._oValueHelpDialogAssetClass.close();
		},
		onValueHelpAfterCloseAssetClass: function () {
			this._oValueHelpDialogAssetClass.destroy();
		},
		onFilterBarSearchAssetClass: function (e) {
			var t = this._oBasicSearchFieldAssetClass.getValue(),
				o = e.getParameter("selectionSet");
			var a = o.reduce(function (e, t) {
				if (t.getValue()) {
					e.push(new Filter({
						path: t.getName(),
						operator: FilterOperator.Contains,
						value1: t.getValue()
					}));
				}
				return e;
			}, []);
			a.push(new Filter({
				filters: [new Filter({
					path: "MANDT",
					operator: FilterOperator.Contains,
					value1: t
				}), new Filter({
					path: "ANLKL",
					operator: FilterOperator.Contains,
					value1: t
				})],
				and: false
			}));
			this._filterTableAssetClass(new Filter({
				filters: a,
				and: true
			}));
		},
		_filterTableAssetClass: function (e) {
			var t = this._oValueHelpDialogAssetClass;
			t.getTableAsync().then(function (o) {
				if (o.bindRows) {
					o.getBinding("rows").filter(e);
				}
				if (o.bindItems) {
					o.getBinding("items").filter(e);
				}
				t.update();
			});
		}

	});
});