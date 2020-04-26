/**
 * (c) 2017 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

"use strict";

const { rmdir, unlink } = require( "fs" );

const Find = require( "./find" );


/**
 * Recursively removes a folder all contained elements.
 *
 * @note This method detects if pathname is not selecting directory but some
 *       file and removes it nonetheless.
 *
 * @name rmdir
 * @param {string} pathName path name of element to remove
 * @param {boolean} subsOnly set true to remove all elements in folder but keep selected folder itself
 * @returns {Promise} promises pathnames of successfully removed files and folders
 */
module.exports = function removeDirectory( pathName, { subsOnly = false } = {} ) {
	return Find( pathName, {
		depthFirst: true,
		qualified: true,
		minDepth: subsOnly ? 1 : 0,
		waitForConverter: true,
		converter: ( localName, absoluteName, stats ) => new Promise( ( rmResolve, rmReject ) => {
			if ( stats.isDirectory() ) {
				rmdir( absoluteName, onRemove );
			} else {
				unlink( absoluteName, onRemove );
			}

			/**
			 * Handles result of removing file or folder.
			 *
			 * @param {?Error} error description of error optionally encountered on removing file/folder
			 * @returns {void}
			 */
			function onRemove( error ) {
				if ( error ) {
					rmReject( error );
				} else {
					rmResolve( absoluteName );
				}
			}
		} ),
	} );
};
