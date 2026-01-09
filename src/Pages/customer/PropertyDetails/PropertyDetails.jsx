import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoIosArrowBack, IoIosArrowForward, IoIosClose } from "react-icons/io";
import { IoReturnUpBackOutline } from "react-icons/io5";
import { FaUser, FaMapMarkerAlt, FaStar, FaCar, FaGasPump, FaCogs, FaCalendarAlt, FaClock, FaPhone, FaEnvelope, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { MdAirlineSeatReclineNormal, MdOutlineDirectionsCar } from "react-icons/md";
import { GiGearStickPattern } from "react-icons/gi";
import { AuthProvider } from '../../../Component/AuthContext/AuthContext';
import Navbar from '../../../Component/Navbar/navbar';
import Toast from '../../../Component/Toast/Toast';
import Reviews from '../../../Component/Reviews/Reviews';
import Footer from '../../../Component/Footer/footer';
import './PropertyDetails.css';
import { createReservation, requestBooking, getCoordinates, fetchUserData, checkDateOverlap } from '../../../../Api/api';
// Add import for PayPal
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const VehicleDetails = () => {
  const [weekendSurcharge, setWeekendSurcharge] = useState(0);
  const [totalBasePrice, setTotalBasePrice] = useState(0);
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('');
  const { vehicleDetails } = location.state || {};
  const [bookingData, setBookingData] = useState({
    pickupDate: '',
    returnDate: '',
    pickupTime: '09:00',
    returnTime: '17:00',
    pickupLocation: '',
    returnLocation: '',
  });
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingForm, setBookingForm] = useState({
    title: 'Mr.',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    drivingLicense: '',
    additionalRequests: ''
  });
  const navigate = useNavigate();
  const [showFeaturesOverlay, setShowFeaturesOverlay] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Add these to your VehicleDetails component state - MOVED INSIDE COMPONENT
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const [payPalClientId, setPayPalClientId] = useState(
    import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AQnKj2txjl1bnlCBzthuCa7DtxuK3X0PsNlrDhjDwxQasGACq8Y0PGNbaTEEuIDTFe9HGfIOis0tOstU'
  );
  const [vehicleOwnerPayPalId, setVehicleOwnerPayPalId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentError, setPaymentError] = useState('');

  // Add validation function - MOVED INSIDE COMPONENT
  const validateBookingForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'drivingLicense'
    ];

    for (const field of requiredFields) {
      if (!bookingForm[field] || bookingForm[field].trim() === '') {
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingForm.email)) {
      return false;
    }

    // Validate phone number (basic validation)
    if (bookingForm.phoneNumber.length < 8) {
      return false;
    }

    if (!bookingData.pickupDate || !bookingData.returnDate) {
      return false;
    }

    return true;
  };


  // const handlePayPalBooking = async (paymentDetails) => {
  //   setIsProcessingPayment(true);

  //   try {
  //     // 1. Generate booking ID
  //     const bookingIdResponse = await generateVehicleBookingId();
  //     const generatedBookingId = bookingIdResponse.bookingID;
  //     setBookingId(generatedBookingId);

  //     // 2. Prepare booking data
  //     const bookingDataForDB = {
  //       bookingID: generatedBookingId,
  //       vehicle: vehicleDetails?.vehicle,
  //       fullName: `${bookingForm.title} ${bookingForm.firstName} ${bookingForm.lastName}`,
  //       email: bookingForm.email,
  //       mobile: bookingForm.phoneNumber,
  //       license: bookingForm.drivingLicense,
  //       additionalInfo: bookingForm.additionalRequests || '',
  //       flightNumber: '',
  //       pickupLoc: bookingData.pickupLocation || 'Main Office',
  //       dropoffLoc: bookingData.returnLocation || bookingData.pickupLocation || 'Main Office',
  //       pickupDate: bookingData.pickupDate,
  //       dropoffDate: bookingData.returnDate,
  //       pickupTime: bookingData.pickupTime,
  //       dropoffTime: bookingData.returnTime,
  //       others: '',
  //       extras: bookingData.rateType || 'Daily',
  //       total: totalPrice,
  //       status: 'Pending',
  //       payment_method: 'paypal',
  //       paypal_order_id: paymentDetails.id,
  //       paypal_transaction_id: paymentDetails.purchase_units[0]?.payments?.captures[0]?.id,
  //       vehicle_id: vehicleDetails?.id,
  //       user_id: localStorage.getItem('userid') || null
  //     };

  //     console.log('Creating booking:', bookingDataForDB);

  //     // 3. Create booking in database
  //     const bookingResponse = await createVehicleBooking(bookingDataForDB);

  //     if (!bookingResponse.success) {
  //       throw new Error('Failed to create booking record');
  //     }

  //     // 4. Update booking with PayPal transaction details
  //     await updateVehicleBookingWithPayPal(generatedBookingId, {
  //       paypal_order_id: paymentDetails.id,
  //       paypal_transaction_id: paymentDetails.purchase_units[0]?.payments?.captures[0]?.id,
  //       payment_status: 'COMPLETED'
  //     });

  //     // 5. Show success message
  //     displayToast('success', `Booking confirmed! Your booking ID is: ${generatedBookingId}`);

  //     // 6. Update state
  //     setPaymentStatus('success');
  //     setBookingId(generatedBookingId);

  //     // 7. Optional: Navigate to confirmation page or show success modal
  //     // setTimeout(() => {
  //     //   setShowBookingForm(false);
  //     //   navigate(`/booking-confirmation/${generatedBookingId}`);
  //     // }, 3000);

  //   } catch (error) {
  //     console.error('Booking error:', error);
  //     displayToast('error', 'Payment successful but booking creation failed. Please contact support.');
  //     setPaymentStatus('error');
  //     setPaymentError(error.message);
  //   } finally {
  //     setIsProcessingPayment(false);
  //   }
  // };

  // Add these API functions that are missing:

  // Add these state variables at the top of your component
  const [cartToken, setCartToken] = useState('');
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const updateCartCount = () => {
      const token = localStorage.getItem('cartToken');
      if (token) {
        const items = JSON.parse(localStorage.getItem(`cart_${token}`)) || [];
        setCartCount(items.length);
      }
    };

    updateCartCount();

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  // Add this useEffect to initialize cart
  useEffect(() => {
    initializeCart();
  }, []);

  // Function to initialize or get existing cart
  const initializeCart = () => {
    // Try to get existing cart token
    let storedToken = localStorage.getItem('cartToken');

    if (!storedToken) {
      // Generate new cart token
      storedToken = generateCartToken();
      localStorage.setItem('cartToken', storedToken);
      // Initialize empty cart
      localStorage.setItem(`cart_${storedToken}`, JSON.stringify([]));
    }

    setCartToken(storedToken);

    // Load cart count
    const cartItems = JSON.parse(localStorage.getItem(`cart_${storedToken}`)) || [];
    setCartCount(cartItems.length);

    // Clean up old carts (optional)
    cleanupOldCarts(storedToken);
  };

  // Generate unique cart token
  const generateCartToken = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `cart_${timestamp}_${random}`;
  };

  // Clean up carts older than 7 days
  const cleanupOldCarts = (currentToken) => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cart_') && key !== `cart_${currentToken}`) {
        const cartData = localStorage.getItem(key);
        try {
          const items = JSON.parse(cartData);
          const firstItem = items[0];
          if (firstItem && firstItem.added_at) {
            const addedTime = new Date(firstItem.added_at).getTime();
            if (addedTime < oneWeekAgo) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // If corrupted, remove it
          localStorage.removeItem(key);
        }
      }
    });
  };

  // Function to add vehicle to cart (no login required)
  const addToCart = () => {
    // Validate dates
    if (!bookingData.pickupDate || !bookingData.returnDate) {
      displayToast('error', 'Please select pickup and return dates first');
      return;
    }

    // Validate basic info (optional - you can make some fields optional)
    if (!bookingForm.firstName || !bookingForm.lastName || !bookingForm.email || !bookingForm.phoneNumber) {
      displayToast('error', 'Please fill all required personal information');
      return;
    }

    // Get or create cart token
    let token = localStorage.getItem('cartToken');
    if (!token) {
      token = generateCartToken();
      localStorage.setItem('cartToken', token);
      localStorage.setItem(`cart_${token}`, JSON.stringify([]));
      setCartToken(token);
    }

    // Create cart item
    const cartItem = {
      id: `${vehicleDetails.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      vehicle_id: vehicleDetails.id,
      vehicle: vehicleDetails.vehicle,
      brand: vehicleDetails.brand_name || vehicleDetails.brand,
      seats: vehicleDetails.seat || 5,
      transmission: vehicleDetails.transmission_name || 'Automatic',
      price_per_day: parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0),
      cdw_per_day: cdwDetails.price,

      // Booking details
      pickup_date: bookingData.pickupDate,
      return_date: bookingData.returnDate,
      pickup_time: bookingData.pickupTime,
      return_time: bookingData.returnTime,
      pickup_location: bookingData.pickupLocation || 'Main Office',
      return_location: bookingData.returnLocation || bookingData.pickupLocation || 'Main Office',
      rate_type: bookingData.rateType || 'daily',

      // Customer details (all required for booking)
      title: bookingForm.title,
      first_name: bookingForm.firstName,
      last_name: bookingForm.lastName,
      email: bookingForm.email,
      phone: bookingForm.phoneNumber,
      driving_license: bookingForm.drivingLicense || '', // Can be empty initially
      additional_requests: bookingForm.additionalRequests || '',

      // Pricing
      total_days: totalDays,
      base_price: (parseFloat(vehicleDetails?.pricing?.[bookingData.rateType || 'daily'] ||
        vehicleDetails?.[bookingData.rateType || 'daily'] || 0) * totalDays),
      cdw_total: (cdwDetails.price * totalDays),
      weekend_surcharge: (totalPrice * 0.2),
      tax_amount: (totalPrice * 0.06),
      total_price: totalPrice,

      // Metadata
      added_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      status: 'in_cart',
      payment_status: 'pending',

      // Images
      image_url: vehiclePhotos[0] || '/default-car.png'
    };

    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem(`cart_${token}`)) || [];

    // Check for date conflicts (optional)
    const hasConflict = checkDateConflict(existingCart, cartItem);
    if (hasConflict) {
      displayToast('error', 'This vehicle has scheduling conflict with existing items in cart');
      return;
    }

    // Add to cart
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem(`cart_${token}`, JSON.stringify(updatedCart));

    // Update state
    setCartCount(updatedCart.length);

    displayToast('success', 'Vehicle added to cart! Complete checkout to confirm booking.');

    // Optional: Show cart notification
    showCartNotification(cartItem.vehicle);

    // Close booking form
    setShowBookingForm(false);
  };

  // Check for date conflicts
  const checkDateConflict = (existingItems, newItem) => {
    const newPickup = new Date(newItem.pickup_date);
    const newReturn = new Date(newItem.return_date);

    return existingItems.some(item => {
      if (item.vehicle_id === newItem.vehicle_id) {
        const itemPickup = new Date(item.pickup_date);
        const itemReturn = new Date(item.return_date);

        // Check if date ranges overlap
        return (newPickup < itemReturn && newReturn > itemPickup);
      }
      return false;
    });
  };

  // Show cart notification
  const showCartNotification = (vehicleName) => {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">✓</span>
      <div>
        <strong>Added to Cart</strong>
        <p>${vehicleName}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="close-notif">×</button>
    </div>
    <a href="/cart" class="view-cart-btn">View Cart (${cartCount + 1})</a>
  `;

    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    min-width: 300px;
    animation: slideIn 0.3s ease;
  `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  };

  // Update the PayPal button to also add to cart after payment
  const handlePayPalBooking = async (paymentDetails) => {
    setIsProcessingPayment(true);

    try {
      // Generate booking ID
      const bookingIdResponse = await generateVehicleBookingId();
      const generatedBookingId = bookingIdResponse.bookingID;
      setBookingId(generatedBookingId);

      // Prepare booking data
      const bookingDataForDB = {
        bookingID: generatedBookingId,
        vehicle: vehicleDetails?.vehicle,
        fullName: `${bookingForm.title} ${bookingForm.firstName} ${bookingForm.lastName}`,
        email: bookingForm.email,
        mobile: bookingForm.phoneNumber,
        license: bookingForm.drivingLicense || 'To be provided',
        additionalInfo: bookingForm.additionalRequests || '',
        pickupLoc: bookingData.pickupLocation || 'Main Office',
        dropoffLoc: bookingData.returnLocation || bookingData.pickupLocation || 'Main Office',
        pickupDate: bookingData.pickupDate,
        dropoffDate: bookingData.returnDate,
        pickupTime: bookingData.pickupTime,
        dropoffTime: bookingData.returnTime,
        extras: bookingData.rateType || 'Daily',
        total: totalPrice,
        status: 'Paid',
        payment_method: 'paypal',
        paypal_order_id: paymentDetails.id,
        paypal_transaction_id: paymentDetails.purchase_units[0]?.payments?.captures[0]?.id
      };

      // Create booking
      const bookingResponse = await createVehicleBooking(bookingDataForDB);

      if (!bookingResponse.success) {
        throw new Error('Failed to create booking record');
      }

      // Remove item from cart if it exists there
      removeFromCartIfExists(vehicleDetails.id, bookingData.pickupDate, bookingData.returnDate);

      // Show success
      displayToast('success', `Booking confirmed! Your booking ID is: ${generatedBookingId}`);
      setPaymentStatus('success');
      setBookingId(generatedBookingId);

      // Close modal after 3 seconds
      setTimeout(() => {
        setShowBookingForm(false);
        // Navigate to confirmation page if desired
        // navigate(`/booking-confirmation/${generatedBookingId}`);
      }, 3000);

    } catch (error) {
      console.error('Booking error:', error);
      displayToast('error', 'Payment successful but booking creation failed. Please contact support.');
      setPaymentStatus('error');
      setPaymentError(error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Remove from cart if exists
  const removeFromCartIfExists = (vehicleId, pickupDate, returnDate) => {
    const token = localStorage.getItem('cartToken');
    if (!token) return;

    const existingCart = JSON.parse(localStorage.getItem(`cart_${token}`)) || [];
    const updatedCart = existingCart.filter(item =>
      !(item.vehicle_id === vehicleId &&
        item.pickup_date === pickupDate &&
        item.return_date === returnDate)
    );

    if (updatedCart.length !== existingCart.length) {
      localStorage.setItem(`cart_${token}`, JSON.stringify(updatedCart));
      setCartCount(updatedCart.length);
    }
  };

  const generateVehicleBookingId = async () => {
    try {
      const response = await fetch(`http://localhost:5432/bookings/generate-vehicle-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate booking ID');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating booking ID:', error);
      throw error;
    }
  };

  const createVehicleBooking = async (bookingDataForDB) => {
    try {
      const response = await fetch(`http://localhost:5432/bookings/vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingDataForDB)
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating vehicle booking:', error);
      throw error;
    }
  };

  const updateVehicleBookingWithPayPal = async (bookingId, transactionData) => {
    try {
      const response = await fetch(`http://localhost:5432/bookings/vehicle/${bookingId}/paypal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        throw new Error('Failed to update booking with PayPal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating booking with PayPal:', error);
      throw error;
    }
  };

  // Update handleFormChange to validate as user types - MOVED INSIDE COMPONENT
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    // Update the form state
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation feedback (optional)
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        // You could set an error state here
      }
    }

    if (name === 'phoneNumber') {
      // Validate phone number format
      if (value && !/^[\d\s\+\-\(\)]{8,}$/.test(value)) {
        // You could set an error state here
      }
    }
  };

  // ADD THIS FUNCTION - Same as in Product.jsx
  const getVehicleImage = (vehicleName) => {
    if (!vehicleName) return '/default-car.png';

    // Map vehicle names to image paths (same as Product.jsx)
    const vehicleImageMap = {
      'Perodua Myvi': '/src/cars/Perodua Myvi.png',
      'Perodua Axia': '/src/cars/Perodua Axia.png',
      'Honda City': '/src/cars/Honda City.png',
      'Toyota Vios': '/src/cars/Toyota Vios.png',
      'Proton Saga': '/src/cars/Proton Saga.png',
      'Perodua Alza': '/src/cars/Perodua Alza.png',
      'Perodua Bezza': '/src/cars/Perodua Bezza.png',
      'Perodua Myvi (New)': '/src/cars/Perodua Myvi (New).png',
      'Toyota Fortuner': '/src/cars/Toyota Fortuner.png',
      'Toyota Sienta': '/src/cars/Toyota Sienta.png',
      'Perodua Alza (New)': '/src/cars/Perodua Alza (New).png',
    };

    return vehicleImageMap[vehicleName] || `/src/cars/${vehicleName.replace(/\s+/g, '_')}.png`;
  };

  // Helper function to get vehicle photos
  const getVehiclePhotos = () => {
    // First try to use the mapped image
    const mainImage = getVehicleImage(vehicleDetails?.vehicle);

    // If we have photos from API, use them as additional images
    let additionalPhotos = [];

    // Handle the photo data safely
    if (vehicleDetails?.photo) {
      if (Array.isArray(vehicleDetails.photo)) {
        // If it's already an array
        additionalPhotos = vehicleDetails.photo.filter(photo => {
          return typeof photo === 'string' && photo.trim().length > 0;
        });
      } else if (typeof vehicleDetails.photo === 'string') {
        // If it's a string, try to split by comma
        additionalPhotos = vehicleDetails.photo.split(',').map(p => p.trim()).filter(p => p.length > 0);
      }
    }

    // Return array with main image first, then additional photos
    const allPhotos = [mainImage, ...additionalPhotos].filter(Boolean);

    // Log for debugging
    console.log('Vehicle Photos:', allPhotos);
    console.log('Vehicle Details:', vehicleDetails);

    return allPhotos;
  };

  // Get photos array
  const vehiclePhotos = getVehiclePhotos();

  // Vehicle features based on API response
  const vehicleFeatures = [
    { name: "Seats", icon: <MdAirlineSeatReclineNormal className="feature-icon" />, value: vehicleDetails?.seat || 5 },
    { name: "Transmission", icon: <GiGearStickPattern className="feature-icon" />, value: vehicleDetails?.transmission_name || (vehicleDetails?.transmission === 1 ? 'Automatic' : 'Manual') },
    { name: "Fuel Type", icon: <FaGasPump className="feature-icon" />, value: "Petrol" },
    { name: "Engine", icon: <FaCogs className="feature-icon" />, value: "1.5L" },
    { name: "Mileage", icon: <MdOutlineDirectionsCar className="feature-icon" />, value: "Unlimited" },
  ];

  // CDW (Collision Damage Waiver) details
  const cdwDetails = {
    price: parseFloat(vehicleDetails?.pricing?.cdw || vehicleDetails?.cdw || 0),
    coverage: "Up to RM 5,000",
    excess: "RM 500"
  };

  const nextSlide = () => {
    setCurrentSlide(prev =>
      prev === (vehiclePhotos.length || 0) - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide(prev =>
      prev === 0 ? (vehiclePhotos.length || 0) - 1 : prev - 1
    );
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = 'auto';
  };

  const handlePhotoClick = (index) => {
    setSelectedImageIndex(index);
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
  };

  // Add this function in your VehicleDetails component
  const handleAddToCartWithPayment = async (paymentDetails) => {
    console.log('Starting vehicle reservation with payment...');

    const userid = localStorage.getItem('userid');

    if (!userid) {
      displayToast('error', 'Please login first');
      return;
    }

    if (!bookingForm.firstName || !bookingForm.lastName || !bookingForm.email ||
      !bookingForm.phoneNumber || !bookingForm.drivingLicense) {
      displayToast('error', 'Please fill all required fields including driving license');
      return;
    }

    if (!bookingData.pickupDate || !bookingData.returnDate) {
      displayToast('error', 'Please select pickup and return dates');
      return;
    }

    try {
      const reservationData = {
        vehicle_id: vehicleDetails.id,
        pickup_datetime: `${bookingData.pickupDate}T${bookingData.pickupTime}:00`,
        return_datetime: `${bookingData.returnDate}T${bookingData.returnTime}:00`,
        pickup_location: bookingData.pickupLocation,
        return_location: bookingData.returnLocation || bookingData.pickupLocation,
        rate_type: bookingData.rateType || 'daily',
        total_price: totalPrice,
        cdw_included: true,
        cdw_price: cdwDetails.price * totalDays,
        customer_first_name: bookingForm.firstName,
        customer_last_name: bookingForm.lastName,
        customer_email: bookingForm.email,
        customer_phone: bookingForm.phoneNumber,
        customer_title: bookingForm.title,
        driving_license: bookingForm.drivingLicense,
        special_requests: bookingForm.additionalRequests || '',
        user_id: parseInt(userid),
        status: 'Paid', // Set to Paid since payment is complete
        payment_method: 'PayPal',
        payment_id: paymentDetails.id,
        payment_status: 'COMPLETED'
      };

      // Call your API to create reservation with payment
      const createdReservation = await createVehicleReservationWithPayment(reservationData);

      if (!createdReservation || !createdReservation.reservation_id) {
        throw new Error('Failed to create vehicle reservation');
      }

      displayToast('success', 'Vehicle booked successfully! Payment confirmed.');

      return createdReservation;

    } catch (error) {
      console.error('Reservation with payment error:', error);
      throw error;
    }
  };

  // You'll need to create this API function
  const createVehicleReservationWithPayment = async (reservationData) => {
    try {
      // You need to update this with your actual API endpoint
      const response = await fetch(`http://localhost:5432/vehicle-reservations/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      });

      if (!response.ok) {
        throw new Error('Failed to create reservation');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const calculateTotalPrice = (pickup, returnDate, rateType = 'daily') => {
    if (pickup && returnDate) {
      const start = new Date(pickup);
      const end = new Date(returnDate);

      // Calculate total days
      const timeDiff = Math.abs(end - start);
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (days > 0) {
        setTotalDays(days);

        // Get base daily rate
        const baseDailyRate = parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0);

        // Calculate discount based on rate type AND minimum days
        let discountMultiplier = 1.00;
        let rateDescription = 'Daily Rate';

        // Check if rate type is valid for the selected days
        if (rateType === 'weekly') {
          if (days >= 7) {
            discountMultiplier = 0.90; // 10% discount for weekly
            rateDescription = 'Weekly Rate (10% off)';
          } else {
            // If less than 7 days but weekly selected, auto-downgrade to daily
            discountMultiplier = 1.00;
            rateDescription = 'Daily Rate (Auto-downgraded)';
          }
        } else if (rateType === 'monthly') {
          if (days >= 30) {
            discountMultiplier = 0.80; // 20% discount for monthly
            rateDescription = 'Monthly Rate (20% off)';
          } else if (days >= 7) {
            // If 7-29 days but monthly selected, auto-downgrade to weekly
            discountMultiplier = 0.90;
            rateDescription = 'Weekly Rate (Auto-downgraded)';
          } else {
            // If less than 7 days, auto-downgrade to daily
            discountMultiplier = 1.00;
            rateDescription = 'Daily Rate (Auto-downgraded)';
          }
        }

        // Calculate base rental amount (with discount applied)
        const baseRateWithoutCDW = baseDailyRate * days * discountMultiplier;

        // Calculate CDW total (no discount on CDW)
        const cdwTotal = cdwDetails.price * days;

        // Calculate weekend surcharge
        let weekendSurcharge = 0;
        let weekendDays = 0;
        let currentDate = new Date(start);

        // Check each day in the rental period
        for (let i = 0; i < days; i++) {
          const dayOfWeek = currentDate.getDay();
          // Saturday (6) or Sunday (0)
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendDays++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate surcharge only on discounted base rate (not including CDW)
        if (weekendDays > 0) {
          // Apply 20% surcharge only to weekend days
          const dailyDiscountedRate = (baseDailyRate * discountMultiplier);
          weekendSurcharge = dailyDiscountedRate * weekendDays * 0.2;
        }

        // Calculate total base price (with CDW)
        const totalBasePriceWithCDW = baseRateWithoutCDW + cdwTotal;

        // Calculate tax (6% SST) on everything
        const taxableAmount = totalBasePriceWithCDW + weekendSurcharge;
        const taxes = taxableAmount * 0.06;

        const finalTotal = totalBasePriceWithCDW + weekendSurcharge + taxes;

        // Set states AFTER calculation
        setTotalPrice(finalTotal);
        setWeekendSurcharge(weekendSurcharge);
        setTotalBasePrice(baseRateWithoutCDW);

        console.log('Price Calculation Breakdown:', {
          days,
          baseDailyRate,
          discountMultiplier,
          baseRateWithoutCDW,
          cdwTotal,
          weekendDays,
          weekendSurcharge,
          taxableAmount,
          taxes,
          finalTotal,
          rateDescription
        });

        return {
          baseDailyRate,
          days,
          discountMultiplier,
          baseRateWithoutCDW,
          cdwTotal,
          weekendDays,
          weekendSurcharge,
          taxes,
          finalTotal,
          rateDescription
        };
      }
    }
    return null;
  };
  const getRateDescription = () => {
    const days = totalDays;
    const rateType = bookingData.rateType || 'daily';

    if (rateType === 'weekly' && days < 7) {
      return `Weekly Rate - Need ${7 - days} more days`;
    }
    if (rateType === 'monthly') {
      if (days < 7) {
        return `Monthly Rate - Need ${30 - days} more days`;
      } else if (days < 30) {
        return `Monthly Rate - Need ${30 - days} more days`;
      }
    }

    return rateType === 'weekly' ? 'Weekly Rate (10% off)' :
      rateType === 'monthly' ? 'Monthly Rate (20% off)' : 'Daily Rate';
  };
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // Validate return date is after pickup date
      if (name === "pickupDate" && value && prev.returnDate) {
        const pickup = new Date(value);
        const returnDate = new Date(prev.returnDate);
        if (pickup >= returnDate) {
          updatedData.returnDate = "";
        }
      }

      // Check if current rate type is still valid for selected dates
      if ((name === "pickupDate" || name === "returnDate") && prev.pickupDate && (prev.returnDate || value)) {
        const pickup = new Date(name === "pickupDate" ? value : prev.pickupDate);
        const returnDate = new Date(name === "returnDate" ? value : prev.returnDate);
        const daysDiff = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));

        if (prev.rateType === 'weekly' && daysDiff < 7) {
          // Auto-downgrade to daily if less than 7 days
          updatedData.rateType = 'daily';
        } else if (prev.rateType === 'monthly' && daysDiff < 30) {
          // Auto-downgrade based on days
          if (daysDiff >= 7) {
            updatedData.rateType = 'weekly';
          } else {
            updatedData.rateType = 'daily';
          }
        }
      }

      return updatedData;
    });

    if (name === "pickupDate" || name === "returnDate") {
      calculateTotalPrice(
        name === "pickupDate" ? value : bookingData.pickupDate,
        name === "returnDate" ? value : bookingData.returnDate,
        bookingData.rateType || 'daily'
      );
    }
  };
  // This handleFormChange is already defined above

  const handleAddToCart = async (e) => {
    e.preventDefault();
    console.log('Starting vehicle reservation...');

    const userid = localStorage.getItem('userid');

    if (!userid) {
      displayToast('error', 'Please login first');
      return;
    }

    if (!bookingForm.firstName || !bookingForm.lastName || !bookingForm.email ||
      !bookingForm.phoneNumber || !bookingForm.drivingLicense) {
      displayToast('error', 'Please fill all required fields including driving license');
      return;
    }

    if (!bookingData.pickupDate || !bookingData.returnDate) {
      displayToast('error', 'Please select pickup and return dates');
      return;
    }

    try {
      const reservationData = {
        vehicle_id: vehicleDetails.id,
        pickup_datetime: `${bookingData.pickupDate}T${bookingData.pickupTime}:00`,
        return_datetime: `${bookingData.returnDate}T${bookingData.returnTime}:00`,
        pickup_location: bookingData.pickupLocation,
        return_location: bookingData.returnLocation || bookingData.pickupLocation,
        rate_type: bookingData.rateType || 'daily',
        total_price: totalPrice,
        cdw_included: true,
        cdw_price: cdwDetails.price * totalDays,
        customer_first_name: bookingForm.firstName,
        customer_last_name: bookingForm.lastName,
        customer_email: bookingForm.email,
        customer_phone: bookingForm.phoneNumber,
        customer_title: bookingForm.title,
        driving_license: bookingForm.drivingLicense,
        special_requests: bookingForm.additionalRequests || '',
        user_id: parseInt(userid),
        status: 'Pending'
      };

      // You'll need to update your API functions for vehicles
      const createdReservation = await createReservation(reservationData);

      if (!createdReservation || !createdReservation.reservation_id) {
        throw new Error('Failed to create vehicle reservation');
      }

      displayToast('success', 'Vehicle reservation added to cart!');

      setTimeout(() => {
        setShowBookingForm(false);
        navigate('/cart');
      }, 2000);

    } catch (error) {
      console.error('Reservation error:', error);
      displayToast('error', 'Failed to create reservation: ' + error.message);
    }
  };

  const fetchUserInfo = async () => {
    const userid = localStorage.getItem('userid');
    if (!userid) return;

    try {
      const userData = await fetchUserData(userid);
      console.log('User information:', userData);

      setBookingForm(prev => ({
        ...prev,
        title: userData.utitle || 'Mr.',
        firstName: userData.ufirstname || '',
        lastName: userData.ulastname || '',
        email: userData.uemail || '',
        phoneNumber: userData.uphoneno || '',
        additionalRequests: ''
      }));
    } catch (error) {
      console.error('Failed to get user information:', error);
    }
  };

  const displayToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };



  useEffect(() => {
    if (showBookingForm) {
      fetchUserInfo();
    }
  }, [showBookingForm]);

  // Scroll locking effects
  useEffect(() => {
    if (showAllPhotos) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showAllPhotos]);

  useEffect(() => {
    if (showBookingForm) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showBookingForm]);

  useEffect(() => {
    if (isFullscreen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isFullscreen]);

  return (
    <div>
      <div className="Vehicle_Details_Main_Container">
        <AuthProvider>
          <Navbar />
          <div className="vehicle-details-main-container">
            {/* Single Stretched Image */}
            <div className="single-stretched-image-container">
              {vehiclePhotos[0] && (
                <img
                  src={vehiclePhotos[0]}
                  onClick={() => setShowAllPhotos(true)}
                  className="single-stretched-image"
                  alt={vehicleDetails?.vehicle}
                />
              )}
              <div className="view-all-photos-btn" onClick={() => setShowAllPhotos(true)}>
                View all photos ({vehiclePhotos.length})
              </div>
            </div>

            {/* Mobile Slideshow */}
            <div className="mobile-slideshow">
              {vehiclePhotos.map((photo, index) => (
                <div key={index} className={`slide ${currentSlide === index ? 'active' : ''}`}
                  style={{ transform: `translateX(${100 * (index - currentSlide)}%)`, transition: 'transform 0.3s' }}>
                  <img
                    src={photo}
                    alt={`${vehicleDetails?.vehicle} image ${index + 1}`}
                    onClick={() => setShowAllPhotos(true)}
                  />
                </div>
              ))}

              {vehiclePhotos.length > 1 && (
                <>
                  <button className="slide-nav prev" onClick={prevSlide} aria-label="Previous image">
                    <IoIosArrowBack />
                  </button>

                  <button className="slide-nav next" onClick={nextSlide} aria-label="Next image">
                    <IoIosArrowForward />
                  </button>

                  <div className="slide-indicators">
                    {vehiclePhotos.map((_, index) => (
                      <div
                        key={index}
                        className={`indicator ${currentSlide === index ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Go to image ${index + 1}`}
                      ></div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* All Photos View */}
            {showAllPhotos && (
              <div className="all-photos-view">
                <div className="photos-header">
                  <button className="back-button" onClick={() => setShowAllPhotos(false)}>
                    <IoReturnUpBackOutline /> <span>Back to vehicle</span>
                  </button>
                </div>

                <div className="photos-grid">
                  <div className="photos-container">
                    {vehiclePhotos.map((photo, index) => (
                      <div key={index} className="photo-section">
                        <img
                          src={photo}
                          alt={`${vehicleDetails?.vehicle} - photo ${index + 1}`}
                          onClick={() => handlePhotoClick(index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fullscreen View */}
            {isFullscreen && (
              <div className="fullscreen-overlay">
                <div className="fullscreen-header">
                  <button className="close-btn" onClick={handleCloseFullscreen}>
                    <IoIosClose />
                  </button>
                  <div className="image-counter">
                    {selectedImageIndex + 1} / {vehiclePhotos.length}
                  </div>
                </div>

                <div className="fullscreen-content">
                  <button
                    className="nav-btn prev-btn"
                    onClick={() => setSelectedImageIndex((prev) =>
                      prev === 0 ? (vehiclePhotos.length || 0) - 1 : prev - 1
                    )}
                  >
                    <IoIosArrowBack />
                  </button>

                  {vehiclePhotos[selectedImageIndex] && (
                    <img
                      src={vehiclePhotos[selectedImageIndex]}
                      alt={`${vehicleDetails?.vehicle} fullscreen view`}
                      className="fullscreen-image"
                    />
                  )}

                  <button
                    className="nav-btn next-btn"
                    onClick={() => setSelectedImageIndex((prev) =>
                      prev === (vehiclePhotos.length || 0) - 1 ? 0 : prev + 1
                    )}
                  >
                    <IoIosArrowForward />
                  </button>
                </div>
              </div>
            )}

            {/* Details Container */}
            <div className="Details_container">
              <div className="Description_container">
                <div className="first_container">
                  <div className="Vehicle_name_container">
                    <h2 className="Vehicle_name">{vehicleDetails?.vehicle}</h2>
                    <div className='Rating_Container'>
                      {vehicleDetails?.rating ? (
                        <>
                          <p className="Rating_score">
                            {Number.isInteger(vehicleDetails.rating)
                              ? vehicleDetails.rating.toFixed(1)
                              : vehicleDetails.rating.toFixed(2).replace(/\.?0+$/, '')}
                          </p>
                          <FaStar className='icon_star' />
                          <button className="show-reviews-btn" onClick={() => setShowReviews(true)}>
                            {vehicleDetails.reviews_count || 0} reviews
                          </button>
                        </>
                      ) : (
                        <button className="show-reviews-btn" onClick={() => setShowReviews(true)}>
                          No reviews yet
                        </button>
                      )}
                    </div>
                  </div>

                  <Reviews
                    isOpen={showReviews}
                    onClose={() => setShowReviews(false)}
                    vehicleId={vehicleDetails?.id}
                  />

                  <div className="sub_details">
                    <div className="Vehicle_feature">
                      <FaCar className="icon_vehicle" />
                      <p>{vehicleDetails?.brand_name || vehicleDetails?.brand || 'Brand'}</p>
                    </div>

                    <div className="Vehicle_feature">
                      <MdAirlineSeatReclineNormal className="icon_seats" />
                      <p>{vehicleDetails?.seat || 5} Seats</p>
                    </div>

                    <div className="Vehicle_feature">
                      <GiGearStickPattern className="icon_transmission" />
                      <p>{vehicleDetails?.transmission_name || 'Transmission'}</p>
                    </div>
                  </div>

                  <hr className="custom-line" />

                  {/* Vehicle Features */}
                  <div className="Vehicle_features_container">
                    <h2 className="Features_text">Vehicle Features</h2>
                    <div className="features-grid">
                      {vehicleFeatures.slice(0, 5).map((feature, index) => (
                        <div key={index} className="feature-item">
                          {feature.icon}
                          <div className="feature-info">
                            <span className="feature-name">{feature.name}</span>
                            <span className="feature-value">{feature.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CDW Information */}
                  <div className="CDW_Container">
                    <h2 className="CDW_text">
                      <FaShieldAlt className="cdw-icon" />
                      Collision Damage Waiver (CDW)
                    </h2>
                    <hr className="custom-line" />
                    <div className="cdw-details">
                      <div className="cdw-item">
                        <FaCheckCircle className="cdw-check" />
                        <span>CDW included in price: <strong>RM{cdwDetails.price.toFixed(2)}/day</strong></span>
                      </div>
                      <div className="cdw-item">
                        <FaCheckCircle className="cdw-check" />
                        <span>Coverage: {cdwDetails.coverage}</span>
                      </div>
                      <div className="cdw-item">
                        <FaCheckCircle className="cdw-check" />
                        <span>Excess amount: {cdwDetails.excess}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="Terms_Container">
                    <h2 className="Terms_text">Terms & Conditions</h2>
                    <hr className="custom-line" />
                    <ul className="terms-list">
                      <li>Minimum rental period: 1 day</li>
                      <li>Driver must be 21+ years old with valid license</li>
                      <li>Free mileage included</li>
                      <li>Fuel policy: Same level return</li>
                    </ul>
                  </div>
                </div>

                {/* Booking Card */}
                <div className="second_container">
                  <div className="booking_card">
                    <div className="price_section">
                      <span className="vehicle_price">RM{parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0).toFixed(2)}</span>
                      <span className="price_day">/day</span>
                    </div>

                    <div className="rates_section">
                      <div className="rate-options">
                        <button
                          className={`rate-option ${bookingData.rateType === 'daily' ? 'active' : ''}`}
                          onClick={() => {
                            setBookingData({ ...bookingData, rateType: 'daily' });
                            calculateTotalPrice(bookingData.pickupDate, bookingData.returnDate, 'daily');
                          }}
                        >
                          Daily
                        </button>
                        <button
                          className={`rate-option ${bookingData.rateType === 'weekly' ? 'active' : ''}`}
                          onClick={() => {
                            // If weekly selected and less than 7 days, adjust return date
                            if (bookingData.pickupDate) {
                              const pickup = new Date(bookingData.pickupDate);
                              const currentReturn = bookingData.returnDate ? new Date(bookingData.returnDate) : new Date(pickup);
                              const daysDiff = Math.ceil((currentReturn - pickup) / (1000 * 60 * 60 * 24));

                              if (daysDiff < 7) {
                                // Set minimum 7 days for weekly rate
                                const minReturnDate = new Date(pickup);
                                minReturnDate.setDate(pickup.getDate() + 7);

                                setBookingData(prev => ({
                                  ...prev,
                                  rateType: 'weekly',
                                  returnDate: minReturnDate.toISOString().split('T')[0]
                                }));
                                calculateTotalPrice(bookingData.pickupDate, minReturnDate.toISOString().split('T')[0], 'weekly');
                              } else {
                                setBookingData(prev => ({ ...prev, rateType: 'weekly' }));
                                calculateTotalPrice(bookingData.pickupDate, bookingData.returnDate, 'weekly');
                              }
                            } else {
                              setBookingData(prev => ({ ...prev, rateType: 'weekly' }));
                            }
                          }}
                        >
                          Weekly (Save 10%) - Min. 7 days
                        </button>
                        <button
                          className={`rate-option ${bookingData.rateType === 'monthly' ? 'active' : ''}`}
                          onClick={() => {
                            // If monthly selected and less than 30 days, adjust return date
                            if (bookingData.pickupDate) {
                              const pickup = new Date(bookingData.pickupDate);
                              const currentReturn = bookingData.returnDate ? new Date(bookingData.returnDate) : new Date(pickup);
                              const daysDiff = Math.ceil((currentReturn - pickup) / (1000 * 60 * 60 * 24));

                              if (daysDiff < 30) {
                                // Set minimum 30 days for monthly rate
                                const minReturnDate = new Date(pickup);
                                minReturnDate.setDate(pickup.getDate() + 30);

                                setBookingData(prev => ({
                                  ...prev,
                                  rateType: 'monthly',
                                  returnDate: minReturnDate.toISOString().split('T')[0]
                                }));
                                calculateTotalPrice(bookingData.pickupDate, minReturnDate.toISOString().split('T')[0], 'monthly');
                              } else {
                                setBookingData(prev => ({ ...prev, rateType: 'monthly' }));
                                calculateTotalPrice(bookingData.pickupDate, bookingData.returnDate, 'monthly');
                              }
                            } else {
                              setBookingData(prev => ({ ...prev, rateType: 'monthly' }));
                            }
                          }}
                        >
                          Monthly (Save 20%) - Min. 30 days
                        </button>
                      </div>
                    </div>

                    <div className="dates_section">
                      <div className="date_input">
                        <div className="date_label">PICK-UP DATE <span className="required-star">*</span></div>
                        <input
                          type="date"
                          name="pickupDate"
                          className="date_picker"
                          value={bookingData.pickupDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                        {!bookingData.pickupDate && (
                          <div className="field-hint">Select pickup date first</div>
                        )}
                      </div>

                      <div className="date_input">
                        <div className="date_label">RETURN DATE <span className="required-star">*</span></div>
                        <input
                          type="date"
                          name="returnDate"
                          className="date_picker"
                          value={bookingData.returnDate}
                          onChange={handleInputChange}
                          disabled={!bookingData.pickupDate}
                          min={
                            bookingData.pickupDate
                              ? (() => {
                                const pickup = new Date(bookingData.pickupDate);
                                const minDate = new Date(pickup);

                                // Set minimum based on rate type
                                if (bookingData.rateType === 'weekly') {
                                  minDate.setDate(pickup.getDate() + 7); // Min 7 days for weekly
                                } else if (bookingData.rateType === 'monthly') {
                                  minDate.setDate(pickup.getDate() + 30); // Min 30 days for monthly
                                } else {
                                  minDate.setDate(pickup.getDate() + 1); // Min 1 day for daily
                                }

                                return minDate.toISOString().split('T')[0];
                              })()
                              : ""
                          }
                          required
                        />
                        {!bookingData.pickupDate && (
                          <div className="field-hint">Select pickup date first</div>
                        )}
                        {bookingData.pickupDate && !bookingData.returnDate && (
                          <div className="field-hint">Select return date to calculate price</div>
                        )}
                      </div>
                    </div>

                    <div className="time_section">
                      <div className="time_input">
                        <div className="time_label">PICK-UP TIME</div>
                        <input
                          type="time"
                          name="pickupTime"
                          className="time_picker"
                          value={bookingData.pickupTime}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="time_input">
                        <div className="time_label">RETURN TIME</div>
                        <input
                          type="time"
                          name="returnTime"
                          className="time_picker"
                          value={bookingData.returnTime}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="price_details">
                      {totalDays > 0 && (
                        <>
                          <div className="price_item">
                            <div>
                              {getRateDescription()}
                              <span className="days-count"> × {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                            </div>
                            <div>RM {totalBasePrice.toFixed(2)}</div>
                          </div>

                          <div className="price_item">
                            <div>CDW (RM{cdwDetails.price.toFixed(2)}/day)</div>
                            <div>RM {(cdwDetails.price * totalDays).toFixed(2)}</div>
                          </div>

                          {weekendSurcharge > 0 && (
                            <div className="price_item discount">
                              <div>Weekend Surcharge (20%)</div>
                              <div>RM {weekendSurcharge.toFixed(2)}</div>
                            </div>
                          )}

                          <div className="price_item tax">
                            <div>Service Tax (6% SST)</div>
                            <div>RM {((totalBasePrice + (cdwDetails.price * totalDays) + weekendSurcharge) * 0.06).toFixed(2)}</div>
                          </div>

                          <div className="price_total">
                            <div><strong>Total (MYR)</strong></div>
                            <div><strong>RM {totalPrice.toFixed(2)}</strong></div>
                          </div>
                        </>
                      )}
                    </div>

                    <br /><br />
                    <button
                      className="reserve_button"
                      onClick={() => {
                        if (!bookingData.pickupDate || !bookingData.returnDate) {
                          displayToast('error', 'Please select pickup and return dates first');
                          return;
                        }
                        setShowBookingForm(true);
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form Modal */}
            {showBookingForm && (
              <div className="booking-overlay">
                <div className="booking-modal vehicle-booking-modal">
                  <div className="booking-header">
                    <button className="back-button" onClick={() => setShowBookingForm(false)}>
                      <IoReturnUpBackOutline /> <span>Complete Your Booking</span>
                    </button>
                  </div>

                  <div className="booking-content">
                    {/* Left Side - Driver Information */}
                    <div className="booking-left">
                      <div className="driver-details-section">
                        <h2>Driver Information</h2>
                        <div className="form-grid">
                          {/* Title Selection */}
                          <div className="form-group title-group">
                            <label>Title *</label>
                            <div className="title-options">
                              {['Mr.', 'Mrs.', 'Ms.', 'Dr.'].map(title => (
                                <label className="radio-label" key={title}>
                                  <input
                                    type="radio"
                                    name="title"
                                    value={title}
                                    checked={bookingForm.title === title}
                                    onChange={handleFormChange}
                                    required
                                  />
                                  <span>{title}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* First Name */}
                          <div className="form-group">
                            <label>First Name *</label>
                            <input
                              type="text"
                              name="firstName"
                              value={bookingForm.firstName}
                              onChange={handleFormChange}
                              placeholder="Enter your first name"
                              required
                            />
                          </div>

                          {/* Last Name */}
                          <div className="form-group">
                            <label>Last Name *</label>
                            <input
                              type="text"
                              name="lastName"
                              value={bookingForm.lastName}
                              onChange={handleFormChange}
                              placeholder="Enter your last name"
                              required
                            />
                          </div>

                          {/* Email Address */}
                          <div className="form-group">
                            <label>Email Address *</label>
                            <input
                              type="email"
                              name="email"
                              value={bookingForm.email}
                              onChange={handleFormChange}
                              placeholder="Enter your email address"
                              required
                            />
                          </div>

                          {/* Phone Number */}
                          <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={bookingForm.phoneNumber}
                              onChange={handleFormChange}
                              placeholder="Enter your phone number"
                              required
                            />
                          </div>

                          {/* Driving License Number */}
                          <div className="form-group">
                            <label>Driving License Number *</label>
                            <input
                              type="text"
                              name="drivingLicense"
                              value={bookingForm.drivingLicense}
                              onChange={handleFormChange}
                              placeholder="Enter your driving license number"
                              required
                            />
                          </div>

                          {/* Additional Requests (Optional) */}
                          <div className="form-group full-width">
                            <label>Additional Requests (Optional)</label>
                            <textarea
                              name="additionalRequests"
                              value={bookingForm.additionalRequests}
                              onChange={handleFormChange}
                              placeholder="Any special requests or instructions"
                              rows="3"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="cart-actions">
                        <button
                          className="add-to-cart-btn"
                          onClick={addToCart}
                          disabled={!validateBookingForm()}
                        >
                          <span className="cart-icon">🛒</span>
                          Add to Cart & Pay Later
                        </button>

                        <p className="cart-benefits">
                          ✓ Reserve for 24 hours<br />
                          ✓ No payment required now<br />
                          ✓ Add multiple vehicles<br />
                          ✓ Complete checkout anytime
                        </p>
                      </div>
                    </div>

                    {/* Right Side - Booking Summary */}
                    <div className="booking-right">
                      <div className="vehicle-card">
                        <img
                          src={vehiclePhotos[0] || '/default-car.png'}
                          alt={vehicleDetails?.vehicle}
                        />
                        <div className="vehicle-info">
                          <h3>{vehicleDetails?.vehicle}</h3>
                          <div className="vehicle-specs">
                            <span><MdAirlineSeatReclineNormal /> {vehicleDetails?.seat || 5} seats</span>
                            <span><GiGearStickPattern /> {vehicleDetails?.transmission_name}</span>
                          </div>
                        </div>
                      </div>

                      {totalDays > 0 && (
                        <div className="price-details">
                          <h3>Booking Summary</h3>
                          <div className="price-breakdown">
                            <div className="price-row">
                              <span>{bookingData.rateType || 'Daily'} Rate × {totalDays} days</span>
                              <span>RM {(parseFloat(vehicleDetails?.pricing?.[bookingData.rateType || 'daily'] || vehicleDetails?.[bookingData.rateType || 'daily'] || 0) * totalDays).toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                              <span>CDW Protection</span>
                              <span>RM {(cdwDetails.price * totalDays).toFixed(2)}</span>
                            </div>
                            <div className="price-row discount">
                              <span>Weekend Surcharge (20%)</span>
                              <span>RM {(totalPrice * 0.2).toFixed(2)}</span>
                            </div>
                            <div className="price-row tax">
                              <span>Service Tax (6% SST)</span>
                              <span>RM {(totalPrice * 0.06).toFixed(2)}</span>
                            </div>
                            <div className="price-total">
                              <span>Total (MYR)</span>
                              <span>RM {totalPrice.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="booking-dates">
                            <h4>Rental Period</h4>
                            <div className="date-item">
                              <FaCalendarAlt />
                              <div>
                                <strong>Pickup:</strong> {bookingData.pickupDate} at {bookingData.pickupTime}
                              </div>
                            </div>
                            <div className="date-item">
                              <FaCalendarAlt />
                              <div>
                                <strong>Return:</strong> {bookingData.returnDate} at {bookingData.returnTime}
                              </div>
                            </div>
                            <div className="date-item">
                              <FaClock />
                              <div>
                                <strong>Duration:</strong> {totalDays} day{totalDays > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Booking Bar */}
            <div className="mobile-booking-bar">
              <div className="mobile-booking-bar-content">
                <div className="mobile-price-info">
                  <h3>RM{parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0).toFixed(2)} <span>/day</span>
                  </h3>
                  {totalDays > 0 && (
                    <span>Total: RM{totalPrice.toFixed(2)} for {totalDays} day{totalDays > 1 ? 's' : ''}</span>
                  )}
                </div>
                <button className="mobile-book-now-btn" onClick={() => {
                  if (!bookingData.pickupDate || !bookingData.returnDate) {
                    displayToast('error', 'Please select dates first');
                    return;
                  }
                  setShowBookingForm(true);
                }}>
                  Book Now
                </button>
              </div>
            </div>

            {/* Features Overlay Modal */}
            {showFeaturesOverlay && (
              <div className="features-overlay">
                <div className="features-modal">
                  <div className="features-header">
                    <h2>Vehicle Features & Specifications</h2>
                    <button
                      className="close-features-btn"
                      onClick={() => setShowFeaturesOverlay(false)}
                    >
                      <IoIosClose />
                    </button>
                  </div>
                  <div className="features-content">
                    <div className="features-section">
                      <h3><FaCar /> Basic Information</h3>
                      <div className="features-grid">
                        <div className="feature-card">
                          <div className="feature-icon">
                            <FaCar />
                          </div>
                          <div className="feature-details">
                            <h4>Vehicle Model</h4>
                            <p>{vehicleDetails?.vehicle || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="feature-card">
                          <div className="feature-icon">
                            <FaCar />
                          </div>
                          <div className="feature-details">
                            <h4>Brand</h4>
                            <p>{vehicleDetails?.brand_name || vehicleDetails?.brand || 'Brand'}</p>
                          </div>
                        </div>
                        <div className="feature-card">
                          <div className="feature-icon">
                            <MdAirlineSeatReclineNormal />
                          </div>
                          <div className="feature-details">
                            <h4>Seating Capacity</h4>
                            <p>{vehicleDetails?.seat || 5} persons</p>
                          </div>
                        </div>
                        <div className="feature-card">
                          <div className="feature-icon">
                            <GiGearStickPattern />
                          </div>
                          <div className="feature-details">
                            <h4>Transmission</h4>
                            <p>{vehicleDetails?.transmission_name || 'Automatic/Manual'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="features-section">
                      <h3><FaGasPump /> Fuel & Performance</h3>
                      <div className="features-grid">
                        <div className="feature-card">
                          <div className="feature-icon">
                            <FaGasPump />
                          </div>
                          <div className="feature-details">
                            <h4>Fuel Type</h4>
                            <p>Petrol</p>
                          </div>
                        </div>
                        <div className="feature-card">
                          <div className="feature-icon">
                            <FaCogs />
                          </div>
                          <div className="feature-details">
                            <h4>Engine Capacity</h4>
                            <p>1.5L</p>
                          </div>
                        </div>
                        <div className="feature-card">
                          <div className="feature-icon">
                            <MdOutlineDirectionsCar />
                          </div>
                          <div className="feature-details">
                            <h4>Mileage</h4>
                            <p>Unlimited (Free mileage)</p>
                          </div>
                        </div>
                        <div className="feature-card">
                          <div className="feature-icon">
                            <FaShieldAlt />
                          </div>
                          <div className="feature-details">
                            <h4>Safety Features</h4>
                            <p>ABS, Airbags, Seat Belts</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="features-section">
                      <h3><FaCheckCircle /> Included Features</h3>
                      <div className="included-features">
                        <ul>
                          <li><FaCheckCircle className="check-icon" /> Free unlimited mileage</li>
                          <li><FaCheckCircle className="check-icon" /> Comprehensive insurance</li>
                          <li><FaCheckCircle className="check-icon" /> 24/7 roadside assistance</li>
                          <li><FaCheckCircle className="check-icon" /> Vehicle registration & road tax</li>
                          <li><FaCheckCircle className="check-icon" /> Standard maintenance</li>
                          <li><FaCheckCircle className="check-icon" /> Theft protection</li>
                          <li><FaCheckCircle className="check-icon" /> Third party liability</li>
                          <li><FaCheckCircle className="check-icon" /> Airport delivery (optional)</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {showToast && <Toast type={toastType} message={toastMessage} />}
          </div>
          <Footer />
        </AuthProvider>
      </div>
    </div>
  );
};

export default VehicleDetails;