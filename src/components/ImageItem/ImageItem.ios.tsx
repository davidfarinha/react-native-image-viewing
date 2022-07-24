/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// TODO: [DEF]: [22/12/21]: Implement the same for android

import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  Platform,
} from "react-native";
import RNVideo from 'react-native-video';
import { Video } from 'expo-av';

import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";

import { getImageStyles, getImageTransform } from "../../utils";
import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import VideoPlayer from 'expo-video-player'

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;
const SCREEN_BEF = Dimensions.get("screen");
const contentPaddingTopScreen = 218;
const SCREEN = {...SCREEN_BEF, height: SCREEN_BEF.height - contentPaddingTopScreen };
const SCREEN_WIDTH = SCREEN.width;

const SCREEN_HEIGHT = SCREEN.height;

// const AnimatedVideoPlayer = Animated.createAnimatedComponent(VideoPlayer)

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (scaled: boolean) => void;
  onLongPress: (image: ImageSource) => void;
  delayLongPress: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
};

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  isFullscreen,
  currentImageSrc,
  setIsFullscreen,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = imageSrc.mediaType !== 'video',
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc);
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, SCREEN);


  const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
  const scrollValueY = new Animated.Value(0);
  const scaleValue = new Animated.Value((imageSrc.mediaType !== 'video' ? scale : 1) || 1);
  const translateValue = new Animated.ValueXY(translate);
  const maxScale = scale && scale > 0 ? Math.max(1 / scale, 1) : 1;

  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.5, 1, 0.5],
  });
  const refVideo = useRef(null)
  
  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );



  // useEffect(() => {
  //   refVideo.current.setStatusAsync({
  //     shouldPlay: true,
  //   })
  // }, [])

  const imageStylesWithOpacity = { ...imagesStyles, opacity: imageOpacity, borderRadius: 12 };

  const onScrollEndDrag = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = nativeEvent?.velocity?.y ?? 0;
      const scaled = nativeEvent?.zoomScale > 1;

      onZoom(scaled);
      setScaled(scaled);

      if (
        !scaled &&
        swipeToCloseEnabled &&
        Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY
      ) {
        // If video, stop playback
        if (refVideo.current?.setStatusAsync) {
          refVideo.current?.setStatusAsync?.({
            shouldPlay: false,
          })
        }
        
        onRequestClose();
      }
    },
    [scaled]
  );

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    if (nativeEvent?.zoomScale > 1) {
      return;
    }

    scrollValueY.setValue(offsetY);
  };

  const onLongPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      onLongPress(imageSrc);
    },
    [imageSrc, onLongPress]
  );

  // const appleId = imageSrc.localIdentifier;
  const appleId = imageSrc.localIdentifier.substring(0, 36);
  
  const assetLibraryUri = `assets-library://asset/asset.${'MOV'}?id=${appleId}&ext=${'MOV'}`;

  useEffect(() => {
    if (imageSrc.mediaType) {
      // refVideo.current.playAsync();
    }
    
    // shouldPlay: currentImageSrc === imageSrc,
  }, [])

  

  // [20/07/22]: HAVING ISSUES WITH EXPO-VIDEO/EXPO-AV. If you swipe 18 videos forwards, it stop loading. switchign to rnvideo instead
  return (
    <View style={{  }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        pinchGestureEnabled
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.scrollViewContainer}
        scrollEnabled={swipeToCloseEnabled}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}
        {...(swipeToCloseEnabled && {
          onScroll,
        })}
      >
        {(!loaded || !imageDimensions) && <ImageLoading />}
        <TouchableWithoutFeedback
          onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
          onLongPress={onLongPressHandler}
          delayLongPress={delayLongPress}
        >
          {imageSrc.mediaType === 'video' ?
          <Animated.View style={[
            imageStylesWithOpacity,
            {
              justifyContent: 'center',
              alignItems: 'center'
            }
          ]} >
            <RNVideo
            controls
            repeat
    source={{
        ...imageSrc, 
        uri: assetLibraryUri
    }}
    poster={assetLibraryUri}
    onLoad={() =>{
      setLoaded(true)
    }}
    onError={(error) =>{
      console.log('[error]', error);
      // setLoaded(true)
    }}
    resizeMode={"contain"}
    posterResizeMode={"contain"}
    style={{
      height: isFullscreen ? Dimensions.get('window').height : Dimensions.get('window').height - 200,
      width: isFullscreen ? Dimensions.get('window').width : Dimensions.get('window').width,
      
    }}
    // Can be a URL or a local file.
    // ref={(ref) => {
    //   this.player = ref
    // }}                                      // Store reference
    // onBuffer={this.onBuffer}                // Callback when remote video is buffering
    // onError={this.videoError}               // Callback when video cannot be loaded
    // style={styles.backgroundVideo}
/>
              {/* <VideoPlayer
              fullscreen={{
                enterFullscreen: () => {
                  setIsFullscreen(true);
                  // console.log('[enterFullscreen]', refVideo.current);
                  // refVideo.current.setStatusAsync({
                  //   shouldPlay: true,
                  // })
                },
                exitFullscreen: () => {
                  setIsFullscreen(false);
                  console.log('[exitFullscreen]');
                  refVideo.current.setStatusAsync({
                    shouldPlay: false,
                  })
                },
                inFullscreen: isFullscreen,
              }}
              videoProps={{
                onError: (error) => {
                  console.log('[error]', error);
                },
                resizeMode: "contain",
                // useNativeControls: true,
                isLooping: true,
                shouldPlay: currentImageSrc === imageSrc,
                ref: refVideo.current,
                
                onLoad: () => setLoaded(true),
                  source: {
                    // ...imageSrc, 
                    uri: assetLibraryUri
                  },
                }}
                style={{
                  height: isFullscreen ? Dimensions.get('window').height : Dimensions.get('window').height - 200,
                  width: isFullscreen ? Dimensions.get('window').width : Dimensions.get('window').width,
                  
                }}
            /> */}
          </Animated.View>
          : 
            <Animated.Image
              source={{ ...imageSrc, uri: `photos://${imageSrc.localIdentifier}`}}
              style={imageStylesWithOpacity}
              onLoad={() => setLoaded(true)}
            />
              }
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: SCREEN_BEF.width,
    height: SCREEN_BEF.height
  },
  scrollViewContainer: {
    height: SCREEN_BEF.height,
    paddingTop: 90,
    paddingBottom: 105,
  },
});

export default React.memo(ImageItem);
