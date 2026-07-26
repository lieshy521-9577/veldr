import express from 'express';
import { attachAuthState } from '../../middleware/auth.js';
import { requireViewer } from './cmsAuth.js';
import { uploadDir } from './cmsStore.js';

const cmsUploads = [
  attachAuthState,
  requireViewer,
  // Uploaded filenames are unique, so long immutable caching is safe
  express.static(uploadDir, { maxAge: '30d', immutable: true }),
];

export { cmsUploads };
