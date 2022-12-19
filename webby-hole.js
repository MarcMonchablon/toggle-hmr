/**
 * JS code meant to be injected by content-script in the JS runtime.
 *
 * This file has 3 parts (not in order):
 * - a helper function to emulate native EventTarget behavior
 * - a monkey-patch around WebSocket to create 'managed' WebSocket
 * - a register object to easily access websocket created by third party.
 *
 * The main point of entry will be the global `_wsRegister` object,
 * which is an instance of ManagedWebSocketRegister that gives control
 * of (hopefuly) all the WebSocket created in the page.
 *
 * Since this monkey-patch the WebSocket object, and generally messes
 * with the global scope, this code should be injected as little as possible.
 * This is why it's scoped to localhost in the extension manifest.json.
 *
 * Special thanks to the answers in:
 * https://stackoverflow.com/questions/31181651/inspecting-websocket-frames-in-an-undetectable-way/31182643#31182643
 * which helped flesh out the script-injection part, and gave a baseline
 * to work for the WebSocket monkey-patch.
 */


// === ManagedWebSocket Register

const ManagedWebSocketRegister = (function() {
	const AVAILABLE_EVENTS = [];
	const KEEP_REMOVED_WEBSOCKETS = true;

	function Register() {
		this._superEventHandling();
		this._nextId = 1;
		this._items = [];
		this._removed = [];
	}
	_sprinkleSomeEventHandling(Register, AVAILABLE_EVENTS);


	Register.prototype.getItems = function() {
		return this._items();
	};

	Register.prototype.add = function(ws, info) {
		const id = this._nextId++;
		this._items.push({ id, ws, info });
		return id;
	};

	Register.prototype.remove = function(itemId) {
		const removed = this._items.find(d => d.id === itemId);
		this._items = this._items.filter(d => d.id !== itemId);
		if (KEEP_REMOVED_WEBSOCKETS) { this._removed.push(removed); }
		return removed;
	};

	return Register;
})();

window._wsRegister = new ManagedWebSocketRegister();


// === Managed WebSocket

const ManagedWebSocket = (function() {
	const WEBSOCKET_EVENTS = ['open', 'message', 'close', 'error'];
	const AVAILABLE_EVENTS = [...WEBSOCKET_EVENTS];

	// Keep a reference of real WebSocket implementation
	const RealWebSocket = window.WebSocket;
	const callRealWebSocket = RealWebSocket.apply.bind(RealWebSocket);

	function ManagedWebSocket(url, protocols) {
		this._superEventHandling();
		this._id = null;
		this._ws = null;
		this._url = url;
		this._protocols = protocols;
		this._plugged = true;
		this._backlog = [];

		// Create real WebSocket, possibly throwing an error
		let ws;
		if (!(this instanceof ManagedWebSocket)) {
			// Throw error: called without 'new'
			ws = callRealWebSocket(this, arguments);
		} else if (arguments.length === 1) {
			ws = new RealWebSocket(url);
		} else if (arguments.length >= 2) {
			ws = new RealWebSocket(url, protocols);
		} else {
			// Throw error: No arguments
			ws = new RealWebSocket();
		}
		this._ws = ws;

		// Add current managed WS to register
		this._id = window._wsRegister.add(this, { url, protocols });

		// Listen to WebSocket
		for (const eventType of WEBSOCKET_EVENTS) {
			ws.addEventListener(
				eventType,
				event => this._handleEvent(eventType, event)
			);
		}
	}


	// (real) WebSocket instance methods

	ManagedWebSocket.prototype.send = function(data) {
		if (this._plugged) {
			this._ws.send(data);
		} else {
			this._backlog.push({
				type: 'send',
				data: data,
				at: new Date(),
			});
		}
	};

	ManagedWebSocket.prototype.close = function(code, reason) {
		if (this._plugged) {
			this._ws.close(code, reason);
			window._wsRegister.remove(this._id);
		} else {
			this._backlog.push({
				type: 'close',
				data: { code, reason },
				at: new Date(),
			});
		}
	};


	// Event handling

		_sprinkleSomeEventHandling(ManagedWebSocket, AVAILABLE_EVENTS);

	ManagedWebSocket.prototype._handleEvent = function(type, event) {
		if (this._plugged) {
			this.dispatchEvent(event);
		} else {
			this._backlog.push({
				type: 'event',
				data: { type, event },
				at: new Date(),
			});
		}
	};


	// Plug/Unplug management

	ManagedWebSocket.prototype.plug = function() {
		this._plugged = true;

		// Replay events
		for (const event in this._backlog) {
			switch (event.type) {
			case 'event':
				this._handleEvent(event.type, event.event);
				break;
			case 'send':
				this.send(event.data);
				break;
			case 'close':
				this.close(event.reason);
				break;
			}
		}
		this._backlog = [];
	};

	ManagedWebSocket.prototype.unplug = function() {
		this._plugged = false;
	};

	ManagedWebSocket.prototype.isPlugged = function() {
		return this._plugged;
	};

	ManagedWebSocket.prototype.setPlugged = function(plugged) {
		return plugged ? this.plug() : this.unplug();
	};


	return ManagedWebSocket;
})();

