/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from "react";

import { ActivityIndicator, Dimensions, StyleSheet, View } from "react-native";

const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;

export const ImageLoading = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={'#FF7400'} />
  </View>
);

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loading: {
    // width: SCREEN_WIDTH,
    // height: SCREEN_HEIGHT,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    ...StyleSheet.absoluteFillObject
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT,
  },
});
