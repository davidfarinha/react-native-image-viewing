/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { ComponentType, useCallback, useEffect, useImperativeHandle, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
  Modal,
} from "react-native";

import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import StatusBarManager from "./components/StatusBarManager";

import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
import { ImageSource } from "./@types";

type Props = {
  images: ImageSource[];
  keyExtractor?: (imageSrc: ImageSource, index: number) => string;
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onLongPress?: (image: ImageSource) => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps["presentationStyle"];
  isActionable?: boolean;
  animationType?: ModalProps["animationType"];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  delayLongPress?: number;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
};

const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_BG_COLOR = "#000";
const DEFAULT_DELAY_LONG_PRESS = 800;
const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;

const ImageViewing = React.forwardRef(({
  images,
  children,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  onLongPress = () => {},
  onImageIndexChange,
  isActionable,
  rowRefs,
  onImageIndexWillChange,
  animationType = DEFAULT_ANIMATION_TYPE,
  backgroundColor = DEFAULT_BG_COLOR,
  presentationStyle,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  HeaderComponent,
  getVideoDurationPretty,
  FooterComponent,
  assetsActionedDeleted,
  assetsActionedFavorited,
  assetsActionedHidden,
  assetsActionedAlbums
}: Props, ref) => {
  const imageList = React.createRef<VirtualizedList<ImageSource>>();
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [currentImageIndex, onScroll, onScrollEnd, setImageIndex] = useImageIndexChange(imageIndex, SCREEN, onImageIndexWillChange);

  const [
    headerTransform,
    footerTransform,
    toggleBarsVisible,
  ] = useAnimatedComponents();

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  useImperativeHandle(ref, () => ({
    setImageIndex: (index) => {
      
      
      imageList.current?.scrollToIndex({ animated: true, index })
      setImageIndex(index);
    }
  }))


  useEffect(() => {
      if (onImageIndexChange) {
        onImageIndexChange(currentImageIndex);
      }
  }, [currentImageIndex]);

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // @ts-ignore
      imageList?.current?.setNativeProps({ scrollEnabled: !isScaled });
      toggleBarsVisible(!isScaled);
    },
    [imageList],
  );


  useEffect(() => {
    setTimeout(() => {
      
      imageList.current?.scrollToOffset({ animated: true, offset: 1 });

      setTimeout(() => {
        imageList.current?.scrollToOffset({ animated: true, offset: 0 });
      }, 60)
    }, 1)
    
    
  }, [])




  useEffect(() => {
    forceUpdate();

    setTimeout(() => {
      forceUpdate();
    }, 500)
  }, [imageIndex])
  // if (!visible) {
  //   return null;
  // }



  return (
    <Modal
      transparent={presentationStyle === "overFullScreen"}
      visible={visible}
      presentationStyle={presentationStyle}
      animationType={animationType}
      onRequestClose={onRequestCloseEnhanced}
      supportedOrientations={["portrait"]}
      hardwareAccelerated
      
    >
      {/* <View style={{ left: '50%', borderRightWidth: 1, borderRightColor: 'black', height: 3000, position: 'absolute', bottom: 0, zIndex: 999 }} /> */}
      <StatusBarManager presentationStyle={presentationStyle} />
      {children}
      <View style={[styles.container, { opacity, backgroundColor }]}>
        <Animated.View style={[styles.header]}>
          {/* // [06/09/22]: Had to remove 'React.createElement' stuff since it was causing a flicker on icons etc when sliding */}
          {typeof HeaderComponent !== "undefined" && isFullscreen === false
            ? (
              HeaderComponent
            )
            : (
              <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced} />
            )}
        </Animated.View>
        <VirtualizedList
          ref={imageList}
          contentContainerStyle={{
            minHeight: 1
          }}
          data={images}
          horizontal
          pagingEnabled
          windowSize={3}
          // DONT USE THESE! seems to cause only X (windowSize) items to display, scrolling past that shows blank items
          // initialNumToRender={1}
          // maxToRenderPerBatch={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={imageIndex}
          getItem={(_, index) => images[index]}
          getItemCount={() => images.length}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          extraData={{
            currentImageIndex,
            imageIndex,
            isActionable,
            assetsActionedDeleted,
            assetsActionedFavorited,
            assetsActionedAlbums,
            assetsActionedHidden,
            rowRefs
          }}
          renderItem={({ item: imageSrc, index, }) => {
            return (
              <ImageItem
              getVideoDurationPretty={getVideoDurationPretty}
                onZoom={onZoom}
                imageSrc={imageSrc}
                onRequestClose={onRequestCloseEnhanced}
                onLongPress={onLongPress}
                index={index}
                isFullscreen={isFullscreen}
                isActionable={isActionable}
                isCurrentImage={currentImageIndex === index}
                setIsFullscreen={setIsFullscreen}
                currentImageSrc={images[currentImageIndex]}
                delayLongPress={delayLongPress}
                rowRefs={rowRefs}
                swipeToCloseEnabled={swipeToCloseEnabled}
                doubleTapToZoomEnabled={doubleTapToZoomEnabled}
                assetsActionedDeleted={assetsActionedDeleted}
                assetsActionedFavorited={assetsActionedFavorited}
                assetsActionedHidden={assetsActionedHidden}
                assetsActionedAlbums={assetsActionedAlbums}
              />
            )
          }}
          onMomentumScrollEnd={onScroll}
          onScrollEndDrag={onScrollEnd}
          //@ts-ignore
          keyExtractor={(imageSrc, index) => {
            return keyExtractor ? keyExtractor(imageSrc, index) : imageSrc._uri || `${imageSrc}`;
          }}
        />
        {typeof FooterComponent !== "undefined" && isFullscreen === false && (
          <Animated.View
            style={[styles.footer]}
          >
            {FooterComponent}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    top: 0,
  },
  footer: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    bottom: 0,
  },
});

const EnhancedImageViewing = (props: Props, ref) => (
  <ImageViewing key={props.imageIndex} {...props} ref={ref} />
);

export default ImageViewing;
