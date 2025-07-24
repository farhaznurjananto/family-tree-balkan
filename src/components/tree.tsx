"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FamilyTree from "@balkangraph/familytree.js";
import supabase from "@/libs/db";
import Dialog from "@/components/dialog";
import { ITree, NodeData } from "@/types/tree";
import { useRouter } from "next/navigation";
import { convertXmlToJson } from "@/libs/convertJson";

interface FamilyTreeComponentProps {
  dataTree: ITree;
}

FamilyTree.elements.myTextArea = function (data, editElement, minWidth, readOnly) {
  const id = FamilyTree.elements.generateId();
  let value = data[editElement.binding];
  if (value == undefined) value = "";
  if (readOnly && !value) {
    return {
      html: "",
    };
  }
  const rOnlyAttr = readOnly ? "readonly" : "";
  const rDisabledAttr = readOnly ? "disabled" : "";
  return {
    html: `<div class="textarea-field">
                      <textarea ${rDisabledAttr} placeholder="Note" ${rOnlyAttr} id="${id}" name="${id}" style="width: 100%;height: 100px;" data-binding="${editElement.binding}">${value}</textarea></div>`,
    id: id,
    value: value,
  };
};

FamilyTree.elements.myInputFile = function (data, editElement, minWidth, readOnly) {
  const id = FamilyTree.elements.generateId();
  const rOnlyAttr = readOnly ? "readonly" : "";
  const rDisabledAttr = readOnly ? "disabled" : "";

  return {
    html: `<div class="input-file-field">
              <input ${rDisabledAttr} placeholder="Note" type="file" accept="image/*" ${rOnlyAttr}
                id="${id}" name="${id}" style="width: 100%; height: 100px;" 
                data-binding="${editElement.binding}" onchange="handleUploadImage(event)" />
           </div>`,
    id: id,
    value: "", // karena file tidak punya value
  };
};

