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


// Create the object && export it
function NextGenEvents() { return Object.create( NextGenEvents.prototype ) ; }
module.exports = NextGenEvents ;



// Not part of the prototype, because it should not pollute userland's prototype.
// It has an eventEmitter as 'this' anyway (always called using call()).
NextGenEvents.init = function init()
{
	this.__ngev = {
		contexts: {} ,
		events: {
			// Special events
			error: [] ,
			newListerner: [] ,
			removeListener: []
		}
	} ;
} ;



NextGenEvents.createListener = function createListener()
{
} ;

NextGenEvents.CONTEXT_DISABLED = 0 ;
NextGenEvents.CONTEXT_QUEUED = 1 ;
NextGenEvents.CONTEXT_ENABLED = 2 ;



NextGenEvents.prototype.addListener = function addListener( eventName , options )
{
	var listener = {} , context ;
	
	if ( ! this.__ngev ) { init.call( this ) ; }
	
	if ( typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .addListener(): argument #0 should be a string" ) ; }
	
	if ( typeof options === 'function' )
	{
		// The user provided a simple function listener
		listener.id = options ;
		listener.fn = options ;
	}
	else if ( ! options || typeof options !== 'object' || typeof options.fn !== 'function' )
	{
		throw new TypeError( "[nextgen-events] .addListener(): argument #1 should be a function or an object with a 'fn' property which value is a function" ) ;
	}
	else
	{
		listener.fn = options.fn
		listener.id = typeof options.id === 'string' ? options.id : options.fn ;
		listener.once = !! options.once ;
		listener.async = !! options.async ;
		listener.context = typeof options.context === 'string' ? options.context : null ;
		
		// Implicit context creation
		if ( typeof listener.context === 'string' && ! this.__ngev.contexts[ listener.context ] )
		{
			context = this.__ngev.contexts[ listener.context ] = Object.create( NextGenEvents.prototype ) ;
			context.status = NextGenEvents.CONTEXT_ENABLED ;
			context.ready = true ;
			context.series = true ;
		}
	}
	
	/*
	// From Node.js code: 'newListener' event
	// Before adding it to the listeners, first emit 'newListener', to avoid recursion
	// in the case that eventName === 'newListener'
	if ( this.__ngev.events.newListener.length )
	{
		this.emit( 'newListener' , eventName , listener ) ;
	}
	*/
	
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	this.__ngev.events[ eventName ].push( listener ) ;
	
	return this;
} ;



NextGenEvents.prototype.on = NextGenEvents.prototype.addListener ;



NextGenEvents.prototype.once = function once( eventName , options )
{
	if ( typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .addListener(): argument #0 should be a string" ) ; }
	
	if ( typeof options === 'function' )
	{
		options = { id: options , fn: options } ;
	}
	else if ( ! options || typeof options !== 'object' options.fn !== 'function' )
	{
		throw new TypeError( "[nextgen-events] .once(): argument #1 should be a function or an object with a 'fn' property which value is a function" ) ;
	}
	
	options.once = true ;
	
	return this.addListener( eventName , options ) ;
} ;



NextGenEvents.prototype.removeListener = function removeListener( eventName , id )
{
	var i , length , newListeners = [] , removedListeners = [] ;
	
	if ( typeof listener !== 'function' ) { throw new TypeError( '[nextgen-events] argument #1 should be a function' ) ; }
	
	if ( ! this.__ngev ) { init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	length = this.__ngev.events[ eventName ].length ;
	
	// It's probably faster to create a new array of listeners
	for ( i = 0 ; i < length ; i ++ )
	{
		if ( this.__ngev.events[ eventName ][ i ] !== listener )
		{
			newListeners.push( this.__ngev.events[ eventName ][ i ] ) ;
		}
		else
		{
			removedListeners.push( this.__ngev.events[ eventName ][ i ] ) ;
		}
	}
	
	if ( length !== newListeners.length && this.__ngev.events.removeListener.length )
	{
		this.emit( 'removeListener' , eventName , removedListeners ) ;
	}
	
	return this ;
} ;



NextGenEvents.prototype.off = NextGenEvents.prototype.removeListener ;



NextGenEvents.prototype.removeAllListeners = function removeAllListeners( eventName )
{
	var i , newListeners = [] , removedListeners = [] ;
	
	if ( typeof listener !== 'function' ) { throw new TypeError( '[nextgen-events] argument #1 should be a function' ) ; }
	
	if ( ! this.__ngev ) { init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	removedListener = this.__ngev.events[ eventName ] ;
	this.__ngev.events[ eventName ] = [] ;
	
	if ( length !== newListeners.length && this.__ngev.events.removeListener.length )
	{
		this.emit( 'removeListener' , eventName , removedListeners ) ;
	}
	
	return this ;
} ;



NextGenEvents.prototype.emit = function emit( eventName )
{
	var i , args , count = 0 ;
	
	if ( ! this.__ngev ) { init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	// Prepare arguments
	// /!\ done even if there is no listener ATM
	args = Array.prototype.slice.apply( arguments , 1 ) ;
	
	for ( i = 0 ; i < this.__ngev.events[ eventName ].length ; i ++ )
	{
		count ++ ;
		this.__ngev.events[ eventName ][ i ].apply( this , args ) ;
	}
	
	if ( ! count && eventName === 'error' )
	{
		// 'error' event is a special case: it should be listened for, or it will throw an error
		if ( arguments[ 1 ] ) { throw arguments[ 1 ] ; }
		else { throw Error( "[nextgen-events] Uncaught, unspecified 'error' event." ) ; }
	}
} ;



NextGenEvents.prototype.removeAllListeners =
    function removeAllListeners(type) {
  var key, listeners;

  if (!this.__ngev.events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this.__ngev.events.removeListener) {
    if (arguments.length === 0)
      this.__ngev.events = {};
    else if (this.__ngev.events[type])
      delete this.__ngev.events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this.__ngev.events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this.__ngev.events = {};
    return this;
  }

  listeners = this.__ngev.events[type];

  if (util.isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (Array.isArray(listeners)) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this.__ngev.events[type];

  return this;
};




// Should be implemented later
NextGenEvents.prototype.once = function() {} ;
NextGenEvents.prototype.listeners = function listeners(type) {} ;
NextGenEvents.listenerCount = function(emitter, type) {} ;



// Just for the node.js compatibility
NextGenEvents.prototype.addListener = NextGenEvents.prototype.on ;
NextGenEvents.prototype.removeListener = NextGenEvents.prototype.off ;

// There is no such thing in nextGen emit, however, we need to be compatible for drop-in replacement of node.js events
NextGenEvents.prototype.setMaxListeners = function() {} ;





