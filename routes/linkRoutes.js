const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createFolder, addLink, getFolders, getFolderLinks ,deleteFolder,deleteLink} = require('../controllers/linkController');

router.post('/folders', auth, createFolder);
router.post('/folders/:folderId/links', auth, addLink);
router.get('/folders', auth, getFolders);
router.get('/folders/:folderId/links', auth, getFolderLinks);
// Add these new routes
router.delete('/folders/:folderId', auth, deleteFolder);
router.delete('/folders/:folderId/links/:linkIndex', auth, deleteLink);
module.exports = router;