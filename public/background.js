/* global chrome, browser */
var devtoolsPort = [];
var notifId = '';
var browserInterface = chrome || undefined;

browserInterface.runtime.onConnect.addListener(function (port) {
	devtoolsPort.push(port);
});

var dsDebug = (browserInterface.runtime.id === 'ikbablmmjldhamhcldjjigniffkkjgpo' ? false : true);


function addBlocking() {
	removeBlocking();
	if (browserInterface.declarativeWebRequest)
		browserInterface.declarativeWebRequest.onRequest.addRules([{
			id: 'dataslayerBlocking',
			conditions: [
				new browserInterface.declarativeWebRequest.RequestMatcher({
					url: {
						hostSuffix: 'google-analytics.com',
						pathPrefix: '/collect',
						schemes: ['http', 'https']
					},
				}),
				new browserInterface.declarativeWebRequest.RequestMatcher({
					url: {
						hostSuffix: 'google-analytics.com',
						pathPrefix: '/__utm.gif',
						schemes: ['http', 'https']
					},
				}),
				new browserInterface.declarativeWebRequest.RequestMatcher({
					url: {
						hostSuffix: 'stats.g.doubleclick.net',
						pathPrefix: '/__utm.gif',
						schemes: ['http', 'https']
					},
				}),
				new browserInterface.declarativeWebRequest.RequestMatcher({
					url: {
						hostSuffix: 'doubleclick.net',
						pathPrefix: '/activity',
						schemes: ['http', 'https']
					},
				}),
				new browserInterface.declarativeWebRequest.RequestMatcher({
					url: {
						pathPrefix: '/b/ss',
						queryContains: 'AQB=1',
						schemes: ['http', 'https']
					},
				})
			],
			actions: [
				new browserInterface.declarativeWebRequest.RedirectToTransparentImage()
			]
		}]);
}

function removeBlocking() {
	if (browserInterface.declarativeWebRequest)
		browserInterface.declarativeWebRequest.onRequest.removeRules(['dataslayerBlocking']);
}

browserInterface.storage.sync.get(null, function (items) {
	if (items.hasOwnProperty('blockTags') && items.blockTags === true) addBlocking();
	else removeBlocking();
});

browserInterface.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (dsDebug) {
	  console.log(message);
  }
  if (
    message.type === 'dataslayer_gtm_push' ||
    message.type === 'dataslayer_gtm' ||
    message.type === 'dataslayer_tlm' ||
    message.type === 'dataslayer_tco' ||
    message.type === 'dataslayer_var' ||
    message.type === 'dataslayer_dtm' ||
    message.type === 'dataslayer_launchdataelement' ||
	message.type === 'dataslayer_launchruletriggered' ||
	message.type === 'dataslayer_launchrulecompleted' ||
	message.type === 'dataslayer_launchrulefailed'
  ) {
    message.tabID = sender.tab.id;
    devtoolsPort.forEach(function(v, i, x) {
      try {
        v.postMessage(message);
      } catch (e) {
        console.log(e);
      }
    });
  } else if (
    message.type === 'dataslayer_pageload' ||
    message.type === 'dataslayer_opened'
  ) {
    browserInterface.tabs.executeScript(message.tabID, {
      file: '/content.js',
      runAt: 'document_idle',
      allFrames: true,
    });
  } else if (message.type === 'dataslayer_refresh') {
    browserInterface.tabs.sendMessage(message.tabID, {
      ask: 'refresh',
    });
  } else if (message.type === 'dataslayer_unload')
    browserInterface.tabs.executeScript(message.tabID, {
      code:
        "document.head.removeChild(document.getElementById('dataslayer_script'));",
      runAt: 'document_idle',
    });
  else if (message.type === 'dataslayer_loadsettings') {
    if (message.data.blockTags) addBlocking();
    else removeBlocking();
    devtoolsPort.forEach(function(v, i, x) {
      v.postMessage(message);
    });
  } else {
    console.log(message);
    // prevent unhandled chrome runtime errors
    if (sendResponse) {
      sendResponse();
    }
  }
});

browserInterface.runtime.onInstalled.addListener(function (details) {
	if (details.reason === 'install')
		browserInterface.tabs.create({
			url: 'https://dataslayer.org/release-notes/',
			active: true
		});
	if ((details.reason === 'update') && (!dsDebug)) {
		browserInterface.notifications.create('', {
				type: 'basic',
				title: 'dataslayer' + (dsDebug ? ' beta' : ''),
				message: 'dataslayer' + (dsDebug ? ' beta' : '') + ' has been updated to version ' + browserInterface.runtime.getManifest().version + '.\n\nClick here to see what\'s new.',
				iconUrl: 'i128.png'
			},
			function (notificationId) {
				notifId = notificationId;
			}
		);
		browserInterface.notifications.onClicked.addListener(function (notificationId) {
			if (notificationId == notifId) browserInterface.tabs.create({
				url: 'https://dataslayer.org/release-notes/',
				active: true
			});
		});
	}
});