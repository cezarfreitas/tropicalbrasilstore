import { useState, useEffect } from "react";

export interface SizeGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  sizes: string[];
}

const DEFAULT_SIZE_GROUPS: SizeGroup[] = [
  {
    id: "masculino",
    name: "Masculino",
    description: "Tamanhos masculinos adultos",
    icon: "👨",
    sizes: ["38", "39", "40", "41", "42", "43", "44"]
  },
  {
    id: "feminino", 
    name: "Feminino",
    description: "Tamanhos femininos adultos",
    icon: "👩",
    sizes: ["33", "34", "35", "36", "37", "38", "39"]
  },
  {
    id: "infantil",
    name: "Infantil",
    description: "Tamanhos infantis",
    icon: "👶",
    sizes: ["32", "33", "34", "35", "36"]
  },
  {
    id: "todos",
    name: "Todos",
    description: "Todos os tamanhos disponíveis", 
    icon: "👥",
    sizes: ["32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"]
  }
];

export function useSizeGroups() {
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>(() => {
    // Tenta carregar do localStorage
    const stored = localStorage.getItem('sizeGroups');
    return stored ? JSON.parse(stored) : DEFAULT_SIZE_GROUPS;
  });

  // Salva no localStorage sempre que alterar
  useEffect(() => {
    localStorage.setItem('sizeGroups', JSON.stringify(sizeGroups));
  }, [sizeGroups]);

  const addGroup = (group: Omit<SizeGroup, 'id'>) => {
    const id = group.name.toLowerCase().replace(/\s+/g, '_');
    const newGroup: SizeGroup = { id, ...group };
    setSizeGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  const updateGroup = (id: string, group: Partial<SizeGroup>) => {
    setSizeGroups(prev => prev.map(g => g.id === id ? { ...g, ...group } : g));
  };

  const deleteGroup = (id: string) => {
    setSizeGroups(prev => prev.filter(g => g.id !== id));
  };

  const getGroupById = (id: string) => {
    return sizeGroups.find(g => g.id === id);
  };

  return {
    sizeGroups,
    setSizeGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById
  };
}
