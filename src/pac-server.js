var http    = require('http'),
    express = require('express')


var PacServer = function (config) {
	this._config = config
}

PacServer.prototype.startServer = function () {
	var config = this._config
	var app = express()

	app.get('/proxy.pac', function (req, res) {
		res.send('Hello World!')
	})

	app.listen(this._config.pacPort, function () {
		console.log('pac server is listening to %s', config.pacPort)
	})
}


module.exports = PacServer