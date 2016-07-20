#!/usr/bin/env node

var NGEvents = require( '../lib/NextGenEvents.js' ) ;
var WebSocket = require( 'ws' ) ;
var ws = new WebSocket( 'ws://127.0.0.1:12345' ) ;

// Create a proxy
var proxy = new NGEvents.Proxy() ;

// Once the connection is established...
ws.on( 'open' , function open() {
	
	// Add the remote service we want to access
	proxy.addRemoteService( 'heartBeatService' ) ;
	
	// Listen to the event 'heartBeat' on this service
	proxy.remoteServices.heartBeatService.on( 'heartBeat' , function( beat ) {
		console.log( '>>> Heart Beat (%d) received!' , beat ) ;
	} ) ;
} ) ;

// message received: just hook to proxy.receive()
ws.on( 'message' , function( message ) {
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
