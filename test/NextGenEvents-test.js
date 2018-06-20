/*
	Next-Gen Events
	
	Copyright (c) 2015 - 2018 Cédric Ronvel
	
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

"use strict" ;



var NextGenEvents ;

if ( process.browser ) {
	NextGenEvents = require( '../lib/browser.js' ) ;
}
else {
	NextGenEvents = require( '../lib/NextGenEvents.js' ) ;
}






			/* Helpers */



var genericListener = function( tag , stats , fn ) {
	
	//console.log( 'Listener #' + tag + ' received an event with arguments: ' , arguments ) ;
	
	if ( ! stats.count[ tag ] ) { stats.count[ tag ] = 1 ; }
	else { stats.count[ tag ] ++ ; }
	
	stats.orders.push( tag ) ;
	
	if ( fn ) { fn.apply( undefined , Array.prototype.slice.call( arguments , 3 ) ) ; }
} ;



function asyncEventTest( emitterNice , emitNice , listenerNice , contextNice , finish )
{
	var order = [] ;
	var emitter = new NextGenEvents() ;
	
	if ( emitterNice !== undefined ) { emitter.setNice( emitterNice ) ; }
	
	if ( contextNice !== undefined ) { emitter.addListenerContext( 'context' , { nice: contextNice } ) ; }
	
	var listener = {
		context: 'context' ,
		fn: function() {
			order.push( 'listener' ) ;
			expect( arguments.length ).to.be( 3 ) ;
			expect( arguments[ 0 ] ).to.be( 'one' ) ;
			expect( arguments[ 1 ] ).to.be( 'two' ) ;
			expect( arguments[ 2 ] ).to.be( 'three' ) ;
		}
	} ;
	
	if ( listenerNice ) { listener.nice = listenerNice ; }
	
	emitter.on( 'event' , listener ) ;
	
	if ( emitNice ) { emitter.emit( emitNice , 'event' , 'one' , 'two' , 'three' ) ; }
	else { emitter.emit( 'event' , 'one' , 'two' , 'three' ) ; }
	
	setImmediate( function() { order.push( 'setImmediate' ) ; } ) ;
	setTimeout( function() { order.push( 'setTimeout25' ) ; } , 25 ) ;
	setTimeout( function() { order.push( 'setTimeout50' ) ; } , 50 ) ;
	
	// Finish
	setTimeout( function() {
		finish( order ) ;
	} , 80 ) ;
	
	order.push( 'flow' ) ;
}





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
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function() { triggered ++ ; } ) ;
		
		bus.emit( 'hello' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should emit without argument" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function() {
			triggered ++ ;
			expect( arguments.length ).to.be( 0 ) ;
		} ) ;
		
		bus.emit( 'hello' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should emit with argument" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
		} ) ;
		
		bus.emit( 'hello' , 'world' , '!' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should emit synchronously (nice =-10) with argument" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
		} ) ;
		
		bus.emit( -10 , 'hello' , 'world' , '!' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should emit asynchronously (setTimeout 10ms) with argument" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			done() ;
		} ) ;
		
		bus.emit( 10 , 'hello' , 'world' , '!' ) ;
	} ) ;
	
	it( "should emit asynchronously (setTimeout 0ms) with argument" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			done() ;
		} ) ;
		
		bus.emit( 10 , 'hello' , 'world' , '!' ) ;
	} ) ;
	
	it( "should emit asynchronously (setImmediate) with argument" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			done() ;
		} ) ;
		
		bus.emit( -1 , 'hello' , 'world' , '!' ) ;
	} ) ;
	
	it( "should add many basic listeners for many events, and multiple emits should trigger only relevant listener" , function() {
		
		var bus = new NextGenEvents() ;
		
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
		
		var bus = new NextGenEvents() ;
		
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
		
		var bus = new NextGenEvents() ;
		
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
	
	it( ".removeAllListeners() without argument should remove all listeners for all events" , function() {
		
		var bus = new NextGenEvents() ;
		
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
		
		var bus = new NextGenEvents() ;
		
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
	
	it( ".waitFor() should work as the Promise-returning counterpart of .once(), only the first event arg is returned" , async function() {
		var bus = new NextGenEvents() ;
		setTimeout( () => bus.emit( 'foo' , 'bar' , 'baz' , 'qux' ) , 100 ) ;
		var result = await bus.waitFor( 'foo' ) ;
		expect( result ).to.be( 'bar' ) ;
	} ) ;
	
	it( ".waitForAll() should work as the Promise-returning counterpart of .once(), the event arguments as an array is returned" , async function() {
		var bus = new NextGenEvents() ;
		setTimeout( () => bus.emit( 'foo' , 'bar' , 'baz' , 'qux' ) , 100 ) ;
		var result = await bus.waitForAll( 'foo' ) ;
		expect( result ).to.eql( [ 'bar' , 'baz' , 'qux' ] ) ;
	} ) ;
	
	it( ".waitForEmit() should work as the Promise-returning counterpart of .emit() with completion callback" , async function() {
		
		var bus = new NextGenEvents() ;
		
		bus.setInterruptible( true ) ;
		
		bus.on( 'foo' , {
			id: 'foobar' ,
			async: true ,
			fn: ( ... args ) => {
				var callback = args[ args.length - 1 ] ;
				setTimeout( callback , 30 ) ;
			}
		} ) ;
		
		bus.on( 'foo' , {
			id: 'foobaz' ,
			async: true ,
			fn: ( ... args ) => {
				var callback = args[ args.length - 1 ] ;
				setTimeout( () => callback( "qbar" ) , 30 ) ;
			}
		} ) ;
		
		bus.on( 'foo' , {
			id: 'foobarbaz' ,
			async: true ,
			fn: ( ... args ) => {
				var callback = args[ args.length - 1 ] ;
				setTimeout( callback , 3000 ) ;
			}
		} ) ;
		
		var interrupt = await bus.waitForEmit( 'foo' ) ;
		
		expect( interrupt ).to.be( "qbar" ) ;
	} ) ;
	
	it( "unhandled 'error' event should throw whatever is passed to it" , function() {
		
		var throwed = 0 , triggered = 0 ;
		var bus = new NextGenEvents() ;
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
	
	it( "NextGenEvents.listenerCount() and .listenerCount() should count listeners for an event" , function() {
		
		var bus = new NextGenEvents() ;
		
		var onFoo1 ;
		
		onFoo1 = function() {} ;
		
		bus.on( 'foo' , onFoo1 ) ;
		expect( bus.listenerCount( 'foo' ) ).to.be( 1 ) ;
		expect( bus.listenerCount( 'bar' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 1 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.on( 'foo' , onFoo1 ) ;
		bus.on( 'foo' , onFoo1 ) ;
		
		expect( bus.listenerCount( 'foo' ) ).to.be( 3 ) ;
		expect( bus.listenerCount( 'bar' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 3 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.removeListener( 'foo' , onFoo1 ) ;
		
		expect( bus.listenerCount( 'foo' ) ).to.be( 0 ) ;
		expect( bus.listenerCount( 'bar' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.once( 'foo' , onFoo1 ) ;
		expect( bus.listenerCount( 'foo' ) ).to.be( 1 ) ;
		expect( bus.listenerCount( 'bar' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 1 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
		bus.emit( 'foo' ) ;
		expect( bus.listenerCount( 'foo' ) ).to.be( 0 ) ;
		expect( bus.listenerCount( 'bar' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'foo' ) ).to.be( 0 ) ;
		expect( NextGenEvents.listenerCount( bus , 'bar' ) ).to.be( 0 ) ;
		
	} ) ;
	
	it( "should emit a warning when the max listener limit is reached" , function( done ) {
		var count = 0 ,
			catched = 0 ,
			bus = new NextGenEvents() ;
		
		process.on( 'warning' , warning => {
			// Looks like this event is emitted asynchronously by Node.js -_-'
			//expect( count ).to.be( 1 ) ;
			catched ++ ;
		} ) ;
		
		bus.setMaxListeners( 1 ) ;
		expect( bus.getMaxListeners() ).to.be( 1 ) ;
		
		count ++ ;
		bus.on( 'foo' , function() {} ) ;
		
		count ++ ;
		bus.on( 'foo' , function() {} ) ;
		
		count ++ ;
		bus.on( 'foo' , function() {} ) ;
		
		if ( process.browser ) {
			// Browsers don't have event-emitter process, so nothing will happened.
			// We still run most of the test so we can detect unexpected throw in the browser.
			done() ;
			return ;
		}
		
		setTimeout( () => {
			expect( catched ).to.be( 1 ) ;
			done() ;
		} , 30 ) ;
	} ) ;
} ) ;



describe( "Basic synchronous event-emitting (NOT compatible with node)" , function() {
	
	it( "should remove every occurences of a listener for one event" , function() {
		
		var bus = new NextGenEvents() ;
		
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
		
		var bus = new NextGenEvents() ;
		
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
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		var onFoo = genericListener.bind( undefined , 'foo' , stats , undefined ) ;
		var onBar1 = genericListener.bind( undefined , 'bar1' , stats , undefined ) ;
		var onBar2 = genericListener.bind( undefined , 'bar2' , stats , undefined ) ;
		
		
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
		
		bus.emit( 'foo' ) ;
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
		
		var bus = new NextGenEvents() ;
		
		var listeners , onFoo1 ;
		
		onFoo1 = function onFoo1() {} ;
		
		bus.on( 'foo' , onFoo1 ) ;
		listeners = bus.listeners( 'foo' ) ;
		expect( listeners.length ).to.be( 1 ) ;
		expect( listeners[ 0 ].id ).to.be( onFoo1 ) ;
		if ( ! global.AsyncTryCatch ) { expect( listeners[ 0 ].fn ).to.be( onFoo1 ) ; }
		expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.on( 'foo' , onFoo1 ) ;
		bus.on( 'foo' , onFoo1 ) ;
		
		listeners = bus.listeners( 'foo' ) ;
		expect( listeners.length ).to.be( 3 ) ;
		expect( listeners[ 1 ].id ).to.be( onFoo1 ) ;
		if ( ! global.AsyncTryCatch ) { expect( listeners[ 1 ].fn ).to.be( onFoo1 ) ; }
		expect( listeners[ 1 ].event ).to.be( 'foo' ) ;
		expect( listeners[ 2 ].id ).to.be( onFoo1 ) ;
		if ( ! global.AsyncTryCatch ) { expect( listeners[ 2 ].fn ).to.be( onFoo1 ) ; }
		expect( listeners[ 2 ].event ).to.be( 'foo' ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.removeListener( 'foo' , onFoo1 ) ;
		expect( bus.listeners( 'foo' ).length ).to.be( 0 ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.once( 'foo' , onFoo1 ) ;
		listeners = bus.listeners( 'foo' ) ;
		expect( listeners.length ).to.be( 1 ) ;
		expect( listeners[ 0 ].id ).to.be( onFoo1 ) ;
		if ( ! global.AsyncTryCatch ) { expect( listeners[ 0 ].fn ).to.be( onFoo1 ) ; }
		expect( listeners[ 0 ].event ).to.be( 'foo' ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
		
		bus.emit( 'foo' ) ;
		listeners = bus.listeners( 'foo' ) ;
		expect( bus.listeners( 'foo' ).length ).to.be( 0 ) ;
		expect( bus.listeners( 'bar' ).length ).to.be( 0 ) ;
	} ) ;
} ) ;



describe( "Next Gen feature: listener in 'eventObject' mode" , function() {
	
	it( "listener using 'eventObject' option" , function() {
		
		var triggered = 0 ,
			bus = new NextGenEvents() ;
		
		bus.once( 'hello' , function( event ) {
			triggered ++ ;
			expect( event.args.length ).to.be( 2 ) ;
			expect( event.args[ 0 ] ).to.be( 'world' ) ;
			expect( event.args[ 1 ] ).to.be( '!' ) ;
			
			expect( event.emitter ).to.be( bus ) ;
			expect( event.name ).to.be( 'hello' ) ;
			expect( event.callback ).not.to.be.ok() ;
		} , { eventObject: true } ) ;
		
		bus.emit( 'hello' , 'world' , '!' ) ;
		
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "listener using 'eventObject' option and emit() with completion callback" , function() {
		
		var triggered = 0 , emitCallbackTriggered = 0 ,
			bus = new NextGenEvents() ;
		
		var emitCallback = function() {
			emitCallbackTriggered ++ ;
		} ;
		
		bus.once( 'hello' , function( event ) {
			triggered ++ ;
			expect( event.args.length ).to.be( 0 ) ;
			
			expect( event.emitter ).to.be( bus ) ;
			expect( event.name ).to.be( 'hello' ) ;
			expect( event.callback ).to.be( emitCallback ) ;
		} , { eventObject: true } ) ;
		
		bus.emit( 'hello' , emitCallback ) ;
		
		expect( triggered ).to.be( 1 ) ;
		expect( emitCallbackTriggered ).to.be( 1 ) ;
	} ) ;
	
	it( "listener using 'eventObject' option and emit() with completion callback in non-SYNC mode" , function( done ) {
		
		var triggered = 0 , emitCallbackTriggered = 0 ,
			bus = new NextGenEvents() ;
		
		bus.setNice( -1000 ) ;
		
		var emitCallback = function() {
			emitCallbackTriggered ++ ;
			expect( triggered ).to.be( 1 ) ;
			expect( emitCallbackTriggered ).to.be( 1 ) ;
			done() ;
		} ;
		
		bus.once( 'hello' , function( event ) {
			triggered ++ ;
			expect( event.args.length ).to.be( 0 ) ;
			
			expect( event.emitter ).to.be( bus ) ;
			expect( event.name ).to.be( 'hello' ) ;
			expect( event.callback ).to.be( emitCallback ) ;
		} , { eventObject: true } ) ;
		
		bus.emit( 'hello' , emitCallback ) ;
		expect( emitCallbackTriggered ).to.be( 0 ) ;
	} ) ;
	
	it( "listener using 'eventObject' and 'async' options, and emit() with completion callback" , function( done ) {
		
		var triggered = 0 , emitCallbackTriggered = 0 ,
			bus = new NextGenEvents() ;
		
		var emitCallback = function() {
			emitCallbackTriggered ++ ;
			expect( triggered ).to.be( 1 ) ;
			expect( emitCallbackTriggered ).to.be( 1 ) ;
			done() ;
		} ;
		
		bus.once( 'hello' , function( event , callback ) {
			triggered ++ ;
			expect( event.args.length ).to.be( 0 ) ;
			
			expect( event.emitter ).to.be( bus ) ;
			expect( event.name ).to.be( 'hello' ) ;
			expect( event.callback ).to.be( emitCallback ) ;
			
			setTimeout( function() {
				callback() ;
			} , 20 ) ;
			
		} , { async: true , eventObject: true } ) ;
		
		bus.emit( 'hello' , emitCallback ) ;
		expect( emitCallbackTriggered ).to.be( 0 ) ;
	} ) ;
} ) ;



describe( "Next Gen feature: state-events" , function() {
	
	it( "should emit a state-event, further listeners should receive the last emitted event immediately" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.defineStates( 'ready' ) ;
		
		bus.on( 'ready' , function( arg ) {
			triggered ++ ;
			expect( arg ).to.be( 'ok!' ) ;
		} ) ;
		expect( triggered ).to.be( 0 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( false ) ;
		expect( bus.getAllStates() ).to.eql( [] ) ;
		
		bus.emit( 'ready' , 'ok!' ) ;
		expect( triggered ).to.be( 1 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.on( 'ready' , function( arg ) {
			triggered ++ ;
			expect( arg ).to.be( 'ok!' ) ;
		} ) ;
		
		expect( triggered ).to.be( 2 ) ;
		
		bus.once( 'ready' , function( arg ) {
			triggered ++ ;
			expect( arg ).to.be( 'ok!' ) ;
		} ) ;
		
		expect( triggered ).to.be( 3 ) ;
		
		bus.emit( 'ready' , 'ok!' , 'stateBreaker#1' ) ;
		expect( triggered ).to.be( 5 ) ;
		
		
		bus.removeAllListeners( 'ready' ) ;
		
		bus.once( 'ready' , function( arg ) {
			triggered ++ ;
			expect( arg ).to.be( 'ok!' ) ;
		} ) ;
		expect( triggered ).to.be( 6 ) ;
		
		bus.emit( 'ready' ) ;
		
		bus.once( 'ready' , function( arg ) {
			triggered ++ ;
			expect( arg ).not.to.be.ok() ;
		} ) ;
		expect( triggered ).to.be( 7 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
	} ) ;
	
	it( "when the state remains the same, nothing should be emitted" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.defineStates( 'ready' , 'notReady' ) ;
		
		bus.on( 'ready' , function() {
			triggered ++ ;
		} ) ;
		expect( triggered ).to.be( 0 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( false ) ;
		expect( bus.getAllStates() ).to.eql( [] ) ;
		
		bus.emit( 'ready' ) ;
		expect( triggered ).to.be( 1 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.on( 'ready' , function() {
			triggered ++ ;
		} ) ;
		
		expect( triggered ).to.be( 2 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.emit( 'ready' ) ;
		
		expect( triggered ).to.be( 2 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.emit( 'ready' , '#1' ) ;
		
		expect( triggered ).to.be( 4 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.emit( 'ready' , '#1' ) ;
		
		expect( triggered ).to.be( 4 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.emit( 'ready' , '#2' ) ;
		
		expect( triggered ).to.be( 6 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.emit( 'ready' , '#2' ) ;
		
		expect( triggered ).to.be( 6 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.emit( 'ready' ) ;
		
		expect( triggered ).to.be( 8 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
		
		bus.emit( 'notReady' ) ;
		expect( triggered ).to.be( 8 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( false ) ;
		expect( bus.hasState( 'notReady' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'notReady' ] ) ;
		
		bus.emit( 'ready' ) ;
		expect( triggered ).to.be( 10 ) ;
		expect( bus.hasState( 'ready' ) ).to.be( true ) ;
		expect( bus.hasState( 'notReady' ) ).to.be( false ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ready' ] ) ;
	} ) ;
	
	it( "should define three exclusive states, emitting one should discard the two others" , function() {
		
		var bus = new NextGenEvents() ;
		
		var startingTriggered = 0 , runningTriggered = 0 , endingTriggered = 0 ;
		
		// Define 3 exclusives states
		bus.defineStates( 'starting' , 'running' , 'ending' ) ;
		expect( bus.hasState( 'starting' ) ).to.be( false ) ;
		expect( bus.hasState( 'running' ) ).to.be( false ) ;
		expect( bus.hasState( 'ending' ) ).to.be( false ) ;
		expect( bus.getAllStates() ).to.eql( [] ) ;
		
		bus.on( 'starting' , function() {
			startingTriggered ++ ;
		} ) ;
		expect( startingTriggered ).to.be( 0 ) ;
		
		bus.emit( 'starting' ) ;
		expect( bus.hasState( 'starting' ) ).to.be( true ) ;
		expect( bus.hasState( 'running' ) ).to.be( false ) ;
		expect( bus.hasState( 'ending' ) ).to.be( false ) ;
		expect( bus.getAllStates() ).to.eql( [ 'starting' ] ) ;
		expect( startingTriggered ).to.be( 1 ) ;
		
		bus.on( 'starting' , function() {
			startingTriggered ++ ;
		} ) ;
		expect( startingTriggered ).to.be( 2 ) ;
		
		bus.on( 'running' , function() {
			runningTriggered ++ ;
		} ) ;
		expect( startingTriggered ).to.be( 2 ) ;
		expect( runningTriggered ).to.be( 0 ) ;
		
		// Emit the 'running' state-event, thus discarding the 'starting' state
		bus.emit( 'running' ) ;
		expect( bus.hasState( 'starting' ) ).to.be( false ) ;
		expect( bus.hasState( 'running' ) ).to.be( true ) ;
		expect( bus.hasState( 'ending' ) ).to.be( false ) ;
		expect( bus.getAllStates() ).to.eql( [ 'running' ] ) ;
		expect( startingTriggered ).to.be( 2 ) ;
		expect( runningTriggered ).to.be( 1 ) ;
		
		bus.on( 'starting' , function() {
			startingTriggered ++ ;
		} ) ;
		expect( startingTriggered ).to.be( 2 ) ;
		expect( runningTriggered ).to.be( 1 ) ;
		
		bus.on( 'running' , function() {
			runningTriggered ++ ;
		} ) ;
		expect( startingTriggered ).to.be( 2 ) ;
		expect( runningTriggered ).to.be( 2 ) ;
		
		bus.on( 'ending' , function() {
			endingTriggered ++ ;
		} ) ;
		expect( startingTriggered ).to.be( 2 ) ;
		expect( runningTriggered ).to.be( 2 ) ;
		expect( endingTriggered ).to.be( 0 ) ;
		
		// Emit the 'ending' state-event, thus discarding the 'running' state
		bus.emit( 'ending' ) ;
		expect( bus.hasState( 'starting' ) ).to.be( false ) ;
		expect( bus.hasState( 'running' ) ).to.be( false ) ;
		expect( bus.hasState( 'ending' ) ).to.be( true ) ;
		expect( bus.getAllStates() ).to.eql( [ 'ending' ] ) ;
		expect( startingTriggered ).to.be( 2 ) ;
		expect( runningTriggered ).to.be( 2 ) ;
		expect( endingTriggered ).to.be( 1 ) ;
		
		// Emit the 'starting' state-event, thus discarding the 'ending' state
		bus.emit( 'starting' ) ;
		expect( bus.hasState( 'starting' ) ).to.be( true ) ;
		expect( bus.hasState( 'running' ) ).to.be( false ) ;
		expect( bus.hasState( 'ending' ) ).to.be( false ) ;
		expect( bus.getAllStates() ).to.eql( [ 'starting' ] ) ;
		expect( startingTriggered ).to.be( 5 ) ;
		expect( runningTriggered ).to.be( 2 ) ;
		expect( endingTriggered ).to.be( 1 ) ;
		
		bus.on( 'running' , function() {
			runningTriggered ++ ;
		} ) ;
		bus.on( 'ending' , function() {
			endingTriggered ++ ;
		} ) ;
		expect( startingTriggered ).to.be( 5 ) ;
		expect( runningTriggered ).to.be( 2 ) ;
		expect( endingTriggered ).to.be( 1 ) ;
	} ) ;
} ) ;



describe( "Next Gen feature: emitter group actions" , function() {
	
	it( "should emit on a group of emitters" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		busList[ 0 ].on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
		} ) ;
		
		busList[ 1 ].on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
		} ) ;
		
		busList[ 2 ].on( 'hello' , function( arg1 , arg2 ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
		} ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		
		expect( triggered ).to.be( 3 ) ;
	} ) ;
	
	it( "should listen to a group of emitters" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		NextGenEvents.groupOn( busList , 'hello' , function( emitter , arg1 , arg2 ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			expect( emitter.triggered ).to.be.within( 1 , 2 ) ;
		} ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 3 ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 6 ) ;
	} ) ;
	
	it( "should listen to a group of emitters then stop listening" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		var fn = function( emitter , arg1 , arg2 ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			expect( emitter.triggered ).to.be( 1 ) ;
		} ;
		
		NextGenEvents.groupOn( busList , 'hello' , fn ) ;
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 3 ) ;
		
		NextGenEvents.groupOff( busList , 'hello' , fn ) ;
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 3 ) ;
	} ) ;
	
	it( "should add multiple listeners to a group of emitters then remove all of them at once" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		var fn = function( emitter , arg1 , arg2 ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			expect( emitter.triggered ).to.be( 1 ) ;
		} ;
		
		var fn2 = function( emitter , arg1 , arg2 ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			expect( emitter.triggered ).to.be( 2 ) ;
		} ;
		
		NextGenEvents.groupOn( busList , 'hello' , fn ) ;
		NextGenEvents.groupOn( busList , 'hello' , fn2 ) ;
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 6 ) ;
		
		NextGenEvents.groupRemoveAllListeners( busList , 'hello' ) ;
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 6 ) ;
	} ) ;
	
	it( "should listen once to each emitters of a group" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		NextGenEvents.groupOnce( busList , 'hello' , function( emitter , arg1 , arg2 ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			expect( emitter.triggered ).to.be( 1 ) ;
		} ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 3 ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 3 ) ;
	} ) ;
	
	it( "should listen once to a whole group of emitters" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		NextGenEvents.groupOnceFirst( busList , 'hello' , function( emitter , arg1 , arg2 ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			expect( emitter.triggered ).to.be( 1 ) ;
		} ) ;
		
		busList[ 1 ].emit( 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '?' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '?' ) ;
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should listen once the last emitter to emit from whole group" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		NextGenEvents.groupOnceLast( busList , 'hello' , function( emitter , arg1 , arg2 ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			expect( emitter.triggered ).to.be( 1 ) ;
		} ) ;
		
		busList[ 1 ].emit( 'hello' , 'world' , '...' ) ;
		expect( triggered ).to.be( 0 ) ;
		busList[ 1 ].emit( 'hello' , 'world' , '...' ) ;
		expect( triggered ).to.be( 0 ) ;
		busList[ 1 ].emit( 'hello' , 'world' , '...' ) ;
		expect( triggered ).to.be( 0 ) ;
		busList[ 0 ].emit( 'hello' , 'world' , '...' ) ;
		expect( triggered ).to.be( 0 ) ;
		busList[ 0 ].emit( 'hello' , 'world' , '...' ) ;
		expect( triggered ).to.be( 0 ) ;
		busList[ 1 ].emit( 'hello' , 'world' , '...' ) ;
		expect( triggered ).to.be( 0 ) ;
		
		busList[ 2 ].emit( 'hello' , 'world' , '!' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		busList[ 2 ].emit( 'hello' , 'world' , '?' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '?' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '?' ) ;
		expect( triggered ).to.be( 1 ) ;
	} ) ;
	
	it( "should emit with a completion callback that should be triggered once all emitters have finished" , function( done ) {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 , timeoutTriggered = 0 , callbackTriggered = 0 ;
		
		busList[ 0 ].on( 'hello' , function( arg1 , arg2 , callback ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			setTimeout( function() {
				timeoutTriggered ++ ;
				callback() ;
			} , 50 ) ;
		} , { async: true } ) ;
		
		busList[ 1 ].on( 'hello' , function( arg1 , arg2 , callback ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			setTimeout( function() {
				timeoutTriggered ++ ;
				callback() ;
			} , 10 ) ;
		} , { async: true } ) ;
		
		busList[ 2 ].on( 'hello' , function( arg1 , arg2 , callback ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			setTimeout( function() {
				timeoutTriggered ++ ;
				callback() ;
			} , 20 ) ;
		} , { async: true } ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' , function( interruption ) {
			callbackTriggered ++ ;
			expect( interruption ).not.to.be.ok() ;
			expect( callbackTriggered ).to.be( 1 ) ;
		} ) ;
		
		expect( triggered ).to.be( 3 ) ;
		
		setTimeout( function() {
			expect( timeoutTriggered ).to.be( 3 ) ;
			expect( callbackTriggered ).to.be( 1 ) ;
			done() ;
		} , 100 ) ;
	} ) ;
	
	it( "using interruptible emitters, it should trigger the completion callback once one of them is interrupted" , function( done ) {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		busList.forEach( function( bus ) { bus.setInterruptible( true ) ; } ) ;
		
		var triggered = 0 , timeoutTriggered = 0 , callbackTriggered = 0 ;
		
		busList[ 0 ].on( 'hello' , function( arg1 , arg2 , callback ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			setTimeout( function() {
				timeoutTriggered ++ ;
				callback() ;
			} , 50 ) ;
		} , { async: true } ) ;
		
		busList[ 1 ].on( 'hello' , function( arg1 , arg2 , callback ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			setTimeout( function() {
				timeoutTriggered ++ ;
				callback( 'interrupted!' ) ;
			} , 10 ) ;
		} , { async: true } ) ;
		
		busList[ 2 ].on( 'hello' , function( arg1 , arg2 , callback ) {
			triggered ++ ;
			expect( arg1 ).to.be( 'world' ) ;
			expect( arg2 ).to.be( '!' ) ;
			setTimeout( function() {
				timeoutTriggered ++ ;
				callback() ;
			} , 20 ) ;
		} , { async: true } ) ;
		
		NextGenEvents.groupEmit( busList , 'hello' , 'world' , '!' , function( interruption ) {
			callbackTriggered ++ ;
			expect( interruption ).to.be( 'interrupted!' ) ;
			expect( callbackTriggered ).to.be( 1 ) ;
		} ) ;
		
		expect( triggered ).to.be( 3 ) ;
		
		setTimeout( function() {
			expect( timeoutTriggered ).to.be( 3 ) ;
			expect( callbackTriggered ).to.be( 1 ) ;
			done() ;
		} , 100 ) ;
	} ) ;
	
	it( "should define states on a group of emitters and use it" , function() {
		
		var busList = [
			new NextGenEvents() ,
			new NextGenEvents() ,
			new NextGenEvents()
		] ;
		
		var triggered = 0 ;
		
		NextGenEvents.groupDefineStates( busList , 'starting' , 'running' , 'ending' ) ;
		
		NextGenEvents.groupEmit( busList , 'starting' ) ;
		
		NextGenEvents.groupOn( busList , 'starting' , function( emitter ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( emitter.triggered ).to.be( 1 ) ;
		} ) ;
		
		expect( triggered ).to.be( 3 ) ;
		
		NextGenEvents.groupEmit( busList , 'ending' ) ;
		
		NextGenEvents.groupOn( busList , 'starting' , function( emitter ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( emitter.triggered ).to.be( 1 ) ;
		} ) ;
		
		expect( triggered ).to.be( 3 ) ;
		
		NextGenEvents.groupOn( busList , 'ending' , function( emitter ) {
			triggered ++ ;
			emitter.triggered = ( emitter.triggered || 0 ) + 1 ;
			expect( emitter.triggered ).to.be( 2 ) ;
		} ) ;
		
		expect( triggered ).to.be( 6 ) ;
	} ) ;
	
	it( "all .groupWaitFor*() static methods" ) ;
	
	it( "using interruptible emitters, once one of them is interrupted, should all other emitter be interrupted too?" ) ;
} ) ;



describe( "Next Gen feature: objects sharing the same event bus" , function() {
	
	it( "should emit on one of the shared emitters and receive on all" , function() {
		var bus1 = Object.create( NextGenEvents.prototype , { a: { value: 1 , enumerable: true } } ) ;
		var bus2 = Object.create( NextGenEvents.prototype , { b: { value: 2 , enumerable: true } } ) ;
		var triggered = 0 ;
		
		NextGenEvents.share( bus1 , bus2 ) ;
		
		expect( bus1.a ).to.be( 1 ) ;
		expect( bus2.b ).to.be( 2 ) ;
		
		bus1.on( 'hello' , function() {
			triggered ++ ;
		} ) ;
		
		bus2.emit( 'hello' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		bus2.on( 'hello' , function() {
			triggered ++ ;
		} ) ;
		
		bus2.emit( 'hello' ) ;
		expect( triggered ).to.be( 3 ) ;
		
		bus1.emit( 'hello' ) ;
		expect( triggered ).to.be( 5 ) ;
	} ) ;
} ) ;



describe( "Next Gen feature: async emitting" , function() {
	
	it( "should emit synchronously, with a synchronous flow (nice = NextGenEvents.SYNC)" , function( done ) {
		asyncEventTest( NextGenEvents.SYNC , undefined , undefined , undefined , function( order ) {
			expect( order ).to.eql( [ 'listener' , 'flow' , 'setImmediate' , 'setTimeout25' , 'setTimeout50' ] ) ;
			done() ;
		} ) ;
	} ) ;
	
	it( "should emit asynchronously, with an asynchronous flow, almost as fast as possible (nice = -1)" , function( done ) {
		asyncEventTest( -1 , undefined , undefined , undefined , function( order ) {
			expect( order ).to.eql( [ 'flow' , 'listener' , 'setImmediate' , 'setTimeout25' , 'setTimeout50' ] ) ;
			done() ;
		} ) ;
	} ) ;
	
	it.optional( "should emit asynchronously, with an asynchronous flow, with minimal delay (nice = 0)" , function( done ) {
		asyncEventTest( 0 , undefined , undefined , undefined , function( order ) {
			/*
			try {
				expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'listener' , 'setTimeout25' , 'setTimeout50' ] ) ;
			}
			catch( error ) {
			*/
				// Sometime setImmediate() is unpredictable and is slower than setTimeout(fn,0)
				// It is a bug of V8, not a bug of the async lib
				try {
					expect( order ).to.eql( [ 'flow' , 'listener' , 'setImmediate' , 'setTimeout25' , 'setTimeout50' ] ) ;
				}
				catch( error ) {
					// Or even slower than setTimeout(fn,25)... -_-'
					expect( order ).to.eql( [ 'flow' , 'listener' , 'setTimeout25' , 'setImmediate' , 'setTimeout50' ] ) ;
				}
			//}
			done() ;
		} ) ;
	} ) ;
	
	it( "should emit asynchronously, with an asynchronous flow, with a 35ms delay (nice = 35 -> setTimeout 35ms)" , function( done ) {
		asyncEventTest( 35 , undefined , undefined , undefined , function( order ) {
			expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'listener' , 'setTimeout50' ] ) ;
			done() ;
		} ) ;
	} ) ;
	
	it( "should emit asynchronously, with an asynchronous flow, with a 70ms delay (nice = 70 -> setTimeout 70ms)" , function( done ) {
		asyncEventTest( 70 , undefined , undefined , undefined , function( order ) {
			expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'setTimeout50' , 'listener' ] ) ;
			done() ;
		} ) ;
	} ) ;
	
	it( ".emit( nice , event , ... ) should overide emitter's nice value" , function( done ) {
		asyncEventTest( undefined , 35 , undefined , undefined , function( order ) {
			expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'listener' , 'setTimeout50' ] ) ;
			asyncEventTest( NextGenEvents.SYNC , 35 , undefined , undefined , function( order ) {
				expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'listener' , 'setTimeout50' ] ) ;
				asyncEventTest( 100 , 35 , undefined , undefined , function( order ) {
					expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'listener' , 'setTimeout50' ] ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "should use the highest nice value between the context's nice, the listener's nice and the emitter's nice" , function( done ) {
		asyncEventTest( undefined , 35 , NextGenEvents.SYNC , NextGenEvents.SYNC , function( order ) {
			expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'listener' , 'setTimeout50' ] ) ;
			asyncEventTest( undefined , NextGenEvents.SYNC , 35 , NextGenEvents.SYNC , function( order ) {
				expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'listener' , 'setTimeout50' ] ) ;
				asyncEventTest( undefined , NextGenEvents.SYNC , NextGenEvents.SYNC , 35 , function( order ) {
					expect( order ).to.eql( [ 'flow' , 'setImmediate' , 'setTimeout25' , 'listener' , 'setTimeout50' ] ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
} ) ;



describe( "Next Gen feature: contexts" , function() {
	
	it( "when a listener is tied to a context, it should stop receiving events if the context is disabled (implicit context declaration)" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.on( 'foo' , {
			context: 'bar' ,
			fn: function() { triggered ++ ; }
		} ) ;
		
		bus.emit( 'foo' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		bus.disableListenerContext( 'bar' ) ;
		bus.emit( 'foo' ) ;
		bus.emit( 'foo' ) ;
		bus.emit( 'foo' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		bus.enableListenerContext( 'bar' ) ;
		bus.emit( 'foo' ) ;
		expect( triggered ).to.be( 2 ) ;
	} ) ;
	
	it( "when a listener is tied to a context, it should stop receiving events if the context is disabled (explicit context declaration)" , function() {
		
		var bus = new NextGenEvents() ;
		
		var triggered = 0 ;
		
		bus.addListenerContext( 'bar' , { status: NextGenEvents.CONTEXT_DISABLED } ) ;
		
		bus.on( 'foo' , {
			context: 'bar' ,
			fn: function() { triggered ++ ; }
		} ) ;
		
		bus.emit( 'foo' ) ;
		bus.emit( 'foo' ) ;
		bus.emit( 'foo' ) ;
		expect( triggered ).to.be( 0 ) ;
		
		bus.enableListenerContext( 'bar' ) ;
		bus.emit( 'foo' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		bus.disableListenerContext( 'bar' ) ;
		bus.emit( 'foo' ) ;
		expect( triggered ).to.be( 1 ) ;
		
		bus.enableListenerContext( 'bar' ) ;
		bus.emit( 'foo' ) ;
		expect( triggered ).to.be( 2 ) ;
	} ) ;
	
	it( ".destroyListenerContext() should destroy a context and all listeners tied to it" , function() {
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		bus.on( 'foo' , {
			id: 'foo1' ,
			context: 'bar' ,
			fn: genericListener.bind( undefined , 'foo1' , stats , undefined )
		} ) ;
		
		bus.on( 'foo' , {
			id: 'foo2' ,
			context: 'bar' ,
			fn: genericListener.bind( undefined , 'foo2' , stats , undefined )
		} ) ;
		
		bus.on( 'baz' , {
			id: 'baz1' ,
			context: 'bar' ,
			fn: genericListener.bind( undefined , 'baz1' , stats , undefined )
		} ) ;
		
		bus.on( 'baz' , {
			id: 'baz2' ,
			context: 'qux' ,
			fn: genericListener.bind( undefined , 'baz2' , stats , undefined )
		} ) ;
		
		bus.emit( 'foo' ) ;
		expect( stats.count ).to.eql( { foo1: 1 , foo2: 1 } ) ;
		bus.emit( 'baz' ) ;
		expect( stats.count ).to.eql( { foo1: 1 , foo2: 1 , baz1: 1 , baz2: 1 } ) ;
		
		bus.destroyListenerContext( 'bar' ) ;
		bus.emit( 'foo' ) ;
		expect( stats.count ).to.eql( { foo1: 1 , foo2: 1 , baz1: 1 , baz2: 1 } ) ;
		bus.emit( 'baz' ) ;
		expect( stats.count ).to.eql( { foo1: 1 , foo2: 1 , baz1: 1 , baz2: 2 } ) ;
		
		bus.destroyListenerContext( 'qux' ) ;
		bus.emit( 'foo' ) ;
		expect( stats.count ).to.eql( { foo1: 1 , foo2: 1 , baz1: 1 , baz2: 2 } ) ;
		bus.emit( 'baz' ) ;
		expect( stats.count ).to.eql( { foo1: 1 , foo2: 1 , baz1: 1 , baz2: 2 } ) ;
	} ) ;
	
} ) ;



describe( "Next Gen feature: contexts queue" , function() {
	
	it( ".queueListenerContext() should pause the context, queueing events, .enableListenerContext() should resume pending events emitting" , function() {
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		bus.on( 'foo' , {
			id: 'foobar' ,
			context: 'qux' ,
			fn: genericListener.bind( undefined , 'foobar' , stats , function() {
				var args = Array.prototype.slice.call( arguments ) ;
				switch ( stats.count.foobar )
				{
					case 1 :
						expect( args ).to.eql( [ 'one' , 'two' , 'three' ] ) ;
						break ;
					case 2 :
						expect( args ).to.eql( [ 'four' , 'five' , 'six' ] ) ;
						break ;
					case 3 :
						expect( args ).to.eql( [] ) ;
						break ;
					case 4 :
						expect( args ).to.eql( [ 'seven' ] ) ;
						break ;
				}
			} )
		} ) ;
		
		bus.on( 'foo' , {
			id: 'foobaz' ,
			context: 'qux' ,
			fn: genericListener.bind( undefined , 'foobaz' , stats , function() {
				var args = Array.prototype.slice.call( arguments ) ;
				switch ( stats.count.foobaz )
				{
					case 1 :
						expect( args ).to.eql( [ 'one' , 'two' , 'three' ] ) ;
						break ;
					case 2 :
						expect( args ).to.eql( [ 'four' , 'five' , 'six' ] ) ;
						break ;
					case 3 :
						expect( args ).to.eql( [] ) ;
						break ;
					case 4 :
						expect( args ).to.eql( [ 'seven' ] ) ;
						break ;
				}
			} )
		} ) ;
		
		bus.on( 'qbar' , {
			id: 'qbarbaz' ,
			context: 'qbarbaz' ,
			fn: genericListener.bind( undefined , 'qbarbaz' , stats , undefined )
		} ) ;
		
		bus.emit( 'foo' , 'one' , 'two' , 'three' ) ;
		bus.emit( 'qbar' ) ;
		expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , qbarbaz: 1 } ) ;
		
		bus.queueListenerContext( 'qux' ) ;
		bus.emit( 'foo' , 'four' , 'five' , 'six' ) ;
		bus.emit( 'foo' ) ;
		bus.emit( 'foo' , 'seven' ) ;
		bus.emit( 'qbar' ) ;
		expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , qbarbaz: 2 } ) ;
		
		bus.enableListenerContext( 'qux' ) ;
		expect( stats.count ).to.eql( { foobar: 4 , foobaz: 4 , qbarbaz: 2 } ) ;
	} ) ;
	
} ) ;



describe( "Next Gen feature: contexts serialization" , function() {
	
	it( "3 async listeners for an event, tied to a serial context, each listener should be triggered one after the other" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		bus.on( 'foo' , {
			id: 'foobar' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobar' , stats , function() {
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( callback , 30 ) ;
			} )
		} ) ;
		
		bus.on( 'foo' , {
			id: 'foobaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( callback , 30 ) ;
			} )
		} ) ;
		
		bus.on( 'foo' , {
			id: 'foobarbaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobarbaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , foobarbaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( function() {
					callback() ;
					done() ;
				} , 30 ) ;
			} )
		} ) ;
		
		bus.serializeListenerContext( 'qux' ) ;
		bus.emit( 'foo' ) ;
		expect( stats.count ).to.eql( { foobar: 1 } ) ;
	} ) ;
	
	it( "3 async listeners for 3 events, tied to a serial context, each listener should be triggered one after the other" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		bus.on( 'bar' , {
			id: 'foobar' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobar' , stats , function() {
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( callback , 30 ) ;
			} )
		} ) ;
		
		bus.on( 'baz' , {
			id: 'foobaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( callback , 30 ) ;
			} )
		} ) ;
		
		bus.on( 'barbaz' , {
			id: 'foobarbaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobarbaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , foobarbaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( function() {
					callback() ;
					done() ;
				} , 30 ) ;
			} )
		} ) ;
		
		bus.serializeListenerContext( 'qux' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		bus.emit( 'barbaz' ) ;
		expect( stats.count ).to.eql( { foobar: 1 } ) ;
	} ) ;
	
	it( "mixing sync and async listeners tied to a serial context, sync event should not block (test 1)" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		bus.on( 'bar' , {
			id: 'foobar' ,
			context: 'qux' ,
			fn: genericListener.bind( undefined , 'foobar' , stats , function() {
			} )
		} ) ;
		
		bus.on( 'baz' , {
			id: 'foobaz' ,
			context: 'qux' ,
			fn: genericListener.bind( undefined , 'foobaz' , stats , function() {
			} )
		} ) ;
		
		bus.on( 'barbaz' , {
			id: 'foobarbaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobarbaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , foobarbaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( function() {
					callback() ;
					done() ;
				} , 30 ) ;
			} )
		} ) ;
		
		bus.serializeListenerContext( 'qux' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		bus.emit( 'barbaz' ) ;
		expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , foobarbaz: 1 } ) ;
	} ) ;
	
	it( "mixing sync and async listeners tied to a serial context, sync event should not block (test 2)" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		bus.on( 'bar' , {
			id: 'foobar' ,
			context: 'qux' ,
			fn: genericListener.bind( undefined , 'foobar' , stats , function() {
			} )
		} ) ;
		
		bus.on( 'baz' , {
			id: 'foobaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( callback , 30 ) ;
			} )
		} ) ;
		
		bus.on( 'barbaz' , {
			id: 'foobarbaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobarbaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , foobarbaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( function() {
					callback() ;
					done() ;
				} , 30 ) ;
			} )
		} ) ;
		
		bus.serializeListenerContext( 'qux' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		bus.emit( 'barbaz' ) ;
		expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 } ) ;
	} ) ;
	
	it( "mixing sync and async listeners tied to a serial context, sync event should not block (test 3)" , function( done ) {
		
		var bus = new NextGenEvents() ;
		
		var stats = { count: {} , orders: [] } ;
		
		bus.on( 'bar' , {
			id: 'foobar' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobar' , stats , function() {
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( callback , 30 ) ;
			} )
		} ) ;
		
		bus.on( 'baz' , {
			id: 'foobaz' ,
			context: 'qux' ,
			fn: genericListener.bind( undefined , 'foobaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 } ) ;
				
				// 'barbaz' should trigger immediately
				process.nextTick( function() {
					expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , foobarbaz: 1 } ) ;
				} ) ;
			} )
		} ) ;
		
		bus.on( 'barbaz' , {
			id: 'foobarbaz' ,
			context: 'qux' ,
			async: true ,
			fn: genericListener.bind( undefined , 'foobarbaz' , stats , function() {
				expect( stats.count ).to.eql( { foobar: 1 , foobaz: 1 , foobarbaz: 1 } ) ;
				var callback = arguments[ arguments.length - 1 ] ;
				setTimeout( function() {
					callback() ;
					done() ;
				} , 30 ) ;
			} )
		} ) ;
		
		bus.serializeListenerContext( 'qux' ) ;
		bus.emit( 'bar' ) ;
		bus.emit( 'baz' ) ;
		bus.emit( 'barbaz' ) ;
		expect( stats.count ).to.eql( { foobar: 1 } ) ;
	} ) ;
} ) ;



