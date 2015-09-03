#!/usr/bin/node

var express = require('express');
var jwt = require('express-jwt');
var path = require('path');
var logger = require('morgan');
var fs = require('fs');
var compress = require('compression');

var config = require('./config/config').config;

var app = express();
//app.use(logger(app.get('DEBUG'))); //TODO - pull it from config or app.get('env')?
app.use(compress());

var publicKey = fs.readFileSync('config/auth.pub');
function jwtcheck(req, res, next) {
    //console.log("accessing:"+req.url);
    //console.dir(req.user);
    if(!req.user) {
        res.status(401);
        res.json({message:"you are not authenticated"});
        return;
    }
    
    if(req.user.scopes) {
        if(req.user.scopes.data.allowed) {
            req.user.scopes.data.allowed.forEach(function(pattern) {
                if(req.url.indexOf(pattern) == 0) {
                    return next(); //allowed
                }
            });
        }
    }
    res.status(401);
    res.json({message:"you are not authorized to access the url:"+req.url});
}

console.log("using "+config.rootdir+" for /static");

//for debugging..
app.use(function(req, res, next) {
    console.log("accessing:"+req.url);
    next();
});

app.use('/', jwtcheck, express.static(config.rootdir));

/*
var publicKey = fs.readFileSync('config/auth.pub');
app.get('/', jwt({secret: publicKey}), function(req, res) {
    console.dir(req);
    res.json(req.user);
});
*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    console.dir(req.headers.authorization);
    console.dir(err);
    res.status(err.status || 500);
    res.json(err);
});

module.exports = app;

