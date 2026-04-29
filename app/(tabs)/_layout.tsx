import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { FloatingDrop } from "@/components/FloatingDrop";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function TabLayout() {
  const isWeb = Platform.OS === "web";
  const { tokens, resolved } = useTheme();
  const { t } = useLocale();

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: tokens.tabActive,
          tabBarInactiveTintColor: tokens.tabInactive,
          tabBarLabelStyle: {
            fontFamily: "Inter_500Medium",
            fontSize: 11,
            marginTop: -2,
          },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: isWeb ? 84 : 88,
            paddingTop: 8,
          },
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              {isWeb ? (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor:
                        resolved === "light"
                          ? "rgba(255,255,255,0.65)"
                          : "rgba(10,8,18,0.7)",
                      // @ts-ignore web only
                      backdropFilter: "blur(28px)",
                      // @ts-ignore web only
                      WebkitBackdropFilter: "blur(28px)",
                    },
                  ]}
                />
              ) : (
                <BlurView
                  tint={resolved === "light" ? "light" : "dark"}
                  intensity={70}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: tokens.cardBorder,
                }}
              />
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.chats"),
            tabBarIcon: ({ color }) => (
              <Feather name="message-circle" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="nearby"
          options={{
            title: t("tabs.nearby"),
            tabBarIcon: ({ color }) => (
              <Feather name="radio" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: t("tabs.groups"),
            tabBarIcon: ({ color }) => (
              <Feather name="users" size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("tabs.settings"),
            tabBarIcon: ({ color }) => (
              <Feather name="settings" size={20} color={color} />
            ),
          }}
        />
      </Tabs>

      <FloatingDrop />
    </View>
  );
}
