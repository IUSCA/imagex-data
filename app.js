#!/usr/bin/node

var express = require('express');
var jwt = require('jsonwebtoken');
var path = require('path');
var logger = require('morgan');
var fs = require('fs');

var config = require('./config/config').config;

var app = express();
//app.use(logger(app.get('DEBUG'))); //TODO - pull it from config or app.get('env')?

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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    //console.dir(req.headers.authorization);
    console.dir(err);
    res.status(err.status || 500);
    res.json(err);
});

module.exports = app;

