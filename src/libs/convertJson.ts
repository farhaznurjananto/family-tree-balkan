import { NodeData } from "@/types/tree";
import { XMLParser } from "fast-xml-parser";

export const convertXmlToJson = (xmlString: string) => {
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
