/*jshint node:true*/
/*jslint node:true*/
"use strict";

var exec = require("child_process").exec;
var path = require("path");
var cwd = __dirname;

function runCommand(command, args, done) {
    if(typeof args === "function") {
        done = args;
        args = "";
    }
    if(typeof args === 'array') {
        args = args.join(' ');
    }

    exec("p4 " + command + " " + (args || ""), {cwd:cwd}, function(err, stdOut, stdErr) {
        if(err) {return done(err);}
        if(stdErr) {return done(new Error(stdErr));}

        done(null, stdOut);
    });
}

function runShellCommand(command, args, done) {
    if(typeof args === "function") {
        done = args;
        args = "";
    }
    if(typeof args === 'array') {
        args = args.join(' ');
    }

    exec(command + " " + (args || ""), {cwd:cwd}, function(err, stdOut, stdErr) {
        if(err) {return done(err);}
        if(stdErr) {return done(new Error(stdErr));}

        done(null, stdOut);
    });
}

function edit(filepath, done) {
    runCommand("edit", filepath, done);
}

function add(filepath, done) {
    runCommand("add", filepath, done);
}

function smartEdit(filepath, done) {
    edit(filepath, function(err) {
        if(!err) {return done();}

        add(filepath, done);
    });
}

function revertUnchanged(filepath, done) {
    runCommand("revert", "-a", done);
}

function parseStats(stats) {
    var statsObj = {}
      , lastKey;
    stats = stats.split('\n');
    stats.forEach(function(line){
        var level = 0
          , key = ''
          , value = ''
          , obj = [];
        //line has 3 dots and a space at the beginning, pull that off
        do{
            line = line.slice(4);
            level++;
        }
        while(0===line.indexOf('... '));
        obj = line.split(' ');
        obj[1] = obj.slice(1).join(' ');
        key = obj[0];
        value = obj[1];
        if(!key){ return; }
        if(value === ''){
            value = true;
        }
        if(level === 1){
            statsObj[key] = value;
            //lastKey = key;
        } else if(level === 2){
            lastKey = 'other';
            if(typeof statsObj[lastKey] !== 'object'){
                statsObj[lastKey] = {};
            }
            statsObj[lastKey][key] = value;
        }
    });
    return statsObj;
}

function statDir(filepath, done) {
    runCommand('fstat', path.join(filepath,'*'), done);
}

function recursiveStatDir(filepath, done) {
    runCommand('fstat', path.join(filepath,'...'), done);
}

function stat(filepath, done) {
    runCommand('fstat', filepath, function(err,out){
        if(err){return done(err);}
        return done(null,parseStats(out));
    });
}

function have(filepath, done) {
    stat(filepath, function(err,stats){
        if(err){return done(err);}
        return done(null,stats.haveRev);
    });
}

function revert(filepath, done) {
    runCommand('revert', filepath, done);
}

function submit(filepath, desc, done) {
    runCommand('submit', [filepath,'-d','"'+desc+'"'], done);
}

function sync(filepath, done) {
    runCommand('sync', filepath, done);
}

function syncDir(filepath, done) {
    runCommand('sync', path.join(filepath,'*'), done);
}

function recursiveSyncDir(filepath, done) {
    runCommand('sync', path.join(filepath,'...'), done);
}

function login(username, password, done) {
    runShellCommand('echo "'+password+'" | p4 login -u "'+username+'"', done);
}

function cd(dir){
    cwd = path.join(cwd,dir);
    //allow chaining by returning exports
    //i.e. p4.cd('dir').edit('file')
    //or p4.cd('path').cd('to').cd('dir')
    return exports;
}

exports.edit = edit;
exports.add = add;
exports.smartEdit = smartEdit;
exports.run = runCommand;
exports.revertUnchanged = revertUnchanged;
exports.stat = stat;
exports.statDir = statDir;
exports.recursiveStatDir = recursiveStatDir;
exports.revert = revert;
exports.submit = submit;
exports.sync = sync;
exports.syncDir = syncDir;
exports.recursiveSyncDir = recursiveSyncDir;
exports.have = have;
exports.login = login;
exports.cd = cd;
