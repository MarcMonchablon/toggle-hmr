// === On Install
chrome.runtime.onInstalled.addListener(() => {
	console.info('[T-HMR] OnInstalled');
	chrome.action.setBadgeText({ text: 'OFF' });
});

// === On Click
chrome.action.onClicked.addListener(async (tab) => {
	const oldState = await chrome.action.getBadgeText({ tabId: tab.id });
	const newState = (oldState === 'ON') ? 'OFF' : 'ON';

	await chrome.action.setBadgeText({ tabId: tab.id, text: newState });
	// TODO: save wether the current tab is active or not in storage.session


	if (newState === 'ON') {
		console.info('[T-HMR] cutting all websockets');
	} else {
		console.log('[T-HMR] re-enable all websockets');
		// TODO
	}
});

// === On Page load
chrome.runtime.onMessage.addListener(async (data, sender) => {
	const tabId = sender.tab.id;
	const message = data.message;
	if (message === 'page-load') {
		// TODO: load the page
		//checkWebsockets(tabId, 'from-message');
	}
});


// === Manage webSockets

function manageWebsocket() {
	// TODO
}
