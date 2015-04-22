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



// Modules
var NodeEventEmitter = require( 'events' ).EventEmitter ;


// Create the object && export it
function EventEmitter() { return Object.create( EventEmitter.prototype ) ; }
module.exports = EventEmitter ;



// Not part of the prototype, because it should not pollute userland's prototype.
// It has an eventEmitter as 'this' anyway (always called using call()).
EventEmitter.init = function init()
{
	this._events = {
		// Special events
		error: [] ,
		newListerner: [] ,
		removeListener: []
	} ;
} ;



EventEmitter.prototype.on = function on( eventName , listener )
{
	if ( typeof listener !== 'function' ) { throw new TypeError( '[nextgen-events] argument #1 should be a function' ) ; }
	
	if ( ! this._events ) { init.call( this ) ; }
	
	// From Node.js code: 'newListener' event
	// Before // adding it to the listeners, first emit 'newListener', to avoid recursion
	// in the case that eventName === 'newListener'
	if ( this._events.newListener.length )
	{
		this.emit( 'newListener' , eventName , listener ) ;
	}
	
	if ( ! this._events[ eventName ] ) { this._events[ eventName ] = [] ; }
	
	this._events[ eventName ].push( listener ) ;
	
	return this;
} ;



EventEmitter.prototype.off = function off( eventName , listener )
{
	var i , length , newListeners = [] , removedListeners = [] ;
	
	if ( typeof listener !== 'function' ) { throw new TypeError( '[nextgen-events] argument #1 should be a function' ) ; }
	
	if ( ! this._events ) { init.call( this ) ; }
	if ( ! this._events[ eventName ] ) { this._events[ eventName ] = [] ; }
	
	length = this._events[ eventName ].length ;
	
	// It's probably faster to create a new array of listeners
	for ( i = 0 ; i < length ; i ++ )
	{
		if ( this._events[ eventName ][ i ] !== listener )
		{
			newListeners.push( this._events[ eventName ][ i ] ) ;
		}
		else
		{
			removedListeners.push( this._events[ eventName ][ i ] ) ;
		}
	}
	
	if ( length !== newListeners.length && this._events.removeListener.length )
	{
		this.emit( 'removeListener' , eventName , removedListeners ) ;
	}
	
	return this ;
} ;



EventEmitter.prototype.removeAllListeners = function removeAllListeners( eventName )
{
	var i , newListeners = [] , removedListeners = [] ;
	
	if ( typeof listener !== 'function' ) { throw new TypeError( '[nextgen-events] argument #1 should be a function' ) ; }
	
	if ( ! this._events ) { init.call( this ) ; }
	if ( ! this._events[ eventName ] ) { this._events[ eventName ] = [] ; }
	
	removedListener = this._events[ eventName ] ;
	this._events[ eventName ] = [] ;
	
	if ( length !== newListeners.length && this._events.removeListener.length )
	{
		this.emit( 'removeListener' , eventName , removedListeners ) ;
	}
	
	return this ;
} ;



EventEmitter.prototype.emit = function emit( eventName )
{
	var i , args , count = 0 ;
	
	if ( ! this._events ) { init.call( this ) ; }
	if ( ! this._events[ eventName ] ) { this._events[ eventName ] = [] ; }
	
	// Prepare arguments
	// /!\ done even if there is no listener ATM
	args = Array.prototype.slice.apply( arguments , 1 ) ;
	
	for ( i = 0 ; i < this._events[ eventName ].length ; i ++ )
	{
		count ++ ;
		this._events[ eventName ][ i ].apply( this , args ) ;
	}
	
	if ( ! count && eventName === 'error' )
	{
		// 'error' event is a special case: it should be listened for, or it will throw an error
		if ( arguments[ 1 ] ) { throw arguments[ 1 ] ; }
		else { throw Error( "[nextgen-events] Uncaught, unspecified 'error' event." ) ; }
	}
} ;



EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (util.isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (Array.isArray(listeners)) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};




// Should be implemented later
EventEmitter.prototype.once = function() {} ;
EventEmitter.prototype.listeners = function listeners(type) {} ;
EventEmitter.listenerCount = function(emitter, type) {} ;



// Just for the node.js compatibility
EventEmitter.prototype.addListener = EventEmitter.prototype.on ;
EventEmitter.prototype.removeListener = EventEmitter.prototype.off ;

// There is no such thing in nextGen emit, however, we need to be compatible for drop-in replacement of node.js events
EventEmitter.prototype.setMaxListeners = function() {} ;