describe( "Next Gen feature: interrupt event emitting, and 'interrupt' event" , function() {
	
	it( "should fire an event, the first listener should interrupt it, thus firing an 'interrupt' event" , function() {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 , onInterrupt1 , onInterrupt2 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 , interrupt1: 0 , interrupt2: 0 } ;
		
		// 3 listeners for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; return { want: 'interruption' } ; } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.on( 'interrupt' , onInterrupt1 = function( object ) {
			triggered.interrupt1 ++ ;
			expect( object ).to.eql( { want: 'interruption' } ) ;
		} ) ;
		
		bus.on( 'interrupt' , onInterrupt2 = function( object ) {
			triggered.interrupt2 ++ ;
			expect( object ).to.eql( { want: 'interruption' } ) ;
		} ) ;
		
		bus.emit( 'foo' ) ;
		expect( triggered ).to.eql( { foo1: 1 , foo2: 0 , foo3: 0 , interrupt1: 1 , interrupt2: 1 } ) ;
	} ) ;
	
	it( "should fire asynchronously an event, the first listener should interrupt it, thus firing an 'interrupt' event" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 , onInterrupt1 , onInterrupt2 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 , interrupt1: 0 , interrupt2: 0 } ;
		
		// 3 listeners for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; return { want: 'interruption' } ; } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.on( 'interrupt' , onInterrupt1 = function( object ) {
			triggered.interrupt1 ++ ;
			expect( object ).to.eql( { want: 'interruption' } ) ;
		} ) ;
		
		bus.on( 'interrupt' , onInterrupt2 = function( object ) {
			triggered.interrupt2 ++ ;
			//console.error( ">>> object: " , object ) ;
			expect( object ).to.eql( { want: 'interruption' } ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 0 , foo3: 0 , interrupt1: 1 , interrupt2: 1 } ) ;
			done() ;
		} ) ;
		
		bus.emit( 20 , 'foo' ) ;
	} ) ;
	
	it( "should fire asynchronously an event, the first listener should interrupt it using its callback, thus firing an 'interrupt' event" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 , onInterrupt1 , onInterrupt2 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 , interrupt1: 0 , interrupt2: 0 } ;
		
		// 3 listeners for 'foo'
		onFoo1 = function( callback ) {
			triggered.foo1 ++ ;
			callback( { want: 'interruption' } ) ;
		} ;
		bus.on( 'foo' , onFoo1 , { async: true } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.on( 'interrupt' , onInterrupt1 = function( object ) {
			triggered.interrupt1 ++ ;
			expect( object ).to.eql( { want: 'interruption' } ) ;
		} ) ;
		
		bus.on( 'interrupt' , onInterrupt2 = function( object ) {
			triggered.interrupt2 ++ ;
			//console.error( ">>> object: " , object ) ;
			expect( object ).to.eql( { want: 'interruption' } ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 0 , foo3: 0 , interrupt1: 1 , interrupt2: 1 } ) ;
			done() ;
		} ) ;
		
		bus.emit( 20 , 'foo' ) ;
	} ) ;
} ) ;



