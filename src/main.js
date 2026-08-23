import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

// ----------------------------------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------------------------------
const DEV = {
  printInitialStats: false,
  printRendererStats: false,
  printAllSectionStatsOnce: false,
  printSectionStats: false,
  showSectionGrid: false,
  showButterflyPaths: false,
  showButterflyPathPoints: false,
  printButterflyPathLengths: false,
  skipStartBtn: false,
  skipIntro: false,
  restoreLastState: false,
  printPosition: false,
  validateAssets: false,
  printColors: [],
  printDimensions: [],
}

// Local storage
const DEV_LAST_STATE_KEY = 'dev-last-state'
const OUTFIT_KEY = 'outfit'
const SOUND_KEY = 'sound'

// UI
const GUIDE_DISPLAY_TIME = 5000

// BGM
const BGM_VOLUME = 0.3
const BGM_FADE_TIME = 3

// Math
const PI = Math.PI
const HALF_PI = PI * 0.5
const QUARTER_PI = PI * 0.25
const TAU = PI * 2
const INV_60 = 1 / 60
const TAU_DIV_6 = TAU / 6
const TAU_DIV_12 = TAU / 12
const TAU_DIV_24 = TAU / 24
const TAU_DIV_36 = TAU / 36
const TAU_DIV_60 = TAU * INV_60

const ROUND_DECIMAL_PLACES = 4
const ROUND_FACTOR = 10 ** ROUND_DECIMAL_PLACES

// Utils
const f1 = (n) => n.toFixed(1)
const f2 = (n) => n.toFixed(2)
const roundTo = (val) => Math.round(val * ROUND_FACTOR) / ROUND_FACTOR
const f32Arr = (len) => new Float32Array(len)
const toArr = (val) => (Array.isArray(val) ? val : [val])
const toNestedArr = (val) => (Array.isArray(val[0]) ? val : [val])
const isWhite = (r, g, b) => r > 0.9 && g > 0.9 && b > 0.9
const getNameParts = (name, del = '_') => name.split(del)
const keyCount = (obj) => Object.keys(obj).length
const fromKeys = (keys, getValue = () => null) =>
  Object.fromEntries(keys.map((key) => [key, getValue(key)]))
const numberedProps = (keyPrefix, valPrefix, count) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, id) => [`${keyPrefix}${id}`, `${valPrefix}${id}`]),
  )
const fail = (msg) => {
  throw new Error(msg)
}

const addVisible = (el) => el.classList.add('is-visible')
const removeVisible = (el) => el.classList.remove('is-visible')
const toggleVisible = (el) => el.classList.toggle('is-visible')
const addDisabled = (el) => el.classList.add('disabled')
const removeDisabled = (el) => el.classList.remove('disabled')
const addSelected = (el) => el?.classList.add('selected')
const removeSelected = (el) => el?.classList.remove('selected')
const setDisplayNone = (el) => (el.style.display = 'none')

// Transforms
const AXIS_INDEX = { x: 0, y: 1, z: 2 }
const UP_VECTOR = new THREE.Vector3(0, 1, 0)
const P0 = [0, 0, 0]
const S1 = [1, 1, 1]

// Temp
const tmpVec3 = new THREE.Vector3()
const tmpQuat = new THREE.Quaternion()
const tmpEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const tmpBox3 = new THREE.Box3()

// Timing
const MS_TO_S = 0.001
const MAX_DT = 0.05
const TIME_WRAP = TAU * 100

// Render limits
const MAX_PIXEL_COUNT = 3_000_000
const MAX_DPR = 2

// World
const SKY_COLOR = new THREE.Color(0xa6d8ff)
const SKY_RADIUS = 250
const SKY_W_SEG = 32
const SKY_H_SEG = 16
const GROUND_Y = 0
const FOG_NEAR = 200
const FOG_FAR = 400

// Camera
const CAMERA_FOV = 60
const CAMERA_NEAR = 0.1
const CAMERA_FAR = 300

const MIN_CAM_DESIRED_DIST = 4.5
const MAX_CAM_DESIRED_DIST = 9.5
const MIN_CAM_ALLOWED_DIST = 0
const INTRO_CAM_DIST_START = 100
const INTRO_CAM_DIST_TARGET = 6
const INTRO_CAM_DIST_DAMPING = 1.5

const LOOK_TARGET_OFFSET = 2
const CAM_OFFSET = 1.3
const INTRO_CAM_OFFSET_START = 60
const INTRO_CAM_OFFSET_TARGET = CAM_OFFSET
const INTRO_CAM_OFFSET_DAMPING = 2.5

const INTRO_FINISH_EPS = 0.05
const INTRO_DAMPING_FAST = 6

const MOTION_RESPONSE = 1e-3
const CAM_FOLLOW_MULTIPLIER = 0.5

const RAY_DIR_EPS = 1e-8

// Lights
const HEMI_SKY_COLOR = 0xffffff
const HEMI_GROUND_COLOR = 0x3a5b3f
const HEMI_INTENSITY = 0.9

const AMBIENT_COLOR = 0xffffff
const AMBIENT_INTENSITY = 1

const LIGHTS = {
  sun: {
    color: 0xfffaf0,
    intensity: 0.6,
    offset: new THREE.Vector3(5, 12, 4),
  },
  fill: {
    color: 0xb0c4de,
    intensity: 0.1,
    offset: new THREE.Vector3(-6, 7, -2),
  },
}

const LIGHT_UPDATE_THRESHOLD_SQ = 1e-2

// Shadows
const SHADOW_MAP_SIZE = 1024
const SHADOW_NEAR = 1
const SHADOW_FAR = 30
const SHADOW_HALF_SIZE = 12
const SHADOW_BIAS = 1e-4
const SHADOW_NORMAL_BIAS = 0.02

// Player
const PLAYER_HEIGHT = 1.8
const PLAYER_RADIUS = 0.15
const PLAYER_START_POS = new THREE.Vector3(0, GROUND_Y, 0)

const MOVE_SPEED = 5
const VELOCITY_DAMPING = 10
const VELOCITY_SNAP_EPS = 1e-4
const GRAVITY = -18
const JUMP_STRENGTH = 6.5

// Outfit
const OUTFIT_CONFIG = [
  { part: 'top', count: 16, colCount: 4 },
  { part: 'skirt', count: 16, colCount: 4 },
  { part: 'shoes', count: 4, colCount: 2 },
  { part: 'hairTies', count: 4, colCount: 2 },
  { part: 'hat', count: 4, colCount: 2 },
]

for (const cfg of OUTFIT_CONFIG) {
  cfg.uvStep = 1 / cfg.colCount
}

const OUTFIT_MESH_PARTS = [...OUTFIT_CONFIG.map(({ part }) => part), 'skirtSit', 'skirtSitFloor']

// Shops
const SHOPS = {
  BOUTIQUE: 'boutique',
  CAFE: 'cafe',
  ICE_CREAM_SHOP: 'iceCreamShop',
  PIZZERIA: 'pizzeria',
}

const SHOP_LIST = [SHOPS.CAFE, SHOPS.ICE_CREAM_SHOP, SHOPS.PIZZERIA]

const ORDER_CONFIRM_TIME = 1000

// Boutique
const BOUTIQUE_SLOT_COUNT = 64

// Cafe
const CAFE_CONFIG = [
  {
    label: 'Drinks',
    sections: [
      { title: 'Hot Coffee', count: 3 },
      { title: 'Cold Coffee', count: 3 },
      { title: 'Blended Drinks', count: 3 },
    ],
  },
  {
    label: 'Desserts',
    sections: [
      { title: 'Cookie', count: 3 },
      { title: 'Donut', count: 3 },
      { title: 'Muffin', count: 3 },
    ],
  },
]

const CAFE_SLOT_COUNT = 18

// Ice cream shop
const ICE_CREAM_SHOP_CONFIG = [
  { title: 'Choose a container', count: 2, nextMap: { 0: 1, 1: 2 } },
  { id: 'cupScoop', title: 'Choose the number of scoops', count: 3, back: 0, next: 4 },
  { id: 'coneFlavor', title: 'Choose a cone flavor', count: 2, back: 0, next: 3 },
  { id: 'coneScoop', title: 'Choose the number of scoops', count: 2, back: 2, next: 4 },
  { id: 'flavor', title: '', count: 16, backMap: { 0: 1, 1: 3 } },
]

const ICE_CREAM_ITEM_SLOT_COUNT = 16
const ICE_CREAM_FLAVOR_SLOT_COUNT = 64
const ICE_CREAM_FLAVOR_START = 48

const ICE_CREAM_FLAVOR_STEP_TITLES = [
  'Choose your ice cream flavor',
  'Choose 2 ice cream flavors',
  'Choose 3 ice cream flavors',
]

const ICE_CREAM_FLAVOR_NAMES = [
  'Cherry',
  'Mint Chocolate Chip',
  'Chocolate',
  'Cotton Candy',
  'Cookies & Cream',
  'Pistachio',
  'Chocolate Chip',
  'Rainbow Sherbet',
  'Mango',
  'Vanilla',
  'Strawberry',
  'Cheesecake',
  'Blue Cookies & Cream',
  'Green Tea',
  'Apple Mint',
  'Caramel',
]

// Pizzeria
const PIZZERIA_CONFIG = [
  { title: 'Pizza Slice', count: 3 },
  { title: 'Soda', count: 6 },
]

const PIZZERIA_SLOT_COUNT = 9

// Items
const ITEM_OFFSET = 0.25

const HAND_KEYS = ['l', 'r', 'le', 're']
const HAND_OFFSET = 0.3

const PLATE_SLOT_FACING_DIST_WEIGHT = 3
const MAX_PLATE_SLOT_DELTA = 2
const MIN_PLATE_SLOT_DELTA = HAND_OFFSET

const ITEM_MAT_SPECS = [
  { prefix: 'container_0', count: 3 },
  { prefix: 'container_1', count: 2 },
  { prefix: 'flavor', count: 16 },
  { prefix: 'cup', count: 2 },
  { prefix: 'drink_0', count: 9 },
  { prefix: 'drink_1', count: 6 },
  { prefix: 'dessert', count: 6 },
]

const ITEM_SPECS = [
  { prefix: 'cafe_0', count: 9 },
  { prefix: 'cafe_1', count: 9 },
  { prefix: 'pizzeria_0', count: 3 },
  { prefix: 'pizzeria_1', count: 3 },
  { prefix: 'iceCreamShop', count: 3, fixed: true },
  { prefix: 'iceCreamShop_spoon', fixed: true },
]

const PLAYER_ITEM_SPECS = [
  { prefix: 'cafe_0', count: 9, isDrink: true },
  { prefix: 'cafe_1', count: 9, e: true },
  { prefix: 'pizzeria_0', count: 3, e: true },
  { prefix: 'pizzeria_1', count: 6, isDrink: true },
  { prefix: 'iceCreamShop_0', count: 3 },
  { prefix: 'iceCreamShop_1', count: 2 },
]

const NPC4_ITEM_SPECS = { scoopCount: 2, coneFlavorCount: 2 }

// Blink
const BLINK_OPEN_MIN_TIME = 2
const BLINK_OPEN_TIME_VARIATION = 0.5
const BLINK_CLOSED_TIME = 0.12

// Animations
const PLAYER_CORE_ANIMS = {
  IDLE: 'Idle',
  WALK: 'Walk',
  JUMP_START: 'JumpStart',
  JUMP_END: 'JumpEnd',
  FALL: 'Fall',
}

const PLAYER_CORE_ANIM_LIST = Object.values(PLAYER_CORE_ANIMS)

const HOLD_ANIM_COUNT = 4
const EAT_ANIM_COUNT = 8

const PLAYER_ANIMS = {
  GREET: 'Greet',
  ...PLAYER_CORE_ANIMS,
  SIT: 'Sit',
  SIT_FLOOR: 'SitFloor',
  ...numberedProps('HOLD', 'Hold', HOLD_ANIM_COUNT),
  ...numberedProps('EAT', 'Eat', EAT_ANIM_COUNT),
}

const ANIMS = {
  ...PLAYER_ANIMS,
  MAIN: 'Main',
  TYPE: 'Type',
  READ: 'Read',
  OFFER: 'Offer',
}

const LOOP_ONCE_ANIMS = [ANIMS.JUMP_START, ANIMS.JUMP_END, ANIMS.FALL]

const DEV_ANIM = ANIMS.IDLE

const ANIM_FADE = 0.1
const INTRO_ANIM_FADE = 0.5
const WALK_TO_IDLE_FADE = 0.4

const ANIM_PARTS = {
  HEAD: 'head',
  BODY: 'body',
  ARM_L: 'armL',
  ARM_R: 'armR',
}

const ANIM_PART_LIST = Object.values(ANIM_PARTS)

const SIT_ANIM_ALIASES = {
  [ANIMS.SIT]: ANIMS.IDLE,
  [ANIMS.SIT_FLOOR]: ANIMS.IDLE,
}

const ANIM_ALIASES = {
  [ANIM_PARTS.HEAD]: SIT_ANIM_ALIASES,
  [ANIM_PARTS.ARM_L]: SIT_ANIM_ALIASES,
  [ANIM_PARTS.ARM_R]: SIT_ANIM_ALIASES,
}

const HEAD_KEYWORDS = ['head', 'neck', 'spine006']
const ARM_KEYWORDS = ['shoulder', 'arm', 'hand']
const ARM_ANIM_PREFIXES = ['Hold', 'Eat', 'Offer']

// NPCs
const NPC_ANIMS = {
  0: ANIMS.TYPE,
  1: ANIMS.READ,
  2: ANIMS.IDLE,
  3: ANIMS.IDLE,
  4: [ANIMS.IDLE, ANIMS.OFFER],
  5: ANIMS.IDLE,
}

const NPC_COUNT = keyCount(NPC_ANIMS)
const CHARACTER_COUNT = NPC_COUNT + 1

// GLTF files
const GLTF_FILES = [
  'models',
  'butterfly',
  'player',
  ...Array.from({ length: NPC_COUNT }, (_, i) => `npc${i}`),
]

// Input
const MOVEMENT_KEYS = [
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]

const JUMP_KEY = 'Space'
const INTERACT_KEY = 'KeyE'
const ESC_KEY = 'Escape'

const INPUT_KEYS = [...MOVEMENT_KEYS, JUMP_KEY, INTERACT_KEY]

const KEYS_X_POS = ['KeyA', 'ArrowLeft']
const KEYS_X_NEG = ['KeyD', 'ArrowRight']
const KEYS_Z_POS = ['KeyW', 'ArrowUp']
const KEYS_Z_NEG = ['KeyS', 'ArrowDown']

const MOUSE_YAW_SPEED = 0.004
const MOUSE_ZOOM_SPEED = 0.01

// World boundary
const LAND_RADIUS = 38
const MAX_DIST = LAND_RADIUS - PLAYER_RADIUS
const MAX_DIST_SQ = MAX_DIST * MAX_DIST

// Sections
const SECTION_SIZE = 10
const INV_SECTION_SIZE = 1 / SECTION_SIZE
const SECTION_PADDING = PLAYER_RADIUS + 0.05

const SECTION_CONTENT = {
  COLLIDERS: 'colliders',
  CAMERA_BLOCKERS: 'cameraBlockers',
  INTERACTABLES: 'interactables',
  PLATE_SLOTS: 'plateSlots',
}

// Categories
const NODE_CATEGORIES = {
  COLLISION: 'collision',
  BLOCKER: 'blocker',
  INTERACTABLE: 'interactable',
  LEAF_LAYOUT: 'leafLayout',
  APPLE_LAYOUT: 'appleLayout',
  FIRE: 'fire',
  FACE: 'face',
  PRINT: 'print',
  CENTER: 'center',
}

// Bounds
const BOUNDS_TYPES = {
  CIRCLE: 'circle',
  AABB: 'aabb',
}

// Interactables
const INTERACTABLE_TYPES = {
  CHAIR: 'chair',
  STOOL: 'stool',
  CUSHION: 'cushion',
  SOFA: 'sofa',
  BENCH: 'bench',
  LIGHT: 'light',
  LIGHTHOUSE: 'lighthouse',
  BINOCULARS: 'binoculars',
  TV: 'tv',
  CANDLE: 'candle',
  TRASH_BIN: 'trashBin',
  FITTING_ROOM: 'fittingRoom',
  TELEPHONE_BOOTH: 'telephoneBooth',
  MAILBOX: 'mailbox',
  PLATE: 'plate',
  KIOSK: 'kiosk',
}

const INTERACTABLE_PART_ROLES = {
  ANCHOR: 'anchor',
  TRIGGER: 'trigger',
  COLLISION: 'collision',
}

// Ocean
const OCEAN_TEXTURE_TILING = 10
const OCEAN_COLOR = 0x8fdcff
const OCEAN_RADIUS = 400
const OCEAN_SEGMENTS = 96
const OCEAN_Y = -3

const OCEAN_SPEED_X = 0.01
const OCEAN_SPEED_Y = 0.01
const OCEAN_SWELL_SPEED = 1
const OCEAN_SWELL_AMP = 0.1

// Boat
const BOAT_PATH_RADIUS = 270
const BOAT_INIT_ANG = -PI * 0.25
const BOAT_SPEED = 0.003

// Fence
const FENCE_SEG_COUNT = 76
const FENCE_SEG_ANGLE = TAU / FENCE_SEG_COUNT

// Butterflies
const PATH_EXTENT = 20
const BUTTERFLY_PATH_SPEED = 0.025
const BUTTERFLY_T = 0.05

const BUTTERFLY_INSTANCES = [
  {
    name: 'butterfly1',
    path: new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-PATH_EXTENT, 2.8, PATH_EXTENT),
        new THREE.Vector3(PATH_EXTENT, 3.2, -PATH_EXTENT),
        new THREE.Vector3(PATH_EXTENT, 3.5, PATH_EXTENT),
        new THREE.Vector3(-PATH_EXTENT, 2.5, -PATH_EXTENT),
      ],
      true,
    ),
    color: new THREE.Color(0xff6ca8),
  },
  {
    name: 'butterfly2',
    path: new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(PATH_EXTENT, 4.6, -PATH_EXTENT),
        new THREE.Vector3(-PATH_EXTENT, 2.8, -PATH_EXTENT),
        new THREE.Vector3(PATH_EXTENT, 4.4, PATH_EXTENT),
        new THREE.Vector3(-PATH_EXTENT, 3.2, PATH_EXTENT),
      ],
      true,
    ),
    color: new THREE.Color(0x7664b6),
  },
  {
    name: 'butterfly3',
    path: new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-PATH_EXTENT * 0.5, 3, -PATH_EXTENT * 0.5),
        new THREE.Vector3(PATH_EXTENT, 3.7, -PATH_EXTENT),
        new THREE.Vector3(0, 4, PATH_EXTENT),
        new THREE.Vector3(-PATH_EXTENT, 3.1, 0),
        new THREE.Vector3(0, 2.7, -PATH_EXTENT * 1.05),
        new THREE.Vector3(PATH_EXTENT, 3.3, 0),
      ],
      true,
    ),
    color: new THREE.Color(0xffc857),
  },
]

const BUTTERFLY_FLUTTER_RADIUS = 0.25
const BUTTERFLY_FLUTTER_HEIGHT = 0.15
const BUTTERFLY_FLUTTER_SPEED = 3.5

const BUTTERFLY_BOB_MULT = 2
const BUTTERFLY_DEPTH_MULT = 0.5

const BUTTERFLY_ROLL_SPEED = 6
const BUTTERFLY_ROLL_AMP = 0.15

// Effects
const EFFECTS = {
  SWAY: 'sway',
  LEAF_SWAY: 'leafSway',
}

const EFFECTS_TIME = { value: 0 }

const SWAY_SPEED = 1.8
const SWAY_OFFSET_SCALE = 10
const SWAY_AMP = 0.3

const LEAF_SWAY_SPEED = 5
const LEAF_SWAY_OFFSET_SCALE = 10
const LEAF_SWAY_AMP = 0.1

// Materials
const MAT_TYPE = {
  VERTEX: 'vertex',
  TEXTURE: 'texture',
}

// Textures
const TEXTURES_CONFIG = {
  ocean: { repeat: [OCEAN_TEXTURE_TILING, OCEAN_TEXTURE_TILING] },
  sky: { mipmaps: false },
  faceOpen: { flipY: false },
  faceOpen2: { flipY: false },
  faceClosed: { flipY: false },
  faceClosed2: { flipY: false },
}

// Colors
const FLOWER = {
  WHITE: new THREE.Color(0xfffdf7),
  PINK: new THREE.Color(0xffd6e8),
  RED: new THREE.Color(0xe07a74),
  ORANGE: new THREE.Color(0xe8b07c),
  YELLOW: new THREE.Color(0xfff3a0),
  PURPLE: new THREE.Color(0xc3a2e8),
}

const COLORS = {
  FLOOR_PILLOW_WHITE: new THREE.Color(0xe8dcc8),
  FLOOR_PILLOW_PINK: new THREE.Color(0xe9a7a0),
  FLOOR_PILLOW_GREEN: new THREE.Color(0xafc6a2),

  DONUT_STRAWBERRY: new THREE.Color(0xe8a6a1),
  DONUT_CHOCOLATE: new THREE.Color(0x6b4638),

  LOUNGE_FENCE_RAIL: new THREE.Color(0x9a7456),
  LOUNGE_FENCE_POST: new THREE.Color(0x87664a),

  ICE_CREAM_SHOP_FENCE_RAIL: new THREE.Color(0xe6ccb2),
  ICE_CREAM_SHOP_FENCE_POST: new THREE.Color(0xdcbfa2),

  PIZZERIA_FENCE_RAIL: new THREE.Color(0xb48766),
  PIZZERIA_FENCE_POST: new THREE.Color(0xa27a5d),

  SHOES_RED: new THREE.Color(0xca8a8a),
  SHOES_ORANGE: new THREE.Color(0xe3b08f),
  SHOES_BLUE: new THREE.Color(0xa9c2cc),

  BLACK: new THREE.Color(0x000000),
}

const COLOR_SETS = {
  TABLE_WARM_BROWN: [new THREE.Color(0x8a674a), new THREE.Color(0x5a3f2c)],

  PATIO_UMBRELLA_WHITE: [new THREE.Color(0xf2e8dc), new THREE.Color(0x6e4f38)],

  CHAIR_WARM_BROWN: [new THREE.Color(0xa07a58), null],

  COOKIE_DOUBLE_CHOCOLATE: [new THREE.Color(0x7a4e3a), new THREE.Color(0x3e2720)],
  COOKIE_RED_VELVET: [new THREE.Color(0x9e4b4b), new THREE.Color(0xead8c4)],

  BAG_BLUE: [new THREE.Color(0x8fc5e8), new THREE.Color(0xd6ecf8)],
  BAG_WHITE: [new THREE.Color(0xe6e2d9), new THREE.Color(0xf5f3ee)],
  BAG_GREEN: [new THREE.Color(0x9faa9a), new THREE.Color(0xb3beb0)],
  BAG_CORAL: [new THREE.Color(0xd9968a), new THREE.Color(0xf2c7c2)],
  BAG_NAVY: [new THREE.Color(0x72828c), new THREE.Color(0xf4e6d8)],

  SHOEBOX_BROWN: [new THREE.Color(0xb8a48d), new THREE.Color(0xccb8a2)],
}

const GRID_CENTER_COLOR = 0xff0000
const GRID_LINE_COLOR = 0xcccccc

const BUTTERFLY_PATH_POINT_COLORS = [0xff3b30, 0xff9500, 0xffcc00, 0x34c759, 0x007aff, 0xaf52de]

// Model config defaults
const DEFAULT_CAST_SHADOW = true
const DEFAULT_RECEIVE_SHADOW = true
const DEFAULT_SYNC_SHADOWS = true

const DEFAULT_CLUSTER_SIZE = 3
const DEFAULT_CLUSTER_RADII = { 2: 0.3, 3: 0.4 }

// Model params
const BINOCULARS_LOOK_TARGET = new THREE.Vector3(0, PLAYER_HEIGHT, -160)
const BINOCULARS_CAMERA_POS = new THREE.Vector3(0, PLAYER_HEIGHT, -150)

const LAPTOP_SCREEN_W = 0.25
const LAPTOP_SCREEN_H = 0.15625
const LAPTOP_FRAME_COUNT = 13
const LAPTOP_FRAME_COLS = 4
const INV_LAPTOP_FRAME_COLS = 1 / LAPTOP_FRAME_COLS
const LAPTOP_FRAME_TIME = 0.3

const FIRE_OPACITY = 0.7
const FIRE_FLICKER_SPEED = 4
const FIRE_FLICKER_AMP = 0.1
const FIRE_FLICKER_XZ = 0.5

const CHAIR_OFFSET = 2
const CHAIR_SEAT_HEIGHT = 0.65

const SEAT_ACTION_TEXTS = fromKeys(
  [
    INTERACTABLE_TYPES.CHAIR,
    INTERACTABLE_TYPES.STOOL,
    INTERACTABLE_TYPES.CUSHION,
    INTERACTABLE_TYPES.SOFA,
    INTERACTABLE_TYPES.BENCH,
  ],
  (type) => `Sit on the ${type}`,
)

const TRASH_BIN_SPEED = 3
const TRASH_BIN_MAX_ANGLE = 0.6

const DOOR_SPEED = 4
const DOOR_MIN_ANGLE = -HALF_PI
const DOOR_MAX_ANGLE = HALF_PI

const MAILBOX_STATES = {
  CLOSED: 0,
  OPEN: 1,
  READING: 2,
  READ: 3,
}

const MAILBOX_ACTION_TEXTS = [
  'Open the mailbox',
  'Read the letter',
  'Close the letter',
  'Close the mailbox',
]

const MAILBOX_STATE_COUNT = keyCount(MAILBOX_STATES)

const FITTING_ROOM_HOOK = { x: 0.55, y: 2.025, z: -1.5 }

const CLOTHING_RACK_BAR_HEIGHT = 1.855
const CLOTHING_RACK_SHELF_HEIGHT = 0.3515
const HANGERS_INTERVAL = 0.6
const HANGER_ANGLE = -TAU_DIV_6

const SHELF_CELL_SPACING = 0.95
const SHELF_PLACEMENT_HEIGHT = 0.05

const CAFE_COUNTER_HEIGHT = 0.8
const CAFE_COUNTER_Z = 2.5
const TRAY_PLACEMENT_HEIGHT = 0.03

const POINT_LIGHT_COLOR = 0xffddaa
const POINT_LIGHT_INTENSITY = 0.7
const POINT_LIGHT_DISTANCE = 10

const OVEN_LIGHT_COLOR = 0xffc27a
const OVEN_LIGHT_INTENSITY = 0.5
const OVEN_LIGHT_DISTANCE = 1
const OVEN_LIGHT_OFFSET = 0.3

const EMISSIVE_COLOR = 0xffe8a3
const EMISSIVE_DECORATIVE_COLOR = 0xffd84d
const EMISSIVE_WINDOW_COLOR = 0xffe6a0
const EMISSIVE_INTENSITY = 0.8

const FLOOR_SZ_X = 18
const FLOOR_SZ_Z = 18
const POST_CNT_X = 10
const POST_CNT_Z = 10

const LOUNGE_SZ_X = 20
const LOUNGE_SZ_Z = 15
const LOUNGE_POST_CNT_X = 9
const LOUNGE_POST_CNT_Z = 7

const NPC3_X = -1.4
const NPC4_X = -1.9

