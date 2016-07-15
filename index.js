'use strict';

var sharp = require('sharp');
var AWS = require('aws-sdk');
var fs = require('fs');

exports.handler = (event, context) => {
	console.log('Received event:', JSON.stringify(event, null, 2));
	var message = event["Records"][0]["Sns"]["Message"];
	var jsonMsg = JSON.parse(message);

	const naid = jsonMsg['NaId'];
	const bucketName = jsonMsg['s3Bucket'];
	const s3Key = jsonMsg['s3Key'];
	var destBucket = 'vips-image-test';
	var dziFileName = '/tmp/' + naid + '.dzi';

	var s3 = new AWS.S3();
	var s3params = {Bucket: bucketName, Key: s3Key};
	var data = s3.getObject(s3params, function (err, data) {
		if (err) {
			console.log(err, err.stack); // an error occurred
		} else {
			sharp(data.Body).jpeg().toBuffer(function (err, buffer, info) {
				if (err) {
					throw err;
				}
				console.log('image info: ', JSON.stringify(info, null, 2));
				s3.putObject({
						Bucket: destBucket,
						Key: naid+'/'+naid+'.jpg',
						Body: buffer
					}
					, function (err, data) {
						if (err) {
							throw err;
						}
						console.log('s3 Put: ', JSON.stringify(data, null, 2));
					});
				sharp(buffer).tile().toFile(dziFileName, function (err, info2) {
					if (err) throw err;
					console.log('tiling output info: ', JSON.stringify(info2, null, 2));
					console.log(fs.readdirSync('/tmp'));
					deleteFolderRecursive('/tmp/'+naid+'_files');
				});
			});
		}
	});
};

var deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};


