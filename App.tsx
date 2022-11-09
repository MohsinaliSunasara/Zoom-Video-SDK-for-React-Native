import React, { useEffect, useState,useRef } from 'react';
import {
  ZoomVideoSdkProvider,
  EventType,
  useZoom,
  ZoomVideoSdkUser,
  ZoomVideoSdkUserType,
  ZoomVideoSdkChatMessage,
  ZoomVideoSdkChatMessageType,
  ChatMessageDeleteType,
  ShareStatus,
  LiveStreamStatus,
  RecordingStatus,
  Errors,
  PhoneFailedReason,
  PhoneStatus,
  VideoPreferenceMode,
  LiveTranscriptionStatus,
  MultiCameraStreamStatus,
  SystemPermissionType,
} from '@zoom/react-native-videosdk';
import { NavigationContainer } from '@react-navigation/native';

import { Navigation } from './navigation';
import { createStackNavigator } from '@react-navigation/stack';
import { VideoCall } from './screen/vide_call';
import {useIsMounted} from '../ZoomApp/utils/hooks'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  Easing,
  withTiming,
} from 'react-native-reanimated';
import {
  Alert,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Keyboard,
  Platform,
  ActionSheetIOS,
  useWindowDimensions,
} from 'react-native';
import { VideoView } from './video-view/video-view';
import LinearGradient from 'react-native-linear-gradient';
import { Icon } from './icon';
import generateJwt from '../ZoomApp/utils/jwt';
const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <ZoomVideoSdkProvider
        config={{
          appGroupId: 'group.test.sdk',
          domain: 'zoom.us',
          enableLog: true,
        }}>
        <Stack.Navigator initialRouteName="Intro">
          <Stack.Screen
            name="Intro"
            component={DetailsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </ZoomVideoSdkProvider>
    </NavigationContainer>
  );
}

