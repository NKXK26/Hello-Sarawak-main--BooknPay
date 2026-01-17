import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../../Component/Sidebar/Sidebar';
import Dashboard from './Modules/Dashboard/Dashboard';
import PropertyListing from './Modules/Property Listing/PropertyListing';
import Customers from './Modules/Customers/Customers';
import NoAccess from '../../Component/NoAccess/NoAccess';
import Profile from './Modules/Profile/Profile';
import { FiHome, FiUsers } from 'react-icons/fi';
import { FaHotel } from 'react-icons/fa';
import { CgProfile } from "react-icons/cg";
import '../../Component/MainContent/MainContent.css';
import { useQuery } from '@tanstack/react-query';
import { fetchUserData } from '../../../Api/api';

const AdminDashboard = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [usergroup, setusergroup] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
    const userID = localStorage.getItem('userid');

    // React Query for user data with polling
    const { data: userData } = useQuery({
        queryKey: ['userData', userID],
        queryFn: () => fetchUserData(userID),
        enabled: !!isLoggedIn && !!userID,
        staleTime: 0,
        refetchInterval: 1000, // Check every 1 second for faster response
        refetchIntervalInBackground: true,
    });

    useEffect(() => {
        // Check for inactive status
        if (userData?.uactivation === "Inactive") {
            handleLogout();
            navigate('/no-access');
        }
    }, [userData?.uactivation, navigate]);

    useEffect(() => {
        // Initial check
        checkAndRedirect();

        const checkInterval = setInterval(() => {
            checkAndRedirect();
        }, 3000); // Check every 3 seconds

        // Define the check function
        function checkAndRedirect() {
            const loggedInStatus = localStorage.getItem('isLoggedIn');
            const usergroupStatus = localStorage.getItem('usergroup');

            setIsLoggedIn(loggedInStatus === 'true');
            setusergroup(usergroupStatus);

            if (loggedInStatus !== 'true' || usergroupStatus !== 'Administrator') {
                navigate('/no-access');
            }
        }

        // Clean up interval on unmount
        return () => clearInterval(checkInterval);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setusergroup('');
    };

    // Display a loading state until authentication is confirmed
    if (!isLoggedIn || usergroup !== 'Administrator') {
        return <div>Loading...</div>;
    }

    const links = [
        { path: '/administrator_dashboard/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { path: '/administrator_dashboard/property-listing', label: 'Property Listing', icon: <FaHotel /> },
        { path: '/administrator_dashboard/customers', label: 'Customers', icon: <FiUsers /> },
        { path: '/administrator_dashboard/profile', label: 'Profile', icon: <CgProfile /> },
    ];

    return (
        <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                title="Administrator"
                links={links}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                handleLogout={handleLogout}
            />
            <div className="dashboard-content">
                <Routes>
                    <Route path="/" element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="property-listing" element={<PropertyListing />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="*" element={<NoAccess />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;