// Models
const NPC_MODELS_CONFIG = {
  npc0: onTop('bench2', 0, { pos: [-1, 0, 0.43], receiveShadow: false }),
  npc1: parent('bench4', 0, { pos: [0, CHAIR_SEAT_HEIGHT, 0.53], receiveShadow: false }),
  npc2: parent('cafe', 0, { pos: [0, 0, 1.4], receiveShadow: false }),
  npc3: parent('counter4', 1, { pos: [NPC3_X, 0, -1.35], receiveShadow: false }),
  npc4: parent('counter2', 0, { pos: [NPC4_X, 0, -1.6], receiveShadow: false }),
  npc5: parent('counter', 0, { pos: [0, 0, -1.35], receiveShadow: false }),
}

const ANIMATED_MODELS_CONFIG = {
  butterfly: { receiveShadow: false },
  player: { receiveShadow: false },
  ...NPC_MODELS_CONFIG,
}

const ITEM_MODELS_CONFIG = {
  // Cafe
  ...placeItems(
    'cafe',
    0,
    false,
    'item_cafe_0_',
    ['0_2', '3_8'],
    [0, CAFE_COUNTER_HEIGHT, CAFE_COUNTER_Z],
    ITEM_OFFSET,
  ),
  ...placeItems(
    'cafe',
    0,
    false,
    'item_cafe_1_',
    ['0_2', '3_5', 6, 7, 8],
    [0, CAFE_COUNTER_HEIGHT, CAFE_COUNTER_Z],
    -ITEM_OFFSET,
  ),

  // Ice cream shop
  ...placeItems('counter2', 0, true, 'item_iceCreamShop_', [0, 1, 2], [NPC4_X - 0.1, 0, 0]),
  item_iceCreamShop_spoon: onTop('counter2', 0, { pos: [NPC4_X + 0.3, 0, 0] }),

  // Pizzeria
  ...placeItems('counter4', 1, true, 'item_pizzeria_0_', [0, 1, 2], [NPC3_X, 0, 0], ITEM_OFFSET),
  ...placeItems('counter4', 1, true, 'item_pizzeria_1_', ['0_5'], [NPC3_X, 0, 0], -ITEM_OFFSET),
}

const STATIC_MODELS_CONFIG = {
  land: { castShadow: false },
  boat: { castShadow: false, receiveShadow: false, skipInitScene: true },
  fence: {},

  // Lighthouse
  lighthouse: { id: 0, pos: [-15, 0, -28] },
  binoculars: parent('lighthouse', 0, { pos: [7, 0, -6] }),

  // House
  house: { id: 0, pos: [-28, 0, 12], rotY: HALF_PI },
  steppingStone: { instances: [...placeLinear('house', 0, false, [2.5, 0, 0], 'z', 5.8, 1.2, 5)] },
  mailbox: parent('house', 0, { id: 0, pos: [5.5, 0, 7] }),

  // Corner
  clock: { isClock: true, id: 0, pos: [22, 0, -26] },
  bench3: parent('clock', 0, { pos: [1.5, 0, 6.5], rotY: HALF_PI }),
  bench4: parent('clock', 0, { id: 0, pos: [-1.5, 0, 6.5], rotY: -HALF_PI }),
  tumbler: parent('bench4', 0, { pos: [1, CHAIR_SEAT_HEIGHT, 0.3] }),
  telephoneBooth: parent('clock', 0, { pos: [6, 0, 12], rotY: -HALF_PI }),
  trashBin4: parent('clock', 0, { pos: [-2, 0, 0] }),

  // Center
  center: { id: 0 },
  signboard: parent('center', 0, { id: 0, pos: [-3, 0, 1] }),
  directionalSignpost: parent('center', 0, { id: 0, pos: [3, 0, 0.5] }),
  treeStump: {
    instances: [
      parent('center', 0, { id: 0, pos: [10, 0, -5] }),
      parent('center', 0, { id: 1, pos: [5, 0, 3] }),
      parent('center', 0, { id: 2, pos: [12, 0, 6.5] }),
      parent('center', 0, { id: 3, pos: [-6, 0, 6] }),
    ],
  },
  doNotEnterWater: {
    instances: [
      parent('center', 0, { pos: [-11, 0, -35.5], rotY: TAU_DIV_24 }),
      parent('center', 0, { pos: [1, 0, 37], rotY: PI }),
    ],
  },

  // Floors
  loungeFloor: { id: 0, pos: [25, 0, 0], rotY: -HALF_PI },
  cafeFloor: { id: 0, pos: [-23, 0, -8], rotY: HALF_PI },
  boutiqueFloor: { id: 0, pos: [11, 0, 23], rotY: PI },
  iceCreamShopFloor: { id: 0, pos: [-9, 0, 23], rotY: PI },
  pizzeriaFloor: { id: 0, pos: [5, 0, -23] },

  // Fences
  fenceRails: {
    instances: [
      ...placeFenceRails('boutiqueFloor', 0, FLOOR_SZ_X, FLOOR_SZ_Z),
      ...placeFenceRails('loungeFloor', 0, LOUNGE_SZ_X, LOUNGE_SZ_Z, COLORS.LOUNGE_FENCE_RAIL),
      ...placeFenceRails(
        'iceCreamShopFloor',
        0,
        FLOOR_SZ_X,
        FLOOR_SZ_Z,
        COLORS.ICE_CREAM_SHOP_FENCE_RAIL,
      ),
      ...placeFenceRails('pizzeriaFloor', 0, FLOOR_SZ_X, FLOOR_SZ_Z, COLORS.PIZZERIA_FENCE_RAIL),
    ],
  },
  fencePost: {
    instances: [
      ...placeFencePosts('boutiqueFloor', 0, FLOOR_SZ_X, FLOOR_SZ_Z, POST_CNT_X, POST_CNT_Z),
      ...placeFencePosts(
        'loungeFloor',
        0,
        LOUNGE_SZ_X,
        LOUNGE_SZ_Z,
        LOUNGE_POST_CNT_X,
        LOUNGE_POST_CNT_Z,
        COLORS.LOUNGE_FENCE_POST,
      ),
      ...placeFencePosts(
        'iceCreamShopFloor',
        0,
        FLOOR_SZ_X,
        FLOOR_SZ_Z,
        POST_CNT_X,
        POST_CNT_Z,
        COLORS.ICE_CREAM_SHOP_FENCE_POST,
      ),
      ...placeFencePosts(
        'pizzeriaFloor',
        0,
        FLOOR_SZ_X,
        FLOOR_SZ_Z,
        POST_CNT_X,
        POST_CNT_Z,
        COLORS.PIZZERIA_FENCE_POST,
      ),
    ],
  },

  // Lounge
  sofa: {
    instances: [
      onTop('loungeFloor', 0, { id: 0, pos: [8, 0, 0], rotY: -HALF_PI }),
      onTop('loungeFloor', 0, { id: 1, pos: [4.5, 0, 5], rotY: PI }),
    ],
  },
  table: {
    instances: [
      parent('sofa', 0, { id: 0, pos: [0, 0, 2.5], rotY: PI }),
      parent('sofa', 1, { id: 1, pos: [0, 0, 2.5], rotY: PI }),
    ],
  },
  table2: {
    instances: [
      onTop('loungeFloor', 0, { id: 0, pos: [-5, 0, -1] }),
      onTop('loungeFloor', 0, { id: 1, pos: [-5, 0, 3] }),
      ...placeLinear('cafeFloor', 0, true, [-5, 0, 0], 'z', 2, 4, 2, {
        id: 2,
        colors: COLOR_SETS.TABLE_WARM_BROWN,
      }),
    ],
  },
  patioUmbrella: {
    instances: [
      ...placeOnParents('table2', [0, 1], false),
      ...placeOnParents('table2', [2, 3], false, { colors: COLOR_SETS.PATIO_UMBRELLA_WHITE }),
    ],
  },
  chair: {
    instances: [
      ...placeChairsAroundTable(
        'table2',
        [0, 1],
        [
          [1, 0, 1, 0],
          [1, 0, 0, 1],
        ],
      ),
      ...placeChairsAroundTable(
        'table2',
        [2, 3],
        [
          [1, 1, 1, 0],
          [1, 0, 1, 0],
        ],
        { colors: COLOR_SETS.CHAIR_WARM_BROWN },
      ),
    ],
  },
  treeStumpStool: {
    instances: [
      parent('table', 1, { pos: [-2.2, 0, 0], rotY: HALF_PI }),
      parent('table2', 1, { pos: [2.3, 0, -0.7], rotY: -HALF_PI }),
      parent('table2', 1, { pos: [2.2, 0, 0.8], rotY: -HALF_PI }),
    ],
  },
  cushion: {
    instances: [
      onTop('loungeFloor', 0, { pos: [0, 0, -2], rotY: PI, colors: [COLORS.FLOOR_PILLOW_WHITE] }),
      onTop('loungeFloor', 0, { pos: [-0.8, 0, 0], rotY: PI, colors: [COLORS.FLOOR_PILLOW_GREEN] }),
      onTop('loungeFloor', 0, {
        pos: [1.2, 0, -0.5],
        rotY: PI,
        colors: [COLORS.FLOOR_PILLOW_PINK],
      }),
    ],
  },
  tv: {
    instances: [onTop('loungeFloor', 0, { pos: [0, 0, -5.5] })],
  },
  stringLights: {
    instances: [
      ...spreadAlongAxis('loungeFloor', 0, true, [0, 0, -6.5], 'x', 12, 2),
      ...arrangeInGrid('cafeFloor', 0, true, 2, 2, P0, 19.6, 9, { rotY: HALF_PI }),
    ],
  },
  plantPot: {
    instances: [...spreadAlongAxis('loungeFloor', 0, true, [0, 0, -4.5], 'x', 8, 2)],
  },
  plantPot2: {
    instances: [...spreadAlongAxis('loungeFloor', 0, true, [0, 0, -4.5], 'x', 12, 2)],
  },
  plantPot3: {
    instances: [
      onTop('table2', 0, { pos: [-0.1, 0, 0.25] }),
      onTop('table2', 1, { pos: [0.1, 0, -0.25] }),
    ],
  },
  candle: {
    instances: [
      onTop('table', 0, { pos: [0.1, 0, -0.1] }),
      onTop('table', 1, { pos: [0.3, 0, 0], rotY: -TAU_DIV_12 }),
    ],
  },

  // Cafe
  cafe: onTop('cafeFloor', 0, { id: 0, pos: [0, 0, -5.5] }),
  espressoMachine: parent('cafe', 0, { pos: [-2.5, CAFE_COUNTER_HEIGHT, -2.05] }),
  coffeeGrinder: {
    instances: [...spreadAlongAxis('cafe', 0, false, [-0.6, CAFE_COUNTER_HEIGHT, -2], 'x', 0.6, 2)],
  },
  cupStacks: parent('cafe', 0, { pos: [0.55, CAFE_COUNTER_HEIGHT, -2] }),
  cupFlipped: {
    instances: [
      ...arrangeInGrid('cafe', 0, false, 2, 2, [1.45, CAFE_COUNTER_HEIGHT, -2], 0.4, 0.4),
    ],
  },
  milk: {
    instances: [
      ...spreadAlongAxis('cafe', 0, false, [3.25, CAFE_COUNTER_HEIGHT, -2], 'x', 0.5, 2, [
        { rotY: -HALF_PI },
        {},
      ]),
    ],
  },
  coffeeBag: {
    instances: [
      ...spreadAlongAxis('cafe', 0, false, [1.8, 1.8, -2.55], 'x', 0.45, 3, [
        {
          expandedCollision: {
            scale: [3, 1, 1],
            interval: [0.45, 0, 0],
          },
        },
        { noCollision: true },
        { noCollision: true },
      ]),
    ],
  },
  cafeRegister: parent('cafe', 0, { pos: [2.7, CAFE_COUNTER_HEIGHT, CAFE_COUNTER_Z] }),
  cafeMenu: parent('cafe', 0, { pos: [1.85, CAFE_COUNTER_HEIGHT, CAFE_COUNTER_Z] }),
  carafe: parent('cafe', 0, { pos: [-1.3, CAFE_COUNTER_HEIGHT, CAFE_COUNTER_Z] }),
  tray: parent('cafe', 0, { id: 0, pos: [-2.5, CAFE_COUNTER_HEIGHT, CAFE_COUNTER_Z] }),
  cookie: {
    instances: [
      ...arrangeInGrid('tray', 0, false, 3, 2, [-0.46, TRAY_PLACEMENT_HEIGHT, 0], 0.28, 0.275, [
        [
          { expandedCollision: { scale: [2, 1, 3], interval: [0.28, 0, 0.275] } },
          { noCollision: true },
        ],
        { colors: COLOR_SETS.COOKIE_DOUBLE_CHOCOLATE, noCollision: true },
        { colors: COLOR_SETS.COOKIE_RED_VELVET, noCollision: true },
      ]),
    ],
  },
  donut: {
    instances: [
      ...arrangeInGrid('tray', 0, false, 3, 2, [0.14, TRAY_PLACEMENT_HEIGHT, 0], 0.28, 0.275, [
        [
          { expandedCollision: { scale: [2, 1, 3], interval: [0.28, 0, 0.275] } },
          { noCollision: true },
        ],
        { color: COLORS.DONUT_STRAWBERRY, noCollision: true },
        { color: COLORS.DONUT_CHOCOLATE, noCollision: true },
      ]),
    ],
  },
  ...spreadVariationsAlongAxis(
    'tray',
    0,
    false,
    'muffin',
    [1, 2, 3],
    [0.6, TRAY_PLACEMENT_HEIGHT, 0],
    'z',
    0.275,
  ),
  table3: {
    instances: [onTop('cafeFloor', 0, { id: 0, pos: [5.5, 0, 4], rotY: HALF_PI })],
  },
  bench1: parent('table3', 0, { pos: [0, 0, -2.12] }),
  bench2: parent('table3', 0, { id: 0, pos: [0, 0, 2.12], rotY: PI }),
  laptop: onTop('table3', 0, { pos: [1, 0, 1.17] }),
  drink: onTop('table3', 0, { pos: [1.8, 0, 1.1] }),
  plantPot4: {
    instances: [onTop('table2', 3, { pos: [0.1, 0, 0.25] })],
  },
  plantPot5: {
    instances: [onTop('table2', 2, { pos: [-0.1, 0, 0.25] })],
  },
  trashBin: {
    instances: [...placeLinear('cafeFloor', 0, true, [0, 0, -7.5], 'x', 5.5, 1.7, 2)],
  },
  crate: {
    instances: [...placeLinear('cafeFloor', 0, true, [0, 0, -7], 'x', -5, -1.2, 2)],
  },

  // Boutique
  fittingRoom: {
    instances: [...spreadAlongAxis('boutiqueFloor', 0, true, [0, 0, -6.5], 'x', 10, 2, { id: 0 })],
  },
  clothingRack: {
    instances: [
      onTop('boutiqueFloor', 0, { id: 0, pos: [-7, 0, 4.8], rotY: HALF_PI }),
      ...spreadAlongAxis('boutiqueFloor', 0, true, [7, 0, 2], 'z', 5.6, 2, {
        id: 1,
        rotY: -HALF_PI,
      }),
    ],
  },
  counter: onTop('boutiqueFloor', 0, { id: 0, pos: [0, 0, -4] }),
  shelf: onTop('boutiqueFloor', 0, { id: 0, pos: [0, 0, -7.5] }),
  displayTable: onTop('boutiqueFloor', 0, { id: 0, pos: [-7, 0, -0.8], rotY: HALF_PI }),
  displayTable2: {
    instances: [...spreadAlongAxis('boutiqueFloor', 0, true, [0, 0, 2], 'z', 4, 2, { id: 0 })],
  },
  boutiqueRegister: onTop('counter', 0, { pos: [1.2, 0, 0] }),
  scanner: onTop('counter', 0, { pos: [0.5, 0, 0] }),
  diffuser: { instances: [...spreadAlongAxis('shelf', 0, true, P0, 'x', 3.2, 2)] },
  tissueBox: parent('shelf', 0, { pos: [0, SHELF_PLACEMENT_HEIGHT, 0.1] }),
  shoppingBag: {
    instances: [
      parent('shelf', 0, {
        pos: [-SHELF_CELL_SPACING - 0.1, SHELF_PLACEMENT_HEIGHT, 0.12],
        rotY: -TAU_DIV_12,
      }),
      parent('shelf', 0, {
        pos: [2 * SHELF_CELL_SPACING, SHELF_PLACEMENT_HEIGHT, 0.1],
        rotY: TAU_DIV_60,
        scale: [1.2, 1.2, 1.2],
      }),
    ],
  },
  shoppingBag2: {
    instances: [
      parent('shelf', 0, {
        pos: [-SHELF_CELL_SPACING + 0.1, SHELF_PLACEMENT_HEIGHT, -0.12],
        rotY: -TAU_DIV_12,
        noCollision: true,
      }),
      onTop('counter', 0, { pos: [-1, 0, 0], scale: [1.2, 1.2, 1.2] }),
    ],
  },
  shoebox: {
    instances: [
      parent('shelf', 0, { pos: [-2 * SHELF_CELL_SPACING, SHELF_PLACEMENT_HEIGHT, 0.1] }),
      parent('shelf', 0, {
        pos: [SHELF_CELL_SPACING, SHELF_PLACEMENT_HEIGHT, 0.1],
        colors: COLOR_SETS.SHOEBOX_BROWN,
      }),
    ],
  },
  mirror: {
    instances: [
      ...spreadAlongAxis('boutiqueFloor', 0, true, [0, 0, -5], 'x', 14.6, 2),
      ...spreadAlongAxis('boutiqueFloor', 0, true, [0, 0, 2], 'x', 14, 2, [
        { rotY: HALF_PI },
        { rotY: -HALF_PI },
      ]),
    ],
  },
  ...placeVariationsLinear(
    'boutiqueFloor',
    0,
    true,
    'dressForm',
    [5, 1, 4],
    [0, 0, 8],
    'x',
    -2.8,
    -1.7,
  ),
  ...placeVariationsLinear(
    'boutiqueFloor',
    0,
    true,
    'dressForm',
    [3, 6, 2],
    [0, 0, 8],
    'x',
    2.8,
    1.7,
  ),
  ...spreadVariationsAlongAxis('displayTable', 0, true, 'mannequinHead', [1, 2], P0, 'x', 1.6),
  hanger: {
    instances: [
      parent('fittingRoom', 0, { pos: [0, FITTING_ROOM_HOOK.y, FITTING_ROOM_HOOK.z] }),
      parent('fittingRoom', 1, {
        pos: [FITTING_ROOM_HOOK.x, FITTING_ROOM_HOOK.y, FITTING_ROOM_HOOK.z],
      }),
      ...spreadAlongAxis(
        'clothingRack',
        [1, 2],
        false,
        [0, CLOTHING_RACK_BAR_HEIGHT, 0],
        'x',
        HANGERS_INTERVAL,
        5,
        { rotY: HANGER_ANGLE },
      ),
    ],
  },
  hanger2: {
    instances: [
      ...spreadAlongAxis(
        'clothingRack',
        0,
        false,
        [0, CLOTHING_RACK_BAR_HEIGHT, 0],
        'x',
        HANGERS_INTERVAL,
        5,
        { rotY: PI - HANGER_ANGLE },
      ),
    ],
  },
  ...spreadVariationsAlongAxis(
    'clothingRack',
    2,
    false,
    'top',
    [2, 1, 3, 4, 5],
    [0, CLOTHING_RACK_BAR_HEIGHT, 0],
    'x',
    HANGERS_INTERVAL,
    HANGER_ANGLE,
  ),
  ...spreadVariationsAlongAxis(
    'clothingRack',
    1,
    false,
    'top',
    [6, 7, 8, 9, 10],
    [0, CLOTHING_RACK_BAR_HEIGHT, 0],
    'x',
    HANGERS_INTERVAL,
    HANGER_ANGLE,
  ),
  ...spreadVariationsAlongAxis(
    'clothingRack',
    0,
    false,
    'bottom',
    [5, 3, 4, 1, 2],
    [0, CLOTHING_RACK_BAR_HEIGHT, 0],
    'x',
    HANGERS_INTERVAL,
    -HANGER_ANGLE,
  ),
  bag1: {
    instances: [
      ...placeLinear(
        'clothingRack',
        2,
        false,
        [0, CLOTHING_RACK_SHELF_HEIGHT, 0],
        'x',
        -1.1,
        0.7,
        2,
        [{ noCollision: true }, { color: COLOR_SETS.BAG_BLUE, noCollision: true }],
      ),
      ...spreadAlongAxis('displayTable2', 0, true, P0, 'z', 0.8, 2, [
        { scale: [1.3, 1.3, 1.3], colors: COLOR_SETS.BAG_CORAL },
        { colors: COLOR_SETS.BAG_NAVY },
      ]),
    ],
  },
  ...spreadVariationsAlongAxis(
    'clothingRack',
    0,
    false,
    'bag',
    [3, 2],
    [0, CLOTHING_RACK_SHELF_HEIGHT, 0],
    'x',
    1.3,
  ),
  bag4: {
    instances: [
      ...placeLinear(
        'clothingRack',
        1,
        false,
        [0, CLOTHING_RACK_SHELF_HEIGHT, 0],
        'x',
        -0.9,
        0.8,
        2,
        [
          { noCollision: true },
          { scale: [0.7, 0.7, 0.7], colors: COLOR_SETS.BAG_WHITE, noCollision: true },
        ],
      ),
      ...spreadAlongAxis('displayTable2', 0, true, [-1, 0, 0], 'z', 0.8, 2, [
        { scale: [1.2, 1.2, 1.2], colors: COLOR_SETS.BAG_WHITE },
        { colors: COLOR_SETS.BAG_GREEN },
      ]),
    ],
  },
  shoes1: {
    instances: [
      ...placeLinear(
        'clothingRack',
        2,
        false,
        [0, CLOTHING_RACK_SHELF_HEIGHT, 0],
        'x',
        0.4,
        0.7,
        2,
        [{ noCollision: true }, { color: COLORS.SHOES_RED, noCollision: true }],
      ),
      onTop('displayTable2', 0, { pos: [1, 0, 0.4], color: COLORS.SHOES_BLUE }),
    ],
  },
  shoes2: {
    instances: [
      parent('clothingRack', 1, { pos: [0.9, CLOTHING_RACK_SHELF_HEIGHT, 0], noCollision: true }),
      onTop('displayTable2', 0, { pos: [1, 0, -0.4], color: COLORS.SHOES_ORANGE }),
    ],
  },
  ...arrangeVariationsInGrid(
    'displayTable2',
    1,
    true,
    'foldedTopStack',
    [1, 2, 3, 4, 5, 6],
    3,
    P0,
    1,
    1,
  ),
  boutiqueSignboard: parent('boutiqueFloor', 0, { id: 0, pos: [-2, 0, FLOOR_SZ_Z * 0.5 + 1] }),

  // Ice cream shop
  counter2: onTop('iceCreamShopFloor', 0, { id: 0, pos: [0, 0, -3.5] }),
  iceCreamCupStacks: onTop('counter2', 0, { pos: [-4.6, 0, -1.5], rotY: HALF_PI }),
  iceCreamConeStacks: onTop('counter2', 0, { pos: [-5.4, 0, -1.5], rotY: -HALF_PI }),
  spoonHolder: onTop('counter2', 0, { pos: [-4.6, 0, -0.4] }),
  iceCreamShopRegister: onTop('counter2', 0, { pos: [-3.3, 0, -0.5] }),
  counter3: onTop('iceCreamShopFloor', 0, { id: 0, pos: [0, 0, 4] }),
  iceCreamSizeGuide: onTop('counter3', 0, { pos: [-0.8, 0, 0] }),
  kiosk: onTop('counter3', 0, { pos: [0.95, 0, 0] }),
  table4: {
    instances: [
      ...spreadAlongAxis('iceCreamShopFloor', 0, true, [0, 0, 1.5], 'x', 13.5, 2, { id: 0 }),
    ],
  },
  chair2: {
    instances: [
      ...placeChairsAroundTable(
        'table4',
        [0, 1],
        [
          [0, 1, 0, 1],
          [1, 0, 0, 1],
        ],
        { offset: CHAIR_OFFSET - 0.1 },
      ),
    ],
  },
  trashBin2: {
    instances: [
      ...spreadAlongAxis('iceCreamShopFloor', 0, true, [0, 0, 7], 'x', 15, 2, [
        { rotY: HALF_PI },
        { rotY: -HALF_PI },
      ]),
    ],
  },
  iceCreamStatue: parent('iceCreamShopFloor', 0, {
    pos: [-3.5, 0, FLOOR_SZ_Z * 0.5 + 1],
  }),
  iceCreamShopSignboard: parent('iceCreamShopFloor', 0, {
    id: 0,
    pos: [-2, 0, FLOOR_SZ_Z * 0.5 + 1],
  }),

  // Pizzeria
  pizzaOven: onTop('pizzeriaFloor', 0, { id: 0, pos: [-6, 0, -6.5] }),
  counter4: {
    instances: [
      ...placeLinear('pizzeriaFloor', 0, true, [1.5, 0, 0], 'z', -7.5, 3.5, 2, [
        { id: 0, noInteraction: true },
        { id: 1 },
      ]),
    ],
  },
  pizzeriaRegister: onTop('counter4', 1, { pos: [-2.5, 0, 0] }),
  pizzaBoard: {
    instances: [...spreadAlongAxis('counter4', 1, true, [1.2, 0, -0.08], 'x', 1.2, 3, { id: 0 })],
  },
  ...placeVariationsOnParents('pizzaBoard', [0, 1, 2], true, 'pizza', [1, 2, 3]),
  ...placeVariationsOnParents('pizzaBoard', [0, 1, 2], false, 'pizzaTag', [1, 2, 3], {
    pos: [0, 0, 0.6],
  }),
  pizza4: parent('pizzaOven', 0, { pos: [0, 1.1, 0.4] }),
  pizzaBoardStack: onTop('counter4', 0, { pos: [-2.7, 0, 0] }),
  rollingPin: onTop('counter4', 0, { pos: [-1.8, 0, 0], rotY: HALF_PI }),
  pizzaCutter: onTop('counter4', 0, { pos: [-1.4, 0, 0], rotY: -HALF_PI }),
  plateStack: {
    instances: [
      parent('cafe', 0, { pos: [2.35, CAFE_COUNTER_HEIGHT, -2.2] }),
      onTop('counter4', 0, { pos: [-0.6, 0, 0] }),
    ],
  },
  cupStacks2: onTop('counter4', 0, { pos: [0.4, 0, 0] }),
  sodaMachine: onTop('counter4', 0, { pos: [2.1, 0, 0] }),
  pizzaBoxStacks: onTop('pizzeriaFloor', 0, { pos: [6.5, 0, -7.5] }),
  table5: {
    instances: [...arrangeInGrid('pizzeriaFloor', 0, true, 2, 2, [0, 0, 2], 10, 3.5, { id: 0 })],
  },
  chair3: { instances: [...placeChairsAroundTable('table5', [0, 1, 2, 3], [1, 0, 1, 0])] },
  redPepperFlakes: {
    instances: [
      onTop('table5', 1, { pos: [0.12, 0, 0], rotY: TAU_DIV_60 }),
      onTop('table5', 2, { pos: [-0.12, 0, 0], rotY: -TAU_DIV_12 }),
      onTop('table5', 3, { pos: [0.12, 0, 0] }),
    ],
  },
  parmesan: {
    instances: [
      onTop('table5', 0, { pos: [-0.12, 0, 0] }),
      onTop('table5', 1, { pos: [-0.12, 0, 0], rotY: -TAU_DIV_12 }),
      onTop('table5', 2, { pos: [0.12, 0, 0], rotY: TAU_DIV_60 }),
    ],
  },
  hotSauce: {
    instances: [
      onTop('table5', 0, { pos: [0.12, 0, 0], rotY: TAU_DIV_6 }),
      onTop('table5', 3, { pos: [-0.12, 0, 0], rotY: -TAU_DIV_12 }),
    ],
  },
  trashBin3: {
    instances: [
      ...spreadAlongAxis('pizzeriaFloor', 0, true, [0, 0, 7], 'x', 15, 2, [
        { rotY: HALF_PI },
        { rotY: -HALF_PI },
      ]),
    ],
  },
  pizzeriaSignboard: parent('pizzeriaFloor', 0, { id: 0, pos: [-2, 0, FLOOR_SZ_Z * 0.5 + 1] }),

  plate: { instances: [] },

  ...ITEM_MODELS_CONFIG,
}

