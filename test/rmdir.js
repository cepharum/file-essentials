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

const { suite, test } = require( "mocha" );
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

	test( "is a function", function() {
		Should( rmdir ).be.a.Function().which.has.length( 1 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

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
