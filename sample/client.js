#!/usr/bin/env node



var NGEvents = require( '../lib/NextGenEvents.js' ) ;
//var emitter = new NGEvents() ;



var WebSocket = require( 'ws' ) ;

var ws = new WebSocket( 'ws://127.0.0.1:12345' ) ;

// Create a proxy for the server
var proxy = new NGEvents.Proxy() ;


ws.on( 'open' , function open() {
	// Add the remote service we want to access
	proxy.addRemoteService( 'awesomeService' ) ;
	
	// Listen to the event 'heartBeat' on this service
	proxy.remoteServices.awesomeService.on( 'heartBeat' , function( beat ) { console.log( '\n>>> Heart Beat (%d) received! (sync listener)\n' , beat ) ; } ) ;
	
	proxy.remoteServices.awesomeService.on( 'heartBeat' , function( beat , callback ) {
		var timeout = Math.floor( Math.random() * 10000  ) ;
		
		console.log( '\n>>> Heart Beat (%d) received! (async listener: %dms)\n' , beat , timeout ) ;
		setTimeout( function() {
			console.log( '\n>>> Heart Beat (%d) finished! (async listener: %dms)\n' , beat , timeout ) ;
			callback() ;
		} , timeout ) ;
		
	} , { async: true } ) ;
	
	proxy.remoteServices.awesomeService.on( 'hello' , function( text , callback ) {
		var timeout = Math.floor( Math.random() * 10000  ) ;
		
		console.log( '\n>>> Hello received: %s (async listener: %dms)\n' , text , timeout ) ;
		setTimeout( function() {
			console.log( '\n>>> Hello (%s) finished! (async listener: %dms)\n' , text , timeout ) ;
			callback() ;
		} , timeout ) ;
		
	} , { async: true } ) ;
	
	// Add the remote service we want to access
	proxy.addRemoteService( 'clockService' ) ;
	
	// Listen to the event 'heartBeat' on this service
	proxy.remoteServices.clockService.once( 'time' , function( time ) {
		console.log( '\n>>> Time received: %s\n' , time ) ;
		proxy.remoteServices.awesomeService.emit( 'hello' , 'Hello world!' , function() {
			console.log( '\n\n\n\t\t\t>>> hello callback! <<<\n\n\n' ) ;
		} ) ;
	} ) ;
} ) ;

ws.on( 'message' , function( message ) {
	//proxy.receive( message ) ;

	try {
		message = JSON.parse( message ) ;
	}
	catch ( error ) {
		return ;
	}
	
	ws.emit( 'messageObject' , message ) ;
} ) ;

ws.on( 'messageObject' , function incoming( message ) {
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
