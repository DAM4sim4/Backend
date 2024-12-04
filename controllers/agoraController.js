const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { appId, appCertificate } = require('../config/agoraConfig');

const generateAgoraToken = (req, res) => {
  const { channelName, role, uid } = req.body;

  if (!channelName || !role || uid === undefined) {
    return res.status(400).json({ message: 'Channel name, role, and UID are required' });
  }

  try {
    const expirationTimeInSeconds = 3600; // Token valid for 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expirationTimeInSeconds;

    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpireTime
    );

    res.status(200).json({ token, channelName, uid });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ message: 'Failed to generate Agora token' });
  }
};

module.exports = { generateAgoraToken };
