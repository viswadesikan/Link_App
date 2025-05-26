const LinkFolder = require('../models/LinkFolder');

const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = new LinkFolder({ 
      name, 
      user: req.userId,
      links: [] // Initialize with empty array
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ message: 'Error creating folder', error: err.message });
  }
};

const addLink = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    const folder = await LinkFolder.findOneAndUpdate(
      { _id: folderId, user: req.userId },
      { $push: { links: url } },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    res.json(folder);
  } catch (err) {
    console.error('Error adding link:', err);
    res.status(500).json({ message: 'Error adding link', error: err.message });
  }
};

const getFolders = async (req, res) => {
  try {
    const folders = await LinkFolder.find({ user: req.userId })
      .select('name links _id') // Only return necessary fields
      .lean(); // Convert to plain JS object

    // Ensure each folder has a links array
    const safeFolders = folders.map(folder => ({
      ...folder,
      links: folder.links || []
    }));

    res.json(safeFolders);
  } catch (err) {
    console.error('Error fetching folders:', err);
    res.status(500).json({ message: 'Error fetching folders', error: err.message });
  }
};

const getFolderLinks = async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await LinkFolder.findOne(
      { _id: folderId, user: req.userId },
      { links: 1 }
    );

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    res.json(folder.links || []);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ message: 'Error fetching links', error: err.message });
  }
};
// Delete a folder
const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    
    const folder = await LinkFolder.findOneAndDelete({ 
      _id: folderId, 
      user: req.userId 
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    res.json({ message: 'Folder deleted successfully' });
  } catch (err) {
    console.error('Error deleting folder:', err);
    res.status(500).json({ message: 'Error deleting folder', error: err.message });
  }
};

// Delete a specific link from a folder
const deleteLink = async (req, res) => {
  try {
    const { folderId, linkIndex } = req.params;
    
    const folder = await LinkFolder.findOne({ 
      _id: folderId, 
      user: req.userId 
    });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    // Check if link exists
    if (!folder.links[linkIndex]) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Remove the specific link
    folder.links.splice(linkIndex, 1);
    await folder.save();

    res.json(folder);
  } catch (err) {
    console.error('Error deleting link:', err);
    res.status(500).json({ message: 'Error deleting link', error: err.message });
  }
};

// Add these to module.exports
module.exports = { 
  createFolder, 
  addLink, 
  getFolders, 
  getFolderLinks,
  deleteFolder,
  deleteLink
};
