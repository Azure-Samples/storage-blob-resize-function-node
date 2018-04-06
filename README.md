
# Azure Storage Blob Trigger Image Resize Function in Node.js

This sample implements a function triggered by Azure Blob Storage to resize an image in Node.js. Once the image is resized, the thumbnail image is uploaded back to blob storage.

The key aspects of this sample are in the function bindings and function implementation.

## Function bindings
In order to interface with image data, you need to configure the function to process data a binary data.

This code listing sets the `datatype` parameter to `binary` in the `function.json` file.

```javascript
{
  "disabled": false,
  "bindings": [
    {
      "name": "myBlob",
      "type": "blobTrigger",
      "direction": "in",
      "path": "images/{name}",
      "connection": "AzureWebJobsStorage",
      "datatype": "binary" // required to process buffer as image
    }
  ]
}
```


## Function implementation

The sample uses [Jimp](https://github.com/oliver-moran/jimp) resize an incoming buffer to a thumbnail. The buffer is then converted to a stream (as required by [createBlockBlobFromStream](https://docs.microsoft.com/en-us/javascript/api/azure-storage/blobservice?view=azure-node-latest#createblockblobfromstream-container--blob---stream---streamlength--options--callback-)) and uploaded to Azure Storage.


```javascript
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
```