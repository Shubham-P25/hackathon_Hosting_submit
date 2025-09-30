import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const footerSections = [
	{
		title: 'About',
		links: [
			{ label: 'About Us', path: '/about' },
			{ label: 'Browse', path: '/browse' },
			{ label: 'Host', path: '/host' },
		],
	},
	{
		title: 'Legal',
		links: [
			{ label: 'Terms & Conditions', path: '/terms' },
			{ label: 'Privacy', path: '/privacy' },
			{ label: 'Copyright', path: '/copyright' },
		],
	},
	{
		title: 'Support',
		links: [
			{ label: 'Contact', path: '/contact' },
			{ label: 'Help', path: '/help' },
			{ label: 'FAQ', path: '/faq' },
		],
	},
	{
		title: 'Social',
		links: [
			{ label: 'GitHub', url: 'https://github.com' },
			{ label: 'Instagram', url: 'https://instagram.com' },
			{ label: 'Twitter', url: 'https://twitter.com' },
		],
	},
];

const Footer = () => {
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				type: 'spring',
				stiffness: 100,
			},
		},
	};

	return (
		<footer className="bg-gray-900 text-white py-6">
			<motion.div
				className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				{footerSections.map((section) => (
					<motion.div key={section.title} variants={itemVariants}>
						<h4 className="font-bold text-lg mb-4">{section.title}</h4>
						<ul className="space-y-2">
							{section.links.map((link) => (
								<li key={link.label}>
									{link.path ? (
										<Link
											to={link.path}
											className="hover:underline text-gray-300 hover:text-white transition-colors"
										>
											{link.label}
										</Link>
									) : (
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											className="hover:underline text-gray-300 hover:text-white transition-colors"
										>
											{link.label}
										</a>
									)}
								</li>
							))}
						</ul>
					</motion.div>
				))}
			</motion.div>
			<div className="mt-6 text-center text-gray-400 text-sm">
				&copy; {new Date().getFullYear()} SubmitIt. All rights reserved.
			</div>
		</footer>
	);
};

export default Footer;
