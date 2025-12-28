
try {
    const reanimated = require('react-native-reanimated');
    console.log('Exports:', Object.keys(reanimated));
} catch (error) {
    console.error('Error requiring reanimated:', error);
}
