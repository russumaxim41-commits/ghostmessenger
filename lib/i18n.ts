export type Locale = "ru" | "en" | "zh";

export const SUPPORTED_LOCALES: { code: Locale; native: string; tag: string }[] = [
  { code: "ru", native: "Русский", tag: "RU" },
  { code: "en", native: "English", tag: "EN" },
  { code: "zh", native: "中文", tag: "ZH" },
];

type Dict = Record<string, string>;

const RU: Dict = {
  // tabs
  "tabs.chats": "Чаты",
  "tabs.nearby": "Рядом",
  "tabs.groups": "Группы",
  "tabs.settings": "Настройки",

  // common
  "common.cancel": "Отмена",
  "common.create": "Создать",
  "common.save": "Сохранить",
  "common.rename": "Переименовать",
  "common.close": "Закрыть",
  "common.choose": "Выбрать",
  "common.reset": "Сброс",
  "common.copy": "Копировать",
  "common.on": "вкл",
  "common.off": "выкл",
  "common.error": "Ошибка",

  // chats list
  "chats.subtitle": "автономный режим  ·  в очереди {n}",
  "chats.lastEmpty": "Зашифрованный канал · ожидает связи",
  "chats.reorder": "Изменить порядок",
  "chats.empty.title": "Пока тихо",
  "chats.empty.hint": "Перейдите на экран «Рядом», чтобы найти призраков поблизости и начать первый зашифрованный диалог",
  "chats.empty.cta": "Открыть «Рядом»",

  // nearby
  "nearby.title": "Рядом",
  "nearby.head.searching": "Поиск активен",
  "nearby.head.unavailable": "Эфир недоступен",
  "nearby.head.off": "Поиск выключен",
  "nearby.subline": "Wi-Fi: {wifi}  ·  Bluetooth: {ble}",
  "nearby.empty.title": "Никого рядом",
  "nearby.empty.hint": "Включите Bluetooth и Wi-Fi на устройстве. Когда другой телефон с Ghost окажется рядом — он появится здесь автоматически.",
  "nearby.empty.cta": "Включить поиск",

  // groups list
  "groups.title": "Группы",
  "groups.subtitle": "приватные узлы и публичные каналы",
  "groups.btn.group": "Группа",
  "groups.btn.channel": "Канал",
  "groups.btn.link": "По ссылке",
  "groups.row.members": "{n} участников",
  "groups.row.channel": "канал · {n} публикаций",
  "groups.empty.title": "Нет групп и каналов",
  "groups.empty.hint": "Создайте новую группу или канал, либо вставьте ссылку, чтобы присоединиться к существующему",
  "groups.modal.newGroup": "Новая группа",
  "groups.modal.newChannel": "Новый канал",
  "groups.modal.joinLink": "Перейти по ссылке",
  "groups.modal.namePlaceholder": "Название",
  "groups.modal.descPlaceholder": "Описание",
  "groups.modal.join": "Перейти",
  "groups.modal.failTitle": "Не удалось перейти",
  "groups.modal.failBody": "Проверьте ссылку",

  // chat detail
  "chat.unknown": "Призрак",
  "chat.encrypt": "шифрование",
  "chat.empty.title": "Канал зашифрован",
  "chat.empty.hint": "Сообщения шифруются вашим ключом и хранятся только на телефонах. Если узел вне радиуса — сообщение ждёт встречи в очереди.",
  "chat.composer": "Зашифровать и отправить…",

  // group detail
  "group.subtitle": "{n} участников · группа",
  "group.subtitle.live": "{n} участников · группа · {live} в эфире",
  "group.inAir": "{n} в эфире",
  "group.rename": "Имя группы",
  "group.composer": "Сообщение группе…",

  // channel detail extras
  "channel.rename": "Имя канала",

  // rename modal
  "rename.placeholder": "Новое имя",

  // channel detail
  "channel.subtitle": "канал · {n} публикаций",
  "channel.empty.title": "Пока пусто",
  "channel.empty.hintOwner": "Опубликуйте первую запись — она разойдётся между подписчиками при встрече",
  "channel.empty.hintMember": "Здесь появятся публикации автора канала",
  "channel.composer": "Опубликовать…",
  "channel.time.now": "только что",
  "channel.time.min": "{n} мин назад",
  "channel.time.hour": "{n} ч назад",
  "channel.time.day": "{n} д назад",

  // header customize
  "scope.wallpaper": "Фон",
  "scope.rename": "Имя",
  "scope.renameTitle": "Переименовать",

  // settings
  "settings.title": "Настройки",
  "settings.id.changeAvatar": "Сменить аватар",
  "settings.id.nameLabel": "ИМЯ",
  "settings.id.namePlaceholder": "Имя в эфире",
  "settings.id.help": "Имя видно собеседникам рядом. ID — короткий отпечаток вашего ключа, по нему вас можно найти точно.",

  "settings.lang.title": "Язык интерфейса",
  "settings.lang.desc": "Меняет язык всех экранов приложения. Сообщения и имена собеседников остаются как есть.",

  "settings.theme.title": "Оформление",
  "settings.theme.desc": "Светлая или тёмная схема. «Авто» подстраивается под систему.",
  "settings.theme.light": "Светлая",
  "settings.theme.dark": "Тёмная",
  "settings.theme.auto": "Авто",

  "settings.glass.title": "Прозрачность стекла",
  "settings.glass.desc": "Регулирует плотность всех «стеклянных» поверхностей: карточек, плашек и панели ввода. Уменьшайте — фон проступает сильнее.",
  "settings.glass.left": "прозрачно",
  "settings.glass.right": "плотно",

  "settings.bg.title": "Фон приложения",
  "settings.bg.desc": "Своё изображение становится общим фоном для всех экранов. Файл хранится только на устройстве и никуда не уходит.",
  "settings.bg.row": "Фоновое изображение",
  "settings.bg.set": "Установлено · общее",
  "settings.bg.default": "По умолчанию · градиент",

  "settings.conn.title": "Способ связи",
  "settings.conn.desc": "«Авто» сам выбирает между Wi-Fi и Bluetooth. Bluetooth работает дальше и без сетей, Wi-Fi — быстрее, когда устройства в одной локалке.",
  "settings.conn.auto": "Авто",
  "settings.conn.wifi": "Wi-Fi",
  "settings.conn.ble": "Bluetooth",

  "settings.relay.title": "Призрачный узел",
  "settings.relay.desc": "Фоновый ретранслятор: ваш телефон помогает доносить чужие зашифрованные пакеты, не зная их содержимого. Расход батареи минимальный, окно сна выбирает система.",
  "settings.relay.row": "Работать в фоне",
  "settings.relay.unavailable": "Доступно только в собранном приложении",
  "settings.relay.active": "Активен · встреч: {n}",
  "settings.relay.off": "Выключено",
  "settings.relay.on": "Вкл",
  "settings.relay.toggleOff": "Выкл",
  "settings.relay.failTitle": "Узел недоступен",

  "settings.about.title": "О приложении",
  "settings.about.body": "Ghost — локальный мессенджер. Работает по Bluetooth и локальной сети без серверов и интернета. Все ключи и переписка хранятся только на вашем устройстве.",
  "settings.about.meta": "версия 1.0.0  ·  без серверов",

  "settings.reset.title": "Сбросить личность",
  "settings.reset.hint": "Создаст новый ключ и сотрёт всю локальную историю. Действие нельзя отменить.",
  "settings.reset.button": "Сбросить личность и все данные",
  "settings.reset.confirmTitle": "Сбросить личность?",
  "settings.reset.confirmBody": "Будут уничтожены ключи шифрования, история переписки, группы и каналы. Это действие необратимо.",
  "settings.reset.confirmCta": "Сбросить",

  "settings.panic.title": "Аварийное стирание",
  "settings.panic.hint": "Полностью уничтожает локальную базу за один тап. На случай досмотра.",
  "settings.panic.button": "Стереть всё немедленно",
  "settings.panic.confirmTitle": "Аварийное стирание?",
  "settings.panic.confirmBody": "Полностью уничтожить локальную базу: ключи, переписку, очередь, кэш репутации и интегрити-цепочку. Восстановить будет нечего.",
  "settings.panic.confirmCta": "Стереть всё",

  // quick glass sheet
  "quick.title": "Прозрачность стекла",

  // onboarding
  "onb.title": "Ghost",
  "onb.subtitle": "локальный мессенджер без серверов",
  "onb.welcome": "Добро пожаловать в Ghost",
  "onb.intro": "Локальный мессенджер без серверов. Ваши сообщения шифруются ключом, который никогда не покидает телефон, и передаются прямо между устройствами рядом.",
  "onb.fineprint": "Без аккаунтов, без облака, без журналов. Сбросить личность можно в настройках в любой момент.",
  "onb.perm.ble.title": "Bluetooth",
  "onb.perm.ble.body": "чтобы находить призраков рядом и обмениваться зашифрованными сообщениями без интернета",
  "onb.perm.wifi.title": "Локальная сеть",
  "onb.perm.wifi.body": "ускоряет передачу при наличии Wi-Fi-окружения, при этом данные никуда не уходят с устройства",
  "onb.perm.media.title": "Фото",
  "onb.perm.media.body": "только для аватара и собственного фона приложения. Доступ читается, ничего не загружается",
  "onb.allow": "Разрешить",
  "onb.granted": "Готово",
  "onb.enter": "Войти в эфир",
};

