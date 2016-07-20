#!/usr/bin/env node

var NGEvents = require( '../lib/NextGenEvents.js' ) ;

// Create our service/emitter
var heartBeatEmitter = new NGEvents() ;
var nextBeat = 1 ;

// Emit one 'heartBeat' event every few seconds
setInterval( function() {
	var beat = nextBeat ++ ;
	heartBeatEmitter.emit( 'heartBeat' , beat ) ;
} , 2000 ) ;

// Create our server
var WebSocket = require( 'ws' ) ;
var server = new WebSocket.Server( { port: 12345 } ) ;

// On new connection... 
server.on( 'connection' , function connection( ws ) {
	
	// Create a proxy for this client
	var proxy = new NGEvents.Proxy() ;
	
	// Add the local service exposed to this client and grant it all right
	proxy.addLocalService( 'heartBeatService' , heartBeatEmitter , { listen: true , emit: true , ack: true } ) ;
	
	// message received: just hook to proxy.receive()
	ws.on( 'message' , function incoming( message ) {
		proxy.receive( message ) ;
	} ) ;
	
	// Define the receive method: should call proxy.push() after decoding the raw message
	proxy.receive = function receive( raw ) {
		try { proxy.push( JSON.parse( raw ) ) ; } catch ( error ) {}
	} ;
	
	// Define the send method
	proxy.send = function send( message ) {
		ws.send( JSON.stringify( message ) ) ;
	} ;
	
	// Clean up after everything is done
	ws.on( 'close' , function close() {
		proxy.destroy() ;
	} ) ;
} ) ;

