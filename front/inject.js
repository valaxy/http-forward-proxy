(function () {
	if (!window.__wxtest_inject) {
		window.__wxtest_inject = true

		var oldConsoleError = console.error
		console.error = function (msg) {
			console.log(msg)
			oldConsoleError.apply(this, arguments)
		}

		var onerrorOld = window.onerror
		window.onerror = function (msg, url, line, col) {
			console.log('[mark] ' + msg)
			onerrorOld && onerrorOld.apply(window, arguments)
			return false
		}

		console.log('test code injected')
	}
})()