var Ajv = require('ajv');
var sanitizeHtml = require('sanitize-html');

var { Prome } = require('../common/prome.js');
var { Event } = require('../common/event.js');
var { getUid } = require('../common/uid.js');
var { StateManager } = require('../common/state-manager.js');

var { Injection } = require('./injection.js');
var { Messaging } = require('./messaging');
var protocol = require('./protocol.js');
var { Parser } =  require('./parser.js');
var { Request } = require('./request.js');
var { SetupStore } = require('./setup-store.js');
var { Registration } = require('./registration');
var { Marker } = require('./marker.js');
var { MenuData } = require('./menu-data.js');
var { MenuContainer} = require('./menu-container.js');

var prome = Prome({ chrome });
var createXHR = () => new XMLHttpRequest();
var createEvent = () => new Event();

var injection = new Injection({ prome });
var messaging = new Messaging({ prome });

var setupStore = new SetupStore({ 
	prome, 
	createEvent 
});

setupStore.initStorage();

var parser = new Parser({ 
	protocol, 
	Ajv, 
	sanitizeHtml 
});

var createStateManager = (states) => new StateManager({
	states: states,
	onStateChange: createEvent()
});

var createRequest = () => new Request({ 
	parser, 
	createXHR
});

var createRegistration = () => new Registration({
	jobId: getUid(),
	createStateManager: createStateManager,
	request:	createRequest(),
	setupStore:	setupStore,
});

var createMarker = (setup, tabId) => new Marker({
	setup: 				setup,
	tabId: 				tabId,
	jobId: 				getUid(),
	createStateManager: createStateManager,
	messaging: 			messaging,
	request: 			createRequest()
});

var createMenuData = (tabId) => new MenuData({
	tabId: 			tabId,
	prome: 			prome,
	setupStore: 	setupStore,
	registration: 	createRegistration(),
	createMarker: 	createMarker

}); 

var menuContainer = new MenuContainer({
	createMenuData
});

window.injection = injection;
window.menuContainer = menuContainer;