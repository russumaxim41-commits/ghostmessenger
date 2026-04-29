import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  generateKeyPair,
  shortIdFromPublicKey,
  signedFingerprint,
} from "@/lib/crypto";
import { hueFromString, randomName } from "@/lib/ghost";

export type Identity = {
  shortId: string;
  name: string;
  avatarHue: number;
  avatarUri: string | null;
  publicKey: string;
  secretKey: string;
  signature: string;
  createdAt: number;
};

type IdentityState = {
  identity: Identity | null;
  ready: boolean;
  setName: (name: string) => Promise<void>;
  pickAvatar: () => Promise<void>;
  resetAvatar: () => Promise<void>;
  resetIdentity: () => Promise<void>;
};

const STORAGE_KEY = "ghost.identity.v2";
const IdentityCtx = createContext<IdentityState | null>(null);

function freshIdentity(): Identity {
  const kp = generateKeyPair();
  const shortId = shortIdFromPublicKey(kp.publicKey);
  const name = randomName();
  return {
    shortId,
    name,
    avatarHue: hueFromString(shortId),
    avatarUri: null,
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    signature: signedFingerprint(kp.publicKey),
    createdAt: Date.now(),
  };
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setIdentity(JSON.parse(raw));
        } else {
          const fresh = freshIdentity();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
          setIdentity(fresh);
        }
      } catch {
        setIdentity(freshIdentity());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Identity) => {
    setIdentity(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const setName = useCallback(
    async (name: string) => {
      if (!identity) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      await persist({
        ...identity,
        name: trimmed,
        avatarHue: hueFromString(trimmed + identity.shortId),
      });
    },
    [identity, persist],
  );

  const pickAvatar = useCallback(async () => {
    if (!identity) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (res.canceled || !res.assets?.[0]) return;
      await persist({ ...identity, avatarUri: res.assets[0].uri });
    } catch {}
  }, [identity, persist]);

  const resetAvatar = useCallback(async () => {
    if (!identity) return;
    await persist({ ...identity, avatarUri: null });
  }, [identity, persist]);

  const resetIdentity = useCallback(async () => {
    const fresh = freshIdentity();
    await persist(fresh);
    try {
      await AsyncStorage.multiRemove([
        "ghost.chats.v2",
        "ghost.groups.v2",
        "ghost.channels.v2",
      ]);
    } catch {}
  }, [persist]);

  const value = useMemo<IdentityState>(
    () => ({
      identity,
      ready,
      setName,
      pickAvatar,
      resetAvatar,
      resetIdentity,
    }),
    [identity, ready, setName, pickAvatar, resetAvatar, resetIdentity],
  );

  return <IdentityCtx.Provider value={value}>{children}</IdentityCtx.Provider>;
}

export function useIdentity(): IdentityState {
  const ctx = useContext(IdentityCtx);
  if (!ctx) throw new Error("useIdentity must be used inside IdentityProvider");
  return ctx;
}
