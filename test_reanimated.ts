
import Animated, { createAnimatedComponent } from 'react-native-reanimated';
import { View } from 'react-native';

// Test 1: Animated.View
const Test1 = Animated.View;

// Test 2: createAnimatedComponent
const Test2 = createAnimatedComponent(View);

// Test 3: Default export check
console.log(Animated);
