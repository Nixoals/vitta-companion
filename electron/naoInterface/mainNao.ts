const http = require('http');
const { Server } = require('socket.io');

// import { ipcMain } from 'electron';
// const RobotUtilsNao = require('./naoInterface/utils/robotutils.js')

import RobotUtilsNao from './utils/robotutils';

export default class MainNao {
	ipAdress: string;
	socket: any | null;
	robotUtilsNao: any;
	robotUtils: any
	ALTextToSpeech: any | null;
	ALAnimatedSpeech: any | null;
	ALRobotPosture: any | null;
	ALLeds: any | null;
	ALMotion: any | null;
	ALAutonomousLife: any | null;
	ALBehaviorManager: any | null;
	ALBattery: any | null;
	isNaoConnected: boolean;
	server: any;
	io: any;
	intervalJointsStates: any;
	intervalRobotPosition: any;

	constructor() {
		this.ipAdress = "";
		this.robotUtils = RobotUtilsNao;
		this.ALTextToSpeech = null;
		this.ALAnimatedSpeech = null;
		this.ALRobotPosture = null;
		this.ALLeds = null;
		this.ALMotion = null;
		this.ALAutonomousLife = null;
		this.ALBehaviorManager = null;
		this.ALBattery = null;
		this.isNaoConnected = false;
		this.intervalJointsStates = null;
		this.intervalRobotPosition = null;
		this.initServer();
	}

	initNaoConnection(clientIp: string) {
		console.log('init service');
		this.robotUtilsNao = new RobotUtilsNao()
		this.robotUtilsNao.onService(
			(ALLeds: any, ALTextToSpeech: any, ALAnimatedSpeech: any, ALRobotPosture: any, ALMotion: any, ALAutonomousLife: any, ALBehaviorManager: any, ALBattery: any) => {
				// retriev all APIs commands
				if (this.robotUtilsNao.session.socket().socket.connected) {
					
					this.isNaoConnected = true;
					this.checkNaoConnection();
					this.socket.emit('nao-connection-instanciated', this.isNaoConnected);
				}
				this.ALTextToSpeech = ALTextToSpeech;
				this.ALAnimatedSpeech = ALAnimatedSpeech;
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
			clientIp,
			
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
			const clientIp = socket.handshake.query.ip;
			if (this.isNaoConnected) {
				this.socket.emit('nao-connection-instanciated', this.isNaoConnected);
			} else {
				this.initNaoConnection(clientIp);
			}
			this.socket = socket;
			this.socket.emit('pending-nao-connection');
			// this.socket.emit('message', 'connected');
			

			this.socket.on('subscribe_joints_states', () => {
				console.log('subscribed to joints states');
				this.socket.emit('event', 'subscribed to joints states command');
				// this.subscribeJointsStates();
			});

			this.socket.on('say_text', (text: String) => {
				this.say(text);
			});

			this.socket.on('say_animated_text', (text: String) => {
				this.animatedSay(text);
			});

			this.socket.on('subscribe_robot_position', async () => {
				this.intervalRobotPosition = setInterval(async () => {
					const position = await await this.ALMotion.getRobotPosition(true);
					this.socket.emit('robot_position', position);
				}, 50);
			});

			this.socket.on('subscribe_single_joint_state', async () => {
				const jointAngles = await this.ALMotion.getAngles('Body', true);
				this.socket.emit('single_joint_state_value', jointAngles);
			});

			this.socket.on('subscribe_joints_states', async () => {
				this.socket.emit('event', 'subscribed to joints states command');
				this.intervalJointsStates = setInterval(async () => {
					const jointAngles = await this.ALMotion.getAngles('Body', true);
					this.socket.emit('joints_states', jointAngles);
				}, 50);
			});

			this.socket.on('disconnect', () => {
				console.log('disconnected from client');
				this.clearIntervals();
				// await this.disconnect();
			});

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
			this.led('AllLeds', 0.5, 0.5, 0, 3);
			this.animatedSay('connecté');
			await this.getBatteryLevel();
		}, 3000);
		return this.isNaoConnected;
	}

	led(led = 'AllLeds', r = 1, g = 0, b = 0, duration = 3) {
		this.ALLeds.fadeRGB(led, r, g, b, duration);
	}

	say(text: String) {
		this.ALTextToSpeech.say(text);
	}

	animatedSay(text: String) {
		this.ALAnimatedSpeech.say(text);
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

	async getRobotPosition(){
        try {
            const position = await this.ALMotion.getRobotPosition(true);
            // console.log(position);
            return position;
        } catch (error) {
            console.log(error);
        }
    }

	clearIntervals() {
		if (this.intervalJointsStates) {
			clearInterval(this.intervalJointsStates);
		}
		if (this.intervalRobotPosition) {
			clearInterval(this.intervalRobotPosition);
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
		// if (this.io) {
		// 	console.log('Stopping socket.io server...');
		// 	await this.io.httpServer.close();
		// 	await this.io.close();
		// }

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
