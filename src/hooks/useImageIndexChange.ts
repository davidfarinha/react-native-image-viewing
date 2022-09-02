/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

import { Dimensions } from "../@types";

const useImageIndexChange = (imageIndex: number, screen: Dimensions, onImageIndexWillChange: (nextIndex: number) => void ) => {
  const [currentImageIndex, setImageIndex] = useState(imageIndex);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      nativeEvent: {
        contentOffset: { x: scrollX },
        contentSize,
        velocity
      },
    } = event;

    if (velocity?.x !== undefined && velocity?.x !== 0) {
      let nextIndex = imageIndex;
      if (velocity?.x > 0) {
        nextIndex++;
      } else if (velocity?.x < 0) {
        nextIndex--;
      }
      const maxIndex = (contentSize.width / screen.width) - 1;
      nextIndex = Math.max(Math.min(nextIndex, maxIndex), 0)
      // onImageIndexWillChange(nextIndex)
      setImageIndex(nextIndex);
    }

  }
  
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      nativeEvent: {
        contentOffset: { x: scrollX },
      },
    } = event;

    console.log('[onScroll]')
    if (screen.width) {
      const nextIndex = Math.round(scrollX / screen.width);
      
      // If we uncomment, it will waist iuntul all scroll transitions finish to change the incex. Improving to the onScrollEnd which reflects the next index instantly
      // setImageIndex(nextIndex < 0 ? 0 : nextIndex);
    }
  };

  return [currentImageIndex, onScroll, onScrollEnd, setImageIndex] as const;
};

export default useImageIndexChange;
