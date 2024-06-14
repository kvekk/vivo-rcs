const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');

const connectionString = process.env.AZURE_BLOB_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

const uploadToAzure = async (blobName, filePath, contentType) => {
  const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_BLOB_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const options = {
    blobHTTPHeaders: {
      blobContentType: contentType
    }
  };

  await blockBlobClient.uploadFile(filePath, options);
  console.log('File uploaded to Azure Blob Storage:', blobName);

  fs.unlinkSync(filePath);

  return blockBlobClient.url;
};

const deleteFromAzure = async (blobName) => {
  const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_BLOB_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.delete();
  console.log('File deleted from Azure Blob Storage:', blobName);
};

module.exports = {
  uploadToAzure,
  deleteFromAzure
};
