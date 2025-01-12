import React from "react";
import "./Navbar.css";
import logo_light from '../assets/logo-white.png';
import logo_dark from '../assets/logo-black.png';
import search_icon_light from '../assets/search-w.png';
import search_icon_dark from '../assets/search-b.png';
import toggle_dark from '../assets/night.png';
import toggle_light from '../assets/day.png';

const Navbar = ({ theme, settheme }) => {
    const toggle_mood = () => {
        settheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className={`Navbar ${theme}`}>
            <img src={theme === 'light' ? logo_dark : logo_light} className="logo" alt="Logo" />
            <ul className="list">
                <li>Home</li>
                <li>About</li>
                <li>Services</li>
                <li>Contact us</li>
            </ul>
            <div className="search-box">
                <input type="text" placeholder="Search-input" />
                <img src={theme === 'light' ? search_icon_light : search_icon_dark} alt="Search Icon" />
            </div>
            <img
                onClick={toggle_mood}
                src={theme === 'light' ? toggle_dark : toggle_light}
                alt="Toggle Theme"
                className="toggle-btn"
            />
        </div>
    );
};

export default Navbar;
