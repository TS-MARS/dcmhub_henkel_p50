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
	"sap/ui/table/Table",
	'sap/ui/export/Spreadsheet'
], function (Controller, ODataModel, JSONModel, NumberFormat, Fragment, Filter, FilterOperator, SearchField, String, Table, Spreadsheet) {
	"use strict";
	var namespace = "tool_hen_p50";
	return Controller.extend(namespace + ".controller.adhocQuery", {
		onInit: function () {
			var oComponent = this.getOwnerComponent();
			this._oQuery = this.getView().byId("query");
			var that = this;
			var oPersonalizationService = sap.ushell.Container.getService("Personalization");
			var oScope = {
				keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
				writeFrequency: oPersonalizationService.constants.writeFrequency.HIGH,
				clientStorageAllowed: true,
				validity: Infinity
			};
			var variantModel;
			oPersonalizationService.getContainer("sap.ushell.variant.AdhocQuery", oScope, oComponent)
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
		busyClose: function () {
			this._request.abort();
		},
		onExecute: function () {
			var queryValue1 = this.getView().byId("query").getValue();
			var queryValue = queryValue1.replace(/[%]/g, '%25');
			var validate = this._validateInput(queryValue);
			if (validate === true) {
				var queryString = queryValue.trim().toLowerCase().split("from");
				var queryCount = "select count(*) from (" + queryValue + ")";
				var that = this;
				var busyDialog = new sap.m.BusyDialog({
					text: "Executing",
					showCancelButton: true,
					cancelButtonText: "Cancel",
					close: function () {

					}
				});
				busyDialog.open();
				$.ajax({
					type: "GET",
					contentType: "application/json",
					url: "../../xsjs/adhocQuery.xsjs?query=" + queryCount,
					dataType: "json",
					async: true,
					success: function (data) {
						busyDialog.close();
						if (data[0]["COUNT(*)"] > 100000) {
							var messageBox = sap.m.MessageBox.confirm("Query Result records are " + data[0]["COUNT(*)"] +
								". This exceeds 100k Rows. Do you want to continue?", {
									title: "Confirm", // default
									onClose: function (oAction) {
										if (oAction === sap.m.MessageBox.Action.OK) {
											that.onExecuteFetch();
										} else {
											return false;
										}
									}, // default
									styleClass: "", // default
									actions: [sap.m.MessageBox.Action.OK,
										sap.m.MessageBox.Action.CANCEL
									], // default
									emphasizedAction: sap.m.MessageBox.Action.OK, // default
									initialFocus: null, // default
									textDirection: sap.ui.core.TextDirection.Inherit // default
								});
						} else {
							that.onExecuteFetch();
						}

					},
					error: function (oError) {
						busyDialog.close();
						that.getView().byId("tableSmart").destroyContent();
						var errText = $.parseHTML(oError.responseText);
						if (errText.length > 1) {
							that.getView().byId("tableSmart").addContent(new sap.m.Text({
								"text": errText[11].innerText,
								"TextAlign": "Center"
							}));
						} else {
							that.getView().byId("tableSmart").addContent(new sap.m.Text({
								"text": errText[0].wholeText,
								"TextAlign": "Center"
							}));
						}
					}

				});
			}
		},

		_validateInput: function (sQuery) {
			var check = sQuery.match(/[|\\~^:;?!&$@+]/);
			if (check !== null) {
				this.getView().byId("tableSmart").destroyContent();
				var errText = "SQL Contains Invalid Characters at position " + check.index;
				this.getView().byId("tableSmart").addContent(new sap.m.Text({
					"text": errText,
					"TextAlign": "Center"
				}));
				return false;
			} else {
				return true;
			}
		},
		onExecuteFetch: function () {
			var that = this;
			var busyDialog = new sap.m.BusyDialog({
				text: "Executing",
				showCancelButton: true,
				cancelButtonText: "Cancel",
				close: function () {
					that.busyClose()
				}
			});
			busyDialog.open();
			this.getView().byId("tableSmart").destroyContent();
			if (this._oTable) {
				this._oTable.destroy();
			}
			var queryValue1 = this.getView().byId("query").getValue();
			var queryValue = queryValue1.replace(/[%]/g, '%25');
			if (queryValue.trim().substring(0, 6).toLowerCase() !== 'select') {
				this.getView().byId("tableSmart").addContent(new sap.m.Text({
					"text": "Only Select Queries allowed",
					"TextAlign": "Center"
				}));

				return false;
			}
			this.getView().byId("query").setValueState("None");
			var oModel = new sap.ui.model.json.JSONModel();
			var that = this;
			this._oColumns = [];
			this._oTable = new Table("tableID", {
				selectionMode: sap.ui.table.SelectionMode.None
			});
			that._oToolBar = new sap.m.OverflowToolbar();

			this._request = $.ajax({
				type: "GET",
				contentType: "application/json",
				url: "../../xsjs/adhocQuery.xsjs?query=" + queryValue,
				dataType: "json",
				async: true,
				success: function (data, textStatus, jqXHR) {
					var value = [];
					var modelEle;
					if (data.length > 0) {

						Object.keys(data[0]).forEach(function (key) {
							that._oColumns.push(key);
							modelEle = "{" + key + "}";
							that._oTable.addColumn(new sap.ui.table.Column({
								label: new sap.m.Label({
									text: key
								}),
								template: new sap.m.Text({
									text: modelEle
								}),
								width: "8rem"

							}));

						});

						that._output = data;
						that._oToolBar.addContent(new sap.m.Text({
							text: "Rows : ( " + data.length + " )"
						}));
						that._oToolBar.addContent(new sap.m.ToolbarSpacer());
						that._oToolBar.addContent(new sap.m.Button({
							icon: "sap-icon://excel-attachment",
							press: function () {
								that.onExcelDownload()
							}

						}));
						that._oTable.addExtension(that._oToolBar);
						that.getView().byId("tableSmart").addContent(that._oTable);
						var dataModel = new JSONModel(data);
						that._oTable.setModel(dataModel);
						that._oTable.bindRows("/");
					} else {
						that.getView().byId("tableSmart").addContent(new sap.m.Text({
							"text": "No data Found",
							"TextAlign": "Center"
						}));
					}
					busyDialog.close();

				},
				error: function (oError) {
					busyDialog.close();
					var errText = $.parseHTML(oError.responseText);

					that.getView().byId("tableSmart").addContent(new sap.m.Text({
						"text": errText[11].innerText,
						"TextAlign": "Center"
					}));
				}

			});
		},
		onExcelDownload: function () {
			var that = this;

			function excelProcess() {
				const binding = that._oTable.getBinding("rows");
				var datafull = [];
				datafull.push(that.createColumns());
				var data = binding.getModel().getProperty(binding.getPath());
				for (var i = 0; i < data.length; i++) {
					datafull.push(Object.values(data[i]));
				}
				var wb = XLSX.utils.book_new();

				var workSheet1 = XLSX.utils.aoa_to_sheet(datafull, {
					dense: true,
					raw: true
				});
				var workBook1 = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(workBook1, workSheet1, "Export");
				var sFileName = "Query.xlsx";
				XLSX.writeFile(workBook1, sFileName, {
					type: 'binary',
					bookSST: true,
					compression: true
				});
				that._oDialogExcel.then(function (oDialog) {
					oDialog.close();
				});
				that._cancel = "";
			}
			if (!this._oDialogExcel) {
				this._oDialogExcel = Fragment.load({
					name: namespace + ".view.fragment.ProgressDialogFragment",
					controller: this
				}).then(function (oDialog) {

					this.getView().addDependent(oDialog);

					return oDialog;
				}.bind(this));
			}
			this._oDialogExcel.then(function (oDialog) {
				oDialog.open();
				setTimeout(function () {
					excelProcess();
				}, 5000);
			});
			/*	const binding = this._oTable.getBinding("rows");
				var data = binding.getModel().getProperty(binding.getPath());
				new Spreadsheet({
					workbook: {
						columns: this.createColumns()
					},
					dataSource: data,
					fileName: "Query.xlsx"
				}).build();*/
		},

		createColumns: function () {

			var exportHeader = [];

			for (var i = 0; i < this._oColumns.length; i++) {
				exportHeader.push(this._oColumns[i]);
			}

			return exportHeader;
		},
		onSaveVariant: function (oEvent) {
			var variant = {
				"query": this._oQuery.getValue()
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
				this._oQuery.setValue(changedVariant.query);
			}
		},
		onManage: function (oEvent) {
			this.onDeleteVariant(oEvent.getParameters().deleted);
		},
		standardVariantReset: function () {
			this._oQuery.setValue("");
		}
	});
});