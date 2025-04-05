import React from 'react';
import './AboutPage.css';

function AboutPage() {
  return (
    <div className="container mt-4 fade-in">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">About This Project</h2>
              <p>This dashboard provides an interactive overview of lithium battery recycling facilities across North America. It aims to consolidate information about facility locations, operational status, processing capacities, and more.</p>
              <p>[Add more detailed project description here...]</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Data Sources</h2>
              <p>The data presented in this dashboard is compiled from various public sources, including company press releases, government reports, and industry publications.</p>
              <ul>
                <li>[List specific data sources here, e.g., EPA reports, company websites]</li>
                <li>[Mention data update frequency or limitations if applicable]</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Development Team</h2>
              <p>This project was developed by:</p>
              <ul>
                <li>[Team Member 1 Name/Role]</li>
                <li>[Team Member 2 Name/Role]</li>
                <li>[Add more team members as needed]</li>
              </ul>
              <p>[Optionally add links to profiles or contact info]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;