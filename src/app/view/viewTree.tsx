import React, { Component, RefObject } from 'react';
import FamilyTree from "@balkangraph/familytree.js";

// Interface untuk node data
interface FamilyNode {
    id: string;
    name: string;
    photo?: string;
    gender: 'male' | 'female';
    birthDate?: string;
    deathDate?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    mid?: string; // Mother ID
    fid?: string; // Father ID
    pids?: string[]; // Partner IDs
}

// Props interface
interface TreeProps {
    nodes: FamilyNode[];
}

// State interface
interface TreeState {
    selectedNode: FamilyNode | null;
    sidebarOpen: boolean;
}

export default class Tree extends Component<TreeProps, TreeState> {
    private divRef: RefObject<HTMLDivElement>;
    private family: any; // FamilyTree instance

    constructor(props: TreeProps) {
        super(props);
        this.divRef = React.createRef<HTMLDivElement>();
        this.state = {
            selectedNode: null,
            sidebarOpen: false
        };
    }

    shouldComponentUpdate(nextProps: TreeProps, nextState: TreeState): boolean {
        // Update jika sidebar state berubah atau props nodes berubah
        return this.state.sidebarOpen !== nextState.sidebarOpen || 
               this.state.selectedNode !== nextState.selectedNode ||
               this.props.nodes !== nextProps.nodes;
    }

