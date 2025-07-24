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

// Store untuk menyimpan foto yang akan diupload
let pendingImageUploads: { [nodeId: string]: { file: File; oldPhotoUrl?: string } } = {};

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
  let currentPhotoUrl = data[editElement.binding] || "";
  const rOnlyAttr = readOnly ? "readonly" : "";
  const rDisabledAttr = readOnly ? "disabled" : "";

  const changePhotoButton = currentPhotoUrl ? 
    `<button type="button" onclick="document.getElementById('${id}').click()" 
             style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">
       Ganti Foto
     </button>` : '';

  return {
    html: `<div class="input-file-field">
              ${currentPhotoUrl ? `<div style="margin-bottom: 10px;">
                <img src="${currentPhotoUrl}" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;" alt="Current photo" />
                <p style="font-size: 12px; color: #666; margin: 5px 0;">Current photo</p>
                ${changePhotoButton}
              </div>` : ''}
              <input ${rDisabledAttr} placeholder="Select new image" type="file" accept="image/*" ${rOnlyAttr}
                id="${id}" name="${id}" style="width: 100%; height: 40px; ${currentPhotoUrl ? 'display: none;' : ''}" 
                data-binding="${editElement.binding}" onchange="handleFileSelect(event)" />
              <input type="hidden" id="${id}_url" data-binding="${editElement.binding}" value="${currentPhotoUrl}" />
              ${!currentPhotoUrl ? `<label for="${id}" style="display: block; padding: 10px; border: 2px dashed #ccc; text-align: center; cursor: pointer; border-radius: 4px;">
                Click to select image
              </label>` : ''}
           </div>`,
    id: id,
    value: currentPhotoUrl,
  };
};

FamilyTree.elements.myChangePhotoButton = function (data, editElement, minWidth, readOnly) {
  const id = FamilyTree.elements.generateId();
  const currentPhotoUrl = data["photo"] || "";
  
  if (readOnly || !currentPhotoUrl) {
    return {
      html: "",
      id: id,
      value: ""
    };
  }

  return {
    html: `<div style="margin-top: -40px; margin-left: 120px;">
              <button type="button" onclick="document.querySelector('input[data-binding=photo]').click()" 
                     style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Ganti Foto
              </button>
           </div>`,
    id: id,
    value: ""
  };
};

