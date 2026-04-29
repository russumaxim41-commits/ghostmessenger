import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  hue?: number;
  letter?: string;
  uri?: string | null;
  size?: number;
  square?: boolean;
};

export function Avatar({
  hue = 270,
  letter = "G",
  uri,
  size = 40,
  square,
}: Props) {
  const radius = square ? size * 0.28 : size / 2;
  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: `hsl(${hue}, 60%, 22%)`,
          borderColor: `hsla(${hue}, 70%, 60%, 0.7)`,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.letter,
            { color: `hsl(${hue}, 80%, 85%)`, fontSize: size * 0.42 },
          ]}
        >
          {letter}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  letter: {
    fontFamily: "Inter_700Bold",
  },
});
