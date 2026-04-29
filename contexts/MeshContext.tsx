import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { encryptMessage, type EncryptedPayload } from "@/lib/crypto";
import { hueFromString, randomMessageId } from "@/lib/ghost";
import {
  loadIntegrity,
  runHandshakeCheck,
  type IntegrityState,
} from "@/lib/integrity";
import {
  initRatchet,
  ratchetEncrypt,
  type RatchetState,
} from "@/lib/ratchet";
import {
  bumpEncounter,
  bumpForward,
  loadReputation,
} from "@/lib/reputation";
import {
  makeTransport,
  type DiscoveredPeer,
  type Transport,
} from "@/lib/transport";

import { useIdentity } from "@/contexts/IdentityContext";

export type ConnectionMode = "auto" | "wifi" | "ble";

export type Peer = {
  publicKey: string;
  shortId: string;
  name: string;
  avatarHue: number;
  rssi: number;
  via: "BLE" | "WIFI";
  lastSeen: number;
};

export type Message = {
  id: string;
  fromKey: string;
  text: string;
  ts: number;
  hops: number;
  delivered: boolean;
  encrypted: EncryptedPayload | null;
  /** счётчик ratchet, под которым было отправлено это сообщение */
  ratchetCounter?: number;
};

export type Chat = {
  peerKey: string;
  peerShortId: string;
  peerName: string;
  avatarHue: number;
  lastTs: number;
  unread: number;
  messages: Message[];
};

export type Group = {
  id: string;
  name: string;
  members: { publicKey: string; name: string; avatarHue: number }[];
  messages: Message[];
  createdAt: number;
};

export type ChannelPost = {
  id: string;
  authorKey: string;
  authorName: string;
  authorHue: number;
  text: string;
  ts: number;
  reactions: { fire: number; ghost: number; bolt: number };
};

export type Channel = {
  id: string;
  name: string;
  description: string;
  ownerKey: string;
  posts: ChannelPost[];
  createdAt: number;
};

type State = {
  // Network state
  scanning: boolean;
  bleOn: boolean;
  wifiOn: boolean;
  mode: ConnectionMode;
  transportAvailable: boolean;
  transportReason: string | null;
  peers: Peer[];

  // User data
  chats: Chat[];
  groups: Group[];
  channels: Channel[];

  // Queue (messages waiting for peer to come into range)
  queueLength: number;

  // Mesh integrity (handshake digest)
  integrity: IntegrityState;

  // Setters
  setBleOn: (v: boolean) => void;
  setWifiOn: (v: boolean) => void;
  setMode: (m: ConnectionMode) => void;

  // Actions
  refreshScan: () => void;
  sendMessage: (peerKey: string, text: string) => void;
  sendGroupMessage: (groupId: string, text: string) => void;
  postToChannel: (channelId: string, text: string) => void;
  reactToPost: (
    channelId: string,
    postId: string,
    kind: "fire" | "ghost" | "bolt",
  ) => void;
  markRead: (peerKey: string) => void;
  openChatWith: (peer: Peer) => void;
  reorderChats: (next: Chat[]) => void;

  // Group / channel CRUD
  createGroup: (name: string) => string;
  createChannel: (name: string, description: string) => string;
  renameGroup: (id: string, name: string) => void;
  renameChannel: (id: string, name: string, description?: string) => void;
  joinByLink: (link: string) => Promise<{ ok: boolean; reason?: string }>;
  shareLink: (kind: "group" | "channel", id: string) => string;

  // Ratchet snapshot helpers (для отображения отпечатка)
  getRatchetFingerprint: (peerKey: string) => string | null;
};

const CHATS_KEY = "ghost.chats.v2";
const GROUPS_KEY = "ghost.groups.v2";
const CHANNELS_KEY = "ghost.channels.v2";
const QUEUE_KEY = "ghost.queue.v2";
const NET_KEY = "ghost.net.v2";
const RATCHET_KEY = "ghost.ratchet.v1";
const CHAT_ORDER_KEY = "ghost.chats.order.v1";

const MeshCtx = createContext<State | null>(null);

type QueuedItem = {
  id: string;
  toKey: string;
  ts: number;
  payload: EncryptedPayload;
  ratchetCounter?: number;
};

type RatchetMap = Record<string, RatchetState>;

