const http = require('http');
const { Server } = require('socket.io');

// import { ipcMain } from 'electron';
// const RobotUtilsNao = require('./naoInterface/utils/robotutils.js')

import RobotUtilsNao from './utils/robotutils';

export default class MainNao {
	ipAdress: string;
	socket: any | null;
	robotUtilsNao: any;
	ALTextToSpeech: any | null;
	ALRobotPosture: any | null;
	ALLeds: any | null;
	ALMotion: any | null;
	ALAutonomousLife: any | null;
	ALBehaviorManager: any | null;
	ALBattery: any | null;
	isNaoConnected: boolean;
	server: any;
	io: any;

	constructor(naoIpAdress: string) {
		this.ipAdress = naoIpAdress;
		this.robotUtilsNao = RobotUtilsNao;
		this.ALTextToSpeech = null;
		this.ALRobotPosture = null;
		this.ALLeds = null;
		this.ALMotion = null;
		this.ALAutonomousLife = null;
		this.ALBehaviorManager = null;
		this.ALBattery = null;
		this.isNaoConnected = false;
		this.init();
	}

	init() {
		console.log('init service');
		console.log(this.robotUtilsNao.session);
		this.robotUtilsNao.onService(
			(ALLeds: any, ALTextToSpeech: any, ALRobotPosture: any, ALMotion: any, ALAutonomousLife: any, ALBehaviorManager: any, ALBattery: any) => {
				// retriev all APIs commands
				if (this.robotUtilsNao.session.socket().socket.connected) {
					console.log('Nao is connected');
					this.isNaoConnected = true;
					this.initServer();
					this.checkNaoConnection();
				}
				this.ALTextToSpeech = ALTextToSpeech;
				this.ALRobotPosture = ALRobotPosture;
				this.ALLeds = ALLeds;
				this.ALMotion = ALMotion;
				this.ALAutonomousLife = ALAutonomousLife;
				this.ALBehaviorManager = ALBehaviorManager;
				this.ALBattery = ALBattery;
			},
			() => {
				console.log('an error occured can\'t connect to nao');
			},
			this.ipAdress,
			
		);
	}

	initServer() {
		console.log('init server');
		this.server = http.createServer();
		this.io = new Server(this.server, {
			cors: {
				origin: '*', // Remplacez par l'adresse de votre client
				methods: ['GET', 'POST'],
			},
		});

		this.io.on('connection', (socket: any) => {
			console.log('connected');
			this.socket = socket;
			this.socket.emit('message', 'connected');
			console.log('Nao is connected');
		});

		this.io.on('disconnect', () => {
			console.log('disconnected');
		});

		this.server.on('error', (error: any) => {
			if (error.message === 'EADDRINUSE') {
				console.log('Error: Address in use');
				setTimeout(() => {
					this.server.listen(8889);
				}, 1000);
			}
		});

		this.server.listen(8889, () => {
			console.log('Server running on port 8889');
		});
	}

	checkNaoConnection() {
		setTimeout(async () => {
			this.led('AllLeds', 0, 1, 1, 3);
			this.say('Je suis connecté');
			// await this.getBatteryLevel();
		}, 3000);
		return this.isNaoConnected;
	}

	led(led = 'AllLeds', r = 1, g = 0, b = 0, duration = 3) {
		this.ALLeds.fadeRGB(led, r, g, b, duration);
	}

	say(text: String) {
		this.ALTextToSpeech.say(text);
	}

	async getBatteryLevel() {
		try {
			const battery = await this.ALBattery.getBatteryCharge();
			this.say(`La batterie est à ${battery}%`);
			return battery;
		} catch (error) {
			console.log(error);
		}
	}

	async disconnect() {
		// Déconnecter Nao proprement
		if (this.isNaoConnected && this.robotUtilsNao.session && this.robotUtilsNao.session.socket()) {
			console.log('Disconnecting Nao...');
			// this.robotUtilsNao.session.socket().socket.options.reconnect = false;
			// this.robotUtilsNao.session.socket().removeAllListeners('connect');
			// this.robotUtilsNao.session.socket().removeAllListeners('disconnect');
			// this.robotUtilsNao.session.socket().removeAllListeners('reply');
			// this.robotUtilsNao.session.socket().removeAllListeners('error');
			// this.robotUtilsNao.session.socket().removeAllListeners('signal');
			await this.robotUtilsNao.session.disconnect()
			// console.log("is nao connected", this.robotUtilsNao.session.socket().socket.connected);
			this.isNaoConnected = false;
		}

		// Réinitialiser la session pour forcer une reconnexion complète
		this.robotUtilsNao.session = null;

		// Arrêter le serveur Socket.io
		if (this.io) {
			console.log('Stopping socket.io server...');
			await this.io.httpServer.close();
			await this.io.close();
		}

		// Arrêter le serveur HTTP
		// if (this.server) {
		// 	console.log('Stopping HTTP server...');
		// 	this.server.close(() => {
		// 		console.log('HTTP server closed');
		// 	});
		// 	this.server = null; // Réinitialiser pour éviter les références persistantes
		// }

		// Assurez-vous que les autres ressources sont bien libérées
		this.ALTextToSpeech = null;
		this.ALRobotPosture = null;
		this.ALLeds = null;
		this.ALMotion = null;
		this.ALAutonomousLife = null;
		this.ALBehaviorManager = null;
		this.ALBattery = null;

		console.log('Nao has been fully disconnected.');
	}
}
