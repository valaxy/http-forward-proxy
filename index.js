var program         = require('commander'),
    _               = require('underscore'),
    HttpProxyServer = require('./src/http-proxy'),
    PacServer       = require('./src/pac-server')


var filterConfig = function (config) {
	for (var key in config) {
		if (!config[key]) {
			delete config[key]
		}
	}
	return config
}


program
	.version('0.1.0-dev')
	.option('--proxy <proxy>', 'if you has a proxy, you should provide "proxyHostName:port"')
	.option('--port <port>', 'default is 55555')
	.option('--pacPort <pacPort>', 'port of how to get pac file, default is 55556')
	.option('--packDir <packDir>', 'pac file dir, default is "./pac/"')
	.parse(process.argv)


var config = _.extend({
	port   : 55555,
	pacPort: 55556,
	packDir: './pac'
}, filterConfig({
	proxy  : program.proxy,
	port   : program.port,
	pacPort: program.pacPort,
	packDir: program.packDir
}))


console.log('config is: ', config)

var s1 = new HttpProxyServer(config)
s1.startServer()

var s2 = new PacServer(config)
s2.startServer()