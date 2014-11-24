/*global require, process, __dirname, console */
/*jslint node:true, vars:true */
"use strict";

var argv = require('minimist')(process.argv.slice(2));
var findit = require('findit');
var path = require('path');
var fs = require('fs');
var add = argv.add;
var remove = argv.remove;
var include = argv.include;
var exclude = argv.exclude;
var annotation = '/* @flow */\n';
var weakAnnotation = '/* @flow weak */\n';
var findAnnotationReg = /(^\/\*\*?[^\/]*)@flow(?: weak)?([^\/]*\*\/)/;
var filesCount = 0;
var listOfFiles;
var pathToDir;
var pathStats;
var finder;
var weak;

var ignoreFile = function (file) {
    return !include.test(file) || exclude.test(file);
};

var getContentsWithAnnotation = function (file, contents) {
    if (findAnnotationReg.test(contents)) {
        console.log('Annotation already present in file:', file);
        return;
    }
    return annotation + contents;
};

var getContentsWithoutAnnotation = function (file, contents) {
    var matches = contents.match(findAnnotationReg);
    var firstComment;
    var rest;
    findAnnotationReg.lastIndex = 0;
    if (!matches || matches.length < 3) {
        console.log('Annotation not found in file:', file);
        return;
    }
    firstComment = matches[0];
    rest = contents.charAt(firstComment.length) === '\n' ?
            contents.substr(firstComment.length + 1) : firstComment.length;
    if ([annotation, weakAnnotation].indexOf(firstComment + '\n') > -1) {
        contents = rest;
    } else {
        contents = matches[1] + matches[2] + rest;
    }
    return contents;
};

var onFindFilePath = function (file) {
    if (ignoreFile(file)) {
        return;
    }
    fs.readFile(file, 'utf-8', function (err, contents) {
        if (err) {
            finder.stop();
            throw err;
        }
        if (add) {
            contents = getContentsWithAnnotation(file, contents);
        } else {
            contents = getContentsWithoutAnnotation(file, contents);
        }
        fs.writeFile(file, contents, function (writeErr) {
            if (writeErr) {
                finder.stop();
                throw writeErr;
            }
            console.log('Successfully ' + (add ? 'added annotation to' : 'removed annotation from') + ' file:', file);
            filesCount++;
        });
    });
};

var startUsingPathToDir = function () {
    finder = findit(pathToDir);

    finder.on('file', onFindFilePath);

    finder.on('done', function () {
        console.log('Successfully updated '  + filesCount + ' files');
    });
};

if (add && remove) {
    throw new Error('Cannot add and remove annotations at the same time');
}

if (!add && !remove) {
    throw new Error('Must specify --add or --remove option');
}

if (argv.weak) {
    annotation = weakAnnotation;
}

// Set up include and exclude regexs
include = typeof include === 'string' ? new RegExp(include) : /\.js$/;
exclude = typeof exclude === 'string' ? new RegExp(exclude) : /^\./;

// If list of files argument is provided we load the file and parse the JSON
if (listOfFiles) {
    listOfFiles = fs.readFileSync(path.resolve(listOfFiles));
    try {
        listOfFiles = JSON.parse(listOfFiles);
    } catch (e) {
        throw new Error('--listOfFiles argument must be a path to a valid JSON file');
    }
}

// If add argument is provided we either resolve the argument as a path if
// a value string is provided or we default to current working directory.
// Same thing is done if remove is the argument
if (add) {
    pathToDir = (add === true) ? __dirname : path.resolve(add);
    add = true;
} else if (remove) {
    pathToDir = (remove === true) ? __dirname : path.resolve(remove);
    add = false;
}

// ------------------------------------
// Start the operation

if (listOfFiles) {
    listOfFiles.forEach(function (file) {
        file = path.resolve(file);
        onFindFilePath(file);
    });
} else {
    pathStats = fs.statSync(pathToDir);
    if (pathStats.isDirectory()) {
        startUsingPathToDir(pathToDir);
    } else if (pathStats.isFile()) {
        onFindFilePath(pathToDir);
    } else {
        throw new Error('Path to directory or file is required with --add/--remove args. Or use --listOfFiles');
    }
}