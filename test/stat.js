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

const { stat } = require( "../" );


suite( "require( 'file-essentials' ).stat", function() {
	suiteSetup( function() {
		process.chdir( __dirname );
	} );

	test( "is a function", function() {
		Should( stat ).be.a.Function().which.has.length( 1 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

		( () => ( promise = stat( "read.js" ) ) ).should.not.throw();

		return promise;
	} );

	test( "promises information on inspected file", function() {
		return stat( "read.js" ).should.be.Promise().which.is.resolved()
			.then( stats => {
				Should( stats ).be.ok().and.an.Object();
				stats.should.have.properties( [ "isDirectory", "isFile", "isSocket", "mtime", "size" ] );
			} );
	} );

	test( "promises null on inspecting missing file", function() {
		return stat( "notfound/read.js" ).should.be.Promise().which.is.resolvedWith( null );
	} );
} );
