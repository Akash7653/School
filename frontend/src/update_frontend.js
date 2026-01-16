// Copy school-management-system components to frontend
const fs = require('fs');
const path = require('path');

// Source directory
const sourceDir = path.join(__dirname, 'school-management-system/components');
// Target directory  
const targetDir = path.join(__dirname, 'frontend/src/components/ui');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('Created target directory:', targetDir);
}

// Copy all UI components
const componentFiles = fs.readdirSync(sourceDir);

componentFiles.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log('Copied:', file, 'from', sourcePath, 'to', targetPath);
  }
});

console.log('UI components copied successfully!');
