import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import vittaLogo from '../assets/data/images/vittascience.jpg';
import NaoImage from '../assets/data/images/nao.png';
import { CirclesWithBar, ProgressBar } from 'react-loader-spinner';

const Nao = () => {
	const [vittaConnectStatus, setVittaConnectStatus] = useState<boolean>(false);
	const [codeRunning, setCodeRunning] = useState<boolean>(false);
	const [naoQiConnectStatus, setNaoQiConnectStatus] = useState<boolean>(false);

	useEffect(() => {
		console.log('useEffect codeRunning');
		const codeRunningListener = (event: any, status: boolean) => {
			console.log(event);
			setCodeRunning(status);
		};

		window.ipcRenderer.on('codeRunningStatusUpdated', codeRunningListener);

		window.ipcRenderer.invoke('getCodeRunningStatus').then((status) => {
			setCodeRunning(status);
		});

		return () => {
			window.ipcRenderer.removeListener('codeRunningUpdated', codeRunningListener);
		};
	}, []);

	useEffect(() => {
		const connectStatusListener = (event: any, { isNaoQiConnected, isVittaConnected }: { isNaoQiConnected: boolean; isVittaConnected: boolean }) => {
			console.log(event);
			setNaoQiConnectStatus(isNaoQiConnected);
			setVittaConnectStatus(isVittaConnected);
		};

		window.ipcRenderer.on('connectStatusUpdated', connectStatusListener);

		// Initial fetch for connection status
		window.ipcRenderer.invoke('getConnectStatus').then(({ isNaoQiConnected, isVittaConnected }) => {
			setNaoQiConnectStatus(isNaoQiConnected);
			setVittaConnectStatus(isVittaConnected);
		});

		// listeners cleanup
		return () => {
			window.ipcRenderer.removeListener('connectStatusUpdated', connectStatusListener);
		};
	}, []);

	return (
		<>
			<Link to="/">
				<button className="mb-8">Home</button>
			</Link>
			<div className='mb-8'>NAO V6</div>
			<div className="flex items-center justify-around">
				<div className={`interface_card ${vittaConnectStatus ? 'bg-flow-green-left' : 'bg-flow-red-left'}`}>
					<img
						src={vittaLogo}
						alt="Vittascience Logo"
						className="w-full object-contain"
					/>
				</div>
				{/* <div className={`cable ${vittaConnectStatus ? 'bg-flow-green-left' : 'bg-flow-red-left'}`}></div> */}

				<div className='w-24'>
					<ProgressBar
						height="80"
						width="80"
						ariaLabel="progress-bar-loading"
						wrapperStyle={{}}
						wrapperClass="progress-bar-wrapper"
						borderColor="#22b573"
						barColor="#22b573"
						visible={vittaConnectStatus ? true : false}
					/>
				</div>

				<div>companion APP</div>
				<div className='w-24'>
					<ProgressBar
						height="80"
						width="80"
						ariaLabel="progress-bar-loading"
						wrapperStyle={{}}
						wrapperClass="progress-bar-wrapper"
						borderColor="#22b573"
						barColor="#22b573"
						visible={naoQiConnectStatus ? true : false}
					/>
				</div>
				<div className={`interface_card ${naoQiConnectStatus ? 'bg-flow-green-right' : 'bg-flow-red-right'}`}>
					<img
						src={NaoImage}
						alt="Ned2 Logo"
						className="w-full object-contain"
					/>
				</div>
			</div>
			<div className="my-4">{codeRunning ? 'Programme en cours d\'exécution' : "Aucun programme en cours d'exécution"}</div>
			<div className="h-40 w-full flex justify-center items-center">
				{codeRunning && (
					<>
						<CirclesWithBar
							height="100"
							width="100"
							color="#4fa94d"
							wrapperStyle={{}}
							wrapperClass=""
							visible={true}
							outerCircleColor=""
							innerCircleColor=""
							barColor=""
							ariaLabel="circles-with-bar-loading"
						/>
					</>
				)}
			</div>
		</>
	);
};

export default Nao;
