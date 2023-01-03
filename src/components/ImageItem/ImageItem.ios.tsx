/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// TODO: [DEF]: [22/12/21]: Implement the same for android

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  Image,
  Text,
} from "react-native";
import { Icon } from 'native-base';
// import RNVideo from 'react-native-video-controls';
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

// const contentPaddingTopScreen = 220;


const SCREEN = {width: SCREEN_BEF.width, height: SCREEN_BEF.height - 310 };


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

const borderRadius = 18;

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  
  onLongPress,
  delayLongPress,
  index,
  isFullscreen,
  isCurrentImage,
  setIsFullscreen,
  assetsActionedHidden,
  assetsActionedAlbums,
  assetsActionedDeleted,
  assetsActionedFavorited,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = imageSrc.mediaType !== 'video',
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc);
  
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, SCREEN);


  const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
  const scrollValueY = new Animated.Value(1);
  const scaleValue = new Animated.Value((imageSrc.mediaType !== 'video' ? scale : scale) || 1);
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
    scaleValue,
    // translateValue,
    // scaleValue
  );

  const shouldStartPlaying = isCurrentImage && loaded;
  

  // useEffect(() => {
  //   setShouldPlay(shouldStartPlaying)
    
  // }, [shouldStartPlaying])

  useEffect(() => {
    setShouldPlay(shouldStartPlaying)
    
  }, [shouldStartPlaying])

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

  // console.log('[imageSrc]', imageSrc)
  
  const assetLibraryUri = `assets-library://asset/asset.${'MOV'}?id=${appleId}&ext=${'MOV'}`;

  const photosUri =  `photos://${imageSrc.localIdentifier}`;

  let uri = `ph://${imageSrc.localIdentifier}`;

	// console.log('[uri]', uri);

  

  // useEffect(() => {
  //   if (imageSrc.mediaType) {
  //     refVideo.current.playAsync();
  //   }
    
  //   // shouldPlay: currentImageSrc === imageSrc,
  // }, []);

  
  const isActionedDeleted = useMemo(() => assetsActionedDeleted?.has(imageSrc?.localIdentifier), [assetsActionedDeleted, imageSrc]);
  const isActionedFavorited = useMemo(() => imageSrc.isFavorite || assetsActionedFavorited?.has(imageSrc?.localIdentifier), [assetsActionedFavorited, imageSrc])
  const isActionedHidden = useMemo(() => imageSrc.isHidden || assetsActionedHidden?.has(imageSrc?.localIdentifier), [assetsActionedHidden, imageSrc]);
  const inAlbums = useMemo(() => {
    return Object.keys(assetsActionedAlbums).reduce((prev, currentKey) => {

      const currentAlbum = assetsActionedAlbums[currentKey];

      

      if (currentAlbum?.has(imageSrc?.localIdentifier) || (imageSrc.inAlbums?.indexOf?.(currentKey) > -1)) {
        
        prev.push(currentKey)
      }
      return prev;
    }, []);
  }, [assetsActionedAlbums, imageSrc]);

  

  // hook uses min, either width or height scale. but we need to calculate just the height scale again so we can determine how far from the bottom of teh screen to start rendering the 
  // inAlbums list. Which renders outside the container with scale applied (since the parent scale fucks up the text size of inAlbums). So have to recreate the height from bottom of the main
  // container to render the inAlbums list
  // const scaleImageHeight = imageDimensions?.height ?  SCREEN.height / imageDimensions!.height : undefined
  const actualImagePxFromBottom = imageDimensions?.height ?  SCREEN.height - (imageDimensions!.height * scale) : 0;
  
  const actualImagePxFromSide = imageDimensions?.width ?  SCREEN.width - (imageDimensions!.width * scale) : 0;
  // console.log('[inAlbums]', {actualImagePxFromBottom, calc: (imageDimensions?.height * scale), SCREEN: SCREEN.height});
  

  

  
  
  // if (shouldStartPlaying)
  
  // const isActionedDeleted = assetsActionedDeleted.indexOf
  // assetsActionedFavorited


  const renderedDeletedContent = useMemo(() => <Image source={require('../../../../../src/shared/components/AssetInteractable/images/trash.png')} style={{
    position: 'absolute',
		// right: 0,
		// top: 0,
    // bottom: 0,
    // left: 0,
    
    zIndex: 999,
    height: 38,
    width: 42
  }} />, []);

	const renderedFavoritedContent = useMemo(() => <Image source={require('../../../../../src/shared/images/favourite.png')} style={{
    position: 'absolute',

    zIndex: 999,
		height: 38,
    width: 40
  }} />, []);

  const renderedHiddenContent = useMemo(() => <Icon type="FontAwesome5" name='eye-slash'   style={{
    position: 'absolute',
		zIndex: 999,
		fontSize: 26,
		left: ((actualImagePxFromSide / 2) || 0) + 12,

		color: 'white',
		top: ((actualImagePxFromBottom / 2) + 12)
  }} />, [actualImagePxFromSide, actualImagePxFromBottom]);


  const maxAlbumLinesAllowed = 12

  // let uri = `ph://${currentImage?.localIdentifier}`;

  if (isCurrentImage) {
    console.log('[uri]', { loaded, isCurrentImage, index, shouldPlay});
    
  }
	

  // console.log('photosUri', scale, imagesStyles?.height, imagesStyles?.width);
  

  // [20/07/22]: HAVING ISSUES WITH EXPO-VIDEO/EXPO-AV. If you swipe 18 videos forwards, it stop loading. switchign to rnvideo instead
  return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        pinchGestureEnabled
        nestedScrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.scrollViewContentContainer}
        scrollEnabled={swipeToCloseEnabled}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}
        {...(swipeToCloseEnabled && {
          onScroll,
        })}
      >
        {isActionedHidden ? renderedHiddenContent : null}
        {isActionedDeleted ? renderedDeletedContent : isActionedFavorited && renderedFavoritedContent}
        
        {(!loaded || !imageDimensions) && <ImageLoading />}
        
          <View style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
           
          <Animated.View style={{ flex: 1, position: 'relative', height: (imagesStyles?.height || 1)  * (scale || 1), width: (imagesStyles?.width || 1) * (scale || 1)}}>
          {/* <Animated.View style={{ flex: 1, position: 'relative', height: 200, width: 200}}> */}
          
            {/* <TouchableWithoutFeedback
              onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
              onLongPress={onLongPressHandler}
              delayLongPress={delayLongPress}
              style={{
              
              }}
            >
              <Animated.View style={{flex: 1}}> */}
              {imageSrc.mediaType === 'video' ?
                <RNVideo
                controls

                paused={!shouldPlay}
                repeat
                
                source={{
                    // ...imageSrc, 
                    uri: uri
                }}
                poster={uri}
                onLoad={() =>{
                  setLoaded(true)

                  // if (isCurrentImage && !shouldPlay) {
                  //   setTimeout(() => {
                  //     console.log('[1]');
                  //     setShouldPlay(true)
                  //   }, 1000)
                    

                  // };
                }}
                onReadyForDisplay={() => {
                  // console.log('[onReadyForDisplay]');

                  setLoaded(true)

                  // if (isCurrentImage && !shouldPlay) {
                  //   setTimeout(() => {
                  //     console.log('[2]');
                  //     setShouldPlay(true)
                  //   }, 1000)

                  // };
                }}
                onError={(error) =>{
                  console.log('[error]', error);
                  // setLoaded(true)
                }}
                resizeMode={"contain"}
                posterResizeMode={"contain"}
                style={{
                  // height: isFullscreen ? Dimensions.get('window').height : '100%',
                  // width: isFullscreen ? Dimensions.get('window').width : '100%',
                  height: '100%',
                  width: '100%',
                  borderRadius,
                  flex: 1
                  
                }}
            /> 
              //  <Video
               
              //  defaultControlsVisible={false}
              //  fullscreen={undefined}
              //  useNativeControls={false}
              //  controls={false}

              // fullscreen={{
              //   enterFullscreen: () => {
              //     setIsFullscreen(true);
              //     // console.log('[refVideo]', refVideo.current);
              //     refVideo.current.setStatusAsync({
              //       shouldPlay: true,
              //     })
              //   },
              //   exitFullscreen: () => {
              //     setIsFullscreen(false);
              //     refVideo.current.setStatusAsync({
              //       shouldPlay: false,
              //     })
              //   },
              //   inFullscreen: isFullscreen,
              // }}
              
            //   resizeMode={"contain"}
            //   useNativeControls={false}
            //   isLooping={true}
            //   onVideo
            //   onError={(_, __) => {
            //     console.error('AN error ', _,);
            //   }}               
            //   ref={refVideo}
            //   shouldPlay={shouldPlay}
            //   controls={false}
            //   onLoad={() => setLoaded(true)}
            //     source={{
            //       uri: uri
            //     }}
            //     style={{
            //       // height: '100%',
            //       // width: '100%',
            //       borderRadius,
            //       flex: 1

            //     }}
                
            // />
            
                  : 
                  
                    <Image
                      source={{  uri: `ph://${imageSrc.localIdentifier}`}}
                      style={{
                        height: '100%',
                        width: '100%',
                        borderRadius
                      }}
                      onLoad={() => setLoaded(true)}
                    />}
                     
                  {/* </Animated.View>
              </TouchableWithoutFeedback>    */}
                {inAlbums?.length ? <>
                  <View style={{
                    backgroundColor: '#3BB4C3',
                    opacity: 0.3,
                    ...StyleSheet.absoluteFillObject,
                    borderRadius,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }} />

                </> : isActionedDeleted ? <>
                  <View style={{
                    backgroundColor: '#141414',
                    opacity: 0.35,
                    ...StyleSheet.absoluteFillObject,
                    borderRadius,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }} />
                </> : isActionedFavorited ? <>
                  <View style={{
                     backgroundColor: '#2D78E7',
                     opacity: 0.35,
                     justifyContent: 'center',
                     alignItems: 'center',
                     ...StyleSheet.absoluteFillObject,
                     borderRadius,
                     zIndex: 999
                  }} />
                  
                </> : isActionedHidden ? <>
                  <View style={{
                    backgroundColor: '#141414',
                    opacity: 0.20,
                    ...StyleSheet.absoluteFillObject,
                    borderRadius,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }} />
                </> : null}
          </Animated.View>
        </View>
        {inAlbums?.length ? <View style={{ position: 'absolute', bottom: (actualImagePxFromBottom / 2) + 6, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', padding: 5, overflow: 'hidden', justifyContent: inAlbums.length >= maxAlbumLinesAllowed ? 'center' : 'flex-start' }}>
            {inAlbums.slice(0, maxAlbumLinesAllowed).map((title, i) => <Text key={i} style={{
              fontFamily: 'Quicksand-SemiBold',
              fontSize: 10,
              lineHeight: 12,
              textAlign: 'center',
              backgroundColor: '#3BB4C3',
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginBottom: 6,
              width: '100%',
              overflow: 'hidden',
              borderRadius: 12,
              // We onlt want to clip te list of albums if they reach the top (to accomodate space for te favorited/deleted icons on the top right) and if we clip, we want to clip ALL albums so the styles match all the way down. if there's not enough albums to reach the top or near the icon, don't clip 
            color: 'white',
            maxWidth: (inAlbums.length >= (maxAlbumLinesAllowed - 2)) ? (SCREEN.width - 16 - 48) : '100%'  }} numberOfLines={1} ellipsizeMode={'tail'} >{(i + 1) === maxAlbumLinesAllowed ? `+${inAlbums.length - i} more` : title}</Text>)}
          </View> : null}

       
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: SCREEN.width,
    // paddingTop: contentPaddingTopScreen / 2,
    height: SCREEN.height,
    alignSelf: 'center',
    marginTop: -80
  },
  scrollViewContentContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: '6%'
    // height: SCREEN_BEF.height,

    // paddingTop: 110,
    // paddingBottom: 125,
    
    
  },
});

export default React.memo(ImageItem);
