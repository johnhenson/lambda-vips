'use strict';

var sharp = require('sharp');
var AWS = require('aws-sdk');
var fs = require('fs');

exports.handler = (event, context) => {
	//console.log('Received event:', JSON.stringify(event, null, 2));
	const naid = event['NaId'];
	const bucketName = event['s3Bucket'];
	const fileName = event['fileName'];
	var destBucket = bucketName + '-output';
	var dziFileName = '/tmp/' + naid + '.dzi';

	var s3 = new AWS.S3();
	var s3params = {Bucket: bucketName, Key: fileName};
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
						Bucket: bucketName,
						Key: 'example.jpg',
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
				});
			});
		}
	});
};

