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

const Crypto = require( "crypto" );
const Path = require( "path" );

const { suite, test, suiteSetup, setup, teardown } = require( "mocha" );
const Should = require( "should" );

const { mkdir, rmdir, write } = require( "../" );

const dataDir = Path.resolve( __dirname, "../data" );


suite( "require( 'file-essentials' ).rmdir", function() {
	suiteSetup( function() {
		process.chdir( __dirname );
	} );

	setup( function() {
		return mkdir( "..", "data/sub" )
			.then( sub => write( Path.join( sub, "file.txt" ), "some data" )
				.then( () => write( Path.join( sub, "another file.txt" ), "some more data" ) )
				.then( () => write( Path.join( dataDir, "file-in-root.code" ), "some root-folder code data" ) )
			);
	} );

	teardown( function() {
		return rmdir( "../data" );
	} );

	test( "is a function", function() {
		Should( rmdir ).be.a.Function().which.has.length( 1 );
	} );

	test( "does not throw on invocation", function() {
		let promise = null;

		( () => ( promise = rmdir( dataDir ) ) ).should.not.throw();

		return promise;
	} );

	test( "returns promise resolved on having removed all elements", function() {
		return rmdir( dataDir ).should.be.Promise().which.is.resolved();
	} );

	test( "returns promise resolved with list of full path names of all removed elements", function() {
		return rmdir( dataDir )
			.then( list => {
				list.should.be.Array().which.has.length( 5 );
				list.should.containEql( dataDir );
			} );
	} );

	test( "spares selected base folder on demand", function() {
		return rmdir( dataDir, { subsOnly: true } )
			.then( list => {
				list.should.be.Array().which.has.length( 4 );
				list.should.not.containEql( dataDir );
			} );
	} );

	test( "properly removes file if given as 'base folder'", function() {
		const someFile = Path.join( dataDir, "file-in-root.code" );

		return rmdir( someFile )
			.then( list => {
				list.should.be.Array().which.has.length( 1 );
				list.should.containEql( someFile );
			} );
	} );

	test( "spares file given as 'base folder' on request to remove contained elements, only", function() {
		const someFile = Path.join( dataDir, "file-in-root.code" );

		return rmdir( someFile, { subsOnly: true } )
			.then( list => {
				list.should.be.Array().which.is.empty();
			} );
	} );
} );

suite( "Removing complex folders", function() {
	this.timeout( 40000 );

	const NumFiles = 1000;
	const segments = [ "some", "list", "of", "segments", "to", "choose", "subset", "from", "for", "creating", "folder", "structure", "with", "limited", "randomness" ];
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	setup( function() {
		process.chdir( __dirname );

		return mkdir( "..", "data/sub" )
			.then( sub => new Promise( ( resolve, reject ) => {
				const createFile = current => {
					if ( current >= NumFiles ) {
						resolve();
					} else {
						const path = new Array( 3 + Math.floor( Math.random() * 5 ) ).fill( "" )
							.map( () => segments[Math.floor( Math.random() * segments.length )] );

						const filename = new Array( 10 ).fill( "" )
							.map( () => chars[Math.floor( Math.random() * chars.length )] )
							.join( "" ) + ".bin";

						mkdir( sub, path )
							.then( fullPath => write( Path.resolve( fullPath, filename ), Crypto.randomBytes( 16384 ) ) )
							.then( () => process.nextTick( createFile, current + 1 ) )
							.catch( reject );
					}
				};

				createFile( 0 );
			} ) );
	} );

	teardown( function() {
		return rmdir( "../data" );
	} );

	test( "removes many files in provided file including the folder itself", function() {
		const baseFolder = Path.resolve( "..", "data/sub" );

		return rmdir( baseFolder )
			.then( list => {
				list.length.should.be.greaterThan( NumFiles );
			} );
	} );

	test( "removes many files in provided file omitting the folder itself", function() {
		const baseFolder = Path.resolve( "..", "data/sub" );

		return rmdir( baseFolder, { subsOnly: true } )
			.then( list => {
				list.length.should.be.greaterThan( NumFiles );
			} );
	} );
} );
