var http  = require('http'),
    url   = require('url'),
    https = require('https')


var proxyUrl
var createTranspondOptionsWithProxy = function (req) {
	delete req.headers['accept-encoding'] // do not want encode
	return {
		hostname: proxyUrl.hostname,
		port    : proxyUrl.port,
		path    : req.url, // if use proxy, it must be a complete url
		method  : req.method,
		headers : req.headers
	}
}


var createTranspondOptionsNoProxy = function (req) {
	delete req.headers['accept-encoding'] // do not want encode
	return {
		hostname: req.headers['host'],
		path    : req.url,
		method  : req.method,
		headers : req.headers
	}
}


var directProxy = function (proxyRes, req, res) {
	proxyRes.on('data', function (chunk) {
		res.write(chunk)
	})
	proxyRes.on('end', function () {
		res.end()
	})
}


var injectProxy = function (proxyRes, req, res) {
	var html = ''
	proxyRes.on('data', function (chunk) {
		html += chunk
	})
	proxyRes.on('end', function () {
		html = require('../dev/inject/totoro')(html)
		res.write(html)
		res.end()
	})
}


var onRequest = function (req, res) {
	// make a transpond request
	var options = this._createTranspondOptions(req)
	http.request(options, function (transpondRes) {
		transpondRes.headers.connection = 'close'      // no need connection
		delete transpondRes.headers['content-length'] // content-length has changed

		res.writeHead(transpondRes.statusCode, transpondRes.headers)

		var isHTML = transpondRes.headers['content-type']
			&& transpondRes.headers['content-type'].indexOf('text/html') >= 0

		//
		// choose to use proxy
		//
		// /__totoro_oid=[^&#]+/.test(req.url) && /__totoro_lid=[^&#]+/.test(req.url) &&
		if (isHTML) {
			injectProxy(transpondRes, req, res)
		} else {
			directProxy(transpondRes, req, res)
		}

	}).on('error', function (err) {
		console.error(err)
	}).end()
}


var HttpProxyServer = function (config) {
	this.injectHandler = []
	this._config = config
	this._createTranspondOptions = null
}


HttpProxyServer.prototype.startServer = function () {
	var config = this._config
	if (config.proxy) {
		proxyUrl = url.parse(config.proxy)
		this._createTranspondOptions = createTranspondOptionsWithProxy
		console.log('use a proxy: ' + config.proxy)
	} else { // not use a proxy
		this._createTranspondOptions = createTranspondOptionsNoProxy
		console.log('no proxy')
	}


	// create HTTP server
	http.createServer(onRequest.bind(this))
		.on('error', function (err) {
			console.error(err)
		})
		.listen(config.port, function () {
			console.log('http inject server is listening to 127.0.0.1:%s', config.port)
		})
}


module.exports = HttpProxyServer