// prettier-ignore
const GRASS_X_ALIGNED = [
  [-26, -21], [-21, -22], [-19.5, -25], [-16.5, -20.5], [-13, -25], [-10, 35], [-9, 8],
  [-8, -22.5], [-6.5, -29], [-6, -16.5], [-5.5, -1], [-3.5, 34], [-2.5, -34.5], [-2, 3],
  [0, -8], [0.5, 10.5], [2, 36], [3.5, 6.5], [4, -33.5], [8, -9], [8, 34.5],
  [9.5, 1], [10.5, -34], [16, -18], [18.5, -25], [22.5, 16.5], [24, 24],
]

// prettier-ignore
const GRASS_Z_ALIGNED = [
  [-35, 9], [-34.5, 0.5], [-33.5, -6.5], [-31, 4], [-23, 20], [-21.5, 28.5], [-21, 23],
  [-20, 16], [-18, 5], [21, -13.5], [25, -16.5], [27, 13], [31.5, -11.5], [34, 1.5],
  [34.5, 8.5], [35, -5],
]

const PLANT_MODELS_CONFIG = {
  tree: {
    isTree: true,
    instances: [
      { pos: [-2, 0, -1] },
      { pos: [-26, 0, 22], rotY: HALF_PI },
      { pos: [-23, 0, 26], rotY: TAU_DIV_6 },
    ],
  },
  tree2: {
    isTree: true,
    instances: [
      { pos: [-23, 0, -25], scale: [1, 1.05, 1] },
      { pos: [-21, 0, -26.5], scale: [1, 1.2, 1] },
      { pos: [-19, 0, -28] },
      { pos: [18, 0, -27] },
      { pos: [25, 0, 18] },
      { pos: [26, 0, 23], scale: [1, 1.05, 1] },
      { pos: [30, 0, 16], scale: [1, 1.1, 1] },
    ],
  },
  flower: {
    receiveShadow: false,
    instances: [
      parent('signboard', 0, {
        pos: [-1.2, 0, 0.8],
        color: FLOWER.YELLOW,
        cluster: { a: -TAU_DIV_12 },
      }),
      parent('directionalSignpost', 0, {
        pos: [0.5, 0, 0.5],
        color: FLOWER.WHITE,
        cluster: { c: 2, a: -TAU_DIV_12 },
      }),
      parent('boutiqueSignboard', 0, { pos: [-1, 0, 0], color: FLOWER.ORANGE }),
      parent('boutiqueSignboard', 0, {
        pos: [1, 0, -0.1],
        color: FLOWER.ORANGE,
        cluster: { c: 2, r: 0.25, a: TAU_DIV_6 },
      }),
      parent('iceCreamShopSignboard', 0, {
        pos: [1, 0, -0.1],
        color: FLOWER.WHITE,
        cluster: { c: 2, r: 0.25, a: -TAU_DIV_6 },
      }),
      parent('pizzeriaSignboard', 0, {
        pos: [-1, 0, -0.1],
        color: FLOWER.RED,
        cluster: { c: 2, r: 0.25, a: -TAU_DIV_6 },
      }),
      parent('pizzeriaSignboard', 0, { pos: [1, 0, 0], color: FLOWER.RED }),
      parent('mailbox', 0, { pos: [0.5, 0, 0.5], color: FLOWER.PURPLE }),
      parent('mailbox', 0, {
        pos: [-0.65, 0, 0.5],
        color: FLOWER.PURPLE,
        cluster: { c: 2, a: -TAU_DIV_12 },
      }),
      parent('treeStump', 0, {
        pos: [-1, 0, 0.2],
        color: FLOWER.YELLOW,
        cluster: { c: 2, a: TAU_DIV_6 },
      }),
      parent('treeStump', 2, {
        pos: [0, 0, -1],
        color: FLOWER.PURPLE,
        cluster: { c: 2, a: TAU_DIV_60 },
      }),
      parent('treeStump', 3, {
        pos: [-1, 0, 0.2],
        color: FLOWER.RED,
        cluster: { c: 2, a: -TAU_DIV_6 },
      }),

      // Center
      { pos: [-8.5, 0, -1.5], color: FLOWER.PINK, cluster: { a: -TAU_DIV_24 } },
      { pos: [-6, 0, -9], color: FLOWER.ORANGE, cluster: { a: TAU_DIV_24 } },
      { pos: [-1.5, 0, 7], color: FLOWER.WHITE, cluster: { c: 2, a: -TAU_DIV_36 } },
      { pos: [2, 0, -4.5], color: FLOWER.YELLOW, cluster: { c: 2, a: -TAU_DIV_60 } },
      { pos: [2.5, 0, 9], color: FLOWER.YELLOW, cluster: { a: QUARTER_PI } },
      { pos: [5, 0, -7], color: FLOWER.PINK, cluster: { a: PI + QUARTER_PI } },
      { pos: [7, 0, -0.5], color: FLOWER.RED, cluster: { c: 2, a: TAU_DIV_36 } },

      // +X+Z
      { pos: [1, 0, 20], color: FLOWER.WHITE, cluster: { c: 2, a: TAU_DIV_24 } },
      { pos: [19.5, 0, 11.5], color: FLOWER.RED, cluster: { c: 2, a: TAU_DIV_6 } },
      { pos: [22, 0, 21], color: FLOWER.ORANGE, cluster: { a: TAU_DIV_24 } },
      { pos: [25, 0, 14], color: FLOWER.PINK, cluster: { a: QUARTER_PI } },
      { pos: [28.5, 0, 18.5], color: FLOWER.YELLOW, cluster: { a: -QUARTER_PI } },
      { pos: [30, 0, 12], color: FLOWER.PURPLE, cluster: { c: 2, a: HALF_PI + TAU_DIV_36 } },

      // +X-Z
      { pos: [16.5, 0, -25.5], color: FLOWER.WHITE, cluster: { c: 2, a: TAU_DIV_12 } },
      { pos: [17, 0, -11], color: FLOWER.PURPLE, cluster: { c: 2, a: TAU_DIV_24 - HALF_PI } },
      { pos: [19, 0, -16.5], color: FLOWER.PINK, cluster: { a: TAU_DIV_24 } },
      { pos: [21.5, 0, -23.5], color: FLOWER.RED, cluster: { c: 2, a: -TAU_DIV_24 } },
      { pos: [25.5, 0, -12], color: FLOWER.YELLOW, cluster: { a: QUARTER_PI } },
      { pos: [27.5, 0, -19], color: FLOWER.WHITE, cluster: { c: 2, a: HALF_PI + TAU_DIV_24 } },

      // -X-Z
      { pos: [-12, 0, -20], color: FLOWER.YELLOW, cluster: { a: -QUARTER_PI } },
      { pos: [-10, 0, -26], color: FLOWER.PINK, cluster: { a: QUARTER_PI } },
      { pos: [-8, 0, -15], color: FLOWER.PURPLE, cluster: { c: 2, a: -TAU_DIV_24 } },
      { pos: [-5.5, 0, -21.5], color: FLOWER.WHITE, cluster: { c: 2, a: TAU_DIV_6 } },

      // -X+Z
      { pos: [-27.5, 0, 5], color: FLOWER.PINK, cluster: { c: 2, a: TAU_DIV_6 } },
      { pos: [-27, 0, 18.5], color: FLOWER.YELLOW, cluster: { c: 2, a: TAU_DIV_12 } },
      { pos: [-24, 0, 24], color: FLOWER.ORANGE, cluster: { a: -QUARTER_PI } },
      { pos: [-23, 0, 15], color: FLOWER.PINK, cluster: {} },
      { pos: [-20, 0, 27], color: FLOWER.YELLOW, cluster: { c: 2, a: TAU_DIV_6 } },
      { pos: [-18, 0, 12], color: FLOWER.ORANGE, cluster: { c: 2, a: HALF_PI + TAU_DIV_36 } },
    ],
  },
  flower2: {
    receiveShadow: false,
    instances: [
      parent('signboard', 0, { pos: [2, 0, 0], color: FLOWER.PINK, cluster: { a: TAU_DIV_12 } }),
      { pos: [-23.5, 0, -23.5], color: FLOWER.WHITE, cluster: { c: 2, a: TAU_DIV_12 } },
      { pos: [-18, 0, -26], color: FLOWER.WHITE, cluster: { a: TAU_DIV_12 } },
    ],
  },
  grass: {
    syncShadows: false,
    instances: [
      parent('treeStump', 0, { pos: [0.7, 0, -0.7] }),
      ...GRASS_X_ALIGNED.map(([x, z]) => ({ pos: [x, 0, z] })),
      ...GRASS_Z_ALIGNED.map(([x, z]) => ({ pos: [x, 0, z], rotY: HALF_PI })),
    ],
  },
  grass2: {
    instances: [
      parent('mailbox', 0, { pos: [0, 0, 0.3], rotY: HALF_PI }),
      parent('treeStump', 1, { pos: [0.4, 0, 0.7] }),
      { pos: [-23.5, 0, 13], rotY: HALF_PI },
      { pos: [-11.5, 0, -34.5], rotY: TAU_DIV_24 },
      { pos: [-7, 0, 3.5] },
      { pos: [-3, 0, -5.5] },
      { pos: [5, 0, -2] },
      { pos: [8, 0, 8] },
    ],
  },
}

const MODELS_CONFIG = {
  ...ANIMATED_MODELS_CONFIG,
  ...STATIC_MODELS_CONFIG,
  ...PLANT_MODELS_CONFIG,
}

// Videos
const VIDEOS_CONFIG = { tv: {} }

// Loading progress
const BGM_COUNT = 1
const TOTAL_ASSET_COUNT =
  GLTF_FILES.length + keyCount(TEXTURES_CONFIG) + keyCount(VIDEOS_CONFIG) + BGM_COUNT
const SETUP_MILESTONE_COUNT = 5

const BYTE_BASED_WEIGHTS = {
  models: 0.35,
  player: 0.15,
  bgm: 0.15,
}

const BYTE_BASED_FILES = Object.keys(BYTE_BASED_WEIGHTS)

const COUNT_BASED_TOTAL_WEIGHT =
  1 - Object.values(BYTE_BASED_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
const COUNT_BASED_STEP_COUNT = TOTAL_ASSET_COUNT - BYTE_BASED_FILES.length + SETUP_MILESTONE_COUNT
const COUNT_BASED_STEP_WEIGHT = COUNT_BASED_TOTAL_WEIGHT / COUNT_BASED_STEP_COUNT

// ----------------------------------------------------------------------------------------------------
// Config helpers
// ----------------------------------------------------------------------------------------------------
function parent(name, id, extra = {}) {
  return { parent: { name, id }, ...extra }
}

function onTop(name, id, extra = {}) {
  return parent(name, id, { attach: 'top', ...extra })
}

function placeOnParents(name, ids, isOnTop, extra = {}) {
  const placeFn = isOnTop ? onTop : parent

  return ids.map((id) => placeFn(name, id, extra))
}

function placeVariationsOnParents(name, ids, isOnTop, prefix, variationIds, extra = {}) {
  if (ids.length !== variationIds.length) fail('ids and variationIds lengths should match.')

  const placeFn = isOnTop ? onTop : parent

  return Object.fromEntries(
    ids.map((id, i) => [`${prefix}${variationIds[i]}`, placeFn(name, id, extra)]),
  )
}

function placeChairsAroundTable(name, idOrIds, chairPlacements, options = {}) {
  const { colors, offset = CHAIR_OFFSET } = options
  const clrs = colors ? { colors } : {}

  const slots = [
    { pos: [-offset, 0, 0], rotY: HALF_PI },
    { pos: [0, 0, -offset], rotY: 0 },
    { pos: [offset, 0, 0], rotY: -HALF_PI },
    { pos: [0, 0, offset], rotY: PI },
  ]

  const ids = toArr(idOrIds)
  const placements = toNestedArr(chairPlacements)

  return ids.flatMap((id, idx) => {
    const ps = placements[idx] ?? placements[0]

    return slots.flatMap((slot, i) => (ps[i] === 1 ? [parent(name, id, { ...slot, ...clrs })] : []))
  })
}

function placeLinear(name, idOrIds, isOnTop, basePos, axis, start, interval, count, options = {}) {
  const placeFn = isOnTop ? onTop : parent
  const ids = toArr(idOrIds)
  const axisIdx = AXIS_INDEX[axis]
  const baseId = options.id
  const isOptionsArray = Array.isArray(options)

  return ids.flatMap((id, idx) =>
    Array.from({ length: count }, (_, i) => {
      const pos = [...basePos]
      pos[axisIdx] = start + interval * i

      const resolvedOptions = isOptionsArray ? (options[i] ?? options[0]) : options

      return placeFn(name, id, {
        pos,
        ...resolvedOptions,
        ...(baseId !== undefined && { id: baseId + idx * count + i }),
      })
    }),
  )
}

function getStart(midPos, axis, interval, count) {
  return midPos[AXIS_INDEX[axis]] - (count - 1) * interval * 0.5
}

function spreadAlongAxis(name, idOrIds, isOnTop, midPos, axis, interval, count, options = {}) {
  const start = getStart(midPos, axis, interval, count)

  return placeLinear(name, idOrIds, isOnTop, midPos, axis, start, interval, count, options)
}

function placeAlongAxis(
  name,
  idOrIds,
  isOnTop,
  basePos,
  axis,
  start,
  end,
  slotCount,
  includeEnds,
  options = {},
) {
  const interval = (end - start) / (slotCount - 1)
  const first = start + (includeEnds ? 0 : interval)
  const count = slotCount - (includeEnds ? 0 : 2)

  return placeLinear(name, idOrIds, isOnTop, basePos, axis, first, interval, count, options)
}

function placeFenceRails(name, id, floorSizeX, floorSizeZ, color) {
  const scaleX = floorSizeX - 1
  const scaleZ = floorSizeZ - 1

  const posX = scaleX * 0.5
  const posZ = scaleZ * 0.5

  const clr = color ? { color } : {}

  return [
    onTop(name, id, { pos: [0, 0, -posZ], scale: [scaleX, 1, 1], ...clr }),
    onTop(name, id, { pos: [-posX, 0, 0], rotY: HALF_PI, scale: [scaleZ, 1, 1], ...clr }),
    onTop(name, id, { pos: [posX, 0, 0], rotY: HALF_PI, scale: [scaleZ, 1, 1], ...clr }),
  ]
}

function placeFencePosts(name, id, floorSizeX, floorSizeZ, countX, countZ, color) {
  const posX = (floorSizeX - 1) * 0.5
  const posZ = (floorSizeZ - 1) * 0.5

  const clr = color ? { color } : {}

  return [
    ...placeAlongAxis(name, id, true, [0, 0, -posZ], 'x', -posX, posX, countX, false, clr),
    ...placeAlongAxis(name, id, true, [-posX, 0, 0], 'z', -posZ, posZ, countZ, true, clr),
    ...placeAlongAxis(name, id, true, [posX, 0, 0], 'z', -posZ, posZ, countZ, true, clr),
  ]
}

function arrangeInGrid(
  name,
  idOrIds,
  isOnTop,
  rowCount,
  colCount,
  centerPos,
  intervalX,
  intervalZ,
  options = {},
) {
  const startX = getStart(centerPos, 'x', intervalX, colCount)
  const startZ = getStart(centerPos, 'z', intervalZ, rowCount)
  const baseId = options.id
  const isOptionsArray = Array.isArray(options)

  return Array.from({ length: rowCount }, (_, row) => {
    const basePos = [0, centerPos[1], startZ + row * intervalZ]
    const resolvedOptions = isOptionsArray ? (options[row] ?? options[0]) : options

    if (baseId !== undefined) resolvedOptions.id = baseId + row * colCount

    return placeLinear(
      name,
      idOrIds,
      isOnTop,
      basePos,
      'x',
      startX,
      intervalX,
      colCount,
      resolvedOptions,
    )
  }).flat()
}

function placeVariationsLinear(
  name,
  id,
  isOnTop,
  prefix,
  ids,
  basePos,
  axis,
  start,
  interval,
  rotY,
) {
  const placeFn = isOnTop ? onTop : parent
  const axisIdx = AXIS_INDEX[axis]
  const ry = rotY !== undefined ? { rotY } : {}

  const map = {}

  for (let i = 0; i < ids.length; i++) {
    const pos = [...basePos]
    pos[axisIdx] = start + interval * i

    map[`${prefix}${ids[i]}`] = placeFn(name, id, { pos, ...ry })
  }

  return map
}

function spreadVariationsAlongAxis(name, id, isOnTop, prefix, ids, midPos, axis, interval, rotY) {
  const start = getStart(midPos, axis, interval, ids.length)

  return placeVariationsLinear(name, id, isOnTop, prefix, ids, midPos, axis, start, interval, rotY)
}

function arrangeVariationsInGrid(
  name,
  id,
  isOnTop,
  prefix,
  ids,
  countPerRow,
  centerPos,
  intervalX,
  intervalZ,
  rotY,
) {
  const rowCount = Math.ceil(ids.length / countPerRow)
  const startX = getStart(centerPos, 'x', intervalX, countPerRow)
  const startZ = getStart(centerPos, 'z', intervalZ, rowCount)

  const map = {}

  for (let row = 0; row < rowCount; row++) {
    const startIdx = row * countPerRow
    const idsInRow = ids.slice(startIdx, startIdx + countPerRow)

    const midPos = [...centerPos]
    midPos[2] = startZ + row * intervalZ

    Object.assign(
      map,
      placeVariationsLinear(
        name,
        id,
        isOnTop,
        prefix,
        idsInRow,
        midPos,
        'x',
        startX,
        intervalX,
        rotY,
      ),
    )
  }

  return map
}

function placeItems(name, id, isOnTop, prefix, suffixes, basePos, offset) {
  const placeFn = isOnTop ? onTop : parent
  const map = {}

  for (const suffix of suffixes) {
    const key = `${prefix}${suffix}`
    const basePlacement = placeFn(name, id, { pos: basePos })

    if (!offset) {
      map[key] = basePlacement
      continue
    }

    const pos = [...basePos]
    pos[0] += offset

    map[key] = { instances: [placeFn(name, id, { pos }), basePlacement] }
  }

  return map
}

// ----------------------------------------------------------------------------------------------------
// Loading progress
// ----------------------------------------------------------------------------------------------------
const loader = document.getElementById('loader')
const loaderBtn = loader.querySelector('button')
const loaderCanvas = loaderBtn.querySelector('canvas')
const loaderStartText = loaderBtn.querySelector('p')
const loaderStatusText = loader.querySelector('button + p')

const rect = loaderCanvas.getBoundingClientRect()
const dpr = window.devicePixelRatio ?? 1

const worker = new Worker('/loader.worker.js', { type: 'module' })
const offscreen = loaderCanvas.transferControlToOffscreen()

const byteWeights = fromKeys(BYTE_BASED_FILES)
const fileProgress = fromKeys(BYTE_BASED_FILES, () => 0)

let byteBasedProgress = 0
let completedStepCount = 0

function updateLoadingUI(percent) {
  worker.postMessage({
    type: 'PROGRESS',
    value: percent,
  })
}

function updateProgress() {
  updateLoadingUI(Math.min(byteBasedProgress + completedStepCount * COUNT_BASED_STEP_WEIGHT, 1))
}

function updateByteBasedProgress(file, event) {
  const { lengthComputable, loaded, total } = event

  if (!lengthComputable || total <= 0) return

  byteWeights[file] ??= BYTE_BASED_WEIGHTS[file] / total

  const prev = fileProgress[file]
  const next = loaded * byteWeights[file]

  fileProgress[file] = next
  byteBasedProgress += next - prev

  updateProgress()
}

function getOnProgress(file) {
  if (!Object.hasOwn(BYTE_BASED_WEIGHTS, file)) return undefined

  return (event) => updateByteBasedProgress(file, event)
}

function advanceCountBasedProgress() {
  completedStepCount++
  updateProgress()
}

const advanceSetupProgress = advanceCountBasedProgress

worker.onmessage = async (e) => {
  const { type } = e.data

  switch (type) {
    case 'READY':
      try {
        await bootstrap()
      } catch (err) {
        showStartupFailure('Sorry, something went wrong. Please try again.')

        worker.terminate()
        console.error(err)
      }
      break

    case 'LOADER_COMPLETE':
      finishLoading()
      break
  }
}

worker.postMessage(
  {
    type: 'INIT',
    canvas: offscreen,
    w: rect.width,
    h: rect.height,
    dpr,
  },
  [offscreen],
)

// ----------------------------------------------------------------------------------------------------
// Bootstrap
// ----------------------------------------------------------------------------------------------------
const canPlay = matchMedia('(hover: hover)').matches && matchMedia('(pointer: fine)').matches

function showStartupFailure(text) {
  const failure = loader.querySelector('.startup-failure')

  setDisplayNone(loaderBtn)
  setDisplayNone(loaderStatusText)

  failure.querySelector('p').textContent = text
  addVisible(failure)
}

async function bootstrap() {
  if (!canPlay) {
    showStartupFailure(
      `This game isn't supported on this device.\nPlease play on a desktop or laptop.`,
    )

    worker.terminate()
    return
  }

  initCore()

  await initTextures()
  await initModels()
  await initVideos()
  await initAudio()

  if (DEV.printColors?.length > 0) printColors(DEV.printColors)
  if (DEV.printDimensions?.length > 0) printDimensions(DEV.printDimensions)

  initSky()
  initLights()
  initOcean()
  initTV()

  initPlayer()
  initOutfit()
  initItems()

  initScene()
  initSections()

  initSoundUI()
  initSidePanelUIs()

  initNPCs()
  initButterflies()
  initBoat()

  initAnimations()
  initCamera()

  initKeyboardInput()
  initMouseInput()

  await warmUpRenderer()

  worker.postMessage({ type: 'BOOTSTRAP_COMPLETE' })
}

async function warmUpRenderer() {
  await renderer.compileAsync(scene, camera)
  renderer.render(scene, camera)

  advanceSetupProgress()
}

function startGame() {
  setDisplayNone(loader)
  worker.terminate()
  start()
}

function finishLoading() {
  if (DEV.validateAssets) {
    validateItemMats()
    validateCounterItems()
    validatePlayerItems()
    validateNPC4Items()
  }

  if (DEV.skipStartBtn) return startGame()

  setDisplayNone(loaderStatusText)
  addVisible(loaderStartText)
  removeDisabled(loaderBtn)

  loaderBtn.addEventListener('click', startGame, { once: true })
}

// ----------------------------------------------------------------------------------------------------
// Core setup
// ----------------------------------------------------------------------------------------------------
let scene = null
let camera = null
let renderer = null

function initCore() {
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(SKY_COLOR, FOG_NEAR, FOG_FAR)

  camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR,
  )

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(resolveDPR(window.innerWidth, window.innerHeight))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.id = 'main-canvas'
  document.body.appendChild(renderer.domElement)

  resize()
}

// ----------------------------------------------------------------------------------------------------
// Textures
// ----------------------------------------------------------------------------------------------------
const texLoader = new THREE.TextureLoader()

function loadTexture(name) {
  const url = `/assets/textures/${name}.png`

  return new Promise((resolve, reject) => {
    texLoader.load(url, resolve, undefined, () =>
      reject(new Error(`Failed to load texture: ${name}`)),
    )
  })
}

function disableMipmaps(tex) {
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
}

const textures = {}

async function initTextures() {
  await Promise.all(
    Object.entries(TEXTURES_CONFIG).map(async ([name, config]) => {
      const tex = await loadTexture(name)
      const { repeat, mipmaps, flipY } = config

      tex.colorSpace = THREE.SRGBColorSpace

      if (repeat) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(...repeat)
      }

      if (mipmaps === false) disableMipmaps(tex)

      if (flipY === false) tex.flipY = false

      textures[name] = tex

      advanceCountBasedProgress()
    }),
  )
}

// ----------------------------------------------------------------------------------------------------
// Model loading
// ----------------------------------------------------------------------------------------------------
const gltfLoader = new GLTFLoader()

function processLoadedGLTFFile(gltf) {
  const gltfModels = {}
  let animations = null

  for (const child of gltf.scene.children) {
    const name = child.name

    if (Object.hasOwn(MODELS_CONFIG, name) || name === 'itemMats') {
      gltfModels[name] = child

      if (Object.hasOwn(ANIMATED_MODELS_CONFIG, name)) animations = gltf.animations
    } else {
      console.warn(`Remove from GLTF: ${name}`)
    }
  }

  return { gltfModels, animations }
}

function loadGLTFModels(file) {
  const url = `/assets/models/${file}.glb`

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        try {
          resolve(processLoadedGLTFFile(gltf))
        } catch (err) {
          err.message = `Failed to process GLTF file: ${file}\n${err.message}`
          reject(err)
        }
      },
      getOnProgress(file),
      () => reject(new Error(`Failed to load GLTF file: ${file}`)),
    )
  })
}

// ----------------------------------------------------------------------------------------------------
// Model processing
// ----------------------------------------------------------------------------------------------------
function parseName(name) {
  const parts = getNameParts(name)

  return {
    category: parts[0],
    type: parts[1],
    tag: parts[2],
    boundsType: parts[3],
    idStr: parts[parts.length - 2],
    has: (p) => parts.includes(p),
  }
}

function getLocalBoundingBoxData(node) {
  const geom = node.geometry

  geom.computeBoundingBox()

  const {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  } = geom.boundingBox

  const cX = (minX + maxX) * 0.5
  const cZ = (minZ + maxZ) * 0.5
  const radius = maxX - cX

  return { minX, maxX, minY, maxY, minZ, maxZ, cX, cZ, radius }
}

function extractBounds(node, type, tag) {
  const { minX, maxX, minY, maxY, minZ, maxZ, cX, cZ, radius } = getLocalBoundingBoxData(node)
  const base = {
    type,
    minY,
    maxY,
    ...(tag === 'extended' && { extended: true }),
    ...(tag === 'ceiling' && { oneWay: tag }),
  }

  switch (type) {
    case BOUNDS_TYPES.CIRCLE:
      return { ...base, cX, cZ, radius }

    case BOUNDS_TYPES.AABB:
      return { ...base, minX, maxX, minZ, maxZ }

    default:
      fail('Missing bounds type.')
  }
}

