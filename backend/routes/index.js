import express from 'express';
import articleRoutes from './articleRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import passwordRoutes from './passwordRoutes.js';
import cmsRoutes from '../modules/cms/cmsRoutes.js';

const router = express.Router();

router.use('/articles', articleRoutes);
router.use('/upload', uploadRoutes);
router.use('/password', passwordRoutes);
router.use('/cms', cmsRoutes);

export default router;

