#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load default values from files
const loadDefaults = (fileName) => {
  const filePath = path.join(__dirname, 'src', 'defaults', fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Missing defaults file: ${fileName}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Configuration: Directories to ignore, file extensions to process, and files or file extensions to ignore
let IGNORE_DIRS = loadDefaults('ignore_dirs.json');
let PROCESS_EXTENSIONS = loadDefaults('process_extensions.json');
let IGNORE_EXTENSIONS = loadDefaults('ignore_extensions.json');
let IGNORE_FILES = loadDefaults('ignore_files.json');

const defaultFilename = 'combined_output.txt';

// Supported arguments
const supportedArgs = [
  {
    args: ['-h', '--help'],
    description: 'Show this help',
    type: 'boolean',
  },
  {
    args: ['-s', '--silent'],
    description: 'Do not log progress to the console',
    type: 'boolean',
  },
  {
    args: ['-ml', '--multiline'],
    description: 'Log progress in the console as multiple lines (can be helpful for debugging)',
    type: 'boolean',
  },
  {
    args: ['-d', '--dir'],
    description: 'Specify the input directory',
    type: 'string',
    default: 'the current working directory',
  },
  {
    args: ['-o', '--output'],
    description: 'Specify the output file path and optionally name',
    type: 'string',
    default: `"${defaultFilename}" in the source directory`
  },
  {
    args: ['-e', '--ext'],
    description: 'Specify the file extensions that should be processed, without a leading dot, as a comma separated list. Files with a leading dot, like .htaccess, must be added with a leading dot. Set to empty to process all files not in the ignore list.',
    type: 'list',
    default: `"${PROCESS_EXTENSIONS.sort().join(', ')}"`,
  },
  {
    args: ['-ea', '--ext-append'],
    type: 'list',
    description: 'Like -e / --ext, but appends to the default list.',
    default: '',
  },
  {
    args: ['-id', '--ignore-dirs'],
    type: 'list',
    description: 'Specify the directories to ignore, relative to the source directory, as a comma separated list.',
    default: `"${IGNORE_DIRS.sort().join(', ')}"`,
  },
  {
    args: ['-ida', '--ignore-dirs-append'],
    type: 'list',
    description: 'Like -id / --ignore-dirs, but appends to the default list.',
    default: '',
  },
  {
    args: ['-if', '--ignore-files'],
    type: 'list',
    description: 'Specify the files to ignore, relative to the source directory, as a comma separated list.',
    default: `"${IGNORE_FILES.sort().join(', ')}"`,
  },
  {
    args: ['-ifa', '--ignore-files-append'],
    type: 'list',
    description: 'Like -if / --ignore-files, but appends to the default list.',
    default: '',
  },
  {
    args: ['-ie', '--ignore-ext'],
    type: 'list',
    description: 'Specify the file extensions to ignore, without a leading dot, as a comma separated list. Files with a leading dot, like .htpasswd, must be added with a leading dot.',
    default: `"${IGNORE_EXTENSIONS.sort().join(', ')}"`,
  },
  {
    args: ['-iea', '--ignore-ext-append'],
    type: 'list',
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

// Load configuration files
function loadProjectConfig() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const acfpConfigPath = path.join(process.cwd(), 'acfp.config.json');
  let projectConfig = {};
  let configSource = null;

  if (fs.existsSync(acfpConfigPath)) {
    projectConfig = JSON.parse(fs.readFileSync(acfpConfigPath, 'utf-8'));
    configSource = 'acfp.config.json';
  }

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.acfp) {
      if (configSource) {
        console.log('Note: This project contains an "acfp.config.json" as well as an "acfp" property in its "package.json". The configuration in "package.json" will be ignored and should be removed.');
      } else {
        projectConfig = packageJson.acfp;
        configSource = 'package.json';
      }
    }
  }

  return { projectConfig, configSource };
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(item => item.trim());
  return [];
}

function parseCliArgs() {
  const cliArgs = {};
  supportedArgs.forEach(option => {
    const [short, long] = option.args; // Get the long-form argument
    const longIndex = args.findIndex(arg => arg === long);
    const shortIndex = args.findIndex(arg => arg === short);
    const index = longIndex !== -1 ? longIndex : shortIndex;

    if (index !== -1) {
      let value = args[index + 1];
      if(value && value.startsWith('-')) {
        value = null;
      }

      switch (option.type) {
        case 'boolean':
          // Boolean: set to true if the flag is present
          const booleanFalse = value === 'false' || value === "0" || value === 0;
          cliArgs[long.replace(/^-+/, '')] = booleanFalse ? false : true;
          break;

        case 'string':
          // String: assign the next value
          if (!value?.startsWith('-')) {
            cliArgs[long.replace(/^-+/, '')] = value;
          }
          break;

        case 'list':
          // List: parse as comma-separated values or accept an array
          if(
            !value
            || value?.startsWith('-')
            || value === '0'
            || value === 0
            || value === 'null'
            || value === 'false'
            || value === '[]'
            || value === '*'
          ) {
            cliArgs[long.replace(/^-+/, '')] = [];
          } else {
            cliArgs[long.replace(/^-+/, '')] = value.includes(',')
              ? value.split(',').map(item => item.trim())
              : [value];
          }
          break;
      }
    }
  });

  return cliArgs;
}

function mergeConfigs(defaults, projectConfig, cliArgs) {
  const mergedConfig = { ...defaults };

  // Merge project config
  Object.keys(projectConfig).forEach(key => {
    if (Array.isArray(defaults[key])) {
      mergedConfig[key] = normalizeList(projectConfig[key]);
    } else {
      mergedConfig[key] = projectConfig[key];
    }
  });

  // Merge CLI arguments
  Object.keys(cliArgs).forEach(key => {
    if (Array.isArray(defaults[key])) {
      mergedConfig[key] = normalizeList(cliArgs[key]);
    } else if (cliArgs[key] !== undefined) {
      mergedConfig[key] = cliArgs[key];
    }
  });

  ['ext', 'ignore-dirs', 'ignore-files', 'ignore-ext'].forEach(key => {
    mergedConfig[key] = mergedConfig[key].concat(mergedConfig[`${key}-append`]);
    delete mergedConfig[`${key}-append`];
  });

  return mergedConfig;
}

const { projectConfig, configSource } = loadProjectConfig();
const defaults = {
  silent: false,
  multiline: false,
  dir: process.cwd(),
  output: path.join(process.cwd(), defaultFilename),
  ext: PROCESS_EXTENSIONS,
  'ext-append': [],
  'ignore-dirs': IGNORE_DIRS,
  'ignore-dirs-append': [],
  'ignore-files': IGNORE_FILES,
  'ignore-files-append': [],
  'ignore-ext': IGNORE_EXTENSIONS,
  'ignore-ext-append': []
};

const cliArgs = parseCliArgs();
const finalConfig = mergeConfigs(defaults, projectConfig, cliArgs);

// Apply configurations
const {
  silent,
  multiline,
  dir: sourceDir,
  output: outputFile,
  ext,
  'ignore-dirs': ignoreDirs,
  'ignore-files': ignoreFiles,
  'ignore-ext': ignoreExt
} = finalConfig;

PROCESS_EXTENSIONS = ext;
IGNORE_DIRS = ignoreDirs;
IGNORE_FILES = ignoreFiles;
IGNORE_EXTENSIONS = ignoreExt;

if(configSource && !silent) {
  console.log('Loaded project configuration from:', configSource);
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
      if (multiline) {
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

// Determine the base directory for the output file
let baseDir = outputFile;
if (fs.existsSync(outputFile) && fs.statSync(outputFile).isDirectory()) {
  baseDir = outputFile; // If outputFile is a directory
  outputFile = path.join(baseDir, defaultFilename); // Add the default filename
} else {
  baseDir = path.dirname(outputFile); // Otherwise, use the directory of the file
}

// Check directories for .git or package.json and update/create .gitignore or .npmignore
const gitDir = path.join(baseDir, '.git');
const npmFile = path.join(baseDir, 'package.json');
const gitignoreFile = path.join(baseDir, '.gitignore');
const npmignoreFile = path.join(baseDir, '.npmignore');

// Helper function to ensure ignore files have proper entries and formatting
function updateIgnoreFile(ignoreFile, referenceFile, relativeOutputFile) {
  let ignoreContent = '';

  if (fs.existsSync(ignoreFile)) {
    // Read existing ignore file content
    ignoreContent = fs.readFileSync(ignoreFile, 'utf8');

    // Ensure a trailing newline for proper appending
    if (!ignoreContent.endsWith('\n')) {
      ignoreContent += '\n';
    }
  }

  if (!ignoreContent.includes(`${relativeOutputFile}\n`)) {
    // Append the new entry with a trailing newline
    ignoreContent += `${relativeOutputFile}\n`;
    fs.writeFileSync(ignoreFile, ignoreContent);
    if (!silent) {
      console.log(
        fs.existsSync(ignoreFile)
          ? `Updated ${path.basename(ignoreFile)} with: ${relativeOutputFile}`
          : `Created ${path.basename(ignoreFile)} and added: ${relativeOutputFile}`
      );
    }
  }
}

// Update .gitignore if in a Git repository
if (fs.existsSync(gitDir)) {
  const relativeOutputFile = path.relative(baseDir, outputFile);
  updateIgnoreFile(gitignoreFile, gitDir, relativeOutputFile);
}

// Update .npmignore if in an NPM package directory
if (fs.existsSync(npmFile)) {
  const relativeOutputFile = path.relative(baseDir, outputFile);
  updateIgnoreFile(npmignoreFile, npmFile, relativeOutputFile);
}

if (!silent) console.log(`\nAll specified files have been processed and saved to ${outputFile}`);
