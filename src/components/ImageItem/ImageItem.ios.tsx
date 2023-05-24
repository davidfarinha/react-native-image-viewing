/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


// TODO: [DEF]: [22/12/21]: Implement the same for android

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageResizeMode from 'react-native/Libraries/Image/ImageResizeMode'
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

const borderRadius = 12;

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  rowRefs,
  onLongPress,
  delayLongPress,
  index,
  isFullscreen,
  isCurrentImage,
  isActionable,
  setIsFullscreen,
  assetsActionedHidden,
  assetsActionedAlbums,
  assetsActionedDeleted,
  getVideoDurationPretty,
  assetsActionedFavorited,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = imageSrc.mediaType !== 'video',
}: Props) => {

  // If not actionable, we don't display footer so we can make image height bigger
  const SCREEN = useMemo(() => ({width: SCREEN_BEF.width, height: isActionable ? SCREEN_BEF.height - 340 : SCREEN_BEF.height - 160 }), [SCREEN_BEF]);



  const styles = useMemo(() => StyleSheet.create({
    scrollView: {
      width: SCREEN.width,
      // paddingTop: contentPaddingTopScreen / 2,
      height: SCREEN.height,
      // alignSelf: 'center',
      marginTop:  125,
    },
    scrollViewContentContainer: {
      flex: 1,
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
      
      // paddingHorizontal: '6%'
      // height: SCREEN_BEF.height,

      // paddingTop: 110,
      // paddingBottom: 125,
      
      
    },
  }), [SCREEN, isActionable]);


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

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  // useEffect(() => {
  //   setTimeout(() => {
  //     forceUpdate();

  //     setTimeout(() => {
  //       forceUpdate();

  //       setTimeout(() => {
  //         forceUpdate();
  //       }, 200)
  //     }, 200)
  //   }, 200)
    
  // }, [imageSrc, imageDimensions])

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
    // we need rowRefs, that has the most accurate data, esepcially when image expanding without first navigating ot the sweep screen when actioned state might not be initialzed yert. If we don't have rowRefs, use actioned state
    return rowRefs ? rowRefs[imageSrc?.localIdentifier]?.inAlbums : Object.keys(assetsActionedAlbums).reduce((prev, currentKey) => {

      const currentAlbum = assetsActionedAlbums[currentKey];
  
      
  
      if (currentAlbum?.has(imageSrc?.localIdentifier)) {
        
        prev.push(currentKey)
      }
      return prev;
    }, []);
  }, [rowRefs, assetsActionedAlbums])

  


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
		height: 36,
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

  const refPrevIsPlaying = useRef(0);
  const [shouldHideInAlbumsTiles, setShouldHideInAlbumsTiles] = useState(false);

  const [containerDimensions, setContainerDimensions] = useState(undefined);
  const [imageContainerDimensions, setImageContainerDimensions] = useState(undefined);
  // const [photoContainer, setPhotoContainer] = useState({
  //   width: undefined,
  //   height: undefined
  // });
	

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: 1,
        animated: true
      })

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: 0,
          animated: true
        })

        setTimeout(() => {
          forceUpdate();
        }, 0)
      }, 60)

      
    }, 1)
    
    
  }, [])



  // Calculate 'contain' resizeMode for <Image manually as we can't apply borderradius with contain resize mode and has the spacing/background issue
  const imageAspectRatio = imagesStyles.width / imagesStyles.height;
  // Since aspectRatio style applied to image container breaks with centered height, we need to manually calculate the remainig height and /2 and apply margin for vertically centering plus aspectRatio
  const imageHeightRemaining = !containerDimensions?.width || !imageContainerDimensions?.width ? 0 :  (containerDimensions?.height - imageContainerDimensions.height);


  console.log('[render]111', {imageAspectRatio,imageHeightRemaining, containerDimensions, imagesStyles, imageDimensions, translateValue, scaleValue });
  

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
        
        {(!loaded || !imageDimensions) && <ImageLoading  />}
        
          <View style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', ...(imagesStyles.width && imageSrc.mediaType === 'image' ? {  paddingTop: imageHeightRemaining / 2 } : {  })  }} onLayout={(e) => {
            
            setContainerDimensions(e.nativeEvent.layout);

            // if (!containerDimensions) {
            //   setContainerDimensions(e.nativeEvent.layout);
            // } else if (e.nativeEvent.layout.height !== containerDimensions?.height || e.nativeEvent.layout.width !== containerDimensions?.width) {
           
            //   setContainerDimensions(e.nativeEvent.layout);
            // }
            
            
          }}>
           
          <Animated.View  style={{ flex: 1, ...(imagesStyles.width && imageSrc.mediaType === 'image' ? {  } : {  }) , position: 'relative', opacity: !imagesStyles?.height ? 0 : 1, height: (imagesStyles?.height || 1)  * (scale || 1), width: (imagesStyles?.width || 1) * (scale || 1), shadowOpacity: 1, shadowColor: 'white'}} >
            <View style={{  ...(imagesStyles.width && imageSrc.mediaType === 'image' ? {  aspectRatio: (imagesStyles.width / imagesStyles.height) } : { flex: 1 }) ,   }} >
          {/* <Animated.View style={{ flex: 1, position: 'relative', height: 200, width: 200}}> */}
          
            {/* <TouchableWithoutFeedback
              onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
              onLongPress={onLongPressHandler}
              delayLongPress={delayLongPress}
              style={{
              
              }}
            >
              <Animated.View style={{flex: 1}}> */}
              {/* <Animated.View style={{flex: 1, position: 'relative'}}> */}
              {/* {imageSrc.mediaType === 'video' && <Text style={{
                position: 'absolute',
                left: 6,
                top: 6,
                zIndex: 99,
                fontFamily: 'Quicksand-Medium',
                fontWeight: 'bold',
                fontSize: 16,
                color: 'white'
              }}>{getVideoDurationPretty(imageSrc)}</Text>} */}
              {imageSrc.mediaType === 'video' ?
                <RNVideo

                controls

                paused={!shouldPlay}
                repeat
                onPlaybackRateChange={(event) => {
                  
                  if (refPrevIsPlaying.current === 0 && event.playbackRate >= 1) {
                    console.log('[onPlaybackRateChange] - setShouldHideInAlbumsTiles(false)', event.playbackRate, refPrevIsPlaying.current);
                    setShouldHideInAlbumsTiles(true);
                  } else if (shouldHideInAlbumsTiles === true) {
                    console.log('[onPlaybackRateChange] - setShouldHideInAlbumsTiles(true)', event.playbackRate, refPrevIsPlaying.current);
                    setShouldHideInAlbumsTiles(false);
                  }
                  refPrevIsPlaying.current = event.playbackRate;
                }}
        //         onProgress={(data) => {
				// 	console.log(data.currentTime);
				// }}
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
                  
                  flex: 1,
                  // Fixing weird black border issue with RNVideo [https://github.com/react-native-video/react-native-video/issues/1638#issuecomment-697368222]
                  borderBottomWidth: 1,
                  borderBottomColor: 'transparent',
                  // borderWidth: 0
                  
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
                  : !!imagesStyles.height &&
                    <Image
                      source={{  uri: `ph://${imageSrc.localIdentifier}`}}
                      onLayout={(e) => {
                        

                        setImageContainerDimensions(e.nativeEvent.layout)
                      }}
                      style={{
                        // flex: 1,
                        // height: imageHeightContain,
                        // width: imageWidthContain,
                        height: '100%',
                        width: '100%',
                        
                        
                        borderRadius,
                        // backgroundColor: 'black',
                        // flex: 1 
                        
                        
                      }}
                      // Using contain here causes images to be blurry on iOS. tried many things including wrapping it in a view, manually calculating height/width etc but didn't work

                      // stretch to try and ficx bluty image
                      resizeMode={'stretch'}
                      onLoad={() => setLoaded(true)}
                    />}
                    
                     
                {
                // inAlbums?.length ? <>
                //   <View style={{
                //     backgroundColor: '#3BB4C3',
                //     opacity: 0.3,
                //     ...StyleSheet.absoluteFillObject,
                //     borderRadius,
                //     justifyContent: 'center',
                //     alignItems: 'center'
                //   }} /> 

                // </> :
                isActionedDeleted ? <>
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
                     backgroundColor: '#447FD9',
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

                 {/* {inAlbums?.length ? <View style={{ position: 'absolute', bottom: (actualImagePxFromBottom / 2) + 6, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', padding: 5, overflow: 'hidden', justifyContent: inAlbums.length >= maxAlbumLinesAllowed ? 'center' : 'flex-start' }}> */}
                 {/* // NEEDS POINTEREVENTS = NONE! or else videos with album tiles cannot be controlled. All buttons are unusable */}
        {/* {(inAlbums?.length && shouldHideInAlbumsTiles === false) ? */}
        {(inAlbums?.length && imageSrc.mediaType !== 'video') ?
        <View  pointerEvents="none" style={{ position: 'absolute',
        borderRadius: 12,
        // make album appear ontop of delete/favourite overlays
        zIndex: 999,
        bottom: 0, left: 0, height: '100%', width: '100%', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', overflow: 'hidden', justifyContent: inAlbums.length >= maxAlbumLinesAllowed ? 'center' : 'flex-start' }}>
            {inAlbums.slice(0, maxAlbumLinesAllowed).map((title, i) => <Text key={i} style={{
              fontFamily: 'Quicksand-SemiBold',
              fontSize: 10,
              lineHeight: 12,
              // textAlign: 'center',
              backgroundColor: 'rgba(59,180,195,0.69)',
              paddingHorizontal: 12,
              paddingVertical: 4,
              // marginBottom: 6,
              width: '100%',
              overflow: 'hidden',
              // We onlt want to clip te list of albums if they reach the top (to accomodate space for te favorited/deleted icons on the top right) and if we clip, we want to clip ALL albums so the styles match all the way down. if there's not enough albums to reach the top or near the icon, don't clip 
            color: 'white',
            maxWidth: (inAlbums.length >= (maxAlbumLinesAllowed - 2)) ? (SCREEN.width - 16 - 48) : '100%'  }} numberOfLines={1} ellipsizeMode={'tail'} >{(i + 1) === maxAlbumLinesAllowed ? `+${inAlbums.length - i} more` : title}</Text>)}
          </View> : null}
          </View>
          </Animated.View>
        </View>
       
       
      </ScrollView>
  );
};

export default React.memo(ImageItem);
