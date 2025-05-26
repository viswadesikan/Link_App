document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '/';
    return;
  }
  
  // DOM Elements
  const logoutBtn = document.getElementById('logout-btn');
  const addFolderBtn = document.getElementById('add-folder-btn');
  const foldersContainer = document.querySelector('.folders-container');
  const folderModal = document.getElementById('folder-modal');
  const linkModal = document.getElementById('link-modal');
  const closeButtons = document.querySelectorAll('.close');
  const createFolderBtn = document.getElementById('create-folder-btn');
  const addLinkBtn = document.getElementById('add-link-btn');
  const folderNameInput = document.getElementById('folder-name');
  const linkUrlInput = document.getElementById('link-url');
  
  let currentFolderId = null;
  
  // Helper function to show error
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove any existing error
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Add to top of main content
    const main = document.querySelector('main');
    if (main.firstChild) {
      main.insertBefore(errorDiv, main.firstChild);
    } else {
      main.appendChild(errorDiv);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  }

  // Event Listeners
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
  
  addFolderBtn.addEventListener('click', () => {
    folderModal.style.display = 'block';
    folderNameInput.focus();
  });
  
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      folderModal.style.display = 'none';
      linkModal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === folderModal) folderModal.style.display = 'none';
    if (e.target === linkModal) linkModal.style.display = 'none';
  });
  
  createFolderBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = folderNameInput.value.trim();
    
    if (!name) {
      showError('Please enter a folder name');
      return;
    }
    
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create folder');
      }
      
      folderNameInput.value = '';
      folderModal.style.display = 'none';
      await loadFolders();
    } catch (err) {
      showError(err.message || 'Failed to create folder');
      console.error('Create folder error:', err);
    }
  });
  
  addLinkBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const url = linkUrlInput.value.trim();
    
    if (!url) {
      showError('Please enter a URL');
      return;
    }

    try {
      new URL(url); // Validate URL format
    } catch (e) {
      showError('Please enter a valid URL (include http:// or https://)');
      return;
    }
    
    try {
      const response = await fetch(`/api/folders/${currentFolderId}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add link');
      }
      
      linkUrlInput.value = '';
      linkModal.style.display = 'none';
      await loadFolders();
    } catch (err) {
      showError(err.message || 'Failed to add link');
      console.error('Add link error:', err);
    }
  });
  
  // Functions
  async function loadFolders() {
    try {
      const response = await fetch('/api/folders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load folders');
      }
      
      const folders = await response.json();
      renderFolders(folders);
    } catch (err) {
      showError(err.message || 'Failed to load folders');
      console.error('Load folders error:', err);
    }
  }
  
  function renderFolders(folders) {
    foldersContainer.innerHTML = ''; // Clear all
    
    // Add the "+" button first
    foldersContainer.appendChild(addFolderBtn);
    
    // Add folders
    folders.forEach(folder => {
      const folderElement = document.createElement('div');
      folderElement.className = 'folder';
      
      const linkCount = Array.isArray(folder.links) ? folder.links.length : 0;
      
      folderElement.innerHTML = `
        <i class="fas fa-folder"></i>
        <span class="folder-name">${folder.name}</span>
        <span class="link-count">${linkCount} ${linkCount === 1 ? 'link' : 'links'}</span>
        <div class="add-link">
          <i class="fas fa-plus"></i>
        </div>
      `;
      
      // Add click events
      folderElement.addEventListener('click', (e) => {
        if (e.target.closest('.add-link')) {
          e.stopPropagation();
          currentFolderId = folder._id;
          linkModal.style.display = 'block';
          linkUrlInput.focus();
        } else {
          showLinks(folder._id, folder.name);
        }
      });
      
      foldersContainer.appendChild(folderElement);
    });
  }
  
  // Add these new functions
async function deleteFolder(folderId) {
  if (!confirm('Are you sure you want to delete this folder and all its links?')) {
    return;
  }

  try {
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete folder');
    }

    loadFolders();
  } catch (err) {
    showError(err.message || 'Failed to delete folder');
    console.error('Delete folder error:', err);
  }
}

async function deleteLink(folderId, linkIndex) {
  if (!confirm('Are you sure you want to delete this link?')) {
    return;
  }

  try {
    const response = await fetch(`/api/folders/${folderId}/links/${linkIndex}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete link');
    }

    // Reload the current links view
    const folderName = document.querySelector('.folder-title').textContent;
    showLinks(folderId, folderName);
  } catch (err) {
    showError(err.message || 'Failed to delete link');
    console.error('Delete link error:', err);
  }
}

