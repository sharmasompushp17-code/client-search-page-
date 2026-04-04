const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.log('Razorpay not configured - payment features disabled');
}

// Helper to check if Razorpay is configured
const isRazorpayConfigured = () => razorpay !== null;

// Create order
const createOrder = async (amount, currency = 'INR', receipt = null) => {
  if (!isRazorpayConfigured()) {
    return {
      success: false,
      error: 'Razorpay not configured - payment features disabled'
    };
  }

  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

// Fetch payment details
const fetchPayment = async (paymentId) => {
  if (!isRazorpayConfigured()) {
    return {
      success: false,
      error: 'Razorpay not configured - payment features disabled'
    };
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment
    };
  } catch (error) {
    console.error('Failed to fetch payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create UPI payment link
const createUPILink = async (amount, description, customerEmail, customerPhone) => {
  if (!isRazorpayConfigured()) {
    return {
      success: false,
      error: 'Razorpay not configured - payment features disabled'
    };
  }

  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: 'INR',
      accept_partial: false,
      description,
      customer: {
        email: customerEmail,
        contact: customerPhone
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      notes: {
        purpose: 'Project Payment'
      }
    });

    return {
      success: true,
      paymentLinkId: paymentLink.id,
      shortUrl: paymentLink.short_url
    };
  } catch (error) {
    console.error('Failed to create UPI link:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  createUPILink
};
