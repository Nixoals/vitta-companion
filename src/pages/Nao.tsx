import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import vittaLogo from '../assets/data/images/vittascience.jpg';
import Ned2 from '../assets/data/images/ned2.jpg';
import { CirclesWithBar, ProgressBar } from 'react-loader-spinner';

const Nao = () => {
	return (
		<>
			<Link to="/">
				<button className="mb-8">Home</button>
			</Link>
			<div>Nao</div>
		</>
	);
};

export default Nao;
