import { Link } from 'react-router-dom';
import Ned2 from '../assets/data/images/ned2.jpg';
import Raspberry from '../assets/data/images/raspberry.jpg';

const Home = () => {
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
					<div className='flex flex-col'>
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
			</div>
		</section>
	);
};

export default Home;
