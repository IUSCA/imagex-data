#!/usr/bin/node
'use strict';

//node
var path = require('path');
var fs = require('fs');
var winston = require('winston');
var compress = require('compression');

//contrib
var express = require('express');
var http = require('http');
var jwt = require('jsonwebtoken');
var expressWinston = require('express-winston');
var cors = require('cors');

//mine
var config = require('/opt/sca/config/config.js')(fs, winston);
var logger = new winston.Logger(config.logger.winston);

var app = express();
app.use(expressWinston.logger(config.logger.winston));
app.use(compress());

//for debugging..
app.use(function(req, res, next) {
    logger.debug("requested:"+req.url);
    next();
});

for(var url in config.data.paths) {
    var props = config.data.paths[url];

    logger.info("mapping "+url+" to "+props.path);
    
    var corsopt = {}
    if(props.allow_origin) corsopt.origin = props.allow_origin;
    app.use(url, cors(corsopt), function(req, res, next) {

        var token = req.query.at;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        jwt.verify(token, props.public_key, {algorithm: 'RS256'}, function(err, decoded) {
            if(err) {
                res.send(err);
            } else {
                //check scope to make sure user has access to this path
                var allowed_paths = decoded.scopes[props.scope];
                var allowed = false;
                allowed_paths.forEach(function(allowed_path) {
                    if(req.url.indexOf(allowed_path) === 0) {
                        allowed = true;
                    }
                });
                if(allowed) next();  //give em what they want
                else {
                    next({message: 'requested path not authorized by your token.', allowed_paths: allowed_paths, requested_url: req.url});
                }
            }
        });
    }, express.static(props.path));
}

app.get('/health', function(req, res) {
    res.json({status: 'ok'});
});

//error handling
app.use(expressWinston.errorLogger(config.logger.winston));
app.use(function(err, req, res, next) {
    if(typeof err == "string") err = {message: err};
    logger.error(err);
    if(err.stack) {
        logger.error(err.stack);
        err.stack = "hidden"; //for ui
    }
    res.status(err.status || 500);
    res.json(err);
});

process.on('uncaughtException', function (err) {

    logger.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    logger.error(err.stack)
})

exports.app = app;
exports.start = function() {
    var port = process.env.PORT || config.express.port || '8081';
    var host = process.env.HOST || config.express.host || 'localhost';
    
    app.listen(port, function() {
        logger.info("ImageX data service listening on port %d", port);
    });
}


