import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaStar, FaCar, FaGasPump, FaCogs, FaCalendarAlt, FaClock, FaPhone, FaEnvelope, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { MdAirlineSeatReclineNormal, MdOutlineDirectionsCar } from "react-icons/md";
import { GiGearStickPattern } from "react-icons/gi";
import { AuthProvider } from '../../../Component/AuthContext/AuthContext';
import Navbar from '../../../Component/Navbar/navbar';
import Toast from '../../../Component/Toast/Toast';
import Reviews from '../../../Component/Reviews/Reviews';
import Footer from '../../../Component/Footer/footer';
import './PropertyDetails.css';
import { createReservation, requestBooking, getCoordinates, fetchUserData, checkDateOverlap, fetchExtras, fetchLocations } from '../../../../Api/api';

// Import all vehicle images
import PeroduaMyvi from '../../../public/Perodua Myvi.png';
import PeroduaAxia from '../../../public/Perodua Axia.png';
import HondaCity from '../../../public/Honda City.png';
import ToyotaVios from '../../../public/Toyota Vios.png';
import ProtonSaga from '../../../public/Proton Saga.png';
import PeroduaAlza from '../../../public/Perodua Alza.png';
import PeroduaBezza from '../../../public/Perodua Bezza.png';
import PeroduaMyviNew from '../../../public/Perodua Myvi (New).png';
import ToyotaFortuner from '../../../public/Toyota Fortuner.png';
import ToyotaSienta from '../../../public/Toyota Sienta.png';
import PeroduaAlzaNew from '../../../public/Perodua Alza (New).png';
import PeroduaAruz from '../../../public/Perodua Aruz.png';
import NissanUrvan from '../../../public/Nissan Urvan NV350.png';
import DefaultCar from '../../../public/default-car.png';

