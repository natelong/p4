# p4
p4 is a tiny utility library for dealing with Perforce. Since Perforce sets all files in its workspace as read-only, and expects you to check out any file before editing, automated build processes and whatnot can stumble when trying to write to the file system. This library gives you a simple module to get Perforce out of the way.

## Installation
Get the module from NPM
```shell
$ npm install p4 --save
```
Include it in your project
```javascript
var p4 = require("p4");
```

## API Reference
### p4.edit(path, done)
Tell Perforce to open a file for editing
```javascript
p4.edit("output.css", function(err, stdout) {
    if(err) console.error(err.message);
    console.log(stdout);
});
```

### p4.add(path, done)
Tell Perforce to add a file to the default pending changelist
```javascript
p4.add("output.css", function(err, stdout) {
    if(err) console.error(err.message);
    console.log(stdout);
});
```

### p4.smartEdit(path, done)
Start by asking Perforce (nicely) to open a file for editing. If that doesn't work, try adding the file.

This is really meant to be a catch-all for automated output from tools. If you're generating files, there's a good chance that they don't exist yet in the workspace, but they might.

>Note: Since you're sending requests to your Perforce server with each of these commands, don't just run this willy-nilly on every file in your project or something silly like that.

```javascript
p4.smartEdit("output.css", function(err, stdout) {
    if(err) console.error(err.message);
    console.log(stdout);
});
```

### p4.run(command, [args], done)
Run a command directly, rather than through a proxying function. You can use this to call arbitrary commands, but if you find yourself using this often, feel free to submit a pull request updating the API or an issue describing the command and what you'd like to see returned.

```javascript
p4.run("edit", "path/to/file", function(err, stdout) {
    if(err) console.error(err.message);
    console.log(stdout);
});

// With optional "args" arg
p4.run("info", function(err, stdout) {
    if(err) console.error(err.message);
    console.log(stdout);
});
```
