import {Component, computed, Signal, signal, TemplateRef, viewChild} from '@angular/core';
import {PageLayout} from './page-layout';
import {KeyValuePipe} from '@angular/common';

type Sidebar = 'stats' | 'inventory' | 'achievements' | 'none';

interface SidebarActions {
  name: string;
  callback: () => void;
  type: Sidebar;
}

interface Stat {
  label: string;
  value: string;
  hasBar?: boolean;
}

interface InventoryItem {
  icon: string;
  name: string;
  qty: number;
}

interface Achievement {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

@Component({
  selector: 'app-dynamic-layout',
  imports: [
    PageLayout,
    KeyValuePipe
  ],
  templateUrl: './dynamic-layout.html',
  styleUrl: './dynamic-layout.scss',
})
export default class DynamicLayout {

  protected readonly tiles = [
    '🏔️', '🌲', '🏠', '🌊',
    '🌾', '⛏️', '🏰', '🌲',
    '🌊', '🏔️', '🌾', '🏠',
  ];

  protected readonly playerStats: Stat[] = [
    {label: 'Level', value: '12'},
    {label: 'HP', value: '85 / 100', hasBar: true},
    {label: 'XP', value: '2,340'},
    {label: 'Gold', value: '1,250'},
    {label: 'Armor', value: '42'},
  ];

  protected readonly inventory: InventoryItem[] = [
    {icon: '🗡️', name: 'Iron Sword', qty: 1},
    {icon: '🛡️', name: 'Wooden Shield', qty: 1},
    {icon: '🧪', name: 'Health Potion', qty: 5},
    {icon: '🔑', name: 'Dungeon Key', qty: 2},
    {icon: '📜', name: 'Ancient Scroll', qty: 1},
  ];

  protected readonly achievements: Achievement[] = [
    {icon: '🐉', title: 'Dragon Slayer', description: 'Defeat a dragon in combat', unlocked: true},
    {icon: '🗺️', title: 'Explorer', description: 'Discover all map regions', unlocked: true},
    {icon: '💰', title: 'Hoarder', description: 'Collect 10,000 gold', unlocked: false},
    {icon: '⚔️', title: 'Combo Master', description: 'Land a 50-hit combo', unlocked: false},
    {icon: '🏰', title: 'Castle Conqueror', description: 'Capture an enemy fortress', unlocked: true},
  ];

  private readonly statsAction: SidebarActions = {
    name: 'Stats',
    callback: () => this.sidebar.set('stats'),
    type: 'stats'
  };

  private readonly inventoryAction: SidebarActions = {
    name: 'Inventory',
    callback: () => this.sidebar.set('inventory'),
    type: 'inventory',
  };

  private readonly achievementsAction: SidebarActions = {
    name: 'Achievements',
    callback: () => this.sidebar.set('achievements'),
    type: 'achievements'
  };

  private readonly hideAction: SidebarActions = {
    name: 'Hide',
    callback: () => this.sidebar.set('none'),
    type: 'none',
  };

  protected readonly actions: Record<Sidebar, SidebarActions> = {
    inventory: this.inventoryAction,
    stats: this.statsAction,
    achievements: this.achievementsAction,
    none: this.hideAction
  };


  protected readonly sidebar = signal<Sidebar>('none');
  protected readonly activeSidebar = computed(() => {
    const sidebar = this.sidebar();
    return sidebar === 'none' ? null : this.templateMap[sidebar]();
  });
  protected readonly inventoryTemplate = viewChild<TemplateRef<void>>('sidebarInventory');
  protected readonly statsTemplate = viewChild<TemplateRef<void>>('sidebarStats');
  protected readonly achievementsTemplate = viewChild<TemplateRef<void>>('sidebarAchievements');

  private readonly templateMap: Record<Exclude<Sidebar, 'none'>, Signal<TemplateRef<void> | undefined>> = {
    stats: this.statsTemplate,
    inventory: this.inventoryTemplate,
    achievements: this.achievementsTemplate
  };

}
