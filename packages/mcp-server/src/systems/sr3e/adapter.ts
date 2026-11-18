/**
 * Shadowrun 3rd Edition System Adapter ("The2ndChumming3e" Foundry system)
 *
 * Character-focused: extracts attributes, Essence/Magic, dice pools, condition
 * monitors, karma/nuyen and magical tradition so get-character returns a full
 * SR3 sheet, and inlines each item's rule-relevant fields (skill rating,
 * weapon damage, cyberware Essence, ...) so no per-item follow-up is needed.
 * Creature indexing is not implemented (the module has no SR3 index builder).
 */

import { z } from 'zod';
import type { SystemAdapter, SystemMetadata, SystemCreatureIndex } from '../types.js';
import {
  SR3E_SYSTEM_IDS,
  SR3E_ATTRIBUTES,
  SR3E_VEHICLE_ATTRIBUTES,
  SR3E_POOLS,
  SR3E_ITEM_FIELDS,
} from './constants.js';

const SR3EFiltersSchema = z.object({}).passthrough();

const num = (v: any): number | undefined => (typeof v === 'number' ? v : undefined);

/** Drop undefined / null / '' values so the payload stays compact. */
function compact<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export class SR3EAdapter implements SystemAdapter {
  getMetadata(): SystemMetadata {
    return {
      id: 'The2ndChumming3e',
      name: 'The2ndChumming3e',
      displayName: 'Shadowrun 3rd Edition (The2ndChumming3e)',
      version: '1.0.0',
      description:
        'Character-focused support for Shadowrun 3rd Edition: attributes, Essence/Magic, ' +
        'dice pools, condition monitors, karma/nuyen, initiation and inline item stats.',
      supportedFeatures: {
        creatureIndex: false,
        characterStats: true,
        spellcasting: true,
        powerLevel: false,
      },
    };
  }

  canHandle(systemId: string): boolean {
    return SR3E_SYSTEM_IDS.includes(systemId.toLowerCase());
  }

  extractCreatureData(
    _doc: any,
    _pack: any
  ): { creature: SystemCreatureIndex; errors: number } | null {
    return null;
  }

  getFilterSchema() {
    return SR3EFiltersSchema;
  }

  matchesFilters(_creature: SystemCreatureIndex, _filters: Record<string, any>): boolean {
    return true;
  }

  getDataPaths(): Record<string, string | null> {
    return {
      attributes: 'system.attributes',
      essence: 'system.attributes.essence.value',
      magic: 'system.attributes.magic.value',
      physicalDamage: 'system.wounds.physical.value',
      stunDamage: 'system.wounds.stun.value',
      nuyen: 'system.nuyen',
      karma: 'system.karma',
      challengeRating: null,
      creatureType: null,
      alignment: null,
      hitPoints: null,
      armorClass: null,
      legendaryActions: null,
      legendaryResistances: null,
      perception: null,
      saves: null,
      rarity: null,
    };
  }

  formatCreatureForList(creature: SystemCreatureIndex): any {
    return {
      id: creature.id,
      name: creature.name,
      type: creature.type,
      pack: { id: creature.packName, label: creature.packLabel },
    };
  }

  formatCreatureForDetails(creature: SystemCreatureIndex): any {
    return this.formatCreatureForList(creature);
  }

  describeFilters(_filters: Record<string, any>): string {
    return 'no filters (SR3 creature index not implemented)';
  }

  getPowerLevel(_creature: SystemCreatureIndex): number | undefined {
    return undefined;
  }

  extractCharacterStats(actorData: any): any {
    const sys = actorData.system || {};
    if (actorData.type === 'vehicle') return this.extractVehicleStats(actorData);

    const attrs = sys.attributes || {};
    const derived = sys.derived || {};
    const stats: any = { name: actorData.name, type: actorData.type };

    if (sys.metatype) stats.metatype = sys.metatype;

    stats.attributes = {};
    for (const key of SR3E_ATTRIBUTES) {
      const a = attrs[key];
      if (!a) continue;
      stats.attributes[key] = compact({
        value: num(a.value),
        base: num(a.base),
        mod: num(a.mod) || undefined,
      });
    }
    if (attrs.reaction) {
      stats.attributes.reaction = compact({
        value: num(attrs.reaction.value),
        base: num(attrs.reaction.base),
      });
    }
    if (attrs.essence) {
      stats.attributes.essence = compact({
        value: num(attrs.essence.value),
        base: num(attrs.essence.base),
        lost: num(attrs.essence.lost),
      });
    }
    if (attrs.magic) {
      stats.attributes.magic = compact({
        value: num(attrs.magic.value),
        base: num(attrs.magic.base),
        mod: num(attrs.magic.mod) || undefined,
      });
    }

    if (derived.initiative !== undefined || derived.initiativeDice !== undefined) {
      stats.initiative = compact({
        base: num(derived.initiative),
        dice: num(derived.initiativeDice),
      });
    }

    const pools: any = {};
    for (const [key, totalKey, availKey] of SR3E_POOLS) {
      const total = num(derived[totalKey]);
      if (total === undefined || total === 0) continue;
      pools[key] = compact({ total, available: num(derived[availKey]) });
    }
    if (sys.karmaPool !== undefined && !pools.karma) {
      pools.karma = compact({
        total: num(sys.karmaPool),
        available: Math.max(0, (sys.karmaPool ?? 0) - (sys.karmaPoolSpent ?? 0)),
      });
    }
    if (Object.keys(pools).length > 0) stats.dicePools = pools;

    const w = sys.wounds;
    if (w) {
      stats.conditionMonitor = {
        physical: compact({ value: num(w.physical?.value), max: num(w.physical?.max) }),
        stun: compact({ value: num(w.stun?.value), max: num(w.stun?.max) }),
        ...(w.overflow?.value ? { overflow: w.overflow.value } : {}),
      };
    }

    stats.resources = compact({
      nuyen: num(sys.nuyen),
      karma: num(sys.karma),
      totalKarma: num(sys.totalKarma),
      karmaPool: num(sys.karmaPool),
      karmaPoolSpent: num(sys.karmaPoolSpent),
      reputation: num(sys.reputation) || undefined,
      streetCred: num(sys.streetCred) || undefined,
      notoriety: num(sys.notoriety) || undefined,
      professionalRating: num(sys.professionalRating) || undefined,
    });

    const magic = compact({
      tradition: sys.magicTradition,
      type: sys.magicType,
      totem: sys.magicTotem,
      element: sys.magicElement,
      initiateGrade: num(sys.initiateGrade) || undefined,
      astralMode: sys.astralMode,
      sustainedSpells: Array.isArray(sys.sustainedSpells)
        ? sys.sustainedSpells.map((s: any) =>
            compact({ name: s.name, force: s.force, target: s.target, focus: s.focus || undefined })
          )
        : undefined,
    });
    if (Object.keys(magic).length > 0) stats.magic = magic;

    const armor = compact({
      ballistic: num(derived.armorSumBallistic),
      impact: num(derived.armorSumImpact),
      natural: num(sys.naturalArmor) || undefined,
    });
    if (Object.keys(armor).length > 0) stats.armor = armor;

    const items: any[] = Array.isArray(actorData.items) ? actorData.items : [];
    const skills = items.filter(i => i?.type === 'skill');
    if (skills.length > 0) {
      stats.skills = skills
        .map(s => {
          const ss = s.system || {};
          return compact({
            name: s.name,
            rating: num(ss.rating),
            type: ss.skillType,
            attribute: ss.linkedAttribute,
            specialisation: ss.specialisation,
            specialisations: Array.isArray(ss.specialisations)
              ? ss.specialisations.filter((x: any) => x?.name)
              : undefined,
          });
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    return stats;
  }

  /**
   * Inline the rule-relevant item fields into get-character's item list.
   * Called by CharacterTools.formatItems via the optional adapter hook.
   */
  formatItemDetails(item: any): Record<string, any> {
    const fields = SR3E_ITEM_FIELDS[item?.type];
    const sys = item?.system;
    if (!fields || !sys) return {};
    const picked: any = {};
    for (const f of fields) picked[f] = sys[f];
    return compact(picked);
  }

  extractBasicInfo(actorData: any): any {
    const sys = actorData.system || {};
    if (actorData.type === 'vehicle') {
      return compact({ damage: num(sys.damage?.value), vehicleType: sys.vehicleType });
    }
    return compact({
      metatype: sys.metatype,
      essence: num(sys.attributes?.essence?.value),
      physicalDamage: num(sys.wounds?.physical?.value),
      stunDamage: num(sys.wounds?.stun?.value),
    });
  }

  private extractVehicleStats(actorData: any): any {
    const sys = actorData.system || {};
    const attrs = sys.attributes || {};
    const stats: any = { name: actorData.name, type: actorData.type, vehicleType: sys.vehicleType };
    stats.attributes = {};
    for (const key of SR3E_VEHICLE_ATTRIBUTES) {
      const a = attrs[key];
      if (a) stats.attributes[key] = num(a.value) ?? num(a.base);
    }
    stats.damage = compact({
      value: num(sys.damage?.value),
      max: num(sys.derived?.damageMax),
    });
    stats.seating = sys.seating;
    if (sys.ew) stats.electronicWarfare = compact(sys.ew);
    return compact(stats);
  }
}
