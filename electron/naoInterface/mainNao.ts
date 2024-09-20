const http = require('http');
const { Server } = require('socket.io');

// import { ipcMain } from 'electron';
// const RobotUtilsNao = require('./naoInterface/utils/robotutils.js')


import  RobotUtilsNao  from './utils/robotutils';


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
            this.robotUtilsNao.onService((ALLeds:any, ALTextToSpeech:any, ALRobotPosture:any, ALMotion:any, ALAutonomousLife:any, ALBehaviorManager:any, ALBattery:any) => {
                // retriev all APIs commands
                if (this.robotUtilsNao.session.socket().socket.connected) {
                    console.log("Nao is connected");
                    this.isNaoConnected = true;
                    this.initServer();
                }
                this.ALTextToSpeech = ALTextToSpeech;
                this.ALRobotPosture = ALRobotPosture;
                this.ALLeds = ALLeds;
                this.ALMotion = ALMotion;
                this.ALAutonomousLife = ALAutonomousLife;
                this.ALBehaviorManager = ALBehaviorManager;
                this.ALBattery = ALBattery;
            },null,  this.ipAdress);
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

        this.server.listen(8887, () => {
            console.log('Server running on port 8887');
        });
    }

    checkNaoConnection() {
        return this.isNaoConnected;
    } 
    

}