// And finally monkey-patch our trusty WebSocket :)
window.WebSocket = ManagedWebSocket;


// === EventTarget emulation

/**
 * Re-implements the 'EventTarget' behavior.
 *
 * The re-implemented behavior is so far:
 *  - allow attaching events with `.addEventListener()` and `on___ = ...`
 *  - allow attaching events with `on___ = ...` assignments.
 *  - allow removal of listener with `.removeEventListener()`
 *
 * A thing to note (and copying the behavior of Google Chrome,
 * since to be honesty I simply glanced at the specs), is that
 *  - custom events can be listened and triggered with the
 *   `addEventListener` and `dispatchEvent` combo
 *  - only pre-defined events can use the `on___ = ...` syntax.
 *  - Calling `addEventListener('click', ...)` has no bearing into the
 *    value of `onclick` property.
 *
 * NOTE: With Chrome implementation, the order of execution
 * depends on the order of assignation, there is no priority
 * between 'onclick = (...)' versus 'addEventListener(...)'.
 * This motivates the implementation choice of adding getter/setters
 * for `on___` properties, which add the listeners to the same stack
 * as the `addEventListener` method, in order to respect the Chrome
 * (Spec ?) listener call order.
 *
 * NOTE: A customEvent will work with the addListener/dispatchEvent
 * combo, but won't call the associated `on___` callback.
 *
 * ALSO NOTE: no care has been given for the propagation and bubbling
 * behavior, since this re-implementation of EventTarget is only meant for
 * 'flat' objects, outside of the classic DOM hierarchy.
 *
 *
 * # How to use
 *
 * Let's say you have a constructor function MyObject, that you
 * wish to augment with EventTarget-like behavior for events 'foo' and 'bar'.
 * You need to do 2 things:
 * - inside the MyObject constructor, call `this._superEventHandling();`
 * - after the class/function definition, call
 *  `_sprinkeSomeEventHandling(MyObject, ['foo', 'bar']);`
 */
function _sprinkleSomeEventHandling(Obj, allowedEvents) {

	Obj.prototype._superEventHandling = function() {
		// Store the listeners reference in `this.__listeners`
		const listenersDict = {};
		allowedEvents.forEach(eventType => listenersDict[eventType] = []);
		Object.defineProperty(this, '__listeners', {
			value: listenersDict,
			enumerable: false,
		});

		// Only the non-custom events allows for the `onfoobar = ...` syntax.
		for (const eventType of allowedEvents) {
			Object.defineProperty(this, 'on'+eventType, {
				enumerable: false,
				get: function() {
					const listeners = this.__listeners['on'+eventType];
					return listeners.find(d => d.fromAssignement === true) || null;
				},
				set: function(callback) {
					let listeners = this.__listeners['on'+eventType];
					listeners = listeners.filter(d => d.fromAssignement === false);
					if (typeof callback === 'function') {
						listeners.push({
							callback: callback,
							options: null,
							fromAssignement: true,
						});
					}
					this.__listeners['on'+eventType] = listeners;
				}
			});
		}
	};

	Obj.prototype.dispatchEvent = function(event) {
		const toRemove = [];
		let listeners = this.__listeners['on'+event.type];
		for (const listener of listeners) {
			listener.callback.call(this, event);

			// Remove listener if it was added with `once: true`.
			if (listener.options && listener.options.once) {
				toRemove.push(listener);
			}
		}

		if (toRemove.length > 0) {
			const newList = listeners.filter(l => !toRemove.includes(l));
			this.__listeners['on'+event.type] = newList;
		}

		return !event.defaultPrevented;
	};

	Obj.prototype.addEventListener = function(type, listener, options) {
		if (!this.__listeners['on'+type]) { this.__listeners['on'+type] = []; }
		const listeners = this.__listeners['on'+type];
		listeners.push({
			callback: listener,
			options: options || null,
			fromAssignement: false,
		});
	};

	Obj.prototype.removeEventListener = function(type, listener, options) {
		if (!this.__listeners['on'+type]) { return; }
		let listeners = this.__listeners['on'+type];
		listeners = listeners
			.filter(d => d.fromAssignement || d.callback !== listener);
		this.__listeners['on'+type] = listeners;
	};
}
