#!/usr/bin/env node


const fs = require('fs');
const path = require('path');

// Configuration: Directories to ignore, file extensions to process, and files or file extensions to ignore
let IGNORE_DIRS = ['.git', 'vendor', 'lib/vendor', 'node_modules', 'dist', 'bin', 'svn'];
let PROCESS_EXTENSIONS = [
  '.htaccess',
  'txt',
  'html',
  'htm',
  'css',
  'less',
  'sass',
  'js',
  'ts',
  'php',
  'py',
  'java',
  'c',
  'cpp',
  'h',
  'cs',
  'rb',
  'xml',
  'json',
  'yaml',
  'yml',
  'md',
  'sql',
  'sh',
];

let IGNORE_EXTENSIONS = [
  '.htpasswd',
  'log',
  'exe',
  'dll',
  'jar',
  'class',
  'zip',
  'rlib',
  'jpg',
  'jpeg',
  'gif',
  'png',
  'flv',
  'avi',
  'avif',
  'm4a',
  'm4v',
  'mov',
  'mp2',
  'mp3',
  'mp4',
  'mpg',
  'mpeg',
  'ogg',
  'wav',
  'woff',
  'woff2',
  'eot',
  'ttf',
  'otf'
];

let IGNORE_FILES = [
  'package-lock.json',
]

const defaultFilename = 'combined_output.txt';

// Supported arguments
const supportedArgs = [
  {
    args: ['-h', '--help'],
    description: 'Show this help',
  },
  {
    args: ['-s', '--silent'],
    description: 'Do not log progress to the console'
  },
  {
    args: ['-ml', '--multiline'],
    description: 'Log progress in the console as multiple lines (can be helpful for debugging)'
  },
  {
    args: ['-d', '--dir'],
    description: 'Specify the input directory',
    default: 'the current working directory',
  },
  {
    args: ['-o', '--output'],
    description: 'Specify the output file path and optionally name',
    default: `${defaultFilename} in the source directory`,
  },
  {
    args: ['-e', '--ext'],
    description: 'Specify the file extensions that should be processed, without a leading dot, as a comma separated list. Files with a leading dot, like .htaccess, must be added with a leading dot. Set to empty to process all files not in the ignore list.',
    default: `"${PROCESS_EXTENSIONS.sort().join(', ')}"`,
  },
  {
    args: ['-ea', '--ext-append'],
    description: 'Like -e / --ext, but appends to the default list.',
    default: '',
  },
  {
    args: ['-id', '--ignore-dirs'],
    description: 'Specify the directories to ignore, relative to the source directory, as a comma separated list.',
    default: `"${IGNORE_DIRS.sort().join(', ')}"`,
  },
  {
    args: ['-ida', '--ignore-dirs-append'],
    description: 'Like -id / --ignore-dirs, but appends to the default list.',
    default: '',
  },
  {
    args: ['-if', '--ignore-files'],
    description: 'Specify the files to ignore, relative to the source directory, as a comma separated list.',
    default: `"${IGNORE_FILES.sort().join(', ')}"`,
  },
  {
    args: ['-ifa', '--ignore-files-append'],
    description: 'Like -if / --ignore-files, but appends to the default list.',
    default: '',
  },
  {
    args: ['-ie', '--ignore-ext'],
    description: 'Specify the file extensions to ignore, without a leading dot, as a comma separated list. Files with a leading dot, like .htpasswd, must be added with a leading dot.',
    default: `"${IGNORE_EXTENSIONS.sort().join(', ')}"`,
  },
  {
    args: ['-iea', '--ignore-ext-append'],
    description: 'Like -ie / --ignore-ext, but appends to the default list.',
    default: '',
  }
];

// Parse command-line arguments
const args = process.argv.slice(2);

// Display help menu
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: acfp [options]');
  console.log('\nOptions:\n');

  // Calculate the maximum width for the args column
  const maxArgsLength = Math.max(
    ...supportedArgs.map(arg => arg.args.join(', ').length)
  );

  // Print the options in a table-like format
  supportedArgs.forEach(arg => {
    const argsText = arg.args.join(', ').padEnd(maxArgsLength + 2);
    const descriptionText = arg.description;
    const defaultText = arg.default ? ` (default: ${arg.default})` : '';
    console.log(`${argsText}${descriptionText}${defaultText}`);
  });

  process.exit(0);
}

// Silent mode
const silent = args.includes('--silent') || args.includes('-s');

// Single-line mode for progress logging
const multiLine = args.includes('--multiline') || args.includes('-ml');