const EN: Dict = {
  "tabs.chats": "Chats",
  "tabs.nearby": "Nearby",
  "tabs.groups": "Groups",
  "tabs.settings": "Settings",

  "common.cancel": "Cancel",
  "common.create": "Create",
  "common.save": "Save",
  "common.rename": "Rename",
  "common.close": "Close",
  "common.choose": "Choose",
  "common.reset": "Reset",
  "common.copy": "Copy",
  "common.on": "on",
  "common.off": "off",
  "common.error": "Error",

  "chats.subtitle": "offline mode  ·  queued {n}",
  "chats.lastEmpty": "Encrypted channel · waiting for link",
  "chats.reorder": "Reorder",
  "chats.empty.title": "Quiet for now",
  "chats.empty.hint": "Open the «Nearby» screen to find ghosts around you and start your first encrypted chat",
  "chats.empty.cta": "Open «Nearby»",

  "nearby.title": "Nearby",
  "nearby.head.searching": "Scanning",
  "nearby.head.unavailable": "Air unavailable",
  "nearby.head.off": "Scanning is off",
  "nearby.subline": "Wi-Fi: {wifi}  ·  Bluetooth: {ble}",
  "nearby.empty.title": "Nobody around",
  "nearby.empty.hint": "Turn on Bluetooth and Wi-Fi on your device. As soon as another Ghost phone is close enough — it will show up here automatically.",
  "nearby.empty.cta": "Start scanning",

  "groups.title": "Groups",
  "groups.subtitle": "private nodes and public channels",
  "groups.btn.group": "Group",
  "groups.btn.channel": "Channel",
  "groups.btn.link": "By link",
  "groups.row.members": "{n} members",
  "groups.row.channel": "channel · {n} posts",
  "groups.empty.title": "No groups or channels",
  "groups.empty.hint": "Create a new group or channel, or paste a link to join an existing one",
  "groups.modal.newGroup": "New group",
  "groups.modal.newChannel": "New channel",
  "groups.modal.joinLink": "Open link",
  "groups.modal.namePlaceholder": "Name",
  "groups.modal.descPlaceholder": "Description",
  "groups.modal.join": "Open",
  "groups.modal.failTitle": "Could not open",
  "groups.modal.failBody": "Check the link",

  "chat.unknown": "Ghost",
  "chat.encrypt": "encryption",
  "chat.empty.title": "Channel is encrypted",
  "chat.empty.hint": "Messages are encrypted with your key and stored only on the phones. If the peer is out of range — the message waits in queue.",
  "chat.composer": "Encrypt and send…",

  "group.subtitle": "{n} members · group",
  "group.subtitle.live": "{n} members · group · {live} live",
  "group.inAir": "{n} live",
  "group.rename": "Group name",
  "group.composer": "Message the group…",

  "channel.rename": "Channel name",

  "rename.placeholder": "New name",

  "channel.subtitle": "channel · {n} posts",
  "channel.empty.title": "Empty for now",
  "channel.empty.hintOwner": "Publish the first post — it will spread to subscribers when you meet",
  "channel.empty.hintMember": "Posts from the channel author will appear here",
  "channel.composer": "Publish…",
  "channel.time.now": "just now",
  "channel.time.min": "{n} min ago",
  "channel.time.hour": "{n} h ago",
  "channel.time.day": "{n} d ago",

  "scope.wallpaper": "Wallpaper",
  "scope.rename": "Name",
  "scope.renameTitle": "Rename",

  "settings.title": "Settings",
  "settings.id.changeAvatar": "Change avatar",
  "settings.id.nameLabel": "NAME",
  "settings.id.namePlaceholder": "On-air name",
  "settings.id.help": "Your name is visible to peers nearby. ID is a short fingerprint of your key — others can find you exactly by it.",

  "settings.lang.title": "Interface language",
  "settings.lang.desc": "Switches the language of every screen. Messages and peer names stay as they are.",

  "settings.theme.title": "Appearance",
  "settings.theme.desc": "Light or dark scheme. «Auto» follows the system.",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.auto": "Auto",

  "settings.glass.title": "Glass opacity",
  "settings.glass.desc": "Controls how dense the «glass» surfaces are: cards, sheets and the input bar. Lower values let the wallpaper show through.",
  "settings.glass.left": "clear",
  "settings.glass.right": "solid",

  "settings.bg.title": "App wallpaper",
  "settings.bg.desc": "Your image becomes the global background for every screen. The file stays on this device and never leaves.",
  "settings.bg.row": "Wallpaper image",
  "settings.bg.set": "Set · global",
  "settings.bg.default": "Default · gradient",

  "settings.conn.title": "Connection",
  "settings.conn.desc": "«Auto» picks between Wi-Fi and Bluetooth. Bluetooth reaches further and works without networks, Wi-Fi is faster when devices share a LAN.",
  "settings.conn.auto": "Auto",
  "settings.conn.wifi": "Wi-Fi",
  "settings.conn.ble": "Bluetooth",

  "settings.relay.title": "Ghost node",
  "settings.relay.desc": "Background relay: your phone helps carry other people's encrypted packets without knowing their content. Battery cost is minimal, the OS schedules the wake windows.",
  "settings.relay.row": "Work in background",
  "settings.relay.unavailable": "Available only in the compiled app",
  "settings.relay.active": "Active · meets: {n}",
  "settings.relay.off": "Off",
  "settings.relay.on": "On",
  "settings.relay.toggleOff": "Off",
  "settings.relay.failTitle": "Relay unavailable",

  "settings.about.title": "About",
  "settings.about.body": "Ghost is a local-only messenger. It runs over Bluetooth and the local network without servers or the internet. All keys and chats stay only on your device.",
  "settings.about.meta": "version 1.0.0  ·  no servers",

  "settings.reset.title": "Reset identity",
  "settings.reset.hint": "Generates a new key and wipes all local history. The action cannot be undone.",
  "settings.reset.button": "Reset identity and all data",
  "settings.reset.confirmTitle": "Reset identity?",
  "settings.reset.confirmBody": "Encryption keys, chat history, groups and channels will be destroyed. This cannot be undone.",
  "settings.reset.confirmCta": "Reset",

  "settings.panic.title": "Panic wipe",
  "settings.panic.hint": "Destroys the entire local database in one tap. For inspection scenarios.",
  "settings.panic.button": "Wipe everything now",
  "settings.panic.confirmTitle": "Panic wipe?",
  "settings.panic.confirmBody": "Destroy the entire local database: keys, chats, queue, reputation cache and integrity chain. Nothing can be recovered.",
  "settings.panic.confirmCta": "Wipe everything",

  "quick.title": "Glass opacity",

  "onb.title": "Ghost",
  "onb.subtitle": "local messenger, no servers",
  "onb.welcome": "Welcome to Ghost",
  "onb.intro": "A local-only messenger with no servers. Your messages are encrypted with a key that never leaves the phone and travel directly between devices nearby.",
  "onb.fineprint": "No accounts, no cloud, no logs. You can reset your identity in Settings at any time.",
  "onb.perm.ble.title": "Bluetooth",
  "onb.perm.ble.body": "to find ghosts nearby and exchange encrypted messages without the internet",
  "onb.perm.wifi.title": "Local network",
  "onb.perm.wifi.body": "speeds up delivery when a Wi-Fi environment is around; data still never leaves your device",
  "onb.perm.media.title": "Photos",
  "onb.perm.media.body": "only for the avatar and your own app wallpaper. Access is read-only, nothing is uploaded",
  "onb.allow": "Allow",
  "onb.granted": "Done",
  "onb.enter": "Enter the air",
};

