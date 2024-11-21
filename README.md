# acfp: AI Chat File Packer
Packs your coding project structure and file contents into a single txt file to upload to AI chats like ChatGPT for better and more sensible assistance.

## Usage
With npm installed, simply run the following command in your project's root directory (or any other folder you want to pack):

```bash
npx acfp
```

If you prefer, you can also install this package globally and then simply execute `acfp`.

## Options

| Option                     | Description                                                  |
|----------------------------|--------------------------------------------------------------|
| `-h`,<br>`--help` | Show this help |
| `-s`,<br>`--silent` | Do not log progress to the console |
| `-ml`,<br>`--multiline` | Log progress in the console as multiple lines (can be helpful for debugging) |
| `-d`,<br>`--dir` | Specify the input directory (default: the current working directory) |
| `-o`,<br>`--output` | Specify the output file path and optionally name (default: `combined_output.txt` in the source directory) |
| `-e`,<br>`--ext` | Specify the file extensions that should be processed, without a leading dot, as a comma separated list. Files with a leading dot, like .htaccess, must be added with a leading dot. Set to empty to process all files not in the ignore list. (default: `.htaccess, c, cpp, cs, css, h, htm, html, java, js, json, less, md, php, py, rb, sass, sh, sql, ts, txt, vue, xml, yaml, yml`) |
| `-ea`,<br>`--ext-append` | Like `-e` / `--ext,` but appends to the default list. |
| `-id`,<br>`--ignore-dirs` | Specify the directories to ignore, relative to the source directory, as a comma separated list. (default: `.git, bin, dist, lib/vendor, node_modules, svn, vendor`) |
| `-ida`,<br>`--ignore-dirs-append` | Like `-id` / `--ignore-dirs,` but appends to the default list. |
| `-if`,<br>`--ignore-files` | Specify the files to ignore, relative to the source directory, as a comma separated list. (default: `package-lock.json`) |
| `-ifa`,<br>`--ignore-files-append` | Like `-if` / `--ignore-files,` but appends to the default list. |
| `-ie`,<br>`--ignore-ext` | Specify the file extensions to ignore, without a leading dot, as a comma separated list. Files with a leading dot, like .htpasswd, must be added with a leading dot. (default: `.htpasswd, avi, avif, class, dll, eot, exe, flv, gif, jar, jpeg, jpg, log, m4a, m4v, mov, mp2, mp3, mp4, mpeg, mpg, ogg, otf, png, rlib, ttf, wav, woff, woff2, zip`) |
| `-iea`,<br>`--ignore-ext-append` | Like `-ie` / `--ignore-ext,` but appends to the default list. |

### Per-project configuration

You can store a project-based configuration that will be merged with the default config and can be overridden by command line option arguments. If your project has a `package.json` file, you can add a key `"acfp"` to its root, or put an `acfp.config.json` file into the project root directory.

The keys for the configuration must be the long argument names of the options without dashes. Boolean options (like `silent` or `multiline`) can be configured with boolean values, options expecting a list can either be arrays or strings with a comma separated list. Example:

```json
{
    "multiline": true,
    "ext": [],
    "ignore-ext": ["md", "json"],
    "ignore-files-append": "LICENSE,README.md"
}
```

This would force multiline mode, set `ext` to an empty value (meaning that all files will be processed), set the ignored extensions to `md` and `json`, and append the `LICENSE` and `README.md` files to the list of ignored files.