    componentDidMount(): void {
        // Definisi template kustom dengan ukuran gambar yang disesuaikan
        FamilyTree.templates.base.defs = 
            `<g transform="matrix(1,0,0,1,0,0)" id="dot"><circle class="ba-fill" cx="0" cy="0" r="5" stroke="#aeaeae" stroke-width="1"></circle></g>
            <g id="base_node_menu" style="cursor:pointer;">
                <rect x="0" y="0" fill="transparent" width="22" height="22"></rect>
                <circle cx="4" cy="11" r="2" fill="#4A4A4A"></circle>
                <circle cx="11" cy="11" r="2" fill="#4A4A4A"></circle>
                <circle cx="18" cy="11" r="2" fill="#4A4A4A"></circle>
            </g>
            <g style="cursor: pointer;" id="base_tree_menu">
                <rect x="0" y="0" width="25" height="25" fill="transparent"></rect>
                ${FamilyTree.icon.addUser(13, 13, '#4A4A4A', 0, 0)}
            </g>
            <g style="cursor: pointer;" id="base_tree_menu_close">
                <circle cx="9" cy="9" r="10" fill="#aeaeae"></circle>
                ${FamilyTree.icon.close(18, 18, '#4A4A4A', 0, 0)}
            </g>            
            <g id="base_up">
                <circle cx="15" cy="15" r="15" fill="#fff" stroke="#aeaeae" stroke-width="1"></circle>
                ${FamilyTree.icon.ft(20,20,'#aeaeae', 5, 5)}
            </g>
            <clipPath id="base_img_0">
                <rect id="base_img_0_stroke" stroke-width="3" x="8" y="8" rx="10" ry="10" width="168" height="232"></rect>
            </clipPath>`;

        // Template untuk node utama (tanpa menu buttons) - ukuran 184x270
        FamilyTree.templates.myTemplate = Object.assign({}, FamilyTree.templates.tommy);
        FamilyTree.templates.myTemplate.size = [184, 270];
        // Hilangkan menu buttons
        FamilyTree.templates.myTemplate.nodeTreeMenuButton = '';
        FamilyTree.templates.myTemplate.nodeMenuButton = '';
        FamilyTree.templates.myTemplate.nodeTreeMenuCloseButton = '';
        
        FamilyTree.templates.myTemplate_male = Object.assign({}, FamilyTree.templates.tommy);
        FamilyTree.templates.myTemplate_male.size = [184, 270];
        // Hilangkan menu buttons untuk male
        FamilyTree.templates.myTemplate_male.nodeTreeMenuButton = '';
        FamilyTree.templates.myTemplate_male.nodeMenuButton = '';
        FamilyTree.templates.myTemplate_male.nodeTreeMenuCloseButton = '';
        
        FamilyTree.templates.myTemplate_female = Object.assign({}, FamilyTree.templates.tommy);
        FamilyTree.templates.myTemplate_female.size = [184, 270];
        // Hilangkan menu buttons untuk female
        FamilyTree.templates.myTemplate_female.nodeTreeMenuButton = '';
        FamilyTree.templates.myTemplate_female.nodeMenuButton = '';
        FamilyTree.templates.myTemplate_female.nodeTreeMenuCloseButton = '';

        // Node styling berdasarkan gender
        FamilyTree.templates.myTemplate_male.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#7DACFF" stroke="#aeaeae" rx="15" ry="15"></rect>`;
        FamilyTree.templates.myTemplate_female.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#60EDF7" stroke="#aeaeae" rx="15" ry="15"></rect>`;

        // Field styling untuk nama - posisi disesuaikan untuk ukuran 184x270
        FamilyTree.templates.myTemplate.field_0 = 
        FamilyTree.templates.myTemplate_male.field_0 =
        FamilyTree.templates.myTemplate_female.field_0 =
            `<text data-width="182" data-text-overflow="ellipsis"  style="font-size: 18px; font-weight: bold" fill="#4A4A4A" x="92" y="262" text-anchor="middle">{val}</text>`;

        // Image styling - foto dengan ukuran yang disesuaikan (168x232)
        FamilyTree.templates.myTemplate.img_0 =
        FamilyTree.templates.myTemplate_male.img_0 =
        FamilyTree.templates.myTemplate_female.img_0 =
            `<use xlink:href="#base_img_0_stroke" />
            <image preserveAspectRatio="xMidYMid slice" clip-path="url(#base_img_0)" xlink:href="{val}" x="8" y="8" width="168" height="232"></image>`;

        // Template untuk placeholder nodes - ukuran 184x270
        FamilyTree.templates.mother = Object.assign({}, FamilyTree.templates.base);
        FamilyTree.templates.mother.up = '';
        FamilyTree.templates.mother.size = [184, 270];
        FamilyTree.templates.mother.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#60EDF7" stroke="#aeaeae" rx="15" ry="15"></rect>
            <text data-width="182" data-text-overflow="ellipsis"  style="font-size: 20px; font-weight: bold" fill="#4A4A4A" x="92" y="140" text-anchor="middle">Add Mother</text>`;

        FamilyTree.templates.father = Object.assign({}, FamilyTree.templates.base);
        FamilyTree.templates.father.up = '';
        FamilyTree.templates.father.size = [184, 270];
        FamilyTree.templates.father.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#7DACFF" stroke="#aeaeae" rx="15" ry="15"></rect>
            <text data-width="182" data-text-overflow="ellipsis"  style="font-size: 20px; font-weight: bold" fill="#4A4A4A" x="92" y="140" text-anchor="middle">Add Father</text>`;

        FamilyTree.templates.husband = Object.assign({}, FamilyTree.templates.base);
        FamilyTree.templates.husband.up = '';
        FamilyTree.templates.husband.size = [184, 270];
        FamilyTree.templates.husband.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#7DACFF" stroke="#aeaeae" rx="15" ry="15"></rect>
            <text data-width="182" data-text-overflow="ellipsis"  style="font-size: 20px; font-weight: bold" fill="#4A4A4A" x="92" y="140" text-anchor="middle">Add Husband</text>`;

        FamilyTree.templates.son = Object.assign({}, FamilyTree.templates.base);
        FamilyTree.templates.son.up = '';
        FamilyTree.templates.son.size = [184, 270];
        FamilyTree.templates.son.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#7DACFF" stroke="#aeaeae" rx="15" ry="15"></rect>
            <text data-width="182" data-text-overflow="ellipsis"  style="font-size: 20px; font-weight: bold" fill="#4A4A4A" x="92" y="140" text-anchor="middle">Add Son</text>`;

        FamilyTree.templates.daughter = Object.assign({}, FamilyTree.templates.base);
        FamilyTree.templates.daughter.up = '';
        FamilyTree.templates.daughter.size = [184, 270];
        FamilyTree.templates.daughter.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#60EDF7" stroke="#aeaeae" rx="15" ry="15"></rect>
            <text data-width="182" data-text-overflow="ellipsis"  style="font-size: 20px; font-weight: bold" fill="#4A4A4A" x="92" y="140" text-anchor="middle">Add Daughter</text>`;

        FamilyTree.templates.wife = Object.assign({}, FamilyTree.templates.base);
        FamilyTree.templates.wife.up = '';
        FamilyTree.templates.wife.size = [184, 270];
        FamilyTree.templates.wife.node = 
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="#60EDF7" stroke="#aeaeae" rx="15" ry="15"></rect>
            <text data-width="182" data-text-overflow="ellipsis"  style="font-size: 20px; font-weight: bold" fill="#4A4A4A" x="92" y="140" text-anchor="middle">Add Wife</text>`;

        // Inisialisasi FamilyTree dengan konfigurasi dari template
        this.family = new FamilyTree(this.divRef.current, {
            mode: 'dark',
            nodeTreeMenu: false, // Nonaktifkan tree menu
            nodeMouseClick: FamilyTree.action.none, // Nonaktifkan default click action
            template: 'myTemplate',
            nodeBinding: {
                field_0: "name",
                img_0: "photo"  // Menggunakan 'photo' sesuai dengan data
            },
            nodes: this.props.nodes
        });

        // Event listener untuk node click
        this.family.on('click', (sender: any, args: any) => {
            if (args.node) {
                const nodeData: FamilyNode = this.family.get(args.node.id);
                this.setState({
                    selectedNode: nodeData,
                    sidebarOpen: true
                });
            }
        });
    }

