// Includes
var https = require('https');
var express = require('express');
var tls = require('tls');
var vhost = require('vhost');
var fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Express objects
var ardustApp = express();
var ardustApiApp = express();

//ardustApp.use('/', express.static(__dirname + '/public/ardust.tn'));
ardustApp.get('/*', express.static(__dirname + '/public/ardust.tn/index.html'));

const handler = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Headers', '*');
    next();
    return;
}

ardustApiApp.use('*', createProxyMiddleware({ target: 'http://127.0.0.1:5000', changeOrigin: true }));

ardustApiApp.options('*', handler);
ardustApiApp.use(handler);



// SSL Constants
const ardust_site = {
    app: ardustApp,
    context: tls.createSecureContext({
        key: fs.readFileSync(__dirname + '/certficates/ardust.tn/private.key').toString(),
        cert: fs.readFileSync(__dirname + '/certficates/ardust.tn/certificate.crt').toString(),
        ca: fs.readFileSync(__dirname + '/certficates/ardust.tn/ca_bundle.crt').toString()
    }).context
};

const ardust_api_site = {
    app: ardustApiApp,
    context: tls.createSecureContext({
        key: fs.readFileSync(__dirname + '/certficates/api.ardust.tn/private.key').toString(),
        cert: fs.readFileSync(__dirname + '/certficates/api.ardust.tn/certificate.crt').toString(),
        ca: fs.readFileSync(__dirname + '/certficates/api.ardust.tn/ca_bundle.crt').toString()
    }).context
};

// Sites
var sites = {
    'api.ardust.tn': ardust_api_site,
    'www.ardust.tn': ardust_site,
    'ardust.tn': ardust_site
}

// Setup vhosts
var exp = express();
for (var s in sites) {
    console.log("add app for " + s);
    exp.use(vhost(s, sites[s].app));
}

// Redirect from http port  to https
var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    console.log(req.headers['host']);
    console.log(req.url);
    res.end();
}).listen(80);

// HTTPS Server
var secureOpts = {
    SNICallback: function (domain, cb) {
        if (typeof sites[domain] === "undefined") {
            cb(new Error("domain not found"), null);
            console.log("Error: domain not found: " + domain);
        } else {
            cb(null, sites[domain].context);
        }
    },
    key: fs.readFileSync(__dirname + '/certficates/ardust.tn/private.key').toString(),
    cert: fs.readFileSync(__dirname + '/certficates/ardust.tn/certificate.crt').toString(),
    ca: fs.readFileSync(__dirname + '/certficates/ardust.tn/ca_bundle.crt').toString()
};

var https = require('https');
var httpsServer = https.createServer(secureOpts, exp);


httpsServer.listen(443, function () {
    console.log("Listening https on port: " + + this.address().port);
});


