#!/usr/bin/env node



var NGEvents = require( '../lib/NextGenEvents.js' ) ;
var emitter = new NGEvents() ;



var WebSocket = require( 'ws' ) ;

var ws = new WebSocket( 'ws://127.0.0.1:12345' ) ;

// Create a proxy for the server
var proxy = new NGEvents.Proxy() ;


ws.on( 'open' , function open() {
	// Add the remote service we want to access
	proxy.addRemoteService( 'awesomeService' ) ;
	
	// Listen to the event 'heartBeat' on this service
	proxy.remoteServices.awesomeService.on( 'heartBeat' , function() { console.log( '\n>>> Heart Beat received!\n' ) ; } )
	proxy.remoteServices.awesomeService.on( 'hello' , function( text ) { console.log( '\n>>> Hello received: %s\n' , text ) ; } )
	
	// Add the remote service we want to access
	proxy.addRemoteService( 'clockService' ) ;
	
	// Listen to the event 'heartBeat' on this service
	proxy.remoteServices.clockService.once( 'time' , function( time ) {
		console.log( '\n>>> Time received: %s\n' , time ) ;
		proxy.remoteServices.awesomeService.emit( 'hello' , 'Hello world!' ) ;
	} )
} ) ;

ws.on( 'message' , function( message ) {
	//proxy.receive( message ) ;

	try {
		message = JSON.parse( message ) ;
	}
	catch ( error ) {
		return ;
	}
	
	ws.emit( 'objectMessage' , message ) ;
} ) ;

ws.on( 'objectMessage' , function incoming( message ) {
	console.log( 'received: ' , message ) ;
	// Do something with message
	proxy.receive( message ) ;
} ) ;

proxy.receive = function receive( raw ) {
	proxy.push( raw ) ;
	//try { proxy.push( JSON.parse( raw ) ; } catch ( error ) {}
} ;

proxy.send = function send( message ) {
	ws.send( JSON.stringify( message ) ) ;
} ;

ws.on( 'close' , function close() {
	console.log( 'connection closed' ) ;
	proxy.destroy() ;
} ) ;
