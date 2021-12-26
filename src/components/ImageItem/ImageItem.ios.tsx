/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// TODO: [DEF]: [22/12/21]: Implement the same for android

import React, { useCallback, useRef, useState } from "react";

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
import { Video } from 'expo-av';

import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";

import { getImageStyles, getImageTransform } from "../../utils";
import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import VideoPlayer from 'expo-video-player'

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;
const SCREEN = Dimensions.get("screen");
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
  const imageStylesWithOpacity = { ...imagesStyles, opacity: imageOpacity };

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

  const appleId = imageSrc.uri.substring(9, 45);
  const assetLibraryUri = `assets-library://asset/asset.${'MOV'}?id=${appleId}&ext=${'MOV'}`;
  
  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.listItem}
        pinchGestureEnabled
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.imageScrollContainer}
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
          {imageSrc.mediaType === 'video' ? <Animated.View style={[
            imageStylesWithOpacity,
            {
              justifyContent: 'center',
              alignItems: 'center'
            }
          ]} >
              <VideoPlayer
              fullscreen={{
                enterFullscreen: () => {
                  setIsFullscreen(true);
                  // console.log('[refVideo]', refVideo.current);
                  refVideo.current.setStatusAsync({
                    shouldPlay: true,
                  })
                },
                exitFullscreen: () => {
                  setIsFullscreen(false);
                  refVideo.current.setStatusAsync({
                    shouldPlay: false,
                  })
                },
                inFullscreen: isFullscreen,
              }}
              videoProps={{
                resizeMode: "contain",
                // useNativeControls: true,
                isLooping: true,
                ref: refVideo,
                // shouldPlay: true,
                onLoad: () => setLoaded(true),
                  source: {
                    uri: assetLibraryUri
                  },
                }}
                style={{
                  height: isFullscreen ? Dimensions.get('window').height : Dimensions.get('window').height - 200,
                  width: isFullscreen ? Dimensions.get('window').width : Dimensions.get('window').width,
                  
                }}
            />
          </Animated.View> : <Animated.Image
            source={{
              ...imageSrc,
              uri: imageSrc._uri || imageSrc.uri
            }}
            style={imageStylesWithOpacity}
            onLoad={() => setLoaded(true)}
          />}
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT
  },
});

export default React.memo(ImageItem);
