const fs = require('fs');
const filepath = 'c:/Users/Dell/Documents/Realtime-code-editor/client/src/App.js';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');
const newLines = lines.filter(line => !line.trim().startsWith('```'));
fs.writeFileSync(filepath, newLines.join('\n'));
console.log('Done!');
