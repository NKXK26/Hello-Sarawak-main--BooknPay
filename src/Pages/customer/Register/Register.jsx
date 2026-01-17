import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

// Import Assets
import logo from '../../../public/Perodua Axia.png';

// Import Icons
import { FaMailBulk, FaUserAlt, FaEyeSlash, FaPhoneAlt, FaUserCircle, FaCar, FaKey, FaLock, FaEnvelope } from 'react-icons/fa';
import { RiLockPasswordFill, RiLockPasswordLine } from "react-icons/ri";
import { IoEyeSharp } from "react-icons/io5";

// Import API function
import { signupUser } from '../../../../Api/api';

// Import Toast
import Toast from '../../../Component/Toast/Toast';
import VisualCaptcha from '../../../Component/VisualCaptcha/VisualCaptcha'; 

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const navigate = useNavigate();
  const userGroup = 'Customer';

  // Toast Function
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Regex 
  const usernameRegex = /^[a-zA-Z0-9]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate username
    if (!usernameRegex.test(username)) {
      displayToast('error', 'Invalid Username. Use letters And Numbers.');
      return;
    }

    // Check if captcha is valid
    if (!isCaptchaValid) {
      displayToast('error', 'Please complete the verification code.');
      return;
    }

    // Validate email
    if (!emailRegex.test(email)) {
      displayToast('error', 'Invalid email format.');
      return;
    }

    // Validate password
    if (!passwordRegex.test(password)) {
      displayToast('error', 'Password must be 8+ chars, with letters & numbers.');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      displayToast('error', 'Passwords do not match.');
      return;
    }

    const userData = {
      firstName,
      lastName,
      username,
      email,
      password,
      uphoneno: phoneNumber,
      userGroup,
    };

    console.log(userData);
    console.log(phoneNumber);

    try {
      const response = await signupUser(userData);
      const data = await response.json(); 

      if (response.ok && data.success) {
        displayToast('success', 'Registration successful!');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        displayToast('error', data.message || 'Error during registration.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      displayToast('error', 'An error occurred during registration.');
    }
  };

  // Function to display Toast
  const displayToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Password Visibility Toggle
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="registerPage">
      {showToast && <Toast type={toastType} message={toastMessage} />}

      <div className="registerContainer">
        {/* Top Brand Header */}
        <div className="registerHeader">
          <div className="brandSection">
            <div className="brandText">
              <h1 className="brandTitle">Go<span className="brandHighlight">Car</span></h1>
            </div>
          </div>
        </div>

        {/* Main Register Form Card */}
        <div className="registerMain">
          <div className="registerCard">
            {/* Card Header with Logo */}
            <div className="cardHeader">
              <div className="logoCircle">
                <img src={logo} alt="GoCar Logo" className="appLogo" />
              </div>
              <h2 className="welcomeTitle">Create Account</h2>
            </div>

            <form onSubmit={handleSubmit} className="registerForm">
              <div className="formGrid">
                <div className="formGroup">
                  <label htmlFor="firstName">First Name</label>
                  <div className="inputWrapper">
                    <FaUserAlt className="inputIcon" />
                    <input
                      type="text"
                      id="firstName"
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="formInput"
                    />
                  </div>
                </div>

                <div className="formGroup">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="inputWrapper">
                    <FaUserAlt className="inputIcon" />
                    <input
                      type="text"
                      id="lastName"
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="formInput"
                    />
                  </div>
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="username">Username</label>
                <div className="inputWrapper">
                  <FaUserCircle className="inputIcon" />
                  <input
                    type="text"
                    id="username"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="formInput"
                  />
                </div>
                <div className="inputHelper">Letters and numbers only</div>
              </div>

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

              <div className="formGroup">
                <label htmlFor="phoneNumber">Phone Number</label>
                <div className="inputWrapper">
                  <FaPhoneAlt className="inputIcon" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="formInput"
                  />
                </div>
              </div>

              <div className="formGrid">
                <div className="formGroup">
                  <label htmlFor="password">Password</label>
                  <div className="inputWrapper">
                    <RiLockPasswordFill className="inputIcon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Create password"
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
                  <div className="inputHelper">8+ characters with letters & numbers</div>
                </div>

                <div className="formGroup">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="inputWrapper">
                    <RiLockPasswordLine className="inputIcon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
              </div>

              {/* CAPTCHA Section */}
              <div className="captchaSection">
                <VisualCaptcha onValidationChange={setIsCaptchaValid} />
                <div className="captchaHelper">
                  Complete the verification to continue
                </div>
              </div>

              <div className="termsAgreement">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">
                  I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>

              <button 
                type="submit" 
                className="primaryBtn registerBtn"
                disabled={!isCaptchaValid}
              >
                Create Account
              </button>

              <div className="divider">
                <span>Already have an account?</span>
              </div>

              <button 
                type="button" 
                className="secondaryBtn loginBtn"
                onClick={() => navigate('/login')}
              >
                Sign In to Your Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;