// Update the renderFolders function to include delete button
function renderFolders(folders) {
  foldersContainer.innerHTML = '';
  foldersContainer.appendChild(addFolderBtn);

  folders.forEach(folder => {
    const folderElement = document.createElement('div');
    folderElement.className = 'folder';
    
    const linkCount = Array.isArray(folder.links) ? folder.links.length : 0;
    
    folderElement.innerHTML = `
      <div class="folder-actions">
        <button class="delete-folder-btn" title="Delete folder">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <i class="fas fa-folder"></i>
      <span class="folder-name">${folder.name}</span>
      <span class="link-count">${linkCount} ${linkCount === 1 ? 'link' : 'links'}</span>
      <div class="add-link">
        <i class="fas fa-plus"></i>
      </div>
    `;
    
    // Add event listeners
    folderElement.querySelector('.delete-folder-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFolder(folder._id);
    });

    folderElement.addEventListener('click', (e) => {
      if (e.target.closest('.add-link')) {
        e.stopPropagation();
        currentFolderId = folder._id;
        linkModal.style.display = 'block';
        linkUrlInput.focus();
      } else if (!e.target.closest('.folder-actions')) {
        showLinks(folder._id, folder.name);
      }
    });
    
    foldersContainer.appendChild(folderElement);
  });
}

// Update the showLinks function to include delete buttons for links
async function showLinks(folderId, folderName) {
  try {
    const response = await fetch(`/api/folders/${folderId}/links`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to load links');
    }
    
    const links = await response.json();
    
    // Create links view
    const main = document.querySelector('main');
    main.innerHTML = `
      <div class="links-view">
        <h2 class="folder-title">${folderName}</h2>
        <div class="links-container">
          ${links.length ? 
            links.map((link, index) => {
              try {
                const url = new URL(link);
                return `
                  <div class="link-item">
                    <div class="link-content">
                      <a href="${link}" target="_blank">${url.hostname.replace('www.', '')}</a>
                      <span class="link-url">${link}</span>
                    </div>
                    <button class="delete-link-btn" data-index="${index}" title="Delete link">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                `;
              } catch {
                return `
                  <div class="link-item">
                    <div class="link-content">
                      <span class="invalid-link">${link}</span>
                    </div>
                    <button class="delete-link-btn" data-index="${index}" title="Delete link">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                `;
              }
            }).join('') : 
            '<p class="empty-message">No links in this folder yet</p>'}
        </div>
        <div class="back-button-container">
          <button class="btn back-btn">← Back to Folders</button>
        </div>
      </div>
    `;
    
    // Add delete event listeners
    document.querySelectorAll('.delete-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const linkIndex = e.currentTarget.getAttribute('data-index');
        deleteLink(folderId, linkIndex);
      });
    });
    
    // Back button - FIXED VERSION
    document.querySelector('.back-btn').addEventListener('click', () => {
      // Clear the current view
      const main = document.querySelector('main');
      main.innerHTML = `
        <div class="folders-container">
          <div class="add-folder" id="add-folder-btn">
            <i class="fas fa-plus"></i>
          </div>
        </div>
      `;
      
      // Reinitialize the home view
      initHomeView();
    });
    
  } catch (err) {
    showError(err.message || 'Failed to load links');
    console.error('Show links error:', err);
  }
}

// Add this new function
function initHomeView() {
  // Re-get DOM elements since we recreated them
  const addFolderBtn = document.getElementById('add-folder-btn');
  const foldersContainer = document.querySelector('.folders-container');
  
  // Reattach event listeners
  addFolderBtn.addEventListener('click', () => {
    document.getElementById('folder-modal').style.display = 'block';
    document.getElementById('folder-name').focus();
  });
  
  // Reload folders
  loadFolders();
}
});