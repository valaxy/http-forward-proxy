var https = require('https'),
    http  = require('http'),
    fs    = require('fs')

var req = https.request({
	hostname: 'mp.weixin.qq.com', //'101.226.129.204'
	port    : 443,
	path    : '/',
	method  : 'GET'
}, function (res) {
	res.on('data', function (d) {
		console.log(d + '')
	})
})
req.end()


//http.createServer(function (req, res) {
//	console.log(req.url)
//	console.log(req.rawHeaders)
//	console.log('come')
//	res.writeHead(200)
//	res.end('hello world\n')
//}).listen(9494)


//https.createServer({
//	key : fs.readFileSync('d:/catest/proxpy.pem'),
//	cert: fs.readFileSync('d:/catest/proxpy.crt')
//}, function (req, res) {
//
//
//	console.log('come https')
//	res.writeHead(200)
//	res.end('hello world\n')
//}).listen(443)