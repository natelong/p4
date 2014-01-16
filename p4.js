/*jshint node:true*/
"use strict";

var exec = require("child_process").exec;

function runCommand(command, args, done) {
    exec("p4 " + command + " " + args, function(err, stdOut, stdErr) {
        if(err) return done(err);
        if(stdErr) return done(new Error(stdErr));

        done(null, stdOut);
    });
}

function edit(path, done) {
    runCommand("edit", path, done);
}

function add(path, done) {
    runCommand("add", path, done);
}

function smartEdit(path, done) {
    edit(path, function(err) {
        if(!err) return done();

        add(path, done);
    });
}

exports.edit = edit;
exports.add = add;
exports.smartEdit = smartEdit;
exports.run = runCommand;
