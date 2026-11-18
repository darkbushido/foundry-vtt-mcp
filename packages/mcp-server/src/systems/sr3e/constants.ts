/**
 * Shadowrun 3rd Edition ("The2ndChumming3e" Foundry system) constants.
 *
 * Field names follow the system's TypeDataModels:
 *   scripts/data/ActorDataModels.js  (CharacterData, NpcData, VehicleData)
 *   scripts/data/ItemDataModels.js   (SkillData, FirearmData, ...)
 * Derived numbers (dice pools, initiative) are written to `system.derived`
 * by SR3EActor.prepareDerivedData and arrive with the live actor system.
 */

/** Foundry system id(s) this adapter handles. */
export const SR3E_SYSTEM_IDS = ['the2ndchumming3e'];

/** Physical/mental attributes that share the `_attr` shape {base, value, mod}. */
export const SR3E_ATTRIBUTES = [
  'body',
  'quickness',
  'strength',
  'charisma',
  'intelligence',
  'willpower',
] as const;

/** Vehicle attributes (`_vAttr`: {base, value}). */
export const SR3E_VEHICLE_ATTRIBUTES = [
  'handling',
  'handlingOffRoad',
  'speed',
  'accel',
  'body',
  'armor',
  'sig',
  'autonav',
  'pilot',
  'sensor',
  'cargo',
  'load',
] as const;

/**
 * Dice pools: [output key, derived total, derived available].
 * Totals come from `system.derived`; null entries are omitted.
 */
export const SR3E_POOLS: ReadonlyArray<[string, string, string]> = [
  ['combat', 'combatPool', 'availableCombatPool'],
  ['spell', 'spellPool', 'availableSpellPool'],
  ['astral', 'astralPool', 'availableAstralPool'],
  ['initiate', 'initiatePool', 'availableInitiatePool'],
  ['hacking', 'hackingPool', 'availableHackingPool'],
  ['control', 'controlPool', 'controlPool'],
  ['karma', 'karmaPool', 'availableKarmaPool'],
];

const WEAPON_COMMON = [
  'category',
  'damage',
  'concealability',
  'ready',
  'hands',
  'extraDamage',
  'shock',
];

/**
 * Item `system` fields surfaced inline by get-character, per item type.
 * Lets one get-character call return a full sheet instead of one
 * get-character-entity call per item. Empty strings / nulls are dropped.
 */
export const SR3E_ITEM_FIELDS: Record<string, readonly string[]> = {
  skill: [
    'rating',
    'skillType',
    'category',
    'linkedAttribute',
    'specialisation',
    'specialisations',
  ],
  melee: [...WEAPON_COMMON, 'reach'],
  projectile: [...WEAPON_COMMON, 'strMin', 'quantity', 'loadedAmmoType', 'loadedRounds'],
  thrown: [...WEAPON_COMMON, 'strMin', 'quantity'],
  firearm: [
    ...WEAPON_COMMON,
    'mode',
    'ammunition',
    'loadedAmmoType',
    'loadedRounds',
    'recoilMod',
    'recoilModIntegral',
    'smartgun',
    'laserSight',
    'accessories',
    'rangeOverride',
    'choke',
  ],
  ammunition: ['ammoType', 'damage', 'rounds', 'reloads', 'roundsPerReload', 'gunClass', 'rating'],
  armor: ['ballistic', 'impact', 'rating', 'concealability', 'hardened'],
  gear: ['category', 'rating', 'quantity', 'concealability'],
  cyberware: ['essenceCost', 'grade', 'rating', 'cyberwareCategory', 'essenceSlot'],
  bioware: ['bioIndex', 'grade', 'rating', 'biowareCategory'],
  spell: [
    'force',
    'category',
    'type',
    'range',
    'damage',
    'damageTrack',
    'duration',
    'drain',
    'target',
  ],
  adeptpower: ['powerCost', 'hasLevels', 'level'],
  quality: ['qualityType', 'karmaCost'],
  contact: ['archetype', 'loyalty', 'connection'],
  program: ['type', 'category', 'rating', 'currentRating', 'sizeMp'],
  complex_form: ['rating', 'duration', 'fade'],
  summoning: ['spiritType'],
  drug: ['category', 'addiction', 'tolerance', 'damage', 'speed', 'vector'],
  medical: ['category', 'rating'],
  vehicleweapon: ['weaponType', 'rating', 'mode', 'damage', 'ammunition'],
  vehiclemod: ['rating', 'cfCost', 'load'],
};
