import { google } from 'googleapis';
import { getClient } from '../auth/googleAuth.js';
import { Readable } from 'stream';

function getDrive() {
  return google.drive({ version: 'v3', auth: getClient() });
}

/**
 * Format file size to human-readable string.
 */
function formatSize(bytes) {
  if (!bytes) return '—';
  const num = parseInt(bytes, 10);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * List recent files from Google Drive.
 */
export async function listFiles(maxResults = 20) {
  const drive = getDrive();
  const { data } = await drive.files.list({
    pageSize: maxResults,
    fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink, thumbnailLink)',
    orderBy: 'modifiedTime desc',
  });

  return (data.files || []).map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: formatSize(file.size),
    sizeBytes: file.size,
    modifiedTime: file.modifiedTime,
    iconLink: file.iconLink,
    webViewLink: file.webViewLink,
    thumbnailLink: file.thumbnailLink,
  }));
}

/**
 * Upload a file to Google Drive.
 */
export async function uploadFile(fileBuffer, fileName, mimeType) {
  const drive = getDrive();

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const { data } = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, mimeType, size, webViewLink',
  });

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    size: formatSize(data.size),
    webViewLink: data.webViewLink,
  };
}

/**
 * Download a file from Google Drive.
 */
export async function downloadFile(fileId) {
  const drive = getDrive();

  // Get file metadata first
  const { data: meta } = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType',
  });

  const isWorkspaceDoc = meta.mimeType && meta.mimeType.startsWith('application/vnd.google-apps.');
  let stream;
  let fileName = meta.name || 'document';
  let mimeType = meta.mimeType || 'application/octet-stream';

  if (isWorkspaceDoc) {
    // Map Google Workspace documents to export formats
    let exportMime = 'application/pdf';
    let ext = '.pdf';

    if (meta.mimeType === 'application/vnd.google-apps.document') {
      exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext = '.docx';
    } else if (meta.mimeType === 'application/vnd.google-apps.spreadsheet') {
      exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = '.xlsx';
    } else if (meta.mimeType === 'application/vnd.google-apps.presentation') {
      exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      ext = '.pptx';
    }

    if (!fileName.toLowerCase().endsWith(ext)) {
      fileName += ext;
    }
    mimeType = exportMime;

    const res = await drive.files.export(
      { fileId, mimeType: exportMime },
      { responseType: 'stream' }
    );
    stream = res.data;
  } else {
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    stream = res.data;
  }

  return { stream, fileName, mimeType };
}

/**
 * Delete a file from Google Drive.
 */
export async function deleteFile(fileId) {
  const drive = getDrive();
  await drive.files.delete({ fileId });
  return { success: true };
}

/**
 * Search files by name query.
 */
export async function searchFiles(query) {
  const drive = getDrive();
  const { data } = await drive.files.list({
    q: `name contains '${query.replace(/'/g, "\\'")}'`,
    fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)',
    pageSize: 20,
    orderBy: 'modifiedTime desc',
  });

  return (data.files || []).map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: formatSize(file.size),
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
  }));
}
