import React from 'react';

const Navbar: React.FC = () => {
    return (
        <nav>
            <h1>Image Retrieval App</h1>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </nav>
    );
};

export default Navbar;