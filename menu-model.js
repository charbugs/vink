
var menuModel = (function() {

    /**
    * Container for Menu instances.
    */
    var menus = [];

    /**
    * Represents a system menu for a specific tab.
    *
    * It consists of serveral user interfaces. These interfaces
    * holds data and methods for user interaction. The visual part
    * of the menu are defined withhin uidisplay.html.
    *
    * @param {Number} tabId - id of the tab the menu belongs to.
    * @param {NavigationInterface} navigation
    * @param {RegistrationInterface} registration
    * @param {Array of MarkerInterface} - markerIfaces 
    */
    function Menu(tabId, navigation, registration, markerIfaces) {

        this.tabId = tabId;
        this.navigation = navigation;
        this.registration = registration;
        this.markerIfaces = markerIfaces;
    }

    /**
    * Respresents the logic of the menu's navigation interface. 
    *
    * Menu's navigation consists of a navigation bar and different 
    * views below that bar. Views can be switched by nav bar buttons. 
    * The visual part is defined within menu-view.html.
    */
    function NavigationInterface() {
        
        /**
        * Saves the current status of the interface.
        *
        * The statuses of the navigation interface corresponds to the available
        * views (or tabs) withhin menu.
        */
        this.status = {
            markers: true,
            add: false
        };

        /**
        * Switches the status of the navigation interface
        * 
        * @param {Object} status - keys are status names, values are boolean.
        */
        this.switchStatus = function(status) {
            this.status.markers = status.markers || false;
            this.status.add = status.add || false;
        };
    }

    
    /**
    * Represent the logic of the registration interface.
    *
    * Visual part is defined in menu-view.html.
    *
    * @param {Number} tabId - id of the current browser tab.
    */
    function RegistrationInterface(tabId) {

        this.tabId = tabId;
    
        /**
        * Saves the current status of the interface.
        *
        */
        this.status = {
            input: true,
            progress: false,
            success: false,
            error: false
        };

        /**
        * Id for http requests
        */
        this.requestId = String(tabId) + '-' + 'registration';

        /** 
        * Messages
        */
        this.successMessage = "Marker successfully added.";
        this.errorMessage;

        /**
        * Stores user input
        */
        this.inputUrl;

        /**
        * Supported style classes for markers
        */
        this.styleClasses = [
            'vink-face-1',
            'vink-face-2',
            'vink-face-3',
            'vink-face-4',
            'vink-face-5',
            'vink-face-6',
            'vink-face-7',
            'vink-face-8',
            'vink-face-9',
            'vink-face-10'
        ];

        /**
        * Switches the status of the interface.
        * 
        * @param {Object} status - keys are status names, values are boolean.
        */
        this.switchStatus = function(status) {
            this.status.input = status.input || false;
            this.status.success = status.success || false;
            this.status.error = status.error || false;
            this.status.progress = status.progress || false;
        };


        /**
        * Checks if a url is valid in terms of the system.
        */
        this.checkInputUrl = function(url) {
            return url.search(/^(http:\/\/|https:\/\/)/) === -1 ? false : true;
        };


        /**
        * Returns an style class name.
        *
        * @param {Function} callback - ({String} styleClass)
        */
        this.determineStyleClass = function(callback) {

            var that = this;
            markerdb.get(null, function(markers) {

                var exist = markers.map(marker => marker.styleClass);
                var nonExist = that.styleClasses.filter(c => exist.indexOf(c) === -1);
                var rand = Math.random();

                if (nonExist.length === 0) {
                    i = Math.floor(rand * that.styleClasses.length);
                    callback(that.styleClasses[i]);
                }
                else  {
                    i = Math.floor(rand * nonExist.length);
                    callback(nonExist[i]);
                }
            });
        };

    
        /**
        * Registers a new marker to the system based on 
        * an url given by user input. The new marker will be
        * added to the menu on success.
        */
        this.registerMarker = function() {

            var that = this;

            if (!that.checkInputUrl(that.inputUrl)) {
                that.errorMessage = 'Need a valid HTTP URL that starts with\
                    "http://" or "https://".';
                that.switchStatus({ error:true });
            } 
            else {
                
                that.switchStatus({ progress:true });

                request.requestSetup(that.requestId, that.inputUrl, function(err, setup) {

                    if (err) {
                        that.errorMessage = err.message;
                        that.switchStatus({ error:true });
                    } 
                    else {
                        that.determineStyleClass(function(styleClass) {

                            setup.styleClass = styleClass;
                            setup.url = that.inputUrl;

                            markerdb.add(setup, function() {
                                
                                that.switchStatus({ success:true });
                            });
                        });
                    }
                });                
            }
        };

        /**
        * Aborts a request made by this registration interface.
        * 
        * This should trigger the callback to the request. This callback is
        * defined within registerMarker().
        */
        this.abortRequest = function() {
            request.abortRequest(this.requestId);
        };      
    }


    /**
    * Represents the data and methods of a user interface for a marker.
    * The visual part of the interface is defined in the menu's html file.
    * 
    * @param {markerdb.Marker} marker
    * @param {Number} tabId - id of the current browser tab.
    */
    function MarkerInterface(marker, tabId) {

        this.marker = marker;
        this.tabId = tabId;

        /**
        * Id for http requests
        */
        this.requestId = String(tabId) + '-' + String(marker.id);

        /**
        * Saves the current status of the interface
        */
        this.status = {
            ready: true,
            progress: false,
            result: false,
            error: false,
            more: false
        };

        /**
        * Panel flag
        */
        this.panel = false;

        /**
        * Messages
        */
        this.errorMessage;
        this.resultMessage;

        /**
        * Holds user inputs.
        * 
        * Keys are input ids, values are text.
        * This object will be sent to the marker app.
        */
        this.userInputs = {};

        /**
        * Switches the status of the interface.
        * 
        * @param {Object} status - keys are status names, values are boolean.
        */
        this.switchStatus = function(status) {
            this.status.ready = status.ready || false;
            this.status.progress = status.progress || false;
            this.status.result = status.result || false;
            this.status.error = status.error || false;    
            this.status.more = status.more || false;    
        };

        /** 
        * Toggles the panel of the interface.
        */
        this.togglePanel = function() {
            this.panel = !this.panel;
        };

        /**
        * Applies the marker to the current web page.
        */
        this.applyMarker = function() {

            var that = this;

            that.switchStatus({ progress:true });

            proxy.invoke(that.tabId, 'extract.extractTextNodes', 
                function() {
                
                proxy.invoke(that.tabId, 'extract.getWords', 
                    function(err, words) {
                    
                    proxy.invoke(that.tabId, 'extract.getUrl', 
                        function(err, wpUrl) {

                        request.requestMarkup(that.requestId, that.marker.url, words, wpUrl, 
                            that.userInputs, 
                            function(err, resp) {
                            
                            if (err) {
                                if (err.name === 'ResponseParseError' ||
                                    err.name === 'RequestError') {
                                    
                                    that.errorMessage = err.message;
                                    that.switchStatus({ error:true });    
                                      
                                } 
                                else {
                                    throw err;
                                }
                            }
                            else {
                                proxy.invoke(that.tabId, 'highlight.highlight', 
                                    resp.markup, that.marker,
                                    function() {
                                          
                                    that.resultMessage = resp.message;
                                    that.switchStatus({ result:true });
                                    
                                });
                            }
                        });
                    });                    
                });
            });           
        };


        /**
        * Removes the highlighting made by the marker.
        */
        this.resetMarker = function() {
            var that = this;
            proxy.invoke(that.tabId, 'highlight.remove', that.marker.id,
                function() {
                    that.switchStatus({ ready:true });
            });
        };

        /**
        * Removes the marker from system and the marker interface from menu.
        */
        this.removeMarker = function() {
            var that = this;
            proxy.invoke(that.tabId, 'highlight.remove', that.marker.id, 
                function() {
                    markerdb.remove(that.marker.id);    
            });               
        };

        /**
        * Aborts a request made by this marker interface.
        * 
        * This should trigger the callback to the request. This callback is
        * defined within applyMarker().
        */
        this.abortRequest = function() {
            request.abortRequest(this.requestId);
        };
    }

    
    /**
    * Removes a marker interface from all menus.
    *
    * @param {Object} marker - marker whose interfaces should be removed.
    */
    function removeMarkerInterface(marker) {
        for (var menu of menus) {
            for (var i=0; i < menu.markerIfaces.length; i++) {
                if (marker.id === menu.markerIfaces[i].marker.id) {
                    menu.markerIfaces.splice(i,1);
                }
            }
        }
    }

    /**
    * Adds a marker interface to all menus.
    * 
    * @param {markerdb.Marker} marker.
    */
    function addMarkerInterface(marker) {
        for (var menu of menus) {
            menu.markerIfaces.push(
                new MarkerInterface(marker, menu.tabId)
            );
        }    
    }

    
    /** 
    * Resets a menu to initial state.
    *
    * This should be done if the user loads or reloads a webpage on a tab.
    *
    * @param {Number} tabId - id of tab the menu belongs to
    */ 
    function resetMenu(tabId) {
        var menu = selectMenu(tabId);
        if(menu) {
            for (var iface of menu.markerIfaces) {
                iface.switchStatus({ ready:true });
                iface.errorMessage = '';
                iface.resultMessage = '';
            }
        }
    }

    /**
    * Returns the menu of a specific tab.
    * Undefine if no menu extists for that tab.
    *
    * @param {Menu|undefined}
    */
    function selectMenu(tabId) {
        return menus.filter(m => m.tabId == tabId)[0];
    }

    /** 
    * Returns the menu belonging to a specific tab.
    * Creates that menu if not already extists.
    *
    * @param {Number} tabId
    * @param {Function} callback - (interfaces)
    */
    function getMenu(tabId, callback) {
       
        var menu = selectMenu(tabId);

        if (menu) {
            callback(menu);
        }
        else {

            markerdb.get(null, function(markers) {
                        
                menu = new Menu(
                    tabId,
                    new NavigationInterface(),
                    new RegistrationInterface(tabId),
                    markers.map(m => new MarkerInterface(m, tabId))
                );

                menus.push(menu);
                callback(menu);
            });            
        }
    }

    /**
    * Inits the module.
    */
    function init() {

        chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
            if (info.status === 'loading') {
                resetMenu(tabId);
            }
        });

        markerdb.markerAdded.register(addMarkerInterface);
        markerdb.markerRemoved.register(removeMarkerInterface);
    }

    return {
        getMenu : getMenu,
        init: init        
    };

}());

document.addEventListener('DOMContentLoaded', function() {
    menuModel.init();        
});
