/**
 * SR3E (The2ndChumming3e) Adapter Tests
 */

import { describe, it, expect } from 'vitest';
import { SR3EAdapter } from './adapter.js';

const attr = (value: number, base = value, mod = 0) => ({ value, base, mod, force: 0 });

const runner: any = {
  name: 'Twitch',
  type: 'character',
  system: {
    metatype: 'elf',
    nuyen: 4200,
    karma: 7,
    totalKarma: 31,
    karmaPool: 3,
    karmaPoolSpent: 1,
    initiateGrade: 1,
    magicTradition: 'hermetic',
    magicType: 'fullMagician',
    magicTotem: '',
    sustainedSpells: [{ id: 'a', name: 'Armor', force: 4, target: 'self', focus: false }],
    attributes: {
      body: attr(3),
      quickness: attr(6, 5, 1),
      strength: attr(2),
      charisma: attr(5),
      intelligence: attr(5),
      willpower: attr(6),
      essence: { value: 5.8, base: 6, lost: 0.2, force: 0 },
      magic: { value: 5, base: 6, mod: 0, force: 0 },
      reaction: { value: 5, base: 5, reactionBonus: 0, diceBonus: 0, override: false, force: 0 },
    },
    wounds: {
      stun: { value: 2, max: 10 },
      physical: { value: 0, max: 10 },
      overflow: { value: 0 },
    },
    derived: {
      initiative: 5,
      initiativeDice: 1,
      combatPool: 8,
      availableCombatPool: 6,
      spellPool: 5,
      availableSpellPool: 5,
      hackingPool: null,
      controlPool: 0,
      karmaPool: 3,
      availableKarmaPool: 2,
      armorSumBallistic: 3,
      armorSumImpact: 1,
    },
  },
  items: [
    {
      id: 's1',
      name: 'Sorcery',
      type: 'skill',
      system: {
        rating: 6,
        skillType: 'active',
        linkedAttribute: 'magic',
        specialisation: '',
        specialisations: [{ name: 'Spellcasting', level: 2 }],
      },
    },
    {
      id: 'w1',
      name: 'Ares Predator',
      type: 'firearm',
      system: {
        damage: '9M',
        concealability: '5',
        mode: 'SA',
        ammunition: '15(c)',
        loadedRounds: 15,
        notes: '<p>x</p>',
      },
    },
    {
      id: 'c1',
      name: 'Datajack',
      type: 'cyberware',
      system: { essenceCost: 0.2, grade: 'Standard', rating: null },
    },
    { id: 'x1', name: 'Mystery', type: 'unknownType', system: { foo: 1 } },
  ],
};

describe('SR3EAdapter', () => {
  const adapter = new SR3EAdapter();

  it('handles the Foundry system id case-insensitively', () => {
    expect(adapter.canHandle('The2ndChumming3e')).toBe(true);
    expect(adapter.canHandle('the2ndchumming3e')).toBe(true);
    expect(adapter.canHandle('shadowrun5e')).toBe(false);
  });

  it('extracts attributes, pools, monitors and resources', () => {
    const s = adapter.extractCharacterStats(runner);
    expect(s.attributes.quickness).toEqual({ value: 6, base: 5, mod: 1 });
    expect(s.attributes.essence).toEqual({ value: 5.8, base: 6, lost: 0.2 });
    expect(s.attributes.magic).toEqual({ value: 5, base: 6 });
    expect(s.attributes.reaction).toEqual({ value: 5, base: 5 });
    expect(s.initiative).toEqual({ base: 5, dice: 1 });
    expect(s.dicePools.combat).toEqual({ total: 8, available: 6 });
    expect(s.dicePools.karma).toEqual({ total: 3, available: 2 });
    expect(s.dicePools.hacking).toBeUndefined();
    expect(s.conditionMonitor.stun).toEqual({ value: 2, max: 10 });
    expect(s.resources).toMatchObject({
      nuyen: 4200,
      karma: 7,
      totalKarma: 31,
      karmaPool: 3,
      karmaPoolSpent: 1,
    });
    expect(s.magic).toMatchObject({ tradition: 'hermetic', initiateGrade: 1 });
    expect(s.magic.totem).toBeUndefined();
    expect(s.armor).toEqual({ ballistic: 3, impact: 1 });
    expect(s.skills[0]).toMatchObject({ name: 'Sorcery', rating: 6, attribute: 'magic' });
  });

  it('inlines per-item fields and drops empty/unlisted ones', () => {
    const [skill, gun, cyber, unknown] = runner.items;
    expect(adapter.formatItemDetails(skill)).toMatchObject({ rating: 6, skillType: 'active' });
    expect(adapter.formatItemDetails(gun)).toEqual({
      damage: '9M',
      concealability: '5',
      mode: 'SA',
      ammunition: '15(c)',
      loadedRounds: 15,
    });
    expect(adapter.formatItemDetails(cyber)).toEqual({ essenceCost: 0.2, grade: 'Standard' });
    expect(adapter.formatItemDetails(unknown)).toEqual({});
  });

  it('extracts vehicle stats', () => {
    const s = adapter.extractCharacterStats({
      name: 'Bulldog',
      type: 'vehicle',
      system: {
        vehicleType: 'car',
        seating: 6,
        damage: { value: 1 },
        attributes: { handling: { value: 4, base: 4 }, body: { value: 4, base: 4 } },
        derived: { damageMax: 8 },
      },
    });
    expect(s.attributes).toEqual({ handling: 4, body: 4 });
    expect(s.damage).toEqual({ value: 1, max: 8 });
  });
});
