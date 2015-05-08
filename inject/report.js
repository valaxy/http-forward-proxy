(function () {
	// only inject once
	if (!window.__wxtest_inject) {
		window.__wxtest_inject = true

		//var oldConsoleError = console.error
		//console.error = function (msg) {
		//	console.log(msg)
		//	oldConsoleError.apply(this, arguments)
		//}
		//

		console.log('[%s] test code injected', +new Date())

		// rewrite console
		// if (typeof console === 'undefined') console = {}
		//console.log = function () {
		//	totoro.report({
		//		action: 'log',
		//		info  : [].slice.call(arguments, 0)
		//	})
		//}


		window.alert = function () {
			// nothing
		}

		window.confirm = function () {
			return false
		}

		window.prompt = function () {
			return null
		}

		var onerrorOld = window.onerror
		window.onerror = function (msg, url, line, col) {
			totoro.report({
				action: 'onerror',
				info  : {
					message: msg,
					url    : url,
					line   : line
				}
			})
			return onerrorOld && onerrorOld.apply(window, arguments)
		}


		if (typeof totoro != 'undefined') {
			totoro.report({
				action: 'end',
				info  : {
					rtn: 0,
					msg: 'execute success'
				}
			})
		}


		//var old = Zepto.ajax
		//Zepto.ajax = function (options) {
		//	console.log(options.data)
		//	old.apply(Zepto, arguments)
		//}
	}
})()