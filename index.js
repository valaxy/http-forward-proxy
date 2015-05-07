var program = require('commander')
var init = require('./src/http-proxy')
var _ = require('underscore')


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
	.option('')
	.parse(process.argv)


var config = _.extend({
	port: 55555
}, filterConfig({
	proxy: program.proxy,
	port : program.port
}))


init(config)