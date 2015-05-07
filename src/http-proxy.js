var http       = require('http'),
    fs         = require('fs'),
    url        = require('url'),
    injectFind = require('./inject'),
    path       = require('path'),
    https      = require('https')


var proxyUrl
var createProxyReqOptionsWithProxy = function (req) {
	delete req.headers['accept-encoding'] // do not want encode
	return {
		hostname: proxyUrl.hostname,
		port    : proxyUrl.port,
		path    : req.url, // if use proxy, it must be a complete url
		method  : req.method,
		headers : req.headers
	}
}


var createProxyReqOptionsNoProxy = function (req) {
	return {
		hostname: req.headers['host'],
		path    : req.path,
		port    : req.port,
		method  : req.method,
		headers : req.headers
	}
}


var getInjectScript = function () {
	return '<script>' + fs.readFileSync(path.join(__dirname, '../front/inject.js')) + '</script>'
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
		var injectPos = html.toLowerCase().indexOf('<head>')
		if (injectPos >= 0) {
			res.write(html.substr(0, injectPos + 6))
			res.write(getInjectScript())
			res.write(html.substr(injectPos + 6))
		} else {
			console.error(req.url + '  cannot inject js')
		}
		res.end()
	})
}


var createOnRequest = function (createProxyReq) {
	return function (req, res) {
		//console.log('a http come: ' + req.url)

		// make a proxy request
		var reqOptions = createProxyReq(req)
		http.request(reqOptions, function (proxyRes) {
			proxyRes.headers.connection = 'close'      // proxy no need connection
			delete proxyRes.headers['content-length'] // content-length has changed

			res.writeHead(proxyRes.statusCode, proxyRes.headers)
			//if (proxyRes.statusCode != 200) {
			//	console.warn(proxyRes.statusCode)
			//}

			var contentType
			var isHTML = (contentType = proxyRes.headers['content-type']) && contentType.indexOf('text/html') >= 0
			if (isHTML) {
				injectProxy(proxyRes, req, res)
			} else {
				directProxy(proxyRes, req, res)
			}

		}).on('error', function (err) {
			console.error(err)
		}).end()
	}
}


module.exports = function (config) {
	var createProxyReq
	if (config.proxy) {
		proxyUrl = url.parse(config.proxy)
		createProxyReq = createProxyReqOptionsWithProxy
		console.log('use a proxy: ' + config.proxy)
	} else {
		createProxyReq = createProxyReqOptionsNoProxy
		console.log('no proxy')
	}


	// create HTTP server
	http.createServer(createOnRequest(createProxyReq))
		.on('error', function (err) {
			console.error(err)
		})
		.listen(config.port)
	console.log('listen to 127.0.0.1:%s', config.port)

	//// for test
	//http.createServer(function (req, res) {
	//	res.write('123')
	//	res.end()
	//}).listen(9999)
}