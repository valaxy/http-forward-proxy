var http      = require('http'),
    httpProxy = require('http-proxy')

var proxy = httpProxy.createProxyServer({})

proxy.on('proxyReq', function (proxyReq, req, res, options) {
	console.log('proxy')
	console.log(options)
	proxyReq.removeHeader('cookie')
	proxyReq.removeHeader('connection')
	proxyReq.removeHeader('proxy-connection')
	proxyReq.removeHeader('accept-language')
	proxyReq.removeHeader('accept-encoding')
	proxyReq.removeHeader('user-agent')
	proxyReq.removeHeader('cache-control')
	proxyReq.removeHeader('accept')



	//proxyReq.setHeader('Cookie', null)
	//proxyReq.setHeader('Connection', null)
})


var server = http.createServer(function (req, res) {
	proxy.web(req, res, {
		target: 'http://proxy.tencent.com:8080'
	})
})
server.listen(9494)


