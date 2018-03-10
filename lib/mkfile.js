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

/* eslint-disable promise/no-promise-in-callback */

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
 * @returns {Promise.<{fd:int, name:string, uuid:string}>} promises open file descriptor `fd`, `name` and used `uuid` of created file
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
				reject( new Error( "reach max. trials prior to finding random available filename" ) );
				return;
			}

			Crypto.randomBytes( 16, ( error, buffer ) => {
				if ( error ) {
					reject( new Error( "fetching random data failed: " + error ) );
					return;
				}

				// mark buffer to contain UUIDv4
				buffer[6] = ( buffer[6] & 0x0f ) | 0x40;
				buffer[8] = ( buffer[8] & 0x3f ) | 0x80;

				// convert to hex-encoded UUID string
				buffer = buffer.toString( "hex" );

				const uuid = buffer.substr( 0, 8 ) + "-" +
				             buffer.substr( 8, 4 ) + "-" +
				             buffer.substr( 12, 4 ) + "-" +
				             buffer.substr( 16, 4 ) + "-" +
				             buffer.substr( 20, 12 );


				// derive path to folder to contain resulting file
				let subs;

				if ( typeof uuidToPath === "function" ) {
					subs = uuidToPath( uuid );
					if ( subs instanceof Promise ) {
						subs
							.then( promisedSubs => {
								if ( !Array.isArray( promisedSubs ) ) {
									promisedSubs = String( promisedSubs ).split( /[\\/]/ );
								}

								const fileName = promisedSubs.pop();

								return MkDir( folder, promisedSubs )
									.then( pathName => _mkfile( pathName, fileName ) );
							} )
							.catch( reject );
						return;
					} else if ( !Array.isArray( subs ) ) {
						subs = String( subs ).split( /[\\/]/ );
					}
				} else {
					subs = [uuid];
				}

				const fileName = subs.pop();

				MkDir( folder, subs )
					.then( pathName => _mkfile( pathName, fileName ) )
					.catch( reject );


				/**
				 * Eventually tries to exclusively open file in folder created
				 * before.
				 *
				 * @param {string} pathName path name of folder to contain file
				 * @param {string} baseName base name of file to create
				 * @returns {void}
				 * @private
				 */
				function _mkfile( pathName, baseName ) {
					const name = Path.resolve( pathName, baseName + suffix );

					File.open( name, "wx+", 0o600, ( openError, fd ) => {
						if ( openError ) {
							switch ( openError.code ) {
								case "EEXIST" :
								case "EISDIR" :
									process.nextTick( tryNext );
									return;

								default :
									reject( new Error( "failed to create file: " + openError ) );
									return;
							}
						}

						resolve( { name, uuid, fd } );
					} );
				}
			} );
		}
	} );
};
