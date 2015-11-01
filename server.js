#!/usr/bin/node
'use strict';

//node
var path = require('path');
var fs = require('fs');
var compress = require('compression');

//contrib
var express = require('express');
var jwt = require('jsonwebtoken');
var winston = require('winston');
var expressWinston = require('express-winston');

//mine
var config = require('./config');
var logger = new winston.Logger(config.logger.winston);

var app = express();
app.use(expressWinston.logger(config.logger.winston));
app.use(compress());

/*
var publicKey = fs.readFileSync('config/auth.pub');
function jwtcheck(req, res, next) {
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
*/

//for debugging..
app.use(function(req, res, next) {
    console.log("requested:"+req.url);
    next();
});

for(var url in config.paths) {
    var props = config.paths[url];
    props.public_key = fs.readFileSync(props.public_key);
    console.log("mapping "+url+" to "+props.path);
    app.use(url, function(req, res, next) {
        //Allow CORS if requested via config
        if(props.allow_origin) {
            res.header("Access-Control-Allow-Origin", props.allow_origin);
            res.header("Access-Control-Allow-Headers", "X-Requested-With,Authorization");
        }
        
        //pull jwt token from header or via query
        var token = req.query.at;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        }

        //verify token
        var public_key = config.paths[url].public_key;
        jwt.verify(token, public_key, function(err, decoded) {
            if(err) {
                res.send(err);
            } else {
                //check scope to make sure user has access to this path
                var allowed_paths = decoded.scopes[props.scope];
                var allowed = false;
                allowed_paths.forEach(function(allowed_path) {
                    //console.log(allowed_path);
                    //console.log(req.url.indexOf(allowed_path));
                    if(req.url.indexOf(allowed_path) === 0) {
                        //console.log("allowed"); 
                        allowed = true;
                    }
                });
                if(allowed) next();
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
    logger.info(err);
    logger.info(err.stack);
    res.status(err.status || 500);
    res.json({message: err.message, /*stack: err.stack*/}); //let's hide callstack for now
});

process.on('uncaughtException', function (err) {
    //TODO report this to somewhere!
    logger.error((new Date).toUTCString() + ' uncaughtException:', err.message)
    logger.error(err.stack)
    //process.exit(1); //some people think we should do this.. but I am not so sure..
})

exports.app = app;
exports.start = function() {
    var port = process.env.PORT || config.express.port || '8080';
    var host = process.env.HOST || config.express.host || 'localhost';
    app.listen(port, host, function() {
        console.log("data server listening on port %d in %s mode", port, app.settings.env);
    });
}


