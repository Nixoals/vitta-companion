import { Link } from 'react-router-dom';
import Ned2 from '../assets/data/images/ned2.jpg';
import Raspberry from '../assets/data/images/raspberry.jpg';
import { useEffect, useState } from 'react';


const Home = () => {
	const [messageUpdate, setMessageUpdate] = useState('');
	useEffect(() => {
		window.ipcRenderer.on('update_available', () => {
			console.log('une mise à jour est disponible');
			setMessageUpdate('une mise à jour est disponible');
		});

		window.ipcRenderer.on('update_downloaded', () => {
			// Demandez à l'utilisateur s'il souhaite redémarrer l'application pour installer la mise à jour
			console.log('une mise à jour est téléchargée');
		});

		return () => {
			window.ipcRenderer.removeAllListeners('update_available');
			window.ipcRenderer.removeAllListeners('update_downloaded');
		};
	}, []);
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
						<div className="text-xl">Veuillez redémarrer l'application pour installer la mise à jour</div>
					</>
				) : (
					<div className="text-2xl mt-12">Vous êtes à jour</div>
				)}
			</div>
		</section>
	);
};

export default Home;
