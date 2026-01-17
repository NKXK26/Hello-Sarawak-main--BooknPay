import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoIosArrowBack } from 'react-icons/io';
import {
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCar,
  FaShieldAlt,
  FaCheckCircle,
  FaPlus
} from 'react-icons/fa';
import { MdAirlineSeatReclineNormal } from 'react-icons/md';
import { GiGearStickPattern } from 'react-icons/gi';
import Navbar from '../../../Component/Navbar/navbar';
import Footer from '../../../Component/Footer/footer';
import Toast from '../../../Component/Toast/Toast';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import './cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartToken, setCartToken] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentError, setPaymentError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('');
  const [bookingIds, setBookingIds] = useState([]);
  const navigate = useNavigate();
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const recaptchaRef = useRef(null);
  const [payPalClientId, setPayPalClientId] = useState(
    import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AQnKj2txjl1bnlCBzthuCa7DtxuK3X0PsNlrDhjDwxQasGACq8Y0PGNbaTEEuIDTFe9HGfIOis0tOstU'
  );
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  useEffect(() => {
    loadCart();
  }, []);
  // Add these functions with your other functions:
  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    setIsRecaptchaVerified(!!token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken('');
    setIsRecaptchaVerified(false);
    displayToast('info', 'reCAPTCHA expired. Please verify again.');
  };

  const resetRecaptcha = () => {
    setRecaptchaToken('');
    setIsRecaptchaVerified(false);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };
  const calculateWeekendDays = (pickupDate, returnDate) => {
    if (!pickupDate || !returnDate) return 0;

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const timeDiff = Math.abs(end - start);
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    let weekendDays = 0;
    let currentDate = new Date(start);

    for (let i = 0; i < days; i++) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weekendDays;
  };

  // Helper to calculate total hours from hours and days
  const getTotalHours = (item) => {
    if (item.rate_type === 'hourly') {
      return item.total_hours || 0;
    }
    // For daily rate, convert days to hours (24 hours per day)
    return (item.total_days || 0) * 24;
  };

  // Helper to calculate total days from hours and days
  const getTotalDays = (item) => {
    if (item.rate_type === 'daily') {
      return item.total_days || 0;
    }
    // For hourly rate, convert hours to days (ceiling)
    return Math.ceil((item.total_hours || 0) / 24);
  };

  // Format time to display (remove seconds if present)
  const formatTimeDisplay = (time) => {
    if (!time) return '';
    // If time includes seconds (HH:MM:SS), remove them
    if (time.includes(':') && time.split(':').length === 3) {
      return time.substring(0, 5);
    }
    return time;
  };

  // Calculate CDW for display
  const calculateCDWDisplay = (item) => {
    if (item.include_cdw && item.cdw_total) {
      return item.cdw_total;
    }
    return 0;
  };

  // Calculate base price display (hourly or daily)
  const calculateBasePriceDisplay = (item) => {
    if (item.rate_type === 'hourly') {
      // For hourly, show hourly rate * hours
      const hourlyRate = (item.price_per_day || 0) / 2;
      const totalHours = item.total_hours || 0;
      return hourlyRate * totalHours;
    } else {
      // For daily, show daily rate * days
      return item.base_price || 0;
    }
  };

  const loadCart = () => {
    const token = localStorage.getItem('cartToken');

    if (token) {
      const items = JSON.parse(localStorage.getItem(`cart_${token}`)) || [];
      const now = new Date();
      const validItems = items.filter(item => {
        const expiresAt = new Date(item.expires_at);
        return expiresAt > now;
      });

      // Recalculate weekend surcharge for daily rates only
      const updatedItems = validItems.map(item => {
        // Only recalculate for daily rates
        if (item.rate_type === 'daily') {
          const weekendDays = calculateWeekendDays(item.pickup_date, item.return_date);
          const weekendSurcharge = item.weekend_surcharge || 0;

          // If weekend surcharge is missing or incorrect, recalculate it
          if (weekendDays > 0 && weekendSurcharge === 0) {
            const baseDailyRate = item.price_per_day || 0;
            const recalculatedSurcharge = baseDailyRate * weekendDays * 0.2;

            // Recalculate total with new weekend surcharge
            const cdwTotal = item.include_cdw ? (parseFloat(item.calculation_details?.cdwDaily || 0) * item.total_days) : 0;
            const extrasTotal = item.extras_total || 0;
            const basePrice = item.base_price || 0;
            const newSubtotal = basePrice + recalculatedSurcharge + extrasTotal + cdwTotal;
            const newTax = newSubtotal * 0.08;
            const newTotal = newSubtotal + newTax;

            return {
              ...item,
              weekend_surcharge: recalculatedSurcharge,
              weekend_days: weekendDays,
              tax_amount: newTax,
              total_price: newTotal
            };
          }

          return {
            ...item,
            weekend_days: weekendDays
          };
        }

        // For hourly rates, no weekend surcharge
        return item;
      });

      if (validItems.length !== items.length) {
        localStorage.setItem(`cart_${token}`, JSON.stringify(updatedItems));
      }

      setCartItems(updatedItems);
      setCartToken(token);

      const total = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
      setTotalAmount(total);
    }
  };

  const removeItem = (itemId) => {
    const token = localStorage.getItem('cartToken');
    if (!token) return;

    const items = JSON.parse(localStorage.getItem(`cart_${token}`)) || [];
    const updatedItems = items.filter(item => item.id !== itemId);

    localStorage.setItem(`cart_${token}`, JSON.stringify(updatedItems));
    setCartItems(updatedItems);

    const total = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    setTotalAmount(total);

    window.dispatchEvent(new Event('cartUpdated'));
    displayToast('success', 'Item removed from cart');
  };

  const continueShopping = () => {
    navigate('/product');
  };

  const validateCartItems = () => {
    if (cartItems.length === 0) {
      displayToast('error', 'Your cart is empty');
      return false;
    }
    if (!isRecaptchaVerified) {
      displayToast('error', 'Please verify that you are not a robot');
      return false;
    }
    const now = new Date();
    const expiredItems = cartItems.filter(item => {
      const expiresAt = new Date(item.expires_at);
      return expiresAt <= now;
    });

    if (expiredItems.length > 0) {
      displayToast('error', 'Some items in your cart have expired. Please remove them.');
      return false;
    }

    const incompleteItems = cartItems.filter(item =>
      !item.first_name || !item.last_name || !item.email || !item.phone
    );

    if (incompleteItems.length > 0) {
      displayToast('error', 'Please complete customer information for all items before checkout');
      return false;
    }
    return true;
  };

  const displayToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handlePayPalPayment = async (paypalDetails) => {
    setIsProcessingPayment(true);
    body: JSON.stringify({
      cart_token: cartToken,
      cart_items: cartItems,
      paypal_details: paypalDetails,
      recaptcha_token: recaptchaToken // Add this line
    })
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const endpoint = `${API_URL}/cart/confirm-payment`;

      console.log('Processing PayPal payment to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_token: cartToken,
          cart_items: cartItems,
          paypal_details: paypalDetails
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      localStorage.removeItem(`cart_${cartToken}`);
      localStorage.removeItem('cartToken');
      window.dispatchEvent(new Event('cartUpdated'));

      setCartItems([]);
      setTotalAmount(0);
      setPaymentStatus('success');
      setBookingIds(data.booking_ids);
      resetRecaptcha();
      displayToast('success', 'Payment successful! Booking confirmed.');

      // Redirect to confirmation page after 2 seconds
      setTimeout(() => {
        navigate('/cart', {
          state: {
            bookingIds: data.booking_ids,
            totalAmount: totalAmount
          }
        });
      }, 2000);

    } catch (error) {
      resetRecaptcha();
      console.error('❌ Payment confirmation failed:', error);
      setPaymentStatus('error');
      setPaymentError('Payment received but booking failed. Please contact support.');
      displayToast('error', 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const calculateTotalForPayPal = () => {
    const total = cartItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2);
    return total;
  };

  const getRateTypeDisplay = (item) => {
    if (item.rate_type === 'hourly') {
      return 'Hourly Rate';
    } else if (item.rate_type === 'daily') {
      return 'Daily Rate';
    } else if (item.rate_type === 'weekly') {
      return 'Weekly Rate (10% off)';
    } else if (item.rate_type === 'monthly') {
      return 'Monthly Rate (20% off)';
    }
    return 'Daily Rate';
  };

  return (
    <div className="cart-container">
      <Navbar />

      <div className="cart-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <IoIosArrowBack /> Back
        </button>
        <h1>Your Shopping Cart</h1>
        {cartToken && (
          <div className="cart-info">
            <span className="cart-token">Cart ID: {cartToken.substr(0, 15)}...</span>
            <span className="cart-count">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="cart-content">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add vehicles to your cart and they will appear here</p>
            <button onClick={continueShopping} className="browse-btn">
              Browse Vehicles
            </button>
            <p className="cart-note">
              Your cart is saved in your browser for 1 days
            </p>
          </div>
        ) : (
          <>
            <div className="cart-items-section">
              <div className="cart-items">
                {cartItems.map((item) => {
                  const extrasTotal = item.selected_extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
                  const weekendDays = item.weekend_days || calculateWeekendDays(item.pickup_date, item.return_date);
                  const hasWeekendSurcharge = weekendDays > 0 && item.weekend_surcharge > 0 && item.rate_type === 'daily';
                  const basePrice = calculateBasePriceDisplay(item);
                  const cdwTotal = calculateCDWDisplay(item);
                  const totalHours = getTotalHours(item);
                  const totalDays = getTotalDays(item);
                  const isHourlyRate = item.rate_type === 'hourly';
                  const isSameDay = item.pickup_date === item.return_date;

                  return (
                    <div key={item.id} className="cart-item">
                      <div className="item-image">
                        <img src={item.image_url} alt={item.vehicle} />
                      </div>

                      <div className="item-details">
                        <h3>{item.vehicle}</h3>
                        <div className="vehicle-specs">
                          <span><FaCar /> {item.brand}</span>
                          <span><MdAirlineSeatReclineNormal /> {item.seats} seats</span>
                          <span><GiGearStickPattern /> {item.transmission}</span>
                        </div>

                        <div className="booking-details">
                          <div className="detail">
                            <FaCalendarAlt />
                            <div>
                              <strong>Pickup:</strong> {item.pickup_date} at {formatTimeDisplay(item.pickup_time)}
                            </div>
                          </div>
                          <div className="detail">
                            <FaCalendarAlt />
                            <div>
                              <strong>Return:</strong> {item.return_date} at {formatTimeDisplay(item.return_time)}
                            </div>
                          </div>
                          <div className="detail">
                            <FaMapMarkerAlt />
                            <div>
                              <strong>Pickup Location:</strong> {item.pickup_location}
                            </div>
                          </div>
                          <div className="detail">
                            <FaMapMarkerAlt />
                            <div>
                              <strong>Return Location:</strong> {item.return_location || item.pickup_location || 'Same as pickup'}
                            </div>
                          </div>
                          <div className="detail">
                            <FaClock />
                            <div>
                              <strong>Duration:</strong>
                              {isHourlyRate ? (
                                <>
                                  {totalHours} hour{totalHours > 1 ? 's' : ''}
                                </>
                              ) : (
                                <>
                                  {totalDays} day{totalDays > 1 ? 's' : ''}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Rate Type Display */}
                        <div className="rate-info">
                          <span className="rate-type">
                            <strong>Rate Type:</strong> {getRateTypeDisplay(item)}
                          </span>
                        </div>

                        {/* Extras Section */}
                        {item.selected_extras && item.selected_extras.length > 0 && (
                          <div className="extras-section">
                            <div className="extras-title">
                              <FaPlus /> <strong>Extra Services:</strong>
                            </div>
                            <div className="extras-list">
                              {item.selected_extras.map(extra => (
                                <div key={extra.id} className="extra-item">
                                  <span>{extra.name}</span>
                                  <span className="extra-price">RM {extra.price.toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="extras-total">
                                <span>Extras Total:</span>
                                <span className="total-price">RM {extrasTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="customer-info">
                          <p><strong>Driver:</strong> {item.first_name} {item.last_name}</p>
                          <p><strong>Email:</strong> {item.email}</p>
                          <p><strong>Phone:</strong> {item.phone}</p>
                          {item.driving_license && (
                            <p><strong>License:</strong> {item.driving_license}</p>
                          )}
                        </div>
                      </div>

                      <div className="item-actions">
                        <div className="item-price">
                          <h3>RM {item.total_price.toFixed(2)}</h3>
                          <div className="price-breakdown-details">
                            {/* Base Price Display */}
                            <div className="breakdown-item">
                              <span>
                                {isHourlyRate ? `Hourly Rate (${totalHours} hours):` : `Daily Rate (${totalDays} days):`}
                              </span>
                              <span>RM {basePrice.toFixed(2)}</span>
                            </div>

                            {/* Weekend Surcharge (Daily rates only) */}
                            {hasWeekendSurcharge && (
                              <div className="breakdown-item weekend">
                                <span>Weekend Surcharge (20%):</span>
                                <span>+RM {item.weekend_surcharge.toFixed(2)}</span>
                              </div>
                            )}

                            {/* CDW Display */}
                            {item.include_cdw && cdwTotal > 0 && (
                              <div className="breakdown-item cdw">
                                <span>Collision Damage Waiver (CDW):</span>
                                <span>+RM {cdwTotal.toFixed(2)}</span>
                              </div>
                            )}
                            {item.include_driver && (
                              <div className="breakdown-item driver">
                                <span>Driver:</span>
                                <span>+RM 0.00</span>
                              </div>
                            )}
                            {/* Extras */}
                            {extrasTotal > 0 && (
                              <div className="breakdown-item extras-breakdown">
                                <span>Extra Services:</span>
                                <span>+RM {extrasTotal.toFixed(2)}</span>
                              </div>
                            )}

                            {/* Tax */}
                            <div className="breakdown-item tax">
                              <span>Service Tax (8%):</span>
                              <span>+RM {(item.tax_amount || 0).toFixed(2)}</span>
                            </div>

                            {/* Total */}
                            <div className="breakdown-item total-row">
                              <span><strong>Total:</strong></span>
                              <span><strong>RM {item.total_price.toFixed(2)}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="action-buttons">
                          <button
                            className="remove-btn"
                            onClick={() => removeItem(item.id)}
                            disabled={isProcessingPayment}
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>

                        <div className="item-expiry">
                          <small>
                            <FaClock /> Reserved until: {new Date(item.expires_at).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>

              <div className="summary-details">
                {/* Items breakdown */}
                {cartItems.map((item, index) => (
                  <div key={index} className="summary-item-row">
                    <span>
                      {item.vehicle} - {item.rate_type === 'hourly' ?
                        `${getTotalHours(item)} hours` :
                        `${getTotalDays(item)} days`}
                    </span>
                    <span>RM {item.total_price.toFixed(2)}</span>
                  </div>
                ))}

                <div className="summary-total">
                  <span><strong>Total Amount</strong></span>
                  <span><strong>RM {calculateTotalForPayPal()}</strong></span>
                </div>
              </div>
              {/* Add this section in your cart-summary, BEFORE the PayPal section */}
              <div className="recaptcha-section">
                <div className="recaptcha-container">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaSiteKey}
                    onChange={handleRecaptchaChange}
                    onExpired={handleRecaptchaExpired}
                  />
                </div>
                <p className="recaptcha-notice">
                  This site is protected by reCAPTCHA and the Google
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Privacy Policy</a> and
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"> Terms of Service</a> apply.
                </p>
              </div>
              {/* Payment Processing Status */}
              {isProcessingPayment && (
                <div className="payment-processing">
                  <div className="loading-spinner"></div>
                  <p>Processing your payment...</p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="payment-success">
                  <FaCheckCircle />
                  <p>Payment successful! Redirecting to confirmation...</p>
                </div>
              )}

              {paymentStatus === 'error' && (
                <div className="payment-error">
                  <p>Error: {paymentError}</p>
                  <button
                    className="retry-btn"
                    onClick={() => {
                      setPaymentStatus('idle');
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* PayPal Payment Section */}
              {paymentStatus === 'idle' && !isProcessingPayment && (
                <div className="paypal-section">
                  <div className="security-info">
                    <FaShieldAlt />
                    <span>Secure payment with PayPal</span>
                  </div>

                  <PayPalScriptProvider
                    options={{
                      "client-id": payPalClientId,
                      currency: "MYR",
                      intent: "capture",
                      components: "buttons",
                      "disable-funding": "credit,card",
                      "enable-funding": "paypal"
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "pay",
                        height: 48
                      }}
                      createOrder={(data, actions) => {
                        if (!validateCartItems()) {
                          return Promise.reject('Please fix cart issues before payment');
                        }

                        const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);

                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                currency_code: 'MYR',
                                value: totalAmount.toFixed(2),
                                breakdown: {
                                  item_total: {
                                    currency_code: 'MYR',
                                    value: totalAmount.toFixed(2)
                                  },
                                  shipping: {
                                    currency_code: 'MYR',
                                    value: '0.00'
                                  }
                                }
                              },
                              description: `Vehicle Rental (${cartItems.length} items)`,
                              reference_id: `cart-${cartToken}`,
                              custom_id: `cart-payment-${Date.now()}`
                            }
                          ],
                          application_context: {
                            shipping_preference: 'NO_SHIPPING',
                            user_action: 'PAY_NOW',
                            brand_name: 'GoCar Rental',
                            locale: 'en-MY'
                          }
                        }).then(order => {
                          return order;
                        }).catch(error => {
                          console.error('❌ PayPal order creation failed:', error);
                          throw error;
                        });
                      }}
                      onApprove={(data, actions) => {
                        return actions.order.capture().then((details) => {
                          setTimeout(() => {
                            handlePayPalPayment(details);
                          }, 0);
                          return details;
                        }).catch(err => {
                          console.error('❌ Capture failed:', err);
                          displayToast('error', 'Payment capture failed. Please try again.');
                          setIsProcessingPayment(false);
                          throw err;
                        });
                      }}
                      onError={(err) => {
                        console.error('❌ PayPal onError triggered:', err);
                        console.error('❌ Error details:', JSON.stringify(err));
                        displayToast('error', 'Payment processing error. Please try again.');
                        setIsProcessingPayment(false);
                         resetRecaptcha();
                      }}
                      onCancel={() => {
                        displayToast('info', 'Payment cancelled. You can try again.');
                        setIsProcessingPayment(false);
                         resetRecaptcha();
                      }}
                      disabled={isProcessingPayment || cartItems.length === 0 || !isRecaptchaVerified}
                    />
                  </PayPalScriptProvider>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showToast && <Toast type={toastType} message={toastMessage} />}

      <Footer />
    </div>
  );
};

export default Cart;