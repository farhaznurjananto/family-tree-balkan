"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FamilyTree from "@balkangraph/familytree.js";
import { XMLParser } from "fast-xml-parser";
import supabase from "@/libs/db";
import Dialog from "@/components/dialog";
import { ITree } from "@/types/tree";
import { useRouter } from "next/navigation";

interface NodeData {
  id: number;
  pids?: string | string[] | number | number[];
  gender: "male" | "female";
  name: string;
  photo?: string;
  birthDate?: string;
  deathDate?: string;
  address?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  note?: string;
  mid?: number;
  fid?: number;
}

interface FamilyTreeComponentProps {
  dataTree: ITree;
}

FamilyTree.templates.customCard = Object.assign({}, FamilyTree.templates.tommy);
FamilyTree.templates.customCard.size = [150, 200];

FamilyTree.templates.customCard.node = `
  <rect x="0" y="0" width="150" height="200" rx="10" ry="10" fill="#4D4D4D" stroke="#aeaeae" stroke-width="1"></rect>
`;

FamilyTree.templates.customCard_male = Object.assign({}, FamilyTree.templates.customCard);
FamilyTree.templates.customCard_male.node = `
  <rect x="0" y="0" width="150" height="200" rx="10" ry="10" fill="#039be5" stroke="#aeaeae" stroke-width="1"></rect>
`;

FamilyTree.templates.customCard_female = Object.assign({}, FamilyTree.templates.customCard);
FamilyTree.templates.customCard_female.node = `
  <rect x="0" y="0" width="150" height="200" rx="10" ry="10" fill="#FF46A3" stroke="#aeaeae" stroke-width="1"></rect>
`;

FamilyTree.templates.customCard.defs = "";

FamilyTree.templates.customCard.ripple = {
  radius: 100,
  color: "#e6e6e6",
  rect: undefined,
};

FamilyTree.templates.customCard.img_0 =
  '<clipPath id="ulaImg">' + '<circle cx="100" cy="150" r="40"></circle>' + "</clipPath>" + '<image preserveAspectRatio="xMidYMid slice" clip-path="url(#ulaImg)" xlink:href="{val}" x="60" y="110" width="80" height="80">' + "</image>";

FamilyTree.templates.customCard.field_0 = '<text style="font-size: 24px;" fill="#ffffff" data-text-overflow="multiline" x="100" y="90" text-anchor="middle">{val}</text>';

FamilyTree.templates.customCard.link = '<path stroke="#686868" stroke-width="1px" fill="none" data-l-id="[{id}][{child-id}]" d="M{xa},{ya} C{xb},{yb} {xc},{yc} {xd},{yd}" />';

FamilyTree.templates.customCard.nodeMenuButton =
  '<g style="cursor:pointer;" transform="matrix(1,0,0,1,93,15)" data-ctrl-n-menu-id="{id}">' +
  '<rect x="-4" y="-10" fill="#000000" fill-opacity="0" width="22" height="22">' +
  "</rect>" +
  '<line x1="0" y1="0" x2="0" y2="10" stroke-width="2" stroke="rgb(255, 202, 40)" />' +
  '<line x1="7" y1="0" x2="7" y2="10" stroke-width="2" stroke="rgb(255, 202, 40)" />' +
  '<line x1="14" y1="0" x2="14" y2="10" stroke-width="2" stroke="rgb(255, 202, 40)" />' +
  "</g>";

FamilyTree.templates.customCard.menuButton =
  '<div style="position:absolute;right:{p}px;top:{p}px; width:40px;height:50px;cursor:pointer;" data-ctrl-menu="">' +
  '<hr style="background-color: rgb(255, 202, 40); height: 3px; border: none;">' +
  '<hr style="background-color: rgb(255, 202, 40); height: 3px; border: none;">' +
  '<hr style="background-color: rgb(255, 202, 40); height: 3px; border: none;">' +
  "</div>";

FamilyTree.templates.customCard.pointer =
  '<g data-pointer="pointer" transform="matrix(0,0,0,0,100,100)">><g transform="matrix(0.3,0,0,0.3,-17,-17)">' +
  '<polygon fill="rgb(255, 202, 40)" points="53.004,173.004 53.004,66.996 0,120" />' +
  '<polygon fill="rgb(255, 202, 40)" points="186.996,66.996 186.996,173.004 240,120" />' +
  '<polygon fill="rgb(255, 202, 40)" points="66.996,53.004 173.004,53.004 120,0" />' +
  '<polygon fill="rgb(255, 202, 40)" points="120,240 173.004,186.996 66.996,186.996" />' +
  '<circle fill="rgb(255, 202, 40)" cx="120" cy="120" r="30" />' +
  "</g></g>";

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
    html: `<div class="input-file-field">
                      <input ${rDisabledAttr} placeholder="Note" type="file" accept="image/*" ${rOnlyAttr} id="${id}" name="${id}" style="width: 100%;height: 100px;" data-binding="${editElement.binding}">${value}</input></div>`,
    id: id,
    value: value,
  };
};