    // Helper function untuk format tanggal
    formatDate = (dateString: string): string => {
        if (!dateString) return 'Tidak diketahui';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Helper function untuk menghitung umur
    calculateAge = (birthDate?: string, deathDate?: string): string => {
        if (!birthDate) return 'Tidak diketahui';
        const birth = new Date(birthDate);
        const death = deathDate ? new Date(deathDate) : new Date();
        const age = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age > 0 ? `${age} tahun` : 'Tidak diketahui';
    }

    // Helper function untuk mendapatkan nama berdasarkan ID
    getNameById = (id: string): string => {
        const node = this.props.nodes.find(n => n.id === id);
        return node ? node.name : `ID: ${id}`;
    }

    closeSidebar = (): void => {
        this.setState({
            sidebarOpen: false,
            selectedNode: null
        });
    }

    render(): JSX.Element {
        const { selectedNode, sidebarOpen } = this.state;
        
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Sidebar */}
                <div style={{
                    position: 'absolute',
                    left: sidebarOpen ? '0' : '-400px',
                    top: '0',
                    width: '400px',
                    height: '100%',
                    backgroundColor: '#2d3748',
                    color: 'white',
                    padding: '20px',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
                    transition: 'left 0.3s ease-in-out',
                    zIndex: 1000,
                    overflowY: 'auto'
                }}>
                    {selectedNode && (
                        <>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ margin: 0 }}>Detail Informasi</h3>
                                <button 
                                    onClick={this.closeSidebar}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '20px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            {/* Foto - ukuran disesuaikan dengan rasio 184x270 */}
                            {selectedNode.photo && (
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <img 
                                        src={selectedNode.photo} 
                                        alt={selectedNode.name}
                                        style={{
                                            width: '168px',
                                            height: '232px',
                                            objectFit: 'cover',
                                            borderRadius: '10px',
                                            border: `3px solid ${selectedNode.gender === 'male' ? '#7DACFF' : '#60EDF7'}`
                                        }}
                                    />
                                </div>
                            )}
                            
                            {/* Informasi Detail */}
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Nama:</strong>
                                <div style={{ 
                                    marginTop: '5px', 
                                    padding: '8px', 
                                    backgroundColor: '#4a5568',
                                    borderRadius: '5px' 
                                }}>
                                    {selectedNode.name}
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Gender:</strong>
                                <div style={{ 
                                    marginTop: '5px', 
                                    padding: '8px', 
                                    backgroundColor: '#4a5568',
                                    borderRadius: '5px' 
                                }}>
                                    {selectedNode.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                                </div>
                            </div>

                            {/* Tanggal Lahir */}
                            {selectedNode.birthDate && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Tanggal Lahir:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {this.formatDate(selectedNode.birthDate)}
                                    </div>
                                </div>
                            )}

                            {/* Tanggal Meninggal */}
                            {selectedNode.deathDate && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Tanggal Meninggal:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {this.formatDate(selectedNode.deathDate)}
                                    </div>
                                </div>
                            )}

                            {/* Umur */}
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Umur {selectedNode.deathDate ? 'saat meninggal' : 'saat ini'}:</strong>
                                <div style={{ 
                                    marginTop: '5px', 
                                    padding: '8px', 
                                    backgroundColor: '#4a5568',
                                    borderRadius: '5px' 
                                }}>
                                    {this.calculateAge(selectedNode.birthDate, selectedNode.deathDate)}
                                </div>
                            </div>

                            {/* Alamat */}
                            {selectedNode.address && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Alamat:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {selectedNode.address}
                                    </div>
                                </div>
                            )}

                            {/* Kota */}
                            {selectedNode.city && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Kota:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {selectedNode.city}
                                    </div>
                                </div>
                            )}

                            {/* Negara */}
                            {selectedNode.country && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Negara:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {selectedNode.country}
                                    </div>
                                </div>
                            )}

                            {/* Nomor Telepon */}
                            {selectedNode.phone && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Nomor Telepon:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {selectedNode.phone}
                                    </div>
                                </div>
                            )}
                            
                            {/* Hubungan Keluarga */}
                            {selectedNode.mid && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Ibu:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {this.getNameById(selectedNode.mid)}
                                    </div>
                                </div>
                            )}
                            
                            {selectedNode.fid && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Ayah:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {this.getNameById(selectedNode.fid)}
                                    </div>
                                </div>
                            )}
                            
                            {selectedNode.pids && selectedNode.pids.length > 0 && (
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Pasangan:</strong>
                                    <div style={{ 
                                        marginTop: '5px', 
                                        padding: '8px', 
                                        backgroundColor: '#4a5568',
                                        borderRadius: '5px' 
                                    }}>
                                        {selectedNode.pids.map(pid => this.getNameById(pid)).join(', ')}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '15px' }}>
                                <strong>ID:</strong>
                                <div style={{ 
                                    marginTop: '5px', 
                                    padding: '8px', 
                                    backgroundColor: '#4a5568',
                                    borderRadius: '5px' 
                                }}>
                                    {selectedNode.id}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Family Tree Container */}
                <div 
                    id="tree" 
                    ref={this.divRef} 
                    style={{
                        width: '100%', 
                        height: '100%',
                        marginLeft: sidebarOpen ? '400px' : '0',
                        transition: 'margin-left 0.3s ease-in-out'
                    }}
                />
                
                {/* Overlay untuk menutup sidebar ketika klik di luar */}
                {sidebarOpen && (
                    <div 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            zIndex: 999
                        }}
                        onClick={this.closeSidebar}
                    />
                )}
            </div>
        );
    }
}