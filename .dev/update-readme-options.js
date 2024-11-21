#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const readmePath = path.join(process.cwd(), 'README.md');
const mainScriptPath = path.join(process.cwd(), 'acfp_ai_chat_filepacker.js'); // Corrected script name

// Execute the main script with `-h` to get options
let helpOutput;
try {
  helpOutput = execSync(`node ${mainScriptPath} -h`, { encoding: 'utf8' });
} catch (error) {
  console.error('Error executing the main script:', error.message);
  process.exit(1);
}

// Extract and format the options table
const optionsStart = helpOutput.indexOf('Options:');
if (optionsStart === -1) {
  console.error('Failed to find the options section in the help output.');
  process.exit(1);
}
const optionsLines = helpOutput.slice(optionsStart).split('\n').slice(2); // Skip "Options:" header and blank line
const optionsTable = optionsLines.map(line => {
  const [args, ...desc] = line.trim().split(/\s{2,}/);
  if (!args || !desc) return null;

  const [short, long] = args.split(', ');
  let description = desc.join(' ');

  // Wrap default values in backticks
  description = description.replace(/"(.*?)"/g, (_, value) => `\`${value}\``);

  // Wrap short and long arguments in backticks (e.g., "-s" or "--silent")
  description = description.replace(/(\s|^)(-\w+|\-\-\S+)/g, (_, prefix, match) => `${prefix}\`${match}\``);

  return `| \`${short || ''}\`,<br>\`${long}\` | ${description} |`;
}).filter(Boolean);

// Read the README and replace the options table
let readmeContent = fs.readFileSync(readmePath, 'utf8');
const tableStart = readmeContent.indexOf('| Option');
const tableEnd = readmeContent.indexOf('### Per-project config', tableStart); // Corrected headline
if (tableStart === -1 || tableEnd === -1) {
  console.error('Failed to find the options table in the README.');
  process.exit(1);
}

const newTable = `| Option                     | Description                                                  |\n|----------------------------|--------------------------------------------------------------|\n${optionsTable.join('\n')}`;
readmeContent = `${readmeContent.slice(0, tableStart)}${newTable}\n\n${readmeContent.slice(tableEnd)}`;

// Write the updated README
fs.writeFileSync(readmePath, readmeContent);
console.log('Options table in README updated successfully.');
