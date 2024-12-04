const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendOTP = async (to, otp) => {
    try {
        console.log(`Sending OTP: ${otp} to ${to}`); // Debug log
        const message = await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });
        console.log('OTP sent successfully:', message.sid);
        return true;
    } catch (error) {
        console.error('Error sending OTP via Twilio:', error.message);
        throw new Error('Failed to send OTP. Please try again.');
    }
};


module.exports = { sendOTP };
