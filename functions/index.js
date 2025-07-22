// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.checkAirQuality = functions.database.ref('/beehive/air_quality')
    .onUpdate(async (change, context) => {
        const newAirQuality = change.after.val();
        const previousAirQuality = change.before.val();

        const THRESHOLD = 50; // Adjust this value as per your requirement

        if (newAirQuality < THRESHOLD && (previousAirQuality === null || previousAirQuality >= THRESHOLD)) {
            console.log(`Low air quality detected: ${newAirQuality}%`);

            const tokensRef = admin.database().ref('/fcmTokens');
            const tokensSnapshot = await tokensRef.once('value');
            const tokens = tokensSnapshot.val();

            if (!tokens) {
                console.log('No FCM tokens registered.');
                return null;
            }

            const registrationTokens = Object.keys(tokens);

            const payload = {
                notification: {
                    title: 'Beehive Alert: Low Air Quality!',
                    body: `Air quality is ${newAirQuality.toFixed(0)}%. Check your hive!`,
                    icon: 'https://aadhixr.github.io/icons/icon-192.jpg', // Using your GitHub Pages URL and .jpg icon
                    click_action: 'https://aadhixr.github.io/index.html' // Using your GitHub Pages URL
                },
                webpush: {
                    headers: {
                        Urgency: 'high'
                    }
                }
            };

            try {
                const response = await admin.messaging().sendToDevice(registrationTokens, payload);
                console.log('Successfully sent message:', response);

                const tokensToRemove = [];
                response.results.forEach((result, index) => {
                    const error = result.error;
                    if (error) {
                        console.error('Failure sending notification to', registrationTokens[index], error);
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            tokensToRemove.push(tokensRef.child(registrationTokens[index]).remove());
                        }
                    }
                });
                return Promise.all(tokensToRemove);

            } catch (error) {
                console.error('Error sending message:', error);
                return null;
            }

        } else if (newAirQuality >= THRESHOLD && previousAirQuality < THRESHOLD) {
            console.log(`Air quality recovered: ${newAirQuality}%`);
        }
        return null;
    });