// Get source directory from arguments or default to current directory
const dirArgIndex = args.findIndex(arg => arg === '--dir' || arg === '-d');
const sourceDir = dirArgIndex !== -1 && args[dirArgIndex + 1]
  ? path.resolve(args[dirArgIndex + 1])
  : process.cwd();

// Get output file from arguments or default to defaultFilename in the source directory
const outputArgIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
const outputPath = outputArgIndex !== -1 && args[outputArgIndex + 1]
  ? path.resolve(args[outputArgIndex + 1])
  : path.join(sourceDir, defaultFilename);
const outputFile = fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory()
  ? path.join(outputPath, defaultFilename)
  : outputPath;

// adapt files, dirs and extensions to process or ignore:
const extArgIndex = args.findIndex(arg => arg === '--ext' || arg === '-e');
if (extArgIndex !== -1 && args[extArgIndex + 1]) {
  PROCESS_EXTENSIONS = args[extArgIndex + 1].split(',').map(ext => ext.trim());
}

const extAppendArgIndex = args.findIndex(arg => arg === '--ext-append' || arg === '-ea');
if (extAppendArgIndex !== -1 && args[extAppendArgIndex + 1]) {
  PROCESS_EXTENSIONS = PROCESS_EXTENSIONS.concat(args[extAppendArgIndex + 1].split(',').map(ext => ext.trim()));
}

const ignoreDirsArgIndex = args.findIndex(arg => arg === '--ignore-dirs' || arg === '-id');
if (ignoreDirsArgIndex !== -1 && args[ignoreDirsArgIndex + 1]) {
  IGNORE_DIRS = args[ignoreDirsArgIndex + 1].split(',').map(dir => dir.trim());
}

const ignoreDirsAppendArgIndex = args.findIndex(arg => arg === '--ignore-dirs-append' || arg === '-ida');
if (ignoreDirsAppendArgIndex !== -1 && args[ignoreDirsAppendArgIndex + 1]) {
  IGNORE_DIRS = IGNORE_DIRS.concat(args[ignoreDirsAppendArgIndex + 1].split(',').map(dir => dir.trim()));
}

const ignoreFilesArgIndex = args.findIndex(arg => arg === '--ignore-files' || arg === '-if');
if (ignoreFilesArgIndex !== -1 && args[ignoreFilesArgIndex + 1]) {
  IGNORE_FILES = args[ignoreFilesArgIndex + 1].split(',').map(file => file.trim());
}

const ignoreFilesAppendArgIndex = args.findIndex(arg => arg === '--ignore-files-append' || arg === '-ifa');
if (ignoreFilesAppendArgIndex !== -1 && args[ignoreFilesAppendArgIndex + 1]) {
  IGNORE_FILES = IGNORE_FILES.concat(args[ignoreFilesAppendArgIndex + 1].split(',').map(file => file.trim()));
}

const ignoreExtArgIndex = args.findIndex(arg => arg === '--ignore-ext' || arg === '-ie');
if (ignoreExtArgIndex !== -1 && args[ignoreExtArgIndex + 1]) {
  IGNORE_EXTENSIONS = args[ignoreExtArgIndex + 1].split(',').map(ext => ext.trim());
}

const ignoreExtAppendArgIndex = args.findIndex(arg => arg === '--ignore-ext-append' || arg === '-iea');
if (ignoreExtAppendArgIndex !== -1 && args[ignoreExtAppendArgIndex + 1]) {
  IGNORE_EXTENSIONS = IGNORE_EXTENSIONS.concat(args[ignoreExtAppendArgIndex + 1].split(',').map(ext => ext.trim()));
}

// Get the absolute path of the script being executed
const scriptFilePath = path.resolve(__filename);

/**
 * Check if a directory should be ignored
 * 
 * @param {string} dir 
 * @returns {boolean}
 */
function shouldIgnoreDir(dir) {
  const baseName = path.basename(dir);
  return IGNORE_DIRS.includes(baseName);
}

/**
 * Get file extension from file name
 * 
 * @param {string} file
 * @returns 
 */
function getExt(file) {
  const baseName = path.basename(file).toLowerCase();
  const ext = path.extname(file).toLowerCase().slice(1) || baseName;

  return ext;
}

/**
 * Check if a file's content should be processed based on its extension
 * 
 * @param {string} file 
 * @returns 
 */