describe( "Next Gen feature: completion callback" , function() {
	
	it( "should emit an event with a completion callback, triggered when all synchronous listener have finished running" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 } ;
		
		// 3 listeners for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.emit( 'foo' , function() {
			expect( arguments.length ).to.be( 2 ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 1 , foo3: 1 } ) ;
			
			bus.emit( -1 , 'foo' , function() {
				expect( arguments.length ).to.be( 2 ) ;
				expect( triggered ).to.eql( { foo1: 2 , foo2: 2 , foo3: 2 } ) ;
				
				bus.emit( 10 , 'foo' , function() {
					expect( arguments.length ).to.be( 2 ) ;
					expect( triggered ).to.eql( { foo1: 3 , foo2: 3 , foo3: 3 } ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "if the event is interrupted, the completion callback should be triggered with the 'interrupt' value" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 } ;
		
		// 3 listeners for 'foo'
		bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; return { want: 'interruption' } ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.emit( 'foo' , function( interruption ) {
			expect( arguments.length ).to.be( 2 ) ;
			expect( interruption ).to.eql( { want: 'interruption' } ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 1 , foo3: 0 } ) ;
			
			bus.emit( -1 , 'foo' , function( interruption ) {
				expect( arguments.length ).to.be( 2 ) ;
				expect( interruption ).to.eql( { want: 'interruption' } ) ;
				expect( triggered ).to.eql( { foo1: 2 , foo2: 2 , foo3: 0 } ) ;
				
				bus.emit( 10 , 'foo' , function( interruption ) {
					expect( arguments.length ).to.be( 2 ) ;
					expect( interruption ).to.eql( { want: 'interruption' } ) ;
					expect( triggered ).to.eql( { foo1: 3 , foo2: 3 , foo3: 0 } ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "the completion callback should work with asynchronous listener" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 } ;
		
		// 3 listeners for 'foo'
		onFoo1 = function( callback ) {
			setTimeout( function() {
				triggered.foo1 ++ ;
				callback() ;
			} , 10 ) ;
		} ;
		bus.on( 'foo' , onFoo1 , { async: true } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.emit( 'foo' , function() {
			expect( arguments.length ).to.be( 2 ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 1 , foo3: 1 } ) ;
			
			bus.emit( -1 , 'foo' , function() {
				expect( arguments.length ).to.be( 2 ) ;
				expect( triggered ).to.eql( { foo1: 2 , foo2: 2 , foo3: 2 } ) ;
				
				bus.emit( 10 , 'foo' , function() {
					expect( arguments.length ).to.be( 2 ) ;
					expect( triggered ).to.eql( { foo1: 3 , foo2: 3 , foo3: 3 } ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "the completion callback should work with listeners asynchronously interrupting the event" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 } ;
		
		// 3 listeners for 'foo'
		onFoo1 = function( callback ) {
			setTimeout( function() {
				triggered.foo1 ++ ;
				callback( { want: 'interruption' } ) ;
			} , 10 ) ;
		} ;
		bus.on( 'foo' , onFoo1 , { async: true } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.emit( 'foo' , function( interruption ) {
			expect( arguments.length ).to.be( 2 ) ;
			expect( interruption ).to.eql( { want: 'interruption' } ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 1 , foo3: 1 } ) ;
			
			bus.emit( -1 , 'foo' , function( interruption ) {
				expect( arguments.length ).to.be( 2 ) ;
				expect( interruption ).to.eql( { want: 'interruption' } ) ;
				expect( triggered ).to.eql( { foo1: 2 , foo2: 2 , foo3: 2 } ) ;
				
				bus.emit( 10 , 'foo' , function( interruption ) {
					expect( arguments.length ).to.be( 2 ) ;
					expect( interruption ).to.eql( { want: 'interruption' } ) ;
					expect( triggered ).to.eql( { foo1: 3 , foo2: 3 , foo3: 3 } ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "the completion callback should work with an async listeners synchronously interrupting the event with its callback" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 ;
		var triggered = { foo1: 0 , foo2: 0 , foo3: 0 } ;
		
		// 3 listeners for 'foo'
		onFoo1 = function( callback ) {
			triggered.foo1 ++ ;
			callback( { want: 'interruption' } ) ;
		} ;
		bus.on( 'foo' , onFoo1 , { async: true } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.emit( 'foo' , function( interruption ) {
			expect( arguments.length ).to.be( 2 ) ;
			expect( interruption ).to.eql( { want: 'interruption' } ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 0 , foo3: 0 } ) ;
			
			bus.emit( -1 , 'foo' , function( interruption ) {
				expect( arguments.length ).to.be( 2 ) ;
				expect( interruption ).to.eql( { want: 'interruption' } ) ;
				expect( triggered ).to.eql( { foo1: 2 , foo2: 0 , foo3: 0 } ) ;
				
				bus.emit( 10 , 'foo' , function( interruption ) {
					expect( arguments.length ).to.be( 2 ) ;
					expect( interruption ).to.eql( { want: 'interruption' } ) ;
					expect( triggered ).to.eql( { foo1: 3 , foo2: 0 , foo3: 0 } ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "the completion callback should work with an async listeners synchronously interrupting the event using return" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 , onFoo3 ;
		var triggered = { foo1: 0 , foo1timeout: 0 , foo2: 0 , foo3: 0 } ;
		
		// 3 listeners for 'foo'
		onFoo1 = function( callback ) {
			triggered.foo1 ++ ;
			setTimeout( function() {
				triggered.foo1timeout ++ ;
				callback() ;
			} , 10 ) ;
			return { want: 'interruption' } ;
		} ;
		bus.on( 'foo' , onFoo1 , { async: true } ) ;
		bus.on( 'foo' , onFoo2 = function() { triggered.foo2 ++ ; } ) ;
		bus.on( 'foo' , onFoo3 = function() { triggered.foo3 ++ ; } ) ;
		
		bus.emit( 'foo' , function( interruption ) {
			expect( arguments.length ).to.be( 2 ) ;
			expect( interruption ).to.eql( { want: 'interruption' } ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo1timeout: 0 , foo2: 0 , foo3: 0 } ) ;
			
			bus.emit( -1 , 'foo' , function( interruption ) {
				expect( arguments.length ).to.be( 2 ) ;
				expect( interruption ).to.eql( { want: 'interruption' } ) ;
				expect( triggered ).to.eql( { foo1: 2 , foo1timeout: 0 , foo2: 0 , foo3: 0 } ) ;
				
				bus.emit( 10 , 'foo' , function( interruption ) {
					expect( arguments.length ).to.be( 2 ) ;
					expect( interruption ).to.eql( { want: 'interruption' } ) ;
					expect( triggered ).to.eql( { foo1: 3 , foo1timeout: 2 , foo2: 0 , foo3: 0 } ) ;
					done() ;
				} ) ;
			} ) ;
		} ) ;
	} ) ;
	
	it( "Context serialization, emitter callback and deadlock prevention (case #1)" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 ;
		var onQux1 , onQux2 ;
		var triggered = { foo1: 0 , foo2: 0 , fooCb: 0 , qux1: 0 , qux2: 0 } ;
		
		onFoo1 = function( callback ) {
			bus.emit( 'qux' , () => {
				setTimeout( function() {
					triggered.foo1 ++ ;
					callback() ;
				} , 10 ) ;
			} ) ;
		} ;
		onFoo2 = function( callback ) {
			setTimeout( function() {
				triggered.foo2 ++ ;
				callback() ;
			} , 10 ) ;
		} ;
		onQux1 = function( callback ) {
			setTimeout( function() {
				triggered.qux1 ++ ;
				callback() ;
			} , 20 ) ;
		} ;
		onQux2 = function( callback ) {
			setTimeout( function() {
				triggered.qux2 ++ ;
				callback() ;
			} , 20 ) ;
		} ;
		
		bus.on( 'foo' , onFoo1 , { async: true , context: 'ctx' } ) ;
		bus.on( 'foo' , onFoo2 , { async: true , context: 'ctx' } ) ;
		bus.on( 'qux' , onQux1 , { async: true , context: 'ctx' } ) ;
		bus.on( 'qux' , onQux2 , { async: true , context: 'ctx' } ) ;
		bus.serializeListenerContext( 'ctx' ) ;
		
		bus.emit( 'foo' , function() {
			triggered.fooCb ++ ;
			expect( arguments.length ).to.be( 2 ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 1 , fooCb: 1 , qux1: 1 , qux2: 1 } ) ;
			done() ;
		} ) ;
		
		expect( triggered ).to.eql( { foo1: 0 , foo2: 0 , fooCb: 0 , qux1: 0 , qux2: 0 } ) ;
	} ) ;
	
	it( "Context serialization, emitter callback and deadlock prevention (case #2)" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 ;
		var onQux1 , onQux2 ;
		var triggered = { foo1: 0 , foo2: 0 , fooCb: 0 , qux1: 0 , qux2: 0 } ;
		
		onFoo1 = function( callback ) {
			setTimeout( function() {
				bus.emit( 'qux' , () => {
					triggered.foo1 ++ ;
					callback() ;
				} ) ;
			} , 10 ) ;
		} ;
		onFoo2 = function( callback ) {
			setTimeout( function() {
				triggered.foo2 ++ ;
				callback() ;
			} , 10 ) ;
		} ;
		onQux1 = function( callback ) {
			setTimeout( function() {
				triggered.qux1 ++ ;
				callback() ;
			} , 20 ) ;
		} ;
		onQux2 = function( callback ) {
			setTimeout( function() {
				triggered.qux2 ++ ;
				callback() ;
			} , 20 ) ;
		} ;
		
		bus.on( 'foo' , onFoo1 , { async: true , context: 'ctx' } ) ;
		bus.on( 'foo' , onFoo2 , { async: true , context: 'ctx' } ) ;
		bus.on( 'qux' , onQux1 , { async: true , context: 'ctx' } ) ;
		bus.on( 'qux' , onQux2 , { async: true , context: 'ctx' } ) ;
		bus.serializeListenerContext( 'ctx' ) ;
		
		bus.emit( 'foo' , function() {
			triggered.fooCb ++ ;
			expect( arguments.length ).to.be( 2 ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 1 , fooCb: 1 , qux1: 1 , qux2: 1 } ) ;
			done() ;
		} ) ;
		
		expect( triggered ).to.eql( { foo1: 0 , foo2: 0 , fooCb: 0 , qux1: 0 , qux2: 0 } ) ;
	} ) ;
	
	it( "Context serialization, emitter callback and deadlock prevention (case #3)" , function( done ) {
		
		var bus = new NextGenEvents() ;
		bus.setInterruptible( true ) ;
		
		var onFoo1 , onFoo2 ;
		var onQux1 , onQux2 ;
		var triggered = { foo1: 0 , foo2: 0 , fooCb: 0 , qux1: 0 , qux2: 0 } ;
		
		onFoo1 = function( callback ) {
			setTimeout( function() {
				bus.emit( 'qux' , () => {
					triggered.foo1 ++ ;
					callback() ;
				} ) ;
			} , 10 ) ;
		} ;
		onFoo2 = function( callback ) {
			bus.emit( 'qux' , () => {
				setTimeout( function() {
					triggered.foo2 ++ ;
					callback() ;
				} , 10 ) ;
			} ) ;
		} ;
		onQux1 = function( callback ) {
			setTimeout( function() {
				triggered.qux1 ++ ;
				callback() ;
			} , 20 ) ;
		} ;
		onQux2 = function( callback ) {
			setTimeout( function() {
				triggered.qux2 ++ ;
				callback() ;
			} , 20 ) ;
		} ;
		
		bus.on( 'foo' , onFoo1 , { async: true , context: 'ctx' } ) ;
		bus.on( 'foo' , onFoo2 , { async: true , context: 'ctx' } ) ;
		bus.on( 'qux' , onQux1 , { async: true , context: 'ctx' } ) ;
		bus.on( 'qux' , onQux2 , { async: true , context: 'ctx' } ) ;
		bus.serializeListenerContext( 'ctx' ) ;
		
		bus.emit( 'foo' , function() {
			triggered.fooCb ++ ;
			expect( arguments.length ).to.be( 2 ) ;
			expect( triggered ).to.eql( { foo1: 1 , foo2: 1 , fooCb: 1 , qux1: 2 , qux2: 2 } ) ;
			done() ;
		} ) ;
		
		expect( triggered ).to.eql( { foo1: 0 , foo2: 0 , fooCb: 0 , qux1: 0 , qux2: 0 } ) ;
	} ) ;
} ) ;



describe( "Proxies" , function() {
	it( "TODO..." ) ;
} ) ;		



describe( "Edge cases" , function() {
	
	it( "inside a 'newListener' listener, the .listenerCount() should report correctly" , function() {
		
		var triggered = 0 ,
			bus = new NextGenEvents() ;
		
		bus.on( 'newListener' , function( listeners ) {
			triggered ++ ;
			expect( listeners.length ).to.be( 1 ) ;
			expect( listeners[ 0 ].event ).to.be( 'ready' ) ;
			
			// This is the tricky condition
			expect( bus.listenerCount( 'ready' ) ).to.be( 1 ) ;
		} ) ;
		
		bus.on( 'ready' , function() {} ) ;
		expect( triggered ).to.be( 1 ) ;
	} ) ;
} ) ;



describe( "Historical bugs" , function() {
	
	it( "should not throw when adding a new listener after .removeAllListeners()" , function() {
		var bus = new NextGenEvents() ;
		bus.removeAllListeners() ;
		bus.on( 'foo' , function() {} ) ;
	} ) ;
} ) ;



