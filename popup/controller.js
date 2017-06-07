
var controller = (function() {

    'use strict';

    /**
    * Informs that the menu is disabled on the current tab.
    */
    function showTabDisabledMessage() {
        document.body.innerHTML =
            '<div class="w3-panel">Cannot work on this browser tab.</div>';
    }

    function init() {

        chrome.runtime.getBackgroundPage(function(bg) {

            bg.proxy.connectWebPage(function(tabId) {

                if (!tabId) {
                    showTabDisabledMessage();
                }
                else {

                    bg.models.menuContainer.get(tabId, function(menu) {

                        new Vue({
                            el: '#menu',
                            data: {
                                menu: menu,
                                listUi: menu.listUi,
                                registerUi: menu.registerUi,
                                markerUis: menu.markerUis,
                                version: chrome.runtime.getManifest().version
                            }
	                    });
                    });
                }
            });

        });
    }

    return {
        init: init
    };

}());

document.addEventListener('DOMContentLoaded', function() {
    controller.init();
});
