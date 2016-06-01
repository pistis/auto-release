(function(factory) {
	var jQuery = window.jQuery||window.Zepto;
	if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = factory(jQuery);
	} else {
		window.Pages = factory(jQuery);
	}
}(function(jQuery) {
	var lists = {
		timeout : function() {

			var timer = null;

			function alloc(func, delay) {
				timer = setTimeout(function() {
					timer = null;
					func();
				}, delay);
				return timer;
			}

			function release() {
				if (timer) { clearTimeout(timer); }
				timer = null;
			}

			return {
				'alloc' : alloc,
				'release' : release
			};

		},

		interval : function() {

			var timer = null;

			function alloc(func, interval) {
				timer = setInterval(func, interval);
				return timer;
			}

			function release() {
				if (timer) { clearInterval(timer); }
				timer = null;
			}

			return {
				'alloc' : alloc,
				'release' : release
			};

		},

		raf : function() {

			var timer = null;

			function alloc(func) {
				timer = (window.requestAnimationFrame || window.WebkitRequestAnimationFrame || setTimeout)(function() {
					timer = null;
					func();
				}, 1000 / 60);
				return timer;
			}

			function release() {
				if (timer) { (window.cancelAnimationFrame || window.WebkitCancelAnimationFrame || clearTimeout)(timer); }
				timer = null;
			}

			return {
				'alloc' : alloc,
				'release' : release
			};

		},

		callback : function() {

			var valid = false;

			function alloc(func) {
				valid = true;
				return function() {
					if (!valid) { return; }
					return func();
				};
			}

			function release() {
				valid = false;
			}

			return {
				'alloc' : alloc,
				'release' : release
			};

		}
	};

	lists.object = (function() {

		var backupEls = [];
		var backupProps = [];

		return function() {

			function find(needle) {
				for (var i = 0, len = backupEls.length; i < len; i++) {
					if (backupEls[i] === needle) { return i; }
				}
				return -1;
			}

			function get(obj, key) {
				var keyParts = key.split('.');
				for (var i  = 0, len = keyParts.length; i < len; i++) {
					var keyPart = keyParts[i];
					if (keyPart in obj) {
						obj = obj[keyPart];
						continue;
					}
					return null;
				}
				return obj;
			}

			function set(obj, key, val) {
				var keyParts = key.split('.');
				for (var i  = 0, len = keyParts.length; i < len - 1; i++) {
					var keyPart = keyParts[i];
					if (keyPart in obj) {
						obj = obj[keyPart];
						continue;
					}
					throw new Error("Cannot find property '" + keyPart + "'");
				}
				var lastKeyPart = keyParts.pop();
				if (lastKeyPart) {
					obj[lastKeyPart] = val;
				}
			}

			function alloc(els, props) {

				var props = props || [ 'className', 'name', 'value', 'checked', 'placeholder', 'style.cssText' ];
				if (!('length' in els && 'length' in props)) {
					throw new Error('els and props should be Array like.');
				}

				for (var i = 0, len = els.length; i < len; i++) {

					var el = els[i];
					if (!el) { continue; }

					var idx = find(el);
					var prop = {};

					for (var j = 0, key; key = props[j]; j++) {
						var val = get(el, key);
						if (val !== null) { prop[key] = val; }
					}

					if (idx === -1) {
						backupEls.push(el);
						backupProps.push(prop)
						continue;
					}

					backupProps[idx] = prop;

				}

				// console.log(backupEls, backupProps);
				
			}

			function release() {

				for (var i = 0, len = backupEls.length; i < len; i++) {

					var el = backupEls[i];
					var prop = backupProps[i];

					for (var key in prop) {
						if (prop.hasOwnProperty(key)) {
							set(el, key, prop[key]);
						}
					}

				}

				backupEls.length = backupProps.length = 0;

			}

			return {
				'alloc' : alloc,
				'release' : release
			};

		}

	})();

	lists.on = function() {
		if (jQuery) {
			var $jq = null;
			var args = null;

			function alloc($) {
				$jq = jQuery($);
				args = Array.prototype.slice.call(arguments);
				args.shift();
				$jq.on.apply($jq, args);
			}

			function release() {
				if ($jq && args) { $jq.off.apply($jq, args); }
				$jq = args = null;
			}

			return {
				'alloc' : alloc,
				'release' : release
			};
		}

		throw new Error('jQuery have to be set with AutoRelease.jQuery method.');
	};

	lists.ajax = function() {
		if (jQuery) {
			var ajax = null;
			var org = null;

			function alloc(url, settings) {

				if (arguments.length < 2) {
					settings = url;
					url = settings.url;
				}

				org = {};

				if (settings) {
					[ 'beforeSend', 'success', 'error', 'complete' ].forEach(function(k) {
						if (settings[k]) {
							org[k] = settings[k];
							settings[k] = function() {
								if (!ajax || !org || !org[k]) { return; }
								return org[k].apply(this, arguments);
							};
						}
					});
				}

				ajax = jQuery.ajax.call(jQuery, url, settings);
				return ajax;

			}

			function release() {
				var tmp = ajax;
				ajax = org = null;
				if (tmp) { tmp.abort(); }
			}

			return {
				'alloc' : alloc,
				'release' : release
			};
		}

		throw new Error('jQuery have to be set with AutoRelease.jQuery method.');
	};

	var AR = function() {
		this._idx = Math.random();
		this._items = [];

		for (var name in lists) {
			if (lists.hasOwnProperty(name)) {
				this[name] = this._alloc(name);
			}
		}
	};

	AR.prototype._alloc = function(name) {
		var items = this._items;
		var self = this;
		return function() {
			var item = lists[name]();
			items.push(item);
			return item.alloc.apply(item, arguments);
		};
	};

	AR.prototype.release = function() {
		var items = this._items;
		for (var i = 0, item; !!(item = items[i]); i++) {
			item.release();
		}
		items.length = 0;
		return this;
	};

	AR.jQuery = function(jQ) {
		jQuery = jQ;
	};

	return AR;
}));