export default function Tree({ dataTree }: FamilyTreeComponentProps) {
  const treeRef = useRef<FamilyTree | null>(null);
  const [dialogStatus, setDialogStatus] = useState(false);
  const router = useRouter();
  const [idNode, setIdNode] = useState<string | null>(null);
  const xmlSnapshotRef = useRef<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [treeMetadata, setTreeMetadata] = useState({
    id: dataTree.id,
    name: dataTree.name,
    description: dataTree.description,
  });

  // Move nodeBinding inside useMemo to prevent unnecessary re-renders
  const nodeBinding = useMemo(
    () => ({
      field_0: "name",
      img_0: "photo",
    }),
    []
  );

  const handleUpdateSuccess = useCallback((updatedData: { id: number; name: string; description: string }) => {
    setTreeMetadata((prev) => ({
      ...prev,
      name: updatedData.name,
      description: updatedData.description,
    }));
  }, []);

  const handleUploadImage = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const imageTree = event.target.files?.[0];
      if (!imageTree) return;

      const fileName = `iamge-${Date.now()}.png`;
      const { data, error } = await supabase.storage.from("image-tree").upload(fileName, imageTree, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        console.error("Upload failed:", error.message);
      } else {
        console.log("Upload success:", data);
      }

      if (data) {
        const imageUrlPath = await supabase.storage.from("image-tree").getPublicUrl(data.path).data.publicUrl;
        setImageUrl(imageUrlPath);

        if (idNode && treeRef.current) {
          // Ambil node lama
          const oldNode = treeRef.current.get(idNode);

          if (!oldNode) {
            console.warn("Node tidak ditemukan:", idNode);
            return;
          }

          // Gabungkan data lama dengan photo baru
          treeRef.current.updateNode({
            ...oldNode,
            photo: imageUrlPath,
          });

          xmlSnapshotRef.current = treeRef.current.getXML();
          const jsonNodes = convertXmlToJson(xmlSnapshotRef.current);
          const { data: updateResult, error } = await supabase.from("trees").update({ file: jsonNodes }).eq("id", dataTree.id);
          if (error) {
            console.error("Error saving tree:", error);
          } else {
            console.log("Tree saved successfully:", updateResult);
          }
        }
      }
    },
    [dataTree.id, idNode]
  );

  const handleDialogOpen = useCallback((status: boolean) => {
    setDialogStatus(status);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogStatus(false);
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout gagal: " + error.message);
    } else {
      localStorage.clear();
      sessionStorage.clear();
      router.push("/auth"); // Kembali ke halaman login
    }
  }, [router]);

  const handleSaveTree = useCallback(async () => {
    if (!treeRef.current) return;

    try {
      xmlSnapshotRef.current = treeRef.current.getXML();
      const jsonNodes = convertXmlToJson(xmlSnapshotRef.current);
      const { data: updatedData, error } = await supabase.from("trees").update({ file: jsonNodes }).eq("id", dataTree.id);

      if (error) {
        console.error("Error saving tree:", error);
        alert("Error saving tree");
      } else {
        console.log("Tree saved successfully:", updatedData);
        alert("Tree saved successfully");
      }
    } catch (error) {
      alert("Error saving tree");
      console.error("Error saving tree:", error);
    }
  }, [dataTree.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as Window & { handleUploadImage: typeof handleUploadImage }).handleUploadImage = handleUploadImage;

    const el = document.getElementById("tree");
    if (!el) return;

    const importCSVHandler = () => {
      if (treeRef.current) treeRef.current.importCSV();
    };

    treeRef.current = new FamilyTree(el, {
      // template: "customCard",
      nodes: dataTree.file,
      nodeBinding,
      menu: {
        home: {
          text: "Edit Meta Data",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="grey" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>`,
          onClick: () => handleDialogOpen(true),
        },
        save: {
          text: "Save",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="grey" viewBox="0 0 256 256"><path d="M219.31,72,184,36.69A15.86,15.86,0,0,0,172.69,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V83.31A15.86,15.86,0,0,0,219.31,72ZM168,208H88V152h80Zm40,0H184V152a16,16,0,0,0-16-16H88a16,16,0,0,0-16,16v56H48V48H172.69L208,83.31ZM160,72a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h56A8,8,0,0,1,160,72Z"></path></svg>`,
          onClick: handleSaveTree,
        },
        importCSV: {
          text: "Import CSV",
          icon: FamilyTree.icon.csv(24, 24, "grey"),
          onClick: importCSVHandler,
        },
        pdf: { text: "Export PDF" },
        png: { text: "Export PNG" },
        logout: {
          text: "Logout",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="grey" viewBox="0 0 256 256"><path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z"></path></svg>`,
          onClick: handleLogout,
        },
      },
      nodeMenu: {
        details: { text: "Details" },
        edit: { text: "Edit" },
      },
      nodeTreeMenu: true,
      miniMap: true,
      toolbar: {
        zoom: true,
        fit: true,
        expandAll: true,
      },
      undoRedoStorageName: "myStorageName",
      editForm: {
        generateElementsFromFields: false,
        addMore: undefined,
        elements: [
          { type: "textbox", label: "Full Name", binding: "name", vlidators: { required: "Is required" } },
          { type: "date", label: "Birth Date", binding: "birthDate" },
          { type: "date", label: "Death Date", binding: "deathDate" },
          {
            type: "select",
            label: "Gender",
            binding: "gender",
            options: [
              { value: "male", text: "Male" },
              { value: "female", text: "Female" },
            ],
          },
          { type: "textbox", label: "Phone Number", binding: "phone" },
          { type: "textbox", label: "Email Address", binding: "email" },
          { type: "textbox", label: "Address", binding: "address" },
          { type: "textbox", label: "Occupation", binding: "occupation" },
          { type: "myInputFile", label: "Photo URL", binding: "photo" },
          { type: "myTextArea", label: "Note", binding: "note" },
        ],
        buttons: {
          pdf: null,
          share: null,
        },
      },
    });
    // if (!treeRef.current) return;
    // Jalankan ketika form edit muncul

    const node = treeRef.current?.get(idNode!) as NodeData;


    treeRef.current.on("click", (sender, args) => {
      setIdNode(args.node.id);
    });

    treeRef.current.on("update", (sender, args) => {
      if (idNode && treeRef.current) {
        // Ambil node lama
        const oldNode = treeRef.current.get(idNode);

        if (!oldNode) {
          console.warn("Node tidak ditemukan:", idNode);
          return;
        }

        // Gabungkan data lama dengan photo baru
        treeRef.current.updateNode({
          ...oldNode,
          photo: "imageUrl",
        });
      }
    });
  }, [dataTree.file, dataTree.id, nodeBinding, handleSaveTree, dialogStatus, handleDialogOpen, handleLogout, handleUploadImage, idNode]);

  return (
    <>
      <Dialog status={dialogStatus} id={treeMetadata.id} name={treeMetadata.name} description={treeMetadata.description} handleDialogClose={handleDialogClose} onUpdateSuccess={handleUpdateSuccess} />

      <div id="tree" className="w-full" />
    </>
  );
}
