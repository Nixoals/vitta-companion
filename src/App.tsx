// import { useState } from 'react'

// import reactLogo from './assets/react.svg'
// import viteLogo from '/electron-vite.animate.svg'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
// import Home from './pages/Home'
import NiryoPage from './pages/NiryoPage';
import Raspberry from './pages/Raspberry';

function App() {
  

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
