/*
	Next Gen Events
	
	Copyright (c) 2015 - 2016 Cédric Ronvel
	
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



// Create the object && export it
function Proxy() { return Proxy.create() ; }
module.exports = Proxy ;

var NextGenEvents = require( './NextGenEvents.js' ) ;
var MESSAGE_TYPE = 'NextGenEvents/message' ;

function noop() {}



Proxy.create = function create()
{
	var self = Object.create( Proxy.prototype , {
		localServices: { value: {} , enumerable: true } ,
		remoteServices: { value: {} , enumerable: true } ,
		ackId: { value: 1 , writable: true , enumerable: true } ,
	} ) ;
	
	return self ;
} ;



// Add a local service accessible remotely
Proxy.prototype.addLocalService = function addLocalService( id , emitter , options )
{
	this.localServices[ id ] = LocalService.create( this , id , emitter , options ) ;
	return this.localServices[ id ] ;
} ;



// Add a remote service accessible locally
Proxy.prototype.addRemoteService = function addRemoteService( id )
{
	this.remoteServices[ id ] = RemoteService.create( this , id ) ;
	return this.remoteServices[ id ] ;
} ;



// Destroy the proxy
Proxy.prototype.destroy = function destroy()
{
	var self = this ;
	
	Object.keys( this.localServices ).forEach( function( id ) {
		self.localServices[ id ].destroy() ;
		delete self.localServices[ id ] ;
	} ) ;
	
	Object.keys( this.remoteServices ).forEach( function( id ) {
		self.remoteServices[ id ].destroy() ;
		delete self.remoteServices[ id ] ;
	} ) ;
	
	this.receive = this.send = noop ;
} ;



// Push an event message.
Proxy.prototype.push = function push( message )
{
	if (
		message.type !== MESSAGE_TYPE ||
		! message.service || typeof message.service !== 'string' ||
		! message.event || typeof message.event !== 'string' ||
		! message.method
	)
	{
		return ;
	}
	
	switch ( message.method )
	{
		// Those methods target a remote service
		case 'event' :
			return this.remoteServices[ message.service ] && this.remoteServices[ message.service ].event( message ) ;
		
		// Those methods target a local service
		case 'emit' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].emit( message ) ;
		case 'listen' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].listen( message ) ;
		case 'ignore' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].ignore( message ) ;
			
		case 'ackEvent' :
			return this.localServices[ message.service ] && this.localServices[ message.service ].ackEvent( message ) ;
			
		default:
		 	return ;
	}
} ;



// This is the method to receive and decode data from the other side of the communication channel, most of time another proxy.
// In most case, this should be overwritten.
Proxy.prototype.receive = function receive( raw )
{
	this.push( raw ) ;
} ;



// This is the method used to send data to the other side of the communication channel, most of time another proxy.
// This MUST be overwritten in any case.
Proxy.prototype.send = function send()
{
	throw new Error( 'The send() method of the Proxy MUST be extended/overwritten' ) ;
} ;



			/* Local Service */



function LocalService( proxy , id , emitter , options ) { return LocalService.create( proxy , id , emitter , options ) ; }
Proxy.LocalService = LocalService ;



LocalService.create = function create( proxy , id , emitter , options )
{
	var self = Object.create( LocalService.prototype , {
		proxy: { value: proxy , enumerable: true } ,
		id: { value: id , enumerable: true } ,
		emitter: { value: emitter , writable: true , enumerable: true } ,
		internalEvents: { value: Object.create( NextGenEvents.prototype ) , writable: true , enumerable: true } ,
		events: { value: {} , enumerable: true } ,
		ackEvents: { value: {} , enumerable: true } ,
		canListen: { value: !! options.listen , writable: true , enumerable: true } ,
		canEmit: { value: !! options.emit , writable: true , enumerable: true } ,
		canAck: { value: !! options.ack , writable: true , enumerable: true } ,
		canRpc: { value: !! options.rpc , writable: true , enumerable: true } ,
		destroyed: { value: false , writable: true , enumerable: true } ,
	} ) ;
	
	return self ;
} ;



// Destroy a service
LocalService.prototype.destroy = function destroy()
{
	var self = this ;
	
	Object.keys( this.events ).forEach( function( eventName ) {
		self.emitter.off( eventName , self.events[ eventName ] ) ;
		delete self.events[ eventName ] ;
	} ) ;
	
	Object.keys( this.ackEvents ).forEach( function( eventName ) {
		self.emitter.off( eventName , self.ackEvents[ eventName ] ) ;
		delete self.ackEvents[ eventName ] ;
	} ) ;
	
	this.emitter = null ;
	this.destroyed = true ;
} ;



