import { Link } from 'react-router-dom';
import Ned2 from '../assets/data/images/ned2.jpg';
import Raspberry from '../assets/data/images/raspberry.jpg';
import { useEffect, useState } from 'react';


const Home = () => {

	const [messageUpdate, setMessageUpdate] = useState<string>('');
	const [platform, setPlatform] = useState<string>('win');
	const [downloadLink, setDownloadLink] = useState<string>('');
	
	useEffect(() => {

		window.ipcRenderer.on("os", (_, os) => {
			console.log(os);
			if (os === 'win') {
				setPlatform('win');
			} else if (os === 'mac') {
				setPlatform('mac');
			}
		});


		window.ipcRenderer.on('update_available', (_, version) => {
			console.log(version, platform);
			const newVersion = version.version;
			if (version.platform === 'win') {
				setDownloadLink(`https://github.com/Nixoals/vitta-companion/releases/download/${newVersion}/Vitta.Companion.Setup.${newVersion.replace('v', '')}.exe`);
			} else if (version.platform === 'mac') {
				setDownloadLink(`https://github.com/Nixoals/vitta-companion/releases/download/${newVersion}/Vitta.Companion-${newVersion.replace('v', '')}-arm64.dmg`);
			}
			console.log('une mise à jour est disponible');
			console.log(downloadLink);
			setMessageUpdate('une mise à jour est disponible');

		});

		window.ipcRenderer.on('update_downloaded', () => {
			// Demandez à l'utilisateur s'il souhaite redémarrer l'application pour installer la mise à jour
			console.log('une mise à jour est téléchargée');
		});

		return () => {
			window.ipcRenderer.removeAllListeners('update_available');
			window.ipcRenderer.removeAllListeners('update_downloaded');
			window.ipcRenderer.removeAllListeners('os');
		};
	}, []);

	const handleDownload = () => {
        // Ouvrir le lien de téléchargement dans une nouvelle fenêtre
		console.log(downloadLink);
        window.ipcRenderer.send('download', downloadLink)
    };
	return (
		<section>
			<div className="text-2xl mb-12">Choisissez une interface</div>
			<div>
				<div className="flex justify-center items-center gap-2">
					<div className="flex flex-col">
						<Link to="/niryo">
							<div className="interface_card">
								<img
									src={Ned2}
									alt="Niryo"
									className="w-full object-contain"
								/>
							</div>
						</Link>
						<div>Robot Niryo</div>
					</div>
					<div className="flex flex-col">
						<Link to="/raspberry">
							<div className=" interface_card">
								<img
									src={Raspberry}
									alt="Niryo"
									className="w-full h-full object-contain"
								/>
							</div>
						</Link>
						<div>Raspberry</div>
					</div>
				</div>
				{messageUpdate ? (
					<>
						<div className="text-2xl mt-12">{messageUpdate}</div>
						<a href="#" className="text-blue-500" onClick={handleDownload}>Télécharger</a>
						{/* <div className="text-xl">Veuillez redémarrer l'application pour installer la mise à jour</div> */}
					</>
				) : (
					<div className="text-2xl mt-12 text-green-700">Vous êtes à jour</div>
				)}
			</div>
		</section>
	);
};

export default Home;
