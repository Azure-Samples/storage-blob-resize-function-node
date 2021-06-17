---
page_type: sample
languages:
- javascript
products:
- azure
description: "This sample implements a function triggered by Azure Blob Storage to resize an image in Node.js."
urlFragment: storage-blob-resize-function-node
---

# Azure Storage Blob Trigger Image Resize Function in Node.js

This sample implements a function triggered by Azure Blob Storage to resize an image in Node.js. Once the image is resized, the thumbnail image is uploaded back to blob storage.

The key aspects of this sample are in the function bindings and implementation.

## Function bindings
In order to interface with image data, you need to configure the function to process binary data.

The following code sets the `datatype` parameter to `binary` in the `function.json` file.

```javascript
{
  "disabled": false,
  "bindings": [
    {
      "type": "eventGridTrigger",
      "name": "myEvent",
      "direction": "in"
    },
    {
      "name": "myBlob",
      "type": "blob",
      "direction": "in",
      "path": "{data.url}",
      "connection": "AZURE_STORAGE_CONNECTION_STRING",
      "datatype": "binary"
    }
  ]
}
```

## Function implementation

The sample uses [Jimp](https://github.com/oliver-moran/jimp) to resize an incoming buffer to a thumbnail. The buffer is then converted to a stream (as required by [createBlockBlobFromStream](https://docs.microsoft.com/en-us/javascript/api/azure-storage/blobservice?view=azure-node-latest#createblockblobfromstream-container--blob---stream---streamlength--options--callback-)) and uploaded to Azure Storage.


```javascript
const Jimp = require('jimp');
const stream = require('stream');
const { BlockBlobClient } = require("@azure/storage-blob");

const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

const containerName = process.env.BLOB_CONTAINER_NAME;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobName = process.env.OUT_BLOB_NAME;

module.exports = async function (context, myEvent, inputBlob){
    const widthInPixels = 100;
    Jimp.read(inputBlob).then((thumbnail) => {
        thumbnail.resize(widthInPixels, Jimp.AUTO);
        thumbnail.getBuffer(Jimp.MIME_PNG, async (err, buffer) => {
          
            const readStream = stream.PassThrough();
            readStream.end(buffer);
            const blobClient = new BlockBlobClient(connectionString, containerName, blobName);
            
            try {
                await blobClient.uploadStream(readStream,
                    uploadOptions.bufferSize,
                    uploadOptions.maxBuffers,
                    { blobHTTPHeaders: { blobContentType: "image/jpeg" } });
            } catch (err) {
                context.log(err.message);
            }
        });
    });
};
```

You can use the [Azure Storage Explorer](https://azure.microsoft.com/features/storage-explorer/) to view blob containers and verify the resize is successful.