// Remote want to emit on the local service
LocalService.prototype.emit = function emit( message )
{
	if ( this.destroyed || ! this.canEmit ) { return ; }
	
	var event = {
		emitter: this.emitter ,
		name: message.event ,
		args: message.args || [] 
	} ;
	
	NextGenEvents.emitEvent( event ) ;
} ;



// Remote want to listen to an event of the local service
LocalService.prototype.listen = function listen( message )
{
	if ( this.destroyed || ! this.canListen ) { return ; }
	
	if ( message.ack )
	{
		if ( ! this.canAck || this.ackEvents[ message.event ] ) { return ; }
		
		this.ackEvents[ message.event ] = LocalService.forwardWithAck.bind( this , message.event ) ;
		this.emitter.on( message.event , this.ackEvents[ message.event ] , { async: true } ) ;
	}
	else
	{
		if ( this.events[ message.event ] ) { return ; }
		
		this.events[ message.event ] = LocalService.forward.bind( this , message.event ) ;
		this.emitter.on( message.event , this.events[ message.event ] ) ;
	}
} ;



// Remote do not want to listen to that event of the local service anymore
LocalService.prototype.ignore = function ignore( message )
{
	if ( this.destroyed || ! this.canListen ) { return ; }
	
	if ( message.ack )
	{
		if ( ! this.canAck || this.ackEvents[ message.event ] ) { return ; }
		
		this.emitter.off( message.event , this.ackEvents[ message.event ] ) ;
		this.ackEvents[ message.event ] = null ;
	}
	else
	{
		if ( ! this.events[ message.event ] ) { return ; }
		
		this.emitter.off( message.event , this.events[ message.event ] ) ;
		this.events[ message.event ] = null ;
	}
} ;



// 
LocalService.prototype.ackEvent = function ackEvent( message )
{
	if ( this.destroyed || ! this.canListen || ! this.canAck || ! this.ackEvents[ message.event ] || ! message.ack ) { return ; }
	
	this.internalEvents.emit( 'ack' , message ) ;
} ;



// Send an event from the local service to remote
LocalService.forward = function forward( event )
{
	if ( this.destroyed ) { return ; }
	
	this.proxy.send( {
		type: MESSAGE_TYPE ,
		service: this.id ,
		method: 'event' ,
		event: event ,
		args: Array.prototype.slice.call( arguments , 1 )
	} ) ;
} ;



// Send an event from the local service to remote, with ACK
LocalService.forwardWithAck = function forwardWithAck( event )
{
	var self = this ;
	
	if ( this.destroyed ) { return ; }
	
	var callback = arguments[ arguments.length - 1 ] ;
	var triggered = false ;
	var ackId = this.proxy.ackId ++ ;
	
	var onAck = function onAck( message ) {
		if ( triggered || message.ack !== ackId ) { return ; }	// Not our ack...
		//if ( message.event !== event ) { return ; }	// Do we care?
		triggered = true ;
		self.internalEvents.off( 'ack' , onAck ) ;
		callback() ;
	} ;
	
	this.internalEvents.on( 'ack' , onAck ) ;
	
	this.proxy.send( {
		type: MESSAGE_TYPE ,
		service: this.id ,
		method: 'event' ,
		event: event ,
		ack: ackId ++ ,
		args: Array.prototype.slice.call( arguments , 1 , -1 )	// Remove the last argument: this is our callback!
	} ) ;
} ;



			/* Remote Service */



function RemoteService( proxy , id ) { return RemoteService.create( proxy , id ) ; }
//RemoteService.prototype = Object.create( NextGenEvents.prototype ) ;
//RemoteService.prototype.constructor = RemoteService ;
Proxy.RemoteService = RemoteService ;



RemoteService.create = function create( proxy , id )
{
	var self = Object.create( RemoteService.prototype , {
		proxy: { value: proxy , enumerable: true } ,
		id: { value: id , enumerable: true } ,
		// This is the emitter where everything is routed to
		emitter: { value: Object.create( NextGenEvents.prototype ) , writable: true , enumerable: true } ,
		events: { value: {} , enumerable: true } ,
		destroyed: { value: false , writable: true , enumerable: true } ,
		
		/*	Useless for instance, unless some kind of handshake can discover service capabilities
		canListen: { value: !! options.listen , writable: true , enumerable: true } ,
		canEmit: { value: !! options.emit , writable: true , enumerable: true } ,
		canAck: { value: !! options.ack , writable: true , enumerable: true } ,
		canRpc: { value: !! options.rpc , writable: true , enumerable: true } ,
		*/
	} ) ;
	
	return self ;
} ;



