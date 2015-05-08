var http  = require('http'),
    fs    = require('fs'),
    url   = require('url'),
    path  = require('path'),
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


var getInjectScript = function () {
	return '<script>' + fs.readFileSync(path.join(__dirname, '../inject/totoro.js')) + '</script>' +
		'<script>' + fs.readFileSync(path.join(__dirname, '../inject/report.js')) + '</script>'
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
		//html = html.replace('"options":[{"name":"31号 王香媛","cnt":404,"selected":true}',
		//	'"options":[{"name":"31号 王香媛","cnt":404,"selected":false}')
		//var matchStr = 'zepto1f908c.js"></script>'

		var matchStr = '<head>'
		var injectPos = html.toLowerCase().indexOf(matchStr)
		if (injectPos >= 0) {
			res.write(html.substr(0, injectPos + matchStr.length))
			res.write(getInjectScript())
			res.write(html.substr(injectPos + matchStr.length))
		} else {
			res.write(html)
			console.error(req.url + '  cannot inject js')
		}
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
			console.log('listen to 127.0.0.1:%s', config.port)
		})
}


module.exports = HttpProxyServer