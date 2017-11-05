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
const File = require( "fs" );
const Crypto = require( "crypto" );

const MkDir = require( "./mkdir" );


const MaxAttempts = 20;


/**
 * Opens new file w/ random UUIDv4 as name for reading/writing.
 *
 * The file is put into two levels of sub folders matching first three characters
 * of the file's name. This is used to improve utilization of filesystem on
 * containing a very huge amount of files.
 *
 * The opened file is readable and writable by current user, only. By instantly
 * trying to open file requiring its creation any race condition is limited to
 * the amount of current implementation of NodeJS on exclusively open files.
 *
 * This implementation tries to work as non-blocking as possible and thus
 * returns a promise. Aside from that it is designed to use as little stack
 * frames as possible to perform as good as possible.
 *
 * @param {string} folder path name of folder to contain temporary file
 * @param {string} suffix part of file's name succeeding random string
 * @param {int} maxAttempts number of maximum attempts to find a unique name
 * @param {?function(uuid:string):string[]} uuidToPath optional callback invoked for mapping UUID into list of pathname segments to use
 * @returns {Promise.<{fd:int, name:string, uuid:string}>}
 */
module.exports = function( folder, { suffix = "", maxAttempts = MaxAttempts, uuidToPath = null } = {} ) {
	return new Promise( ( resolve, reject ) => {
		let trial = 0;

		tryNext();

		/**
		 * Creates random UUID and checks if it is not in use already.
		 *
		 * @returns {void}
		 */
		function tryNext() {
			if ( trial++ >= maxAttempts ) {
				return reject( new Error( "reach max. trials prior to finding random available filename" ) );
			}

			Crypto.randomBytes( 16, ( error, buffer ) => {
				if ( error ) {
					return reject( new Error( "fetching random data failed: " + error ) );
				}

				// mark buffer to contain UUIDv4
				buffer[6] = ( buffer[6] & 0x0f ) | 0x40;
				buffer[8] = ( buffer[8] & 0x3f ) | 0x80;

				// convert to hex-encoded UUID string
				buffer = buffer.toString( "hex" );

				let uuid = buffer.substr( 0, 8 ) + "-" +
				           buffer.substr( 8, 4 ) + "-" +
				           buffer.substr( 12, 4 ) + "-" +
				           buffer.substr( 16, 4 ) + "-" +
				           buffer.substr( 20, 12 );


				// derive path to folder to contain resulting file
				let subs = uuidToPath ? uuidToPath( uuid ) : [uuid];

				const fileName = subs.pop();

				MkDir( folder, subs )
					.then( pathName => {
						let name = Path.resolve( pathName, fileName + suffix );

						File.open( name, "wx+", 0o600, ( error, fd ) => {
							if ( error ) {
								switch ( error.code ) {
									case "EEXIST" :
									case "EISDIR" :
										return process.nextTick( tryNext );

									default :
										return reject( new Error( "failed to create file: " + error ) );
								}
							}

							resolve( { name, uuid, fd } );
						} );
					} );
			} );
		}
	} );
};
