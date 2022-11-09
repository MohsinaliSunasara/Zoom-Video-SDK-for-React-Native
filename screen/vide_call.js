/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect } from 'react';
import { ZoomVideoSdkProvider, useZoom, EventType } from '@zoom/react-native-videosdk';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Alert
} from 'react-native';



const VideoCall = () => {
  const zoom = useZoom();
  console.log("==>", "demo");
  useEffect(() => {
    console.log("==>", "demo");
    (async () => {
      const token = await generateJwt("grand-canyon-2000", "1");
      try {
        await zoom.joinSession({
          sessionName: "Mohsinali",
          sessionPassword: "Mohsinali",
          token: token,
          userName: "Mohsinali",
          audioOptions: {
            connect: true,
            mute: true,
          },
          videoOptions: {
            localVideoOn: true,
          },
          sessionIdleTimeoutMins: parseInt(90, 10),
        });
      } catch (e) {
        console.log("==>", e);
        Alert.alert('Failed to join the session');
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView>
      <ZoomVideoSdkProvider
        config={{
          appGroupId: 'group.test.sdk',
          domain: 'zoom.us',
          enableLog: true,
        }}>
      </ZoomVideoSdkProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default VideoCall;
