import React from 'react';
import { VideoCall } from '../ZoomApp/screen/vide_call';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function MainNavigation() {
  return (
    <Stack.Navigator initialRouteName="Intro">
      <Stack.Screen
        name="Intro"
        component={VideoCall}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
