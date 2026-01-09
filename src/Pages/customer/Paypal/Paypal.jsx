// PayPalPayment.jsx
import React, { useEffect, useRef } from 'react';
import { generateBookingId, createBookingAfterPayment, updateBookingPayPalDetails } from '../Api/api';

const PayPalPayment = ({ 
  totalPrice, 
  vehicleDetails, 
  bookingData, 
  bookingForm,
  onPaymentSuccess,
  onPaymentError 
}) => {
  const paypalRef = useRef();
  const [bookingID, setBookingID] = React.useState('');

  useEffect(() => {
    // Generate booking ID
    const generateBooking = async () => {
      try {
        const id = await generateBookingId();
        setBookingID(id);
      } catch (error) {
        console.error('Failed to generate booking ID:', error);
      }
    };
    generateBooking();
  }, []);

  useEffect(() => {
    if (!bookingID || !totalPrice) return;

    window.paypal.Buttons({
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: `Car Rental: ${vehicleDetails?.vehicle}`,
            amount: {
              currency_code: 'MYR',
              value: totalPrice.toFixed(2)
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        try {
          // Capture the payment
          const details = await actions.order.capture();
          
          // Prepare booking data
          const bookingDataPayload = {
            bookingID,
            vehicle: vehicleDetails?.vehicle,
            fullName: `${bookingForm.title} ${bookingForm.firstName} ${bookingForm.lastName}`,
            email: bookingForm.email,
            mobile: bookingForm.phoneNumber,
            license: bookingForm.drivingLicense,
            additionalInfo: bookingForm.additionalRequests || '',
            flightNumber: '',
            pickupLoc: bookingData.pickupLocation || 'Main Office',
            dropoffLoc: bookingData.returnLocation || bookingData.pickupLocation || 'Main Office',
            pickupDate: bookingData.pickupDate,
            dropoffDate: bookingData.returnDate,
            pickupTime: bookingData.pickupTime,
            dropoffTime: bookingData.returnTime,
            others: null,
            extras: '',
            total: totalPrice,
            paypal_order_id: details.id,
            paypal_transaction_id: details.purchase_units[0].payments.captures[0].id,
            payment_method: 'paypal'
          };

          // Save booking to database
          const result = await createBookingAfterPayment(bookingDataPayload);
          
          // Update with PayPal details
          await updateBookingPayPalDetails(bookingID, {
            paypal_order_id: details.id,
            paypal_transaction_id: details.purchase_units[0].payments.captures[0].id
          });

          // Call success callback
          if (onPaymentSuccess) {
            onPaymentSuccess(result);
          }
          
        } catch (error) {
          console.error('Payment processing error:', error);
          if (onPaymentError) {
            onPaymentError(error);
          }
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        if (onPaymentError) {
          onPaymentError(err);
        }
      }
    }).render(paypalRef.current);
  }, [bookingID, totalPrice]);

  return (
    <div className="paypal-payment-container">
      <div ref={paypalRef}></div>
    </div>
  );
};

export default PayPalPayment;