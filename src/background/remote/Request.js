/**
 * On CORS:
 * 
 * "Chrome extensions can make cross-domain requests to any domain *if* the
 * domain is included in the "permissions" section of the manifest.json file.
 * The server doesn't need to include any additional CORS headers or do any
 * more work in order for the request to succeed." (see https://www.
 * html5rocks.com/en/tutorials/cors/#toc-cross-domain-from-chrome-extensions)
 *
 * CORS is only permitted for a few protocols including http and https. Since
 * we only allow analyzers on http and https CORS is no problem.
 */

/**
 * Implements http requests for the communication with 
 * remote marker programms.
 */
(function(pool) {

	'use strict';

	class Request {

		constructor(props = {}) {
			this._parser = props.parser;
			this._createXHR = props.createXHR;
			this._createRequestError = props.createRequestError;
			
			this._xhr;
		}

		/**
		* Aborts the request.
		*
		* This triggers the response handler for this request and 
		* sets xhr.readyState == xhr.DONE and xhr.status == 0.
		*/
		abortRequest() {
			this._xhr.abort();
		}

		/**
		 * Requests an marker for setup.
		 *
		 * param: (String) url - of the analyzer.
		 * return: (Object) parsed setup response.
		 */
		async requestSetup(url) {

			var data = { call: 'setup' };
			data = this._parser.parseSetupRequest(data); // debug
			var response = await this._post(url, data);
			return this._parser.parseSetupResponse(response);
		}

		/**
		 * Requests an marker to perform an analysis on the given data.
		 *
		 * param: (String) url - of analyzer
		 * param: (Object) data - as defined in protocol
		 * return: (Object) parsed analysis response.
		 */
		async requestMarkup(url, data) {
			
			data.call = 'markup',
			data = this._parser.parseMarkupRequest(data) // debug
			var response = await this._post(url, data);
			return this._parser.parseMarkupResponse(response);
		}

		/**
		 * Performs a POST request and handles some errors.
		 *
		 * param: (String) url
		 * param: (Jsonable) data
		 * return: (String) - the response body as text.
		 */
		_post(url, data) {
			var that = this;

			return new Promise(function(resolve, reject) {

				that._xhr = that._createXHR();
				that._xhr.open('POST', url, true);
				that._xhr.setRequestHeader('Content-Type', 'application/json');
				that._xhr.send(JSON.stringify(data));
				that._xhr.onreadystatechange = function() {
					that._handleResponse(resolve, reject);
				}
			});
		}

		_handleResponse(resolve, reject) {
		
			if (this._xhr.readyState === this._xhr.DONE) {

				if (this._xhr.status === 0) {
					var msg = 'Something went wrong while requesting marker.';
					reject(this._createRequestError(msg));
				}
				else if (this._xhr.status === 200) {
					resolve(this._xhr.responseText);
				}
				else {
					var msg = 'Failed to receive data from marker. Server answers: ';
					msg = msg + this._xhr.status;
					reject(this._createRequestError(msg));
				}
			}
		}
	}

	pool.Request = Request;

})(emphasize.pool);