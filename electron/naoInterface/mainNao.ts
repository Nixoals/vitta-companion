const http = require('http');
const { Server } = require('socket.io');
const { NodeSSH } = require('node-ssh');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
import { ipcMain } from 'electron';

// const RobotUtilsNao = require('./naoInterface/utils/robotutils.js')

import RobotUtilsNao from './utils/robotutils';

export default class MainNao {
	ipAdress: string;
	socket: any | null;
	robotUtilsNao: any;
	robotUtils: any;
	ALTextToSpeech: any | null;
	ALAnimatedSpeech: any | null;
	ALRobotPosture: any | null;
	ALLeds: any | null;
	ALMotion: any | null;
	ALAutonomousLife: any | null;
	ALBehaviorManager: any | null;
	ALBattery: any | null;
	ALVideoDevice: any | null;
	ALMemory: any | null;
	cameraClient: any;
	isNaoConnected: boolean;
	programRunning: boolean;
	server: any;
	io: any;
	intervalJointsStates: any;
	intervalRobotPosition: any;
	intervalCOM: any;
	intervalSupportPolygon: any;
	cameraInterval: any;
	currentAction: any;
	sshConnexion: any;
	status: boolean;
	isVittaConnected: boolean;
	isNaoQiConnected: boolean;
	window: any;

	constructor(win: any) {
		this.window = win;
		this.ipAdress = '';
		this.robotUtils = RobotUtilsNao;
		this.ALTextToSpeech = null;
		this.ALAnimatedSpeech = null;
		this.ALRobotPosture = null;
		this.ALLeds = null;
		this.ALMotion = null;
		this.ALAutonomousLife = null;
		this.ALBehaviorManager = null;
		this.ALBattery = null;
		this.ALVideoDevice = null;
		this.ALMemory = null;
		this.cameraClient = null;
		this.isNaoConnected = false;
		this.intervalJointsStates = null;
		this.intervalRobotPosition = null;
		this.intervalCOM = null;
		this.intervalSupportPolygon = null;
		this.cameraInterval = null;
		this.currentAction = null;
		this.programRunning = false;
		this.sshConnexion = null;
		this.status = false;
		this.isVittaConnected = false;
		this.isNaoQiConnected = false;
		this.io = null;
		this.initServer();
		this.initIpc();
	}

	initNaoConnection(clientIp: string) {
		this.robotUtilsNao = new RobotUtilsNao();
		console.log('robotUtilsNao', this.robotUtilsNao);
		this.robotUtilsNao.onService(
			(ALLeds: any, ALTextToSpeech: any, ALAnimatedSpeech: any, ALRobotPosture: any, ALMotion: any, ALAutonomousLife: any, ALBehaviorManager: any, ALBattery: any, ALVideoDevice: any, ALMemory: any) => {
				// retriev all APIs commands

				this.ALTextToSpeech = ALTextToSpeech;
				this.ALAnimatedSpeech = ALAnimatedSpeech;
				this.ALRobotPosture = ALRobotPosture;
				this.ALLeds = ALLeds;
				this.ALMotion = ALMotion;
				this.ALAutonomousLife = ALAutonomousLife;
				this.ALBehaviorManager = ALBehaviorManager;
				this.ALBattery = ALBattery;
				this.ALVideoDevice = ALVideoDevice;
				this.ALMemory = ALMemory;

				this.subscribeToALMemoryEvent();

				if (this.robotUtilsNao.session.socket().socket.connected) {
					this.isNaoConnected = true;
					this.checkNaoConnection();
					try {
						this.socket.emit('nao-connection-instanciated', this.isNaoConnected);
						this.updateConnectionStatus();
					} catch (error) {
						console.error('Error checking wake up status:', error);
					}
				}
			},
			() => {
				console.log("an error occured can't connect to nao");
			},
			clientIp
		);
	}

