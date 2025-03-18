/**
 * Popup script for GitHub Code Review Checklist extension
 * 
 * This script manages the popup UI and interactions.
 */

interface ChecklistSection {
  name: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  name: string;
  url?: string;
}

interface ChecklistTemplate {
  sections: ChecklistSection[];
}

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

  async function loadChecklists() {
    // Retrieve checklists from storage
    chrome.storage.sync.get(['checklists'], async (result: { checklists?: any[] }) => {
      const checklists = result.checklists || [];
      
      if (checklists.length === 0) {
        // No custom checklists, load the default template
        try {
          const defaultTemplate = await loadDefaultTemplate();
          renderDefaultTemplate(defaultTemplate);
        } catch (error) {
          console.error('Failed to load default template:', error);
          if (checklistContainer) {
            checklistContainer.innerHTML = '<div class="empty-state">Error loading default template. Please try again.</div>';
          }
        }
      } else {
        // TODO: Render custom checklists
        // For now, just show the default template
        try {
          const defaultTemplate = await loadDefaultTemplate();
          renderDefaultTemplate(defaultTemplate);
        } catch (error) {
          console.error('Failed to load default template:', error);
          // Still show the custom checklists in the future
        }
      }
    });
  }

  async function loadDefaultTemplate(): Promise<ChecklistTemplate> {
    const templateUrl = chrome.runtime.getURL('default-template.yaml');
    const response = await fetch(templateUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    
    const yamlContent = await response.text();
    return parseYaml(yamlContent);
  }

  function parseYaml(yamlContent: string): ChecklistTemplate {
    try {
      // Basic parsing of YAML to JSON
      // This is a simple implementation - in a real app, use a proper YAML parser
      const lines = yamlContent.split('\n');
      const template: ChecklistTemplate = { sections: [] };
      let currentSection: ChecklistSection | null = null;
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) continue;
        
        // Check for section
        if (line.includes('name:') && !line.includes('url:') && line.trim().startsWith('-')) {
          const sectionName = line.split('name:')[1].trim();
          currentSection = { name: sectionName, items: [] };
          template.sections.push(currentSection);
        }
        // Check for item
        else if (line.includes('name:') && line.trim().startsWith('-') && currentSection) {
          const itemName = line.split('name:')[1].trim();
          const item: ChecklistItem = { name: itemName };
          currentSection.items.push(item);
        }
        // Check for URL
        else if (line.includes('url:') && currentSection && currentSection.items.length > 0) {
          const url = line.split('url:')[1].trim();
          const lastItem = currentSection.items[currentSection.items.length - 1];
          lastItem.url = url;
        }
      }
      
      return template;
    } catch (error) {
      console.error('Failed to parse YAML:', error);
      throw new Error('Invalid YAML format');
    }
  }

  function renderDefaultTemplate(template: ChecklistTemplate): void {
    if (!checklistContainer) return;
    
    checklistContainer.innerHTML = '';
    
    // Create a title for the default template
    const title = document.createElement('h2');
    title.textContent = 'Default Code Review Checklist';
    title.style.fontSize = '14px';
    title.style.marginTop = '10px';
    title.style.marginBottom = '10px';
    checklistContainer.appendChild(title);
    
    // Render each section
    template.sections.forEach(section => {
      // Create section header
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.textContent = section.name;
      sectionHeader.style.fontWeight = 'bold';
      sectionHeader.style.marginTop = '10px';
      sectionHeader.style.marginBottom = '5px';
      
      checklistContainer.appendChild(sectionHeader);
      
      // Create section items
      section.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'checklist-item';
        
        // Create item name
        const itemName = document.createElement('span');
        itemName.textContent = item.name;
        itemName.style.fontSize = '12px';
        
        itemElement.appendChild(itemName);
        
        // Add URL link if available
        if (item.url) {
          const urlLink = document.createElement('a');
          urlLink.href = item.url;
          urlLink.textContent = '📄';
          urlLink.title = 'View documentation';
          urlLink.target = '_blank';
          urlLink.style.marginLeft = '5px';
          urlLink.style.textDecoration = 'none';
          
          itemElement.appendChild(urlLink);
        }
        
        checklistContainer.appendChild(itemElement);
      });
    });
  }
}); 