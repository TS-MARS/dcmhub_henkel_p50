sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/Fragment',
	"tool_hen_p50/formatter/formatter",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/Filter",
	'sap/ui/export/Spreadsheet',
	'sap/ui/export/library',
	'sap/m/MessageBox',
	"sap/m/SearchField",
	"sap/ui/model/type/String",
	"sap/m/Token",
	"sap/ui/model/FilterOperator",
	"sap/ui/table/Table",
	"sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/ButtonType"
], function (Controller, ODataModel, JSONModel, Fragment, formatter, BusyIndicator, Filter, Spreadsheet, exportLibrary, MessageBox,
	SearchField, String, Token, FilterOperator, Table, RowAction, RowActionItem, Dialog, Button, ButtonType) {
	"use strict";
	var EdmType = exportLibrary.EdmType;
	var namespace = "tool_hen_p50";

	return Controller.extend(namespace + ".controller.reporting", {
		formatter: formatter,
		onInit: function () {

			//backtab changes
			this._oDialogSelectionKey = [];
			var techFlag;
			var oReadPromise = [];

			this.getOwnerComponent().getModel("toolTableServiceSet").attachRequestSent(function (oEvent) {});
			this.getOwnerComponent().getModel("toolTableServiceSet").attachRequestCompleted(function (oEvent) {});
			var oModel = new JSONModel("model/mock.json");
			this.getView().setModel(oModel);
			this.getView().setModel(new JSONModel(), "AllTableResult"); // 1001
			this.getView().byId("IdNavigationList").setModel(this.getOwnerComponent().getModel("navigationSet"));
			this.getView().addStyleClass("sapUiSizeCompact"); // make everything inside this View appear in Compact mode
			this._paraStatement = "";
			this._cancel = "";
			// Begin 0901
		//	this.getOwnerComponent().getModel("tables").attachRequestSent(function (oEvent) {
				//BusyIndicator.show(0);
		//	});
			// this.getOwnerComponent().getModel("tables").attachRequestCompleted(function (oData) {
			// 	if (this.byId("myTableTabContainer")._getSelectedItemContent() !== null) {
			// 		var oContent;
			// 		if (this.byId("myTableTabContainer")._getSelectedItemContent()[1] !== undefined) {
			// 			oContent = this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent();
			// 		} else {
			// 			oContent = this.byId("myTableTabContainer")._getSelectedItemContent()[0].getContent();
			// 		}

			// 		oContent.forEach(function (oSelectedItemTable) {
			// 			oSelectedItemTable.getContent()[0].setBusy(false);
			// 			if (oSelectedItemTable.getContent()[0].getBinding(
			// 					'rows') !== undefined) {
			// 				var ilength = oSelectedItemTable.getContent()[0].getBinding(
			// 					'rows').getLength();
			// 				if (ilength !== 0) {
			// 					oSelectedItemTable.getContent()[0].getModel(
			// 							"settings")
			// 						.getData().columns[0].count = ilength;
			// 					oSelectedItemTable.getContent()[0].getModel(
			// 							"settings")
			// 						.refresh();
			// 				}
			// 			}
			// 		}.bind(this));

			// 	}
			// }.bind(this));

			//get application settings
			var self = this;
			var oPersonalizer = this.getPersonalizationInstance("myViewSettings", "Technical");
			oReadPromise = oPersonalizer.getPersData()
				.done(function (oPersData) {
					if (oPersData !== undefined) {
						techFlag = oPersData;
						self._techFlag = techFlag;
					} else {
						techFlag = false;
						self._techFlag = techFlag;
					}
				})
				.fail(function () {});

		},

		// View Event Listeners
		// Main Launchpad tile 
		onNavButtonPressMain: function () {
			this._router = sap.ui.core.UIComponent.getRouterFor(this);
			this._router.navTo("launchpad", {}, true);
		},

		onSideNavButtonPress: function () {
			var oToolPage = this.byId("toolPage");
			oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
		},
		// Navigation item event selection
		// This will load the list of tables based on the component list
		onItemSelect: function (oEvent) {
			this.byId("pageContainer").to(this.getView().createId("page1"));
			var oTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.ObjectMarker({
						type: "Favorite",
						visible: "{= ${FAV} === 'true'}"
					}),
					new sap.m.Text({
						text: "{DDTEXT}",
						wrapping: false
					}),
					new sap.m.Text({
						text: "{TABLEID}",
						wrapping: false
					})
				]
			});
			//	var oModel = oEvent.getParameter("item").getModel();
			var oModel = oEvent.getSource().getModel();
			var oTable = new sap.m.Table({
				mode: "MultiSelect",
				columns: [new sap.m.Column({
					width: "5em",
					header: new sap.m.Label({
						text: this.getView().getModel("i18n").getResourceBundle().getText("Fav")
					})
				}), new sap.m.Column({
					header: new sap.m.Label({
						text: this.getView().getModel("i18n").getResourceBundle().getText("tabledesc")
					})
				}), new sap.m.Column({
					header: new sap.m.Label({
						text: this.getView().getModel("i18n").getResourceBundle().getText("tablename")
					})
				})]
			});

			//oTable.bindItems(oEvent.getParameter("item").getBindingContext().getPath() + "/TableSet", oTemplate);
			oTable.bindItems({
				path: oEvent.getSource().getBindingContext().getPath() + "/TableSet",
				template: oTemplate,
				templateShareable: false
			});
			oModel.setSizeLimit(1000);
			oTable.setModel(oModel);

			var oPanel = sap.ui.xmlfragment(namespace + ".view.fragment.tables", this);

			var newContainer = new sap.m.TabContainerItem({
				//name: oEvent.getParameter("item").getText(),
				name: oEvent.getSource().getText(),
				modified: false
			});
			newContainer.addContent(
				oTable
			);
			newContainer.addContent(
				oPanel
			);
			var tabContainer = this.byId("myTableTabContainer");

			tabContainer.addItem(
				newContainer
			);
			tabContainer.setSelectedItem(newContainer);
			tabContainer.fireItemSelect();
			this.byId("nextButtonId").setVisible(true);
		},

		onSettingSelect: function (oEvent) {

			var aDataAppKey = [];
			var appSettings = {
				columns: []
			};

			appSettings.columns.push({
				name: this.getView().getModel("i18n").getResourceBundle().getText("techview"),
				technical: this._techFlag
			});
			appSettings.columns.push({
				name: this.getView().getModel("i18n").getResourceBundle().getText("resetpers"),
				technical: false
			});
			aDataAppKey.push(appSettings);
			var oAppColumnModel = new JSONModel(aDataAppKey);

			if (!this._oDialogAppSetting) {
				Fragment.load({
					name: namespace + ".view.fragment.ApplicationSetting",
					controller: this
				}).then(function (oDialog) {
					this._oDialogAppSetting = oDialog;
					this._oDialogAppSetting.setModel(oAppColumnModel);
					this.getView().addDependent(oDialog);
					this._oDialogAppSetting.open();
				}.bind(this));
			} else {
				this._oDialogAppSetting.setModel(oAppColumnModel);
				this._oDialogAppSetting.open();
			}
		},

		onPressOkSetting: function (oEvent) {
			var oArray = this._oDialogAppSetting.getModel().getData("columns"); //.columns[0];//[0].technical;
			var flag = oArray[0].columns[0].technical;
			this._techFlag = flag;
			this.savePersonalization("myViewSettings", "Technical", flag);
			// Save the technical view settings flag in persistence

			// Check if reset is set
			var reset = oArray[0].columns[1].technical;
			this._persReset = reset;
			this._oDialogAppSetting.close();
		},
		onPressCloseSetting: function (oEvent) {
			this._oDialogAppSetting.close();
		},
		// Next button on the main page at the footer. Navigates to the main table content display
		onPressNext: function (oEvent) {
			// selection filter function call
			this._getKeyForPreFilterValue(this._getSelectTableData());
		},

		// shows selected filters
		handleConfirm: function (oEvent) {
			if (oEvent.getParameters().filterString) {

				var mParams = oEvent.getParameters();

				/* Get the tables that is selected */
				var oData = this._getSelectTableData();
				var aDataColumnKey = [];
				var self = this;
				oData.table.forEach(function (oTableId, iTableIndex) {

					var oDataColumn = {
						columns: []
					};
					var i, item;

					for (i = 0; i < mParams.filterItems.length; i += 1) {
						item = mParams.filterItems[i];
						var sKey = item.getKey();
						var aSplit = item.getText().split("-"),
							sTable = aSplit[0],
							sName = aSplit[1];
						if (sTable === oTableId.TableId) {

							self._oDialogFilter.getModel().getData().forEach(function (oTab) {

								oTab.columns.forEach(function (columns) {

									//Check if all mandatory fields have value associated to it
									if (columns.column_property === sKey && columns.column_tab === sTable) {
										oDataColumn.columns.push({
											column_width: "11rem", // 1001
											column_name: sName,
											column_property: sKey,
											column_visible: true,
											column_filter: columns.column_filter,
											column_sort: false,
											column_tab: sTable,
											column_tab_desc: oTableId.TableDescription,
											column_mandatory: columns.column_mandatory,
											column_parameter: columns.column_parameter,
											column_default: columns.column_default,
											column_checktable: columns.column_checktable,
											column_type: columns.column_type
										});
									}
								});
							});
						}
					}
					aDataColumnKey.push(oDataColumn);
					if (self._techFlag === true) {
						self.savePersonalization("myTablesTech", oTableId.TableId, oDataColumn);
					} else {
						self.savePersonalization("myTables", oTableId.TableId, oDataColumn);
					}
				});

				var oTableColumnModel = new JSONModel(aDataColumnKey);
				//backtab changes start
				var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
				this._oDialogSelectionKey[selectedTab].setModel(oTableColumnModel);
				//backtab changes end				
				//	this._oDialogSelectionKey.setModel(oTableColumnModel);
				this._setDefaultValues();
			}
		},

		/* Testing the filter options*/
		onFilter: function () {

			// creates dialog list if not yet created
			// if (!this._oDialogFilter) {
			// 	this._oDialogFilter = {};
			// }

			var oModel = this.getView().getModel("tableModelKeyFull");
			oModel.setSizeLimit(500);
			if (!this._oDialogFilter) {
				Fragment.load({
					name: namespace + ".view.fragment.DialogFilter",
					controller: this
				}).then(function (oDialog) {
					this._oDialogFilter = oDialog;
					this._oDialogFilter.setModel(oModel);
					this.getView().addDependent(oDialog);
					this._oDialogFilter.open();
				}.bind(this));
			} else {
				this._oDialogFilter.setModel(oModel);
				this._oDialogFilter.open();
			}
		},

		onChange: function (oEvent) {

			var id = oEvent.getParameters("id");
			var oInput = oEvent.getSource();

			//Input text
			var iText = id.value;
			var from;
			var to;
			var operation;
			var boolean;
			var range = false;
			// Check if there are any conditions entered by user
			//Check for range
			var n = iText.indexOf("...");
			if (n !== -1) //There is a hit
			{
				range = true;
				from = iText.substring(0, n);
				to = iText.substring(n + 3, iText.length);
				operation = sap.ui.model.FilterOperator.BT;
				oInput.addToken(
					new Token({
						text: iText,
						key: "range_0"
					}).data("range", {
						"exclude": false,
						"operation": operation,
						"keyField": iText,
						"value1": from,
						"value2": to
					})
				);
			}
			// Check for wildcards
			var n = iText.indexOf("*");
			if (n !== -1) //There is a hit
			{
				range = true;
				operation = sap.ui.model.FilterOperator.Contains;
				//Check if the wildcard is at the start
				boolean = iText.startsWith("*")

				if (boolean === true) {
					boolean = iText.endsWith("*");
					if (boolean === true) {
						operation = sap.ui.model.FilterOperator.Contains
						from = iText.substring(1, iText.length - 1);
					} else {
						operation = sap.ui.model.FilterOperator.EndsWith
						from = iText.substring(1, iText.length);
					}
				} else {
					//Check if the wildcard is at the end
					boolean = iText.endsWith("*");
					if (boolean === true && operation === sap.ui.model.FilterOperator.EndsWith) {
						operation = sap.ui.model.FilterOperator.Contains
						from = iText.substring(1, iText.length - 1);
					} else {
						operation = sap.ui.model.FilterOperator.StartsWith
						from = iText.substring(0, iText.length - 1);
					}
				}
				to = "";
				oInput.addToken(
					new Token({
						text: iText,
						key: "range_0"
					}).data("range", {
						"exclude": false,
						"operation": operation,
						"keyField": iText,
						"value1": from,
						"value2": to
					})
				);
			}

			var n = iText.indexOf("<");
			if (n !== -1) //There is a hit
			{
				range = true;
				var n = iText.search("<=");
				if (n !== -1) //There is a hit
				{
					from = iText.substring(2, iText.length);
					operation = sap.ui.model.FilterOperator.LE;
					oInput.addToken(
						new Token({
							text: iText,
							key: "range_0"
						}).data("range", {
							"exclude": false,
							"operation": operation,
							"keyField": iText,
							"value1": from,
							"value2": ''
						})
					);
				} else {
					from = iText.substring(1, iText.length);
					operation = sap.ui.model.FilterOperator.LT;
					oInput.addToken(
						new Token({
							text: iText,
							key: "range_0"
						}).data("range", {
							"exclude": false,
							"operation": operation,
							"keyField": iText,
							"value1": from,
							"value2": ''
						})
					);
				}
			}

			var n = iText.indexOf(">");
			if (n !== -1) //There is a hit
			{
				range = true;
				var n = iText.search(">=");
				if (n !== -1) //There is a hit
				{
					from = iText.substring(2, iText.length);
					operation = sap.ui.model.FilterOperator.GE;
					oInput.addToken(
						new Token({
							text: iText,
							key: "range_0"
						}).data("range", {
							"exclude": false,
							"operation": operation,
							"keyField": iText,
							"value1": from,
							"value2": ''
						})
					);
				} else {

					from = iText.substring(1, iText.length);
					operation = sap.ui.model.FilterOperator.GT;
					oInput.addToken(
						new Token({
							text: iText,
							key: "range_0"
						}).data("range", {
							"exclude": false,
							"operation": operation,
							"keyField": iText,
							"value1": from,
							"value2": ''
						})
					);
				}
			}
			var n = iText.indexOf("!(=");
			if (n !== -1) //There is a hit
			{
				range = true;
				from = iText.substring(3, iText.length - 1);
				operation = sap.ui.model.FilterOperator.NE;
				oInput.addToken(
					new Token({
						text: iText,
						key: "range_0"
					}).data("range", {
						"exclude": true,
						"operation": operation,
						"keyField": iText,
						"value1": from,
						"value2": ''
					})
				);
			}
			if (range === false) {
				var key = id.value;
				var desc = key + " (" + key + ")";
				oInput.addToken(
					new Token({
						text: desc,
						key: key
					})
				);
			}

			oInput.setValue("");
		},
		onPressCloseSelectionKey: function () {
			//backtab changes start
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
			this._oDialogSelectionKey[selectedTab].close();
			//backtab changes end			
			//			this._oDialogSelectionKey.close();
		},
		onPressOkSelectionKey: function (oEvent) {
			var oData = this._getSelectTableData();
			var oTableModel = new JSONModel(oData);
			this.getView().setModel(oTableModel);

			// Process validation first
			var checkOK = this._checkInputFields();

			if (checkOK === true) //Only Proceed if everything OK.
			{
				this._setPreFilterValue();
				this._setTable(oData);
				this.byId("myTableTabContainer")._getSelectedItemContent()[1].setVisible(true);
				this.byId("myTableTabContainer")._getSelectedItemContent()[0].setVisible(false);
				//backtab changes start
				var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
				this._oDialogSelectionKey[selectedTab].close();
				//backtab changes end				
				//				this._oDialogSelectionKey.close();
			}
		},
		onPressBackgroundSelectionKey: function (oEvent) {
			if (!this._oDialogFilename) {
				Fragment.load({
					name: namespace + ".view.fragment.FileName",
					controller: this
				}).then(function (oDialog) {
					this._oDialogFilename = oDialog;
					this.getView().addDependent(oDialog);
					this._oDialogFilename.open();
				}.bind(this));
			} else {
				this._oDialogFilename.open();
			}
			this._oDialogSelectionKey.close();
		},
		onPressOkFilename: function (oEvent) {
			var self = this;
			var fullSQL;
			var viewname;
			var filter = [];
			var where = "";
			var filename = sap.ui.getCore().byId("filename").getValue();
			var oData = this._getSelectTableData();
			var oTableModel = new JSONModel(oData);
			this.getView().setModel(oTableModel);

			// Process validation first
			var checkOK = this._checkInputFields();

			if (checkOK === true) //Only Proceed if everything OK.
			{
				this._setPreFilterValue();
				this._oDialogSelectionKey.getModel().getData().forEach(function (oTab) {
					viewname = oTab.columns[0].column_tab;
					filter = [];
					var count = 0;
					self.getView().getModel("preSelectedFilter").getData().forEach(function (oPreSelectedFilter) {
						count = count + 1;
						if (count !== 1) {
							where = where + " AND "
						}
						switch (oPreSelectedFilter.ColOperator) {
						case "EQ":
							where = where + oPreSelectedFilter.FieldName + " = '" + oPreSelectedFilter.ColFilter + "'";
							break;
						case "Contains":
							where = where + oPreSelectedFilter.FieldName + " LIKE '%" + oPreSelectedFilter.ColFilter + "%'";
							break;
						case "EndsWith":
							where = where + oPreSelectedFilter.FieldName + " LIKE '%" + oPreSelectedFilter.ColFilter + "'";
							break;
						case "StartsWith":
							where = where + oPreSelectedFilter.FieldName + " LIKE '" + oPreSelectedFilter.ColFilter + "%'";
							break;
						case "BT":
							where = where + oPreSelectedFilter.FieldName + " BETWEEN '" + oPreSelectedFilter.ColFilter + "' AND '" + oPreSelectedFilter
								.ColFilterTo + "'";
							break;
						case "GT":
							where = where + oPreSelectedFilter.FieldName + " >'" + oPreSelectedFilter.ColFilter + "'";
							break;
						case "LT":
							where = where + oPreSelectedFilter.FieldName + " <'" + oPreSelectedFilter.ColFilter + "'";
							break;
						case "GE":
							where = where + oPreSelectedFilter.FieldName + " >='" + oPreSelectedFilter.ColFilter + "'";
							break;
						case "LE":
							where = where + oPreSelectedFilter.FieldName + " <='" + oPreSelectedFilter.ColFilter + "'";
							break;
						}

					});
				});
				//Run the background job
				$.ajax({
					type: "GET",
					contentType: "application/json",
					url: "../../xsjs/backgroundSQL.xsjs",
					data: {
						"filename": filename,
						"system": "SDA",
						"viewname": viewname,
						"where": where
					},
					dataType: "json",
					async: true,
					success: function (data, textStatus, jqXHR) {},
					error: function (oError) {
						var errText = $.parseHTML(oError.responseText);
					}

				});
			}
			this._oDialogFilename.close();
		},
		onPressCloseFilename: function (oEvent) {
			this._oDialogFilename.close();
		},
		onTableNavBack: function () {
			this.byId("myTableTabContainer")._getSelectedItemContent()[1].setVisible(false);
			this.byId("myTableTabContainer")._getSelectedItemContent()[0].setVisible(true);
			//backtab changes start
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
			this._oDialogSelectionKey[selectedTab].open();
			//backtab changes end			
			//			this._oDialogSelectionKey.open();
		},

		// Internal function calls
		// get list of tables selected in the checkbox
		_getSelectTableData: function () {
			var oData = {
				table: []
			};

			var aSelectedItems = this.byId("myTableTabContainer")._getSelectedItemContent()[0].getSelectedItems();
			aSelectedItems.forEach(function (oItem) {
				var oTable = {};
				oTable.TableDescription = oItem.getBindingContext().getProperty("DDTEXT");
				oTable.TableId = oItem.getBindingContext().getProperty("TABLEID");
				oData.table.push(oTable);
			});
			return oData;
		},

		// Table Keys processing dialog processing and display
		_openKeySelectionFragment: function () {
			var oModel = this.getView().getModel("tableModelKey");
			oModel.setSizeLimit(500);
			//backtab changes start
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();

			if (!this._oDialogSelectionKey[selectedTab]) {
				Fragment.load({
					name: namespace + ".view.fragment.KeySelectionFragment",
					controller: this
				}).then(function (oDialog) {
					this._oDialogSelectionKey[selectedTab] = oDialog;
					this._oDialogSelectionKey[selectedTab].setModel(oModel);
					this.getView().addDependent(oDialog);
					this._setDefaultValues();
					this._oDialogSelectionKey[selectedTab].open();
					//					this.getSearchHelpValue();						
				}.bind(this));
			} else {

				this._oDialogSelectionKey[selectedTab].setModel(oModel);
				this._setDefaultValues();
				this._oDialogSelectionKey[selectedTab].open();
				//					this.getSearchHelpValue();					
			}
		},

		_checkInputFields: function () {

			var checkFlag;
			var self = this;

			// this._oDialogSelectionKey.getModel().getData().forEach(function (oTab) {
			// 	oTab.columns.forEach(function (oColumn) {

			// 		if (checkFlag !== false) {
			// 			if (oColumn.column_mandatory === true) {
			// 				self._oDialogSelectionKey.getContent()[0].getContent().forEach(function (oContent, ItableIndex) {
			//backtab changes start
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
			this._oDialogSelectionKey[selectedTab].getModel().getData().forEach(function (oTab) {
				oTab.columns.forEach(function (oColumn) {

					if (checkFlag !== false) {
						if (oColumn.column_mandatory === true) {
							self._oDialogSelectionKey[selectedTab].getContent()[1].getContent().forEach(function (oContent, ItableIndex) {
								//backtab changes end								
								oContent.getItems().forEach(function (oItem, iRowIndex) {
									var oInput = oItem.getCells()[1];
									var oInput1 = oItem.getCells()[2];
									if (oColumn.column_property === oInput.getProperty("text")) {
										var tokens = oInput1.getTokens();
										if (tokens.length === 0) {
											MessageBox.show(

												self.getView().getModel("i18n").getResourceBundle().getText("mandatoryfields"), {
													icon: MessageBox.Icon.ERROR,
													title: self.getView().getModel("i18n").getResourceBundle().getText("inputval"),
													actions: [MessageBox.Action.CLOSE],
													onClose: function (oAction) {
														/ * do something * /
													}
												}
											);
											checkFlag = false;
										}
									}
								})
							});
						}
					}
				});
			});

			if (checkFlag === undefined) {
				checkFlag = true;
			}
			return checkFlag;
		},

		_setDefaultValues: function () {
			var self = this;
			// this._oDialogSelectionKey.getModel().getData().forEach(function (oTab) {
			// 	oTab.columns.forEach(function (oColumn) {			
			// self._oDialogSelectionKey.getContent()[0].getContent().forEach(function (oContent, ItableIndex) {
			//backtab changes start
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
			// variant Management Changes Start
			this._oDialogSelectionKey[selectedTab].getContent()[0].clearVariantSelection();
			// variant Management Changes End
			this._oDialogSelectionKey[selectedTab].getModel().getData().forEach(function (oTab) {
				oTab.columns.forEach(function (oColumn) {
					self._oDialogSelectionKey[selectedTab].getContent()[1].getContent().forEach(function (oContent, ItableIndex) {
						//backtab changes end				
						oContent.getItems().forEach(function (oItem, iRowIndex) {
							var oInput = oItem.getCells()[1];
							var oInput1 = oItem.getCells()[2];
							if (oColumn.column_default !== null && oColumn.column_property === oInput.getProperty("text")) {
								var text = oColumn.column_default;
								oInput1.setTokens([
									new Token({
										text: text,
										key: text
									})
								]);
							}
						})
					});
				});
			});
		},

		_setPreFilterValue: function () {
			var aEntry = [];
			var first = "";
			var paraStatement = "";
			var self = this;
			// this._oDialogSelectionKey.getModel().getData().forEach(function (oTab) {
			// 	oTab.columns.forEach(function (oColumn) {

			// self._oDialogSelectionKey.getContent()[0].getContent().forEach(function (oContent, ItableIndex) {
			//backtab changes start
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
			this._oDialogSelectionKey[selectedTab].getModel().getData().forEach(function (oTab) {
				oTab.columns.forEach(function (oColumn) {

					self._oDialogSelectionKey[selectedTab].getContent()[1].getContent().forEach(function (oContent, ItableIndex) {
						//backtab changes end				
						oContent.getItems().forEach(function (oItem, iRowIndex) {
							var oInput = oItem.getCells()[1];
							var oInput1 = oItem.getCells()[2];
							var tokenstokey = "";

							if (oColumn.column_property === oInput.getProperty("text")) {
								var tokens = oInput1.getTokens();

								tokens.map(function (oToken) {
									if (oToken.data("range")) {
										var oRange = oToken.data("range");

										var oEntry = {
											UserName: "BETA_USER",
											TabName: oColumn.column_tab,
											ColOperator: oRange.exclude ? "NE" : oRange.operation,
											ColFilter: oRange.value1,
											ColFilterTo: oRange.value2,
											FieldName: oColumn.column_property
										};
										aEntry.push(oEntry);
									} else {
										var oEntry = {
											UserName: "BETA_USER",
											TabName: oColumn.column_tab,
											ColOperator: 'EQ',
											ColFilter: oToken.getKey(),
											ColFilterTo: oToken.getKey(),
											FieldName: oColumn.column_property
										};
										aEntry.push(oEntry);
									}
								});

								if (tokens.length !== 0) {
									//generate input parameter statement
									if (oColumn.column_parameter === "X") {
										if (first === "") {
											paraStatement = "Parameters("
											first = "X";
										} else {
											paraStatement = paraStatement + ",";
										}

										paraStatement = paraStatement + "IP_" + oColumn.column_property + "='" + oInput1.getTokens()[0].getKey() + "'";
									}
									// In some cases - the provided selections doesnt fit the standard application and further customer specific enhancement
									// is required. The column_parameter (Z) handles an custom code. Its specific to table and field and the parameter is maintained in 
									// the table config
									if (oColumn.column_parameter === "Z") {
										//Insert code here

									}

								}
							}
						})
					});
				});
			});
			if (first !== "") {
				paraStatement = paraStatement + ")/Results";
			}
			this._paraStatement = paraStatement;

			var oModel = new JSONModel(aEntry);
			this.getView().setModel(oModel, "preSelectedFilter");
			//	this.getOwnerComponent().getModel("toolTableServiceSet").update("/UiTableAttrSet(USER_ID='"+oEntry.UserName+"')", oEntry);
		},

		// get table keys for filter selection
		_getKeyForPreFilterValue: function (oData, trigger) {

			//oData is a list of tables selected
			var aDataColumnKey = [];
			var aDataColumnKeyPers = [];
			var aPromiseAll = [];
			var oReadPromise = [];
			var aDataColumnsAll = [];
			var flag;
			var that = this; //Variant
			var oComponent = this.getOwnerComponent(); //Variant
			
			oData.table.forEach(function (oTableId, iTableIndex) {

				// for each table retrieve the personalization
				if (this._techFlag === true) {
					var oPersonalizer = this.getPersonalizationInstance("myTablesTech", oTableId.TableId);
				} else {
					var oPersonalizer = this.getPersonalizationInstance("myTables", oTableId.TableId);
				}
				var oPersonalizationService = sap.ushell.Container.getService("Personalization");
				var oScope = {
					keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
					writeFrequency: oPersonalizationService.constants.writeFrequency.HIGH,
					clientStorageAllowed: true,
					validity: Infinity
				};
				var variantModel;
				oPersonalizationService.getContainer(namespace + oTableId.TableId, oScope, oComponent)
					.fail(function () {
						jQuery.sap.log.error("Loading personalization data failed.");
					})
					.done(function (oContainer) {
						that._oContainer = oContainer;
						variantModel = new sap.ui.model.json.JSONModel(oContainer.getItemKeys());
						that.getView().setModel(variantModel, "variants");
					});
					// variant Management End
				oReadPromise = oPersonalizer.getPersData()
					.done(function (oPersData) {
						if (oPersData !== undefined) {
							aDataColumnKeyPers.push(oPersData);
						} else {
							flag = 'X';
						}
					})
					.fail(function () {
						flag = 'X'; // There is one table that has no personalization
					});
				if (this._persReset === true) {
					flag = 'X'; //Dont forget to remove
					this._persReset = false;
				}
				var sCurrentLocale = sap.ui.getCore().getConfiguration().getSAPLogonLanguage();
				var sLanguage = sCurrentLocale.slice(0, 1);
				var oDataColumn = {
					columns: []
				};
				aPromiseAll.push(new Promise(function (resolve, reject) {
					// Retrieve the column fields that are keys
					this.getOwnerComponent().getModel("toolTableServiceSet").read(
						"/TableFieldLabelSetParameters(IP_TABNAME='" + oTableId.TableId + "',IP_DDLANGUAGE='" + sLanguage +
						"',IP_KEYFLAG='*')/Results", {
							sorters: [new sap.ui.model.Sorter("MANDATORY",true),new sap.ui.model.Sorter("POSITION")],
							success: function (oResult) {
								for (var i = 0; i < oResult.results.length; i++) {
									var property = oResult.results[i];
									var mandatory = false;
									// Convert mandatory flag to a true/false
									if (property.MANDATORY === "X") {
										mandatory = true;
									}

									if (this._techFlag === true) {
										oDataColumn.columns.push({
											column_width: "3rem", // 1001
											column_name: property.FIELDNAME,
											column_property: property.FIELDNAME,
											column_visible: true,
											column_index: i,
											column_filter: "",
											column_filterto: "",
											column_sort: false,
											column_tab: oTableId.TableId,
											column_tab_desc: oTableId.TableDescription,
											column_mandatory: mandatory,
											column_parameter: property.PARAMETER,
											column_default: property.DEFAULT,
											column_checktable: property.CHECKTABLE,
											column_type: property.TYPE
										});
									} else {
										oDataColumn.columns.push({
											column_width: "11rem", // 1001
											column_name: property.SCRTEXT_M,
											column_property: property.FIELDNAME,
											column_visible: true,
											column_index: i,
											column_filter: "",
											column_filterto: "",
											column_sort: false,
											column_tab: oTableId.TableId,
											column_tab_desc: oTableId.TableDescription,
											column_mandatory: mandatory,
											column_parameter: property.PARAMETER,
											column_default: property.DEFAULT,
											column_checktable: property.CHECKTABLE,
											column_type: property.TYPE
										});
									}
								}

								aDataColumnKey.push(oDataColumn);
								resolve();
							}.bind(this),
							error: function (oError) {

								reject();
							}
						});
				}.bind(this)));
			}.bind(this));
			Promise.all(aPromiseAll, oReadPromise).then(function (values) {

				// Check personalization data All tables must have if not show all
				if (aDataColumnKeyPers !== undefined && flag !== 'X') {
					var oTableColumnModel = new JSONModel(aDataColumnKeyPers);
					this.getView().setModel(oTableColumnModel, "tableModelKey");
					var oTableColumnModelFull = new JSONModel(aDataColumnKey);
					this.getView().setModel(oTableColumnModelFull, "tableModelKeyFull");
				} else {
					var oTableColumnModel = new JSONModel(aDataColumnKey);
					this.getView().setModel(oTableColumnModel, "tableModelKey");
					this.getView().setModel(oTableColumnModel, "tableModelKeyFull");
				}
				if (trigger !== 'X') {
					this._openKeySelectionFragment();
				}
				//this._openKeySelectionFragment();
			}.bind(this)).catch(function (reason) {});

		},
		_setTable: function (oData) {
			//	BusyDialog.open();		
			//Clear table
			//Clear table
			var that = this;
			//	BusyIndicator.show(0);
			this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent().forEach(function (oItem) {
				var oTemModel = new JSONModel();
				oItem.getContent()[0].setModel(oTemModel);
				oItem.getContent()[0].unbindRows();

				var oTemModel1 = new JSONModel();
				var oTemModel2 = new JSONModel();
				var oTemModel3 = new JSONModel();
				oItem.getContent()[0].setModel(oTemModel1, "tables");
				oItem.getContent()[0].setModel(oTemModel2, "settings");
				this.getView().setModel(oTemModel3, "table");
			}.bind(this));
			var oReadPromise = [];
			oData.table.forEach(function (oTableId, iTableIndex) {

				var sCurrentLocale = sap.ui.getCore().getConfiguration().getSAPLogonLanguage();
				var sLanguage = sCurrentLocale.slice(0, 1);
				var oDataColumn = {
					columns: []
				};
				var oDataColumnAll = {
					columns: []
				};
				this.getOwnerComponent().getModel("toolTableServiceSet").read(
					"/TableFieldLabelSetParameters(IP_TABNAME='" + oTableId.TableId + "',IP_DDLANGUAGE='" + sLanguage +
					"',IP_KEYFLAG='*')/Results", {
						sorters: [new sap.ui.model.Sorter("POSITION")],
						//						filters: aFilters,
						success: function (oResult) {
							// add rows in the standard sap tables
							// Begin 0901
							var iCount = 0;
							if (this.getView().getModel("AllTableResult").getData()[oTableId.TableId.toLowerCase()] !== undefined) {
								iCount = this.getView().getModel("AllTableResult").getData()[oTableId.TableId.toLowerCase()].length;
							}

							for (var i = 0; i < oResult.results.length; i++) {
								var property = oResult.results[i];
								if (this._techFlag === true) {
									oDataColumn.columns.push({
										column_width: "11rem", // 1001
										column_name: property.FIELDNAME, //property.SCRTEXT_M,
										column_property: property.FIELDNAME,
										column_visible: true,
										column_index: i,
										column_filter: "",
										column_filterto: "",
										column_sort: false,
										column_tab: oTableId.TableId,
										column_tab_desc: oTableId.TableDescription,
										count: iCount,
										column_type: property.TYPE
									});
								} else {
									oDataColumn.columns.push({
										column_width: "11rem", // 1001
										column_name: property.SCRTEXT_M,
										column_property: property.FIELDNAME,
										column_visible: true,
										column_index: i,
										column_filter: "",
										column_filterto: "",
										column_sort: false,
										column_tab: oTableId.TableId,
										column_tab_desc: oTableId.TableDescription,
										count: iCount,
										column_type: property.TYPE
									});
								}
							}

							// for each table retrieve the personalization
							if (this._techFlag === true) {
                                var oPersonalizer = this.getPersonalizationInstance("myTablesSettingTech", namespace+"_" + oTableId.TableId.toUpperCase());
                            } else {
                                var oPersonalizer = this.getPersonalizationInstance("myTablesSetting", namespace+"_" + oTableId.TableId.toUpperCase());
                            }

							oReadPromise = oPersonalizer.getPersData()
								.done(function (oPersData) {
									if (oPersData !== undefined) {
										oDataColumn = oPersData;
									}
								})
								.fail(function () {

								});
							var oTableColumnModel = new JSONModel(oDataColumn); // model for just keys for selections
							var oTableColumnModelAll = new JSONModel(oDataColumnAll); // model for all columns

							this.getView().setModel(oTableColumnModelAll, "tableSettings");
							oTableColumnModel.setSizeLimit(oDataColumn.columns.length);
							this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].setVisible(true);
							this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setModel(
								oTableColumnModel, "tables");
							this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setModel(
								oTableColumnModel, "settings");
							this.getView().setModel(this.getOwnerComponent().getModel("tables"), "table");
							var oTableModel = this.getOwnerComponent().getModel("tables");

							//oTableModel.metadataLoaded().then(function(){
						//	BusyIndicator.show(0);

							// Begin 1001
							this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setModel(this.getView()
								.getModel("AllTableResult"));
							// End 1001
							//this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].getTable().setModel(this.getOwnerComponent().getModel(
							//	"tables"));
							// this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setModel(
							// 	oTableModel);
							// this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].unbindRows();

							// this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].bindRows({
							// 	path: "/" + oTableId.TableId.toLowerCase() + this._paraStatement
							// });
							// this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setBusy(true);
							// oDataColumn.columns.forEach(function (oColumn, iIndex) {
							// 	if (this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].getColumns()[
							// 			iIndex] !==
							// 		undefined) {
							// 		this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].getColumns()[
							// 			iIndex].getTemplate().bindProperty(
							// 			"text", {
							// 				parts: [{
							// 					path: oColumn.column_property
							// 				}, {
							// 					path: oColumn.column_type
							// 				}],
							// 				formatter: this.columnFormatter
							// 			});
							// 		this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].getColumns()[
							// 				iIndex]._propertyName =
							// 			oColumn.column_property;
							// 	}
							// }.bind(this));
							

							// BusyIndicator.hide();
							
							this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setBusy(true);
							var wherefilter = this._applyWhereFilter(this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[
									0], oTableId.TableId);
							var where = "";
						 	var count = 0;
						 	wherefilter.forEach(function (oPreSelectedFilter) {
						 	count = count + 1;
						 	var fieldstring = "\"" + oPreSelectedFilter.sPath + "\"";
						 	switch (oPreSelectedFilter.sOperator) {
						 	case "EQ":
						 		if (count !== 1) {
						 			var n = where.indexOf(oPreSelectedFilter.sPath);
						 			
									if (n !== -1) //There is a hit	
									{
										where = where.slice(0, -1);
						 				where = where + " OR " + fieldstring + " = '" + oPreSelectedFilter.oValue1 + "' )";
									}else
									{
										where = where + " AND ( " + fieldstring + " = '" + oPreSelectedFilter.oValue1 + "' )";
									}
						 		}else
						 		{
						 		where = where + "( " + fieldstring + " = '" + oPreSelectedFilter.oValue1 + "' )";
						 		}
						 		break;
						 	case "Contains":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " LIKE '%" + oPreSelectedFilter.oValue1 + "%'";
						 		break;
						 	case "EndsWith":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " LIKE '%" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "StartsWith":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " LIKE '" + oPreSelectedFilter.oValue1 + "%'";
						 		break;
						 	case "BT":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " BETWEEN '" + oPreSelectedFilter.oValue1 + "' AND '" + oPreSelectedFilter
						 			.oValue2 + "'";
						 		break;
						 	case "GT":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " >'" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "LT":
						 		where = where + fieldstring + " <'" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "GE":
						 		where = where + fieldstring + " >='" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "LE":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " <='" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	}
						 });	
						 //where = encodeURIComponent(where);		
									
										// $.ajax({
										// type: "GET",
										// contentType: "application/json",
										// url: "../../xsjs/dataLoad.xsjs?field=*&table=" + oTableId.TableId + "&where=" + where,
										// dataType: "json",
										// async: true,
										// success: function (data) {
										$.post("../../xsjs/dataLoad.xsjs", {"field": "*",
																  "table": oTableId.TableId,
																  "where": where},
											function(data){	
											//var count = data.length;
											//data[0].count  = data.length;
											
											var columndata = that.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[
												0].getModel("tables").getData().columns;
											//.columns[15].column_type.substring(0,7)
											var totals = {};
											for (var j = 0; j < data.length; j++) {

											data[j].Color = '';

										}
											for (var i = 0; i < columndata.length; i++) {
												if (columndata[i].column_type.substring(0, 7) === 'DECIMAL') {
													var columnname = columndata[i].column_property;
													var value = 0;
													for (var j = 0; j < data.length; j++) {
														value = value * 1 + data[j][columnname] * 1;

													}
													totals[columnname] = value;
												} else {
													var columnname = columndata[i].column_property;
													totals[columnname] = '';
												}
											}
											totals.Color = 'X';
											totals.navigated = true;
											data.push(totals);
											data[0].count  = data.length - 1;
											
											//var counttotal = new sap.ui.model.json.JSONModel(count);
											var a = new sap.ui.model.json.JSONModel(data);
											a.setSizeLimit(999999);
											//t.setModel(a);
											//t.bindRows("/");
											//that.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setModel(counttotal);
											that.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setModel(a);
											//that.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].unbindRows();

											that.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].bindRows("/");
											that.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setBusy(false);
										}) 
										.fail(function (oError) {
											that.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setBusy(false);
										
									});

							
							oDataColumn.columns.forEach(function (oColumn, iIndex) {
								if (this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].getColumns()[
										iIndex] !==
									undefined) {
									this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].getColumns()[
										iIndex].getTemplate().bindProperty(
										"text",{ parts:[{ path: oColumn.column_property},{path: oColumn.column_type}],formatter: this.columnFormatter});
									this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].getColumns()[
											iIndex]._propertyName =
										oColumn.column_property;
								}
							}.bind(this));							
							//	}.bind(this));
							var oTemplate = new RowAction({
								items: [
									// new RowActionItem({
									// 	icon: "sap-icon://navigation-right-arrow",
									// 	text: "EKPO",
									// 	press: function (oEvent) {
									// 		that.onRowSelect(oEvent.getSource().getText(), oEvent.getSource().getRowAction().getRow().getRowBindingContext()
									// 			.getProperty("EBELN"));
									// 	}
									// }),
									// new RowActionItem({
									// 	icon: "sap-icon://navigation-right-arrow",
									// 	text: "EKKN",
									// 	press: function (oEvent) {
									// 		that.onRowSelect(oEvent.getSource().getText());
									// 	}
									// }),
									// Changes row details feature start
									new RowActionItem({
										icon: "sap-icon://message-information",
										text: "Details",
										press: function (oEvent) {
											that.rowDetails(oDataColumn.columns, oEvent.getSource().getBindingContext().getProperty(oEvent.getSource().getBindingContext()
												.getPath()));
										}
									})
									// Changes row details feature end
								]
							});

							this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setRowActionTemplate(
								oTemplate);
							this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[0].setRowActionCount(
								1);
							//this._applyDefaultSetting(this.byId("myTableTabContainer")._getSelectedItemContent()[1].getContent()[iTableIndex].getContent()[
							//	0], oTableId.TableId);

						}.bind(this),

						error: function (oError) {

						}
					});
			}.bind(this));

		},
		onNavButtonPress: function (oEvent) {
			this.byId("pageContainer").to(this.getView().createId("page1"));
			this.byId("nextButtonId").setVisible(true);
		},
		onSettingButtonPressed: function (oEvent) {
			var oModelTable = oEvent.getSource().getParent().getParent().getModel("tables");
			//	var oModel = this.getOwnerComponent().getModel("toolTableServiceSet");
			this._selectedTable = oEvent.getSource().getParent().getParent();
			if (!this._oDialogSetting) {
				Fragment.load({
					name: namespace + ".view.fragment.setting",
					controller: this
				}).then(function (oDialog) {
					this._oDialogSetting = oDialog;
					//	oModel.setSizeLimit(oModel.getData().columns.length);
					//					this._oDialog.setModel(oModel);
					this._oDialogSetting.setModel(oModelTable, "tables");
					this.getView().addDependent(oDialog);
					//					this._setSettingTable(oModelTable.getData().columns[0].column_tab);
					this._oDialogSetting.open();
				}.bind(this));
			} else {
				//	oModel.setSizeLimit(oModel.getData().columns.length);
				//				this._oDialogSetting.setModel(oModel);
				this._oDialogSetting.setModel(oModelTable, "tables");
				//				this._setSettingTable(oEvent.getSource().getModel("tables").getData().columns[0].column_tab);
				this._oDialogSetting.open();

			}

		},
		addFilterItem: function (oEvent) {
			oEvent.getSource().addFilterItem(oEvent.getParameters().filterItemData);

		},
		removeFilterItem: function (oEvent) {
			oEvent.getSource().removeFilterItem(oEvent.getParameter("index"));

		},

		addSortItem: function (oEvent) {
			oEvent.getSource().addSortItem(oEvent.getParameters().sortItemData);
		},
		removeSortItem: function (oEvent) {
			oEvent.getSource().removeSortItem(oEvent.getParameter("index"));
		},		
		handleSort: function (oEvent) {
			oEvent.preventDefault();
			var oTable = oEvent.getSource();
			var aSorter = [];
			//aSorter.push(new sap.ui.model.Sorter("Color", false));

			var sortOperation;
			if (oEvent.getParameters().sortOrder === 'Ascending') {
				sortOperation = false;
			} else {
				sortOperation = true;
			}

			aSorter.push(new sap.ui.model.Sorter(oEvent.getParameters().column.getSortProperty(), sortOperation));

			aSorter.unshift(new sap.ui.model.Sorter("Color", false));
			oTable.getBinding("rows").sort(aSorter);
			oEvent.getParameters().column.setSorted(true);
			oEvent.getParameters().column.setSortOrder(oEvent.getParameters().sortOrder);
		},
		handleFilter: function (oEvent) {
			oEvent.preventDefault();
			var oTable = oEvent.getSource();
			var oTabName = oEvent.getSource().getModel("tables").getData("columns").columns[0].column_tab;
			var aFilters = [];

			this.getView().getModel("preSelectedFilter").getData().forEach(function (oPreSelectedFilter) {
				if (oPreSelectedFilter.TabName === oTabName) {
					if (typeof oPreSelectedFilter.ColFilterTo === "undefined" || oPreSelectedFilter.ColFilterTo === "") {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, sap.ui.model.FilterOperator.EQ,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilter);
					} else {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, sap.ui.model.FilterOperator.BT,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilterTo);
					}

					aFilters.push(oPreFilter);
				}
			});
			if (oEvent.getParameters().value !== '') {
				var oPreFilter = new sap.ui.model.Filter(oEvent.getParameters().column.getFilterProperty(), 'EQ',
					oEvent.getParameters().value);

				aFilters.push(oPreFilter);
			}

			// Handle Sort Start
			//var aFiltersColor = [];
			var aFiltersColor = new sap.ui.model.Filter("Color", "EQ",
				"X");
			var oFilter = new sap.ui.model.Filter({
				filters: aFilters,
				and: true
			});

			var oFilterFinal = new sap.ui.model.Filter({
				filters: [oFilter, aFiltersColor],
				and: false
			});
			
			if(oTable.getBinding("rows").aApplicationFilters.length>0){
			oFilterFinal = oTable.getBinding("rows").aApplicationFilters;
			if (oEvent.getParameters().value !== '') {
			oFilterFinal[0].aFilters[0].aFilters.push(oPreFilter);
			}
			else{
				for(var i=0;i<oFilterFinal[0].aFilters[0].aFilters.length;i++)
				{
					if(oFilterFinal[0].aFilters[0].aFilters[i].sPath === oEvent.getParameters().column.getFilterProperty()){
						oFilterFinal[0].aFilters[0].aFilters.splice(i, 1);

					}
				}
			}
			}
						oTable.getBinding("rows").filter(oFilterFinal, sap.ui.model.FilterType.Application);
			var filterData = oTable.getBinding("rows");
			var data = [];
			filterData.getContexts().forEach(function (oRow) {
				var jsonData = JSON.parse(filterData.getContextData(oRow));
				if (jsonData.Color !== 'X') {
					data.push(jsonData);
				}
			});
			var data1 = oTable.getModel().getData();
			data1.pop();
			var columndata = oEvent.getSource().getModel("tables").getData("columns").columns;
			//.columns[15].column_type.substring(0,7)
			var totals = {};
			// Handle Sort Start
			
			// Handle Sort End

			for (var i = 0; i < columndata.length; i++) {
				if (columndata[i].column_type.substring(0, 7) === 'DECIMAL') {
					var columnname = columndata[i].column_property;
					var comma = columndata[i].column_type.indexOf(",");
					var closebrac = columndata[i].column_type.indexOf(")");
					var dec = columndata[i].column_type.substring(comma + 1, closebrac);
					if (dec !== "0") {
						var value = 0;
						for (var j = 0; j < data.length; j++) {
							value = value * 1 + data[j][columnname] * 1;
							var value1 = parseFloat(data[j][columnname]);
							data[j][columnname] = value1;

						}
						totals[columnname] = parseFloat(value);
					} else {
						var columnname = columndata[i].column_property;
						for (var j = 0; j < data.length; j++) {
							//	value = value * 1 + data[j][columnname] * 1;
							var value1 = parseFloat(data[j][columnname]);
							data[j][columnname] = value1;
							//	data[j].Color = '';
						}
						totals[columnname] = " ";
					}
				} else {
					var columnname = columndata[i].column_property;
					totals[columnname] = '';
				}
			}
			totals.Color = 'X';
			totals.navigated = true;
			data1.push(totals);
			data1[0].count = data.length;
			var a = new sap.ui.model.json.JSONModel(data1);
			a.setSizeLimit(999999);
			//t.setModel(a);
			//t.bindRows("/");

			oTable.setModel(a);
			oTable.bindRows("/");
			//oTable.getModel().loadData();

			//oTable.getBinding("rows").getContextData(oTable.getBinding("rows").getAllCurrentContexts()[0])
			oTable.getBinding("rows").filter(oFilterFinal, sap.ui.model.FilterType.Application);
			oEvent.getParameters().column.setFiltered(true);
			oEvent.getParameters().column.setFilterValue(oEvent.getParameters().value);
		},	
		/*
		onSettingButtonPressed: function (oEvent) {
			
			
			var oModelTable = oEvent.getSource().getParent().getParent().getModel("tables");
			//	var oModel = this.getOwnerComponent().getModel("toolTableServiceSet");
			this._selectedTable = oEvent.getSource().getParent().getParent();
			if (!this._oDialog) {
				Fragment.load({
					name: namespace + ".view.fragment.setting",
					controller: this
				}).then(function (oDialog) {
					this._oDialogSetting = oDialog;
					//	oModel.setSizeLimit(oModel.getData().columns.length);
					//					this._oDialog.setModel(oModel);
					this._oDialogSetting.setModel(oModelTable, "tables");
					this.getView().addDependent(oDialog);
					//					this._setSettingTable(oModelTable.getData().columns[0].column_tab);
					this._oDialogSetting.open();
				}.bind(this));
			} else {
				//	oModel.setSizeLimit(oModel.getData().columns.length);
				//				this._oDialogSetting.setModel(oModel);
				this._oDialogSetting.setModel(oModelTable, "tables");
				//				this._setSettingTable(oEvent.getSource().getModel("tables").getData().columns[0].column_tab);
				this._oDialogSetting.open();

			}
			
		},
		*/	
		onPressOk: function (oEvent) {  
			var aEntry = [];
			var aSort = [];
			var oTable = this._oDialogSetting.getModel("tables").getData("columns").columns[0].column_tab;
			var oTableColumns = this._oDialogSetting.getModel("tables").getData("columns");
			oTableColumns.columns.sort(function (a, b) {
				return parseFloat(a.column_index) - parseFloat(b.column_index);
			});
			//	var oModelTable = new JSONModel(oTableColumns);
			//	this._selectedTable.setModel(oModelTable,"tables");	
			var column = this._selectedTable.getColumns();
			var finalColumns = [];
			for(var i=0;i<oTableColumns.columns.length;i++){
				for(var j=0;j<column.length;j++){
					if(oTableColumns.columns[i].column_property===column[j]._propertyName){
						finalColumns.push(column[j]);
						continue;
					}
				}
			}
			
			this._selectedTable.removeAllColumns();
			for(var i=0;i<column.length;i++){
			this._selectedTable.addColumn(finalColumns[i]);
			}
			oEvent.getSource().getPanels()[1].getFilterItems().forEach(function (oFilter) {
				var oEntry = {
					columnKey: oFilter.getColumnKey(),
					operation: oFilter.getOperation(),
					value1: oFilter.getValue1(),
					value2: oFilter.getValue2()
				};
				aEntry.push(oEntry);
			});
			oEvent.getSource().getPanels()[2].getSortItems().forEach(function (oSort1) {
				var oSort = {
					columnKey: oSort1.getColumnKey(),
					operation: oSort1.getOperation()
				};
				aSort.push(oSort);
			});			
			var oModel = new JSONModel(aEntry);
			var oModelSort = new JSONModel(aSort);
			this.getView().setModel(oModel, "settingsFilter");
			this.getView().setModel(oModelSort, "settingsSort");
			this._applyFilterSetting(this._selectedTable, oTable);
			this._applySortSetting(this._selectedTable, oTable);
			// Save personalization 
			if (this._techFlag === true) {
				this.savePersonalization("myTablesSettingTech", namespace+"_" + oTable, oTableColumns);
			} else {
				this.savePersonalization("myTablesSetting", namespace+"_" + oTable, oTableColumns);
			}
			this._oDialogSetting.close();
		},
		onPressClose: function (oEvent) {
			this._oDialogSetting.close();
		},

		_setSettingTable: function (sTab) {

			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("UserName", sap.ui.model.FilterOperator.EQ, 'BETA_USER');
			aFilters.push(oFilter);
			var oFilter1 = new sap.ui.model.Filter("TabName", sap.ui.model.FilterOperator.EQ, sTab);
			aFilters.push(oFilter1);

			var oFilterFinal = new sap.ui.model.Filter(aFilters, true);
			//			this._oDialog.getContent()[0].getBinding("items").filter(oFilterFinal);

		},

		_applyDefaultSetting: function (oTable, oTabName) {
			var oTabName = oTabName;
			var aFilters = [];
			var aSorter = [];

			this.getView().getModel("preSelectedFilter").getData().forEach(function (oPreSelectedFilter) {
				if (oPreSelectedFilter.TabName === oTabName) {
					if (typeof oPreSelectedFilter.ColFilterTo === undefined || oPreSelectedFilter.ColFilterTo === "") {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, oPreSelectedFilter.ColOperator,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilter);
					} else {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, oPreSelectedFilter.ColOperator,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilterTo);
					}
					aFilters.push(oPreFilter);
				}
			});

			oTable.getBinding("rows").filter(aFilters, sap.ui.model.FilterType.Application);
		},
		_applyWhereFilter: function (oTable, oTabName) {
			var oTabName = oTabName;
			var aFilters = [];
			var aSorter = [];

			this.getView().getModel("preSelectedFilter").getData().forEach(function (oPreSelectedFilter) {
				if (oPreSelectedFilter.TabName === oTabName) {
					if (typeof oPreSelectedFilter.ColFilterTo === undefined || oPreSelectedFilter.ColFilterTo === "") {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, oPreSelectedFilter.ColOperator,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilter);
					} else {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, oPreSelectedFilter.ColOperator,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilterTo);
					}
					aFilters.push(oPreFilter);
				}
			});
			return aFilters;
			//oTable.getBinding("rows").filter(aFilters, sap.ui.model.FilterType.Application);
		},		
		_applyFilterSetting: function (oTable, oTabName) {
			var oTabName = oTabName;
			var aFilters = [];

			this.getView().getModel("preSelectedFilter").getData().forEach(function (oPreSelectedFilter) {
				if (oPreSelectedFilter.TabName === oTabName) {
					if (typeof oPreSelectedFilter.ColFilterTo === "undefined" || oPreSelectedFilter.ColFilterTo === "") {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, sap.ui.model.FilterOperator.EQ,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilter);
					} else {
						var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.FieldName, sap.ui.model.FilterOperator.BT,
							oPreSelectedFilter.ColFilter, oPreSelectedFilter.ColFilterTo);
					}

					aFilters.push(oPreFilter);
				}
			});
			if (this.getView().getModel("settingsFilter") !== undefined) {
				this.getView().getModel("settingsFilter").getData().forEach(function (oPreSelectedFilter) {

					var oPreFilter = new sap.ui.model.Filter(oPreSelectedFilter.columnKey, oPreSelectedFilter.operation,
						oPreSelectedFilter.value1, oPreSelectedFilter.value2);

					aFilters.push(oPreFilter);

				});
			}
			// Handle Sort Start
			//var aFiltersColor = [];
			var aFiltersColor = new sap.ui.model.Filter("Color", "EQ",
				"X");
			var oFilter = new sap.ui.model.Filter({
				filters: aFilters,
				and: true
			});

			var oFilterFinal = new sap.ui.model.Filter({
				filters: [oFilter, aFiltersColor],
				and: false
			});

			oTable.getBinding("rows").filter(oFilterFinal, sap.ui.model.FilterType.Application);
			// Handle Sort End
			var filterData = oTable.getBinding("rows");
			var data = [];
			filterData.getContexts().forEach(function (oRow) {
				var jsonData = JSON.parse(filterData.getContextData(oRow));
				if (jsonData.Color !== 'X') {
					data.push(jsonData);
				}
			});
			var data1 = oTable.getModel().getData();
			data1.pop();
			var columndata = oTable.getModel("tables").getData("columns").columns;
			//.columns[15].column_type.substring(0,7)
			var totals = {};
			// Handle Sort Start
			
			// Handle Sort End

			for (var i = 0; i < columndata.length; i++) {
				if (columndata[i].column_type.substring(0, 7) === 'DECIMAL') {
					var columnname = columndata[i].column_property;
					var comma = columndata[i].column_type.indexOf(",");
					var closebrac = columndata[i].column_type.indexOf(")");
					var dec = columndata[i].column_type.substring(comma + 1, closebrac);
					if (dec !== "0") {
						var value = 0;
						for (var j = 0; j < data.length; j++) {
							value = value * 1 + data[j][columnname] * 1;
							var value1 = parseFloat(data[j][columnname]);
							data[j][columnname] = value1;

						}
						totals[columnname] = parseFloat(value);
					} else {
						var columnname = columndata[i].column_property;
						for (var j = 0; j < data.length; j++) {
							//	value = value * 1 + data[j][columnname] * 1;
							var value1 = parseFloat(data[j][columnname]);
							data[j][columnname] = value1;
							//	data[j].Color = '';

						}
						totals[columnname] = " ";
					}
				} else {
					var columnname = columndata[i].column_property;
					totals[columnname] = '';
				}
			}
			totals.Color = 'X';
			totals.navigated = true;
			data1.push(totals);
			data1[0].count = data.length;
			var a = new sap.ui.model.json.JSONModel(data1);
			a.setSizeLimit(999999);
			//t.setModel(a);
			//t.bindRows("/");

			oTable.setModel(a);
			oTable.bindRows("/");
			//oTable.getModel().loadData();

			//oTable.getBinding("rows").getContextData(oTable.getBinding("rows").getAllCurrentContexts()[0])
			oTable.getBinding("rows").filter(oFilterFinal, sap.ui.model.FilterType.Application);			
		},

		_applySortSetting: function (oTable, oTabName) {
			var oTabName = oTabName;
			var aSorter = [];

			this.getView().getModel("settingsSort").getData().forEach(function (oPreSelectedFilter) {
				var sortOperation;
				if (oPreSelectedFilter.operation === 'Ascending') {
					sortOperation = false;
				} else {
					sortOperation = true;
				}

				aSorter.push(new sap.ui.model.Sorter(oPreSelectedFilter.columnKey, sortOperation));

			});
			aSorter.unshift(new sap.ui.model.Sorter("Color", false));
			oTable.getBinding("rows").sort(aSorter);
		},
		onPressSelectVisible: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			if (oEvent.getSource().getSelected()) {
				oEvent.getSource().getModel().setProperty(sPath + "/ColVisible", "X");
			} else {
				oEvent.getSource().getModel().setProperty(sPath + "/ColVisible", "");
			}
		},
		onPressSelectSort: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tables").getPath();
			if (oEvent.getSource().getSelected()) {
				oEvent.getSource().getModel().setProperty(sPath + "/ColSort", "X");
			} else {
				oEvent.getSource().getModel().setProperty(sPath + "/ColSort", "");
			}
		},

		//Begin 0901

		onExcelButtonPressed: function (oEvent) {
			var that = this;
			console.log("Press button");
			var aCols, oRowBinding, oSettings, oSheet, oTable;
			//var sPath = oEvent.getSource().getParent().getParent().getBinding("rows").getPath();
			//this._sServiceUrl = '../xsodata/service.xsodata' + sPath;
			//if (!this._oTable) {
				this._oTable = oEvent.getSource().getParent().getParent();
			//}

			//oTable = this._oTable;
			//oRowBinding = oTable.getBinding('rows');

			aCols = this.createColumnConfig(oEvent.getSource().getParent().getParent().getColumns()[0].getBindingContext(
				"tables").getProperty("/"));

			function excelProcess(){
				
						console.log("Execution");
								var data = [];
								var data = that._oTable.getBinding('rows').oList;
								//for(var i=0;i<keys.length;i++){
								//	data.push(that._oTable.getBinding('rows').getModel().getProperty("/"+keys[i]));
								//}
								var columns = that._oTable.getBinding('columns').oList;
								var columnName,columnProperty;
								var datafull =[];
								let columnheader = [];
								for(var i=0;i<columns.length;i++){
									if(columns[i].column_visible === true)
									{
									columnheader.push(columns[i].column_name+"["+columns[i].column_property+"]");
									}
								}
								datafull.push(columnheader);
								for(var j=0;j<data.length;j++){
									var dataarray = [];
									for(var i=0;i<columns.length;i++){
										if(columns[i].column_visible === true)
										{
											columnName = columns[i].column_property;
											columnProperty = columns[i].column_type;
										if (columns[i].column_type === 'DATS' || columns[i].column_type === 'TIMESTAMP') {
											
											data[j][columnName] = that.dataFormatter(data[j][columnName],columnProperty,"CLIENT");
										}
										
										var property = data[j][columnName];
										dataarray.push(property);
										}
									}
									var property = dataarray;
									datafull.push(Object.values(property));
								}	
								var wb = XLSX.utils.book_new();
								
								var workSheet1 = XLSX.utils.aoa_to_sheet(datafull,{
				 								 			dense : true,
				 								 			raw : true});	
								var workBook1 = XLSX.utils.book_new();
													XLSX.utils.book_append_sheet(workBook1,workSheet1,"Export");
													var sFileName = "Export1.xlsx";
													XLSX.writeFile(workBook1,sFileName,{ type: 'binary',
																						bookSST: true, 
																					   compression: true  });							
								that._oDialogExcel.then(function(oDialog) {
									oDialog.close();
									});
								that._cancel = "";
							}
			//var oModel = oRowBinding.getModel();
		//	var promiseDialog = new Promise(function (resolve,reject){
						if (!this._oDialogExcel) {
							this._oDialogExcel = Fragment.load({
								name: namespace+".view.fragment.ProgressDialogFragment",
								controller: this
							}).then(function (oDialog) {
								
								this.getView().addDependent(oDialog);
								console.log("Fragment Load");
								return oDialog;
						}.bind(this));
						}
						this._oDialogExcel.then(function (oDialog) {
							oDialog.open();
							setTimeout(function () {
								excelProcess();
							}, 5000);
						}.bind(this));	
	
						//});
						//promiseDialog.then(function(){			
								//var keys = that._oTable.getBinding('rows').aKeys;
								
			//});
			console.log("End");			
		},

		createColumnConfig: function (aColumn) {
			var aCols = [];
			aColumn.columns.forEach(function (oColumn) {
				if(oColumn.column_visible === true){
				aCols.push({
					property: oColumn.column_property,
					label: oColumn.column_name,
					type: EdmType.String
				});
				}
			});
			return aCols;
		},
		//End 0901		

		showSearchHelp: function (oEvent) {
			self = this;
			this._oGeneral = oEvent.getSource();
			var id = oEvent.getParameter("id");
			var obj = oEvent.getSource().getBindingContext().getObject();
			var aPromiseAllTable = [];
			var oSearchHelpField = {};
			var aSearchFilter = [];
			var e = new JSONModel();
			this._setPreFilterValue();

			// if (!this._pBusyDialog) {
			// 	this._pBusyDialog = Fragment.load({
			// 		name: namespace+".view.fragment.BusyDialog",
			// 		controller: this
			// 	}).then(function (oBusyDialog) {
			// 		this.getView().addDependent(oBusyDialog);
			// 		return oBusyDialog;
			// 	}.bind(this));
			// }		
			// this._pBusyDialog.then(function(oBusyDialog) {
			// 	oBusyDialog.open();
			// }.bind(this));	
			//backtab changes start
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
			this._oDialogSelectionKey[selectedTab].getContent()[1].getContent().forEach(function (oContent, ItableIndex) {
				//backtab changes end			

				//			this._oDialogSelectionKey.getContent()[0].getContent().forEach(function (oContent, ItableIndex) {
				oContent.getItems().forEach(function (oItem, iRowIndex) {
					var oInput = oItem.getCells()[1];
					var oInput1 = oItem.getCells()[2];
					var tokens = oInput1.getTokens();
					if (tokens.length !== 0) {
						tokens.map(function (oToken) {
							if (oToken.data("range")) {
								var oRange = oToken.data("range");

								var oSearchFilter = new sap.ui.model.Filter({
									path: oInput.getProperty("text"),
									operator: oRange.exclude ? "NE" : oRange.operation,
									keyField: oInput.getProperty("text"),
									value1: oRange.value1,
									value2: oRange.value2,
								});
								aSearchFilter.push(oSearchFilter);
							} else {
								var oSearchFilter = new sap.ui.model.Filter({
									path: oInput.getProperty("text"),
									operator: 'EQ',
									keyField: oInput.getProperty("text"),
									value1: oToken.getKey()
								});
								aSearchFilter.push(oSearchFilter);
							}
						});
					}

				})
			});
			e.setData({
				cols: [{
					label: obj.column_name,
					template: "Name"
				}]
			});
			var t = e.getData().cols;
			this._oBasicSearchFieldGeneral = new SearchField({
				showSearchButton: false
			});
			this._oValueHelpDialogGeneral = sap.ui.xmlfragment(namespace + ".view.fragment.SearchHelpFragment", this);
			this.getView().addDependent(this._oValueHelpDialogGeneral);
			this._oValueHelpDialogGeneral.setRangeKeyFields([{
				label: obj.column_name,
				key: "Name",
				type: "string",
				typeInstance: new String({}, {
					maxLength: 30
				})
			}]);
			this._oValueHelpDialogGeneral.getTableAsync().then(function (t) {

				if (!self._pBusyDialog) {
					self._pBusyDialog = Fragment.load({
						name: namespace + ".view.fragment.BusyDialog",
						controller: self
					}).then(function (oBusyDialog) {
						self.getView().addDependent(oBusyDialog);
						return oBusyDialog;
					}.bind(self));
				}
				self._pBusyDialog.then(function (oBusyDialog) {
					oBusyDialog.open();
				}.bind(self));
				// var o = this.getView().byId("name")._getSelectedItemText();
				// if (o == "") {
				// 	o = null;
				// }
				//this._oValueHelpDialogGeneral.setBusy(true);
				var a;

				var aSearchHelpValue = {};
				this._oValueHelpDialogGeneral.getFilterBar().setBasicSearch(this._oBasicSearchFieldGeneral);
				//this.getView().getModel("tableModelKey").getData().forEach(function (aTable) {
				//var sTable = aTable.columns[0].column_tab.toLowerCase();	
				//var aColumn = aTable.columns;

				//	oModel.metadataLoaded().then(function(){
				aPromiseAllTable.push(new Promise(function (resolve, reject) {
					try {
						var checktable;
						var checkTableFilter = [];
						if (obj.column_checktable !== null) {

							e.setData({
								cols: [{
									label: obj.column_name,
									template: "Name"
								}, {
									label: "Desc",
									template: "Text"
								}]
							});
							var oModel = this.getOwnerComponent().getModel("searchModel");
							//var field = obj.column_domainname;
							checktable = obj.column_checktable.toLowerCase();
							//If user already entered some search options, filter the checktables with the same filters.
							// not all values entered by user will exist in checktable so need to remove those

							var oMeta = this.getView().getModel("searchModel").getServiceMetadata();
							var metaType = checktable + 'Type';
							for (var i = 0; i < oMeta.dataServices.schema[0].entityType.length; i++) {

								if (oMeta.dataServices.schema[0].entityType[i].name === metaType) {
									for (var k = 0; k < aSearchFilter.length; k++) {
										for (var j = 0; j < oMeta.dataServices.schema[0].entityType[i].property.length; j++) {

											var property = oMeta.dataServices.schema[0].entityType[i].property[j];
											if (property.name === aSearchFilter[k].sPath) {
												checkTableFilter.push(aSearchFilter[k]);
												break;
											}
										}
									}
									break;
								}
							}

							aSearchFilter = [];
							aSearchFilter = checkTableFilter;
							this._paraStatement = "";
							this.getView().getModel("searchModel").read("/" + checktable + this._paraStatement, {
								filters: aSearchFilter,
								//						sorters: [new sap.ui.model.Sorter("field")],
								urlParameters: {
									"$select": ["KEY", "DESC"]
								},
								success: function (oResult) {
									var aUniqueObject = [];
									for (var i = 0; i < oResult.results.length; i++) {
										var property = oResult.results[i];
										var oUnique = {};
										oUnique.Key = property.KEY;
										oUnique.Name = property.KEY;
										oUnique.Text = property.DESC;
										aUniqueObject.push(oUnique);
									}
									//	var aUnique = oResult.results.map(item => item[field])
									//		.filter((value, index, self) => self.indexOf(value) === index);

									//	aUnique.forEach(function (sValue) {
									//		var oUnique = {};
									//		oUnique.Name = sValue;
									//		oUnique.Text = "ABC";
									//		aUniqueObject.push(oUnique);
									//	})
									aSearchHelpValue[obj.column_property] = aUniqueObject;
									a = new sap.ui.model.json.JSONModel(aUniqueObject);
									t.setModel(a);
									t.bindRows("/");

									//this._oValueHelpDialogGeneral.setBusy(false);
									this._pBusyDialog.then(function (oBusyDialog) {
										oBusyDialog.close();
										//	this._oValueHelpDialogGeneral.close();
									});
									resolve();
								}.bind(this),
								error: function (oError) {
									this._pBusyDialog.then(function (oBusyDialog) {
										oBusyDialog.close();
										//	this._oValueHelpDialogGeneral.close();
									});
									reject();
								}
							});
						} else {
							//	this._oValueHelpDialogGeneral.setBusy(true);						
							var oModel = this.getOwnerComponent().getModel("tables");
							var field = obj.column_property;
							checktable = obj.column_tab.toLowerCase();
							var searchtable = obj.column_tab.toUpperCase();
							var where = "";
						 	var count = 0;
						 	aSearchFilter.forEach(function (oPreSelectedFilter) {
						 	count = count + 1;
						 	var fieldstring = "\"" + oPreSelectedFilter.sPath + "\"";
						 	switch (oPreSelectedFilter.sOperator) {
						 	case "EQ":
						 		if (count !== 1) {
						 			var n = where.indexOf(oPreSelectedFilter.sPath);
						 			
									if (n !== -1) //There is a hit	
									{
										where = where.slice(0, -1);
						 				where = where + " OR " + fieldstring + " = '" + oPreSelectedFilter.oValue1 + "' )";
									}else
									{
										where = where + " AND ( " + fieldstring + " = '" + oPreSelectedFilter.oValue1 + "' )";
									}
						 		}else
						 		{
						 		where = where + "( " + fieldstring + " = '" + oPreSelectedFilter.oValue1 + "' )";
						 		}
						 		break;
						 	case "Contains":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " LIKE '%" + oPreSelectedFilter.oValue1 + "%'";
						 		break;
						 	case "EndsWith":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " LIKE '%" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "StartsWith":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " LIKE '" + oPreSelectedFilter.oValue1 + "%'";
						 		break;
						 	case "BT":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " BETWEEN '" + oPreSelectedFilter.oValue1 + "' AND '" + oPreSelectedFilter
						 			.oValue2 + "'";
						 		break;
						 	case "GT":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " >'" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "LT":
						 		where = where + fieldstring + " <'" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "GE":
						 		where = where + fieldstring + " >='" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	case "LE":
						 		if (count !== 1) {
						 		where = where + " AND ";
						 		}
						 		where = where + fieldstring + " <='" + oPreSelectedFilter.oValue1 + "'";
						 		break;
						 	}
						 });	
						 //where = encodeURIComponent(where);					
						//New Method
						$.post("../../xsjs/searchHelp.xsjs", {"field": field,
																  "table": searchtable,
																  "where": where},
								function(data){
								
							var aUniqueObject = [];	
							for (var i = 0; i < data.length; i++) {
								Object.values(data[i]).forEach(function (sValue) {
									var oUnique = {};
									oUnique.Key = sValue;
									oUnique.Name = self.dataFormatter(sValue, obj.column_type,"CLIENT");
									aUniqueObject.push(oUnique);
								});		
                            }							
								
							aSearchHelpValue[obj.column_property] = aUniqueObject;
							a = new sap.ui.model.json.JSONModel(aUniqueObject);
							t.setModel(a);
							t.bindRows("/");
							self._pBusyDialog.then(function(oBusyDialog) {
										oBusyDialog.close();
							});		
							//resolve();
							// error: function (oError) {
							// 		self._pBusyDialog.then(function(oBusyDialog) {
							// 			oBusyDialog.close();
										
							// 		});
							// 			reject();								
							// }
						}).fail(function (oError) {
							 		self._pBusyDialog.then(function(oBusyDialog) {
									oBusyDialog.close();							
						});						
						});													
							
							
							/*this.getView().getModel("tables").read("/" + checktable + this._paraStatement, {
								filters: aSearchFilter,
								//						sorters: [new sap.ui.model.Sorter("field")],
								urlParameters: {
									"$select": field
								},
								success: function (oResult) {

									var aUnique = oResult.results.map(item => item[obj.column_property])
										.filter((value, index, self) => self.indexOf(value) === index);
									var aUniqueObject = [];
									aUnique.forEach(function (sValue) {
										var oUnique = {};
										oUnique.Key = sValue;
										oUnique.Name = self.dataFormatter(sValue, obj.column_type,obj.column_property);
										aUniqueObject.push(oUnique);
									})
									aSearchHelpValue[obj.column_property] = aUniqueObject;
									a = new sap.ui.model.json.JSONModel(aUniqueObject);
									t.setModel(a);
									t.bindRows("/");
									//	this._oValueHelpDialogGeneral.setBusy(false);
									this._pBusyDialog.then(function (oBusyDialog) {
										oBusyDialog.close();
										//this._oValueHelpDialogGeneral.close();
									});
									resolve();
								}.bind(this),
								error: function (oError) {
									//	this._oValueHelpDialogGeneral.setBusy(false);
									this._pBusyDialog.then(function (oBusyDialog) {
										oBusyDialog.close();

									});
									reject();
								}
							});*/

						}
					} catch (e) {
						this._pBusyDialog.then(function(oBusyDialog) {
										oBusyDialog.close();
										
									});
					}

				}.bind(this)));
				t.setModel(e, "columns");
				this._oValueHelpDialogGeneral.update();
				//	}.bind(this));	
			}.bind(this));
			this._oValueHelpDialogGeneral.setTokens(this._oGeneral.getTokens());
			this._oValueHelpDialogGeneral.open();
		},

		onDialogClosed: function (oEvent) {
			if (oEvent.getParameter("cancelPressed")) {
				this._oValueHelpDialogGeneral.close();
				//	MessageToast.show("The operation has been cancelled");
			}
		},	
		onDialogExcelClosed: function (oEvent) {
			if (oEvent.getParameter("cancelPressed")) {
				this._cancel = "X";
			} 
		},
		onFilterBarSearchGeneral: function (e) {
			var t = this._oBasicSearchFieldGeneral.getValue(),
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
					path: "Name",
					operator: FilterOperator.Contains,
					value1: t
				})],
				and: false
			}));
			this._filterTableGeneral(new Filter({
				filters: a,
				and: true
			}));
		},
		_filterTableGeneral: function (e) {
			var t = this._oValueHelpDialogGeneral;
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
		onValueHelpOkPress: function (e) {
			var t = e.getParameter("tokens");
			this._oGeneral.setTokens(t);
			this._oValueHelpDialogGeneral.close();
		},
		onValueHelpCancelPress: function () {
			this._oValueHelpDialogGeneral.close();
		},
		onValueHelpAfterClose: function () {
			this._oValueHelpDialogGeneral.destroy();
		},
		onFullScreenPressed: function (oEvent) {
			var oTemModel1 = new JSONModel();
			var oTemModel2 = new JSONModel();
			
			var oModelTable = oEvent.getSource().getParent().getParent().getModel("tables");
			var oModelTableData = oEvent.getSource().getParent().getParent().getModel();
			//var oDataModel = this.getView().getModel("tables");
			var oTableDesc; 
			this._selectedTable = oEvent.getSource().getParent().getParent();
			if (!this._oDialogFull) {
				Fragment.load({
					name: namespace+".view.fragment.tablesfull",
					controller: this
				}).then(function (oDialog) {
					
					this._oDialogFull = oDialog;
					this._oDialogFull.setModel(oTemModel1);
					this._oDialogFull.setModel(oTemModel2,"tables");
					var oTable = sap.ui.getCore().byId("tableFull");
					oTable.unbindRows();


					this._oDialogFull.setModel(oModelTable, "tables");
				//	this._oDialogFull.setModel(oDataModel);
					this._oDialogFull.setModel(oModelTableData);
					oTableDesc = this._oDialogFull.getModel("tables").getData("columns").columns[0].column_tab;
					oTable.bindRows("/");		
					this._oDialogFull.getModel("tables").getData("columns").columns.forEach(function (oTab,iIndex) {
					 oTable.getColumns()[iIndex].getTemplate().bindProperty(
					 	"text",oTab.column_property);
					oTable.getColumns()._propertyName = oTab.column_property;
			});					
					this._applyFilterSetting(oTable, oTableDesc);
					this.getView().addDependent(oDialog);
					this._oDialogFull.open();
				}.bind(this));
			} else {
				
				this._oDialogFull.setModel(oTemModel1);
				this._oDialogFull.setModel(oTemModel2,"tables");
				var oTable = sap.ui.getCore().byId("tableFull");
				oTable.unbindRows();
				
				this._oDialogFull.setModel(oModelTable, "tables");
				//this._oDialogFull.setModel(oDataModel);
				this._oDialogFull.setModel(oModelTableData);

					oTableDesc = this._oDialogFull.getModel("tables").getData("columns").columns[0].column_tab;
					oTable.unbindRows();
					oTable.bindRows("/");						
					this._oDialogFull.getModel("tables").getData("columns").columns.forEach(function (oTab,iIndex) {

					 oTable.getColumns()[iIndex].getTemplate().bindProperty(
					 	"text",oTab.column_property);
					
					oTable.getColumns()._propertyName = oTab.column_property;
			});			
				this._applyFilterSetting(oTable, oTableDesc);
				this._oDialogFull.open();
			}
		},
		onFullScreenClose: function () {
			this._oDialogFull.close();
		},
		/* Saves the personalization to the persistence services.
		 * Persistence Service here is the Fiori Launchpad */
		savePersonalization: function (oContainer, tableId, dataColumn) {

			var oPersonalizer = this.getPersonalizationInstance(oContainer, tableId);
			var oSavePromise = oPersonalizer.setPersData(dataColumn)
				.done(function () {
					// Tell the user that the data was saved
				})
				.fail(function () {
					jQuery.sap.log.error("Writing personalization data failed.");
				});

		},

		/* This function will create a personalization instance using the persistence service that is available.
		 * In this context, the persistence service use is a Fiori Launchpad
		 * This is used in multiple places so takes a container and its unique value parameter */
		getPersonalizationInstance: function (oContainer, oValue) {
			//   Get the personalization service
			var oPersonalizationService = sap.ushell.Container.getService("Personalization");
			var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
			// Set the scope and validity
			var oScope = {
				keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
				writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
				clientStorageAllowed: true
			};

			// Set a personalization ID
			var oPersId = {
				container: oContainer,
				item: oValue
			};

			// Instance the personalizaer
			var oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
			return oPersonalizer;
		},
		callCreateFav: function (oEvent) {
			var oTable;
			this._oTable1 = oEvent.getSource().getParent().getParent().getColumns()[0].getBindingContext(
				"tables").getModel("columns").getData("columns").columns[0].column_tab;

			oTable = this._oTable1;
			var oModel = this.getOwnerComponent().getModel("persModel");
			var result = this.getView().getModel().getData();
			var oEntry = {};

			oEntry.TABNAME = oTable;
			oEntry.SUBAPPLICATIONID = "FV";
			var mParams = {};
			mParams.success = function () {
				sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
					MessageToast.show("Favorite Added");
				});
			};
			//	  mParams.error = onODataError;
			oModel.create("/fav", oEntry, mParams);
		},
		callRemoveFav: function (oEvent) {

			var oTable;
			this._oTable2 = oEvent.getSource().getParent().getParent().getColumns()[0].getBindingContext(
				"tables").getModel("columns").getData("columns").columns[0].column_tab;

			oTable = this._oTable2;
			var oModel = this.getOwnerComponent().getModel("persModel");
			var result = this.getView().getModel().getData();
			var username = sap.ushell.Container.getService("UserInfo").getId();
			var mParams = {};
			mParams.success = function () {
				sap.ui.require(["sap/m/MessageToast"], function (MessageToast) {
					MessageToast.show("Favorite removed");
				});
			};
			//	  mParams.error = onODataError;
			oModel.remove("/fav(USERNAME='" + username + "',SUBAPPLICATIONID='FV',TABNAME='" + oTable + "')", mParams);
		},
		columnFormatter: function (sValue) {

			if (sValue !== null && sValue !== undefined) {
				var column_property = this.mBindingInfos.text.parts[0].path;
				var property = this.mBindingInfos.text.parts[1].path;
				var n = property.indexOf("(");
				var column_type = "";
				 
				if (n === -1) {
					column_type = property;
				} else {
					column_type = property.substring(0, n);
				}
				if (column_type === "DECIMAL") {
					var comma = property.indexOf(",");
					var closebrac = property.indexOf(")");
					var dec = property.substring(comma + 1, closebrac);
					var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
						decimals: dec,
						groupingEnabled: true
					});
					return oNumberFormat.format(sValue);
				} else if (column_type === "DATS" && sValue !== "00000000" && sValue.length === 8) {

					if (sValue !== undefined) {
						var y = sValue.substr(0, 4),
							m = sValue.substr(4, 2) - 1,
							d = sValue.substr(6, 2);
						var dateValue = new Date(y, m, d);
						var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "dd.MM.yyyy"
						});

						return dateFormat.format(dateValue);
					} else {
						return sValue;
					}

				} else if (column_property === "POSID") {

					if (sValue !== undefined) {
						var wbs = "";

						var first = sValue.substr(i, 1);
						var wbs_new = "";
						if( first !== "S" && first !== "C")
						{
							var mask = "X.00000.00.00.00.00.00.0"
						}else if(first === "S")
						{
							var mask = "X.00000.00.00.00.00.00"
						}else
						{
							var mask = "X.00000.00.00000"
						}
						var countvalue = 0;
						for (var i = 0; i < mask.length; i++) {
							var x = mask.substr(i, 1);
							if(x === "X")
							{
								wbs_new = sValue.substr(0, 1);
								countvalue += 1;
								continue;
							}
							if(x === ".")
							{
								wbs_new += x;
							}
							if(x === "0")
							{
								var y = sValue.substr(countvalue, 1);
								wbs_new += y;
								countvalue += 1;
							}
						}
						var flag = "";
						do{
						var index = wbs_new.lastIndexOf(".");
						var offset = wbs_new.length - index;
						var z = wbs_new.substr(index+1, offset-1);
						if(z === "0" || z === "00" || z === "00000")
							{
								var wbs_new = wbs_new.substr(0, wbs_new.length-offset);	
							}
						
						else{
							wbs = wbs_new;
							flag = "X";
							}
						}
						while(flag !== "X")
							return wbs;
					} else {
						return sValue;
					}

				}
				else {
					return sValue;
				}

			} else {
				return sValue;
			}
		},
		dataFormatter: function (sValue, sProperty, sProperty1) {
			if (sValue !== null && sValue !== undefined) {
				var column_property = sProperty1;
				var property = sProperty;
				var n = property.indexOf("(");
				var column_type = "";
				if (n === -1) {
					column_type = property;
				} else {
					column_type = property.substring(0, n);
				}
				if (column_type === "DECIMAL") {
					var comma = property.indexOf(",");
					var closebrac = property.indexOf(")");
					var dec = property.substring(comma + 1, closebrac);
					var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
						decimals: dec,
						groupingEnabled: true
					});
					return oNumberFormat.format(sValue);
				} else if (column_type === "DATS" && sValue !== "00000000" && sValue.length === 8) {
					if (sValue !== undefined) {
						var y = sValue.substr(0, 4),
							m = sValue.substr(4, 2) - 1,
							d = sValue.substr(6, 2);
						var dateValue = new Date(y, m, d);
						var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "dd.MM.yyyy"
						});

						return dateFormat.format(dateValue);
					}
					}else if (column_property === "POSID") {

					if (sValue !== undefined) {
						var wbs = "";
						var first = sValue.substr(i, 1);
						var wbs_new = "";
						if( first !== "S" && first !== "C")
						{
							var mask = "X.00000.00.00.00.00.00.0"
						}else if(first === "S")
						{
							var mask = "X.00000.00.00.00.00.00"
						}else
						{
							var mask = "X.00000.00.00000"
						}
						var countvalue = 0;
						for (var i = 0; i < mask.length; i++) {
							var x = mask.substr(i, 1);
							if(x === "X")
							{
								wbs_new = sValue.substr(0, 1);
								countvalue += 1;
								continue;
							}
							if(x === ".")
							{
								wbs_new += x;
							}
							if(x === "0")
							{
								var y = sValue.substr(countvalue, 1);
								wbs_new += y;
								countvalue += 1;
							}
						}
						var flag = "";
						do{
						var index = wbs_new.lastIndexOf(".");
						var offset = wbs_new.length - index;
						var z = wbs_new.substr(index+1, offset-1);
						if(z === "0" || z === "00" || z === "00000")
							{
								var wbs_new = wbs_new.substr(0, wbs_new.length-offset);	
							}
						
						else{
							wbs = wbs_new;
							flag = "X";
							}
						}
						while(flag !== "X")
							return wbs;
					} else {
						return sValue;
					}

				} else {
					return sValue;
				}
			} else {
				return sValue;
			}
		},
		// Changes open new view start
		onRowSelect: function (entity, filter) {
			//var item = this.getView().byId("toolPage").getSideContent().getItem().getItems()[12].getItems()[0];
			//item.fireSelect(item);
			var that = this;
			var oModel = this.getOwnerComponent().getModel("navigationSet");
			oModel.read("/TableSet", {
				filters: [new Filter({
						path: "TABLEID",
						operator: FilterOperator.EQ,
						value1: entity
					}),
					new Filter({
						path: "SUBAPPLICATIONID",
						operator: FilterOperator.NE,
						value1: "FV"
					})
				],
				success: function (oData) {
					that.getView().byId("toolPage").getSideContent().setSelectedKey(oData.results[0].SUBAPPLICATIONID);

					var item = sap.ui.getCore().byId(that.getView().byId("toolPage").getSideContent().getSelectedItem());
					item.fireSelect(item);
					that.byId("myTableTabContainer")._getSelectedItemContent()[0].setVisible(false);
					var oData = {
						table: [{
							"TableDescription": "Purchasing Document Item",
							"TableId": entity
						}]
					};
					that._getKeyForPreFilterValue(oData, "X");
					//that.onPressCloseSelectionKey();
					var oTableModel = new JSONModel(oData);
					that.getView().setModel(oTableModel);

					// Process validation first
					var checkOK = that._checkInputFields();
					var aEntry = [];
					var oEntry = {
						UserName: "BETA_USER",
						TabName: "EKPO",
						ColOperator: 'EQ',
						ColFilter: filter,
						ColFilterTo: filter,
						FieldName: "EBELN"
					};
					aEntry.push(oEntry);

					var oModel = new JSONModel(aEntry);
					that.getView().setModel(oModel, "preSelectedFilter");
					//oEvent.getSource().getRowAction().getRow().getRowBindingContext().getProperty("EBELN");
					if (checkOK === true) //Only Proceed if everything OK.
					{
						//that._setPreFilterValue();
						that._setTable(oData);
						that.byId("myTableTabContainer")._getSelectedItemContent()[1].setVisible(true);
						that.byId("myTableTabContainer")._getSelectedItemContent()[0].setVisible(false);
						var selectedTab = that.byId("myTableTabContainer").getSelectedItem();
						that._oDialogSelectionKey[selectedTab].close();
						//backtab changes end						
						//						that._oDialogSelectionKey.close();
					}

				},
				error: function (oError) {

				}

			});

		},
		// Changes open new view end
		// Changes row details feature start
		rowDetails: function (oColumn, oData) {
			var self = this;
			var modelData = [];
			for (var i = 0; i < oColumn.length; i++) {
				var column_name = oColumn[i].column_name;
				var column_value = oData[oColumn[i].column_property];
				var column_type = oColumn[i].column_type;
				var column_property = oColumn[i].column_property;
				column_value = self.dataFormatter(column_value, column_type, column_property);
				var modelObject = {
					key: column_name,
					value: column_value
				};

				modelData.push(modelObject);
			}
			/*Object.entries(oData).forEach(function (value1, value2) {

				var modelObject = {
					key: value1[0],
					value: value1[1]
				};

				modelData.push(modelObject);
			});*/
			var oModel = new JSONModel(modelData, "detailsModel");
			oModel.setSizeLimit(500);
			//this.getView().setModel(oModel);
			var oTemplate = new sap.m.ColumnListItem({
				cells: [

					new sap.m.Text({
						text: "{key}",
						wrapping: false
					}),
					new sap.m.Text({
						text: "{value}",
						wrapping: false
					})
				]
			});
			// Changes open new view start

			// Changes open new view end
			var oTable = new sap.m.Table({

				columns: [new sap.m.Column({
					header: new sap.m.Label({
						text: "Group Description"
					})
				}), new sap.m.Column({
					header: new sap.m.Label({
						text: "Cell Content"
					})
				})]
			});
			oTable.bindItems("/", oTemplate);
			oTable.setModel(oModel);

			this.detailsDialog = new Dialog({
				width: "50%",
				title: "Details",
				content: oTable,

				endButton: new Button({
					text: "Close",
					press: function () {
						this.detailsDialog.close();
					}.bind(this)
				})
			});

			this.getView().addDependent(this.detailsDialog);

			this.detailsDialog.open();
		},
		// variant Management Start
		onSaveVariant: function (oEvent) {
			var variant = {};
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
			var dialog = this._oDialogSelectionKey[selectedTab];
			dialog.getContent().slice(1).forEach(function (oLayout, oLayoutIndex) {
				oLayout.getContent().forEach(function (oTable, oTableIndex) {
					oTable.getItems().forEach(function (oItem, oItemIndex) {
						var key = oItem.getCells()[1].getProperty("text");
						var token = oItem.getCells()[2].getTokens();
						variant[key] = [];
						token.map(function (oToken) {

							variant[key].push({
								"key": oToken.getKey(),
								"text": oToken.getText(),
								"range": oToken.data("range")
							});

						});

					});

				});

			});

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
		onChangeVariant: function (oEvent) {

			var changedVariant = this._oContainer.getItemValue(oEvent.getSource().getSelectionKey());
			if (oEvent.getSource().getSelectionKey() == "*standard*") {
				this.standardVariantReset();
			} else {
				var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
				var dialog = this._oDialogSelectionKey[selectedTab];
				dialog.getContent().slice(1).forEach(function (oLayout, oLayoutIndex) {
					oLayout.getContent().forEach(function (oTable, oTableIndex) {
						oTable.getItems().forEach(function (oItem, oItemIndex) {
							var key = oItem.getCells()[1].getProperty("text");
							var tokens = [];
							for (var i = 0; i < changedVariant[key].length; i++) {
								tokens.push(new sap.m.Token({
									key: changedVariant[key][i].key,
									text: changedVariant[key][i].text
								}).data("range", changedVariant[key][i].range));
							}
							oItem.getCells()[2].setTokens(tokens);
						});
					});
				});
			}
		},
		onManageVariant: function (oEvent) {
			this.onDeleteVariant(oEvent.getParameters().deleted);
		},
		standardVariantReset : function(){
			var selectedTab = this.byId("myTableTabContainer").getSelectedItem();
				var dialog = this._oDialogSelectionKey[selectedTab];
				dialog.getContent().slice(1).forEach(function (oLayout, oLayoutIndex) {
					oLayout.getContent().forEach(function (oTable, oTableIndex) {
						oTable.getItems().forEach(function (oItem, oItemIndex) {
							var tokens = [];
							oItem.getCells()[2].setTokens(tokens);
						});
					});
				});
		}
	});
});