function DetailsScreen() {

const [isInSession, setIsInSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [users, setUsersInSession] = useState<ZoomVideoSdkUser[]>([]);
  const [fullScreenUser, setFullScreenUser] = useState<ZoomVideoSdkUser>();
  const [sharingUser, setSharingUser] = useState<ZoomVideoSdkUser>();
  const [videoInfo, setVideoInfo] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ZoomVideoSdkChatMessage[]>(
    []
  );
  const [contentHeight, setContentHeight] = useState<string | number>('100%');
  const [isSharing, setIsSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [isLongTouch, setIsLongTouch] = useState(false);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
  const [isMicOriginalOn, setIsMicOriginalOn] = useState(false);
  const isLongTouchRef = useRef(isLongTouch);
  const chatInputRef = useRef<TextInput>(null);
  const videoInfoTimer = useRef<number>(0);
  // react-native-reanimated issue: https://github.com/software-mansion/react-native-reanimated/issues/920
  // Not able to reuse animated style in multiple views.
 const uiOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
    const chatSendButtonScale = useSharedValue(0);
  const isMounted = useIsMounted();
  const zoom = useZoom();
  const windowHeight = useWindowDimensions().height;
  const [refreshFlatlist, setRefreshFlatList] = useState(false);
  let touchTimer: NodeJS.Timeout;
  isLongTouchRef.current = isLongTouch;

  useEffect(() => {
    (async () => {
      try {
        await zoom.joinSession({
          sessionName: "Mohsinali",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfa2V5IjoiWHVKdm9UZUVhUXY1cXNxQUswODZqZno0WHR3VFF5OFpiNjFhIiwidHBjIjoiTW9oc2luYWxpIiwidmVyc2lvbiI6MSwicm9sZV90eXBlIjoxLCJ1c2VyX2lkZW50aXR5IjoibW9oc2luYWxpMTIzMzQiLCJzZXNzaW9uX2tleSI6Ik1vaHNpbmFsaSIsImlhdCI6MTY2Nzk5NzYyNywiZXhwIjoxNjY4MDAzMDI3LCJwd2QiOjEyMzQ1fQ.KXSBx7bGZ11rsL5W5MurkI7eu4xg1ESY1Tz7Yg8TsFc",
          userName: "Moshin",
          sessionPassword:"12345",
          audioOptions: {
            connect: true,
            mute: false,
          },
          videoOptions: {
            localVideoOn: true,
          },
          sessionIdleTimeoutMins: parseInt("90", 10),
        });
      } catch (e) {
        console.log("==>", e);
        Alert.alert('Failed to join the session');
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    const sendChatMessage = async () => {
    chatInputRef.current?.clear();
    await zoom.chatHelper.sendChatToAll(chatMessage);
    setChatMessage('');
    // send the chat as a command
    zoom.cmdChannel.sendCommand(null, chatMessage);
  };

  const scaleChatSend = (show: boolean) => {
    const easeIn = Easing.in(Easing.exp);
    const easeOut = Easing.out(Easing.exp);
    chatSendButtonScale.value = withTiming(show ? 1 : 0, {
      duration: 500,
      easing: show ? easeIn : easeOut,
    });
  };
   const onPressAudio = async () => {
    const mySelf = await zoom.session.getMySelf();
    const muted = await mySelf.audioStatus.isMuted();
    setIsMuted(muted);
    muted
      ? await zoom.audioHelper.unmuteAudio(mySelf.userId)
      : await zoom.audioHelper.muteAudio(mySelf.userId);
  };

  const onPressVideo = async () => {
    const mySelf = await zoom.session.getMySelf();
    const videoOn = await mySelf.videoStatus.isOn();
    setIsVideoOn(videoOn);
    videoOn ? await zoom.videoHelper.stopVideo() : await zoom.videoHelper.startVideo();
  };
  

const onPressMore = async () => {
    const mySelf = await zoom.session.getMySelf();
    const isShareLocked = await zoom.shareHelper.isShareLocked();
    const isFullScreenUserManager = await fullScreenUser?.getIsManager();
    const canSwitchSpeaker = await zoom.audioHelper.canSwitchSpeaker();
    const canStartRecording = await zoom.recordingHelper.canStartRecording();
    const isSupportPhoneFeature =
      await zoom.phoneHelper.isSupportPhoneFeature();
    const startLiveTranscription =
      (await zoom.liveTranscriptionHelper.getLiveTranscriptionStatus()) ===
      LiveTranscriptionStatus.Start;
    let options = [
      // { text: 'Switch Camera', onPress: () => zoom.videoHelper.switchCamera() },
      {
        text: `Get Session Dial-in Number infos`,
        onPress: async () => {
          console.log("session number= " + await zoom.session.getSessionNumber());
        },
      },
      {
        text: `${startLiveTranscription ? 'Stop' : 'Start'} Live Transcription`,
        onPress: async () => {
          const canStartLiveTranscription =
            await zoom.liveTranscriptionHelper.canStartLiveTranscription();
          if (canStartLiveTranscription === true) {
            if (startLiveTranscription) {
              const error =
                await zoom.liveTranscriptionHelper.stopLiveTranscription();
              console.log('stopLiveTranscription= ' + error);
            } else {
              const error =
                await zoom.liveTranscriptionHelper.startLiveTranscription();
              console.log('startLiveTranscription= ' + error);
            }
          } else {
            Alert.alert('Live transcription not supported');
          }
        },
      },
      {
        text: `${isMicOriginalOn ? 'Disable' : 'Enable'} Original Sound`,
        onPress: async () => {
          await zoom.audioSettingHelper.enableMicOriginalInput(!isMicOriginalOn);
          console.log(
            `Original sound ${isMicOriginalOn ? 'Disabled' : 'Enabled'}`
          );
          setIsMicOriginalOn(!isMicOriginalOn);
        },
      },
      {
        text: 'Set Video Preference',
        onPress: async () => {
          await zoom.videoHelper.setVideoQualityPreference({
            mode: VideoPreferenceMode.Balance,
            maximumFrameRate: 0,
            minimumFrameRate: 0,
          });
        },
      },
    ];

    if (isSupportPhoneFeature) {
      options = [
        ...options,
        {
          text: `Invite By Phone`,
          onPress: async () => {
            console.log(await zoom.phoneHelper.getSupportCountryInfo());
            zoom.phoneHelper.inviteByPhone(
              '<Country Code>',
              '<Phone Number>',
              '<Display Name>'
            );
          },
        },
      ];
    }

    if (canSwitchSpeaker) {
      options = [
        ...options,
        {
          text: `Turn ${isSpeakerOn ? 'off' : 'on'} Speaker`,
          onPress: async () => {
            await zoom.audioHelper.setSpeaker(!isSpeakerOn);
            setIsSpeakerOn(!isSpeakerOn);
          },
        },
      ];
    }

    if (mySelf.isHost) {
      options = [
        ...options,
        {
          text: `${isShareLocked ? 'Unlock' : 'Lock'} Share`,
          onPress: () => zoom.shareHelper.lockShare(!isShareLocked),
        },
        {
          text: `${isFullScreenUserManager ? 'Revoke' : 'Make'} Manager`,
          onPress: () => {
            fullScreenUser &&
              (isFullScreenUserManager
                ? zoom.userHelper.revokeManager(fullScreenUser.userId)
                : zoom.userHelper.makeManager(fullScreenUser.userId));
          },
        },
        {
          text: 'Change Name',
          onPress: () => setIsRenameModalVisible(true),
        },
      ];

      if (canStartRecording) {
        options = [
          ...options,
          {
            text: `${isRecordingStarted ? 'Start' : 'Stop'} Recording`,
            onPress: async () => {
              if (!isRecordingStarted) {
                await zoom.recordingHelper.startCloudRecording();
              } else {
                await zoom.recordingHelper.stopCloudRecording();
              }
            },
          },
        ];
      }
    }

    if (Platform.OS === 'android') {
      Alert.alert('More options', '', options, {cancelable: true});
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...options.map(option => option.text)],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          // eslint-disable-next-line eqeqeq
          if (buttonIndex != 0) {
            options[buttonIndex - 1].onPress();
          }
        }
      );
    }
  };

  const onPressLeave = async () => {
    const mySelf = await zoom.session.getMySelf();
    const options = [
      {
        text: 'Leave Session',
        onPress: () => leaveSession(false),
      },
    ];

    if (mySelf.isHost) {
      options.unshift({
        text: 'End Session',
        onPress: () => leaveSession(true),
      });
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...options.map(option => option.text)],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex !== 0) {
            options[buttonIndex - 1].onPress();
          }
        }
      );
    } else {
      Alert.alert('Do you want to leave this session?', '', options, {
        cancelable: true,
      });
    }
  };

   const leaveSession = (endSession: boolean) => {
    zoom.leaveSession(endSession);

  };
  useEffect(() => {
    const updateVideoInfo = () => {
      videoInfoTimer.current = setTimeout(async () => {
        if (!isMounted()) return;

        const videoOn = await fullScreenUser?.videoStatus.isOn();

        // Video statistic info doesn't update when there's no remote users
        if (!fullScreenUser || !videoOn || users.length < 2) {
          clearTimeout(videoInfoTimer.current);
          setVideoInfo('');
          return;
        }

        const fps = isSharing
          ? await fullScreenUser.shareStatisticInfo.getFps()
          : await fullScreenUser.videoStatisticInfo.getFps();

        const height = isSharing
          ? await fullScreenUser.shareStatisticInfo.getHeight()
          : await fullScreenUser.videoStatisticInfo.getHeight();

        const width = isSharing
          ? await fullScreenUser.shareStatisticInfo.getWidth()
          : await fullScreenUser.videoStatisticInfo.getWidth();

        setVideoInfo(`${width}x${height} ${fps}FPS`);
        updateVideoInfo();
      }, 1000);
    };

    updateVideoInfo();

    return () => clearTimeout(videoInfoTimer.current);
  }, [fullScreenUser, users, isMounted, isSharing]);


    const onPressShare = async () => {
    const isOtherSharing = await zoom.shareHelper.isOtherSharing();
    const isShareLocked = await zoom.shareHelper.isShareLocked();

    if (isOtherSharing) {
      Alert.alert('Other is sharing');
    } else if (isShareLocked) {
      Alert.alert('Share is locked by host');
    } else if (isSharing) {
      zoom.shareHelper.stopShare();
    } else {
      zoom.shareHelper.shareScreen();
    }
  };

    // onPress event for FlatList since RN doesn't provide container-on-press event
  const onListTouchStart = () => {
    touchTimer = setTimeout(() => {
      setIsLongTouch(true);
    }, 200);
  };

  // onPress event for FlatList since RN doesn't provide container-on-press event
  const onListTouchEnd = (event: any) => {
    // Toggle UI behavior
    // - Toggle only when user list or chat list is tapped
    // - Block toggling when tapping on a list item
    // - Block toggling when keyboard is shown
    if (event._targetInst.elementType.includes('Scroll') && isKeyboardOpen) {
      !isLongTouchRef.current && toggleUI();
    }
    clearTimeout(touchTimer);
    setIsLongTouch(false);
  };

  
  const chatSendButtonScaleAnimatedStyle = useAnimatedStyle(() => ({
    width: 38 * chatSendButtonScale.value,
    marginLeft: 8 * chatSendButtonScale.value,
    transform: [{scale: chatSendButtonScale.value}],
  }));

  useEffect(() => {
    const sessionJoinListener = zoom.addListener(
      EventType.onSessionJoin,
      async (session: any) => {
        setIsInSession(true);
        zoom.session.getSessionName().then(setSessionName);
        const mySelf: ZoomVideoSdkUser = new ZoomVideoSdkUser(session.mySelf);
        const remoteUsers: ZoomVideoSdkUser[] =
          await zoom.session.getRemoteUsers();
        const muted = await mySelf.audioStatus.isMuted();
        const videoOn = await mySelf.videoStatus.isOn();
        const speakerOn = await zoom.audioHelper.getSpeakerStatus();
        setUsersInSession([mySelf, ...remoteUsers]);
        setIsMuted(muted);
        setIsVideoOn(videoOn);
        setIsSpeakerOn(speakerOn);
        setFullScreenUser(mySelf);
      }
    );

    

    const sessionLeaveListener = zoom.addListener(
      EventType.onSessionLeave,
      () => {
        setIsInSession(false);
        setUsersInSession([]);
       
      }
    );

    const sessionNeedPasswordListener = zoom.addListener(
      EventType.onSessionNeedPassword,
      () => {
        Alert.alert('SessionNeedPassword');
      }
    );

    const sessionPasswordWrongListener = zoom.addListener(
      EventType.onSessionPasswordWrong,
      () => {
        Alert.alert('SessionPasswordWrong');
      }
    );

    const userVideoStatusChangedListener = zoom.addListener(
      EventType.onUserVideoStatusChanged,
      async ({ changedUsers }: { changedUsers: ZoomVideoSdkUserType[] }) => {
        const mySelf: ZoomVideoSdkUser = new ZoomVideoSdkUser(
          await zoom.session.getMySelf()
        );
        changedUsers.map((u: ZoomVideoSdkUserType) => {
          if (mySelf.userId === u.userId) {
            mySelf.videoStatus.isOn().then(on => setIsVideoOn(on));
          }
        });
      }
    );

    const userAudioStatusChangedListener = zoom.addListener(
      EventType.onUserAudioStatusChanged,
      async ({ changedUsers }: { changedUsers: ZoomVideoSdkUserType[] }) => {
        const mySelf: ZoomVideoSdkUser = new ZoomVideoSdkUser(
          await zoom.session.getMySelf()
        );
        changedUsers.map((u: ZoomVideoSdkUserType) => {
          if (mySelf.userId === u.userId) {
            mySelf.audioStatus.isMuted().then(muted => setIsMuted(muted));
          }
        });
      }
    );

    const userJoinListener = zoom.addListener(
      EventType.onUserJoin,
      async ({ remoteUsers }: { remoteUsers: ZoomVideoSdkUserType[] }) => {
        if (!isMounted()) return;
        const mySelf: ZoomVideoSdkUser = await zoom.session.getMySelf();
        const remote: ZoomVideoSdkUser[] = remoteUsers.map(
          (user: ZoomVideoSdkUserType) => new ZoomVideoSdkUser(user)
        );
        setUsersInSession([mySelf, ...remote]);
      }
    );

    const userLeaveListener = zoom.addListener(
      EventType.onUserLeave,
      async ({
        remoteUsers,
        leftUsers,
      }: {
        remoteUsers: ZoomVideoSdkUserType[];
        leftUsers: ZoomVideoSdkUserType[];
      }) => {
        if (!isMounted()) return;
        const mySelf: ZoomVideoSdkUser = await zoom.session.getMySelf();
        const remote: ZoomVideoSdkUser[] = remoteUsers.map(
          (user: ZoomVideoSdkUserType) => new ZoomVideoSdkUser(user)
        );
        if (fullScreenUser) {
          leftUsers.map((user: ZoomVideoSdkUserType) => {
            if (fullScreenUser.userId === user.userId) {
              setFullScreenUser(mySelf);
              return;
            }
          });
        } else {
          setFullScreenUser(mySelf);
        }
        setUsersInSession([mySelf, ...remote]);
      }
    );

    const userNameChangedListener = zoom.addListener(
      EventType.onUserNameChanged,
      async ({ changedUser }) => {
        setUsersInSession(
          users.map((u: ZoomVideoSdkUser) => {
            if (u && u.userId === changedUser.userId) {
              return new ZoomVideoSdkUser(changedUser);
            }
            return u;
          })
        );
      }
    );

    const userShareStatusChangeListener = zoom.addListener(
      EventType.onUserShareStatusChanged,
      async ({ user, status }: { user: ZoomVideoSdkUser; status: ShareStatus }) => {
        const shareUser: ZoomVideoSdkUser = new ZoomVideoSdkUser(user);
        const mySelf: ZoomVideoSdkUserType = await zoom.session.getMySelf();

        if (user.userId && status === ShareStatus.Start) {
          setSharingUser(shareUser);
          setFullScreenUser(shareUser);
          setIsSharing(shareUser.userId === mySelf.userId);
        } else {
          setSharingUser(undefined);
          setIsSharing(false);
        }
      }
    );

    const commandReceived = zoom.addListener(
      EventType.onCommandReceived,
      (params: { sender: string; command: string }) => {
        console.log(
          'sender: ' + params.sender + ', command: ' + params.command
        );
      }
    );

    const chatNewMessageNotify = zoom.addListener(
      EventType.onChatNewMessageNotify,
      (newMessage: ZoomVideoSdkChatMessageType) => {
        if (!isMounted()) return;
        setChatMessages([
          new ZoomVideoSdkChatMessage(newMessage),
          ...chatMessages,
        ]);
      }
    );

    const chatDeleteMessageNotify = zoom.addListener(
      EventType.onChatDeleteMessageNotify,
      (params: { messageID: string; deleteBy: ChatMessageDeleteType }) => {
        console.log(
          'onChatDeleteMessageNotify: messageID: ' +
          params.messageID +
          ', deleteBy: ' +
          params.deleteBy
        );
      }
    );

    const liveStreamStatusChangeListener = zoom.addListener(
      EventType.onLiveStreamStatusChanged,
      ({ status }: { status: LiveStreamStatus }) => {
        console.log(`onLiveStreamStatusChanged: ${status}`);
      }
    );

    const liveTranscriptionStatusChangeListener = zoom.addListener(
      EventType.onLiveTranscriptionStatus,
      ({ status }: { status: LiveTranscriptionStatus }) => {
        console.log(`onLiveTranscriptionStatus: ${status}`);
      }
    );



    const inviteByPhoneStatusListener = zoom.addListener(
      EventType.onInviteByPhoneStatus,
      (params: { status: PhoneStatus; reason: PhoneFailedReason }) => {
        console.log(params);
        console.log('status: ' + params.status + ', reason: ' + params.reason);
      }
    );


    const requireSystemPermission = zoom.addListener(
      EventType.onRequireSystemPermission,
      ({ permissionType }: { permissionType: SystemPermissionType }) => {
        switch (permissionType) {
          case SystemPermissionType.Camera:
            Alert.alert(
              "Can't Access Camera",
              'please turn on the toggle in system settings to grant permission'
            );
            break;
          case SystemPermissionType.Microphone:
            Alert.alert(
              "Can't Access Camera",
              'please turn on the toggle in system settings to grant permission'
            );
            break;
        }
      }
    );

    

    const eventErrorListener = zoom.addListener(
      EventType.onError,
      async (error: any) => {
        console.log('Error: ' + JSON.stringify(error));
       // Alert.alert('Error: ' + error.error);
        switch (error.errorType) {
          case Errors.SessionJoinFailed:
            // Alert.alert('Failed to join the session');
            break;
          
          default:
        }
      }
    );

    return () => {
      sessionJoinListener.remove();
      sessionLeaveListener.remove();
      sessionPasswordWrongListener.remove();
      sessionNeedPasswordListener.remove();
      userVideoStatusChangedListener.remove();
      userAudioStatusChangedListener.remove();
      userJoinListener.remove();
      userLeaveListener.remove();
      userNameChangedListener.remove();
      userShareStatusChangeListener.remove();
      chatNewMessageNotify.remove();
      liveStreamStatusChangeListener.remove();
      inviteByPhoneStatusListener.remove();
      eventErrorListener.remove();
      commandReceived.remove();
      chatDeleteMessageNotify.remove();
      liveTranscriptionStatusChangeListener.remove();
      requireSystemPermission.remove();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, users, chatMessages, isMounted]);

    const contentStyles = {
    ...styles.container,
    height: contentHeight,
  };
 const uiOpacityAnimatedStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
  }));

  const inputOpacityAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));
  const toggleUI = () => {
    const easeIn = Easing.in(Easing.exp);
    const easeOut = Easing.out(Easing.exp);
    uiOpacity.value = withTiming(uiOpacity.value === 0 ? 100 : 0, {
      duration: 300,
      easing: uiOpacity.value === 0 ? easeIn : easeOut,
    });
    inputOpacity.value = withTiming(inputOpacity.value === 0 ? 100 : 0, {
      duration: 300,
      easing: inputOpacity.value === 0 ? easeIn : easeOut,
    });
  };

     return (
    <View style={contentStyles}>
      <StatusBar hidden />
      <View style={styles.fullScreenVideo}>
        <VideoView
          user={fullScreenUser}
          sharing={fullScreenUser?.userId === sharingUser?.userId}
          preview={false}
          hasMultiCamera={false}
          multiCameraIndex={'0'}
          onPress={() => {
            isKeyboardOpen ? toggleUI() : Keyboard.dismiss();
          }}
          fullScreen
        />
      </View>

      <LinearGradient
        style={styles.fullScreenVideo}
        colors={[
          'rgba(0,0,0,0.6)',
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.6)',
        ]}
        locations={[0, 0.12, 0.88, 1]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <Animated.View
          style={[styles.contents, uiOpacityAnimatedStyle]}
          pointerEvents="box-none">
          <View style={styles.topWrapper} pointerEvents="box-none">
            <View style={styles.sessionInfo}>
              <View style={styles.sessionInfoHeader}>
                <Text style={styles.sessionName}>{sessionName}</Text>
                <Icon
                  name={"12345" ? 'locked' : 'unlocked'}
                />
              </View>
              <Text style={styles.numberOfUsers}>
                {`Participants: ${users.length}`}
              </Text>
            </View>

            <View style={styles.topRightWrapper}>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={onPressLeave}>
                <Text style={styles.leaveText}>LEAVE</Text>
              </TouchableOpacity>
              {fullScreenUser && videoInfo.length !== 0 && (
                <View style={styles.videoInfo}>
                  <Text style={styles.videoInfoText}>{videoInfo}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.middleWrapper} pointerEvents="box-none">
            <FlatList
              contentContainerStyle={styles.chatList}
              onTouchStart={onListTouchStart}
              onTouchEnd={onListTouchEnd}
              data={chatMessages}
              extraData={refreshFlatlist}
              renderItem={({ item }) => (
                <View>
                  <View style={styles.chatMessage}>
                    <Text style={styles.chatUser}>
                      {item.senderUser.userName}:
                    </Text>
                    <Text style={styles.chatContent}> {item.content}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      Alert.alert('Delete Message', 'Delete this message?', [
                        {
                          text: 'Cancel',
                          onPress: () => console.log('Cancel Pressed'),
                          style: 'cancel',
                        },
                        {
                          text: 'OK',
                          onPress: () => {
                            deleteChatMessage(item.messageID, item);
                          },
                        },
                      ]);
                    }}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item, index) =>
                `${String(item.timestamp)}${index}`
              }
              showsVerticalScrollIndicator={false}
              fadingEdgeLength={50}
              inverted
            />
            <View style={styles.controls}>
              <Icon
                containerStyle={styles.controlButton}
                name={isMuted ? 'unmute' : 'mute'}
                onPress={onPressAudio}
              />
              <Icon
                containerStyle={styles.controlButton}
                name={isSharing ? 'shareOff' : 'shareOn'}
                onPress={onPressShare}
              />
              <Icon
                containerStyle={styles.controlButton}
                name={isVideoOn ? 'videoOff' : 'videoOn'}
                onPress={onPressVideo}
              />
              <Icon
                containerStyle={styles.controlButton}
                name="more"
                onPress={onPressMore}
              />
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomWrapper} pointerEvents="box-none">
          {isInSession && isKeyboardOpen && (
            <FlatList
              style={styles.userList}
              contentContainerStyle={styles.userListContentContainer}
              onTouchStart={onListTouchStart}
              onTouchEnd={onListTouchEnd}
              data={users}
              extraData={users}
              renderItem={({ item }) => (
                <VideoView
                  user={item}
                  focused={item.userId === fullScreenUser?.userId}
                  onPress={selectedUser => setFullScreenUser(selectedUser)}
                  key={item.userId}
                />
              )}
              keyExtractor={(item) => item.userId}
              fadingEdgeLength={50}
              decelerationRate={0}
              snapToAlignment="center"
              snapToInterval={100}
              showsHorizontalScrollIndicator={false}
              horizontal
            />
          )}
          <Animated.View style={inputOpacityAnimatedStyle}>
            <View style={styles.chatInputWrapper}>
              <TextInput
                style={styles.chatInput}
                ref={chatInputRef}
                placeholder="Type comment"
                placeholderTextColor="#AAA"
                onChangeText={(text) => {
                  scaleChatSend(text.length !== 0);
                  setChatMessage(text);
                }}
                onSubmitEditing={sendChatMessage}
              />
              <Animated.View
                style={[
                  chatSendButtonScaleAnimatedStyle,
                  styles.chatSendButton,
                ]}>
                <Icon name="chatSend" onPress={sendChatMessage} />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={isRenameModalVisible}
          statusBarTranslucent>
          <TouchableOpacity style={styles.modalContainer} activeOpacity={1}>
            <View style={styles.modal}>
              <Text style={styles.modalTitleText}>Change Name</Text>
              <TextInput
                style={styles.renameInput}
                placeholder="New name"
                placeholderTextColor="#AAA"
                onChangeText={(text) => setNewName(text)}
              />
              <View style={styles.modalActionContainer}>
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    if (fullScreenUser) {
                      zoom.userHelper.changeName(
                        newName,
                        fullScreenUser.userId
                      );
                      setNewName('');
                      setIsRenameModalVisible(false);
                    }
                  }}
                >
                  <Text style={styles.modalActionText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => {
                    setNewName('');
                    setIsRenameModalVisible(false);
                  }}
                >
                  <Text style={styles.modalActionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* @ts-ignore: only calculates the keyboard height */}
        {/* <KeyboardArea
          style={styles.keyboardArea}
          isOpen={false}
          onChange={keyboardHeightChange}
        /> */}

        {!isInSession && (
          <View style={styles.connectingWrapper}>
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
  }

  const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#232323',
  },
  fullScreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  connectingWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  safeArea: {
    flex: 1,
  },
  contents: {
    flex: 1,
    alignItems: 'stretch',
  },
  sessionInfo: {
    width: 200,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sessionInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  numberOfUsers: {
    fontSize: 13,
    color: '#FFF',
  },
  topWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 8,
    paddingTop: 16,
  },
  topRightWrapper: {
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  middleWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  bottomWrapper: {
    paddingHorizontal: 8,
  },
  leaveButton: {
    paddingVertical: 4,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  leaveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E02828',
  },
  videoInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoInfoText: {
    fontSize: 12,
    color: '#FFF',
  },
  chatList: {
    paddingRight: 16,
  },
  chatMessage: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  chatUser: {
    fontSize: 14,
    color: '#CCC',
  },
  chatContent: {
    fontSize: 14,
    color: '#FFF',
  },
  controls: {
    alignSelf: 'center',
    paddingTop: 24,
  },
  controlButton: {
    marginBottom: 12,
  },
  deleteButton: {
    fontSize: 10,
    paddingLeft: 4,
  },
  deleteText: {
    color: '#FFF',
  },
  userList: {
    width: '100%',
  },
  userListContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  chatInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    height: 40,
    marginVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#666',
    color: '#AAA',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  chatSendButton: {
    height: 36,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  modalTitleText: {
    fontSize: 18,
    marginBottom: 8,
  },
  modalActionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalAction: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  moreItem: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreItemText: {
    fontSize: 16,
  },
  moreItemIcon: {
    width: 36,
    height: 36,
    marginLeft: 48,
  },
  moreModalTitle: {
    fontSize: 24,
  },
  renameInput: {
    width: 200,
    marginTop: 16,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: '#AAA',
    color: '#000',
  },
  keyboardArea: {
    height: 0,
    width: 0,
    zIndex: -100,
  },
});

