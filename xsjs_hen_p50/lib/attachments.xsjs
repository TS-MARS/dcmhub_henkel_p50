'use strict';

function getFileContent(filename, page) {
	var connection = $.hdb.getConnection();
	var getFileContentProc = connection.loadProcedure("att::getFileContent");
	var result = getFileContentProc(filename, page);
	return result.OM_CONTENT;
}

function getFilePagesCount(filename) {
	var connection				= $.hdb.getConnection();
	var getFilePagesCountProc	= connection.loadProcedure("att::getFilePagesCount");
	var result					= getFilePagesCountProc(filename);
	return result.OM_PAGES;                         
}

function getFilenameExtension(filename) {
	var extension = filename.slice(-3); //'pdf';
	return extension;
}

function getContentType(filename) {
	var extension = getFilenameExtension(filename).toLowerCase();
	var mimeType;

	switch (extension) {
	case "bmp":
		mimeType = "image/bmp";
		break;

	case "doc":
		mimeType = "application/msword";
		break;

	case "docx":
		mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		break;

	case "htm":
	case "html":
		mimeType = "text/html";
		break;

	case "jpg":
	case "jpeg":
		mimeType = "image/jpg";
		break;

	case "pdf":
		mimeType = "application/pdf";
		break;

	case "tif":
	case "tiff":
		mimeType = "image/tiff";
		break;

	case "bin":
	case "dat":
	default:
		mimeType = "application/octet-stream";
	}
	return mimeType;
}

function displayFile(filename,page) {
	$.response.contentType  = getContentType(filename);
	$.response.setBody(getFileContent(filename,page));

	if ($.response.contentType === 'application/octet-stream') {
		$.response.headers.set("Content-Disposition", "attachment; filename=" + filename);
		$.response.status = $.net.http.OK;
	}
}

var filename = $.request.parameters.get("file");
var page	 = parseInt($.request.parameters.get("page"));
displayFile(filename,page);