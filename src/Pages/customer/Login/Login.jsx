import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

// Import Assets
import logo from '../../../public/Perodua Axia.png';

// Import Icons
import { FaUserCircle, FaLock, FaEnvelope, FaCar, FaKey } from 'react-icons/fa';
import { IoEyeSharp } from "react-icons/io5";
import { FaEyeSlash } from "react-icons/fa";

// Import API function
import { loginUser, forgotPassword } from '../../../../Api/api';

// Import Toast
import Toast from '../../../Component/Toast/Toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = { username, password };

    try {
      const response = await loginUser(userData);
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.uactivation === 'Inactive') {
          displayToast('error', 'Your account is inactive.');
          return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('usergroup', data.usergroup);
        localStorage.setItem('userid', data.userid);
        localStorage.setItem('uactivation', data.uactivation);

        console.log('User Group:', data.usergroup);
        console.log('User Activation:', data.uactivation);

        if (data.usergroup === 'Customer') {
          displayToast('success', 'Login successful! Redirecting...');
          setTimeout(() => navigate('/home'), 2000);
        } else if (data.usergroup === 'Owner') {
          displayToast('success', 'Login successful! Redirecting...');
          setTimeout(() => navigate('/owner_dashboard'), 2000);
        } else if (data.usergroup === 'Moderator') {
          displayToast('success', 'Login successful! Redirecting...');
          setTimeout(() => navigate('/moderator_dashboard'), 2000);
        } else if (data.usergroup === 'Administrator') {
          displayToast('success', 'Login successful! Redirecting...');
          setTimeout(() => navigate('/administrator_dashboard'), 2000);
        } else {
          displayToast('error', 'Invalid user group.');
        }
      } else {
        displayToast('error', data.message || 'Invalid username or password.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      displayToast('error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      const data = await forgotPassword(email);
      displayToast('success', 'New password has been sent to your email');
      setShowForgotPassword(false);
      setEmail('');
    } catch (error) {
      displayToast('error', error.message || 'Reset password failed');
    }
  };

  const displayToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="loginPage">
      {showToast && <Toast type={toastType} message={toastMessage} />}

      <div className="loginContainer">
        {/* Top Brand Header */}
        <div className="loginHeader">
          <div className="brandSection">
            <div className="brandText">
              <h1 className="brandTitle">Go<span className="brandHighlight">Car</span></h1>
            </div>
          </div>
        </div>

        {/* Main Login Form Card */}
        <div className="loginMain">
          <div className="loginCard">
            {/* Card Header with Logo */}
            <div className="cardHeader">
              <div className="logoCircle">
                <img src={logo} alt="GoCar Logo" className="appLogo" />
              </div>
              <h2 className="welcomeTitle">Welcome Back</h2>
            </div>

            {showForgotPassword ? (
              <div className="forgotPasswordCard">
                <div className="forgotHeader">
                  <FaKey className="forgotIcon" />
                  <h3>Reset Password</h3>
                  <p>Enter your email to receive a new password</p>
                </div>
                
                <form onSubmit={handleForgotPassword} className="forgotForm">
                  <div className="formGroup">
                    <label htmlFor="email">Email Address</label>
                    <div className="inputWrapper">
                      <FaEnvelope className="inputIcon" />
                      <input
                        type="email"
                        id="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="formInput"
                      />
                    </div>
                  </div>
                  
                  <div className="formActions">
                    <button type="submit" className="primaryBtn">
                      Send Reset Link
                    </button>
                    <button 
                      type="button" 
                      className="secondaryBtn"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="loginForm">
                <div className="formGroup">
                  <label htmlFor="username">Username or Email</label>
                  <div className="inputWrapper">
                    <FaUserCircle className="inputIcon" />
                    <input
                      type="text"
                      id="username"
                      placeholder="Enter username or email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="formInput"
                    />
                  </div>
                </div>
                
                <div className="formGroup">
                  <label htmlFor="password">Password</label>
                  <div className="inputWrapper">
                    <FaLock className="inputIcon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="formInput"
                    />
                    <button 
                      type="button" 
                      className="passwordToggle"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="toggleIcon" />
                      ) : (
                        <IoEyeSharp className="toggleIcon" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="formOptions">
                  <button 
                    type="button" 
                    className="forgotPasswordBtn"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
                
                <button type="submit" className="primaryBtn loginBtn">
                  Sign In
                </button>
                
                <div className="divider">
                  <span>Don't have an account?</span>
                </div>
                
                <button 
                  type="button" 
                  className="secondaryBtn signupBtn"
                  onClick={() => navigate('/register')}
                >
                  Create New Account
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;