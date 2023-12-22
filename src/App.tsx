// import { useState } from 'react'

// import reactLogo from './assets/react.svg'
// import viteLogo from '/electron-vite.animate.svg'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
// import Home from './pages/Home'
import NiryoPage from './pages/NiryoPage';
import Raspberry from './pages/Raspberry';
import { useEffect } from 'react';
const { ipcRenderer } = window.require('electron');

function App() {
	useEffect(() => {
		ipcRenderer.on('update_available', () => {
			console.log('une mise à jour est disponible');
		});

		ipcRenderer.on('update_downloaded', () => {
			// Demandez à l'utilisateur s'il souhaite redémarrer l'application pour installer la mise à jour
      console.log('une mise à jour est téléchargée');
		});

    return () => {
      ipcRenderer.removeAllListeners('update_available');
      ipcRenderer.removeAllListeners('update_downloaded');
    };
	}, []);

	return (
		<>
			<Router>
				<Routes>
					<Route
						path="/"
						element={<Home></Home>}
					/>
					<Route
						path="/niryo"
						element={<NiryoPage />}
					/>
					<Route
						path="/raspberry"
						element={<Raspberry />}
					/>
				</Routes>
			</Router>
		</>
	);
}

export default App;
