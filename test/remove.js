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

const { suite, test } = require( "mocha" );
const Should = require( "should" );

const { mkdir, rmdir, write, remove } = require( "../" );

const dataDir = Path.resolve( __dirname, "../data" );


suite( "require( 'file-essentials' ).remove", function() {
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
		Should( remove ).be.a.Function().which.has.length( 1 );
	} );

	test( "does not throw on invocation", function() {
		let promise = null;

		( () => ( promise = remove( dataDir ) ) ).should.not.throw();

		return promise.catch( () => {} ); // eslint-disable-line no-empty-function
	} );

	test( "returns promise resolved on having removed selected file", function() {
		return remove( Path.resolve( dataDir, "sub", "another file.txt" ) ).should.be.Promise().which.is.resolved();
	} );

	test( "returns promise resolved on having 'removed' already missing file", function() {
		return remove( Path.resolve( dataDir, "sub", "another file.txt" ) ).should.be.Promise().which.is.resolved();
	} );

	test( "returns promise resolved with pathname of removed file", function() {
		const pathName = Path.resolve( dataDir, "sub", "another file.txt" );

		return remove( pathName )
			.then( name => {
				name.should.be.String().which.is.equal( pathName );
			} );
	} );
} );
