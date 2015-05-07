var http       = require('http'),
    fs         = require('fs'),
    url        = require('url'),
    injectFind = require('./inject'),
    path       = require('path'),
    https      = require('https')


var proxyUrl
var createProxyReqOptionsWithProxy = function (req) {
	return {
		hostname: proxyUrl.hostname,
		port    : proxyUrl.port,
		path    : req.url, // if use proxy, it must be a complete url
		method  : req.method,
		headers : req.headers
	}
}


var createProxyReqOptionsNoProxy = function (req) {
	//console.log(req)
	var reqUrl = url.parse(req.url)
	console.log(req.url)
	return {
		host   : 'mp.weixin.qq.com', // req.headers['host'],
		path   : req.path,
		port   : req.port,
		method : req.method,
		headers: req.headers
	}
}


var getInjectScript = function () {
	return '<script>' + fs.readFileSync(path.join(__dirname, '../front/inject.js')) + '</script>'
}


var createOnRequest = function (createProxyReq, httpOrHttps) {
	var isHttp = httpOrHttps === http
	return function (req, res) {
		console.log('a ' + (isHttp ? 'http' : 'https') + ' come: ' + req.url)

		// make a proxy request
		var reqOptions = createProxyReq(req)
		console.log(reqOptions)
		httpOrHttps.request(reqOptions, function (proxyRes) {
			proxyRes.headers.connection = 'close'      // proxy no need connection
			delete proxyRes.headers['content-length'] // content-length has changed

			res.writeHead(proxyRes.statusCode, proxyRes.headers)
			//if (proxyRes.statusCode != 200) {
			//	console.warn(proxyRes.statusCode)
			//}
			console.log('here')

			var findInject = false
			var index

			var contentType
			var onData
			if ((contentType = proxyRes.headers['content-type']) && contentType.indexOf('text/html') >= 0) {
				onData = function (chunk) {
					if (!findInject && ((index = injectFind(chunk)) >= 0)) {
						findInject = true
						res.write(chunk.slice(0, index + 1), 'binary')
						res.write(getInjectScript())
						res.write(chunk.slice(index + 1), 'binary')
						return
					}
					res.write(chunk, 'binary')
				}
			} else {
				onData = function (chunk) {
					res.write(chunk, 'binary')
				}
			}

			proxyRes.on('data', onData)
			proxyRes.on('end', function () {
				res.end()
			})
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
	http.createServer(createOnRequest(createProxyReq, http))
		.on('error', function (err) {
			console.error(err)
		})
		.listen(config.port)
	console.log('listen to 127.0.0.1:%s', config.port)


	// create HTTPS server
	https.createServer({
		key : fs.readFileSync('d:/catest/proxpy.pem'),
		cert: fs.readFileSync('d:/catest/proxpy.crt')
	}, createOnRequest(createProxyReq, http))
		.on('error', function (err) {
			console.error(err)
		})
		.listen(8887)
	console.log('listen to 127.0.0.1:443')


	// for test
	http.createServer(function (req, res) {
		res.write('123')
		res.end()
	}).listen(9999)
}