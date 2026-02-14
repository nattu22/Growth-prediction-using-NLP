import React from 'react';
import { FileText, Upload, Sparkles, Clock, MoreHorizontal, Search, Bell, Grid, User, Layout } from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ onGenerateClick, onTemplateUpload }) => {
  return (
    <div className="dashboard-wrapper">
       {/* Sidebar */}
       <aside className="dashboard-sidebar">
          <div className="logo-area">
             <div className="logo-icon">P</div>
             <span className="logo-text">PPT Agent</span>
          </div>

          <nav className="side-nav">
             <a href="#" className="nav-item active"><Grid size={18} /> Dashboard</a>
             <a href="#" className="nav-item"><Clock size={18} /> My Orders</a>
             <a href="#" className="nav-item"><FileText size={18} /> Projects</a>
             <a href="#" className="nav-item"><User size={18} /> Settings</a>
          </nav>

          <div className="user-profile">
             <div className="avatar">N</div>
             <div className="user-info">
                <div className="name">Natraj's Workspace</div>
                <div className="plan">Free Plan</div>
             </div>
          </div>
       </aside>

       {/* Main Content */}
       <main className="dashboard-main">
          <header className="top-bar">
             <div className="search-bar">
                <Search size={16} color="#888" />
                <input type="text" placeholder="Search presentations..." />
             </div>
             <div className="top-actions">
                <button className="icon-btn"><Bell size={20} /></button>
                <button className="upgrade-btn">Upgrade</button>
             </div>
          </header>

          <div className="content-area">
             <div className="hero-section">
                <h1>Start Your Presentation</h1>
                <p>Choose how you want to begin</p>
             </div>

             <div className="action-cards">
                <div className="card blue-card">
                   <div className="card-icon"><Layout size={32} /></div>
                   <h3>Paste outline</h3>
                   <p>Build from existing text</p>
                </div>

                <div className="card purple-card" onClick={() => document.getElementById('dash-upload').click()}>
                   <div className="card-icon"><Upload size={32} /></div>
                   <h3>Import a file</h3>
                   <p>PowerPoint or PDF</p>
                   <input
                     id="dash-upload"
                     type="file"
                     hidden
                     accept="image/*"
                     onChange={(e) => onTemplateUpload(e.target.files[0])}
                   />
                </div>

                <div className="card red-card" onClick={onGenerateClick}>
                   <div className="card-icon"><Sparkles size={32} /></div>
                   <h3>Write a prompt</h3>
                   <p>Create from scratch</p>
                </div>
             </div>

             <div className="recent-section">
                <h2>Recent Presentations</h2>
                <div className="table-wrapper">
                    <table className="recent-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Modified</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div className="file-name">
                                <span className="file-icon">P</span>
                                FY26 Annual Strategy
                                </div>
                            </td>
                            <td>Oct 26, 2024</td>
                            <td>Oct 25, 2024</td>
                            <td><button className="icon-btn"><MoreHorizontal size={16} /></button></td>
                        </tr>
                        <tr>
                            <td>
                                <div className="file-name">
                                <span className="file-icon">P</span>
                                AI Agents in 2030
                                </div>
                            </td>
                            <td>Oct 24, 2024</td>
                            <td>Oct 24, 2024</td>
                            <td><button className="icon-btn"><MoreHorizontal size={16} /></button></td>
                        </tr>
                        <tr>
                            <td>
                                <div className="file-name">
                                <span className="file-icon">P</span>
                                Q3 Marketing Plan
                                </div>
                            </td>
                            <td>Oct 22, 2024</td>
                            <td>Oct 21, 2024</td>
                            <td><button className="icon-btn"><MoreHorizontal size={16} /></button></td>
                        </tr>
                    </tbody>
                    </table>
                </div>
             </div>
          </div>
       </main>
    </div>
  );
};

export default Dashboard;
