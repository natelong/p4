/*jslint node:true*/
"use strict";

var exec = require("child_process").exec;
var path = require("path");

function P4(){
    if(!this instanceof P4){
        return new P4();
    }
    this.cwd = __dirname;
    this.options = {};
}

P4.prototype.cd = function(dir){
    this.cwd = path.resolve(this.cwd,dir);
    //allow chaining by returning this
    //i.e. p4.cd('dir').edit('file')
    //or p4.cd('path').cd('to').cd('dir')
    return this;
};

P4.prototype.setOpts = function(opts){
    Object.keys(opts).forEach(function(key){
        if(key === 'cwd'){
            //don't let them change cwd via setOpts...
            return;
        }
        this.options[key] = opts[key];
    });
    return this;
};

P4.prototype.runCommand = function(command, args, done) {
    if(typeof args === "function") {
        done = args;
        args = "";
    }
    if(typeof args === 'array') {
        args = args.join(' ');
    }

    this.options.cwd = this.cwd;
    this.options.env.PWD = this.cwd;
    exec("p4 " + command + " " + (args || ""), this.options, function(err, stdOut, stdErr) {
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
        //this could more easily be done with this:
        //stdErr = _.reject(stdErr.split('\n'),function(line){return /no such file/.test(line);}).join('\n')
        //but learning reduce is a _good thing_ (TM) and the algorithm is arguably more descriptive and 
        //self-documenting when using reduce
        if(stdErr) {return done(new Error(stdErr));}

        done(null, stdOut);
    });
};

P4.prototype.runShellCommand = function(command, args, done) {
    if(typeof args === "function") {
        done = args;
        args = "";
    }
    if(typeof args === 'array') {
        args = args.join(' ');
    }

    exec(command + " " + (args || ""), {cwd:this.cwd}, function(err, stdOut, stdErr) {
        if(err) {return done(err);}
        if(stdErr) {return done(new Error(stdErr),stdOut);}

        done(null, stdOut);
    });
};

P4.prototype.edit = function(filepath, done) {
    this.runCommand("edit", filepath, done);
};

P4.prototype.add = function(filepath, done) {
    this.runCommand("add", filepath, done);
};

P4.prototype.smartEdit = function(filepath, done) {
    var self = this;
    this.edit(filepath, function(err) {
        if(!err) {return done();}

        self.add(filepath, done);
    });
};
/*jslint unparam:true*/
P4.prototype.revertUnchanged = function(filepath, done) {
    this.runCommand("revert", "-a", done);
};
/*jslint unparam:false*/

P4.prototype.parseStats = function(stats) {
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
};

P4.prototype.statDir = function(filepath, done) {
    var self = this;
    if(filepath){
        this.cd(filepath);
    }
    this.runCommand('fstat','*', function(err,out){
        if(err){return done(err);}
        return done(null,self.parseStats(out));
    });
};

P4.prototype.recursiveStatDir = function(filepath, done) {
    var self = this;
    if(filepath){
        this.cd(filepath);
    }
    this.runCommand('fstat','...', function(err,out){
        if(err){return done(err);}
        return done(null,self.parseStats(out));
    });
};

P4.prototype.stat = function(filepath, done) {
    var self = this;
    this.cd(path.dirname(filepath));
    this.runCommand('fstat', path.basename(filepath), function(err,out){
        if(err){return done(err);}
        return done(null,self.parseStats(out));
    });
};

P4.prototype.have = function(filepath, done) {
    this.stat(filepath, function(err,stats){
        if(err){return done(err);}
        return done(null,stats.haveRev);
    });
};

P4.prototype.revert = function(filepath, done) {
    this.runCommand('revert', filepath, done);
};

P4.prototype.submit = function(filepath, desc, done) {
    this.runCommand('submit', [filepath,'-d','"'+desc+'"'], done);
};

P4.prototype.sync = function(filepath, done) {
    this.runCommand('sync', filepath, done);
};

P4.prototype.syncDir = function(filepath, done) {
    if(filepath){
        this.cd(filepath);
    }
    this.runCommand('sync', '*', done);
};

P4.prototype.recursiveSyncDir = function(filepath, done) {
    if(filepath){
        this.cd(filepath);
    }
    this.runCommand('sync', '...', done);
};

P4.prototype.login = function(username, password, done) {
    this.runShellCommand('echo "'+password+'" | p4 login -u "'+username+'"', done);
};

P4.prototype.pwd = function(){
    return this.cwd;
};
module.exports = P4;