export default function Tree({ dataTree }: FamilyTreeComponentProps) {
  const treeRef = useRef<FamilyTree | null>(null);
  const [dialogStatus, setDialogStatus] = useState(false);
  const router = useRouter();
  const [idNode, setIdNode] = useState<string | null>(null);
  const xmlSnapshotRef = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [treeMetadata, setTreeMetadata] = useState({
    id: dataTree.id,
    name: dataTree.name,
    description: dataTree.description,
  });

  // Move nodeBinding inside useMemo to prevent unnecessary re-renders
  const nodeBinding = useMemo(
    () => ({
      field_0: "name",
      img_0: "photo",  // pastikan ini sesuai dengan binding field foto
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

  // Function untuk menghapus foto lama dari storage
  const deleteOldPhoto = useCallback(async (photoUrl: string) => {
    if (!photoUrl || !photoUrl.includes('image-tree')) return;
    
    try {
      // Extract file path from URL, handle URL parameters
      const urlParts = photoUrl.split('?')[0].split('/'); // Remove parameters first
      const fileName = urlParts[urlParts.length - 1];
      
      console.log('Attempting to delete file:', fileName); // Debug log
      
      const { error } = await supabase.storage
        .from('image-tree')
        .remove([fileName]);
        
      if (error) {
        console.error('Error deleting old photo:', error);
      } else {
        console.log('Old photo deleted successfully:', fileName);
      }
    } catch (error) {
      console.error('Error deleting old photo:', error);
    }
  }, []);

  // Function untuk upload foto ke storage
  const uploadImageToStorage = useCallback(async (file: File, nodeId: string) => {
    try {
      const fileName = `image-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("image-tree").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const imageUrlPath = await supabase.storage.from("image-tree").getPublicUrl(data.path).data.publicUrl;
        return imageUrlPath;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }, []);

  // Function untuk handle file selection (tidak langsung upload)
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !idNode) return;
  
    // Get current photo URL from hidden input (lebih akurat)
    const hiddenInput = document.querySelector('input[type="hidden"][data-binding="photo"]') as HTMLInputElement;
    const oldPhotoUrl = hiddenInput?.value || "";
  
    // Store file untuk diupload nanti saat save
    pendingImageUploads[idNode] = {
      file,
      oldPhotoUrl: oldPhotoUrl || undefined
    };
  
    console.log(`File selected for node ${idNode}:`, file.name);
    console.log(`Old photo URL to delete:`, oldPhotoUrl); // Debug log
  
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Update preview image in form
      const imgElement = document.querySelector(`img[alt="Current photo"]`) as HTMLImageElement;
      if (imgElement) {
        imgElement.src = result;
      }
      
      // Show change photo button and hide file input
      const fileInput = event.target;
      fileInput.style.display = 'none';
      
      // Add change photo button if not exists
      const container = fileInput.closest('.input-file-field');
      if (container && !container.querySelector('button')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Ganti Foto';
        button.style.cssText = 'background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;';
        button.onclick = () => fileInput.click();
        container.appendChild(button);
      }
    };
    reader.readAsDataURL(file);
  }, [idNode]);

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
      router.push("/auth");
    }
  }, [router]);

  const handleSaveTree = useCallback(async () => {
    if (!treeRef.current) return;

    try {
      xmlSnapshotRef.current = treeRef.current.getXML();
      const jsonNodes = convertXmlToJson(xmlSnapshotRef.current);
      const { data: updatedData, error } = await supabase
        .from("trees")
        .update({ file: jsonNodes })
        .eq("id", dataTree.id);

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

  // Process pending image uploads when form is saved
  const processPendingUploads = useCallback(async (nodeData: any) => {
    const nodeId = nodeData.id;
    const pendingUpload = pendingImageUploads[nodeId];
    
    if (!pendingUpload) return nodeData;

    setIsUploading(true);
    
    try {
      // Upload new image
      const newImageUrl = await uploadImageToStorage(pendingUpload.file, nodeId);
      
      // Delete old image if exists
      if (pendingUpload.oldPhotoUrl) {
        await deleteOldPhoto(pendingUpload.oldPhotoUrl);
      }
      
      // Update node data with new image URL
      nodeData.photo = newImageUrl;
      
      // Remove from pending uploads
      delete pendingImageUploads[nodeId];
      
      console.log(`Image uploaded successfully for node ${nodeId}:`, newImageUrl);
      
    } catch (error) {
      console.error("Error processing image upload:", error);
      alert("Error uploading image: " + (error as Error).message);
      // Keep old photo on error
      if (pendingUpload.oldPhotoUrl) {
        nodeData.photo = pendingUpload.oldPhotoUrl;
      }
    } finally {
      setIsUploading(false);
    }
    
    return nodeData;
  }, [uploadImageToStorage, deleteOldPhoto]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Set global function untuk file selection
    (window as unknown as Window & { handleFileSelect: typeof handleFileSelect }).handleFileSelect = handleFileSelect;

    const el = document.getElementById("tree");
    if (!el) return;

    const importCSVHandler = () => {
      if (treeRef.current) treeRef.current.importCSV();
    };

    treeRef.current = new FamilyTree(el, {
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
          { type: "myInputFile", label: "Photo", binding: "photo" },
          { type: "myChangePhotoButton", label: "", binding: "changePhoto" },
          { type: "myTextArea", label: "Note", binding: "note" },
        ],
        buttons: {
          pdf: null,
          share: null,
        },
      },
    });

    // Event handler untuk click node
    treeRef.current.on("click", (sender, args) => {
      setIdNode(args.node.id);
    });

    // Handle form submission - process pending uploads saat Save and Close
    treeRef.current.on("update", async (sender, args) => {
      if (args.updateNodesData && args.updateNodesData.length > 0) {
        // Process each node that has pending image uploads
        for (let i = 0; i < args.updateNodesData.length; i++) {
          const nodeData = args.updateNodesData[i];
          args.updateNodesData[i] = await processPendingUploads(nodeData);
        }
        
        // Save updated tree to database after all uploads are complete
        try {
          xmlSnapshotRef.current = treeRef.current?.getXML() || '';
          const jsonNodes = convertXmlToJson(xmlSnapshotRef.current);
          const { data: updateResult, error: dbError } = await supabase
            .from("trees")
            .update({ file: jsonNodes })
            .eq("id", dataTree.id);
            
          if (dbError) {
            console.error("Error saving tree:", dbError);
            alert("Error menyimpan ke database");
          } else {
            console.log("Tree saved successfully:", updateResult);
          }
        } catch (error) {
          console.error("Error saving tree:", error);
          alert("Error menyimpan tree");
        }
      }
    });

    return () => {
      // Cleanup
      if (treeRef.current) {
        treeRef.current = null;
      }
      // Clear pending uploads
      pendingImageUploads = {};
    };
  }, [dataTree.file, dataTree.id, nodeBinding, handleSaveTree, handleDialogOpen, handleLogout, handleFileSelect, processPendingUploads]);

  return (
    <>
      <Dialog 
        status={dialogStatus} 
        id={treeMetadata.id} 
        name={treeMetadata.name} 
        description={treeMetadata.description} 
        handleDialogClose={handleDialogClose} 
        onUpdateSuccess={handleUpdateSuccess} 
      />

      {isUploading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded">
          Uploading image...
        </div>
      )}

      <div id="tree" className="w-full" />
    </>
  );
}