const ZH: Dict = {
  "tabs.chats": "聊天",
  "tabs.nearby": "附近",
  "tabs.groups": "群组",
  "tabs.settings": "设置",

  "common.cancel": "取消",
  "common.create": "创建",
  "common.save": "保存",
  "common.rename": "重命名",
  "common.close": "关闭",
  "common.choose": "选择",
  "common.reset": "重置",
  "common.copy": "复制",
  "common.on": "开",
  "common.off": "关",
  "common.error": "错误",

  "chats.subtitle": "离线模式  ·  待发送 {n}",
  "chats.lastEmpty": "加密通道 · 等待连接",
  "chats.reorder": "调整顺序",
  "chats.empty.title": "暂时安静",
  "chats.empty.hint": "打开「附近」页面，发现身边的幽灵并开始第一段加密对话",
  "chats.empty.cta": "打开「附近」",

  "nearby.title": "附近",
  "nearby.head.searching": "正在扫描",
  "nearby.head.unavailable": "信号不可用",
  "nearby.head.off": "扫描已关闭",
  "nearby.subline": "Wi-Fi: {wifi}  ·  蓝牙: {ble}",
  "nearby.empty.title": "附近无人",
  "nearby.empty.hint": "请在设备上打开蓝牙和 Wi-Fi。当另一台运行 Ghost 的手机靠近时，会自动显示在这里。",
  "nearby.empty.cta": "开始扫描",

  "groups.title": "群组",
  "groups.subtitle": "私密节点与公开频道",
  "groups.btn.group": "群组",
  "groups.btn.channel": "频道",
  "groups.btn.link": "通过链接",
  "groups.row.members": "{n} 位成员",
  "groups.row.channel": "频道 · {n} 条发布",
  "groups.empty.title": "暂无群组或频道",
  "groups.empty.hint": "创建新的群组或频道，或粘贴链接加入已有的",
  "groups.modal.newGroup": "新建群组",
  "groups.modal.newChannel": "新建频道",
  "groups.modal.joinLink": "打开链接",
  "groups.modal.namePlaceholder": "名称",
  "groups.modal.descPlaceholder": "描述",
  "groups.modal.join": "打开",
  "groups.modal.failTitle": "无法打开",
  "groups.modal.failBody": "请检查链接",

  "chat.unknown": "幽灵",
  "chat.encrypt": "加密",
  "chat.empty.title": "通道已加密",
  "chat.empty.hint": "消息使用您的密钥加密，仅保存在手机本地。当对方不在范围内时，消息会在队列中等待相遇。",
  "chat.composer": "加密并发送…",

  "group.subtitle": "{n} 位成员 · 群组",
  "group.subtitle.live": "{n} 位成员 · 群组 · {live} 在线",
  "group.inAir": "{n} 在线",
  "group.rename": "群组名称",
  "group.composer": "在群组中发言…",

  "channel.rename": "频道名称",

  "rename.placeholder": "新名称",

  "channel.subtitle": "频道 · {n} 条发布",
  "channel.empty.title": "暂无内容",
  "channel.empty.hintOwner": "发布第一条内容 — 在与订阅者相遇时会自动同步",
  "channel.empty.hintMember": "频道作者的发布将在此显示",
  "channel.composer": "发布…",
  "channel.time.now": "刚刚",
  "channel.time.min": "{n} 分钟前",
  "channel.time.hour": "{n} 小时前",
  "channel.time.day": "{n} 天前",

  "scope.wallpaper": "壁纸",
  "scope.rename": "名称",
  "scope.renameTitle": "重命名",

  "settings.title": "设置",
  "settings.id.changeAvatar": "更换头像",
  "settings.id.nameLabel": "名称",
  "settings.id.namePlaceholder": "对外名称",
  "settings.id.help": "名称对附近的对方可见。ID 是您密钥的短指纹，可用于精确查找。",

  "settings.lang.title": "界面语言",
  "settings.lang.desc": "切换所有界面的语言。消息内容和对方名称保持不变。",

  "settings.theme.title": "外观",
  "settings.theme.desc": "浅色或深色主题。「自动」跟随系统设置。",
  "settings.theme.light": "浅色",
  "settings.theme.dark": "深色",
  "settings.theme.auto": "自动",

  "settings.glass.title": "玻璃透明度",
  "settings.glass.desc": "控制所有「玻璃」面板（卡片、弹层和输入栏）的不透明度。值越低，壁纸越明显。",
  "settings.glass.left": "透明",
  "settings.glass.right": "实心",

  "settings.bg.title": "应用壁纸",
  "settings.bg.desc": "您的图片将作为所有界面的全局背景。文件仅保存在本机，不会上传。",
  "settings.bg.row": "壁纸图片",
  "settings.bg.set": "已设置 · 全局",
  "settings.bg.default": "默认 · 渐变",

  "settings.conn.title": "连接方式",
  "settings.conn.desc": "「自动」会在 Wi-Fi 和蓝牙间智能切换。蓝牙覆盖更远且无需网络，Wi-Fi 在同一局域网时更快。",
  "settings.conn.auto": "自动",
  "settings.conn.wifi": "Wi-Fi",
  "settings.conn.ble": "蓝牙",

  "settings.relay.title": "幽灵节点",
  "settings.relay.desc": "后台中继：您的手机帮助传递他人的加密数据包，但完全不知道其中的内容。功耗很低，唤醒时机由系统调度。",
  "settings.relay.row": "在后台运行",
  "settings.relay.unavailable": "仅在已编译的应用中可用",
  "settings.relay.active": "已启用 · 相遇 {n} 次",
  "settings.relay.off": "已关闭",
  "settings.relay.on": "开",
  "settings.relay.toggleOff": "关",
  "settings.relay.failTitle": "节点不可用",

  "settings.about.title": "关于",
  "settings.about.body": "Ghost 是一款本地通讯工具。通过蓝牙和本地网络运行，无服务器、无互联网。所有密钥和聊天仅保存在您的设备上。",
  "settings.about.meta": "版本 1.0.0  ·  无服务器",

  "settings.reset.title": "重置身份",
  "settings.reset.hint": "生成新密钥并清除所有本地历史。此操作无法撤销。",
  "settings.reset.button": "重置身份与所有数据",
  "settings.reset.confirmTitle": "重置身份？",
  "settings.reset.confirmBody": "将销毁加密密钥、聊天历史、群组和频道。此操作无法撤销。",
  "settings.reset.confirmCta": "重置",

  "settings.panic.title": "紧急销毁",
  "settings.panic.hint": "一键销毁整个本地数据库。用于被检查的场景。",
  "settings.panic.button": "立即销毁全部",
  "settings.panic.confirmTitle": "紧急销毁？",
  "settings.panic.confirmBody": "将完全销毁本地数据库：密钥、聊天、队列、声誉缓存与完整性链。无法恢复。",
  "settings.panic.confirmCta": "销毁全部",

  "quick.title": "玻璃透明度",

  "onb.title": "Ghost",
  "onb.subtitle": "无服务器的本地通讯",
  "onb.welcome": "欢迎来到 Ghost",
  "onb.intro": "无服务器的本地通讯工具。消息使用永不离开手机的密钥加密，直接在附近的设备之间传输。",
  "onb.fineprint": "无账户、无云端、无日志。可在设置中随时重置身份。",
  "onb.perm.ble.title": "蓝牙",
  "onb.perm.ble.body": "用于发现附近的幽灵并在无网络下交换加密消息",
  "onb.perm.wifi.title": "本地网络",
  "onb.perm.wifi.body": "在 Wi-Fi 环境下加快传输，数据仍不离开您的设备",
  "onb.perm.media.title": "照片",
  "onb.perm.media.body": "仅用于头像和应用壁纸。只读访问，不会上传任何内容",
  "onb.allow": "允许",
  "onb.granted": "已完成",
  "onb.enter": "进入信号",
};

const DICTS: Record<Locale, Dict> = { ru: RU, en: EN, zh: ZH };

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[locale] ?? RU;
  let s = dict[key] ?? RU[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
    }
  }
  return s;
}
