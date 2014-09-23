# p4
p4 is a tiny utility library for dealing with Perforce. Since Perforce sets all files in its workspace as read-only, and expects you to check out any file before editing, automated build processes and whatnot can stumble when trying to write to the file system. This library gives you a simple module to get Perforce out of the way.

## Installation
Get the module from NPM
```shell
$ npm install p4-oo --save
```
Include it in your project
```javascript
var P4 = require("p4-oo");
var p4 = new P4();
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

// Without optional "args" arg
p4.run("info", function(err, stdout) {
    if(err) console.error(err.message);
    console.log(stdout);
});
```

### p4.setOpts(options)
Set options for the child_process, these options persist across commands.
Also supports chaining.

```javascript
p4.setOpts({env:{P4PORT:'perforce:1666',P4USER:'username',P4CONFIG:'.p4config'}});
p4.edit("output.css", function(err, stdout) {
    if(err) console.error(err.message);
    console.log(stdout);
    //user 'username' now has 'output.css' checked out
});
```

### p4.cd(dir)
Change working directory for the perforce child_process. This persists across commands.
Also supports chaining.

```javascript
p4.cd('/').cd('dir');
p4.pwd();
//returns '/dir'
```

### p4.stat(file,done)
Stats a file and returns a JSON object with the file's properties.

Should look like the following:

    { depotFile: '//depot/output.css',
    clientFile: '/Users/username/workspace/output.css',
    isMapped: true,
    headAction: 'edit',
    headType: 'xtext',
    headTime: '1410890900',
    headRev: '25',
    headChange: '1184',
    headModTime: '1410890778',
    haveRev: '25',
    other: 
     { otherOpen0: 'user@other_workspace',
       otherAction0: 'edit',
       otherChange0: '1189',
       otherOpen: '1' } }



```javascript
p4.stat('output.css', function(err,stats){
    if(err) console.error(err.message);
    console.dir(stats);
});
```

### p4.statDir(directory,done)
Runs p4 fstat * in the directory. Ignores errors regarding subdirectories not being in workspace. Output matches `p4.stat` schema.

### p4.recursiveStatDir(directory,done)
Runs p4.fstat ... in the directory. Does not ignore errors, as it is running using perforce's `under this dir` rather than shell glob.

### p4.sync(filename,done)
Runs p4 sync filename in cwd.
If file is already at latest revision, is not under client, or perforce errors otherwise, error object will be set.
If sync is successful, data will look like this:

> //depot/output.css#25 - updating /Users/username/workspace/output.css

```javascript
p4.sync('output.css',function(err,data){
    if(err) console.error(err);
    console.log(data);
});
```