export default function Tree({ dataTree }: FamilyTreeComponentProps) {
  const treeRef = useRef<FamilyTree | null>(null);
  const [dialogStatus, setDialogStatus] = useState(false);
  const router = useRouter();

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
      router.push("/auth"); // Kembali ke halaman login
    }
  }, [router]);

  const handleSaveTree = useCallback(async () => {
    if (!treeRef.current) return;

    try {
      // alert("Saving tree");
      const wholeTreeData = treeRef.current.getXML();
      const jsonNodes = convertXmlToJson(wholeTreeData);
      const { data, error } = await supabase.from("trees").update({ file: jsonNodes }).eq("id", dataTree.id);

      if (error) {
        console.error("Error saving tree:", error);
        alert("Error saving tree");
      } else {
        console.log("Tree saved successfully:", data);
        alert("Tree saved successfully");
      }
    } catch (error) {
      alert("Error saving tree");
      console.error("Error saving tree:", error);
    }
  }, [dataTree.id]);

  const convertXmlToJson = (xmlString: string) => {
    const parser = new XMLParser({
      ignoreAttributes: false, // Baca atribut XML
      attributeNamePrefix: "", // Tanpa prefix
      parseAttributeValue: true, // Parse atribut jadi tipe yang tepat
      parseTagValue: true, // Parse tag values dengan strnum
      numberParseOptions: {
        // Opsi parsing angka
        hex: false, // Jangan parse hex
        leadingZeros: false, // Jangan parse leading zeros sebagai octal
        eNotation: true, // Parse scientific notation
      },
      isArray: (name, jpath) => {
        // Kontrol array parsing
        if (jpath === "nodes.node") return true;
        return false;
      },
    });

    try {
      const jsonData = parser.parse(xmlString);
      const nodesArray = Array.isArray(jsonData.nodes.node) ? jsonData.nodes.node : [jsonData.nodes.node];

      // Konversi sesuai dengan interface NodeData
      const formattedNodes: NodeData[] = nodesArray.map((node: NodeData) => {
        const formattedNode: Partial<NodeData> = {
          id: node.id,
          name: node.name,
          gender: node.gender,
        };

        // Handle semua field optional sesuai interface
        if (node.pids !== undefined) {
          // Perbaikan: Handle pids baik sebagai array maupun string dengan koma
          if (Array.isArray(node.pids)) {
            formattedNode.pids = node.pids;
          } else if (typeof node.pids === "string") {
            // Jika string dengan koma, split menjadi array dan trim whitespace
            formattedNode.pids = node.pids
              .split(",")
              .map((pid: string) => pid.trim())
              .filter((pid: string) => pid !== "");
          } else {
            // Jika single value bukan string
            formattedNode.pids = [node.pids];
          }
        }

        if (node.photo !== undefined) {
          formattedNode.photo = node.photo;
        }

        if (node.birthDate !== undefined) {
          formattedNode.birthDate = node.birthDate;
        }

        if (node.deathDate !== undefined) {
          formattedNode.deathDate = node.deathDate;
        }

        if (node.address !== undefined) {
          formattedNode.address = node.address;
        }

        if (node.phone !== undefined) {
          formattedNode.phone = node.phone;
        }

        if (node.email !== undefined) {
          formattedNode.email = node.email;
        }

        if (node.occupation !== undefined) {
          formattedNode.occupation = node.occupation;
        }

        if (node.note !== undefined) {
          formattedNode.note = node.note;
        }

        if (node.mid !== undefined) {
          formattedNode.mid = node.mid;
        }

        if (node.fid !== undefined) {
          formattedNode.fid = node.fid;
        }

        return formattedNode as NodeData;
      });

      return formattedNodes;
    } catch (error) {
      console.error("Error parsing XML:", error);
      return [];
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

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
  }, [dataTree.file, dataTree.id, nodeBinding, handleSaveTree, dialogStatus, handleDialogOpen, handleLogout]);

  return (
    <>
      <Dialog status={dialogStatus} id={treeMetadata.id} name={treeMetadata.name} description={treeMetadata.description} handleDialogClose={handleDialogClose} onUpdateSuccess={handleUpdateSuccess} />

      <div id="tree" className="w-full" />
    </>
  );
}
