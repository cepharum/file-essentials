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

const { suite, test, suiteSetup } = require( "mocha" );
const Should = require( "should" );

const { read } = require( "../" );


suite( "require( 'file-essentials' ).read", function() {
	suiteSetup( function() {
		process.chdir( __dirname );
	} );

	test( "is a function", function() {
		Should( read ).be.a.Function().which.has.length( 1 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

		( () => ( promise = read( "read.js" ) ) ).should.not.throw();

		return promise;
	} );

	test( "promises content of read file", function() {
		return read( "read.js" ).should.be.Promise().which.is.resolved()
			.then( content => {
				Should( content ).be.ok().and.an.instanceOf( Buffer );
				content.toString().should.containEql( "\"promises content of read file\"" );
			} );
	} );

	test( "rejects promise on trying to read missing file", function() {
		return read( "notfound/read.js" ).should.be.Promise().which.is.rejected();
	} );
} );
