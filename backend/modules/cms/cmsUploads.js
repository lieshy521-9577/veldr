import express from 'express';
import { attachAuthState } from '../../middleware/auth.js';
import { requireViewer } from './cmsAuth.js';
import { uploadDir } from './cmsStore.js';

const cmsUploads = [
  attachAuthState,
  requireViewer,
  express.static(uploadDir),
];

export { cmsUploads };