function extractTrigger(node, type) {
  const { minX, maxX, minZ, maxZ, cX, cZ, radius } = getLocalBoundingBoxData(node)

  switch (type) {
    case BOUNDS_TYPES.CIRCLE:
      return { type, cX, cZ, radius }

    case BOUNDS_TYPES.AABB:
      return { type, minX, maxX, minZ, maxZ }

    default:
      fail('Missing trigger type.')
  }
}

function processInteractablePart(
  interactableMap,
  node,
  type,
  role,
  boundsType,
  idStr,
  nodesToRemove,
) {
  const interactable = (interactableMap[type] ??= {
    type,
    anchors: [],
    triggers: [],
    colliders: [],
  })

  switch (role) {
    case INTERACTABLE_PART_ROLES.ANCHOR:
      interactable.anchors.push(node)
      break

    case INTERACTABLE_PART_ROLES.TRIGGER:
      interactable.triggers.push(extractTrigger(node, boundsType))
      nodesToRemove.push(node)
      break

    case INTERACTABLE_PART_ROLES.COLLISION: {
      const id = Number(idStr)

      if (!idStr || !Number.isInteger(id) || id < 0)
        fail(`Invalid interactable collider: ${type} (id: ${idStr})`)

      interactable.colliders[id] = extractBounds(node, boundsType)
      nodesToRemove.push(node)
      break
    }

    default:
      interactable[role] = node
  }
}

function extractLayout(layout, node) {
  const { position, quaternion, scale } = node
  const { maxY, cX, cZ } = getLocalBoundingBoxData(node)

  layout.push({
    position: position.clone(),
    quaternion: quaternion.clone(),
    scale: scale.clone(),
    maxY,
    cX,
    cZ,
  })
}

function cleanAlpha(mat) {
  mat.transparent = false
  mat.alphaTest = 0.9
  mat.depthWrite = true
  mat.needsUpdate = true
}

function configureFire(node) {
  node.material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: FIRE_OPACITY,
    depthWrite: false,
  })

  node.castShadow = false
  node.receiveShadow = false
}

function collectModelData(model, config) {
  const { castShadow = DEFAULT_CAST_SHADOW, receiveShadow = DEFAULT_RECEIVE_SHADOW } = config

  const colliders = []
  const cameraBlockers = []
  const interactableMap = {}
  const nodesToRemove = []

  const leafLayout = []
  const appleLayout = []

  let fire = null
  let faceMaterial = null

  let maxY = 0

  model.traverse((node) => {
    const { name, isMesh, geometry, material } = node
    const { category, type, tag, boundsType, idStr, has } = parseName(name)

    if (!isMesh) {
      if (category === NODE_CATEGORIES.INTERACTABLE && tag === INTERACTABLE_PART_ROLES.ANCHOR)
        processInteractablePart(interactableMap, node, type, tag)

      return
    }

    node.castShadow = castShadow
    node.receiveShadow = receiveShadow

    let includeMaxY = false

    switch (category) {
      case NODE_CATEGORIES.COLLISION:
        colliders.push(extractBounds(node, type, tag))
        nodesToRemove.push(node)
        break

      case NODE_CATEGORIES.BLOCKER:
        cameraBlockers.push(extractBounds(node, type))
        nodesToRemove.push(node)
        break

      case NODE_CATEGORIES.INTERACTABLE:
        processInteractablePart(interactableMap, node, type, tag, boundsType, idStr, nodesToRemove)
        break

      case NODE_CATEGORIES.LEAF_LAYOUT:
        extractLayout(leafLayout, node)
        nodesToRemove.push(node)
        break

      case NODE_CATEGORIES.APPLE_LAYOUT:
        extractLayout(appleLayout, node)
        nodesToRemove.push(node)
        break

      case NODE_CATEGORIES.FACE:
        faceMaterial = material
        break

      case NODE_CATEGORIES.CENTER:
        node.visible = false
        break

      default:
        includeMaxY = true
    }

    if (has('print')) {
      cleanAlpha(material)
      disableMipmaps(material.map)
    }

    if (has('fire')) {
      configureFire(node)

      if (category === NODE_CATEGORIES.FIRE) fire = node
    }

    if (includeMaxY) {
      geometry.computeBoundingBox()
      maxY = Math.max(maxY, geometry.boundingBox.max.y)
    }
  })

  return {
    colliders,
    cameraBlockers,
    interactables: Object.values(interactableMap),
    nodesToRemove,
    leafLayout,
    appleLayout,
    fire,
    faceMaterial,
    maxY,
  }
}

const faceMaterials = []

function processModel(model, config) {
  const {
    colliders,
    cameraBlockers,
    interactables,
    nodesToRemove,
    leafLayout,
    appleLayout,
    fire,
    faceMaterial,
    maxY,
  } = collectModelData(model, config)

  if (colliders.length > 0) config.colliders = colliders
  if (cameraBlockers.length > 0) config.cameraBlockers = cameraBlockers
  if (interactables.length > 0) config.interactables = interactables

  for (const node of nodesToRemove) {
    node.parent.remove(node)
    node.geometry.dispose()
  }

  if (leafLayout.length > 0) config.leafLayout = leafLayout
  if (appleLayout.length > 0) config.appleLayout = appleLayout

  if (fire) config.fire = fire
  if (faceMaterial) faceMaterials.push(faceMaterial)

  config.maxY = maxY
}

// ----------------------------------------------------------------------------------------------------
// Models
// ----------------------------------------------------------------------------------------------------
const models = {}
const animationClips = {}

async function initModels() {
  await Promise.all(
    GLTF_FILES.map(async (file) => {
      const { gltfModels, animations } = await loadGLTFModels(file)

      Object.assign(models, gltfModels)

      if (animations) {
        for (const name in gltfModels) {
          animationClips[name] = animations
        }
      }

      if (!Object.hasOwn(BYTE_BASED_WEIGHTS, file)) advanceCountBasedProgress()
    }),
  )

  for (const [name, config] of Object.entries(MODELS_CONFIG)) {
    const model = models[name]

    if (!model) fail(`Missing model: ${name}`)

    processModel(model, config)
  }

  advanceSetupProgress()
}

// ----------------------------------------------------------------------------------------------------
// Videos
// ----------------------------------------------------------------------------------------------------
const videos = {}
const videoTextures = {}

async function initVideos() {
  await Promise.all(
    Object.entries(VIDEOS_CONFIG).map(([name, config]) => {
      const url = `/assets/videos/${name}.mp4`
      const { autoplay = true, loop = true } = config
      const video = document.createElement('video')

      video.crossOrigin = 'anonymous'
      video.loop = loop
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'

      const tex = new THREE.VideoTexture(video)

      tex.colorSpace = THREE.SRGBColorSpace
      tex.flipY = false

      disableMipmaps(tex)

      return new Promise((resolve, reject) => {
        video.addEventListener(
          'canplay',
          () => {
            if (autoplay) void video.play()

            videos[name] = video
            videoTextures[name] = tex

            advanceCountBasedProgress()
            resolve()
          },
          { once: true },
        )

        video.addEventListener('error', () => reject(new Error(`Failed to load video: ${name}`)), {
          once: true,
        })

        video.src = url
      })
    }),
  )
}

// ----------------------------------------------------------------------------------------------------
// Audio
// ----------------------------------------------------------------------------------------------------
let bgm = null

async function initAudio() {
  const listener = new THREE.AudioListener()

  camera.add(listener)

  const audioLoader = new THREE.AudioLoader()
  const buffer = await audioLoader.loadAsync(`./assets/audio/bgm.ogg`, getOnProgress('bgm'))

  bgm = new THREE.Audio(listener).setBuffer(buffer).setLoop(true)
}

// ----------------------------------------------------------------------------------------------------
// Sky
// ----------------------------------------------------------------------------------------------------
let sky = null

function initSky() {
  const skyGeo = new THREE.SphereGeometry(SKY_RADIUS, SKY_W_SEG, SKY_H_SEG)
  const skyMat = new THREE.MeshBasicMaterial({
    map: textures.sky,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
  })

  sky = new THREE.Mesh(skyGeo, skyMat)
  sky.renderOrder = -999
  sky.frustumCulled = false

  scene.add(sky)
}

// ----------------------------------------------------------------------------------------------------
// Lights
// ----------------------------------------------------------------------------------------------------
const lights = []

function initLights() {
  const { sun: sunCfg, fill: fillCfg } = LIGHTS

  const sun = new THREE.DirectionalLight(sunCfg.color, sunCfg.intensity)
  const shadow = sun.shadow
  const shadowCam = shadow.camera

  sun.castShadow = true
  shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)

  shadowCam.near = SHADOW_NEAR
  shadowCam.far = SHADOW_FAR

  shadowCam.left = shadowCam.bottom = -SHADOW_HALF_SIZE
  shadowCam.right = shadowCam.top = SHADOW_HALF_SIZE

  shadow.bias = SHADOW_BIAS
  shadow.normalBias = SHADOW_NORMAL_BIAS

  const fill = new THREE.DirectionalLight(fillCfg.color, fillCfg.intensity)
  fill.castShadow = false

  lights.push({ ref: sun, offset: sunCfg.offset }, { ref: fill, offset: fillCfg.offset })

  scene.add(
    sun,
    sun.target,
    fill,
    fill.target,
    new THREE.HemisphereLight(HEMI_SKY_COLOR, HEMI_GROUND_COLOR, HEMI_INTENSITY),
    new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY),
  )
}

// ----------------------------------------------------------------------------------------------------
// Ocean
// ----------------------------------------------------------------------------------------------------
let ocean = null
let oceanTex = null

function initOcean() {
  oceanTex = textures.ocean

  const oceanMat = new THREE.MeshToonMaterial({
    map: oceanTex,
    color: OCEAN_COLOR,
  })

  ocean = new THREE.Mesh(new THREE.CircleGeometry(OCEAN_RADIUS, OCEAN_SEGMENTS), oceanMat)
  ocean.rotation.x = -HALF_PI
  ocean.position.y = OCEAN_Y

  scene.add(ocean)
}

// ----------------------------------------------------------------------------------------------------
// TV
// ----------------------------------------------------------------------------------------------------
let tvVideo = null
let tvTex = null

function initTV() {
  tvVideo = videos.tv
  tvTex = videoTextures.tv
}

// ----------------------------------------------------------------------------------------------------
// Player
// ----------------------------------------------------------------------------------------------------
const animatedModels = []

let player = null

function initPlayer() {
  player = models.player
  player.onGround = true
  player.onExtended = false
  player.position.set(...PLAYER_START_POS)

  animatedModels.push({
    name: 'player',
    model: player,
    clipKey: 'player',
    anims: Object.values(PLAYER_ANIMS),
    default: ANIMS.GREET,
    split: true,
  })

  if (DEV.restoreLastState) restoreLastState()

  scene.add(player)
}

// ----------------------------------------------------------------------------------------------------
// Outfit
// ----------------------------------------------------------------------------------------------------
const outfit = {}
const outfitIds = new Array(OUTFIT_CONFIG.length).fill(0)

function resetMapOffset(mesh) {
  mesh.material.map.offset.set(0, 0)
}

function setDefaultOutfit(reset = false) {
  const { hat, hairTies } = outfit

  hat.visible = false
  hairTies.visible = true

  if (reset) {
    for (const o of Object.values(outfit)) {
      resetMapOffset(o)
    }

    outfitIds.fill(0)
    localStorage.removeItem(OUTFIT_KEY)
  }
}

function isValidOutfit(savedOutfit) {
  if (!Array.isArray(savedOutfit)) return false
  if (savedOutfit.length !== OUTFIT_CONFIG.length) return false

  return savedOutfit.every((val, i) => {
    return Number.isInteger(val) && val >= 0 && val < OUTFIT_CONFIG[i].count
  })
}

function setOutfitPart(cfg, idx, id, save = false) {
  const { part, colCount, uvStep } = cfg

  const row = Math.floor(id / colCount)
  const col = id % colCount

  outfit[part].material.map.offset.set(col * uvStep, row * uvStep)
  outfitIds[idx] = id

  if (part === 'hat') {
    const { hat, hairTies } = outfit
    const hasHat = id !== 0

    hat.visible = hasHat
    hairTies.visible = !hasHat
  }

  if (save) localStorage.setItem(OUTFIT_KEY, JSON.stringify(outfitIds))
}

function setOutfit(savedOutfit) {
  for (const [idx, cfg] of OUTFIT_CONFIG.entries()) {
    setOutfitPart(cfg, idx, savedOutfit[idx])
  }
}

function restoreOutfit() {
  const saved = localStorage.getItem(OUTFIT_KEY)

  outfit.skirtSit.visible = false
  outfit.skirtSitFloor.visible = false

  if (!saved) return setDefaultOutfit()

  const savedOutfit = JSON.parse(saved)

  if (!isValidOutfit(savedOutfit)) return setDefaultOutfit()

  setOutfit(savedOutfit)
}

function initOutfit() {
  for (const part of OUTFIT_MESH_PARTS) {
    outfit[part] = player.getObjectByName(part)
  }

  restoreOutfit()
}

// ----------------------------------------------------------------------------------------------------
// Items
// ----------------------------------------------------------------------------------------------------
const itemMats = {}

function initItemMats() {
  const getMatKey = (name) => getNameParts(name).slice(1, -1).join('_')

  for (const { name, material } of models.itemMats.children) {
    itemMats[getMatKey(name)] = material
  }
}

function initCounterItemModels() {
  for (const [n, config] of Object.entries(ITEM_MODELS_CONFIG)) {
    const model = models[n]
    const mats = []

    const getMatKey = (parts) => parts.slice(2, -1).join('_')

    for (const child of model.children) {
      const name = child.name
      const parts = getNameParts(name)

      if (parts[0] !== 'item') continue

      switch (parts[1]) {
        case 'initMat':
          child.material = itemMats[getMatKey(parts)]
          break

        case 'mat':
          if (parts[2] === 'flavor') mats[parts[3]] = { prefix: 'flavor_', name }
          else mats.push({ prefix: getMatKey(parts) + '_', name })
          break
      }
    }

    model.visible = false
    config.mats = mats
  }
}

function processPlayerItemMat(type, mats, child, matStr) {
  switch (type) {
    case 'initMat':
      child.material = itemMats[matStr]
      break

    case 'mat':
      mats.push({ mesh: child, matStr })
      break

    case 'matIdx': {
      const [matIdx, ...parts] = getNameParts(matStr)

      mats[matIdx] = { mesh: child, matStr: parts.join('_') }

      break
    }
  }
}

const playerItems = {}

function initPlayerItems() {
  for (const child of models.player.children) {
    const name = child.name

    if (!name.startsWith('item')) continue

    const [, holdId, eatId, hand, shop, idx, start, end, type, ...rest] = getNameParts(name)
    const matStr = rest.join('_')
    const isDrink = matStr.includes('drink')

    let entries = [{ shop, idx, start, end, matStr }]

    if (idx.includes('-')) {
      const [shops, idxs, starts, ends, matStrs] = [shop, idx, start, end, matStr].map((n) =>
        getNameParts(n, '-'),
      )

      entries = shops.map((shop, i) => ({
        shop,
        idx: idxs[i],
        start: starts[i],
        end: ends[i],
        matStr: matStrs[i],
      }))
    }

    for (const { shop, idx, start, end, matStr } of entries) {
      for (let id = start; id <= end; id++) {
        const key = `${shop}_${idx}_${id}`
        const item = (playerItems[key] ??= {})
        const handItem = (item[hand] ??= { meshes: [], mats: [] })

        if (holdId) item.hold = `Hold${holdId}`
        if (eatId) item.eat = `Eat${eatId}`

        item.isDrink ||= isDrink

        handItem.meshes.push(child)

        processPlayerItemMat(type, handItem.mats, child, matStr)
      }
    }

    child.visible = false
  }
}

const npc4Items = []

function initNPC4Items() {
  for (const child of models.npc4.children) {
    const name = child.name

    if (!name.startsWith('item')) continue

    const [, scoopStart, scoopEnd, matIdx, ...rest] = getNameParts(name)
    const prefix = rest.join('_')

    for (let s = scoopStart; s <= scoopEnd; s++) {
      ;(npc4Items[s] ??= [])[matIdx] = { mesh: child, prefix }
    }

    child.frustumCulled = false
    child.visible = false
  }
}

function initItems() {
  initItemMats()
  initCounterItemModels()
  initPlayerItems()
  initNPC4Items()
}

// ----------------------------------------------------------------------------------------------------
// Item validations
// ----------------------------------------------------------------------------------------------------
function validateItemMats() {
  let total = 0

  for (const { prefix, count } of ITEM_MAT_SPECS) {
    for (let i = 0; i < count; i++) {
      const key = `${prefix}_${i}`

      if (!itemMats[key]) fail(`Missing item mat: ${key}`)
    }

    total += count
  }

  if (total !== keyCount(itemMats)) console.warn('Unused item mats exist.')

  console.log('✅ Validated item mats.')
}

function validateCounterItems() {
  for (const { prefix, count = 1, fixed = false } of ITEM_SPECS) {
    for (let id = 0; id < count; id++) {
      const key = count === 1 ? prefix : `${prefix}_${id}`
      let item = counterItems[key]

      if (!item) fail(`Missing item: ${key}`)

      const isArray = Array.isArray(item)

      if (fixed ? isArray : item.length !== 2) fail(`Invalid item placements: ${key}`)

      if (fixed) item = [item]

      for (const { mats } of item) {
        for (const { prefix } of mats) {
          if (prefix === 'flavor_') continue

          const matKey = `${prefix}${id}`

          if (!itemMats[matKey]) fail(`Invalid item mat key: ${matKey} (prefix: ${prefix})`)
        }
      }
    }
  }

  console.log('✅ Validated counter items.')
}

function validatePlayerItems() {
  const playerAnims = Object.values(PLAYER_ANIMS)

  for (const { prefix, count, e = false, isDrink = false } of PLAYER_ITEM_SPECS) {
    for (let id = 0; id < count; id++) {
      const key = `${prefix}_${id}`
      const item = playerItems[key]

      if (!item) fail(`Missing player item: ${key}`)

      const { hold, eat, isDrink: drink } = item

      if (isDrink !== drink) fail(`Wrong drink flag: ${key}`)

      if (!hold) fail(`Missing hold animation: ${key}`)
      if (!playerAnims.includes(hold)) fail(`Invalid hold animation: ${hold} (${key})`)

      if (!eat) fail(`Missing eat animation: ${key}`)
      if (!playerAnims.includes(eat)) fail(`Invalid eat animation: ${eat} (${key})`)

      const handKeys = ['l', 'r'].flatMap((h) => (e ? [h, h + 'e'] : [h]))

      for (const handKey of handKeys) {
        const handItem = item[handKey]

        if (!handItem) fail(`Missing player item: ${key} (${handKey})`)

        for (const { matStr } of handItem.mats) {
          if (matStr === 'flavor_') continue

          const matKey = matStr + (matStr.endsWith('_') ? id : '')

          if (!itemMats[matKey]) fail(`Invalid player item mat key: ${matKey} (str: ${matStr})`)
        }
      }

      const unusedHandKeys = HAND_KEYS.filter((key) => !handKeys.includes(key))

      for (const unusedHandKey of unusedHandKeys) {
        if (Object.hasOwn(item, unusedHandKey))
          fail(`Unused player item: ${key} (${unusedHandKey})`)
      }
    }
  }

  console.log('✅ Validated player items.')
}

function validateNPC4Items() {
  const { scoopCount, coneFlavorCount } = NPC4_ITEM_SPECS

  for (let s = 0; s < scoopCount; s++) {
    const item = npc4Items[s]

    if (!item) fail(`Missing npc4 item: ${s}`)

    for (let i = 0; i < s + 2; i++) {
      const entry = item[i]

      if (!entry) fail(`Missing npc4 item entry: ${s} [${i}]`)

      const prefix = entry.prefix

      if (prefix === 'flavor_') continue

      for (let f = 0; f < coneFlavorCount; f++) {
        const matKey = `${prefix}${f}`

        if (!itemMats[matKey]) fail(`Invalid npc4 item mat key: ${matKey} (prefix: ${prefix})`)
      }
    }
  }

  console.log('✅ Validated npc4 items.')
}

// ----------------------------------------------------------------------------------------------------
// Bounds
// ----------------------------------------------------------------------------------------------------
const worldColliders = []
const worldCameraBlockers = []

function transformCircleBoundsXZ(bounds, pos, ry, scale) {
  const x = bounds.cX * scale[0]
  const z = bounds.cZ * scale[2]

  const cos = Math.cos(ry)
  const sin = Math.sin(ry)

  const rx = x * cos + z * sin
  const rz = -x * sin + z * cos

  bounds.cX = rx + pos[0]
  bounds.cZ = rz + pos[2]
  bounds.radius *= scale[0]
}

function transformAABBBoundsXZ(bounds, pos, ry, scale) {
  const { minX, maxX, minZ, maxZ } = bounds
  const [x0, x1, z0, z1] = [minX * scale[0], maxX * scale[0], minZ * scale[2], maxZ * scale[2]]

  const quarterTurns = ((Math.round(ry / HALF_PI) % 4) + 4) % 4
  let [nx0, nx1, nz0, nz1] = [x0, x1, z0, z1]

  switch (quarterTurns) {
    case 0:
      break

    case 1:
      ;[nx0, nx1, nz0, nz1] = [z0, z1, -x1, -x0]
      break

    case 2:
      ;[nx0, nx1, nz0, nz1] = [-x1, -x0, -z1, -z0]
      break

    case 3:
      ;[nx0, nx1, nz0, nz1] = [-z1, -z0, x0, x1]
      break
  }

  bounds.minX = nx0 + pos[0]
  bounds.maxX = nx1 + pos[0]
  bounds.minZ = nz0 + pos[2]
  bounds.maxZ = nz1 + pos[2]
}

function roundBounds(bounds, hasY) {
  const { type, minX, maxX, minY, maxY, minZ, maxZ, cX, cZ, radius } = bounds

  switch (type) {
    case BOUNDS_TYPES.CIRCLE:
      bounds.cX = roundTo(cX)
      bounds.cZ = roundTo(cZ)
      bounds.radius = roundTo(radius)
      break

    case BOUNDS_TYPES.AABB:
      bounds.minX = roundTo(minX)
      bounds.maxX = roundTo(maxX)
      bounds.minZ = roundTo(minZ)
      bounds.maxZ = roundTo(maxZ)
      break
  }

  if (hasY) {
    bounds.minY = roundTo(minY)
    bounds.maxY = roundTo(maxY)
  }
}

function transformBounds(bounds, pos, ry, scale, shouldRound = false) {
  const copy = { ...bounds }

  switch (bounds.type) {
    case BOUNDS_TYPES.CIRCLE:
      transformCircleBoundsXZ(copy, pos, ry, scale)
      break

    case BOUNDS_TYPES.AABB:
      transformAABBBoundsXZ(copy, pos, ry, scale)
      break
  }

  const hasY = Object.hasOwn(copy, 'minY') && Object.hasOwn(copy, 'maxY')

  if (hasY) {
    copy.minY = copy.minY * scale[1] + pos[1]
    copy.maxY = copy.maxY * scale[1] + pos[1]
  }

  if (shouldRound) roundBounds(copy, hasY)

  return copy
}

function addBounds(localBounds, worldBounds, pos = P0, ry = 0, scale = S1) {
  for (const bounds of localBounds) {
    worldBounds.push(transformBounds(bounds, pos, ry, scale))
  }
}

function expandColliders(expandedCollision, colliders) {
  const {
    scale: [sx, sy, sz],
    interval: [ix, iy, iz] = P0,
  } = expandedCollision

  const expandedColliders = []

  for (const collider of colliders) {
    const expandedCollider = { type: BOUNDS_TYPES.AABB }
    const { minY, maxY } = collider

    let dimensionX = 0
    let dimensionZ = 0

    switch (collider.type) {
      case BOUNDS_TYPES.CIRCLE: {
        const { cX, cZ, radius } = collider

        expandedCollider.minX = cX - radius
        expandedCollider.minZ = cZ - radius

        dimensionX = dimensionZ = radius * 2

        break
      }

      case BOUNDS_TYPES.AABB: {
        const { minX, maxX, minZ, maxZ } = collider

        expandedCollider.minX = minX
        expandedCollider.minZ = minZ

        dimensionX = maxX - minX
        dimensionZ = maxZ - minZ

        break
      }
    }

    expandedCollider.maxX = expandedCollider.minX + (sx - 1) * ix + dimensionX
    expandedCollider.maxZ = expandedCollider.minZ + (sz - 1) * iz + dimensionZ

    expandedCollider.minY = minY
    expandedCollider.maxY = minY + (sy - 1) * iy + (maxY - minY)

    expandedColliders.push(expandedCollider)
  }

  return expandedColliders
}

// ----------------------------------------------------------------------------------------------------
// Interactable types
// ----------------------------------------------------------------------------------------------------
function extractSeatAnchorData(anchorObj) {
  anchorObj.getWorldPosition(tmpVec3)
  anchorObj.getWorldQuaternion(tmpQuat)

  anchorObj.removeFromParent()

  const pos = tmpVec3.clone()
  const quat = tmpQuat.clone()

  tmpVec3.set(0, 0, 1).applyQuaternion(quat)

  const { x, z } = tmpVec3

  const facingAxis = Math.abs(x) > Math.abs(z) ? 'x' : 'z'
  const rightDir = facingAxis === 'x' ? [0, 0, Math.sign(x)] : [-Math.sign(z), 0, 0]

  return { pos, quat, facingAxis, rightDir }
}

function initSeatInteractable(interactable, instance, anchor, sitOnFloor = false) {
  const { pos, quat, facingAxis, rightDir } = extractSeatAnchorData(
    instance.getObjectByName(anchor.name),
  )

  interactable.sitPos = pos
  interactable.sitQuat = quat
  interactable.facingAxis = facingAxis
  interactable.rightDir = rightDir

  interactable.skirtSit = sitOnFloor ? outfit.skirtSitFloor : outfit.skirtSit
  interactable.sitAnim = sitOnFloor ? ANIMS.SIT_FLOOR : ANIMS.SIT
}

function initMultiSeatInteractable(interactable, instance, anchors) {
  const seats = []

  for (const anchor of anchors) {
    seats.push(extractSeatAnchorData(instance.getObjectByName(anchor.name)))
  }

  interactable.seats = seats
  interactable.skirtSit = outfit.skirtSit
  interactable.sitAnim = ANIMS.SIT
}

function createPointLight(
  color = POINT_LIGHT_COLOR,
  intensity = POINT_LIGHT_INTENSITY,
  distance = POINT_LIGHT_DISTANCE,
) {
  return new THREE.PointLight(color, intensity, distance)
}

function setupEmitter(interactable, instance, emitter, color) {
  const emitterObj = instance.getObjectByName(emitter.name)
  const mat = emitterObj.material.clone()

  mat.emissive.set(color)
  mat.emissiveIntensity = 0

  emitterObj.material = mat
  interactable.emitter = emitterObj
}

function initLightInteractable(interactable, instance, anchors, diffuser, bulb, window) {
  interactable.isOn = false

  if (anchors) {
    interactable.pointLights = []

    for (const anchor of anchors) {
      const anchorObj = instance.getObjectByName(anchor.name)
      const pointLight = createPointLight()

      pointLight.intensity = 0
      anchorObj.add(pointLight)

      interactable.pointLights.push(pointLight)
    }
  }

  if (diffuser) setupEmitter(interactable, instance, diffuser, EMISSIVE_COLOR)
  if (bulb) setupEmitter(interactable, instance, bulb, EMISSIVE_DECORATIVE_COLOR)
  if (window) setupEmitter(interactable, instance, window, EMISSIVE_WINDOW_COLOR)
}