export function MeshProvider({ children }: { children: React.ReactNode }) {
  const { identity } = useIdentity();
  const transportRef = useRef<Transport | null>(null);

  const [bleOn, setBleOnState] = useState(false);
  const [wifiOn, setWifiOnState] = useState(false);
  const [mode, setModeState] = useState<ConnectionMode>("auto");
  const [scanning, setScanning] = useState(false);
  const [transportAvailable, setTransportAvailable] = useState(false);
  const [transportReason, setTransportReason] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [chatOrder, setChatOrder] = useState<string[]>([]);

  const [integrity, setIntegrity] = useState<IntegrityState>({
    digest: "",
    handshakes: 0,
    lastCheckAt: 0,
    lastResult: "unknown",
  });

  // Ratchet states (key per peer publicKey)
  const ratchetsRef = useRef<RatchetMap>({});

  const persistRatchets = useCallback(() => {
    try {
      AsyncStorage.setItem(
        RATCHET_KEY,
        JSON.stringify(ratchetsRef.current),
      ).catch(() => {});
    } catch {
      /* no-op */
    }
  }, []);

  // Load persisted state
  useEffect(() => {
    if (!identity) return;
    (async () => {
      try {
        const [c, g, ch, q, n, r, ord] = await Promise.all([
          AsyncStorage.getItem(CHATS_KEY),
          AsyncStorage.getItem(GROUPS_KEY),
          AsyncStorage.getItem(CHANNELS_KEY),
          AsyncStorage.getItem(QUEUE_KEY),
          AsyncStorage.getItem(NET_KEY),
          AsyncStorage.getItem(RATCHET_KEY),
          AsyncStorage.getItem(CHAT_ORDER_KEY),
        ]);
        setChats(c ? JSON.parse(c) : []);
        setGroups(g ? JSON.parse(g) : []);
        setChannels(ch ? JSON.parse(ch) : []);
        setQueue(q ? JSON.parse(q) : []);
        if (r) {
          try {
            ratchetsRef.current = JSON.parse(r) as RatchetMap;
          } catch {
            ratchetsRef.current = {};
          }
        }
        if (ord) {
          try {
            const arr = JSON.parse(ord);
            if (Array.isArray(arr)) setChatOrder(arr);
          } catch {}
        }
        if (n) {
          const parsed = JSON.parse(n);
          if (typeof parsed.bleOn === "boolean") setBleOnState(parsed.bleOn);
          if (typeof parsed.wifiOn === "boolean") setWifiOnState(parsed.wifiOn);
          if (
            parsed.mode === "auto" ||
            parsed.mode === "wifi" ||
            parsed.mode === "ble"
          ) {
            setModeState(parsed.mode);
          }
        }
        const integ = await loadIntegrity();
        setIntegrity(integ);
        await loadReputation();
      } catch {}
    })();
  }, [identity]);

  // Persist
  useEffect(() => {
    AsyncStorage.setItem(CHATS_KEY, JSON.stringify(chats)).catch(() => {});
  }, [chats]);
  useEffect(() => {
    AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups)).catch(() => {});
  }, [groups]);
  useEffect(() => {
    AsyncStorage.setItem(CHANNELS_KEY, JSON.stringify(channels)).catch(() => {});
  }, [channels]);
  useEffect(() => {
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
  }, [queue]);
  useEffect(() => {
    AsyncStorage.setItem(
      NET_KEY,
      JSON.stringify({ bleOn, wifiOn, mode }),
    ).catch(() => {});
  }, [bleOn, wifiOn, mode]);
  useEffect(() => {
    AsyncStorage.setItem(CHAT_ORDER_KEY, JSON.stringify(chatOrder)).catch(
      () => {},
    );
  }, [chatOrder]);

  // Initialize transport
  useEffect(() => {
    transportRef.current = makeTransport();
    setTransportAvailable(transportRef.current.available);
    setTransportReason(transportRef.current.reason);
    return () => {
      transportRef.current?.stop().catch(() => {});
    };
  }, []);

  // Wire transport to scanning toggles
  useEffect(() => {
    if (!identity || !transportRef.current) return;
    const shouldScan = bleOn || wifiOn;
    if (!shouldScan) {
      transportRef.current.stop().catch(() => {});
      setScanning(false);
      setPeers([]);
      return;
    }
    setScanning(true);
    transportRef.current
      .start(identity.publicKey, (ev) => {
        if (ev.type === "state") {
          setTransportAvailable(ev.available);
          setTransportReason(ev.reason ?? null);
          if (!ev.available) setScanning(false);
        } else if (ev.type === "peer") {
          handleDiscoveredPeer(ev.peer);
        } else if (ev.type === "lost") {
          setPeers((prev) => prev.filter((p) => p.publicKey !== ev.deviceId));
        }
      })
      .catch(() => setScanning(false));
    return () => {
      transportRef.current?.stop().catch(() => {});
    };
  }, [identity, bleOn, wifiOn]);

  // Drop stale peers (> 30s no signal)
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setPeers((prev) => prev.filter((p) => now - p.lastSeen < 30_000));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleDiscoveredPeer = useCallback(
    (dp: DiscoveredPeer) => {
      setPeers((prev) => {
        const idx = prev.findIndex((p) => p.publicKey === dp.publicKey);
        const peer: Peer = {
          publicKey: dp.publicKey,
          shortId: dp.publicKey.slice(0, 6).toLowerCase(),
          name: dp.name,
          avatarHue: hueFromString(dp.publicKey),
          rssi: dp.rssi,
          via: dp.via,
          lastSeen: dp.lastSeen,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = peer;
          return next;
        }
        return [...prev, peer];
      });
      // Каждое обнаружение узла — это «встреча». Поднимаем reputation.
      bumpEncounter(dp.publicKey).catch(() => {});

      // Если в очереди есть пакеты для этого узла — считаем, что они
      // были «доставлены» (mesh-симуляция). Узел получает forward-бонус.
      setQueue((prev) => {
        const remaining: QueuedItem[] = [];
        let anyForwarded = false;
        for (const q of prev) {
          if (q.toKey === dp.publicKey) {
            anyForwarded = true;
            // помечаем чат как доставленный
            setChats((prevChats) =>
              prevChats.map((c) =>
                c.peerKey === q.toKey
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === q.id ? { ...m, delivered: true } : m,
                      ),
                    }
                  : c,
              ),
            );
          } else {
            remaining.push(q);
          }
        }
        if (anyForwarded) {
          bumpForward(dp.publicKey).catch(() => {});
          // запускаем integrity handshake асинхронно
          runHandshakeCheck({
            chats,
            groups,
            channels,
            queueLength: remaining.length,
          })
            .then(({ state }) => setIntegrity(state))
            .catch(() => {});
        }
        return remaining;
      });
    },
    [chats, groups, channels],
  );

  const setBleOn = useCallback((v: boolean) => setBleOnState(v), []);
  const setWifiOn = useCallback((v: boolean) => setWifiOnState(v), []);
  const setMode = useCallback((m: ConnectionMode) => {
    setModeState(m);
    if (m === "auto") {
      setBleOnState(true);
      setWifiOnState(true);
    } else if (m === "wifi") {
      setBleOnState(false);
      setWifiOnState(true);
    } else if (m === "ble") {
      setWifiOnState(false);
      setBleOnState(true);
    }
  }, []);

  const refreshScan = useCallback(() => {
    if (!identity || !transportRef.current) return;
    transportRef.current.stop().catch(() => {});
    setPeers([]);
    if (bleOn || wifiOn) {
      transportRef.current
        .start(identity.publicKey, (ev) => {
          if (ev.type === "state") {
            setTransportAvailable(ev.available);
            setTransportReason(ev.reason ?? null);
          } else if (ev.type === "peer") {
            handleDiscoveredPeer(ev.peer);
          }
        })
        .catch(() => {});
    }
  }, [identity, bleOn, wifiOn, handleDiscoveredPeer]);

  const openChatWith = useCallback((peer: Peer) => {
    setChats((prev) => {
      if (prev.some((c) => c.peerKey === peer.publicKey)) return prev;
      return [
        {
          peerKey: peer.publicKey,
          peerShortId: peer.shortId,
          peerName: peer.name,
          avatarHue: peer.avatarHue,
          lastTs: Date.now(),
          unread: 0,
          messages: [],
        },
        ...prev,
      ];
    });
  }, []);

  const sendMessage = useCallback(
    (peerKey: string, text: string) => {
      if (!identity || !text.trim()) return;
      // Ленивая инициализация ratchet для пары
      let r = ratchetsRef.current[peerKey];
      if (!r) {
        r = initRatchet(identity.publicKey, peerKey);
        ratchetsRef.current[peerKey] = r;
      }
      let payload: EncryptedPayload | null = null;
      let counter: number | undefined;
      try {
        const out = ratchetEncrypt(
          r,
          text.trim(),
          peerKey,
          identity.secretKey,
          identity.publicKey,
        );
        payload = out.envelope.payload;
        counter = out.envelope.counter;
        ratchetsRef.current[peerKey] = out.state;
        persistRatchets();
      } catch {
        try {
          payload = encryptMessage(
            text.trim(),
            peerKey,
            identity.secretKey,
            identity.publicKey,
          );
        } catch {
          payload = null;
        }
      }
      const msg: Message = {
        id: randomMessageId(),
        fromKey: identity.publicKey,
        text: text.trim(),
        ts: Date.now(),
        hops: 0,
        delivered: false,
        encrypted: payload,
        ratchetCounter: counter,
      };
      setChats((prev) => {
        const existing = prev.find((c) => c.peerKey === peerKey);
        if (existing) {
          return prev
            .map((c) =>
              c.peerKey === peerKey
                ? {
                    ...c,
                    messages: [...c.messages, msg],
                    lastTs: msg.ts,
                  }
                : c,
            )
            .sort((a, b) => b.lastTs - a.lastTs);
        }
        return [
          {
            peerKey,
            peerShortId: peerKey.slice(0, 6).toLowerCase(),
            peerName: peerKey.slice(0, 6).toLowerCase(),
            avatarHue: hueFromString(peerKey),
            lastTs: msg.ts,
            unread: 0,
            messages: [msg],
          },
          ...prev,
        ];
      });
      // Queue for delivery when peer is in range
      if (payload) {
        setQueue((prev) => [
          ...prev,
          {
            id: msg.id,
            toKey: peerKey,
            ts: msg.ts,
            payload,
            ratchetCounter: counter,
          },
        ]);
      }
    },
    [identity, persistRatchets],
  );

  const sendGroupMessage = useCallback(
    (groupId: string, text: string) => {
      if (!identity || !text.trim()) return;
      const msg: Message = {
        id: randomMessageId(),
        fromKey: identity.publicKey,
        text: text.trim(),
        ts: Date.now(),
        hops: 0,
        delivered: true,
        encrypted: null,
      };
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, messages: [...g.messages, msg] } : g,
        ),
      );
    },
    [identity],
  );

  const postToChannel = useCallback(
    (channelId: string, text: string) => {
      if (!identity || !text.trim()) return;
      const post: ChannelPost = {
        id: randomMessageId(),
        authorKey: identity.publicKey,
        authorName: identity.name,
        authorHue: identity.avatarHue,
        text: text.trim(),
        ts: Date.now(),
        reactions: { fire: 0, ghost: 0, bolt: 0 },
      };
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId ? { ...c, posts: [post, ...c.posts] } : c,
        ),
      );
    },
    [identity],
  );

  const reactToPost = useCallback(
    (
      channelId: string,
      postId: string,
      kind: "fire" | "ghost" | "bolt",
    ) => {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId
            ? {
                ...c,
                posts: c.posts.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        reactions: {
                          ...p.reactions,
                          [kind]: p.reactions[kind] + 1,
                        },
                      }
                    : p,
                ),
              }
            : c,
        ),
      );
    },
    [],
  );

  const markRead = useCallback((peerKey: string) => {
    setChats((prev) =>
      prev.map((c) => (c.peerKey === peerKey ? { ...c, unread: 0 } : c)),
    );
  }, []);

  const reorderChats = useCallback((next: Chat[]) => {
    setChatOrder(next.map((c) => c.peerKey));
  }, []);

  const createGroup = useCallback(
    (name: string): string => {
      const id = "grp_" + randomMessageId();
      const g: Group = {
        id,
        name: name.trim() || "Группа",
        members: identity
          ? [
              {
                publicKey: identity.publicKey,
                name: identity.name,
                avatarHue: identity.avatarHue,
              },
            ]
          : [],
        messages: [],
        createdAt: Date.now(),
      };
      setGroups((prev) => [g, ...prev]);
      return id;
    },
    [identity],
  );

  const createChannel = useCallback(
    (name: string, description: string): string => {
      const id = "ch_" + randomMessageId();
      const c: Channel = {
        id,
        name: name.trim() || "Канал",
        description: description.trim(),
        ownerKey: identity?.publicKey ?? "",
        posts: [],
        createdAt: Date.now(),
      };
      setChannels((prev) => [c, ...prev]);
      return id;
    },
    [identity],
  );

  const renameGroup = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name: trimmed } : g)),
    );
  }, []);

  const renameChannel = useCallback(
    (id: string, name: string, description?: string) => {
      const trimmed = name.trim();
      if (!trimmed && description === undefined) return;
      setChannels((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                name: trimmed || c.name,
                description:
                  description !== undefined ? description.trim() : c.description,
              }
            : c,
        ),
      );
    },
    [],
  );

  const shareLink = useCallback(
    (kind: "group" | "channel", id: string): string => {
      return `ghost://${kind}/${id}`;
    },
    [],
  );

  const joinByLink = useCallback(
    async (link: string): Promise<{ ok: boolean; reason?: string }> => {
      const m = link.match(/^ghost:\/\/(group|channel)\/(.+)$/);
      if (!m) return { ok: false, reason: "Неверная ссылка" };
      const [, kind, id] = m;
      if (kind === "group") {
        if (groups.some((g) => g.id === id)) {
          return { ok: false, reason: "Вы уже в этой группе" };
        }
        const g: Group = {
          id: id ?? "",
          name: "Группа по ссылке",
          members: identity
            ? [
                {
                  publicKey: identity.publicKey,
                  name: identity.name,
                  avatarHue: identity.avatarHue,
                },
              ]
            : [],
          messages: [],
          createdAt: Date.now(),
        };
        setGroups((prev) => [g, ...prev]);
        return { ok: true };
      }
      if (kind === "channel") {
        if (channels.some((c) => c.id === id)) {
          return { ok: false, reason: "Вы уже подписаны" };
        }
        const c: Channel = {
          id: id ?? "",
          name: "Канал по ссылке",
          description: "",
          ownerKey: "",
          posts: [],
          createdAt: Date.now(),
        };
        setChannels((prev) => [c, ...prev]);
        return { ok: true };
      }
      return { ok: false };
    },
    [groups, channels, identity],
  );

  const getRatchetFingerprint = useCallback((peerKey: string) => {
    const r = ratchetsRef.current[peerKey];
    if (!r) return null;
    // ленивый импорт чтоб не таскать tweetnacl на каждый рендер
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { stateFingerprint } = require("@/lib/ratchet");
      return stateFingerprint(r) as string;
    } catch {
      return null;
    }
  }, []);

  // Применяем сохранённый порядок чатов (из edit mode) поверх естественного
  const orderedChats = useMemo<Chat[]>(() => {
    if (!chatOrder.length) return chats;
    const map = new Map(chats.map((c) => [c.peerKey, c]));
    const used = new Set<string>();
    const out: Chat[] = [];
    for (const k of chatOrder) {
      const c = map.get(k);
      if (c) {
        out.push(c);
        used.add(k);
      }
    }
    for (const c of chats) {
      if (!used.has(c.peerKey)) out.push(c);
    }
    return out;
  }, [chats, chatOrder]);

  const value = useMemo<State>(
    () => ({
      scanning,
      bleOn,
      wifiOn,
      mode,
      transportAvailable,
      transportReason,
      peers,
      chats: orderedChats,
      groups,
      channels,
      queueLength: queue.length,
      integrity,
      setBleOn,
      setWifiOn,
      setMode,
      refreshScan,
      sendMessage,
      sendGroupMessage,
      postToChannel,
      reactToPost,
      markRead,
      openChatWith,
      reorderChats,
      createGroup,
      createChannel,
      renameGroup,
      renameChannel,
      joinByLink,
      shareLink,
      getRatchetFingerprint,
    }),
    [
      scanning,
      bleOn,
      wifiOn,
      mode,
      transportAvailable,
      transportReason,
      peers,
      orderedChats,
      groups,
      channels,
      queue.length,
      integrity,
      setBleOn,
      setWifiOn,
      setMode,
      refreshScan,
      sendMessage,
      sendGroupMessage,
      postToChannel,
      reactToPost,
      markRead,
      openChatWith,
      reorderChats,
      createGroup,
      createChannel,
      renameGroup,
      renameChannel,
      joinByLink,
      shareLink,
      getRatchetFingerprint,
    ],
  );

  return <MeshCtx.Provider value={value}>{children}</MeshCtx.Provider>;
}

export function useMesh(): State {
  const ctx = useContext(MeshCtx);
  if (!ctx) throw new Error("useMesh must be used inside MeshProvider");
  return ctx;
}
