"use client";

import Tree from "@/components/tree";
import supabase from "@/libs/db";
import { ITree } from "@/types/tree";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [trees, setTrees] = useState<ITree[]>([]);
  const [loading, setLoading] = useState(true); // Tambahkan state untuk loading

  useEffect(() => {
    const fetchTrees = async () => {
      setLoading(true); // Set loading true sebelum fetch
      const { data, error } = await supabase.from("trees").select("*");
      if (error) {
        console.error("Error fetching trees:", error);
      } else {
        setTrees(data as ITree[]);
      }
      setLoading(false); // Set loading false setelah fetch selesai
    };

    fetchTrees();
  }, []);

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }

  return <>{trees.length > 0 ? <Tree dataTree={trees[0]} /> : <div className="loading">No trees available</div>}</>;
}
