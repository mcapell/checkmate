/**
 * Popup script for GitHub Code Review Checklist extension
 * 
 * This script manages the popup UI and interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  const newChecklistBtn = document.getElementById('new-checklist-btn');
  const checklistContainer = document.getElementById('checklist-container');

  if (newChecklistBtn) {
    newChecklistBtn.addEventListener('click', createNewChecklist);
  }

  // Load existing checklists
  loadChecklists();

  function createNewChecklist() {
    console.log('Creating new checklist...');
    // TODO: Implement checklist creation UI
  }

  function loadChecklists() {
    // Retrieve checklists from storage
    chrome.storage.sync.get(['checklists'], (result: { checklists?: any[] }) => {
      const checklists = result.checklists || [];
      
      if (checklists.length === 0) {
        if (checklistContainer) {
          checklistContainer.innerHTML = '<div class="empty-state">No checklists configured yet.</div>';
        }
      } else {
        // TODO: Render checklists
      }
    });
  }
}); 