const VehicleDetails = () => {
  const [selectedRateType, setSelectedRateType] = useState('daily');
  const [includeCDW, setIncludeCDW] = useState(false);
  const [includeDriver, setIncludeDriver] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [weekendSurcharge, setWeekendSurcharge] = useState(0);
  const [totalHours, setTotalHours] = useState(0); // Add this line
  const [totalBasePrice, setTotalBasePrice] = useState(0);
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('');
  const [extras, setExtras] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [isLoadingExtras, setIsLoadingExtras] = useState(false);
  const { vehicleDetails } = location.state || {};
  const [locations, setLocations] = useState([]);
  const [bookingData, setBookingData] = useState({
    pickupDate: '',
    returnDate: '',
    pickupTime: '',
    returnTime: '',
    pickupLocation: '',
    returnLocation: '',
    rateType: 'daily' // Add rateType to bookingData
  });
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
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

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const [payPalClientId, setPayPalClientId] = useState(
    import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AQnKj2txjl1bnlCBzthuCa7DtxuK3X0PsNlrDhjDwxQasGACq8Y0PGNbaTEEuIDTFe9HGfIOis0tOstU'
  );
  const [vehicleOwnerPayPalId, setVehicleOwnerPayPalId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentError, setPaymentError] = useState('');

  // Helper functions for current time
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getDefaultReturnTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // 2 hours from now as default
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Initialize bookingData with current times
  useEffect(() => {
    const currentTime = getCurrentTime();
    const defaultReturnTime = getDefaultReturnTime();

    setBookingData(prev => ({
      ...prev,
      pickupTime: currentTime,
      returnTime: defaultReturnTime
    }));
  }, []);

  const validateBookingForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'drivingLicense'
    ];

    for (const field of requiredFields) {
      if (!bookingForm[field] || bookingForm[field].trim() === '') {
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingForm.email)) {
      return false;
    }

    if (bookingForm.phoneNumber.length < 8) {
      return false;
    }

    if (!bookingData.pickupDate || !bookingData.returnDate) {
      return false;
    }

    if (!bookingData.pickupLocation) {
      return false;
    }

    if (!acceptTerms) {
      return false;
    }
    return true;
  };

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

    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  useEffect(() => {
    initializeCart();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const result = await fetchLocations();
      if (Array.isArray(result) && result.length > 0) {
        const formattedLocations = result.map(loc => ({
          id: loc.id,
          name: loc.name,
          region_name: loc.region_name || 'Unknown Region'
        }));
        setLocations(formattedLocations);
      } else {
        setLocations([
          { id: 1, name: 'International Airport Kuching', region_name: 'Kuching' },
          { id: 2, name: 'Hilton Hotel', region_name: 'Kuching' },
          { id: 3, name: 'Main Office', region_name: 'Central' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      displayToast('error', 'Could not load locations');
      setLocations([
        { id: 1, name: 'International Airport Kuching', region_name: 'Kuching' },
        { id: 2, name: 'Hilton Hotel', region_name: 'Kuching' },
        { id: 3, name: 'Main Office', region_name: 'Central' }
      ]);
    }
  };

  const initializeCart = () => {
    let storedToken = localStorage.getItem('cartToken');

    if (!storedToken) {
      storedToken = generateCartToken();
      localStorage.setItem('cartToken', storedToken);
      localStorage.setItem(`cart_${storedToken}`, JSON.stringify([]));
    }

    setCartToken(storedToken);

    const cartItems = JSON.parse(localStorage.getItem(`cart_${storedToken}`)) || [];
    setCartCount(cartItems.length);

    cleanupOldCarts(storedToken);
  };

  // Load extras when component mounts
  useEffect(() => {
    loadExtras();
  }, []);

  // Recalculate price when relevant data changes
  useEffect(() => {
    if (bookingData.pickupDate && bookingData.returnDate && bookingData.pickupTime && bookingData.returnTime) {
      const timer = setTimeout(() => {
        calculateTotalPrice(
          bookingData.pickupDate,
          bookingData.returnDate,
          bookingData.pickupTime,
          bookingData.returnTime
        );
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Reset if dates not selected
      setTotalDays(0);
      setTotalPrice(0);
      setWeekendSurcharge(0);
      setTotalBasePrice(0);
    }
  }, [bookingData.pickupDate, bookingData.returnDate, bookingData.pickupTime, bookingData.returnTime, selectedExtras, includeCDW, selectedRateType]);

  const loadExtras = async () => {
    try {
      setIsLoadingExtras(true);
      const result = await fetchExtras();
      if (result.ok && result.data.success) {
        setExtras(result.data.extras);
      } else {
        displayToast('error', 'Failed to load extras');
      }
    } catch (error) {
      console.error('Failed to load extras:', error);
      displayToast('error', 'Could not load extra services');
    } finally {
      setIsLoadingExtras(false);
    }
  };
  // Helper function to get current hour rounded up to next hour
  const getCurrentHour = () => {
    const now = new Date();
    return now.getHours();
  };

  // Helper function to get next hour from current time
  const getNextHour = () => {
    const now = new Date();
    return (now.getHours() + 1) % 24;
  };

  // Generate time options (hour only)
  const generateTimeOptions = (startHour = 0, endHour = 23) => {
    const options = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const formattedHour = hour.toString().padStart(2, '0');
      options.push({
        value: `${formattedHour}:00`,
        label: `${formattedHour}:00`
      });
    }
    return options;
  };
  // Initialize bookingData with current times
  useEffect(() => {
    const currentHour = getCurrentHour();
    const nextHour = getNextHour();

    setBookingData(prev => ({
      ...prev,
      pickupTime: `${currentHour.toString().padStart(2, '0')}:00`,
      returnTime: `${nextHour.toString().padStart(2, '0')}:00`
    }));
  }, []);
  const handleExtraSelection = (extraId, price, name) => {
    setSelectedExtras(prev => {
      const isSelected = prev.some(e => e.id === extraId);
      if (isSelected) {
        return prev.filter(e => e.id !== extraId);
      } else {
        return [...prev, {
          id: extraId,
          price: parseFloat(price) || 0,
          name,
          perDay: false
        }];
      }
    });
  };

  const generateCartToken = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `cart_${timestamp}_${random}`;
  };

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
          localStorage.removeItem(key);
        }
      }
    });
  };


  const addToCart = () => {
    if (!bookingData.pickupDate || !bookingData.returnDate) {
      displayToast('error', 'Please select pickup and return dates first');
      return;
    }

    if (!bookingForm.firstName || !bookingForm.lastName || !bookingForm.email || !bookingForm.phoneNumber) {
      displayToast('error', 'Please fill all required personal information');
      return;
    }

    if (!bookingData.pickupLocation) {
      displayToast('error', 'Please select a pick-up location');
      return;
    }

    if (!acceptTerms) {
      displayToast('error', 'Please accept the terms and conditions');
      return;
    }

    let token = localStorage.getItem('cartToken');
    if (!token) {
      token = generateCartToken();
      localStorage.setItem('cartToken', token);
      localStorage.setItem(`cart_${token}`, JSON.stringify([]));
      setCartToken(token);
    }

    const isSameDay = bookingData.pickupDate === bookingData.returnDate;
    const rateType = isSameDay ? 'hourly' : 'daily';

    const baseDailyRate = parseFloat(
      vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0
    );

    const startDateTime = new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`);
    const endDateTime = new Date(`${bookingData.returnDate}T${bookingData.returnTime}`);

    if (endDateTime <= startDateTime) {
      displayToast('error', 'Return time must be after pickup time');
      return;
    }

    const timeDiffMs = Math.abs(endDateTime - startDateTime);
    const totalHoursCalc = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60)));
    const totalDaysCalc = Math.max(1, Math.ceil(totalHoursCalc / 24));

    let basePrice = 0;
    let quantity = 0;

    if (rateType === 'hourly') {
      const hourlyRate = baseDailyRate / 2;
      quantity = totalHoursCalc;
      basePrice = hourlyRate * quantity;
    } else {
      quantity = totalDaysCalc;
      basePrice = baseDailyRate * quantity;
    }
    let weekendSurcharge = 0;
    if (rateType === 'daily') {
      const calculateWeekendDays = (pickupDate, returnDate) => {
        const start = new Date(pickupDate);
        const end = new Date(returnDate);
        const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

        let weekendDays = 0;
        let currentDate = new Date(start);

        for (let i = 0; i < days; i++) {
          const day = currentDate.getDay();
          if (day === 0 || day === 6) weekendDays++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return weekendDays;
      };

      const weekendDays = calculateWeekendDays(
        bookingData.pickupDate,
        bookingData.returnDate
      );
      weekendSurcharge = baseDailyRate * weekendDays * 0.2;
    }
    const extrasTotal = selectedExtras.reduce((sum, extra) => {
      if (rateType === 'daily' && extra.perDay) {
        return sum + (parseFloat(extra.price) || 0) * totalDaysCalc;
      }
      return sum + (parseFloat(extra.price) || 0);
    }, 0);

    const cdwDaily = parseFloat(vehicleDetails?.pricing?.cdw || 0);
    let cdwTotal = 0;
    if (includeCDW) {
      cdwTotal =
        rateType === 'daily'
          ? cdwDaily * totalDaysCalc
          : cdwDaily * Math.max(1, Math.ceil(totalHoursCalc / 24));
    }

    const subtotalBeforeTax = basePrice + weekendSurcharge + extrasTotal + cdwTotal;
    const taxAmount = subtotalBeforeTax * 0.08;
    const finalTotal = subtotalBeforeTax + taxAmount;

    const cartItem = {
      id: `${vehicleDetails.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      vehicle_id: vehicleDetails.id,
      vehicle: vehicleDetails.vehicle,
      brand: vehicleDetails.brand_name || vehicleDetails.brand,
      seats: vehicleDetails.seat || 5,
      transmission: vehicleDetails.transmission_name || 'Automatic',
      price_per_day: baseDailyRate,
      rate_type: rateType,
      include_cdw: includeCDW,
      cdw_total: cdwTotal,
      include_driver: includeDriver,
      others: {
        cdw_included: includeCDW,
        driver_included: includeDriver,
        cdw_amount: cdwTotal,
        driver_amount: 0,
        description: `${includeCDW ? 'CDW, ' : ''}${includeDriver ? 'Driver' : ''}`.replace(/, $/, '')
      },

      accept_terms: acceptTerms,
      pickup_date: bookingData.pickupDate,
      return_date: bookingData.returnDate,
      pickup_time: bookingData.pickupTime,
      return_time: bookingData.returnTime,
      pickup_location: bookingData.pickupLocation,
      pickup_location_id: bookingData.pickupLocationId,
      return_location: bookingData.returnLocation || bookingData.pickupLocation,
      return_location_id: bookingData.returnLocationId || bookingData.pickupLocationId,
      title: bookingForm.title,
      first_name: bookingForm.firstName,
      last_name: bookingForm.lastName,
      email: bookingForm.email,
      phone: bookingForm.phoneNumber,
      driving_license: bookingForm.drivingLicense || '',
      additional_requests: bookingForm.additionalRequests || '',
      selected_extras: selectedExtras.map(extra => ({
        id: extra.id,
        name: extra.name,
        price: extra.price
      })),
      extras_total: extrasTotal,
      total_hours: rateType === 'hourly' ? quantity : 0,
      total_days: rateType === 'daily' ? quantity : 0,
      base_price: basePrice,
      weekend_surcharge: weekendSurcharge,
      tax_amount: taxAmount,
      total_price: finalTotal,
      payment_status: 'pending',
      status: 'in_cart',
      added_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      image_url: vehiclePhotos[0] || DefaultCar
    };
    const existingCart = JSON.parse(localStorage.getItem(`cart_${token}`)) || [];

    const hasConflict = existingCart.some(item => {
      if (item.vehicle_id === cartItem.vehicle_id) {
        const a = new Date(item.pickup_date);
        const b = new Date(item.return_date);
        const c = new Date(cartItem.pickup_date);
        const d = new Date(cartItem.return_date);
        return c < b && d > a;
      }
      return false;
    });

    if (hasConflict) {
      displayToast('error', 'This vehicle has scheduling conflict with existing items in cart');
      return;
    }

    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem(`cart_${token}`, JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);

    displayToast('success', `Vehicle added to cart! Total: RM${finalTotal.toFixed(2)}`);

    navigate('/cart');
  };


  const calculateWeekendDays = (pickupDate, returnDate) => {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const timeDiff = Math.abs(end - start);
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    let weekendDays = 0;
    let currentDate = new Date(start);

    for (let i = 0; i < days; i++) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        weekendDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weekendDays;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getVehicleImage = (vehicleName) => {
    if (!vehicleName) return DefaultCar;

    const vehicleNameLower = vehicleName.toLowerCase().trim();

    const vehicleImageMap = {
      'perodua myvi': PeroduaMyvi,
      'perodua axia': PeroduaAxia,
      'honda city': HondaCity,
      'toyota vios': ToyotaVios,
      'proton saga': ProtonSaga,
      'perodua alza': PeroduaAlza,
      'perodua bezza': PeroduaBezza,
      'perodua myvi (new)': PeroduaMyviNew,
      'toyota fortuner': ToyotaFortuner,
      'toyota sienta': ToyotaSienta,
      'perodua alza (new)': PeroduaAlzaNew,
      'perodua aruz': PeroduaAruz,
      'nissan urvan nv350': NissanUrvan,
    };

    const exactMatch = vehicleImageMap[vehicleNameLower];
    if (exactMatch) return exactMatch;

    for (const [key, value] of Object.entries(vehicleImageMap)) {
      if (vehicleNameLower.includes(key)) {
        return value;
      }
    }

    return DefaultCar;
  };

  const getVehiclePhotos = () => {
    const mainImage = getVehicleImage(vehicleDetails?.vehicle);

    let additionalPhotos = [];

    if (vehicleDetails?.photo) {
      if (Array.isArray(vehicleDetails.photo)) {
        additionalPhotos = vehicleDetails.photo.filter(photo => {
          return typeof photo === 'string' && photo.trim().length > 0;
        });
      } else if (typeof vehicleDetails.photo === 'string') {
        additionalPhotos = vehicleDetails.photo.split(',').map(p => p.trim()).filter(p => p.length > 0);
      }
    }

    const allPhotos = [mainImage, ...additionalPhotos].filter(Boolean);
    return allPhotos;
  };

  // Get photos array
  const vehiclePhotos = getVehiclePhotos();


  const calculateTotalPrice = (pickup, returnDate, pickupTime = "09:00", returnTime = "17:00") => {
    if (pickup && returnDate && pickupTime && returnTime) {
      try {
        // Format times to 24-hour format
        const formatTime = (time) => {
          if (!time) return "09:00";
          let cleanTime = time.toString().toUpperCase().replace(/\s/g, '');

          if (cleanTime.includes("AM") || cleanTime.includes("PM")) {
            const timePart = cleanTime.replace(/[APM]/g, '');
            const [hours, minutes] = timePart.split(":").map(Number);
            let hour = hours;

            if (cleanTime.includes("PM") && hour < 12) hour += 12;
            if (cleanTime.includes("AM") && hour === 12) hour = 0;

            return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          return cleanTime;
        };

        const formattedPickupTime = formatTime(pickupTime);
        const formattedReturnTime = formatTime(returnTime);
        const driverTotal = includeDriver ? 0 : 0;
        const startDateTime = new Date(`${pickup}T${formattedPickupTime}`);
        const endDateTime = new Date(`${returnDate}T${formattedReturnTime}`);

        // Ensure end is after start
        if (endDateTime <= startDateTime) {
          setTotalDays(0);
          setTotalHours(0);
          setTotalPrice(0);
          setWeekendSurcharge(0);
          setTotalBasePrice(0);
          return null;
        }

        // Calculate total hours
        const timeDiffMs = Math.abs(endDateTime - startDateTime);
        const totalHoursCalc = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60)));
        const totalDaysCalc = Math.max(1, Math.ceil(totalHoursCalc / 24));

        // Get base daily rate
        const baseDailyRate = parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0);

        // AUTO-DETECT RATE TYPE:
        // Same day = Hourly, Different days = Daily
        const isSameDay = pickup === returnDate;
        let rateType = isSameDay ? 'hourly' : 'daily';
        let basePrice = 0;
        let quantity = 0;

        if (rateType === 'hourly') {
          // Hourly rate = daily rate / 2
          const hourlyRate = baseDailyRate / 2;
          quantity = totalHoursCalc;
          basePrice = hourlyRate * quantity;
          setTotalHours(quantity);
          setTotalDays(0);
        } else {
          // Daily rate
          quantity = totalDaysCalc;
          basePrice = baseDailyRate * quantity;
          setTotalDays(quantity);
          setTotalHours(0);
        }

        // Calculate weekend surcharge (only for daily rates)
        let weekendSurchargeCalc = 0;
        if (rateType === 'daily') {
          const weekendDays = calculateWeekendDays(pickup, returnDate);
          weekendSurchargeCalc = baseDailyRate * weekendDays * 0.2;
        }

        // Calculate extras total (per day for daily rates, per rental for hourly)
        const extrasTotal = selectedExtras.reduce((sum, extra) => {
          if (rateType === 'daily' && extra.perDay) {
            return sum + (parseFloat(extra.price) || 0) * totalDaysCalc;
          }
          return sum + (parseFloat(extra.price) || 0);
        }, 0);

        // Calculate CDW
        const cdwDaily = parseFloat(vehicleDetails?.pricing?.cdw || 0);
        let cdwTotal = 0;
        if (includeCDW) {
          if (rateType === 'daily') {
            cdwTotal = cdwDaily * totalDaysCalc;
          } else {
            // For hourly, CDW is per day (minimum 1 day)
            cdwTotal = cdwDaily * Math.max(1, Math.ceil(totalHoursCalc / 24));
          }
        }

        // Calculate totals
        const subtotalBeforeTax = basePrice + weekendSurcharge + extrasTotal + cdwTotal + driverTotal;
        const taxAmount = subtotalBeforeTax * 0.08;
        const finalTotal = subtotalBeforeTax + taxAmount;

        // Update state
        setTotalPrice(finalTotal);
        setWeekendSurcharge(weekendSurchargeCalc);
        setTotalBasePrice(basePrice);

        return {
          rateType,
          basePrice,
          weekendSurcharge: weekendSurchargeCalc,
          extrasTotal,
          cdwTotal,
          taxAmount,
          finalTotal,
          totalHours: totalHoursCalc,
          totalDays: totalDaysCalc
        };
      } catch (error) {
        console.error('Error calculating price:', error);
        setTotalDays(0);
        setTotalHours(0);
        setTotalPrice(0);
        setWeekendSurcharge(0);
        setTotalBasePrice(0);
      }
    } else {
      setTotalDays(0);
      setTotalHours(0);
      setTotalPrice(0);
      setWeekendSurcharge(0);
      setTotalBasePrice(0);
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setBookingData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // Handle date validation
      if (name === "pickupDate" && value && prev.returnDate) {
        const pickup = new Date(value);
        const returnDate = new Date(prev.returnDate);
        if (pickup >= returnDate) {
          updatedData.returnDate = "";
          updatedData.returnTime = ""; // Reset return time when date changes
        }
      }

      // Handle pickup time change - reset return time if invalid
      if (name === "pickupTime" && value) {
        if (prev.returnDate === prev.pickupDate && prev.returnTime) {
          const pickupHour = parseInt(value.split(':')[0]);
          const returnHour = parseInt(prev.returnTime.split(':')[0]);
          if (returnHour <= pickupHour) {
            updatedData.returnTime = `${(pickupHour + 1).toString().padStart(2, '0')}:00`;
          }
        }
      }

      return updatedData;
    });
  };

  // Handle rate type selection
  const handleRateTypeChange = (rateType) => {
    setSelectedRateType(rateType);
    setBookingData(prev => ({ ...prev, rateType }));
  };

  const fetchUserInfo = async () => {
    const userid = localStorage.getItem('userid');
    if (!userid) return;

    try {
      const userData = await fetchUserData(userid);
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

  // Vehicle features
  const vehicleFeatures = [
    { name: "Seats", icon: <MdAirlineSeatReclineNormal className="feature-icon" />, value: vehicleDetails?.seat || 5 },
    { name: "Transmission", icon: <GiGearStickPattern className="feature-icon" />, value: vehicleDetails?.transmission_name || (vehicleDetails?.transmission === 1 ? 'Automatic' : 'Manual') },
    { name: "Fuel Type", icon: <FaGasPump className="feature-icon" />, value: "Petrol" },
    { name: "Engine", icon: <FaCogs className="feature-icon" />, value: "1.5L" },
    { name: "Mileage", icon: <MdOutlineDirectionsCar className="feature-icon" />, value: "Unlimited" },
  ];

  return (
    <div>
      <div className="Vehicle_Details_Main_Container">
        <AuthProvider>
          <Navbar />
          <div className="vehicle-details-main-container">
            {/* Main Vehicle Image */}
            <div className="vehicle-main-image-container">
              {vehiclePhotos[0] && (
                <img
                  src={vehiclePhotos[0]}
                  className="vehicle-main-image"
                  alt={vehicleDetails?.vehicle}
                />
              )}
            </div>

            {/* View All Photos Button
            <div className="view-photos-button-container">
              <button
                className="view-all-photos-btn"
                onClick={() => setShowAllPhotos(true)}
              >
                View all photos ({vehiclePhotos.length})
              </button>
            </div> */}

            {/* Details Container */}
            <div className="Details_container">
              <div className="main-layout">
                {/* Left Side - Vehicle Details */}
                <div className="left-side">
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

                    {/* Vehicle Rates Display */}
                    <div className="rates-display-section">
                      <h3 className="rates-title">Rental Rates</h3>
                      <div className="rates-display">
                        {/* Always show hourly rate (daily rate ÷ 2) */}
                        <div className="rate-display-item">
                          <span className="rate-label">Hourly:</span>
                          <span className="rate-value">
                            RM{(parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0) / 2).toFixed(2)}/hour
                          </span>
                        </div>

                        <div className="rate-display-item">
                          <span className="rate-label">Daily:</span>
                          <span className="rate-value">
                            RM{parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0).toFixed(2)}/day
                          </span>
                        </div>

                        {vehicleDetails?.pricing?.weekly > 0 && (
                          <div className="rate-display-item">
                            <span className="rate-label">Weekly:</span>
                            <span className="rate-value">
                              RM{parseFloat(vehicleDetails?.pricing?.weekly || 0).toFixed(2)}/week
                            </span>
                          </div>
                        )}

                        {vehicleDetails?.pricing?.monthly > 0 && (
                          <div className="rate-display-item">
                            <span className="rate-label">Monthly:</span>
                            <span className="rate-value">
                              RM{parseFloat(vehicleDetails?.pricing?.monthly || 0).toFixed(2)}/month
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <hr className="custom-line" />

                    {/* Driver Information */}
                    <div className="driver-info-section">
                      <h3 className="section-title">Driver Information</h3>
                      <div className="form-grid-compact">
                        <div className="form-group-compact title-group">
                          <label>Title *</label>
                          <div className="title-options-compact">
                            {['Mr.', 'Mrs.', 'Ms.', 'Dr.'].map(title => (
                              <label className="radio-label-compact" key={title}>
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

                        <div className="form-row-compact">
                          <div className="form-group-compact">
                            <label>First Name *</label>
                            <input
                              type="text"
                              name="firstName"
                              value={bookingForm.firstName}
                              onChange={handleFormChange}
                              placeholder="First name"
                              required
                            />
                          </div>
                          <div className="form-group-compact">
                            <label>Last Name *</label>
                            <input
                              type="text"
                              name="lastName"
                              value={bookingForm.lastName}
                              onChange={handleFormChange}
                              placeholder="Last name"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-row-compact">
                          <div className="form-group-compact">
                            <label>Email *</label>
                            <input
                              type="email"
                              name="email"
                              value={bookingForm.email}
                              onChange={handleFormChange}
                              placeholder="Email address"
                              required
                            />
                          </div>
                          <div className="form-group-compact">
                            <label>Phone *</label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={bookingForm.phoneNumber}
                              onChange={handleFormChange}
                              placeholder="Phone number"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group-compact">
                          <label>Driving License No. *</label>
                          <input
                            type="text"
                            name="drivingLicense"
                            value={bookingForm.drivingLicense}
                            onChange={handleFormChange}
                            placeholder="Driving license number"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Booking Form */}
                <div className="right-side">
                  <div className="booking_card">
                    {/* Price Section */}
                    <div className="price_section">
                      <span className="vehicle_price">From RM{parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0).toFixed(2)}</span>
                      <span className="price_day">/day</span>
                    </div>

                    {/* Dates Section */}
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
                          min={bookingData.pickupDate || new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>

                    {/* Time Section */}
                    <div className="time_section">
                      <div className="time_input">
                        <div className="time_label">PICK-UP TIME</div>
                        <select
                          name="pickupTime"
                          className="time_dropdown"
                          value={bookingData.pickupTime}
                          onChange={handleInputChange}
                          disabled={!bookingData.pickupDate}
                        >
                          <option value="">Select time</option>
                          {(() => {
                            // Generate pickup time options based on selected date
                            const isToday = bookingData.pickupDate === new Date().toISOString().split("T")[0];
                            const startHour = isToday ? getCurrentHour() : 0;
                            const timeOptions = generateTimeOptions(startHour, 23);

                            return timeOptions.map((option, index) => (
                              <option key={`pickup-${index}`} value={option.value}>
                                {option.label}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div className="time_input">
                        <div className="time_label">RETURN TIME</div>
                        <select
                          name="returnTime"
                          className="time_dropdown"
                          value={bookingData.returnTime}
                          onChange={handleInputChange}
                          disabled={!bookingData.pickupDate || !bookingData.returnDate}
                        >
                          <option value="">Select time</option>
                          {(() => {
                            if (!bookingData.pickupDate || !bookingData.returnDate || !bookingData.pickupTime) {
                              return null;
                            }

                            const isSameDay = bookingData.pickupDate === bookingData.returnDate;
                            const pickupHour = parseInt(bookingData.pickupTime.split(':')[0]);
                            const isToday = bookingData.returnDate === new Date().toISOString().split("T")[0];

                            let startHour = 0;
                            if (isSameDay) {
                              startHour = pickupHour + 1;
                            } else if (isToday) {
                              startHour = getCurrentHour();
                            }

                            const timeOptions = generateTimeOptions(startHour, 23);

                            return timeOptions.map((option, index) => (
                              <option key={`return-${index}`} value={option.value}>
                                {option.label}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>

                    {/* Location Section */}
                    <div className="location_section">
                      <div className="location_input">
                        <div className="location_label">PICK-UP LOCATION <span className="required-star">*</span></div>
                        <select
                          name="pickupLocation"
                          className="location_dropdown"
                          value={bookingData.pickupLocation}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select pick-up location</option>
                          {locations.length === 0 ? (
                            <option value="" disabled>No locations available</option>
                          ) : (
                            locations.map(location => (
                              <option key={`pickup-${location.id}`} value={location.name}>
                                {location.name} ({location.region_name})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="location_input">
                        <div className="location_label">RETURN LOCATION</div>
                        <select
                          name="returnLocation"
                          className="location_dropdown"
                          value={bookingData.returnLocation}
                          onChange={handleInputChange}
                        >
                          <option value="">Same as pick-up location</option>
                          {locations.length === 0 ? (
                            <option value="" disabled>No locations available</option>
                          ) : (
                            locations.map(location => (
                              <option key={`return-${location.id}`} value={location.name}>
                                {location.name} ({location.region_name})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* CDW Option */}
                    {vehicleDetails?.pricing?.cdw > 0 && (
                      <div className="cdw-section">
                        <div className="cdw-option">
                          <label className="cdw-checkbox">
                            <input
                              type="checkbox"
                              checked={includeCDW}
                              onChange={(e) => setIncludeCDW(e.target.checked)}
                            />
                            <span>Collision Damage Waiver (CDW)</span>
                          </label>
                          <div className="cdw-price">
                            + RM{parseFloat(vehicleDetails?.pricing?.cdw || 0).toFixed(2)} per day
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Driver Option */}
                    <div className="driver-section">
                      <div className="driver-option">
                        <label className="driver-checkbox">
                          <input
                            type="checkbox"
                            checked={includeDriver}
                            onChange={(e) => setIncludeDriver(e.target.checked)}
                          />
                          <span className="driver-label">Driver</span>
                        </label>
                        <div className="driver-checkbox-content">
                          <div className="cdw-price">
                            + RM0.00
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extras Section */}
                    <div className="extras-section-card">
                      <div className="extras-title-card">
                        <h4>Extra Services (Optional)</h4>
                      </div>
                      <div className="extras-selection-card">
                        <div className="extras-buttons-container">
                          <button
                            className={`extra-button ${selectedExtras.some(e => e.name === 'Baby Seat') ? 'selected' : ''}`}
                            onClick={() => {
                              const babySeat = { id: 1, name: 'Baby Seat', price: 10.00 };
                              handleExtraSelection(babySeat.id, babySeat.price, babySeat.name);
                            }}
                          >
                            <span>Baby Seat</span>
                            <span className="extra-button-price">+ RM10.00</span>
                          </button>
                          <button
                            className={`extra-button ${selectedExtras.some(e => e.name === 'Baby Stroller') ? 'selected' : ''}`}
                            onClick={() => {
                              const babyStroller = { id: 2, name: 'Baby Stroller', price: 10.00 };
                              handleExtraSelection(babyStroller.id, babyStroller.price, babyStroller.name);
                            }}
                          >
                            <span>Baby Stroller</span>
                            <span className="extra-button-price">+ RM10.00</span>
                          </button>
                          <button
                            className={`extra-button ${selectedExtras.some(e => e.name === 'GPS') ? 'selected' : ''}`}
                            onClick={() => {
                              const gps = { id: 3, name: 'GPS', price: 20.00 };
                              handleExtraSelection(gps.id, gps.price, gps.name);
                            }}
                          >
                            <span>GPS</span>
                            <span className="extra-button-price">+ RM20.00</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Requests */}
                    <div className="additional-requests-section">
                      <div className="form-group-compact">
                        <label>Additional Requests (Optional)</label>
                        <textarea
                          name="additionalRequests"
                          value={bookingForm.additionalRequests}
                          onChange={handleFormChange}
                          placeholder="Any special requests or instructions"
                          rows="2"
                          className="compact-textarea"
                        />
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="price_details">
                      {bookingData.pickupDate && bookingData.returnDate ? (
                        totalBasePrice > 0 ? (
                          <>
                            <div className="price_item">
                              <div>
                                {bookingData.pickupDate === bookingData.returnDate ? 'Hourly Rate' : 'Daily Rate'}
                                <span className="days-count">
                                  {bookingData.pickupDate === bookingData.returnDate
                                    ? ` × ${totalHours} hour${totalHours > 1 ? 's' : ''}`
                                    : ` × ${totalDays} day${totalDays > 1 ? 's' : ''}`
                                  }
                                </span>
                              </div>
                              <div>RM {totalBasePrice.toFixed(2)}</div>
                            </div>

                            {includeCDW && vehicleDetails?.pricing?.cdw > 0 && (
                              <div className="price_item">
                                <div>Collision Damage Waiver (CDW)</div>
                                <div>RM {(parseFloat(vehicleDetails?.pricing?.cdw || 0) * (bookingData.pickupDate === bookingData.returnDate ? Math.max(1, Math.ceil(totalHours / 24)) : totalDays)).toFixed(2)}</div>
                              </div>
                            )}
                            {includeDriver && (
                              <div className="price_item free-item">
                                <div>Driver</div>
                                <div>RM 0.00</div>
                              </div>
                            )}
                            {weekendSurcharge > 0 && (
                              <div className="price_item discount">
                                <div>Weekend Surcharge (20%)</div>
                                <div>RM {weekendSurcharge.toFixed(2)}</div>
                              </div>
                            )}

                            {selectedExtras.length > 0 && (
                              <>
                                <div className="price_item extras-title">
                                  <div>Extra Services:</div>
                                  <div></div>
                                </div>
                                {selectedExtras.map(extra => (
                                  <div key={extra.id} className="price_item extra-item-row">
                                    <div>• {extra.name}</div>
                                    <div>RM {extra.price.toFixed(2)}</div>
                                  </div>
                                ))}
                              </>
                            )}
                            <div className="price_item tax">
                              <div>Service Tax (8% SST)</div>
                              <div>RM {((totalBasePrice + weekendSurcharge + selectedExtras.reduce((sum, e) => sum + e.price, 0) +
                                (includeCDW ? (vehicleDetails?.pricing?.cdw || 0) * (bookingData.pickupDate === bookingData.returnDate ? Math.max(1, Math.ceil(totalHours / 24)) : totalDays) : 0)) * 0.08).toFixed(2)}</div>
                            </div>

                            <div className="price_total">
                              <div><strong>Total (MYR)</strong></div>
                              <div><strong>RM {totalPrice.toFixed(2)}</strong></div>
                            </div>
                          </>
                        ) : (
                          <div className="no-price-message">
                            Please select valid dates and times
                          </div>
                        )
                      ) : (
                        <div className="no-price-message">
                          Select dates to see price calculation
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="booking-actions">
                      <button
                        className="add-to-cart-button"
                        onClick={addToCart}
                        disabled={!validateBookingForm()}
                      >
                        <span className="cart-icon">🛒</span>
                        Add to Cart
                      </button>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="terms-section">
                      <label className="terms-checkbox">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          required
                        />
                        <span>
                          I confirm that I have read, understood and agree with the <a href="/" target="_blank">Rental Terms</a> provided.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Booking Bar */}
            <div className="mobile-booking-bar">
              <div className="mobile-booking-bar-content">
                <div className="mobile-price-info">
                  <h3>RM{parseFloat(vehicleDetails?.pricing?.daily || vehicleDetails?.daily || 0).toFixed(2)} <span>/day</span></h3>
                  {totalBasePrice > 0 && (
                    <span>
                      Total: RM{totalPrice.toFixed(2)} for{' '}
                      {bookingData.pickupDate === bookingData.returnDate
                        ? `${totalHours} hour${totalHours > 1 ? 's' : ''}`
                        : `${totalDays} day${totalDays > 1 ? 's' : ''}`
                      }
                    </span>
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

            {showToast && <Toast type={toastType} message={toastMessage} />}
          </div>
          <Footer />
        </AuthProvider>
      </div>
    </div>
  );
};

export default VehicleDetails;