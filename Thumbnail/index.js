const stream = require('stream');
const Jimp = require('jimp');

const storage = require('azure-storage');
const blobService = storage.createBlobService();

module.exports = (context, myBlob) => {

    const widthInPixels = 100;
    const blobName = context.bindingData.name;
    const contentType = context.bindingData.properties.contentType;

    Jimp.read(myBlob).then((thumbnail) => {

        thumbnail.resize(widthInPixels, Jimp.AUTO);

        const options = {
            contentSettings: { contentType: contentType }
        };

        thumbnail.getBuffer(Jimp.MIME_PNG, (err, buffer) => {

            const readStream = stream.PassThrough();
            readStream.end(buffer);

            blobService.createBlockBlobFromStream('thumbnails', blobName, readStream, buffer.length, options, (err) => {
                context.done();
            });
        });

    }).catch(context.log);
};