/*jshint node:true*/
/*jslint node:true*/
"use strict";

var exec = require("child_process").exec;
var path = require("path");
var cwd = __dirname;
var options = {};

function cd(dir){
    cwd = path.resolve(cwd,dir);
    //allow chaining by returning exports
    //i.e. p4.cd('dir').edit('file')
    //or p4.cd('path').cd('to').cd('dir')
    return exports;
}

function setOpts(opts){
    Object.keys(opts).forEach(function(key){
        if(key === 'cwd'){
            //don't let them change cwd via setOpts...
            return;
        }
        options[key] = opts[key];
    });
    return exports;
}

function runCommand(command, args, done) {
    if(typeof args === "function") {
        done = args;
        args = "";
    }
    if(typeof args === 'array') {
        args = args.join(' ');
    }

    options.cwd = cwd;
    options.env.PWD = cwd;
    exec("p4 " + command + " " + (args || ""), options, function(err, stdOut, stdErr) {
        if(err) {return done(err);}
        //when we run p4 fstat *, it will say no such file(s) on dirs
        //fix this by reducing the error string and omitting matching lines
        //when calling join() on an empty array, it returns an empty string which is *falsy*
        stdErr = stdErr.split('\n').reduce(function(pval,line){
            if(!/no such file/.test(line)){
                //only include if it doesn't match our test
                pval.push(line);
            }
            return pval;
        },[]).join('\n');
        //this could more easily be done with stdErr = _.reject(stdErr.split('\n'),function(line){return /no such file/.test(line);}).join('\n') but learning reduce is a _good thing_ (TM) and the algorithm is arguably more descriptive and self-documenting when using reduce
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
        if(stdErr) {return done(new Error(stdErr),stdOut);}

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
    var statsArr = [];
    stats = stats.split('\n\n');
    stats.forEach(function(stat){
        if(stat === '' || stats === '\n'){
            return;
        }
        var statsObj = {}
        , lastKey;
        stat.split('\n').forEach(function(line){
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
        statsArr.push(statsObj);
    });
    if(statsArr.length === 1){
        return statsArr[0];
    }
    return statsArr;
}

function statDir(filepath, done) {
    if(filepath){
        cd(filepath);
    }
    runCommand('fstat','*', function(err,out){
        if(err){return done(err);}
        return done(null,parseStats(out));
    });
}

function recursiveStatDir(filepath, done) {
    if(filepath){
        cd(filepath);
    }
    runCommand('fstat','...', function(err,out){
        if(err){return done(err);}
        return done(null,parseStats(out));
    });
}

function stat(filepath, done) {
    cd(path.dirname(filepath));
    runCommand('fstat', path.basename(filepath), function(err,out){
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
    if(filepath){
        cd(filepath);
    }
    runCommand('sync', '*', done);
}

function recursiveSyncDir(filepath, done) {
    if(filepath){
        cd(filepath);
    }
    runCommand('sync', '...', done);
}

function login(username, password, done) {
    runShellCommand('echo "'+password+'" | p4 login -u "'+username+'"', done);
}

function pwd(){
    return cwd;
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
exports.pwd = pwd;
exports.setOpts = setOpts;
