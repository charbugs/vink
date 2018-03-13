
(function(pool) {

	'use strict';

	class MenuData {

		constructor(props = {}) {
			this._createMarker = props.createMarker;
			this._setupStore = props.setupStore;
			this._prome = props.prome;
			
			this.tabId = props.tabId;
			this.registration = props.registration;
			this.version = chrome.runtime.getManifest().version;

			this.markers;
			this.view;
			this.currentMarker;

		}

		async init() {

			var setups = await this._setupStore.getSetup(null);
			this.markers = setups.map(s => this._createMarker(s, this.tabId));

			return this;
		}

	}

	pool.MenuData = MenuData;

})(emphasize.pool);