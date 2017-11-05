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

const { mkdir } = require( "../" );

const createDataDir = require( "./.setup" );


const dataDir = Path.resolve( __dirname, "../data" );


suite( "require( 'file-essentials' ).mkdir", function() {
	suiteSetup( function( done ) {
		createDataDir( dataDir, done );
	} );

	test( "is a function", function() {
		Should( mkdir ).be.a.Function().which.has.length( 2 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

		( () => ( promise = mkdir( dataDir, [] ) ) ).should.not.throw();

		return promise;
	} );

	test( "returns promise resolved on having created all folders in desired path name", function() {
		return mkdir( dataDir, [] ).should.be.Promise().which.is.resolvedWith( dataDir );
	} );

	test( "returns promise resolved with full pathname of created folder", function() {
		return mkdir( dataDir, ["test"] ).should.be.Promise().which.is.resolvedWith( Path.resolve( dataDir, "test" ) );
	} );

	test( "succeeds on creating multiple levels", function() {
		return mkdir( dataDir, [ "some", "deep", "folder-structure", "to.be", "cre ated" ] ).should.be.Promise().which.is.resolvedWith( Path.resolve( dataDir, "some/deep/folder-structure/to.be/cre ated" ) );
	} );

	test( "fails on creating multiple levels with segment containing path separator", function() {
		return mkdir( dataDir, [ "some", "deep", `folder${Path.sep}structure`, "to.be", "cre ated" ] ).should.be.Promise().which.is.rejected();
	} );

	test( "fails on creating multiple levels with segment containing colon", function() {
		return mkdir( dataDir, [ "some", "deep", "folder:structure", "to.be", "cre ated" ] ).should.be.Promise().which.is.rejected();
	} );

	test( "fails on creating multiple levels with segment consisting of period, only", function() {
		return mkdir( dataDir, [ "some", "deep", "folder-structure", ".", "cre ated" ] ).should.be.Promise().which.is.rejected();
	} );

	test( "fails on creating multiple levels with segment consisting of two periods, only", function() {
		return mkdir( dataDir, [ "some", "deep", "folder-structure", "..", "cre ated" ] ).should.be.Promise().which.is.rejected();
	} );
} );
