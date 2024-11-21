const accountSid = 'AC0dbdda35ac261d06862e1417146efa87'; // Replace with your actual Account SID
const authToken = '9fb9c7166d908f8510dcdd3e8350673a'; // Replace with your actual Auth Token
const client = require('twilio')(accountSid, authToken);

// Function to generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
}

// Function to send OTP SMS
const sendOTP = (to) => {
    const otp = generateOTP();
    // Store OTP in the database or memory (example: in-memory store)
    // Here we store the OTP in memory with an expiration (e.g., 5 minutes).
    storeOTP(to, otp);

    return client.messages.create({
        body: `Your recovery code is: ${otp}`,
        from: '+14438154427', // Replace with your Twilio phone number
        to: to
    })
    .then(message => console.log(message.sid))
    .catch(error => console.error("Twilio Error: ", error));
};

// In-memory store for OTPs (for example purpose)
const otpStore = new Map(); // Use a database or cache for a production app

const storeOTP = (phoneNumber, otp) => {
    otpStore.set(phoneNumber, { otp: otp, timestamp: Date.now() });
};

const verifyOTP = (phoneNumber, enteredOtp) => {
    const otpData = otpStore.get(phoneNumber);
    
    if (!otpData) {
        return false; // No OTP stored for this number
    }

    // Check if OTP is expired (5 minutes expiry time)
    if (Date.now() - otpData.timestamp > 5 * 60 * 1000) {
        otpStore.delete(phoneNumber);
        return false; // OTP expired
    }

    return otpData.otp === enteredOtp;
}

module.exports = {
    sendOTP,
    verifyOTP
};