const binocularsMask = document.getElementById('binoculars-mask')

function initBinocularsInteractable(interactable, instance) {
  interactable.isActive = false

  const x = instance.matrixWorld.elements[12]

  BINOCULARS_LOOK_TARGET.x = x
  BINOCULARS_CAMERA_POS.x = x
}

let activeTVCount = 0

function turnTVOn(mat) {
  if (activeTVCount === 0) tvVideo.play()

  mat.vertexColors = false
  mat.map = tvTex
  mat.toneMapped = false
  mat.needsUpdate = true

  activeTVCount++
}

function turnTVOff(mat) {
  mat.vertexColors = true
  mat.map = null
  mat.toneMapped = true
  mat.needsUpdate = true

  activeTVCount--

  if (activeTVCount === 0) tvVideo.pause()
}

function initTVInteractable(interactable, instance, screen) {
  interactable.isOn = true

  const screenObj = instance.getObjectByName(screen.name)
  screenObj.material = screenObj.material.clone()

  turnTVOn(screenObj.material)

  interactable.screen = screenObj
}

const candles = []

function initCandleInteractable(interactable, instance, fire) {
  interactable.isOn = true
  interactable.fire = instance.getObjectByName(fire.name)
  interactable.firePhase = Math.random() * TAU

  candles.push(interactable)
}

function initTrashBinInteractable(interactable, instance, flap) {
  interactable.isActive = false
  interactable.isOpening = false
  interactable.angle = 0
  interactable.flap = instance.getObjectByName(flap.name)
}

function initDoorInteractable(interactable, instance, door, isMailbox = false) {
  interactable.isOpen = false
  interactable.isActive = false
  interactable.angle = 0
  interactable.axis = isMailbox ? 'x' : 'y'
  interactable.ref = instance.getObjectByName(door.name)

  if (isMailbox) interactable.state = MAILBOX_STATES.CLOSED
  else addColliderToSections(interactable.colliders[0])
}

function initFittingRoomInteractable(interactable, instance, door) {
  initDoorInteractable(interactable, instance, door)
  interactable.swingDir = -1
}

function initTelephoneBoothInteractable(interactable, instance, door) {
  initDoorInteractable(interactable, instance, door)
  interactable.swingDir = 1
}

function initMailboxInteractable(interactable, instance, door) {
  initDoorInteractable(interactable, instance, door, true)
  interactable.swingDir = 1
}

const worldPlateSlots = []

function initPlateInteractable(instance, anchors) {
  for (const anchor of anchors) {
    const anchorObj = instance.getObjectByName(anchor.name)

    anchorObj.getWorldPosition(tmpVec3)

    worldPlateSlots.push({ anchor: anchorObj, pos: tmpVec3.toArray() })
  }
}

function initSidePanelInteractable(interactable, shop, isKiosk) {
  interactable.isPanelOpen = false
  interactable.shop = shop
  interactable.panel = panels[shop]

  if (isKiosk) interactable.isKiosk = true
}

// ----------------------------------------------------------------------------------------------------
// Interactables
// ----------------------------------------------------------------------------------------------------
const worldInteractables = []

function computeBoundsAndSectionKeys(bounds, pos, ry, scale, shouldRound) {
  const transformedBounds = transformBounds(bounds, pos, ry, scale, shouldRound)
  const { minSX, maxSX, minSZ, maxSZ } = getSectionRangeFromBounds(transformedBounds)
  const sectionKeys = []

  for (let sx = minSX; sx <= maxSX; sx++) {
    for (let sz = minSZ; sz <= maxSZ; sz++) {
      const key = makeSectionKey(sx, sz)

      ensureSection(key)
      sectionKeys.push(key)
    }
  }

  return { bounds: transformedBounds, sectionKeys }
}

function initInteractables(instance, interactables, pos, ry, scale) {
  for (const item of interactables) {
    const { type, anchors, diffuser, bulb, window, screen, fire, flap, door, triggers, colliders } =
      item

    const transformedTriggers = []
    const transformedColliders = []

    const shouldRound = colliders.length > 0

    for (const trigger of triggers) {
      transformedTriggers.push(transformBounds(trigger, pos, ry, scale, shouldRound))
    }

    for (const [id, collider] of colliders.entries()) {
      if (!collider) fail(`Missing interactable collider: ${type} (id: ${id})`)

      transformedColliders[id] = computeBoundsAndSectionKeys(collider, pos, ry, scale, shouldRound)
    }

    const interactable = {
      type,
      triggers: transformedTriggers,
      colliders: transformedColliders,
    }

    switch (type) {
      case INTERACTABLE_TYPES.CHAIR:
      case INTERACTABLE_TYPES.STOOL:
        initSeatInteractable(interactable, instance, anchors[0])
        break

      case INTERACTABLE_TYPES.CUSHION:
        initSeatInteractable(interactable, instance, anchors[0], true)
        break

      case INTERACTABLE_TYPES.SOFA:
      case INTERACTABLE_TYPES.BENCH:
        initMultiSeatInteractable(interactable, instance, anchors)
        break

      case INTERACTABLE_TYPES.LIGHT:
      case INTERACTABLE_TYPES.LIGHTHOUSE:
        initLightInteractable(interactable, instance, anchors, diffuser, bulb, window)
        break

      case INTERACTABLE_TYPES.BINOCULARS:
        initBinocularsInteractable(interactable, instance)
        break

      case INTERACTABLE_TYPES.TV:
        initTVInteractable(interactable, instance, screen)
        break

      case INTERACTABLE_TYPES.CANDLE:
        initCandleInteractable(interactable, instance, fire)
        break

      case INTERACTABLE_TYPES.TRASH_BIN:
        initTrashBinInteractable(interactable, instance, flap)
        break

      case INTERACTABLE_TYPES.FITTING_ROOM:
        initFittingRoomInteractable(interactable, instance, door)
        break

      case INTERACTABLE_TYPES.TELEPHONE_BOOTH:
        initTelephoneBoothInteractable(interactable, instance, door)
        break

      case INTERACTABLE_TYPES.MAILBOX:
        initMailboxInteractable(interactable, instance, door)
        break

      case INTERACTABLE_TYPES.PLATE:
        initPlateInteractable(instance, anchors)
        break

      case INTERACTABLE_TYPES.KIOSK:
        initSidePanelInteractable(interactable, SHOPS.ICE_CREAM_SHOP, true)
        break

      case SHOPS.BOUTIQUE:
      case SHOPS.CAFE:
      case SHOPS.ICE_CREAM_SHOP:
      case SHOPS.PIZZERIA:
        initSidePanelInteractable(interactable, type)
        break
    }

    worldInteractables.push(interactable)
  }
}

// ----------------------------------------------------------------------------------------------------
// Instanced fence segments
// ----------------------------------------------------------------------------------------------------
function getSingleMesh(model) {
  let mesh = null

  model.traverse((node) => {
    if (!node.isMesh) return
    if (mesh) fail('Expected a single mesh, but found multiple meshes.')

    mesh = node
  })

  return mesh
}

function createInstancedFenceSegments(model, config) {
  const { geometry, material } = getSingleMesh(model)
  const {
    colliders,
    castShadow = DEFAULT_CAST_SHADOW,
    receiveShadow = DEFAULT_RECEIVE_SHADOW,
  } = config

  const instancedMesh = new THREE.InstancedMesh(geometry, material, FENCE_SEG_COUNT)
  const transform = new THREE.Object3D()

  for (let i = 0; i < FENCE_SEG_COUNT; i++) {
    const ry = FENCE_SEG_ANGLE * i

    transform.rotation.y = ry
    transform.updateMatrix()

    instancedMesh.setMatrixAt(i, transform.matrix)

    if (colliders) addBounds(colliders, worldColliders, P0, ry, S1)
  }

  instancedMesh.instanceMatrix.needsUpdate = true
  instancedMesh.castShadow = castShadow
  instancedMesh.receiveShadow = receiveShadow

  scene.add(instancedMesh)
}

// ----------------------------------------------------------------------------------------------------
// Model instance coloring
// ----------------------------------------------------------------------------------------------------
function getColorables(instance) {
  let colorables = []

  instance.traverse((node) => {
    if (!node.isMesh) return

    const { idStr, has } = parseName(node.name)

    if (!has('colorable')) return

    if (!idStr) fail(`Missing colorable id: ${instance.name}`)

    const id = Number(idStr)

    if (Number.isNaN(id)) fail(`Invalid colorable id: ${node.name}`)

    colorables.push({ mesh: node, id })
  })

  return colorables
}

function setVertexColor(geometry, color, maskFn = null) {
  const attrs = geometry.attributes
  const count = attrs.position.count

  let colorAttr = attrs.color

  if (!colorAttr) {
    if (maskFn) fail('Missing vertex color.')

    colorAttr = new THREE.BufferAttribute(f32Arr(count * 3), 3)
    geometry.setAttribute('color', colorAttr)
  }

  const { r: nr, g: ng, b: nb } = color
  const arr = colorAttr.array

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    if (maskFn) {
      const r = arr[i3]
      const g = arr[i3 + 1]
      const b = arr[i3 + 2]

      if (!maskFn(r, g, b)) continue
    }

    arr[i3] = nr
    arr[i3 + 1] = ng
    arr[i3 + 2] = nb
  }

  colorAttr.needsUpdate = true
}

const coloredGeoms = {}

function applyMaterialColors(instance, colors) {
  const colorables = getColorables(instance)
  const colorList = toArr(colors)

  for (const colorable of colorables) {
    const { mesh, id } = colorable
    const color = colorList[id]

    if (!color) continue

    const key = `${mesh.geometry.uuid}_${color.getHexString()}`
    let geom = coloredGeoms[key]

    if (!geom) {
      geom = mesh.geometry.clone()
      setVertexColor(geom, color)
      coloredGeoms[key] = geom
    }

    mesh.geometry = geom
  }
}

// ----------------------------------------------------------------------------------------------------
// Model instance initialization
// ----------------------------------------------------------------------------------------------------
let laptopScreenTex = null

function initLaptop(model) {
  laptopScreenTex = model.getObjectByName('laptopScreen').material.map
}

const hourHands = []
const minuteHands = []
const secondHands = []

function initClock(instance) {
  const hands = {
    hour: hourHands,
    minute: minuteHands,
    second: secondHands,
  }

  for (const child of instance.children) {
    const parts = getNameParts(child.name)

    if (parts[1] !== 'hand') continue

    hands[parts[2]].push(child)
  }
}

const fires = []

function initFire(instance, fire) {
  const fireObj = instance.getObjectByName(fire.name)

  fires.push({ ref: fireObj, phase: Math.random() * TAU })

  if (instance.name === 'pizzaOven') {
    const pointLight = createPointLight(OVEN_LIGHT_COLOR, OVEN_LIGHT_INTENSITY, OVEN_LIGHT_DISTANCE)

    pointLight.position.y = OVEN_LIGHT_OFFSET
    fireObj.add(pointLight)
  }
}

const parentMap = {}
const groupRoots = []

function registerParent(name, id, instance, maxY) {
  parentMap[`${name}_${id}`] = {
    ref: instance,
    maxY: maxY,
  }
}

