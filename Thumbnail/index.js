const stream = require('stream');
const Jimp = require('jimp');

const storage = require('azure-storage');
const blobService = storage.createBlobService();

module.exports = (context, myEvent, myBlob) => {

  const widthInPixels = Number(process.env.THUMBNAIL_WIDTH);
  const blobName = myEvent.subject.split('/')[6];

    Jimp.read(myBlob).then((thumbnail) => {

        thumbnail.resize(widthInPixels, Jimp.AUTO);

        thumbnail.getBuffer(Jimp.MIME_PNG, (err, buffer) => {

            const readStream = stream.PassThrough();
            readStream.end(buffer);

            blobService.createBlockBlobFromStream('thumbnails', blobName, readStream, buffer.length, (err) => {
                context.done();
            });
        });

    }).catch(context.log);
};
