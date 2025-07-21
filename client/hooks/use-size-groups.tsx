import { useState, useEffect } from "react";

export interface SizeGroup {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  sizes: string[];
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useSizeGroups() {
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch size groups from API
  const fetchSizeGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/size-groups");
      if (response.ok) {
        const data = await response.json();
        setSizeGroups(data);
      } else {
        throw new Error("Failed to fetch size groups");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching size groups:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load size groups on mount
  useEffect(() => {
    fetchSizeGroups();
  }, []);

  const addGroup = async (
    group: Omit<SizeGroup, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      const response = await fetch("/api/size-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(group),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setSizeGroups((prev) => [...prev, newGroup]);
        return newGroup;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create size group");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const updateGroup = async (
    id: number,
    group: Partial<Omit<SizeGroup, "id" | "created_at" | "updated_at">>,
  ) => {
    try {
      const response = await fetch(`/api/size-groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(group),
      });

      if (response.ok) {
        const updatedGroup = await response.json();
        setSizeGroups((prev) =>
          prev.map((g) => (g.id === id ? updatedGroup : g)),
        );
        return updatedGroup;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update size group");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const deleteGroup = async (id: number) => {
    try {
      const response = await fetch(`/api/size-groups/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSizeGroups((prev) => prev.filter((g) => g.id !== id));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete size group");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  };

  const getGroupById = (id: number) => {
    return sizeGroups.find((g) => g.id === id);
  };

  return {
    sizeGroups,
    loading,
    error,
    setSizeGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    refetch: fetchSizeGroups,
  };
}