function initModelInstance(instance, config, instConfig) {
  const name = instance.name
  const { id, parent } = instConfig ?? config
  const { isClock, fire, maxY } = config

  if (isClock) initClock(instance)
  if (fire) initFire(instance, fire)

  if (id !== undefined) {
    registerParent(name, id, instance, maxY)

    if (!parent) {
      instance.userData.groupKey = `${name}_${id}`
      groupRoots.push(instance)
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Model instance placement
// ----------------------------------------------------------------------------------------------------
function getParent(cfgParent) {
  const { name, id } = cfgParent
  const key = `${name}_${id}`
  const parent = parentMap[key]

  if (!parent) fail(`Parent not found: ${key}`)

  return parent
}

const counterItems = {}

function registerCounterItem(instance, mats, colliders, pos, rotY, scale) {
  const [, shop, idx, start, end = start] = getNameParts(instance.name)

  const item = {
    ref: instance,
    mats: mats.map(({ prefix, name }) => ({ prefix, mesh: instance.getObjectByName(name) })),
    colliders: colliders.map((collider) => computeBoundsAndSectionKeys(collider, pos, rotY, scale)),
  }

  if (shop === SHOPS.ICE_CREAM_SHOP) {
    counterItems[`${shop}_${idx}`] = item
  } else {
    for (let id = start; id <= end; id++) {
      ;(counterItems[`${shop}_${idx}_${id}`] ??= []).push(item)
    }
  }
}

function placeModelInstance(instance, config, instConfig) {
  const cfg = instConfig ?? config

  let { pos = P0, rotY = 0 } = cfg
  const {
    scale = S1,
    parent: cfgParent,
    attach,
    noCollision,
    expandedCollision,
    noInteraction,
  } = cfg

  const { colliders, cameraBlockers, interactables, mats } = config

  instance.position.set(...pos)
  instance.rotation.set(0, rotY, 0)
  instance.scale.set(...scale)

  if (cfgParent) {
    const parent = getParent(cfgParent)

    if (attach === 'top') instance.position.y += parent.maxY

    parent.ref.add(instance)

    instance.getWorldPosition(tmpVec3)
    instance.getWorldQuaternion(tmpQuat)
    tmpEuler.setFromQuaternion(tmpQuat)

    pos = tmpVec3.toArray()
    rotY = tmpEuler.y
  } else {
    scene.add(instance)
    instance.updateWorldMatrix(false, false)
  }

  if (instance.name.startsWith('item'))
    return registerCounterItem(instance, mats, colliders, pos, rotY, scale)

  if (!noCollision && colliders) {
    const resolvedColliders = expandedCollision
      ? expandColliders(expandedCollision, colliders)
      : colliders

    addBounds(resolvedColliders, worldColliders, pos, rotY, scale)
  }

  if (cameraBlockers) addBounds(cameraBlockers, worldCameraBlockers, pos, rotY, scale)

  if (!noInteraction && interactables) initInteractables(instance, interactables, pos, rotY, scale)
}

function setupModelInstance(instance, config, instConfig) {
  initModelInstance(instance, config, instConfig)
  placeModelInstance(instance, config, instConfig)
}

// ----------------------------------------------------------------------------------------------------
// NPC layout
// ----------------------------------------------------------------------------------------------------
function resolveNPCPlacements() {
  for (const [name, config] of Object.entries(NPC_MODELS_CONFIG)) {
    const npc = models[name]
    const { pos = P0, parent: cfgParent, attach, colliders } = config

    if (!cfgParent) continue

    const parent = getParent(cfgParent)

    tmpVec3.set(...pos)
    tmpVec3.applyMatrix4(parent.ref.matrixWorld)
    npc.position.copy(tmpVec3)

    if (attach === 'top') npc.position.y += parent.maxY

    parent.ref.getWorldQuaternion(tmpQuat)
    tmpEuler.setFromQuaternion(tmpQuat)
    npc.rotation.y = tmpEuler.y

    scene.add(npc)

    if (colliders) addBounds(colliders, worldColliders, npc.position.toArray(), npc.rotation.y)
  }
}

// ----------------------------------------------------------------------------------------------------
// Plant layout
// ----------------------------------------------------------------------------------------------------
function resolvePlantPlacements() {
  for (const { instances } of Object.values(PLANT_MODELS_CONFIG)) {
    if (!instances) continue

    for (const instConfig of instances) {
      const { pos = P0, parent: cfgParent } = instConfig

      if (!cfgParent) continue

      const parent = getParent(cfgParent)

      tmpVec3.set(...pos)
      tmpVec3.applyMatrix4(parent.ref.matrixWorld)

      instConfig.pos = tmpVec3.toArray()
    }
  }
}

function populateCluster(instances, inst, center, color, cluster) {
  const { c = DEFAULT_CLUSTER_SIZE, r = DEFAULT_CLUSTER_RADII[c], a: baseAngle = 0 } = cluster

  if (!c || !r) return

  const useCenter = c > 3
  const len = useCenter ? c - 1 : c
  const angles = Array.from({ length: len }, (_, i) => (TAU / len) * i + baseAngle)

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i]

    const x = center[0] + Math.cos(angle) * r
    const z = center[2] + Math.sin(angle) * r

    const pos = [x, center[1], z]

    if (!useCenter && i == 0) {
      inst.pos = pos
      continue
    }

    instances.push({ pos, color })
  }
}

function resolvePlantClusters() {
  for (const { instances, color } of Object.values(PLANT_MODELS_CONFIG)) {
    if (!instances) continue

    const countCopy = instances.length

    for (let i = 0; i < countCopy; i++) {
      const inst = instances[i]
      const { pos, color, cluster } = inst

      if (!cluster) continue

      populateCluster(instances, inst, pos, color, cluster)
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Effects
// ----------------------------------------------------------------------------------------------------
function addVertexSway(material) {
  material.vertexColors = true

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = EFFECTS_TIME

    shader.vertexShader =
      `
      uniform float uTime;
      attribute float instRand;
      attribute vec3 instColor;
      varying vec3 vInstColor;
      ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vInstColor = instColor;

      float base = uTime * ${f2(SWAY_SPEED)};
      float offset = instRand * ${f2(SWAY_OFFSET_SCALE)};
      float angle = sin(base + offset) * ${f2(SWAY_AMP)} * position.y;

      float cosA = cos(angle);
      float sinA = sin(angle);

      float newX = position.x * cosA + position.y * sinA;
      float newY = position.y * cosA - position.x * sinA;

      vec3 transformed = vec3(newX, newY, position.z);
      `,
    )

    shader.fragmentShader = `varying vec3 vInstColor;\n` + shader.fragmentShader

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>

      #ifndef DEPTH_PACKING
        float minChannel = min(
          diffuseColor.r,
          min(diffuseColor.g, diffuseColor.b)
        );

        float isWhite = smoothstep(0.9, 0.95, minChannel);
        diffuseColor.rgb = mix(diffuseColor.rgb, vInstColor, isWhite);
      #endif
      `,
    )
  }
}

function addVertexLeafSway(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = EFFECTS_TIME

    shader.vertexShader =
      `
      uniform float uTime;
      attribute float leafRand;
      attribute float maxY;
      attribute float cX;
      attribute float cZ;
    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = position;
      vec3 pivot = vec3(cX, maxY, cZ);

      transformed -= pivot;

      float base = uTime * ${f2(LEAF_SWAY_SPEED)};
      float offset = leafRand * ${f2(LEAF_SWAY_OFFSET_SCALE)};
      float angle = sin(base + offset) * ${f2(LEAF_SWAY_AMP)};

      float cosA = cos(angle);
      float sinA = sin(angle);

      float newX = transformed.x * cosA - transformed.y * sinA;
      float newY = transformed.y * cosA + transformed.x * sinA;

      transformed.x = newX;
      transformed.y = newY;

      transformed += pivot;
      `,
    )
  }
}

function enableEffect(mesh, effect, syncShadows) {
  const mat = mesh.material
  let customDepthMaterial = null

  if (syncShadows) {
    customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      vertexColors: true,
    })
  }

  switch (effect) {
    case EFFECTS.SWAY:
      addVertexSway(mat)
      if (syncShadows) addVertexSway(customDepthMaterial)
      break

    case EFFECTS.LEAF_SWAY:
      addVertexLeafSway(mat)
      if (syncShadows) addVertexLeafSway(customDepthMaterial)
      break

    default:
      fail(`Unknown vertex effect: ${effect}`)
  }

  if (syncShadows) mesh.customDepthMaterial = customDepthMaterial
}

// ----------------------------------------------------------------------------------------------------
// Instanced plants
// ----------------------------------------------------------------------------------------------------
function writeColorRGB(colorsRGB, color, index) {
  const { r, g, b } = color ?? COLORS.BLACK
  const base = index * 3

  colorsRGB[base] = r
  colorsRGB[base + 1] = g
  colorsRGB[base + 2] = b
}

function createInstancedPlants(name, config) {
  const { geometry, material } = getSingleMesh(models[name])
  const {
    instances,
    castShadow = DEFAULT_CAST_SHADOW,
    receiveShadow = DEFAULT_RECEIVE_SHADOW,
    syncShadows = DEFAULT_SYNC_SHADOWS,
  } = config

  const count = instances.length
  const instancedMesh = new THREE.InstancedMesh(geometry, material, count)

  enableEffect(instancedMesh, EFFECTS.SWAY, syncShadows)

  const transform = new THREE.Object3D()
  const instRands = f32Arr(count)
  const colorsRGB = f32Arr(count * 3)
  const angles = name.includes('grass')
    ? [0, PI]
    : [0, 30, -30, 60, -60, 180].map(THREE.MathUtils.degToRad)
  const angleCount = angles.length

  for (let i = 0; i < count; i++) {
    const randomAngle = angles[Math.floor(Math.random() * angleCount)]
    const { pos = P0, rotY = 0, scale = S1, color } = instances[i]

    transform.position.set(...pos)
    transform.rotation.set(0, rotY + randomAngle, 0)
    transform.scale.set(...scale)
    transform.updateMatrix()
    instancedMesh.setMatrixAt(i, transform.matrix)

    instRands[i] = Math.random() * 10.0
    writeColorRGB(colorsRGB, color, i)
  }

  instancedMesh.instanceMatrix.needsUpdate = true
  instancedMesh.castShadow = castShadow
  instancedMesh.receiveShadow = receiveShadow

  instancedMesh.geometry
    .setAttribute('instRand', new THREE.InstancedBufferAttribute(instRands, 1))
    .setAttribute('instColor', new THREE.InstancedBufferAttribute(colorsRGB, 3))

  scene.add(instancedMesh)
}

// ----------------------------------------------------------------------------------------------------
// Instanced trees
// ----------------------------------------------------------------------------------------------------
function getTreeParts(model) {
  let trunk = null
  let leaf = null
  let apple = null

  model.traverse((node) => {
    if (!node.isMesh) return

    const [category] = getNameParts(node.name)

    switch (category) {
      case 'trunk':
        trunk = node
        break

      case 'leafTemplate':
        leaf = node
        break

      case 'appleTemplate':
        apple = node
        break
    }
  })

  return { trunk, leaf, apple }
}

function initInstancedTrunkData(trunk, instCount) {
  const { geometry, material } = trunk

  geometry.computeBoundingBox()

  const { min, max } = geometry.boundingBox
  const baseHeight = max.y - min.y

  const instancedMesh = new THREE.InstancedMesh(geometry, material, instCount)

  const transform = new THREE.Object3D()
  const rigidTransform = new THREE.Object3D()

  return { instancedMesh, transform, rigidTransform, baseHeight }
}

function initInstancedLeafData(leaf, layout, instCount) {
  const { geometry, material } = leaf

  const count = layout.length
  const totalCount = instCount * count

  const instancedMesh = new THREE.InstancedMesh(geometry, material, totalCount)

  enableEffect(instancedMesh, EFFECTS.LEAF_SWAY, false)

  const transform = new THREE.Object3D()

  return {
    instancedMesh,
    transform,
    rands: f32Arr(totalCount),
    maxYs: f32Arr(totalCount),
    cXs: f32Arr(totalCount),
    cZs: f32Arr(totalCount),
  }
}

function setInstancedTrunkData(instances, instIndex, data, colliders) {
  const { pos = P0, rotY = 0, scale = S1 } = instances[instIndex]
  const { instancedMesh, transform, rigidTransform, baseHeight } = data

  data.extraHeight = baseHeight * (scale[1] - 1)

  transform.position.set(...pos)
  transform.rotation.set(0, rotY, 0)
  transform.scale.set(...scale)
  transform.updateMatrix()
  instancedMesh.setMatrixAt(instIndex, transform.matrix)

  rigidTransform.copy(transform)
  rigidTransform.scale.set(...S1)
  rigidTransform.updateMatrix()

  if (colliders) addBounds(colliders, worldColliders, pos, rotY, scale)
}

function populateInstancedLeafData(instIndex, data, layout, extraHeight, rigidTransform) {
  const { instancedMesh, transform, rands, maxYs, cXs, cZs } = data
  const count = layout.length

  let index = instIndex * count

  for (let i = 0; i < count; i++) {
    const { position, quaternion, scale, maxY, cX, cZ } = layout[i]

    transform.position.copy(position)
    transform.position.y += extraHeight
    transform.quaternion.copy(quaternion)
    transform.scale.copy(scale)
    transform.updateMatrix()

    transform.matrix.premultiply(rigidTransform.matrix)
    instancedMesh.setMatrixAt(index, transform.matrix)

    rands[index] = Math.random() * 10.0
    maxYs[index] = maxY
    cXs[index] = cX
    cZs[index] = cZ

    index++
  }
}

function finalizeInstancedMesh(data, config, isLeaf = true) {
  const { instancedMesh, rands, maxYs, cXs, cZs } = data

  instancedMesh.instanceMatrix.needsUpdate = true
  instancedMesh.castShadow = config.castShadow ?? DEFAULT_CAST_SHADOW
  instancedMesh.receiveShadow = config.receiveShadow ?? DEFAULT_RECEIVE_SHADOW

  if (isLeaf) {
    instancedMesh.geometry
      .setAttribute('leafRand', new THREE.InstancedBufferAttribute(rands, 1))
      .setAttribute('maxY', new THREE.InstancedBufferAttribute(maxYs, 1))
      .setAttribute('cX', new THREE.InstancedBufferAttribute(cXs, 1))
      .setAttribute('cZ', new THREE.InstancedBufferAttribute(cZs, 1))
  }

  scene.add(instancedMesh)
}

function createInstancedTrees(name, config) {
  const { trunk, leaf, apple } = getTreeParts(models[name])
  const { instances, leafLayout, appleLayout, colliders } = config

  const hasApple = !!apple
  const instCount = instances.length

  const trunkData = initInstancedTrunkData(trunk, instCount)
  const leafData = initInstancedLeafData(leaf, leafLayout, instCount)
  const appleData = hasApple ? initInstancedLeafData(apple, appleLayout, instCount) : null

  for (let i = 0; i < instCount; i++) {
    setInstancedTrunkData(instances, i, trunkData, colliders)

    const { extraHeight, rigidTransform } = trunkData

    populateInstancedLeafData(i, leafData, leafLayout, extraHeight, rigidTransform)

    if (hasApple) populateInstancedLeafData(i, appleData, appleLayout, extraHeight, rigidTransform)
  }

  finalizeInstancedMesh(trunkData, config, false)
  finalizeInstancedMesh(leafData, config)

  if (hasApple) finalizeInstancedMesh(appleData, config)
}

// ----------------------------------------------------------------------------------------------------
// Mesh merging
// ----------------------------------------------------------------------------------------------------
function getMaterialType(node) {
  const { isMesh, name, material } = node

  if (!isMesh) return null

  const { has } = parseName(name)

  if (has('interactable')) return null
  if (has('laptopScreen')) return null
  if (has('clock') && has('hand')) return null
  if (has('fire')) return null
  if (has('center')) return null
  if (has('item')) return null

  if (has('tex') || has('print')) return MAT_TYPE.TEXTURE

  if (!material.vertexColors) fail(`Mesh must use vertex colors: ${name}`)

  return MAT_TYPE.VERTEX
}

function mergeMeshesByGroup() {
  const groups = {}

  for (const root of groupRoots) {
    const groupKey = root.userData.groupKey

    if (!groupKey) fail('Missing groupKey.')

    root.traverse((node) => {
      const matType = getMaterialType(node)
      const mat = node.material

      if (!matType) return

      const key = matType === MAT_TYPE.VERTEX ? groupKey : `${groupKey}_${mat.uuid}`

      groups[key] ??= { nodes: [], mat }
      groups[key].nodes.push(node)
    })
  }

  for (const [key, group] of Object.entries(groups)) {
    const nodes = group.nodes

    if (nodes.length < 2) continue

    const geomsToMerge = []

    for (const node of nodes) {
      node.updateWorldMatrix(false, false)

      const geom = node.geometry.clone()

      geom.applyMatrix4(node.matrixWorld)
      geomsToMerge.push(geom)
    }

    const mergedGeom = BufferGeometryUtils.mergeGeometries(geomsToMerge, false)

    if (!mergedGeom) fail(`Failed to merge geometries for group: ${key}`)

    const mergedMesh = new THREE.Mesh(mergedGeom, group.mat)

    mergedMesh.name = `merged_${key}`
    mergedMesh.castShadow = DEFAULT_CAST_SHADOW
    mergedMesh.receiveShadow = DEFAULT_RECEIVE_SHADOW

    scene.add(mergedMesh)

    for (const geom of geomsToMerge) {
      geom.dispose()
    }

    for (const node of nodes) {
      let parent = node.parent

      parent.remove(node)

      while (parent.children.length === 0) {
        const grandparent = parent.parent

        grandparent.remove(parent)
        parent = grandparent
      }
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Scene
// ----------------------------------------------------------------------------------------------------
function initScene() {
  for (const [name, config] of Object.entries(STATIC_MODELS_CONFIG)) {
    const model = models[name]
    const { skipInitScene, instances } = config

    if (skipInitScene) continue

    if (name === 'fence') {
      createInstancedFenceSegments(model, config)
      continue
    }

    if (name === 'laptop') initLaptop(model)

    if (instances) {
      for (const instConfig of instances) {
        const instance = model.clone(true)
        const colors = instConfig.colors ?? instConfig.color

        if (colors) applyMaterialColors(instance, colors)

        setupModelInstance(instance, config, instConfig)
      }
    } else {
      setupModelInstance(model, config)
    }
  }

  advanceSetupProgress()

  resolveNPCPlacements()
  resolvePlantPlacements()
  resolvePlantClusters()

  for (const [name, config] of Object.entries(PLANT_MODELS_CONFIG)) {
    const plantFn = config.isTree ? createInstancedTrees : createInstancedPlants

    plantFn(name, config)
  }

  mergeMeshesByGroup()

  advanceSetupProgress()
}

// ----------------------------------------------------------------------------------------------------
// Sections
// ----------------------------------------------------------------------------------------------------
const sections = {}

function getSectionRangeFromBounds(bounds) {
  let minX, maxX, minZ, maxZ

  switch (bounds.type) {
    case BOUNDS_TYPES.CIRCLE: {
      const { cX, cZ, radius } = bounds

      minX = cX - radius
      maxX = cX + radius
      minZ = cZ - radius
      maxZ = cZ + radius

      break
    }

    case BOUNDS_TYPES.AABB:
      ;({ minX, maxX, minZ, maxZ } = bounds)
      break
  }

  const minSX = getSectionIndex(minX - SECTION_PADDING)
  const maxSX = getSectionIndex(maxX + SECTION_PADDING)
  const minSZ = getSectionIndex(minZ - SECTION_PADDING)
  const maxSZ = getSectionIndex(maxZ + SECTION_PADDING)

  return { minSX, maxSX, minSZ, maxSZ }
}

function ensureSection(key) {
  if (!sections[key]) {
    sections[key] = {
      colliders: [],
      cameraBlockers: [],
      interactables: [],
      plateSlots: [],
    }
  }
}

function getSectionIndex(val) {
  return Math.floor(val * INV_SECTION_SIZE)
}

function makeSectionKey(sx, sz) {
  return `${sx},${sz}`
}

let cachedSX = null
let cachedSZ = null
let cachedSectionKey = ''

function getSectionKey(x, z) {
  const sx = getSectionIndex(x)
  const sz = getSectionIndex(z)

  if (sx !== cachedSX || sz !== cachedSZ) {
    cachedSX = sx
    cachedSZ = sz
    cachedSectionKey = makeSectionKey(sx, sz)
  }

  return cachedSectionKey
}

function registerInSections(bounds, category, item = bounds) {
  const { minSX, maxSX, minSZ, maxSZ } = getSectionRangeFromBounds(bounds)

  for (let sx = minSX; sx <= maxSX; sx++) {
    for (let sz = minSZ; sz <= maxSZ; sz++) {
      if (category === SECTION_CONTENT.CAMERA_BLOCKERS) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const key = makeSectionKey(sx + i, sz + j)

            ensureSection(key)
            const section = sections[key][category]

            if (!section.includes(item)) section.push(item)
          }
        }
      } else {
        const key = makeSectionKey(sx, sz)

        ensureSection(key)
        const section = sections[key][category]

        switch (category) {
          case SECTION_CONTENT.COLLIDERS:
            section.push(item)
            break

          case SECTION_CONTENT.INTERACTABLES:
            if (!section.includes(item)) section.push(item)
            break
        }
      }
    }
  }
}

function registerPointInSections(item, category) {
  const [x, , z] = item.pos
  const sx = getSectionIndex(x)
  const sz = getSectionIndex(z)

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const key = makeSectionKey(sx + i, sz + j)

      ensureSection(key)
      sections[key][category].push(item)
    }
  }
}

function initSections() {
  for (const collider of worldColliders) {
    registerInSections(collider, SECTION_CONTENT.COLLIDERS)
  }

  for (const blocker of worldCameraBlockers) {
    registerInSections(blocker, SECTION_CONTENT.CAMERA_BLOCKERS)
  }

  for (const interactable of worldInteractables) {
    for (const trigger of interactable.triggers) {
      registerInSections(trigger, SECTION_CONTENT.INTERACTABLES, interactable)
    }
  }

  for (const slot of worldPlateSlots) {
    registerPointInSections(slot, SECTION_CONTENT.PLATE_SLOTS)
  }
}

function addColliderToSections(collider) {
  const { sectionKeys, bounds } = collider

  for (const key of sectionKeys) {
    sections[key].colliders.push(bounds)
  }
}

function removeColliderFromSections(collider) {
  const { sectionKeys, bounds } = collider

  for (const key of sectionKeys) {
    const colliders = sections[key].colliders
    const index = colliders.indexOf(bounds)

    if (index !== -1) {
      colliders[index] = colliders[colliders.length - 1]
      colliders.pop()
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Sound UI
// ----------------------------------------------------------------------------------------------------
async function playBGM(volume = BGM_VOLUME) {
  if (bgm.isPlaying) return

  try {
    if (bgm.context.state === 'suspended') await bgm.context.resume()

    bgm.setVolume(volume).play()
  } catch (err) {
    console.warn('Failed to play BGM:', err)
  }
}

function initSoundUI() {
  const btn = document.getElementById('sound-btn')
  const on = btn.querySelector('.sound-on')
  const off = btn.querySelector('.sound-off')

  let isSoundOn = localStorage.getItem(SOUND_KEY) !== '0'

  addVisible(isSoundOn ? on : off)

  btn.addEventListener('click', () => {
    isSoundOn = !isSoundOn

    localStorage.setItem(SOUND_KEY, isSoundOn ? 1 : 0)

    if (isSoundOn) void playBGM()
    else bgm.pause()

    toggleVisible(on)
    toggleVisible(off)
  })
}

// ----------------------------------------------------------------------------------------------------
// Side panel UIs
// ----------------------------------------------------------------------------------------------------
const panels = {
  [SHOPS.BOUTIQUE]: document.getElementById('boutique-panel'),
  [SHOPS.CAFE]: document.getElementById('cafe-panel'),
  [SHOPS.ICE_CREAM_SHOP]: document.getElementById('ice-cream-shop-panel'),
  [SHOPS.PIZZERIA]: document.getElementById('pizzeria-panel'),
}

function getItemClassName(index, slotCount) {
  return `item i-${slotCount} i-${index}-${slotCount}`
}

function isOrderEmpty(ids) {
  return ids.every((id) => id === -1)
}

function selectTab(tab, tabs, content) {
  if (tab.classList.contains('selected')) return

  const oldTab = tabs.querySelector('.selected')
  const oldContent = content.querySelector(`[data-tab="${oldTab.dataset.tab}"]`)
  const newContent = content.querySelector(`[data-tab="${tab.dataset.tab}"]`)

  removeSelected(oldTab)
  removeSelected(oldContent)

  addSelected(tab)
  addSelected(newContent)
}

function createTabBtn(label, idx, tabs, content) {
  const tab = document.createElement('button')

  tab.textContent = label
  tab.className = 'tab'
  tab.dataset.tab = idx

  if (idx === 0) addSelected(tab)

  tab.addEventListener('click', () => selectTab(tab, tabs, content))

  return tab
}

function createTabContainer(idx, isGroup = false) {
  const container = document.createElement('div')

  container.className = isGroup ? 'group' : 'list'
  container.dataset.tab = idx

  if (idx === 0) addSelected(container)

  return container
}

function createItem(i, slotCount, ids, idx, id, group, orderBtn) {
  const item = document.createElement('button')

  item.className = getItemClassName(i, slotCount)

  item.addEventListener('click', () => {
    if (item.classList.contains('selected')) {
      ids[idx] = -1
    } else {
      removeSelected(group.querySelector('.selected'))
      ids[idx] = id
    }

    item.classList.toggle('selected', ids[idx] !== -1)
    orderBtn.classList.toggle('disabled', isOrderEmpty(ids))
  })

  return item
}

function createSection(cfg, start, slotCount, ids, idx, orderBtn, container, baseId) {
  const { title, count } = cfg

  const section = document.createElement('div')
  const h2 = document.createElement('h2')
  const list = document.createElement('div')

  const group = container ?? list

  section.className = 'section'
  h2.textContent = title
  list.className = 'list'

  for (let i = start, id = container ? baseId : 0; i < start + count; i++, id++) {
    list.appendChild(createItem(i, slotCount, ids, idx, id, group, orderBtn))
  }

  section.append(h2, list)

  return section
}

function createNavBtn(panel, text, steps, currentStep, getTargetStep, onBeforeNavigate) {
  const btn = document.createElement('button')

  btn.textContent = text

  if (text === 'Next') addDisabled(btn)

  btn.addEventListener('click', () => {
    onBeforeNavigate?.()

    addVisible(steps[getTargetStep()])
    removeVisible(steps[currentStep])

    panel.scrollTop = 0
  })

  return btn
}

function createOrderBtn(shop, getIds, onReset) {
  const order = orders[shop]
  const btn = document.createElement('button')

  btn.textContent = 'Place Order'
  btn.className = 'btn disabled'

  btn.addEventListener('click', () => {
    order.time = performance.now()
    order.ids = getIds()
    order.ordered = true

    toggleSidePanel(uiActive)

    setTimeout(() => {
      onReset?.()
    }, 400)
  })

  return btn
}

function resetOrder(panel, ids, content, btns = []) {
  panel.scrollTop = 0

  ids.fill(-1)

  for (const item of content.querySelectorAll('.item.selected')) {
    removeSelected(item)
  }

  for (const btn of btns) {
    addDisabled(btn)
  }
}

function resetTabs(tabs, content) {
  for (const tab of tabs.querySelectorAll('.tab')) {
    const isSelected = tab.dataset.tab === '0'

    tab.classList.toggle('selected', isSelected)
    content
      .querySelector(`[data-tab="${tab.dataset.tab}"]`)
      .classList.toggle('selected', isSelected)
  }
}

function resetSteps(steps) {
  for (const [i, step] of steps.entries()) {
    step.classList.toggle('is-visible', i === 0)
  }
}

function initSidePanelUIs() {
  initBoutiqueUI()
  initCafeUI()
  initIceCreamShopUI()
  initPizzeriaUI()
}

// ----------------------------------------------------------------------------------------------------
// Boutique UI
// ----------------------------------------------------------------------------------------------------
function initBoutiqueUI() {
  const boutiquePanel = panels[SHOPS.BOUTIQUE]
  const tabs = boutiquePanel.querySelector('.tabs')
  const content = boutiquePanel.querySelector('.content')
  const resetBtn = boutiquePanel.querySelector('.reset-btn')

  const lists = []
  let start = 0

  for (const [idx, cfg] of OUTFIT_CONFIG.entries()) {
    const { part, count } = cfg

    const list = content.querySelector(`.${part}-list`)
    const currId = outfitIds[idx]

    for (let i = start, id = 0; i < start + count; i++, id++) {
      const btn = document.createElement('button')

      btn.className = getItemClassName(i, BOUTIQUE_SLOT_COUNT)

      if (id === currId) addSelected(btn)

      btn.addEventListener('click', () => {
        if (btn.classList.contains('selected')) return

        removeSelected(list.querySelector('.selected'))
        addSelected(btn)

        setOutfitPart(cfg, idx, id, true)
      })

      list.appendChild(btn)
    }

    lists.push(list)
    start += count
  }

  for (const tab of tabs.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => selectTab(tab, tabs, content))
  }

  resetBtn.addEventListener('click', () => {
    for (const list of lists) {
      removeSelected(list.querySelector('.selected'))
      addSelected(list.firstElementChild)
    }

    setDefaultOutfit(true)
  })
}

// ----------------------------------------------------------------------------------------------------
// Cafe UI
// ----------------------------------------------------------------------------------------------------
function initCafeUI() {
  const panel = panels[SHOPS.CAFE]
  const tabs = panel.querySelector('.tabs')
  const content = panel.querySelector('.content')

  const ids = Array(CAFE_CONFIG.length).fill(-1)
  const orderBtn = createOrderBtn(SHOPS.CAFE, () => [...ids], reset)

  function reset() {
    resetOrder(panel, ids, content, [orderBtn])
    resetTabs(tabs, content)
  }

  let start = 0

  for (const [idx, group] of CAFE_CONFIG.entries()) {
    const { label, sections } = group
    const container = createTabContainer(idx, true)

    tabs.appendChild(createTabBtn(label, idx, tabs, content))
    content.append(container)

    let baseId = 0

    for (const section of sections) {
      container.appendChild(
        createSection(section, start, CAFE_SLOT_COUNT, ids, idx, orderBtn, container, baseId),
      )

      const count = section.count

      start += count
      baseId += count
    }
  }

  panel.appendChild(orderBtn)
}

// ----------------------------------------------------------------------------------------------------
// Ice cream shop UI
// ----------------------------------------------------------------------------------------------------
function initIceCreamShopUI() {
  const panel = panels[SHOPS.ICE_CREAM_SHOP]
  const content = panel.querySelector('.content')

  const ids = Array(ICE_CREAM_SHOP_CONFIG.length - 1).fill(-1)
  const flavorIds = new Set()

  const steps = []
  const coneScoopItems = []
  const flavorItems = []
  const nextBtns = []

  let scoopIdx = -1
  let flavorStepTitle = null
  let orderBtn = null
  let flavorDirty = false

  function resetFlavor() {
    flavorIds.clear()

    for (const flavor of flavorItems) {
      flavor.classList.remove('selected', 'disabled')
    }

    addDisabled(orderBtn)
    flavorDirty = false
  }

  function reset() {
    resetOrder(panel, ids, content, nextBtns)
    resetFlavor()
    resetSteps(steps)
  }

  function updateConeScoopItems(coneFlavorId) {
    const offset = coneFlavorId === 0 ? 0 : 2
    const other = 2 - offset

    for (const [item, baseIndex] of coneScoopItems) {
      item.classList.remove(`i-${baseIndex + other}-${ICE_CREAM_ITEM_SLOT_COUNT}`)
      item.classList.add(`i-${baseIndex + offset}-${ICE_CREAM_ITEM_SLOT_COUNT}`)
    }
  }

  function commitScoopIdx(id) {
    if (scoopIdx != id && flavorDirty) resetFlavor()

    scoopIdx = id
    flavorStepTitle.textContent = ICE_CREAM_FLAVOR_STEP_TITLES[scoopIdx]
  }

  function createItems(idx, stepId, start, count, list, nextBtn) {
    for (let i = start, id = 0; i < start + count; i++, id++) {
      const item = document.createElement('button')

      item.className = getItemClassName(i, ICE_CREAM_ITEM_SLOT_COUNT)

      item.addEventListener('click', () => {
        if (item.classList.contains('selected')) {
          ids[idx] = -1
        } else {
          removeSelected(list.querySelector('.selected'))
          ids[idx] = id

          if (stepId === 'coneFlavor') updateConeScoopItems(id)
        }

        const isSelected = ids[idx] !== -1

        item.classList.toggle('selected', isSelected)
        nextBtn?.classList.toggle('disabled', !isSelected)
      })

      list.appendChild(item)

      if (stepId === 'coneScoop') coneScoopItems.push([item, i])
    }
  }

  function createFlavorItems(count, list) {
    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement('div')
      const item = document.createElement('button')
      const name = document.createElement('span')

      wrapper.className = 'item-wrapper'

      item.className = getItemClassName(i + ICE_CREAM_FLAVOR_START, ICE_CREAM_FLAVOR_SLOT_COUNT)
      flavorItems.push(item)

      name.className = 'item-name'
      name.textContent = ICE_CREAM_FLAVOR_NAMES[i]

      item.addEventListener('click', () => {
        if (item.classList.contains('selected')) {
          flavorIds.delete(i)
          removeSelected(item)

          if (flavorIds.size === scoopIdx) {
            for (const flavor of flavorItems) {
              removeDisabled(flavor)
            }

            addDisabled(orderBtn)
          }
        } else {
          flavorIds.add(i)
          addSelected(item)

          if (flavorIds.size === scoopIdx + 1) {
            for (const flavor of flavorItems) {
              if (!flavor.classList.contains('selected')) addDisabled(flavor)
            }

            removeDisabled(orderBtn)
          }
        }

        flavorDirty = true
      })

      wrapper.append(item, name)
      list.appendChild(wrapper)
    }
  }

  for (let i = 0; i < ICE_CREAM_SHOP_CONFIG.length; i++) {
    const step = document.createElement('div')

    if (i === 0) addVisible(step)

    step.setAttribute('data-step', i)
    steps.push(step)
  }

  content.append(...steps)

  let start = 0

  for (const [idx, cfg] of ICE_CREAM_SHOP_CONFIG.entries()) {
    const { id: stepId, title, count, back, backMap, next, nextMap } = cfg

    const step = steps[idx]
    const h2 = document.createElement('h2')
    const list = document.createElement('div')
    const btns = document.createElement('div')

    let nextBtn = null

    h2.textContent = title
    list.className = 'list'
    btns.className = 'btns'

    if (back != undefined || backMap)
      btns.appendChild(createNavBtn(panel, 'Back', steps, idx, () => back ?? backMap[ids[0]]))

    if (next != undefined || nextMap) {
      nextBtn = createNavBtn(
        panel,
        'Next',
        steps,
        idx,
        () => next ?? nextMap[ids[0]],
        () => {
          if (stepId === 'cupScoop' || stepId === 'coneScoop') commitScoopIdx(ids[idx])
        },
      )

      btns.appendChild(nextBtn)
      nextBtns.push(nextBtn)
    }

    if (stepId === 'flavor') {
      flavorStepTitle = h2

      orderBtn = createOrderBtn(SHOPS.ICE_CREAM_SHOP, () => [ids[0], ids[2], ...flavorIds], reset)
      btns.appendChild(orderBtn)

      createFlavorItems(count, list)
    } else {
      createItems(idx, stepId, start, count, list, nextBtn)
    }

    step.append(h2, list, btns)

    start += count
  }
}

// ----------------------------------------------------------------------------------------------------
// Pizzeria UI
// ----------------------------------------------------------------------------------------------------
function initPizzeriaUI() {
  const panel = panels[SHOPS.PIZZERIA]
  const content = panel.querySelector(`.content`)

  const ids = Array(PIZZERIA_CONFIG.length).fill(-1)
  const orderBtn = createOrderBtn(
    SHOPS.PIZZERIA,
    () => [...ids],
    () => resetOrder(panel, ids, content, [orderBtn]),
  )

  let start = 0

  for (const [idx, cfg] of PIZZERIA_CONFIG.entries()) {
    content.appendChild(createSection(cfg, start, PIZZERIA_SLOT_COUNT, ids, idx, orderBtn))

    start += cfg.count
  }

  panel.appendChild(orderBtn)
}

// ----------------------------------------------------------------------------------------------------
// NPCs
// ----------------------------------------------------------------------------------------------------
function initNPCs() {
  for (let i = 0; i < NPC_COUNT; i++) {
    const name = `npc${i}`
    const model = models[name]
    let anims = NPC_ANIMS[i]

    const split = Array.isArray(anims)

    if (!split) anims = [anims]

    animatedModels.push({ name, model, clipKey: 'player', anims, default: anims[0], split })
  }
}

// ----------------------------------------------------------------------------------------------------
// Butterflies
// ----------------------------------------------------------------------------------------------------
function initButterflies() {
  for (const inst of BUTTERFLY_INSTANCES) {
    const { name, color } = inst

    const group = new THREE.Group()
    scene.add(group)

    const butterfly = SkeletonUtils.clone(models.butterfly)

    butterfly.traverse((node) => {
      if (!node.isMesh) return

      const geom = node.geometry.clone()
      setVertexColor(geom, color, isWhite)
      node.geometry = geom
    })

    group.add(butterfly)

    inst.group = group
    inst.t = BUTTERFLY_T
    inst.butterfly = butterfly

    animatedModels.push({ name, model: butterfly, clipKey: 'butterfly', default: ANIMS.MAIN })
  }
}

// ----------------------------------------------------------------------------------------------------
// Boat
// ----------------------------------------------------------------------------------------------------
let boat = null
let boatAngle = BOAT_INIT_ANG

function initBoat() {
  boat = models.boat
  scene.add(boat)
}

// ----------------------------------------------------------------------------------------------------
// Animations
// ----------------------------------------------------------------------------------------------------
const animationMixers = []
const actions = {}
let playerActions = null
let npc4HeadAction = null
let npc4LeftArmActions = null

const currAnims = fromKeys(ANIM_PART_LIST)
const targetAnims = fromKeys(ANIM_PART_LIST, () => ({ anim: null, fade: ANIM_FADE, refPart: null }))
let targetAnimsDirty = false

function categorizeTracks(clip) {
  const tracks = fromKeys(ANIM_PART_LIST, () => [])

  for (const track of clip.tracks) {
    const name = track.name.slice(0, track.name.lastIndexOf('.'))

    if (HEAD_KEYWORDS.some((keyword) => name.includes(keyword))) {
      tracks[ANIM_PARTS.HEAD].push(track)
    } else if (ARM_KEYWORDS.some((keyword) => name.includes(keyword))) {
      if (/L\d*$/.test(name)) tracks[ANIM_PARTS.ARM_L].push(track)
      else if (/R\d*$/.test(name)) tracks[ANIM_PARTS.ARM_R].push(track)
    } else {
      tracks[ANIM_PARTS.BODY].push(track)
    }
  }

  return tracks
}

function createClipActions(mixer, clip) {
  const { name, duration } = clip
  const tracks = categorizeTracks(clip)
  const isArmOnlyAnim = ARM_ANIM_PREFIXES.some((prefix) => name.startsWith(prefix))

  const clipActions = {}

  for (const part of ANIM_PART_LIST) {
    clipActions[part] =
      isArmOnlyAnim && !part.startsWith('arm')
        ? null
        : mixer.clipAction(new THREE.AnimationClip(`${name}-${part}`, duration, tracks[part]))
  }

  return clipActions
}

function setLoopOnce(action) {
  action.setLoop(THREE.LoopOnce, 1)
  action.clampWhenFinished = true
}

function getRandTime(action) {
  return Math.random() * action.getClip().duration
}

function playAction(action, time) {
  action.time = time
  action.play()
}

function initAnimations() {
  for (const {
    name,
    model,
    clipKey,
    anims,
    default: defaultAnim,
    split = false,
  } of animatedModels) {
    const mixer = new THREE.AnimationMixer(model)

    animationMixers.push(mixer)
    actions[name] = {}

    for (const clip of animationClips[clipKey]) {
      const clipName = clip.name.split('.')[0]

      if (anims && !anims.includes(clipName)) continue

      const action = split ? createClipActions(mixer, clip) : mixer.clipAction(clip)

      if (LOOP_ONCE_ANIMS.includes(clipName)) {
        if (split) {
          for (const part of ANIM_PART_LIST) {
            setLoopOnce(action[part])
          }
        } else {
          setLoopOnce(action)
        }
      }

      actions[name][clipName] = action
    }

    let animName = defaultAnim

    if (name === 'player') {
      if (DEV.skipIntro) animName = DEV_ANIM

      for (const part of ANIM_PART_LIST) {
        currAnims[part] = animName
      }
    }

    const action = actions[name][animName]
    let time = 0

    if (name.startsWith('npc'))
      time = split ? getRandTime(action[ANIM_PARTS.BODY]) : getRandTime(action)

    if (split) {
      for (const part of ANIM_PART_LIST) {
        playAction(action[part], time)
      }
    } else {
      playAction(action, time)
    }
  }

  playerActions = actions.player
  npc4HeadAction = actions.npc4[NPC_ANIMS[4][0]][ANIM_PARTS.HEAD]
  npc4LeftArmActions = Object.fromEntries(
    Object.entries(actions.npc4).map(([anim, actions]) => [anim, actions[ANIM_PARTS.ARM_L]]),
  )

  advanceSetupProgress()
}

// ----------------------------------------------------------------------------------------------------
// Camera state init (intro zoom)
// ----------------------------------------------------------------------------------------------------
const camPos = new THREE.Vector3()
const lookTarget = new THREE.Vector3()
let camDesiredYaw, camYaw, camDesiredDistance, camAllowedDistance, camDistance, camOffset

function initCamera() {
  const restoreState = DEV.restoreLastState && devLastState

  camDesiredYaw = restoreState ? devLastState.camYaw : player.rotation.y + PI
  camYaw = camDesiredYaw

  camDesiredDistance = DEV.skipIntro
    ? restoreState
      ? devLastState.camDistance
      : INTRO_CAM_DIST_TARGET
    : INTRO_CAM_DIST_START
  camAllowedDistance = camDesiredDistance
  camDistance = camDesiredDistance

  camOffset = DEV.skipIntro ? INTRO_CAM_OFFSET_TARGET : INTRO_CAM_OFFSET_START

  lookTarget.set(player.position.x, player.position.y + LOOK_TARGET_OFFSET, player.position.z)

  camera.position.set(
    lookTarget.x - Math.sin(camYaw) * camDesiredDistance,
    lookTarget.y + camOffset,
    lookTarget.z - Math.cos(camYaw) * camDesiredDistance,
  )

  camera.lookAt(lookTarget)
  camPos.copy(camera.position)
}

// ----------------------------------------------------------------------------------------------------
// Guide panel
// ----------------------------------------------------------------------------------------------------
const guidePanel = document.getElementById('guide-panel')
let isGuideVisible = false

function show(el, isVisible) {
  if (isVisible) return isVisible

  addVisible(el)
  return true
}

function hide(el, isVisible) {
  if (!isVisible) return isVisible

  removeVisible(el)
  return false
}

// ----------------------------------------------------------------------------------------------------
// Keyboard input
// ----------------------------------------------------------------------------------------------------
const keys = new Set()

let isIntroZoomActive = true

let eJustPressed = false
let eDown = false

function initKeyboardInput() {
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.altKey || e.code === ESC_KEY) return resetInputState()

    if (INPUT_KEYS.includes(e.code)) e.preventDefault()

    if (isIntroZoomActive) return
    if (uiActive && e.code !== INTERACT_KEY) return
    if (binocularsActive && e.code !== INTERACT_KEY) return

    if (e.code === INTERACT_KEY && !eDown) {
      eJustPressed = true
      eDown = true
    }

    keys.add(e.code)
  })

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code)

    if (e.code === INTERACT_KEY) eDown = false
  })

  window.addEventListener('blur', resetInputState)

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resetInputState()
    }
  })
}

function resetInputState() {
  keys.clear()
  eDown = false
  eJustPressed = false
}

// ----------------------------------------------------------------------------------------------------
// Mouse input
// ----------------------------------------------------------------------------------------------------
function initMouseInput() {
  const canvas = renderer.domElement

  let isDragging = false
  let lastX = 0

  canvas.addEventListener('mousedown', (e) => {
    if (isIntroZoomActive) return
    if (binocularsActive) return
    if (e.button !== 0) return

    isDragging = true
    lastX = e.clientX
  })

  window.addEventListener('mouseup', () => {
    isDragging = false
  })

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return

    const dx = e.clientX - lastX
    lastX = e.clientX
    camDesiredYaw -= dx * MOUSE_YAW_SPEED
  })

  canvas.addEventListener('contextmenu', (e) => e.preventDefault())

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      if (isIntroZoomActive) return
      if (binocularsActive) return

      camDesiredDistance = THREE.MathUtils.clamp(
        camDesiredDistance + e.deltaY * MOUSE_ZOOM_SPEED,
        MIN_CAM_DESIRED_DIST,
        MAX_CAM_DESIRED_DIST,
      )
    },
    { passive: false },
  )
}

// ----------------------------------------------------------------------------------------------------
// Update intro camera
// ----------------------------------------------------------------------------------------------------
function updateIntroCamera(dt) {
  let distErr = Math.abs(camDesiredDistance - INTRO_CAM_DIST_TARGET)
  let heightErr = Math.abs(camOffset - INTRO_CAM_OFFSET_TARGET)

  const nearFinish = distErr < INTRO_FINISH_EPS || heightErr < INTRO_FINISH_EPS

  const kDist = nearFinish ? INTRO_DAMPING_FAST : INTRO_CAM_DIST_DAMPING
  const kHeight = nearFinish ? INTRO_DAMPING_FAST : INTRO_CAM_OFFSET_DAMPING

  camDesiredDistance = THREE.MathUtils.damp(camDesiredDistance, INTRO_CAM_DIST_TARGET, kDist, dt)
  camOffset = THREE.MathUtils.damp(camOffset, INTRO_CAM_OFFSET_TARGET, kHeight, dt)

  distErr = Math.abs(camDesiredDistance - INTRO_CAM_DIST_TARGET)
  heightErr = Math.abs(camOffset - INTRO_CAM_OFFSET_TARGET)

  if (distErr < INTRO_FINISH_EPS && heightErr < INTRO_FINISH_EPS) {
    camDesiredDistance = INTRO_CAM_DIST_TARGET
    camOffset = INTRO_CAM_OFFSET_TARGET

    setTargetAnims(ANIMS.IDLE, INTRO_ANIM_FADE)

    isGuideVisible = show(guidePanel, isGuideVisible)

    setTimeout(() => {
      isGuideVisible = hide(guidePanel, isGuideVisible)
    }, GUIDE_DISPLAY_TIME)

    isIntroZoomActive = false
    keys.clear()
  }
}

// ----------------------------------------------------------------------------------------------------
// Update orders
// ----------------------------------------------------------------------------------------------------
function createOrder(shop) {
  return {
    shop,
    time: 0,
    ids: null,
    items: [],
    count: 0,
    ordered: false,
    received: false,
    ready: false,
  }
}

const orders = {}

for (const shop of SHOP_LIST) {
  orders[shop] = createOrder(shop)
}

function setNPC4Offering(offering) {
  const { [ANIMS.IDLE]: idle, [ANIMS.OFFER]: offer } = npc4LeftArmActions

  if (offering) {
    idle.stop()
    offer.reset().play()
    return
  }

  offer.fadeOut(ANIM_FADE)

  idle.reset()
  idle.time = npc4HeadAction.time
  idle.fadeIn(ANIM_FADE).play()
}

function prepareIceCreamOrder(order) {
  const { shop, ids, items } = order
  const scoopIdx = ids.length - 3

  if (ids[0] === 0) {
    const item = counterItems[`${shop}_${scoopIdx}`]
    const mats = item.mats

    for (let i = 0; i < mats.length; i++) {
      const { prefix, mesh } = mats[i]

      mesh.material = itemMats[`${prefix}${ids[i + 2]}`]
    }

    items.push(item, counterItems[`${shop}_spoon`])
  } else {
    const item = npc4Items[scoopIdx]

    for (let i = 0; i < item.length; i++) {
      const { mesh, prefix } = item[i]

      mesh.material = itemMats[`${prefix}${ids[i + 1]}`]
      mesh.visible = true
    }

    setNPC4Offering(true)
  }
}

function prepareRegularOrder(order) {
  const { shop, ids, items } = order
  const placementIdx = ids[0] !== -1 && ids[1] !== -1 ? 0 : 1

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]

    if (id === -1) continue

    const item = counterItems[`${shop}_${i}_${id}`][placementIdx]

    for (const { prefix, mesh } of item.mats) {
      mesh.material = itemMats[`${prefix}${id}`]
    }

    items.push(item)
  }
}

function prepareOrder(order) {
  const { shop, items } = order

  if (shop === SHOPS.ICE_CREAM_SHOP) prepareIceCreamOrder(order)
  else prepareRegularOrder(order)

  order.count = items.length || 1

  for (const { ref, colliders } of items) {
    ref.visible = true

    for (const collider of colliders) {
      addColliderToSections(collider)
    }
  }
}

function updateOrders(now) {
  for (const shop of SHOP_LIST) {
    const order = orders[shop]
    const { time, ordered, received } = order

    if (time === 0) continue

    if (ordered) {
      order.ordered = false
      order.received = true

      prepareOrder(order)
    } else if (received && now - time >= ORDER_CONFIRM_TIME) {
      order.time = 0
      order.received = false
      order.ready = true
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Interaction handlers
// ----------------------------------------------------------------------------------------------------
function clearNPC4Hand(order) {
  for (const { mesh } of npc4Items[order.ids.length - 3]) {
    mesh.visible = false
  }
}

function clearCounter(order) {
  for (const { ref, colliders } of order.items) {
    ref.visible = false

    for (const collider of colliders) {
      removeColliderFromSections(collider)
    }
  }

  order.items.length = 0
}

function clearOrder(order) {
  const { shop, ids } = order

  if (shop === SHOPS.ICE_CREAM_SHOP && ids[0] === 1) clearNPC4Hand(order)
  else clearCounter(order)
}

const hands = fromKeys(HAND_KEYS)

let freeHandCount = 2
let hasOnlyDrinks = false

function updateHandState() {
  const { l, r } = hands

  freeHandCount = (!l ? 1 : 0) + (!r ? 1 : 0)
  hasOnlyDrinks = !!(l || r) && (!l || l.isDrink) && (!r || r.isDrink)
}

function equipIceCreamHand(item, handKey, ids, matIdOffset) {
  const {
    [handKey]: { meshes, mats },
    hold,
    eat,
    isDrink,
  } = item

  for (let i = 0; i < mats.length; i++) {
    const { mesh, matStr } = mats[i]

    mesh.material = itemMats[`${matStr}${ids[i + matIdOffset]}`]
  }

  for (const mesh of meshes) {
    mesh.visible = true
  }

  hands[handKey] = { meshes, hold, eat, isDrink }
}

function equipIceCreamOrder(shop, ids) {
  const containerId = ids[0]
  const item = playerItems[`${shop}_${containerId}_${ids.length - 3}`]

  if (containerId === 0) {
    for (const h of ['l', 'r']) {
      equipIceCreamHand(item, h, ids, 2)
    }
  } else {
    equipIceCreamHand(item, !hands.r ? 'r' : 'l', ids, 1)
    setNPC4Offering(false)
  }
}

function equipRegularOrder(shop, ids) {
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]

    if (id === -1) continue

    const item = playerItems[`${shop}_${i}_${id}`]
    const { hold, eat, isDrink } = item
    const h = !hands.r ? 'r' : 'l'

    for (const handKey of [h, h + 'e']) {
      const handItem = item[handKey]

      if (!handItem) continue

      const { meshes, mats } = handItem

      for (const { mesh, matStr } of mats) {
        mesh.material = itemMats[matStr.endsWith('_') ? `${matStr}${id}` : matStr]
      }

      hands[handKey] = { meshes, hold, eat, isDrink }
    }

    for (const mesh of hands[h].meshes) {
      mesh.visible = true
    }
  }
}

function equipOrder(order) {
  const { shop, ids } = order

  if (shop === SHOPS.ICE_CREAM_SHOP) equipIceCreamOrder(shop, ids)
  else equipRegularOrder(shop, ids)
}

function setHoldTargetAnims(fade) {
  const { l, r } = hands

  if (l) setTargetAnim(ANIM_PARTS.ARM_L, l.hold, fade)
  if (r) setTargetAnim(ANIM_PARTS.ARM_R, r.hold, fade)
}

function pickupOrder(order) {
  if (freeHandCount < order.count) return

  clearOrder(order)
  equipOrder(order)
  setHoldTargetAnims(0)
  updateHandState()

  order.ready = false
}

function interactShop(active) {
  const { shop, isKiosk } = active
  const order = orders[shop]
  const { received, ready } = order

  if (received) return

  if (ready && isKiosk) return

  if (ready) return pickupOrder(order)

  toggleSidePanel(active)
}

function setSitting(skirtSit, sitAnim) {
  isWalking = false
  isJumping = false
  isFalling = false
  isSitting = true

  skirtSit.visible = true
  outfit.skirt.visible = false

  setTargetAnims(sitAnim)
}

function sit(pos, quat, facingAxis, rightDir, skirtSit, sitAnim, onBench = false) {
  player.position.copy(pos)
  player.quaternion.copy(quat)
  player.sitState = { facingAxis, rightDir, onBench }

  velocity.set(0, 0, 0)
  keys.clear()

  setSitting(skirtSit, sitAnim)
}

function getClosestPlateSlots(handSide) {
  const { x, z } = player.position
  const { facingAxis, rightDir, onBench } = player.sitState

  const facingX = facingAxis === 'x'
  const weight = onBench ? 1 : PLATE_SLOT_FACING_DIST_WEIGHT
  const wX = facingX ? weight : 1
  const wZ = facingX ? 1 : weight

  let targetX = x
  let targetZ = z

  if (handSide) {
    const [rx, , rz] = rightDir
    const handSign = handSide === 'r' ? 1 : -1

    targetX += handSign * rx * HAND_OFFSET
    targetZ += handSign * rz * HAND_OFFSET
  }

  const plateSlots = sections[getSectionKey(x, z)][SECTION_CONTENT.PLATE_SLOTS]
  const candidates = []

  for (const { anchor, pos } of plateSlots) {
    const [ax, , az] = pos
    const centerDx = Math.abs(x - ax)
    const centerDz = Math.abs(z - az)

    if (centerDx > MAX_PLATE_SLOT_DELTA || centerDz > MAX_PLATE_SLOT_DELTA) continue
    if (centerDx < MIN_PLATE_SLOT_DELTA && centerDz < MIN_PLATE_SLOT_DELTA) continue

    const dx = Math.abs(targetX - ax)
    const dz = Math.abs(targetZ - az)
    const weightedDistSq = wX * dx * dx + wZ * dz * dz

    candidates.push([weightedDistSq, anchor])
  }

  return candidates
    .sort(([a], [b]) => a - b)
    .slice(0, 2)
    .map(([, anchor]) => anchor)
}

const placedPlates = []

function placePlates() {
  const { le, re } = hands
  const plateCount = (le ? 1 : 0) + (re ? 1 : 0)

  if (!plateCount) return

  const handSide = plateCount !== 1 ? null : le ? 'l' : 'r'
  const closestPlateSlots = getClosestPlateSlots(handSide)

  for (let i = 0; i < plateCount; i++) {
    const anchor = closestPlateSlots[i]
    let plate = anchor.getObjectByName('plate')

    if (!plate) {
      plate = models.plate.clone(true)
      anchor.add(plate)
    }

    plate.visible = true
    placedPlates.push(plate)
  }
}

function collectPlates() {
  for (const plate of placedPlates) {
    plate.visible = false
  }

  placedPlates.length = 0
}

function setEatTargetAnims() {
  const { l, r } = hands

  if (l) setTargetAnim(ANIM_PARTS.ARM_L, l.eat)
  if (r) setTargetAnim(ANIM_PARTS.ARM_R, r.eat)
}

function setEating(eating) {
  isEating = eating

  for (const h of ['l', 'r']) {
    const hand = hands[h]

    if (!hand) continue

    const handEat = hands[h + 'e']

    if (!handEat) continue

    for (const mesh of hand.meshes) {
      mesh.visible = !eating
    }

    for (const mesh of handEat.meshes) {
      mesh.visible = eating
    }
  }

  if (eating) {
    placePlates()
    setEatTargetAnims()
  } else {
    collectPlates()
    setHoldTargetAnims()
  }
}

function interactSeat(active) {
  if (freeHandCount === 2 ? isSitting : isEating) return

  if (!isSitting) {
    const { sitPos, sitQuat, facingAxis, rightDir, skirtSit, sitAnim } = active

    return sit(sitPos, sitQuat, facingAxis, rightDir, skirtSit, sitAnim)
  }

  setEating(true)
}

function getClosestSeat(seats) {
  const { x: playerX, z: playerZ } = player.position

  let closest = null
  let closestDistSq = Infinity

  for (const seat of seats) {
    const { x, z } = seat.pos

    const dx = playerX - x
    const dz = playerZ - z
    const distSq = dx * dx + dz * dz

    if (distSq < closestDistSq) {
      closestDistSq = distSq
      closest = seat
    }
  }

  return closest
}

function interactMultiSeat(active) {
  if (freeHandCount === 2 ? isSitting : isEating) return

  if (!isSitting) {
    const { seats, skirtSit, sitAnim } = active
    const { pos, quat, facingAxis, rightDir } = getClosestSeat(seats)
    const isBench = active.type === INTERACTABLE_TYPES.BENCH

    return sit(pos, quat, facingAxis, rightDir, skirtSit, sitAnim, isBench)
  }

  setEating(true)
}

function toggleLights(active) {
  active.isOn = !active.isOn

  if (active.pointLights) {
    for (const light of active.pointLights) {
      light.intensity = active.isOn ? POINT_LIGHT_INTENSITY : 0
    }
  }

  if (active.emitter)
    active.emitter.material.emissiveIntensity = active.isOn ? EMISSIVE_INTENSITY : 0
}

let binocularsActive = null

function toggleBinoculars(active) {
  active.isActive = !active.isActive

  if (active.isActive) {
    lookTarget.copy(BINOCULARS_LOOK_TARGET)
    camera.position.copy(BINOCULARS_CAMERA_POS)
    camera.lookAt(lookTarget)

    addVisible(binocularsMask)
    binocularsActive = active

    keys.clear()
  } else {
    removeVisible(binocularsMask)
    binocularsActive = null
  }
}

function toggleTV(active) {
  active.isOn = !active.isOn
  ;(active.isOn ? turnTVOn : turnTVOff)(active.screen.material)
}

function toggleCandle(active) {
  active.isOn = !active.isOn
  active.fire.visible = active.isOn

  if (!active.isOn) active.fire.scale.set(...S1)
}

function resetArmTargetAnims() {
  const headAnim = currAnims[ANIM_PARTS.HEAD]

  setTargetAnim(ANIM_PARTS.ARM_L, headAnim, undefined, ANIM_PARTS.HEAD)
  setTargetAnim(ANIM_PARTS.ARM_R, headAnim, undefined, ANIM_PARTS.HEAD)
}

function emptyHands() {
  for (const handKey of HAND_KEYS) {
    const hand = hands[handKey]

    if (!hand) continue

    for (const mesh of hand.meshes) {
      mesh.visible = false
    }

    hands[handKey] = null
  }

  resetArmTargetAnims()
  updateHandState()
}

let activeTrashBins = []

function useTrashBin(active) {
  if (active.isActive) return

  active.isActive = true
  active.isOpening = true
  active.angle = 0

  activeTrashBins.push(active)

  emptyHands()
}

let activeDoors = []

function toggleDoor(active) {
  active.isOpen = !active.isOpen
  active.isActive = true

  if (!activeDoors.includes(active)) activeDoors.push(active)

  const { isOpen, colliders } = active

  const closed = colliders[0]
  const open = colliders[1]

  removeColliderFromSections(isOpen ? closed : open)
  addColliderToSections(isOpen ? open : closed)
}

let uiActive = null

const letter = document.getElementById('letter')

function interactMailbox(active) {
  const nextState = (active.state + 1) % MAILBOX_STATE_COUNT

  active.state = nextState

  if (nextState === MAILBOX_STATES.OPEN || nextState === MAILBOX_STATES.CLOSED) {
    active.isOpen = !active.isOpen
    active.isActive = true

    if (!activeDoors.includes(active)) activeDoors.push(active)

    const collider = active.colliders[0]

    if (nextState === MAILBOX_STATES.OPEN) addColliderToSections(collider)
    else if (nextState === MAILBOX_STATES.CLOSED) removeColliderFromSections(collider)
  } else if (nextState === MAILBOX_STATES.READING) {
    addVisible(letter)
    uiActive = active

    keys.clear()
  } else if (nextState === MAILBOX_STATES.READ) {
    removeVisible(letter)
    uiActive = null
  }
}

function toggleSidePanel(active) {
  const open = (active.isPanelOpen = !active.isPanelOpen)

  ;(open ? addVisible : removeVisible)(active.panel)
  uiActive = open ? active : null

  if (open) keys.clear()
}

// ----------------------------------------------------------------------------------------------------
// Update interaction
// ----------------------------------------------------------------------------------------------------
const prompt = document.getElementById('interaction-prompt')
const actionKey = prompt.querySelector('svg')
const actionText = prompt.querySelector('p')

let isPromptVisible = false
let isKeyVisible = false
let newActionText = ''
let promptFn = show
let keyFn = show

function isInsideTrigger(trigger) {
  const { x, z } = player.position
  const { type, cX, cZ, radius, minX, maxX, minZ, maxZ } = trigger

  switch (type) {
    case BOUNDS_TYPES.CIRCLE: {
      const dx = x - cX
      const dz = z - cZ

      return dx * dx + dz * dz < radius * radius
    }

    case BOUNDS_TYPES.AABB:
      return x > minX && x < maxX && z > minZ && z < maxZ
  }

  return false
}

function getActiveInteractable() {
  const { x, z } = player.position
  const section = sections[getSectionKey(x, z)]

  if (!section) return null

  let active = null

  for (const interactable of section.interactables) {
    for (const trigger of interactable.triggers) {
      if (isInsideTrigger(trigger)) {
        active = interactable
        break
      }
    }

    if (active) break
  }

  return active
}

function updateSeatPrompt() {
  if (!isSitting) return

  if (!(hands.r || hands.l) || isEating) {
    promptFn = hide
    return
  }

  newActionText = hasOnlyDrinks ? 'Drink' : 'Eat'
}

function updateShopPrompt(active) {
  const { isPanelOpen, shop, isKiosk } = active

  if (isPanelOpen) {
    newActionText = 'Close menu'
    return
  }

  const { received, ready, count } = orders[shop]

  if (received) {
    newActionText = 'Thanks for your order!'
    keyFn = hide
    return
  }

  if (!ready) {
    newActionText = 'Start order'
    return
  }

  if (isKiosk) {
    newActionText = 'Your order is ready!'
    keyFn = hide
    return
  }

  if (freeHandCount < count) {
    newActionText = freeHandCount === 0 ? 'Your hands are full!' : 'You need both hands free!'
    keyFn = hide
    return
  }

  newActionText = 'Pick up the order'
}

function updateHud(active) {
  promptFn = show
  keyFn = show

  if (active) {
    switch (active.type) {
      case INTERACTABLE_TYPES.CHAIR:
      case INTERACTABLE_TYPES.STOOL:
      case INTERACTABLE_TYPES.CUSHION:
      case INTERACTABLE_TYPES.SOFA:
      case INTERACTABLE_TYPES.BENCH:
        newActionText = SEAT_ACTION_TEXTS[active.type]
        updateSeatPrompt()
        break

      case INTERACTABLE_TYPES.LIGHT:
        newActionText = active.isOn ? 'Turn off the light' : 'Turn on the light'
        break

      case INTERACTABLE_TYPES.LIGHTHOUSE:
        newActionText = active.isOn
          ? 'Turn off the lighthouse light'
          : 'Turn on the lighthouse light'
        break

      case INTERACTABLE_TYPES.BINOCULARS:
        newActionText = active.isActive ? 'Exit binoculars' : 'Use binoculars'
        break

      case INTERACTABLE_TYPES.TV:
        newActionText = active.isOn ? 'Turn off the TV' : 'Turn on the TV'
        break

      case INTERACTABLE_TYPES.CANDLE:
        newActionText = active.isOn ? 'Blow out the candle' : 'Light the candle'
        break

      case INTERACTABLE_TYPES.TRASH_BIN:
        newActionText = 'Use the trash bin'
        break

      case INTERACTABLE_TYPES.FITTING_ROOM:
        newActionText = active.isOpen ? 'Close the fitting room door' : 'Open the fitting room door'
        break

      case INTERACTABLE_TYPES.TELEPHONE_BOOTH:
        newActionText = active.isOpen
          ? 'Close the telephone booth door'
          : 'Open the telephone booth door'
        break

      case INTERACTABLE_TYPES.MAILBOX:
        newActionText = MAILBOX_ACTION_TEXTS[active.state]
        break

      case SHOPS.BOUTIQUE:
        newActionText = active.isPanelOpen ? 'Done' : 'Change outfit'
        break

      case INTERACTABLE_TYPES.KIOSK:
      case SHOPS.CAFE:
      case SHOPS.ICE_CREAM_SHOP:
      case SHOPS.PIZZERIA:
        updateShopPrompt(active)
        break
    }

    if (promptFn !== hide && actionText.textContent !== newActionText)
      actionText.textContent = newActionText

    isGuideVisible = hide(guidePanel, isGuideVisible)
    isKeyVisible = keyFn(actionKey, isKeyVisible)
    isPromptVisible = promptFn(prompt, isPromptVisible)
  } else {
    isPromptVisible = hide(prompt, isPromptVisible)
  }
}

function updateInteraction() {
  const active = uiActive ?? binocularsActive ?? getActiveInteractable()

  updateHud(active)

  if (active && eJustPressed) {
    switch (active.type) {
      case INTERACTABLE_TYPES.CHAIR:
      case INTERACTABLE_TYPES.STOOL:
      case INTERACTABLE_TYPES.CUSHION:
        interactSeat(active)
        break

      case INTERACTABLE_TYPES.SOFA:
      case INTERACTABLE_TYPES.BENCH:
        interactMultiSeat(active)
        break

      case INTERACTABLE_TYPES.LIGHT:
      case INTERACTABLE_TYPES.LIGHTHOUSE:
        toggleLights(active)
        break

      case INTERACTABLE_TYPES.BINOCULARS:
        toggleBinoculars(active)
        break

      case INTERACTABLE_TYPES.TV:
        toggleTV(active)
        break

      case INTERACTABLE_TYPES.CANDLE:
        toggleCandle(active)
        break

      case INTERACTABLE_TYPES.TRASH_BIN:
        useTrashBin(active)
        break

      case INTERACTABLE_TYPES.FITTING_ROOM:
      case INTERACTABLE_TYPES.TELEPHONE_BOOTH:
        toggleDoor(active)
        break

      case INTERACTABLE_TYPES.MAILBOX:
        interactMailbox(active)
        break

      case SHOPS.BOUTIQUE:
        toggleSidePanel(active)
        break

      case SHOPS.CAFE:
      case INTERACTABLE_TYPES.KIOSK:
      case SHOPS.ICE_CREAM_SHOP:
      case SHOPS.PIZZERIA:
        interactShop(active)
        break
    }
  }

  eJustPressed = false
}

// ----------------------------------------------------------------------------------------------------
// Update doors
// ----------------------------------------------------------------------------------------------------
function updateDoors(dt) {
  const len = activeDoors.length

  if (len === 0) return

  for (let i = len - 1; i >= 0; i--) {
    const door = activeDoors[i]
    const { isOpen, swingDir, angle, axis, ref } = door

    const stateDir = isOpen ? 1 : -1
    const dir = stateDir * swingDir

    let newAngle = angle + dir * DOOR_SPEED * dt

    newAngle =
      swingDir === -1
        ? Math.max(DOOR_MIN_ANGLE, Math.min(0, newAngle))
        : Math.max(0, Math.min(DOOR_MAX_ANGLE, newAngle))

    door.angle = newAngle
    ref.rotation[axis] = newAngle

    if (
      (isOpen && newAngle === (swingDir === -1 ? DOOR_MIN_ANGLE : DOOR_MAX_ANGLE)) ||
      (!isOpen && newAngle === 0)
    ) {
      door.isActive = false
      activeDoors.splice(i, 1)
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Check collisions
// ----------------------------------------------------------------------------------------------------
const collisionY = { highest: null, lowest: null }

function overlapsCollider(collider, x, y, z) {
  const { type, cX, cZ, radius, minX, maxX, minY, maxY, minZ, maxZ } = collider
  let dx, dz, maxDist

  switch (type) {
    case BOUNDS_TYPES.CIRCLE:
      dx = x - cX
      dz = z - cZ
      maxDist = PLAYER_RADIUS + radius
      break

    case BOUNDS_TYPES.AABB: {
      const closestX = Math.max(minX, Math.min(x, maxX))
      const closestZ = Math.max(minZ, Math.min(z, maxZ))

      dx = x - closestX
      dz = z - closestZ
      maxDist = PLAYER_RADIUS

      break
    }
  }

  const overlapXZ = dx * dx + dz * dz < maxDist * maxDist
  const overlapY = y < maxY && y + PLAYER_HEIGHT > minY

  return overlapXZ && overlapY
}

function collidesAtXZ(x, z) {
  if (x * x + z * z > MAX_DIST_SQ) return true

  const section = sections[getSectionKey(x, z)]

  if (!section) return false

  for (const collider of section.colliders) {
    if (overlapsCollider(collider, x, player.position.y, z)) return true
  }

  return false
}

function collidesAtY(y) {
  const { x, z } = player.position
  const section = sections[getSectionKey(x, z)]

  let highest = null
  let lowest = null

  let maxY = GROUND_Y
  let minY = Infinity

  if (section) {
    for (const collider of section.colliders) {
      if (!overlapsCollider(collider, x, y, z)) continue

      if (collider.maxY > maxY && collider.oneWay !== 'ceiling') {
        maxY = collider.maxY
        highest = collider
      }

      if (collider.minY < minY) {
        minY = collider.minY
        lowest = collider
      }
    }
  }

  collisionY.highest = highest
  collisionY.lowest = lowest

  return collisionY
}

// ----------------------------------------------------------------------------------------------------
// Update movement
// ----------------------------------------------------------------------------------------------------
const moveForwardDir = new THREE.Vector3()
const moveRightDir = new THREE.Vector3()
const velocity = new THREE.Vector3()
const desiredVelocity = new THREE.Vector3()
const targetQuat = new THREE.Quaternion()

let isWalking = false
let isJumping = false
let isFalling = false
let isSitting = false
let isEating = false

let jumpEndPlayed = false

function getAxisInput(pos, neg) {
  return (
    (keys.has(pos[0]) || keys.has(pos[1]) ? 1 : 0) - (keys.has(neg[0]) || keys.has(neg[1]) ? 1 : 0)
  )
}

function setStanding() {
  const { skirt, skirtSit, skirtSitFloor } = outfit

  if (isEating) setEating(false)

  isSitting = false

  skirt.visible = true
  skirtSit.visible = false
  skirtSitFloor.visible = false
}

function computeDesiredVelocity(x, z) {
  moveForwardDir.set(Math.sin(camYaw), 0, Math.cos(camYaw))
  moveRightDir.set(moveForwardDir.z, 0, -moveForwardDir.x)

  desiredVelocity
    .addScaledVector(moveRightDir, x)
    .addScaledVector(moveForwardDir, z)
    .normalize()
    .multiplyScalar(MOVE_SPEED)
}

function updateHorizontalMovement(dt, a, x, z, hasMoveInput) {
  desiredVelocity.set(0, 0, 0)

  if (hasMoveInput) {
    computeDesiredVelocity(x, z)

    targetQuat.setFromAxisAngle(UP_VECTOR, Math.atan2(desiredVelocity.x, desiredVelocity.z))
    player.quaternion.slerp(targetQuat, a)
  }

  velocity.x = THREE.MathUtils.damp(velocity.x, desiredVelocity.x, VELOCITY_DAMPING, dt)
  velocity.z = THREE.MathUtils.damp(velocity.z, desiredVelocity.z, VELOCITY_DAMPING, dt)

  if (desiredVelocity.x === 0 && Math.abs(velocity.x) < VELOCITY_SNAP_EPS) velocity.x = 0
  if (desiredVelocity.z === 0 && Math.abs(velocity.z) < VELOCITY_SNAP_EPS) velocity.z = 0

  // Update X position
  if (velocity.x !== 0) {
    const newX = player.position.x + velocity.x * dt

    if (!collidesAtXZ(newX, player.position.z)) player.position.x = newX
    else velocity.x = 0
  }

  // Update Z position
  if (velocity.z !== 0) {
    const newZ = player.position.z + velocity.z * dt

    if (!collidesAtXZ(player.position.x, newZ)) player.position.z = newZ
    else velocity.z = 0
  }
}

function updateVerticalMovement(dt, hasMoveInput, hasJumpInput) {
  if (hasJumpInput && player.onGround) velocity.y = JUMP_STRENGTH

  if (velocity.x === 0 && velocity.y === 0 && velocity.z === 0 && !hasMoveInput && player.onGround)
    return

  velocity.y += GRAVITY * dt

  const newY = player.position.y + velocity.y * dt

  const { highest, lowest } = collidesAtY(newY)
  const groundY = highest ? highest.maxY : GROUND_Y

  let nextY = newY
  player.onGround = false

  if (velocity.y <= 0 && newY <= groundY) {
    player.onGround = true
    player.onExtended = !!highest?.extended
    nextY = groundY
    velocity.y = 0
  } else if (velocity.y > 0 && lowest && newY + PLAYER_HEIGHT >= lowest.minY) {
    nextY = lowest.minY - PLAYER_HEIGHT
    velocity.y = 0
  }

  player.position.y = nextY
}

function setTargetAnim(part, anim, fade = ANIM_FADE, refPart) {
  const target = targetAnims[part]

  target.anim = anim
  target.fade = fade
  target.refPart = refPart

  targetAnimsDirty = true
}

function setTargetAnims(anim, fade) {
  const { l, r } = hands

  for (const part of ANIM_PART_LIST) {
    if (l && part === ANIM_PARTS.ARM_L) continue
    if (r && part === ANIM_PARTS.ARM_R) continue

    setTargetAnim(part, anim, fade)
  }
}

function setGroundTargetAnims(hasMoveInput, fade) {
  setTargetAnims(hasMoveInput ? ANIMS.WALK : ANIMS.IDLE, fade)
  isWalking = hasMoveInput
}

function updateTargetAnims(hasMoveInput) {
  if (player.onGround) {
    if (isJumping || isFalling) {
      isJumping = false
      isFalling = false
      setGroundTargetAnims(hasMoveInput)
    } else if (hasMoveInput !== isWalking) {
      setGroundTargetAnims(hasMoveInput, hasMoveInput ? ANIM_FADE : WALK_TO_IDLE_FADE)
    }

    return
  }

  const vy = velocity.y

  if (!isJumping && !isFalling) {
    if (vy > 0) {
      isJumping = true
      jumpEndPlayed = false
      setTargetAnims(ANIMS.JUMP_START)
    } else if (vy < 0 && !player.onExtended) {
      isFalling = true
      setTargetAnims(ANIMS.FALL)
    }

    if (isJumping || isFalling) isWalking = false

    return
  }

  if (isJumping && !jumpEndPlayed && vy < 0) {
    jumpEndPlayed = true
    setTargetAnims(ANIMS.JUMP_END, 0)
  }
}

function updateMovement(dt, a) {
  const x = getAxisInput(KEYS_X_POS, KEYS_X_NEG)
  const z = getAxisInput(KEYS_Z_POS, KEYS_Z_NEG)

  const hasMoveInput = !!(x || z)
  const hasJumpInput = keys.has(JUMP_KEY)

  if ((hasMoveInput || hasJumpInput) && isSitting) setStanding()

  updateHorizontalMovement(dt, a, x, z, hasMoveInput)
  updateVerticalMovement(dt, hasMoveInput, hasJumpInput)
  updateTargetAnims(hasMoveInput)
}

// ----------------------------------------------------------------------------------------------------
// Update animations
// ----------------------------------------------------------------------------------------------------
function getCurrAction(part) {
  return playerActions[currAnims[part]][part]
}

function stopCoreActions(part) {
  for (const anim of PLAYER_CORE_ANIM_LIST) {
    playerActions[anim][part].stop()
  }
}

function transition(part, to, fade = ANIM_FADE, refPart) {
  const resolvedTo = ANIM_ALIASES[part]?.[to] ?? to

  if (currAnims[part] === resolvedTo) return

  const targetAction = playerActions[resolvedTo][part]
  const snap = fade === 0

  if (snap) stopCoreActions(part)
  else getCurrAction(part).fadeOut(fade)

  targetAction.reset()

  if (refPart) targetAction.time = getCurrAction(refPart).time
  if (!snap) targetAction.fadeIn(fade)

  targetAction.play()

  currAnims[part] = resolvedTo
}

function updateAnimations() {
  if (!targetAnimsDirty) return

  for (const part of ANIM_PART_LIST) {
    const target = targetAnims[part]

    const { anim, fade, refPart } = target

    if (!anim) continue

    transition(part, anim, fade, refPart)

    target.anim = null
    target.refPart = null
  }

  targetAnimsDirty = false
}

// ----------------------------------------------------------------------------------------------------
// Update animation mixers
// ----------------------------------------------------------------------------------------------------
function updateAnimationMixers(dt) {
  for (const mixer of animationMixers) {
    mixer.update(dt)
  }
}

// ----------------------------------------------------------------------------------------------------
// Update faces (blinking)
// ----------------------------------------------------------------------------------------------------
const blinkTimers = f32Arr(CHARACTER_COUNT)
const nextBlinkTimes = f32Arr(CHARACTER_COUNT)
const isEyeClosed = f32Arr(CHARACTER_COUNT)

const EYE_OPEN = 0
const EYE_CLOSED = 1

for (let i = 0; i < CHARACTER_COUNT; i++) {
  blinkTimers[i] = Infinity
  nextBlinkTimes[i] = 0
  isEyeClosed[i] = EYE_CLOSED
}

function toggleFaceTex(i) {
  const mat = faceMaterials[i]
  const isFemale = mat.name === 'F'
  const { faceOpen, faceOpen2, faceClosed, faceClosed2 } = textures

  isEyeClosed[i] ^= 1

  mat.map =
    isEyeClosed[i] === EYE_CLOSED
      ? isFemale
        ? faceClosed
        : faceClosed2
      : isFemale
        ? faceOpen
        : faceOpen2

  blinkTimers[i] = 0
}

function getNextBlink() {
  return BLINK_OPEN_MIN_TIME + Math.random() * BLINK_OPEN_TIME_VARIATION
}

function updateFaces(dt) {
  for (let i = 0; i < CHARACTER_COUNT; i++) {
    blinkTimers[i] += dt

    if (blinkTimers[i] >= (isEyeClosed[i] === EYE_CLOSED ? BLINK_CLOSED_TIME : nextBlinkTimes[i])) {
      toggleFaceTex(i)

      if (isEyeClosed[i] === EYE_OPEN) nextBlinkTimes[i] = getNextBlink()
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Update effects
// ----------------------------------------------------------------------------------------------------
function updateEffects(t) {
  EFFECTS_TIME.value = t
}

// ----------------------------------------------------------------------------------------------------
// Update butterflies
// ----------------------------------------------------------------------------------------------------
const butterflyGlobalPos = new THREE.Vector3()
const butterflyTangent = new THREE.Vector3()

function updateButterflies(dt, t) {
  for (const inst of BUTTERFLY_INSTANCES) {
    const { path, group, butterfly } = inst

    const pathT = (inst.t + dt * BUTTERFLY_PATH_SPEED) % 1
    inst.t = pathT

    path.getPointAt(pathT, butterflyGlobalPos)
    group.position.copy(butterflyGlobalPos)

    path.getTangentAt(pathT, butterflyTangent).normalize()
    group.rotation.y = Math.atan2(butterflyTangent.x, butterflyTangent.z)

    butterfly.position.set(
      Math.cos(t * BUTTERFLY_FLUTTER_SPEED) * BUTTERFLY_FLUTTER_RADIUS,
      Math.sin(t * BUTTERFLY_FLUTTER_SPEED * BUTTERFLY_BOB_MULT) * BUTTERFLY_FLUTTER_HEIGHT,
      Math.sin(t * BUTTERFLY_FLUTTER_SPEED) * BUTTERFLY_FLUTTER_RADIUS * BUTTERFLY_DEPTH_MULT,
    )

    butterfly.rotation.z = Math.sin(t * BUTTERFLY_ROLL_SPEED) * BUTTERFLY_ROLL_AMP
  }
}

// ----------------------------------------------------------------------------------------------------
// Update ocean
// ----------------------------------------------------------------------------------------------------
function updateOcean(dt, t) {
  oceanTex.offset.x = (oceanTex.offset.x + OCEAN_SPEED_X * dt) % 1
  oceanTex.offset.y = (oceanTex.offset.y + OCEAN_SPEED_Y * dt) % 1

  ocean.position.y = OCEAN_Y + Math.sin(t * OCEAN_SWELL_SPEED) * OCEAN_SWELL_AMP
}

// ----------------------------------------------------------------------------------------------------
// Update boat
// ----------------------------------------------------------------------------------------------------
const boatDir = new THREE.Vector3()
const boatLookTarget = new THREE.Vector3()

function updateBoat(dt) {
  boatAngle -= dt * BOAT_SPEED * TAU

  const posX = Math.cos(boatAngle) * BOAT_PATH_RADIUS
  const posZ = Math.sin(boatAngle) * BOAT_PATH_RADIUS
  boat.position.set(posX, ocean.position.y, posZ)

  boatDir.set(-Math.sin(boatAngle), 0, Math.cos(boatAngle))
  boatLookTarget.addVectors(boat.position, boatDir)

  boat.lookAt(boatLookTarget)
}

// ----------------------------------------------------------------------------------------------------
// Update laptop
// ----------------------------------------------------------------------------------------------------
let laptopTimer = 0
let laptopFrame = 0

function updateLaptop(dt) {
  laptopTimer += dt

  if (laptopTimer < LAPTOP_FRAME_TIME) return

  const col = laptopFrame % LAPTOP_FRAME_COLS
  const row = Math.floor(laptopFrame * INV_LAPTOP_FRAME_COLS)

  laptopScreenTex.offset.set(LAPTOP_SCREEN_W * col, LAPTOP_SCREEN_H * row)

  laptopFrame = (laptopFrame + 1) % LAPTOP_FRAME_COUNT
  laptopTimer = 0
}

// ----------------------------------------------------------------------------------------------------
// Update clocks
// ----------------------------------------------------------------------------------------------------
const clockDate = new Date()
let clockTimer = 1

function updateClocks(dt) {
  clockTimer += dt

  if (clockTimer < 1) return

  clockTimer = 0

  clockDate.setTime(Date.now())

  const hours = clockDate.getHours() % 12
  const minutes = clockDate.getMinutes()
  const seconds = clockDate.getSeconds()

  const hourAngle = (hours + minutes * INV_60) * TAU_DIV_12
  const minuteAngle = (minutes + seconds * INV_60) * TAU_DIV_60
  const secondAngle = seconds * TAU_DIV_60

  const count = hourHands.length

  for (let i = 0; i < count; i++) {
    hourHands[i].rotation.z = -hourAngle
    minuteHands[i].rotation.z = -minuteAngle
    secondHands[i].rotation.z = -secondAngle
  }
}

// ----------------------------------------------------------------------------------------------------
// Update fires
// ----------------------------------------------------------------------------------------------------
function flickerFire(fire, tBase, phase) {
  const flicker = Math.sin(tBase + phase) * FIRE_FLICKER_AMP
  const flickerXZ = flicker * FIRE_FLICKER_XZ

  fire.scale.x = 1 - flickerXZ
  fire.scale.y = 1 + flicker
  fire.scale.z = 1 - flickerXZ
}

function updateFires(t) {
  const tBase = t * FIRE_FLICKER_SPEED

  for (const fire of fires) {
    flickerFire(fire.ref, tBase, fire.phase)
  }

  for (const candle of candles) {
    if (!candle.isOn) continue

    flickerFire(candle.fire, tBase, candle.firePhase)
  }
}

// ----------------------------------------------------------------------------------------------------
// Update trash bins
// ----------------------------------------------------------------------------------------------------
function updateTrashBins(dt) {
  const len = activeTrashBins.length

  if (len === 0) return

  for (let i = len - 1; i >= 0; i--) {
    const trashBin = activeTrashBins[i]
    const { isOpening, angle } = trashBin

    const dir = isOpening ? 1 : -1
    let newAngle = angle + dir * TRASH_BIN_SPEED * dt

    newAngle = Math.max(0, Math.min(TRASH_BIN_MAX_ANGLE, newAngle))

    trashBin.angle = newAngle
    trashBin.flap.rotation.x = newAngle

    if (isOpening && newAngle === TRASH_BIN_MAX_ANGLE) {
      trashBin.isOpening = false
    } else if (!isOpening && newAngle === 0) {
      trashBin.isActive = false
      activeTrashBins.splice(i, 1)
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Update lights
// ----------------------------------------------------------------------------------------------------
const lastLightUpdatePos = new THREE.Vector3(Infinity, 0, 0)

function updateLights() {
  const pPos = player.position

  if (pPos.distanceToSquared(lastLightUpdatePos) < LIGHT_UPDATE_THRESHOLD_SQ) return

  lastLightUpdatePos.copy(pPos)

  for (const light of lights) {
    light.ref.target.position.copy(pPos)
    light.ref.position.addVectors(pPos, light.offset)
  }
}

// ----------------------------------------------------------------------------------------------------
// Handle camera blockers
// ----------------------------------------------------------------------------------------------------
const rayHit = { t1: 0, t2: 0 }
const rayInterval = { tMin: -Infinity, tMax: Infinity }

function rayIntersectCircleXZ(rayDirX, rayDirZ, bounds) {
  const { cX, cZ, radius } = bounds

  const dx = lookTarget.x - cX
  const dz = lookTarget.z - cZ

  const bPrime = dx * rayDirX + dz * rayDirZ
  const c = dx * dx + dz * dz - radius * radius

  const disc = bPrime * bPrime - c

  if (disc < 0) return false

  const sqrtDisc = Math.sqrt(disc)

  rayHit.t1 = -bPrime - sqrtDisc
  rayHit.t2 = -bPrime + sqrtDisc

  return true
}

function clipRayInterval(origin, rayDir, boundMin, boundMax) {
  if (Math.abs(rayDir) < RAY_DIR_EPS) {
    if (origin < boundMin || origin > boundMax) return false
  } else {
    const inv = 1 / rayDir
    let t1 = (boundMin - origin) * inv
    let t2 = (boundMax - origin) * inv

    if (t1 > t2) [t1, t2] = [t2, t1]

    rayInterval.tMin = Math.max(rayInterval.tMin, t1)
    rayInterval.tMax = Math.min(rayInterval.tMax, t2)

    if (rayInterval.tMin > rayInterval.tMax) return false
  }

  return true
}

function rayIntersectAABBXZ(rayDirX, rayDirZ, bounds) {
  const { minX, maxX, minZ, maxZ } = bounds

  rayInterval.tMin = -Infinity
  rayInterval.tMax = Infinity

  if (!clipRayInterval(lookTarget.x, rayDirX, minX, maxX)) return false
  if (!clipRayInterval(lookTarget.z, rayDirZ, minZ, maxZ)) return false
  if (rayInterval.tMax < 0) return false

  rayHit.t1 = rayInterval.tMin
  rayHit.t2 = rayInterval.tMax

  return true
}

function rayIntersectXZ(rayDirX, rayDirZ, bounds) {
  switch (bounds.type) {
    case BOUNDS_TYPES.CIRCLE:
      return rayIntersectCircleXZ(rayDirX, rayDirZ, bounds)

    case BOUNDS_TYPES.AABB:
      return rayIntersectAABBXZ(rayDirX, rayDirZ, bounds)
  }

  return false
}

function resolveCameraBlockers(rayDirX, rayDirZ) {
  const { x, z } = player.position
  const section = sections[getSectionKey(x, z)]

  if (!section) return

  for (const blocker of section.cameraBlockers) {
    if (!rayIntersectXZ(rayDirX, rayDirZ, blocker)) continue

    const { t1, t2 } = rayHit

    if (t1 < camDesiredDistance && camDesiredDistance < t2) {
      camAllowedDistance = t1 > MIN_CAM_ALLOWED_DIST ? t1 : t2
      camDistance = camAllowedDistance
      return
    }

    if (t1 < camDistance && camDistance < t2) {
      camDistance = camAllowedDistance
      return
    }
  }
}

// ----------------------------------------------------------------------------------------------------
// Update camera
// ----------------------------------------------------------------------------------------------------
let camYDampingDisabled = false

function updateCamera(a) {
  if (binocularsActive) return

  const { x, y, z } = player.position
  const followFactor = a * CAM_FOLLOW_MULTIPLIER

  lookTarget.set(x, y + LOOK_TARGET_OFFSET, z)

  camYaw += (camDesiredYaw - camYaw) * followFactor

  const dirX = Math.sin(camYaw)
  const dirZ = Math.cos(camYaw)

  camAllowedDistance = camDesiredDistance

  resolveCameraBlockers(-dirX, -dirZ)

  camDistance += (camAllowedDistance - camDistance) * followFactor

  camPos.x = lookTarget.x - dirX * camDistance
  camPos.z = lookTarget.z - dirZ * camDistance

  const desiredY = lookTarget.y + camOffset

  if (!camYDampingDisabled && velocity.y > 0) camYDampingDisabled = true

  if (!camYDampingDisabled) camPos.y += (desiredY - camPos.y) * followFactor
  else camPos.y = desiredY

  camera.position.copy(camPos)
  camera.lookAt(lookTarget)

  sky.position.copy(camera.position)
}

// ----------------------------------------------------------------------------------------------------
// Update dev stats
// ----------------------------------------------------------------------------------------------------
const hasRuntimeDevStats = DEV.printRendererStats || DEV.printSectionStats || DEV.printPosition
let devTimer = 0

function updateDevStats(dt) {
  if (!hasRuntimeDevStats) return

  devTimer += dt

  if (devTimer > 1) {
    devTimer = 0

    if (DEV.printRendererStats) printRendererStats()
    if (DEV.printSectionStats) printSectionStats()
    if (DEV.printPosition) printPosition()
  }
}

// ----------------------------------------------------------------------------------------------------
// Main loop
// ----------------------------------------------------------------------------------------------------
let prev = performance.now()

function animate(now) {
  requestAnimationFrame(animate)

  const dt = Math.min((now - prev) * MS_TO_S, MAX_DT)
  const t = (now * MS_TO_S) % TIME_WRAP
  const a = 1 - Math.pow(MOTION_RESPONSE, dt)

  prev = now

  if (isIntroZoomActive) updateIntroCamera(dt)

  updateOrders(now)
  updateInteraction()
  updateDoors(dt)

  updateMovement(dt, a)
  updateAnimations()
  updateAnimationMixers(dt)

  updateFaces(dt)
  updateEffects(t)
  updateButterflies(dt, t)
  updateOcean(dt, t)
  updateBoat(dt)
  updateLaptop(dt)
  updateClocks(dt)
  updateFires(t)
  updateTrashBins(dt)

  updateLights()
  updateCamera(a)

  renderer.render(scene, camera)

  updateDevStats(dt)
}

function setupDev() {
  if (DEV.printInitialStats) {
    renderer.render(scene, camera)
    printRendererStats()
  }

  if (DEV.printAllSectionStatsOnce) printAllSectionStatsOnce()
  if (DEV.showSectionGrid) showSectionGrid()
  if (DEV.showButterflyPaths) showButterflyPaths()
  if (DEV.showButterflyPathPoints) showButterflyPathPoints()
  if (DEV.printButterflyPathLengths) printButterflyPathLengths()
  if (DEV.skipIntro) isIntroZoomActive = false
  if (DEV.restoreLastState) setInterval(saveState, 1000)
}

async function fadeInBGM() {
  await playBGM(0)

  const gain = bgm.gain.gain
  const now = bgm.context.currentTime

  gain.setValueAtTime(0, now)
  gain.linearRampToValueAtTime(BGM_VOLUME, now + BGM_FADE_TIME)
}

function start() {
  setupDev()

  if (localStorage.getItem(SOUND_KEY) !== '0') fadeInBGM()

  prev = performance.now()

  requestAnimationFrame(animate)
}

// ----------------------------------------------------------------------------------------------------
// DEV
// ----------------------------------------------------------------------------------------------------
function printRendererStats() {
  const {
    render: { calls, triangles },
    memory: { geometries, textures },
  } = renderer.info

  console.log(
    'Draw calls: ',
    calls,
    '| Triangles: ',
    triangles,
    '| Geometries: ',
    geometries,
    '| Textures: ',
    textures,
  )
}

function logSectionStats(key, section) {
  const stats = Object.entries(section ?? {})
    .map(([name, items]) => `${name}: ${items.length}`)
    .join(' | ')

  console.log(`Section (${key}): ${stats}`)
}

function printAllSectionStatsOnce() {
  for (const [key, section] of Object.entries(sections)) {
    logSectionStats(key, section)
  }
}

function printSectionStats() {
  const { x, z } = player.position
  const key = getSectionKey(x, z)
  const section = sections[key]

  logSectionStats(key, section)
}

function showSectionGrid() {
  const divisions = Math.ceil(LAND_RADIUS * INV_SECTION_SIZE) * 2
  const size = divisions * SECTION_SIZE

  const grid = new THREE.GridHelper(size, divisions, GRID_CENTER_COLOR, GRID_LINE_COLOR)
  grid.position.y = 1

  scene.add(grid)
}

function showButterflyPaths() {
  for (const { path, color } of BUTTERFLY_INSTANCES) {
    const points = path.getPoints(200)

    const geom = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({ color })
    const line = new THREE.Line(geom, mat)

    scene.add(line)
  }
}

function showButterflyPathPoints() {
  const markers = new THREE.Group()
  const geom = new THREE.BoxGeometry(0.2, 0.2, 0.2)

  for (const { path } of BUTTERFLY_INSTANCES) {
    const points = path.points

    for (let i = 0; i < points.length; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: BUTTERFLY_PATH_POINT_COLORS[i],
        depthTest: false,
      })

      const marker = new THREE.Mesh(geom, mat)

      marker.position.copy(points[i])
      marker.renderOrder = 999

      markers.add(marker)
    }
  }

  scene.add(markers)
}

function printButterflyPathLengths() {
  for (const { name, path } of BUTTERFLY_INSTANCES) {
    console.log(`🦋 ${name} path: ${f2(path.getLength())}`)
  }
}

function saveState() {
  const {
    position: { x, y, z },
    rotation: { y: ry },
  } = player

  localStorage.setItem(DEV_LAST_STATE_KEY, JSON.stringify({ x, y, z, ry, camYaw, camDistance }))
}

let devLastState = null

function restoreLastState() {
  const saved = localStorage.getItem(DEV_LAST_STATE_KEY)

  if (!saved) return

  devLastState = JSON.parse(saved)

  const { x, y, z, ry } = devLastState

  player.position.set(x, y, z)
  player.rotation.y = ry
}

function printPosition() {
  const { x, y, z } = player.position

  console.log({ x: f1(x), y: f1(y), z: f1(z) })
}

function printColors(names) {
  for (const name of names) {
    const model = models[name]

    if (!model) {
      console.log(`Missing model: ${name}`)
      continue
    }

    console.log(`🎨 ${name} colors`)

    model.traverse((node) => {
      const colorAttr = node.geometry?.attributes.color

      if (!colorAttr) return

      const color = new THREE.Color()
      const colors = new Set()

      for (let i = 0; i < colorAttr.count; i++) {
        colors.add(`#${color.fromBufferAttribute(colorAttr, i).getHexString()}`)
      }

      console.log(`${node.name}: ${[...colors].join(', ')}`)
    })
  }
}

function printDimensions(names) {
  for (const name of names) {
    const model = models[name]

    if (!model) {
      console.log(`Missing model: ${name}`)
      continue
    }

    tmpBox3.setFromObject(model).getSize(tmpVec3)

    console.log(
      `📐 ${name} dimensions: x: ${f2(tmpVec3.x)}, y: ${f2(tmpVec3.y)}, z: ${f2(tmpVec3.z)}`,
    )
  }
}

// ----------------------------------------------------------------------------------------------------
// Resize
// ----------------------------------------------------------------------------------------------------
let resizeTimeout

function resolveDPR(w, h) {
  const pixelCapDPR = Math.sqrt(MAX_PIXEL_COUNT / (w * h))

  return Math.min(window.devicePixelRatio, MAX_DPR, pixelCapDPR)
}

function resize() {
  if (!camera || !renderer) return

  const { innerWidth: w, innerHeight: h } = window

  camera.aspect = w / h
  camera.updateProjectionMatrix()

  clearTimeout(resizeTimeout)

  resizeTimeout = setTimeout(() => {
    renderer.setPixelRatio(resolveDPR(w, h))
    renderer.setSize(w, h, false)
  }, 100)
}

window.addEventListener('resize', resize)
