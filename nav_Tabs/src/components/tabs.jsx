import React, { useState } from 'react';
import './tab.css'; // Import your CSS file

const Tabs = () => {
  const [activeTab, setActiveTab] = useState(0); // State to track the active tab

  // Tab labels and content
  const tabs = ['Home', 'About', 'Services', 'Contact Us'];
  const content = [
    'Welcome to the Home Page! lorem ipsum we can not explain Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis voluptatibus eaque deserunt, reprehenderit nam ea necessitatibus similique, magni officia repudiandae cumque animi ex, quam excepturi. Mollitia eius obcaecati repudiandae corporis', 
    'Learn more About Us. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis voluptatibus eaque deserunt, reprehenderit nam ea necessitatibus similique, magni officia repudiandae cumque animi ex, quam excepturi. Mollitia eius obcaecati repudiandae corporis.',
    'Explore our Services. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis voluptatibus eaque deserunt, reprehenderit nam ea necessitatibus similique, magni officia repudiandae cumque animi ex, quam excepturi. Mollitia eius obcaecati repudiandae corporis.',
    'Get in touch on the Contact Us page. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Omnis voluptatibus eaque deserunt, reprehenderit nam ea necessitatibus similique, magni officia repudiandae cumque animi ex, quam excepturi. Mollitia eius obcaecati repudiandae corporis.',
  ];

  return (
    <div className="container">
      <div className="tab_box">
        {/* Render tabs dynamically */}
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab_btn ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)} // Set active tab on click
          >
            {tab}
          </button>
        ))}
        {/* Line indicator under the active tab */}
        <div
          className="line"
          style={{
            width: `${100 / tabs.length}%`,
            left: `${(100 / tabs.length) * activeTab}%`,
          }}
        ></div>
      </div>
      {/* Display the active tab's content */}
      <div className="content_box">
        <div className="content">{content[activeTab]}</div>
      </div>
    </div>
  );
};

export default Tabs;
