#!/usr/bin/env node



var NGEvents = require( '../lib/NextGenEvents.js' ) ;
var awesomeEmitter = new NGEvents() ;
var clockEmitter = new NGEvents() ;

// Emit one 'heartBeat' event per second
setInterval( function() { awesomeEmitter.emit( 'heartBeat' ) ; } , 1000 ) ;
setInterval( function() { clockEmitter.emit( 'time' , new Date() ) ; } , 5150 ) ;



var WebSocket = require( 'ws' ) ;

var server = new WebSocket.Server( { port: 12345 } ) ;
 
server.on( 'connection' , function connection( ws ) {
	
	// Create a proxy for this client
	var proxy = new NGEvents.Proxy() ;
	
	// Add the local service and provide all right to it to remote
	proxy.addLocalService( 'awesomeService' , awesomeEmitter , { listen: true , emit: true , ack: true } ) ;
	
	// Only provide 'listen' to this service
	proxy.addLocalService( 'clockService' , clockEmitter , { listen: true } ) ;
	
	ws.on( 'message' , function incoming( message ) {
		//proxy.receive( message ) ;
		
		try {
			message = JSON.parse( message ) ;
		}
		catch ( error ) {
			return ;
		}
		
		ws.emit( 'messageObject' , message ) ;
	} ) ;
	
	ws.on( 'messageObject' , function objectIncoming( message ) {
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
		console.log( 'client closed' ) ;
		proxy.destroy() ;
	} ) ;
	
} ) ;