// Destroy a service
RemoteService.prototype.destroy = function destroy()
{
	var self = this ;
	this.emitter.removeAllListeners() ;
	this.emitter = null ;
	Object.keys( this.events ).forEach( function( eventName ) { delete self.events[ eventName ] ; } ) ;
	this.destroyed = true ;
} ;



// Local code want to emit to remote service
RemoteService.prototype.emit = function emit( eventName )
{
	if ( this.destroyed ) { return ; }
	
	this.proxy.send( {
		type: MESSAGE_TYPE ,
		service: this.id ,
		method: 'emit' ,
		event: eventName ,
		args: Array.prototype.slice.call( arguments , 1 )
	} ) ;
} ;



// Local code want to listen to an event of remote service
RemoteService.prototype.addListener = function addListener( eventName , fn , options )
{
	if ( this.destroyed ) { return ; }
	
	// Manage arguments the same way NextGenEvents#addListener() does
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	options.fn = fn || options.fn ;
	
	this.emitter.addListener( eventName , options ) ;
	
	// If the event is successfully listened to and was not remotely listened...
	if ( options.async )
	{
		if ( ! this.ackEvents[ eventName ] && this.emitter.__ngev.events[ eventName ] && this.emitter.__ngev.events[ eventName ].length )
		{
			this.ackEvents[ eventName ] = true ;
			
			this.proxy.send( {
				type: MESSAGE_TYPE ,
				service: this.id ,
				method: 'listen' ,
				ack: true ,
				event: eventName
			} ) ;
		}
	}
	else
	{
		if ( ! this.events[ eventName ] && this.emitter.__ngev.events[ eventName ] && this.emitter.__ngev.events[ eventName ].length )
		{
			this.events[ eventName ] = true ;
			
			this.proxy.send( {
				type: MESSAGE_TYPE ,
				service: this.id ,
				method: 'listen' ,
				event: eventName
			} ) ;
		}
	}
} ;

RemoteService.prototype.on = RemoteService.prototype.addListener ;

// This is a shortcut to this.addListener()
RemoteService.prototype.once = NextGenEvents.prototype.once ;



// Local code want to ignore an event of remote service
RemoteService.prototype.removeListener = function removeListener( eventName , id )
{
	if ( this.destroyed ) { return ; }
	
	this.emitter.removeListener( eventName , id ) ;
	
	// If no more listener are locally tied to with event and the event was remotely listened...
	if ( ! this.emitter.__ngev.events[ eventName ] || ! this.emitter.__ngev.events[ eventName ].length )
	{
		if ( this.events[ eventName ] )
		{
			this.events[ eventName ] = false ;
			
			this.proxy.send( {
				type: MESSAGE_TYPE ,
				service: this.id ,
				method: 'ignore' ,
				event: eventName
			} ) ;
		}
		
		if ( this.ackEvents[ eventName ] )
		{
			this.ackEvents[ eventName ] = false ;
			
			this.proxy.send( {
				type: MESSAGE_TYPE ,
				service: this.id ,
				method: 'ignore' ,
				ack: true ,
				event: eventName
			} ) ;
		}
	}
} ;

RemoteService.prototype.off = RemoteService.prototype.removeListener ;



// A remote service sent an event we are listening to, emit on the service representing the remote
RemoteService.prototype.event = function event( message )
{
	if ( this.destroyed || ! this.events[ message.event ] ) { return ; }
	
	var self = this ;
	
	var event = {
		emitter: this.emitter ,
		name: message.event ,
		args: message.args || [] 
	} ;
	
	if ( message.ack )
	{
		event.callback = function ack() {
			self.proxy.send( {
				type: MESSAGE_TYPE ,
				service: self.id ,
				method: 'ignore' ,
				ack: message.ack ,
				event: eventName
			} ) ;
		} ;
	}
	
	NextGenEvents.emitEvent( event ) ;
	
	var eventName = event.name ;
	
	// Here we should catch if the event is still listened to ('once' type listeners)
	if ( ! this.emitter.__ngev.events[ eventName ] || ! this.emitter.__ngev.events[ eventName ].length )
	{
		if ( this.events[ eventName ] )
		{
			this.events[ eventName ] = false ;
			
			this.proxy.send( {
				type: MESSAGE_TYPE ,
				service: this.id ,
				method: 'ignore' ,
				event: eventName
			} ) ;
		}
		
		if ( this.ackEvents[ eventName ] )
		{
			this.ackEvents[ eventName ] = false ;
			
			this.proxy.send( {
				type: MESSAGE_TYPE ,
				service: this.id ,
				method: 'ignore' ,
				ack: true ,
				event: eventName
			} ) ;
		}
	}
	
} ;