	initServer() {
		this.isVittaConnected = false;
		this.isNaoConnected = false;
		this.updateConnectionStatus();
		this.server = http.createServer();
		this.io = new Server(this.server, {
			cors: {
				origin: '*',
				methods: ['GET', 'POST'],
			},
		});

		this.io.on('connection', (socket: any) => {
			this.isVittaConnected = true;
			this.updateConnectionStatus();
			const clientIp = socket.handshake.query.ip;
			this.ipAdress = clientIp;
			if (this.isNaoConnected) {
				this.checkNaoWakeStatus();
				this.socket = socket;
				this.socket.emit('pending-nao-connection');
				setTimeout(() => {
					try {
						this.socket.emit('nao-connection-instanciated', this.isNaoConnected);
					} catch (error) {
						console.error('Error emitting nao-connection-instanciated:', error);
					}
				}, 1000);
			} else {
				this.initNaoConnection(clientIp);
				this.socket = socket;
				this.socket.emit('pending-nao-connection');
			}

			this.socket.on('say_animated_text', async (text: String) => {
				this.currentAction = `animatedSay: ${text}`;
				this.ALAnimatedSpeech.say(text).then(() => {
					this.currentAction = null;
					this.socket.emit('action_completed', 'animatedSay');
				});
			});

			this.socket.on('subscribe_robot_position', async () => {
				this.intervalRobotPosition = setInterval(async () => {
					if (this.isNaoConnected) {
						try {
							const position = await this.ALMotion.getRobotPosition(true);
							if (this.socket !== null && typeof this.socket.emit === 'function') {
								this.socket.emit('robot_position', position);
							} else {
								clearInterval(this.intervalRobotPosition);
								this.intervalRobotPosition = null;
							}
						} catch (error) {
							console.error('Error fetching robot position:', error);
						}
					}
				}, 50);
			});

			this.socket.on('say_text', (text: string, callback: any) => {
				this.ALAnimatedSpeech.say(text).then(() => {
					this.currentAction = null;
					callback('action_done');
				});
			});

			// this.socket.on('subscribe_single_joint_state', async () => {
			// 	const jointAngles = await this.ALMotion.getAngles('Body', true);
			// 	this.socket.emit('single_joint_state_value', jointAngles);
			// });

			this.socket.on('subscribe_joints_states', async () => {
				this.socket.emit('event', 'subscribed to joints states command');
				this.intervalJointsStates = setInterval(async () => {
					if (this.isNaoConnected) {
						try {
							const jointAngles = await this.ALMotion.getAngles('Body', true);
							if (this.socket !== null && typeof this.socket.emit === 'function') {
								this.socket.emit('joints_states', jointAngles);
							} else {
								clearInterval(this.intervalJointsStates);
								this.intervalJointsStates = null;
							}
						} catch (error) {
							console.error('Error fetching joints states:', error);
						}
					}
				}, 50);
			});

			this.socket.on('get_com', async () => {
				this.socket.emit('event', 'subscribed to com command');
				this.intervalCOM = setInterval(async () => {
					try {
						const com = await this.ALMotion.getCOM('Body', 0, true);
						if (this.socket !== null) {
							this.socket.emit('com_value', com);
						} else {
							clearInterval(this.intervalCOM);
							this.intervalCOM = null;
						}
					} catch (error) {
						console.error('Error fetching COM:', error);
					}
				}, 200);
				// const com = await this.ALMotion.getCOM('Body', 1, true);
				// this.socket.emit('com_value', com);
			});

			this.socket.on('get_support_polygon', async () => {
				this.socket.emit('event', 'subscribed to support polygon command');
				this.intervalSupportPolygon = setInterval(async () => {
					try {
						const supportPolygon = await this.ALMotion.getSupportPolygon(1, true);
						if (this.socket !== null) {
							this.socket.emit('support_polygon_value', supportPolygon);
						} else {
							clearInterval(this.intervalSupportPolygon);
							this.intervalSupportPolygon = null;
						}
					} catch (error) {
						console.error('Error fetching support polygon:', error);
					}
				}, 200);
				// const supportPolygon = await this.ALMotion.getSupportPolygon(1, true);
				// this.socket.emit('support_polygon_value', supportPolygon);
			});

			this.socket.on('start_streaming', async () => {
				this.startCameraStreaming();
			});

			this.socket.on('stop_streaming', async () => {
				this.unsubscribeCamera();
			});

			this.socket.on('retrieve_behavior_running', async () => {
				try {
					const behavior = await this.ALBehaviorManager.getRunningBehaviors();
					if (this.socket !== null && behavior) {
						this.socket.emit('behavior_running', behavior);
					}
				} catch (error) {
					console.error('Error fetching behavior running:', error);
				}
			});

			this.socket.on('exec_command', (code: string, callback: any) => {
				if (typeof callback !== 'function') {
					console.error('Callback not provided or invalid');
					return;
				}

				this.sendSSHCommand(code)
					.then(() => {
						callback('action_done');
					})
					.catch((err) => {
						console.error('Error executing SSH command:', err);
						callback('action_failed');
					});
			});

			this.socket.on('kill_program', () => {
				this.killProgram();
			});

			this.socket.on('rest_command', async () => {
				if (this.ALMotion && !this.programRunning) {
					try {
						await this.ALMotion.rest();
						if (this.socket !== null) {
							this.socket.emit('action_completed', 'rest');
						}
					} catch (error) {
						console.error('Error resting Nao:', error);
					}
				}
			});

			this.socket.on('disconnect', () => {
				console.log('disconnected from client');
				this.isVittaConnected = false;
				this.updateConnectionStatus();
				this.clearIntervals();
				if (this.socket !== null) {
					// this.isNaoConnected = false;
					this.socket = null;
				}
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
	initIpc() {
		ipcMain.removeHandler('getCodeRunningStatus'); // Supprime le handler s'il existe
		ipcMain.handle('getCodeRunningStatus', () => {
			return this.status;
		});

		ipcMain.removeHandler('getConnectStatus'); // Supprime le handler s'il existe
		ipcMain.handle('getConnectStatus', () => {
			return { isNaoQiConnected: this.isNaoQiConnected, isVittaConnected: this.isVittaConnected };
		});
	}

	updateConnectionStatus() {
		if (this.window !== null) {
			console.log('Updating connection status');
			this.window.webContents.send('connectStatusUpdated', { isNaoQiConnected: this.isNaoConnected, isVittaConnected: this.isVittaConnected });
		}
	}

	updateCodeRunningStatus() {
		if (this.window !== null) {
			this.window.webContents.send('codeRunningStatusUpdated', this.status);
		}
	}

	async checkNaoWakeStatus() {
		try {
			const status = await this.ALMotion.robotIsWakeUp();
			if (status) {
				this.socket.emit('wake_up_status', status);
			}
		} catch (error) {
			console.error('Error checking wake up status:', error);
		}
	}

	async subscribeToALMemoryEvent() {
		if (!this.ALMemory) {
			console.error('ALMemory service is not available');
			return;
		}

		if (this.socket === null) {
			console.error('Client disconnected, stopping ALMemory event subscription');
			return;
		}

		this.robotUtilsNao.subscribeToALMemoryEvent(
			this.ALMemory,
			'ALTextToSpeech/CurrentSentence',
			(data: any) => {
				try {
					if (this.socket !== null) {
						this.socket.emit('current_sentence', data);
					}
				} catch (error) {
					console.error('Error subscribing to ALTextToSpeech/CurrentSentence:', error);
				}
			},
			() => {
				// console.log('subscribed successfully to ALTextToSpeech/CurrentSentence');
			}
		);

		this.robotUtilsNao.subscribeToALMemoryEvent(
			this.ALMemory,
			'robotIsWakeUp',
			(data: any) => {
				try {
					if (this.socket !== null) {
						this.socket.emit('wake_up_status', data);
					}
				} catch (error) {
					console.error('Error subscribing to robotIsWakeUp:', error);
				}
			},
			() => {
				// console.log('subscribed successfully to robotIsWakeUp');
			},
			() => {
				console.error('Error subscribing to robotIsWakeUp');
			}
		);
	}

	async subscribeToCamera() {
		try {
			if (!this.ALVideoDevice) {
				console.error('ALVideoDevice service is not available');
				return null;
			}

			const resolution = 0; // 320x240
			const colorSpace = 11; // RGB => send back a base 64 encoded image
			const fps = 10;

			this.cameraClient = await this.ALVideoDevice.subscribeCamera(
				'cameraClient',
				0, // Front top camera
				resolution,
				colorSpace,
				fps
			);
			return true;
		} catch (error) {
			console.error('Error subscribing to camera:', error);
			return false;
		}
	}

	async captureImage() {
		try {
			if (!this.ALVideoDevice || !this.cameraClient) {
				console.error('Camera is not subscribed');
				return null;
			}

			const image = await this.ALVideoDevice.getImageRemote(this.cameraClient);
			if (!image) {
				console.error('Failed to capture image');
				return null;
			}

			const [, , , , , , /*width */ /*height*/ /* layers */ /* colorSpace */ /* timestamp_s */ /* timestamp_us */ data] = image;

			return data;
		} catch (error) {
			console.error('Error capturing image:', error);
			return null;
		}
	}

	async startCameraStreaming() {
		if (!this.ALVideoDevice) {
			console.error('ALVideoDevice service is not available');
			return;
		}

		if (this.cameraClient) {
			// console.log('Camera streaming already active');
			return;
		}

		const subscribed = await this.subscribeToCamera().catch((error) => {
			console.error('Error during camera subscription:', error);
			return false;
		});
		if (!subscribed) return;

		this.cameraInterval = setInterval(async () => {
			try {
				const image = await this.captureImage();
				if (image) {
					if (!this.socket) {
						console.error('Client disconnected, stopping camera streaming');
						this.unsubscribeCamera();
						return;
					} else {
						// console.log('Sending camera frame');
						this.socket.emit('camera_frame', image); // Envoie l'image au client
					}
				}
			} catch (error) {
				console.error('Error during image capture or emission:', error);
			}
		}, 500); // Envoi toutes les 100ms (10 FPS)
	}

	unsubscribeCamera() {
		if (this.cameraInterval) {
			clearInterval(this.cameraInterval);
			this.cameraInterval = null;
		}
		if (this.cameraClient) {
			this.ALVideoDevice.unsubscribe(this.cameraClient);
			this.cameraClient = null;
		}
	}

	async clearCameraSubscribers(cameras: Array<string>) {
		for (const camera of cameras) {
			if (camera.match(/cameraClient_/)) {
				await this.ALVideoDevice.unsubscribe(camera);
			}
		}
	}

	async checkNaoConnection() {
		if (this.ALVideoDevice) {
			const cameraSubscribers = await this.ALVideoDevice.getSubscribers();
			if (cameraSubscribers.length > 0) {
				this.clearCameraSubscribers(cameraSubscribers);
			}
		}
		setTimeout(async () => {
			this.checkNaoWakeStatus();
			this.led('AllLeds', 0.5, 0.5, 0.5, 3);
			this.say('connecté');
			await this.getBatteryLevel();
			const state = await this.getAutonomousState();
			if (state !== 'disabled') {
				this.setAutonomousOff();
			}
		}, 3000);
		return this.isNaoConnected;
	}

	async getAutonomousState() {
		const state = await this.ALAutonomousLife.getState();
		return state;
	}

	setAutonomousOff() {
		this.ALAutonomousLife.setState('disabled').then(() => {
			console.log('Autonomous life disabled');
		});
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
		return new Promise(async (resolve, reject) => {
			try {
				const battery = await this.ALBattery.getBatteryCharge();
				this.ALTextToSpeech.say(`La batterie est à ${battery}%`).then(() => {
					return resolve(battery);
				});
			} catch (error) {
				console.log(error);
				reject(error);
			}
		});
	}

	async getRobotPosition() {
		try {
			const position = await this.ALMotion.getRobotPosition(true);
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
		if (this.intervalCOM) {
			clearInterval(this.intervalCOM);
		}
		if (this.intervalSupportPolygon) {
			clearInterval(this.intervalSupportPolygon);
		}
		if (this.cameraInterval) {
			this.unsubscribeCamera();
		}
	}

	async sendSSHCommand(code: string) {
		if (this.programRunning) {
			console.log('A program is already running');
			return;
		}
		this.sshConnexion = new NodeSSH({ debug: console.log });
		try {
			const tempFilePath = path.join(os.tmpdir(), 'nao_temp_code.py');
			fs.writeFileSync(tempFilePath, code);
			console.log('Connecting to:', this.ipAdress, 'with username:', 'nao');
			this.status = true;
			this.updateCodeRunningStatus();
			await this.sshConnexion.connect({
				host: this.ipAdress,
				username: 'nao',
				password: 'nao',
				tryKeyboard: true,
				port: 22,
			});

			await this.sshConnexion.putFile(tempFilePath, '/home/nao/nao_temp_code.py');

			console.log('Connected to Nao via SSH');
			this.programRunning = true;
			this.socket.emit('event', 'program_running');

			const result = await this.sshConnexion.execCommand('PYTHONPATH=/opt/aldebaran/lib/python2.7/site-packages python /home/nao/nao_temp_code.py');
			console.log('STDOUT: ' + result.stdout);

			console.log('STDERR: ' + result.stderr);
			if (result.stderr) {
				this.socket.emit('error', result.stderr);
			}
			const suppressFile = await this.sshConnexion.execCommand('rm /home/nao/nao_temp_code.py');
			console.log('STDOUT: ' + suppressFile.stdout);
			console.log('STDERR: ' + suppressFile.stderr);
			await this.sshConnexion.dispose();
			this.socket.emit('event', 'program_ended');
			this.programRunning = false;
			this.sshConnexion = null;
			this.status = false;
			this.updateCodeRunningStatus();
			console.log('ssh connexion disposed', this.sshConnexion);
		} catch (error) {
			console.log(error);
		}
	}

	async killProgram() {
		if (!this.programRunning) {
			console.log('No program is currently running');
			return;
		}

		if (!this.sshConnexion) {
			console.log('No SSH connexion available');
		}
		try {
			const checkResult = await this.sshConnexion.execCommand('ps -ef | grep "nao_temp_code.py" | grep -v grep');
			if (!checkResult.stdout) {
				console.log('No program is currently running');
				return;
			}
			this.socket.emit('event', 'Kill_command_sent');
			const killResult = await this.sshConnexion.execCommand('pkill -f "/home/nao/nao_temp_code.py"');
			console.log('STDERR kill: ' + killResult.stderr);
			if (killResult.stderr) {
				this.socket.emit('error', killResult.stderr);
			}
		} catch (error) {
			console.log(error);
		}
	}

	async disconnect() {
		this.clearIntervals();

		if (this.isNaoConnected) {
			try {
				await this.robotUtilsNao.session.disconnect();
			} catch (error) {
				console.error('Error disconnecting Nao:', error);
			}
		}

		this.isNaoConnected = false;
		this.ALTextToSpeech = null;
		this.ALRobotPosture = null;
		this.ALLeds = null;
		this.ALMotion = null;
		this.ALAutonomousLife = null;
		this.ALBehaviorManager = null;
		this.ALBattery = null;

		this.robotUtilsNao = null;

		console.log('Nao has been fully disconnected.');

		ipcMain.removeHandler('getCodeRunningStatus');
		ipcMain.removeHandler('getConnectStatus');

		if (this.io) {
			try {
				await this.io.httpServer.close();
				await this.io.close();
				this.io = null;
				this.server = null;
			} catch (error) {
				console.error('Error stopping socket.io server:', error);
			}
		}
	}
}