function shouldProcessFile(file) {
  const ext = getExt(file);
  return (!PROCESS_EXTENSIONS.length || PROCESS_EXTENSIONS.includes(ext))
    && !IGNORE_EXTENSIONS.includes(ext)
    && !IGNORE_FILES.includes(path.basename(file))
    ;
}

/**
 * Check if a file should be listed based on its extension and if it's the script file
 * 
 * @param {string} file file path 
 * @returns 
 */
function shouldListFile(file) {
  const ext = getExt(file);
  const absoluteFilePath = path.resolve(file);
  return absoluteFilePath !== scriptFilePath && !IGNORE_EXTENSIONS.includes(ext);
}

/**
 * Get language name from file extension if different
 * 
 * @param {string} extension 
 * @returns {string}
 */
function getLanguageName(extension) {
  const languages = {
    '.htaccess': 'apache',
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'c': 'c',
    'h': 'c',
    'md': 'markdown',
    'htm': 'html',
    'yml': 'yaml',
    'rs': 'rust',
    'sh': 'shell',
  };

  return languages[extension] || extension;
}

/**
 * Recursively gather folder structure and files to process, ignoring specific directories
 * 
 * @param {string} dir 
 * @param {string} prefix 
 * @param {object} result
 */
function gatherAndProcess(dir, prefix = '', result) {
  const items = fs.readdirSync(dir);

  items.forEach((item, index) => {
    const filePath = path.join(dir, item);
    const stat = fs.statSync(filePath);
    const isLastItem = index === items.length - 1;

    if (stat.isDirectory()) {
      if (!shouldIgnoreDir(filePath)) {
        // Add to folder structure
        result.structure += `${prefix}${isLastItem ? '└─' : '├─'} ${item}/\n`;
        gatherAndProcess(filePath, `${prefix}${isLastItem ? '   ' : '│  '}`, result);
      }
    } else if (shouldListFile(filePath)) {
      // Add to folder structure
      result.structure += `${prefix}${isLastItem ? '└─' : '├─'} ${item}\n`;

      // Add file to processing list
      result.files.push(filePath);
    }
  });
}

/**
 * Process files and write their contents to the output
 * 
 * @param {string[]} files 
 * @param {string} relativeRoot 
 * @param {WriteStream} output 
 */
function processFiles(files, relativeRoot, output) {
  let previousLength = 0; // Track the length of the previous single-line message

  files.forEach((file, index) => {
    const percent = Math.round(((index + 1) / files.length) * 100);
    const relativePath = path.relative(relativeRoot, file).replace(/\\/g, '/');
    const extension = getExt(file);
    const languageName = getLanguageName(extension);

    const status = shouldProcessFile(file) ? 'Processing' : 'Skipping';
    const message = `[${' '.repeat(3 - percent.toString().length)}${percent}%] ${' '.repeat(files.length.toString().length - (index + 1).toString().length)}(${index + 1}/${files.length}) ${status}: ${relativePath}`;

    if (!silent) {
      if (multiLine) {
        // For multi-line mode, append a newline after each message
        process.stdout.write(`${message}\n`);
      } else {
        // Clear the previous line completely
        const clearLine = `\r${' '.repeat(previousLength)}\r`;
        process.stdout.write(clearLine);

        // Write the new message
        process.stdout.write(message);

        // Update the length of the current message
        previousLength = message.length;

        // After the last update, move to a new line
        if (index === files.length - 1) process.stdout.write('\n');
      }
    }

    if (shouldProcessFile(file)) {
      output.write(`## ${relativePath}\n\`\`\`${languageName}\n`);
      output.write(fs.readFileSync(file, 'utf8'));
      output.write(`\n\`\`\`\n\n\n`);
    }
  });
}

if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// description header
const output = fs.createWriteStream(outputFile);
output.write('This file includes the content/source code of multiple files inside a folder.\n');
output.write('Sections start with descriptive headers. Content is wrapped in triple backticks.\n\n\n');

// Initialize result object
const result = { structure: '', files: [] };

// Traverse directory once to gather structure and files
if (!silent) console.log(`Processing folder: ${sourceDir}`);
gatherAndProcess(sourceDir, '', result);

// Write folder structure to output
if (!silent) console.log('Generating folder structure...');
output.write('## Folder Structure\n```' + sourceDir + '/\n');
output.write(result.structure);
output.write('```\n\n\n\n');

// Process files and write their contents to output
if (!silent) console.log("Done.\nProcessing file contents...");
processFiles(result.files, sourceDir, output);

output.end();

if (!silent) console.log(`\nAll specified files have been processed and saved to ${outputFile}`);
