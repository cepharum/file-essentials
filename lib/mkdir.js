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

const Path = require( "path" );
const { stat, mkdir } = require( "fs" );


/**
 * Recursively creates folders included in a complex path name.
 *
 * @name mkdir
 * @alias MkDir
 * @param {string} baseFolder base folder given segments are relative to
 * @param {string[]|string} subFolder relative path name of folder to create if missing as string or segments of that path name as array
 * @returns {Promise} promises resulting path name of eventually created folder
 */
module.exports = function makeDirectory( baseFolder, subFolder = null ) {
	let sub = subFolder == null ? baseFolder : subFolder;
	const base = subFolder == null ? "/" : baseFolder;

	if ( typeof sub === "string" ) {
		sub = sub.split( /[/\\]/ );
	}

	return new Promise( ( resolve, reject ) => {
		const fullPath = Path.join( ...[].concat( base, sub ) );

		stat( fullPath, ( error, fs ) => {
			if ( error ) {
				switch ( error.code ) {
					case "ENOENT" :
						_makeDirectory( base, sub, resolve, reject );
						break;

					default :
						reject( error );
				}
			} else if ( fs.isDirectory() ) {
				resolve( fullPath );
			} else {
				reject( Object.assign( new Error( `file exists and is not a directory: ${fullPath}` ), { code: "ENOTDIR" } ) );
			}
		} );
	} );
};

/**
 * Creates another level in desired path name unless existing.
 *
 * @param {string} folder path name of folder to contain next level to create
 * @param {string[]} segments list of segments of path name to be created next
 * @param {function(pathname:string)} resolve callback to invoke when finished creating all folders in desired pathname
 * @param {function(error:Error)} reject callback to invoke on encountering error
 * @returns {void}
 * @private
 */
function _makeDirectory( folder, segments, resolve, reject ) {
	if ( !segments.length ) {
		resolve( folder );
		return;
	}

	const segment = segments.shift();

	switch ( segment ) {
		case "." :
		case ".." :
			reject( new Error( "processing . or .. in mkdir rejected" ) );
			return;

		default : {
			const subFolder = Path.resolve( folder, segment );

			stat( subFolder, ( error, stats ) => {
				if ( error ) {
					if ( error.code !== "ENOENT" ) {
						reject( error );
						return;
					}
				} else {
					if ( stats.isDirectory() ) {
						process.nextTick( _makeDirectory, subFolder, segments, resolve, reject );
						return;
					}

					reject( new Error( `${subFolder} exists, but is not a directory` ) );
					return;
				}

				mkdir( subFolder, mkdirError => {
					if ( mkdirError ) {
						reject( mkdirError );
					} else {
						process.nextTick( _makeDirectory, subFolder, segments, resolve, reject );
					}
				} );
			} );
		}
	}
}
