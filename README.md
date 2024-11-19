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
| `-h`,<br>`--help`                  | Show this help                                                                                                                                                                                                                                                                                              |
| `-s`,<br>`--silent`                | Do not log progress to the console                                                                                                                                                                                                                                                                          |
| `-ml`,<br>`--multiline`            | Log progress in the console as multiple lines (can be helpful for debugging)                                                                                                                                                                                                                                |
| `-d`,<br>`--dir`                   | Specify the input directory<br>(default: the current working directory)                                                                                                                                                                                                                                        |
| `-o`,<br>`--output`                | Specify the output file path and optionally name<br>(default: `"combined_output.txt"` in the source directory)                                                                                                                                                                                                   |
| `-e`,<br>`--ext`                   | Specify the file extensions that should be processed, without a leading dot, as a comma-separated list. Files with a leading dot, like `.htaccess`, must be added with a leading dot. Set to empty to process all files not in the ignore list.<br>(default: `".htaccess, c, cpp, cs, css, h, htm, html, java, js, json, less, md, php, py, rb, sass, sh, sql, ts, txt, xml, yaml, yml"`) |
| `-ea`,<br>`--ext-append`           | Like `-e` / `--ext`, but appends to the default list.                                                                                                                                                                                                                                                        |
| `-id`,<br>`--ignore-dirs`          | Specify the directories to ignore, relative to the source directory, as a comma-separated list.<br>(default: `".git, bin, dist, lib/vendor, node_modules, svn, vendor"`)                                                                                                                                        |
| `-ida`,<br>`--ignore-dirs-append`  | Like `-id` / `--ignore-dirs`, but appends to the default list.                                                                                                                                                                                                                                           |
| `-if`,<br>`--ignore-files`         | Specify the files to ignore, relative to the source directory, as a comma-separated list.<br>(default: `"package-lock.json"`)                                                                                                                                                                                   |
| `-ifa`,<br>`--ignore-files-append` | Like `-if` / `--ignore-files`, but appends to the default list.                                                                                                                                                                                                                                         |
| `-ie`,<br>`--ignore-ext`           | Specify the file extensions to ignore, without a leading dot, as a comma-separated list. Files with a leading dot, like `.htpasswd`, must be added with a leading dot.<br>(default: `".htpasswd, avi, avif, class, dll, eot, exe, flv, gif, jar, jpeg, jpg, log, m4a, m4v, mov, mp2, mp3, mp4, mpeg, mpg, ogg, otf, png, rlib, ttf, wav, woff, woff2, zip"`) |
| `-iea`, `--ignore-ext-append`   | Like `-ie` / `--ignore-ext`, but appends to the default list.                                                                                                                                                                                                                                             |
