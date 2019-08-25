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

const { suite, test, suiteSetup, suiteTeardown } = require( "mocha" );
const Should = require( "should" );

const { write, read, mkdir, rmdir } = require( "../" );


suite( "require( 'file-essentials' ).write", function() {
	suiteSetup( function() {
		process.chdir( __dirname );

		return mkdir( "..", "data" );
	} );

	suiteTeardown( () => rmdir( "../data" ) );

	test( "is a function", function() {
		Should( write ).be.a.Function().which.has.length( 2 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

		( () => ( promise = write( "../data/test", "Hello World!" ) ) ).should.not.throw();

		return promise;
	} );

	test( "promises content as given when written to given file", function() {
		return write( "../data/test2", "Hello World!" ).should.be.Promise().which.is.resolved()
			.then( content => {
				Should( content ).be.String().and.equal( "Hello World!" );

				return read( "../data/test2" ).should.be.Promise().which.is.resolved()
					.then( readContent => {
						content.should.be.equal( readContent.toString() );
					} );
			} );
	} );
} );
