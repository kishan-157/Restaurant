import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ListPlus, Check } from 'lucide-react';
import { useRestaurant } from '../../../context/RestaurantContext';
import { ItemVariant, AddonGroup, AddonOption } from '../../../types';

export const AdminVariantsAddons: React.FC = () => {
  const { data, saveVariant, deleteVariant, saveAddonGroup, deleteAddonGroup } = useRestaurant();
  const { items, variants, addonGroups, profile } = data;

  const [activeTab, setActiveTab] = useState<'variants' | 'addons'>('variants');

  // Variant form
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [varName, setVarName] = useState('');
  const [varPrice, setVarPrice] = useState<number>(200);

  // Addon form
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupMax, setGroupMax] = useState<number>(2);
  const [newOptName, setNewOptName] = useState('');
  const [newOptPrice, setNewOptPrice] = useState<number>(30);
  const [selectedGroup, setSelectedGroup] = useState<AddonGroup | null>(null);

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!varName.trim() || !selectedItemId) return;

    const newVar: ItemVariant = {
      id: `var-${Date.now()}`,
      menuItemId: selectedItemId,
      name: varName.trim(),
      price: Number(varPrice),
      isAvailable: true,
      displayOrder: variants.filter((v) => v.menuItemId === selectedItemId).length + 1,
    };
    saveVariant(newVar);
    setVarName('');
  };

  const handleCreateAddonGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const newGroup: AddonGroup = {
      id: `grp-${Date.now()}`,
      name: groupName.trim(),
      description: groupDesc.trim(),
      isRequired: false,
      minSelect: 0,
      maxSelect: Number(groupMax) || 1,
      options: [],
    };
    saveAddonGroup(newGroup);
    setGroupName('');
    setGroupDesc('');
  };

  const handleAddOptionToGroup = (group: AddonGroup) => {
    if (!newOptName.trim()) return;

    const newOpt: AddonOption = {
      id: `opt-${Date.now()}`,
      groupId: group.id,
      name: newOptName.trim(),
      price: Number(newOptPrice) || 0,
      isAvailable: true,
    };

    const updatedGroup: AddonGroup = {
      ...group,
      options: [...group.options, newOpt],
    };

    saveAddonGroup(updatedGroup);
    setNewOptName('');
    setNewOptPrice(30);
  };

  const handleDeleteOptionFromGroup = (group: AddonGroup, optionId: string) => {
    const updatedGroup: AddonGroup = {
      ...group,
      options: group.options.filter((o) => o.id !== optionId),
    };
    saveAddonGroup(updatedGroup);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold font-heading text-neutral-900">Variants & Add-on Groups</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure portion sizes (Half/Full), toppings, extra gravy, and custom add-ons.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setActiveTab('variants')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'variants'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Portion Variants ({variants.length})
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'addons'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Add-on Groups ({addonGroups.length})
          </button>
        </div>
      </div>

      {activeTab === 'variants' ? (
        /* VARIANTS TAB */
        <div className="space-y-6">
          {/* Add Variant Form */}
          <form onSubmit={handleAddVariant} className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Attach Portion / Variant to Dish
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Select Dish
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Portion / Variant Name
                </label>
                <input
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="e.g. Half (4 pcs) or Jumbo Matka"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Price ({profile.currencySymbol})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={varPrice}
                    onChange={(e) => setVarPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Variants Listing Grouped by Dish */}
          <div className="space-y-4">
            {items.map((item) => {
              const itemVars = variants.filter((v) => v.menuItemId === item.id);
              if (itemVars.length === 0) return null;

              return (
                <div key={item.id} className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <h4 className="text-sm font-bold text-neutral-900">{item.name}</h4>
                    <span className="text-xs text-neutral-500">
                      Base price: {profile.currencySymbol}{item.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {itemVars.map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-800">{v.name}</span>
                          <span className="font-bold text-neutral-900 tabular-nums">
                            {profile.currencySymbol}{v.price.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteVariant(v.id)}
                          className="p-1 text-neutral-400 hover:text-red-600 rounded"
                          title="Remove variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ADDONS TAB */
        <div className="space-y-6">
          {/* Create Addon Group Form */}
          <form onSubmit={handleCreateAddonGroup} className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Create New Add-on Group
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Extra Chutneys & Salads"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="e.g. Fresh accompaniments"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Max Selection Allowed
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={groupMax}
                    onChange={(e) => setGroupMax(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shrink-0"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Addon Groups List */}
          <div className="space-y-4">
            {addonGroups.map((group) => (
              <div key={group.id} className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">{group.name}</h4>
                    {group.description && (
                      <p className="text-xs text-neutral-500 mt-0.5">{group.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">Max: {group.maxSelect}</span>
                    <button
                      onClick={() => deleteAddonGroup(group.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Existing Options */}
                <div className="space-y-1.5">
                  {group.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-2 bg-neutral-50 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-800">{opt.name}</span>
                        <span className="text-neutral-500">
                          +{profile.currencySymbol}{opt.price.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteOptionFromGroup(group, opt.id)}
                        className="text-neutral-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Option Subform */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                  <input
                    type="text"
                    value={newOptName}
                    onChange={(e) => setNewOptName(e.target.value)}
                    placeholder="New option name (e.g. Extra Butter)"
                    className="flex-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min={0}
                    value={newOptPrice}
                    onChange={(e) => setNewOptPrice(Number(e.target.value))}
                    placeholder="Price"
                    className="w-24 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOptionToGroup(group)}
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
