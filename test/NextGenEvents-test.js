/*
	The Cedric's Swiss Knife (CSK) - CSK NextGen Events

	Copyright (c) 2015 Cédric Ronvel 
	
	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

/* jshint unused:false */
/* global describe, it, before, after */



var NextGenEvents = require( '../lib/NextGenEvents.js' ) ;

var expect = require( 'expect.js' ) ;





			/* Helpers */



var genericListener = function( tag , stats , fn ) {
	
	//console.log( 'Listener #' + tag + ' received an event with arguments: ' , arguments ) ;
	
	if ( ! stats.count[ tag ] ) { stats.count[ tag ] = 1 ; }
	else { stats.count[ tag ] ++ ; }
	
	stats.orders.push( tag ) ;
	
	if ( fn ) { fn.apply( undefined , Array.prototype.slice.call( arguments , 3 ) ) ; }
} ;





			/* Tests */



describe( "Basic synchronous event-emitting (node-compatible)" , function() {
	
	//var NextGenEvents = require( 'events' ).EventEmitter ;
	
	it( "should add one listener and emit should trigger it, using 'new'" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function() { triggered ++ ; } ) ;
		
		bus.emit( 'hello' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should add one listener and emit should trigger it, using 'Object.create()'" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function() { triggered ++ ; } ) ;
		
		bus.emit( 'hello' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should emit with argument" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
		} ) ;
		
		bus.emit( 'hello' , 'world' , '!' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should add many basic listeners for many events, and multiple emits should trigger only relevant listener" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
		var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;
		
		// 1 listener for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;
		
		// 2 listeners for 'bar'
		bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
		bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;
		
		// 3 listeners for 'baz'
		bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
		bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
		bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;
		
		bus.emit( 'foo' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
		
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
		
		bus.emit( 'baz' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.emit( 'qux' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.emit( 'foo' ) ;
		bus.emit( 'foo' ) ;
		expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.emit( 'qux' ) ;
		bus.emit( 'qux' ) ;
		expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.emit( 'baz' ) ;
		bus.emit( 'baz' ) ;
		expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 3 , baz2: 3 , baz3: 3 , qux: 0 } ) ;
	} ) ;
	
	it( "should add and remove listeners" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
		var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;
		
		// 1 listener for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;
		
		// 2 listeners for 'bar'
		bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
		bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;
		
		// 3 listeners for 'baz'
		bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
		bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
		bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;
		
		bus.emit( 'foo' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
		
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
		
		bus.removeListener( 'bar' , onBar2 ) ;
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
		
		bus.removeListener( 'bar' , onBar2 ) ;
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 3 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
		
		bus.removeListener( 'foo' , onBar1 ) ; // Not listening for this event!
		bus.removeListener( 'bar' , function() {} ) ; // Not event registered
		bus.emit( 'foo' ) ;
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 2 , bar1: 4 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
	} ) ;
	
	it( ".removeAllListeners() should remove all listeners for an event" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
		var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;
		
		// 1 listener for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;
		
		// 2 listeners for 'bar'
		bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
		bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;
		
		// 3 listeners for 'baz'
		bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
		bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
		bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;
		
		bus.emit( 'foo' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.removeAllListeners( 'bar' ) ;
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.emit( 'foo' ) ;
		expect( triggered ).to.eql( { foo1: 2 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.removeAllListeners( 'baz' ) ;
		bus.emit( 'foo' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
	} ) ;
	
	it( ".removeAllListeners() without argument should all listeners for all events" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
		var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;
		
		// 1 listener for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;
		
		// 2 listeners for 'bar'
		bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
		bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;
		
		// 3 listeners for 'baz'
		bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
		bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
		bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;
		
		bus.emit( 'foo' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
		
		bus.removeAllListeners() ;
		bus.emit( 'foo' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		bus.emit( 'qux' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
	} ) ;
	
	it( ".once() should add one time listener for an event, the event should stop listening after being triggered once" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
		var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , qux: 0 } ;
		
		// 1 listener for 'foo'
		bus.once( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;
		
		// 2 listeners for 'bar'
		bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
		bus.once( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;
		
		// 3 listeners for 'baz'
		bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
		onBaz2 = function() { triggered.baz2 ++ ; } ;
		bus.once( 'baz' , onBaz2 ) ;
		bus.once( 'baz' , onBaz2 ) ;
		bus.once( 'baz' , onBaz2 ) ;
		
		bus.emit( 'foo' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 3 , qux: 0 } ) ;
		
		bus.emit( 'foo' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 3 , qux: 0 } ) ;
		
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 1 , baz1: 1 , baz2: 3 , qux: 0 } ) ;
		
		bus.emit( 'baz' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 1 , baz1: 2 , baz2: 3 , qux: 0 } ) ;
	} ) ;
	
	it( "unhandled 'error' event should throw whatever is passed to it" , function() {
		
		var throwed = 0 , triggered = 0 ;
		var bus = Object.create( NextGenEvents.prototype ) ;
		var testError = new Error( 'Some error occurs!' ) ;
		
		var onError = function( error ) {
			triggered ++ ;
			expect( error ).to.be( testError ) ;
		} ;
		
		try {
			bus.emit( 'error' , testError ) ;
		}
		catch ( error ) {
			throwed ++ ;
			expect( error ).to.be( testError ) ;
		}
		
		expect( throwed ).to.be( 1 ) ;
		
		bus.once( 'error' , onError ) ;
		
		bus.emit( 'error' , testError ) ;
		// Should not throw
		expect( triggered ).to.be( 1 ) ;
		
		try {
			bus.emit( 'error' , testError ) ;
		}
		catch ( error ) {
			throwed ++ ;
			expect( error ).to.be( testError ) ;
		}
		
		expect( throwed ).to.be( 2 ) ;
	} ) ;
	
	it( "NextGenEvents.listenerCount() should count listeners for an event" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var onFoo1 ;
		
		onFoo1 = function() {} ;
		
		bus.on( 'foo' , onFoo1 ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 1 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.on( 'foo' , onFoo1 ) ;
		bus.on( 'foo' , onFoo1 ) ;
		
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 3 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.removeListener( 'foo' , onFoo1 ) ;
		
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.once( 'foo' , onFoo1 ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 1 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.emit( 'foo' ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
	} ) ;
} ) ;



describe( "Basic synchronous event-emitting (NOT compatible with node)" , function() {
	
	it( "should remove every occurences of a listener for one event" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var onFoo1 , onBar1 , onBar2 ;
		var triggered = { foo1: 0 , bar1: 0 , bar2: 0 } ;
		
		onFoo1 = function() { triggered.foo1 ++ ; } ;
		onBar1 = function() { triggered.bar1 ++ ; } ;
		onBar2 = function() { triggered.bar2 ++ ; } ;
		
		// 1 listener for 'foo'
		bus.on( 'foo' , onFoo1 ) ;
		
		// 2 listeners for 'bar'
		bus.on( 'bar' , onBar1 ) ;
		
		// Same listener added multiple times
		bus.on( 'bar' , onBar2 ) ;
		bus.on( 'bar' , onBar2 ) ;
		bus.on( 'bar' , onBar2 ) ;
		
		bus.emit( 'foo' ) ;
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 3 } ) ;
		
		bus.removeListener( 'bar' , onBar2 ) ;
		bus.emit( 'bar' ) ;
		expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 3 } ) ;
	} ) ;
	
	it( "should emit 'newListener' every time a new listener is added, with an array of listener object" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var stats = { count: {} , orders: [] } ;
		
		
		bus.on( 'newListener' , genericListener.bind( undefined , 'new1' , stats , function( listeners ) {
			
			expect( listeners.length ).to.be( 1 ) ;
			expect( typeof listeners[ 0 ] ).to.be( 'object' ) ;
			
			switch ( stats.count.new1 )
			{
				case 1 :
					expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
					break ;
				case 2 :
					expect( listeners[ 0 ].event ).to.be( 'newListener' ) ;
					break ;
				case 3 :
					expect( listeners[ 0 ].event ).to.be( 'bar' ) ;
					break ;
				default :
					expect().fail() ;
			}
		} ) ) ;
		
		expect( stats.count ).to.eql( {} ) ;
		
		
		bus.on( 'foo' , genericListener.bind( undefined , 'foo' , stats , undefined ) ) ;
		expect( stats.count ).to.eql( { new1: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'new1' ] ) ;
		
		bus.emit( 'foo' ) ;
		expect( stats.count ).to.eql( { new1: 1 , foo: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'new1' , 'foo' ] ) ;
		
		
		bus.on( 'newListener' , genericListener.bind( undefined , 'new2' , stats , function( listeners ) {
			
			expect( listeners.length ).to.be( 1 ) ;
			expect( typeof listeners[ 0 ] ).to.be( 'object' ) ;
			
			switch ( stats.count.new2 )
			{
				case 1 :
					expect( listeners[ 0 ].event ).to.be( 'bar' ) ;
					break ;
				default :
					expect().fail() ;
			}
		} ) ) ;
		
		expect( stats.count ).to.eql( { new1: 2 , foo: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'new1' , 'foo' , 'new1' ] ) ;
		
		
		bus.once( 'bar' , genericListener.bind( undefined , 'bar' , stats , undefined ) ) ;
		expect( stats.count ).to.eql( { new1: 3 , new2: 1 , foo: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'new1' , 'foo' , 'new1' , 'new1' , 'new2' ] ) ;
		
		bus.emit( 'bar' ) ;
		expect( stats.count ).to.eql( { new1: 3 , new2: 1 , foo: 1 , bar: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'new1' , 'foo' , 'new1' , 'new1' , 'new2' , 'bar' ] ) ;
	} ) ;
	
	it( "should emit 'removeListener' every time a new listener is removed (one time listener count as well once triggered), with an array of listener object" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var stats = { count: {} , orders: [] } ;
		
		
		bus.on( 'removeListener' , genericListener.bind( undefined , 'rm1' , stats , function( listeners ) {
			
			switch ( stats.count.rm1 )
			{
				case 1 :
					expect( listeners.length ).to.be( 1 ) ;
					expect( typeof listeners[ 0 ] ).to.be( 'object' ) ;
					expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
					expect( listeners[ 0 ].id ).to.be( onFoo ) ;
					break ;
				case 2 :
					expect( listeners.length ).to.be( 3 ) ;
					expect( typeof listeners[ 0 ] ).to.be( 'object' ) ;
					expect( typeof listeners[ 1 ] ).to.be( 'object' ) ;
					expect( typeof listeners[ 2 ] ).to.be( 'object' ) ;
					expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
					expect( listeners[ 0 ].id ).to.be( onFoo ) ;
					expect( listeners[ 1 ].event ).to.be( 'foo' ) ;
					expect( listeners[ 1 ].id ).to.be( onFoo ) ;
					expect( listeners[ 2 ].event ).to.be( 'foo' ) ;
					expect( listeners[ 2 ].id ).to.be( onFoo ) ;
					break ;
				case 3 :
					expect( listeners.length ).to.be( 1 ) ;
					expect( typeof listeners[ 0 ] ).to.be( 'object' ) ;
					expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
					expect( listeners[ 0 ].id ).to.be( onFoo ) ;
					break ;
				case 4 :
					expect( listeners.length ).to.be( 2 ) ;
					expect( typeof listeners[ 0 ] ).to.be( 'object' ) ;
					expect( typeof listeners[ 1 ] ).to.be( 'object' ) ;
					expect( listeners[ 0 ].event ).to.be( 'bar' ) ;
					expect( listeners[ 0 ].id ).to.be( onBar1 ) ;
					expect( listeners[ 1 ].event ).to.be( 'bar' ) ;
					expect( listeners[ 1 ].id ).to.be( onBar2 ) ;
					break ;
				default :
					expect().fail() ;
			}
		} ) ) ;
		
		expect( stats.count ).to.eql( {} ) ;
		
		
		var onFoo = genericListener.bind( undefined , 'foo' , stats , undefined ) ;
		var onBar1 = genericListener.bind( undefined , 'bar1' , stats , undefined ) ;
		var onBar2 = genericListener.bind( undefined , 'bar2' , stats , undefined ) ;
		
		bus.on( 'foo' , onFoo ) ;
		expect( stats.count ).to.eql( {} ) ;
		expect( stats.orders ).to.eql( [] ) ;
		
		bus.off( 'foo' , onFoo ) ;
		expect( stats.count ).to.eql( { rm1: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'rm1' ] ) ;
		
		bus.on( 'foo' , onFoo ) ;
		bus.on( 'foo' , onFoo ) ;
		bus.on( 'foo' , onFoo ) ;
		expect( stats.count ).to.eql( { rm1: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'rm1' ] ) ;
		
		bus.off( 'foo' , onFoo ) ;
		expect( stats.count ).to.eql( { rm1: 2 } ) ;
		expect( stats.orders ).to.eql( [ 'rm1' , 'rm1' ] ) ;
		
		bus.once( 'foo' , onFoo ) ;
		expect( stats.count ).to.eql( { rm1: 2 } ) ;
		expect( stats.orders ).to.eql( [ 'rm1' , 'rm1' ] ) ;
		
		bus.emit( 'foo' , onFoo ) ;
		expect( stats.count ).to.eql( { rm1: 3 , foo: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'rm1' , 'rm1' , 'foo' , 'rm1' ] ) ;
		
		bus.on( 'foo' , onFoo ) ;
		bus.on( 'bar' , onBar1 ) ;
		bus.on( 'bar' , onBar2 ) ;
		bus.removeAllListeners( 'bar' ) ;
		
		expect( stats.count ).to.eql( { rm1: 4 , foo: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'rm1' , 'rm1' , 'foo' , 'rm1' , 'rm1' ] ) ;
		
		bus.on( 'foo' , onFoo ) ;
		bus.on( 'bar' , onBar1 ) ;
		bus.on( 'bar' , onBar2 ) ;
		bus.removeAllListeners() ;
		
		// 'removeListener' listener are not fired: they are already deleted
		expect( stats.count ).to.eql( { rm1: 4 , foo: 1 } ) ;
		expect( stats.orders ).to.eql( [ 'rm1' , 'rm1' , 'foo' , 'rm1' , 'rm1' ] ) ;
	} ) ;
	
	it( ".listeners() should return all the listeners for an event" , function() {
		
		var bus = Object.create( NextGenEvents.prototype ) ;
		
		var listeners , onFoo1 ;
		
		onFoo1 = function() {} ;
		
		bus.on( 'foo' , onFoo1 ) ;
		listeners = bus.listeners( 'foo' ) ;
		expect( listeners.length ).to.be( 1 ) ;
		expect( listeners[ 0 ].id ).to.be( onFoo1 ) ;
		expect( listeners[ 0 ].fn ).to.be( onFoo1 ) ;
		expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.on( 'foo' , onFoo1 ) ;
		bus.on( 'foo' , onFoo1 ) ;
		
		listeners = bus.listeners( 'foo' ) ;
		expect( listeners.length ).to.be( 3 ) ;
		expect( listeners[ 1 ].id ).to.be( onFoo1 ) ;
		expect( listeners[ 1 ].fn ).to.be( onFoo1 ) ;
		expect( listeners[ 1 ].event ).to.be( 'foo' ) ;
		expect( listeners[ 2 ].id ).to.be( onFoo1 ) ;
		expect( listeners[ 2 ].fn ).to.be( onFoo1 ) ;
		expect( listeners[ 2 ].event ).to.be( 'foo' ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.removeListener( 'foo' , onFoo1 ) ;
		expect( bus.listeners( 'foo' ).length ).to.be( 0 ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.once( 'foo' , onFoo1 ) ;
		listeners = bus.listeners( 'foo' ) ;
		expect( listeners.length ).to.be( 1 ) ;
		expect( listeners[ 0 ].id ).to.be( onFoo1 ) ;
		expect( listeners[ 0 ].fn ).to.be( onFoo1 ) ;
		expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.emit( 'foo' ) ;
		listeners = bus.listeners( 'foo' ) ;
		expect( bus.listeners( 'foo' ).length ).to.be( 0 ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
	} ) ;
} ) ;



describe( "Next Gen features" , function() {
	
	//it( "" , function() {} ) ;
} ) ;



