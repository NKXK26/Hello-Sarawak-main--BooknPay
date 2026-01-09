import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoIosArrowBack, IoIosClose } from 'react-icons/io';
import {
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaCar,
  FaEdit,
  FaShieldAlt,
  FaCheckCircle
} from 'react-icons/fa';
import { MdAirlineSeatReclineNormal } from 'react-icons/md';
import { GiGearStickPattern } from 'react-icons/gi';
import Navbar from '../../../Component/Navbar/navbar';
import Footer from '../../../Component/Footer/footer';
import Toast from '../../../Component/Toast/Toast';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import './cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartToken, setCartToken] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentError, setPaymentError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('');
  const [bookingIds, setBookingIds] = useState([]);
  const navigate = useNavigate();

  const [payPalClientId, setPayPalClientId] = useState(
    import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AQnKj2txjl1bnlCBzthuCa7DtxuK3X0PsNlrDhjDwxQasGACq8Y0PGNbaTEEuIDTFe9HGfIOis0tOstU'
  );


  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const token = localStorage.getItem('cartToken');

    if (token) {
      const items = JSON.parse(localStorage.getItem(`cart_${token}`)) || [];
      const now = new Date();
      const validItems = items.filter(item => {
        const expiresAt = new Date(item.expires_at);
        return expiresAt > now;
      });



      // Update storage if some items expired
      if (validItems.length !== items.length) {

        localStorage.setItem(`cart_${token}`, JSON.stringify(validItems));
      }

      setCartItems(validItems);
      setCartToken(token);

      const total = validItems.reduce((sum, item) => sum + item.total_price, 0);
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
    console.log('✅ Item removed, new total:', total);
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      const token = localStorage.getItem('cartToken');
      if (token) {
        localStorage.removeItem(`cart_${token}`);
        localStorage.removeItem('cartToken');
        setCartItems([]);
        setTotalAmount(0);
        setCartToken('');

        // Update cart count in all pages
        window.dispatchEvent(new Event('cartUpdated'));
      }
    }
  };

  const continueShopping = () => {

    navigate('/product');
  };

  const validateCartItems = () => {

    if (cartItems.length === 0) {
      displayToast('error', 'Your cart is empty');
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


  const handleCartCheckout = async (paypalDetails) => {
    try {
      const checkoutResponse = await fetch('http://localhost:5432/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_token: cartToken,
          cart_items: cartItems,
          customer_info: {}
        })
      });

      if (!checkoutResponse.ok) {
        const errorText = await checkoutResponse.text();
        console.error('❌ Checkout failed:', errorText);
        throw new Error(`Failed to create bookings: ${errorText}`);
      }

      const checkoutData = await checkoutResponse.json();
      const completeResponse = await fetch('http://localhost:5432/cart/paypal-complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_token: cartToken,
          booking_ids: checkoutData.booking_ids,
          paypal_details: paypalDetails
        })
      });

      if (!completeResponse.ok) {
        const errorText = await completeResponse.text();
        console.error('❌ PayPal update failed:', errorText);
        throw new Error(`Failed to update PayPal: ${errorText}`);
      }

      const completeData = await completeResponse.json();

      return checkoutData.booking_ids;
    } catch (error) {
      console.error('❌ Cart checkout error:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  };

const handlePayPalPayment = async (paypalDetails) => {

  setIsProcessingPayment(true);

  try {
    const response = await fetch('http://localhost:5432/cart/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    displayToast('success', 'Payment successful! Booking confirmed.');

  } catch (error) {
    console.error('❌ Payment confirmation failed:', error);
    setPaymentStatus('error');
    setPaymentError('Payment received but booking failed. Please contact support.');
  } finally {
    setIsProcessingPayment(false);
  }
};

  const calculateTotalForPayPal = () => {
    const total = cartItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2);
    return total;
  };

  return (
    <div className="cart-container">
      <Navbar />

      <div className="cart-header">
        <button className="back-button" onClick={() => {
          navigate(-1);
        }}>
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
              Your cart is saved in your browser for 7 days
            </p>
          </div>
        ) : (
          <>
            <div className="cart-items-section">
              <div className="cart-items">
                {cartItems.map((item, index) => {
                  return (
                    <div key={item.id} className="cart-item">
                      <div className="item-image">
                        <img src={item.image_url} alt={item.vehicle} />
                        {editingItem === item.id && (
                          <div className="editing-overlay">Editing...</div>
                        )}
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
                              <strong>Pickup:</strong> {item.pickup_date} at {item.pickup_time}
                            </div>
                          </div>
                          <div className="detail">
                            <FaCalendarAlt />
                            <div>
                              <strong>Return:</strong> {item.return_date} at {item.return_time}
                            </div>
                          </div>
                          <div className="detail">
                            <FaMapMarkerAlt />
                            <div>
                              <strong>Location:</strong> {item.pickup_location}
                            </div>
                          </div>
                          <div className="detail">
                            <FaClock />
                            <div>
                              <strong>Duration:</strong> {item.total_days} day{item.total_days > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

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
                          <div className="price-breakdown">
                            <span>Base: RM {item.base_price.toFixed(2)}</span>
                            <span>CDW: RM {item.cdw_total.toFixed(2)}</span>
                            {item.rate_type !== 'daily' && (
                              <span className="discount-text">
                                {item.rate_type === 'weekly' ? '10% OFF' : '20% OFF'}
                              </span>
                            )}
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
                <div className="summary-row">
                  <span>Subtotal ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
                  <span>RM {totalAmount.toFixed(2)}</span>
                </div>

                <div className="summary-total">
                  <span><strong>Total Amount</strong></span>
                  <span><strong>RM {calculateTotalForPayPal()}</strong></span>
                </div>
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

                        // Validate cart before creating order
                        if (!validateCartItems()) {
                          return Promise.reject('Please fix cart issues before payment');
                        }

                        // Calculate totals
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
                      }}
                      onCancel={() => {
                        displayToast('info', 'Payment cancelled. You can try again.');
                        setIsProcessingPayment(false);
                      }}
                      disabled={isProcessingPayment || cartItems.length === 0}
                    />
                  </PayPalScriptProvider>

                  <div className="payment-notes">
                    <ul>
                      <li>Complete payment to confirm all bookings</li>
                      <li>Bring driving license for verification at pickup</li>
                      <li>Security deposit required at vehicle pickup</li>
                      <li>All items must be paid together</li>
                    </ul>
                  </div>
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