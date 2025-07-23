"use client";
import supabase from "@/libs/db";
import { useEffect, useState } from "react";

interface Props {
  status: boolean;
  id: number;
  name: string;
  description: string;
  handleDialogClose: () => void;
  onUpdateSuccess: (updatedData: { id: number; name: string; description: string }) => void;
}

export default function Dialog(props: Props) {
  const [name, setName] = useState(props.name);
  const [description, setDescription] = useState(props.description);

  // Reset state saat dialog dibuka
  useEffect(() => {
    if (props.status) {
      setName(props.name);
      setDescription(props.description);
    }
  }, [props.status, props.name, props.description]);

  const handleCancel = () => {
    setName(props.name);
    setDescription(props.description);
    props.handleDialogClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("trees")
      .update({
        name,
        description,
      })
      .eq("id", props.id)
      .select()
      .single(); // pastikan hanya satu row diambil

    if (error) {
      alert("Update gagal: " + error.message);
    } else {
      alert("Data berhasil diperbarui");
      props.onUpdateSuccess(data); // ⬅️ Beritahu parent dengan data terbaru
      props.handleDialogClose(); // ⬅️ Tutup dialog
    }
  };

  if (!props.status) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <h1>Edit Meta Data</h1>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <label htmlFor="input">Nama Keluarga:</label>
          <input type="text" id="input" placeholder="Keluarga Cemara" value={name} onChange={(e) => setName(e.target.value)} name="name" required />

          <label htmlFor="textarea">Deskripsi:</label>
          <textarea id="textarea" placeholder="Deskripsi Keluarga Cemara" value={description} onChange={(e) => setDescription(e.target.value)} name="description" required></textarea>

          <div className="dialog-actions">
            <button type="submit">Submit</button>
            <button type="button" onClick={handleCancel}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
