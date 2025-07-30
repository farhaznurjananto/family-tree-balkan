import React, { Component, RefObject } from 'react';
import FamilyTree from "@balkangraph/familytree.js";
import { NodeData } from '@/types/tree';

// Props interface
interface TreeProps {
    nodes: NodeData[];
    treeName?: string;
}

// State interface
interface TreeState {
    selectedNode: NodeData | null;
    sidebarOpen: boolean;
    isMobile: boolean;
}

class CustomEditForm {
    private tree: Tree;

    constructor(tree: Tree) {
        this.tree = tree;
    }

    show(nodeId: string, readOnly: boolean = true) {
        const nodeData = this.tree.family.get(nodeId);

        if (nodeData) {
            this.tree.setState({
                selectedNode: nodeData,
                sidebarOpen: true
            });
        }
    }

    hide() {
        this.tree.setState({
            sidebarOpen: false,
            selectedNode: null
        });
    }
}

export default class Tree extends Component<TreeProps, TreeState> {
    private divRef: RefObject<HTMLDivElement | null>;
    public family: any;
    private customEditForm: CustomEditForm;


    constructor(props: TreeProps) {
        super(props);
        this.divRef = React.createRef<HTMLDivElement>();
        this.state = {
            selectedNode: null,
            sidebarOpen: false,
            isMobile: false
        };
        this.customEditForm = new CustomEditForm(this);

    }

    // Check if device is mobile
    checkIsMobile = (): boolean => {
        return window.innerWidth <= 768;
    };

    // Handle window resize
    handleResize = (): void => {
        const isMobile = this.checkIsMobile();
        if (this.state.isMobile !== isMobile) {
            this.setState({ isMobile });
        }
    };

    shouldComponentUpdate(nextProps: TreeProps, nextState: TreeState): boolean {
        return this.state.sidebarOpen !== nextState.sidebarOpen ||
            this.state.selectedNode !== nextState.selectedNode ||
            this.state.isMobile !== nextState.isMobile ||
            this.props.nodes !== nextProps.nodes ||
            this.props.treeName !== nextProps.treeName;
    }

    componentDidMount(): void {
        // Set initial mobile state
        this.setState({ isMobile: this.checkIsMobile() });

        // Add resize listener
        window.addEventListener('resize', this.handleResize);

        if (!this.divRef.current) {
            console.error('Div reference is null');
            return;
        }

        // Add custom CSS for search bar positioning
        // const style = document.createElement('style');
        // style.textContent = `
        //     .bft-search {
        //         position: absolute !important;
        //         top: 20px !important;
        //         right: 20px !important;
        //         left: auto !important;
        //         z-index: 999 !important;
        //         width: 200px !important;
        //     }

        //     @media screen and (max-width: 768px) {
        //         .bft-search {
        //             top: 70px !important;
        //             right: 20px !important;
        //             width: 160px !important;
        //         }
        //     }

        //     .bft-search input {
        //         background-color: rgba(15, 15, 17, 0.9) !important;
        //         border: 1px solid rgba(255, 255, 255, 0.2) !important;
        //         border-radius: 8px !important;
        //         color: #F8F8F8 !important;
        //         padding: 8px 12px !important;
        //         font-size: 14px !important;
        //     }

        //     .bft-search input::placeholder {
        //         color: rgba(248, 248, 248, 0.6) !important;
        //     }
        // `;
        // document.head.appendChild(style);

        // Template definitions remain the same
        FamilyTree.SEARCH_PLACEHOLDER = "CARI";
        FamilyTree.templates.base.defs =
            `<g transform="matrix(0.05,0,0,0.05,-12,-9)" id="heart">
        <path fill="#fc71e5ff" d="M438.482,58.61c-24.7-26.549-59.311-41.655-95.573-41.711c-36.291,0.042-70.938,15.14-95.676,41.694l-8.431,8.909  l-8.431-8.909C181.284,5.762,98.663,2.728,45.832,51.815c-2.341,2.176-4.602,4.436-6.778,6.778 c-52.072,56.166-52.072,142.968,0,199.134l187.358,197.581c6.482,6.843,17.284,7.136,24.127,0.654 c0.224-0.212,0.442-0.43,0.654-0.654l187.29-197.581C490.551,201.567,490.551,114.77,438.482,58.61z"/>
        </g>
        <g transform="matrix(1,0,0,1,0,0)" id="dot"></g>
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
                ${FamilyTree.icon.ft(20, 20, '#aeaeae', 5, 5)}
            </g>
            <clipPath id="base_img_0">
                <rect id="base_img_0_stroke" stroke-width="3" x="8" y="8" rx="10" ry="10" width="168" height="232"></rect>
            </clipPath>`;

        // Template configurations
        FamilyTree.templates.myTemplate = Object.assign({}, FamilyTree.templates.tommy);
        FamilyTree.templates.myTemplate.size = [184, 270];
        FamilyTree.templates.myTemplate.nodeTreeMenuButton = `<use ${"data-ctrl-n-t-menu-id"}="{id}" x="165" y="10" xlink:href="#base_tree_menu" />`;
        FamilyTree.templates.myTemplate.nodeMenuButton = `<use ${FamilyTree.attr.control_node_menu_id}="{id}" x="10" y="5" xlink:href="#base_node_menu" />`;
        FamilyTree.templates.myTemplate.nodeTreeMenuCloseButton = `<use ${"data-ctrl-n-t-menu-c"}="" x="5" y="5" xlink:href="#base_tree_menu_close" />`;

        FamilyTree.templates.myTemplate_male = Object.assign({}, FamilyTree.templates.tommy);
        FamilyTree.templates.myTemplate_male.size = [184, 270];
        FamilyTree.templates.myTemplate_male.nodeTreeMenuButton = '';
        FamilyTree.templates.myTemplate_male.nodeMenuButton = `<use ${FamilyTree.attr.control_node_menu_id}="{id}" x="10" y="245" xlink:href="#base_node_menu" />`;
        FamilyTree.templates.myTemplate_male.nodeTreeMenuCloseButton = ``;

        FamilyTree.templates.myTemplate_female = Object.assign({}, FamilyTree.templates.tommy);
        FamilyTree.templates.myTemplate_female.size = [184, 270];
        FamilyTree.templates.myTemplate_female.nodeTreeMenuButton = '';
        FamilyTree.templates.myTemplate_female.nodeMenuButton = `<use ${FamilyTree.attr.control_node_menu_id}="{id}" x="10" y="245" xlink:href="#base_node_menu" />`;
        FamilyTree.templates.myTemplate_female.nodeTreeMenuCloseButton = '';

        // Node styling
        FamilyTree.templates.myTemplate_male.node =
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="0" fill="#EAA64D" stroke="#aeaeae" rx="15" ry="15"></rect>`;
        FamilyTree.templates.myTemplate_female.node =
            `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="0" fill="#90D1CA" stroke="#aeaeae" rx="15" ry="15"></rect>`;
        FamilyTree.templates.myTemplate_male.editFormHeaderColor = "#EAA64D";
        FamilyTree.templates.myTemplate_female.editFormHeaderColor = "#90D1CA";

        // Field styling
        FamilyTree.templates.myTemplate.field_0 =
            FamilyTree.templates.myTemplate_male.field_0 =
            FamilyTree.templates.myTemplate_female.field_0 =
            `<text data-width="182" data-text-overflow="ellipsis"  style="font-size: 18px; font-weight: bold" fill="#4A4A4A" x="92" y="262" text-anchor="middle">{val}</text>`;

        // Image styling
        FamilyTree.templates.myTemplate.img_0 =
            FamilyTree.templates.myTemplate_male.img_0 =
            FamilyTree.templates.myTemplate_female.img_0 =
            `<use xlink:href="#base_img_0_stroke" />
            <image preserveAspectRatio="xMidYMid slice" clip-path="url(#base_img_0)" xlink:href="{val}" x="8" y="8" width="168" height="232" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"></image>
            <g style="display:none" class="default-avatar">
                <rect x="8" y="8" width="168" height="232" fill="#3f3f46" rx="10" ry="10"></rect>
                <g transform="translate(92, 124)">
                    <path d="M-24 -16C-24 -27.0457 -15.0457 -36 -4 -36C7.0457 -36 16 -27.0457 16 -16C16 -4.9543 7.0457 4 -4 4C-15.0457 4 -24 -4.9543 -24 -16Z" 
                          fill="#9CA3AF" stroke="#9CA3AF" stroke-width="2"/>
                    <path d="M-40 44V36C-40 24.9543 -31.0457 16 -20 16H12C23.0457 16 32 24.9543 32 36V44" 
                          fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            </g>`;

        // Placeholder templates
        const placeholderTemplates = ['mother', 'father', 'husband', 'son', 'daughter', 'wife'];
        const placeholderColors = {
            mother: '#60EDF7',
            father: '#7DACFF',
            husband: '#7DACFF',
            son: '#7DACFF',
            daughter: '#60EDF7',
            wife: '#60EDF7'
        };

        placeholderTemplates.forEach(templateName => {
            FamilyTree.templates[templateName] = Object.assign({}, FamilyTree.templates.base);
            FamilyTree.templates[templateName].up = '';
            FamilyTree.templates[templateName].size = [184, 270];
            FamilyTree.templates[templateName].node =
                `<rect x="0" y="0" height="{h}" width="{w}" stroke-width="1" fill="${placeholderColors[templateName as keyof typeof placeholderColors]}" stroke="#aeaeae" rx="15" ry="15"></rect>
                <text data-width="100" data-text-overflow="ellipsis"  style="font-size: 20px; font-weight: bold" fill="#4A4A4A" x="92" y="140" text-anchor="middle">Add ${templateName.charAt(0).toUpperCase() + templateName.slice(1)}</text>`;
        });

        // Initialize FamilyTree
        this.family = new FamilyTree(this.divRef.current, {
            mode: 'dark',
            template: "myTemplate",
            nodes: this.props.nodes.map(node => ({
                ...node,
                photo: node.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTY4IiBoZWlnaHQ9IjIzMiIgdmlld0JveD0iMCAwIDE2OCAyMzIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNjgiIGhlaWdodD0iMjMyIiBmaWxsPSIjM2YzZjQ2IiByeD0iMTAiIHJ5PSIxMCIvPgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg4NCwgMTE2KSI+CjxwYXRoIGQ9Ik0tMjQgLTE2Qy0yNCAtMjcuMDQ1NyAtMTUuMDQ1NyAtMzYgLTQgLTM2QzcuMDQ1NyAtMzYgMTYgLTI3LjA0NTcgMTYgLTE2QzE2IC00Ljk1NDMgNy4wNDU3IDQgLTQgNEMtMTUuMDQ1NyA0IC0yNCAtNC45NTQzIC0yNCAtMTZaIiBmaWxsPSIjOUNBM0FGIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNLTQwIDQ0VjM2Qy00MCAyNC45NTQzIC0zMS4wNDU3IDE2IC0yMCAxNkgxMkMyMy4wNDU3IDE2IDMyIDI0Ljk1NDMgMzIgMzZWNDQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9nPgo8L3N2Zz4K'
            })),
            nodeMenu: {
                details: {
                    text: "Details", onClick: (nodeId: string) => {
                        this.customEditForm.show(nodeId, true);
                    }
                },
            },
            nodeTreeMenu: true,
            nodeMouseClick: FamilyTree.action.none,
            searchDisplayField: 'name',
            searchFields: ['name'],
            enableSearch: true,
            editForm: { readOnly: true, photoBinding: 'photo', buttons: { pdf: null, share: null } },
            nodeBinding: {
                field_0: "name",
                img_0: "photo"
            },
        });


        this.family.on('render-link', function (sender: any, args: any) {
            if (args.cnode.ppid != undefined) {
                args.html += '<use xlink:href="#heart" x="' + args.p.xa + '" y="' + args.p.ya + '"/>';
            }
        });
        
        // Event listener for node click
        this.family.on('click', (sender: any, args: any) => {
            if (args.node) {
                const nodeData: NodeData = this.family.get(args.node.id);
                console.log('Node clicked:', nodeData); // Debug log
                this.setState({
                    selectedNode: nodeData,
                    sidebarOpen: true
                });
            }
        });

        // Alternative event listener for mobile touch
        // this.family.on('nodeclick', (sender: any, args: any) => {
        //     if (args.node) {
        //         const nodeData: NodeData = this.family.get(args.node.id);
        //         console.log('Node touched:', nodeData); // Debug log
        //         this.setState({
        //             selectedNode: nodeData,
        //             sidebarOpen: true
        //         });
        //     }
        // });

        // Add direct click handlers after render
        // setTimeout(() => {
        //     const nodes = this.divRef.current?.querySelectorAll('g[node-id]');
        //     nodes?.forEach((node) => {
        //         node.addEventListener('click', (e) => {
        //             e.stopPropagation();
        //             const nodeId = (node as Element).getAttribute('node-id');
        //             if (nodeId) {
        //                 const nodeData: NodeData = this.family.get(nodeId);
        //                 if (nodeData) {
        //                     console.log('Direct click on node:', nodeData);
        //                     this.setState({
        //                         selectedNode: nodeData,
        //                         sidebarOpen: true
        //                     });
        //                 }
        //             }
        //         });

        //         // Add touch handler for mobile
        //         node.addEventListener('touchend', (e) => {
        //             e.preventDefault();
        //             e.stopPropagation();
        //             const nodeId = (node as Element).getAttribute('node-id');
        //             if (nodeId) {
        //                 const nodeData: NodeData = this.family.get(nodeId);
        //                 if (nodeData) {
        //                     console.log('Touch on node:', nodeData);
        //                     this.setState({
        //                         selectedNode: nodeData,
        //                         sidebarOpen: true
        //                     });
        //                 }
        //             }
        //         });
        //     });
        // }, 1000);
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.handleResize);
    }

    // Helper functions remain the same
    formatDate = (dateString: string): string => {
        if (!dateString) return 'Tidak diketahui';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    calculateAge = (birthDate?: string, deathDate?: string): string => {
        if (!birthDate) return 'Tidak diketahui';
        const birth = new Date(birthDate);
        const death = deathDate ? new Date(deathDate) : new Date();
        const age = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age > 0 ? `${age} tahun` : 'Tidak diketahui';
    }

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

    render() {
        const { selectedNode, sidebarOpen, isMobile } = this.state;
        const { treeName } = this.props;

        // Responsive dimensions
        const sidebarWidth = isMobile ? '100%' : '645px';
        const sidebarLeft = sidebarOpen ? '0' : (isMobile ? '-100%' : '-645px');
        const treeMarginLeft = sidebarOpen ? (isMobile ? '0' : '400px') : '0';
        const headerLeft = sidebarOpen ? (isMobile ? '20px' : '665px') : '20px';

        return (
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                fontFamily: 'Poppins, sans-serif',
                overflow: 'hidden',
                zIndex: 1002,
            }}>
                {/* Tree Name Header */}
                <div style={{
                    display: isMobile ? 'none' : 'block',
                    position: 'absolute',
                    top: '22px',
                    left: '50%',
                    transform: `translateX(calc(-50% + ${sidebarOpen ? '200px' : '0px'}))`,
                    zIndex: 1001,
                    color: '#F8F8F8',
                    fontSize: isMobile ? '16px' : '24px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    transition: 'transform 0.3s ease-in-out',
                    pointerEvents: 'none',
                    padding: isMobile ? '8px 12px' : '12px 20px',
                    // border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(15, 15, 17, 0.9)',
                    borderRadius: '8px',
                    maxWidth: isMobile ? '200px' : '400px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    border: isMobile ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                }}>
                    {treeName || 'Family Tree'}
                </div>

                {/* Sidebar */}
                <div style={{
                    position: 'fixed',
                    left: sidebarLeft,
                    top: '0',
                    width: sidebarWidth,
                    height: '100vh',
                    backgroundColor: '#0F0F11',
                    color: 'white',
                    padding: isMobile ? '20px 16px' : '32px',
                    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
                    transition: 'left 0.3s ease-in-out',
                    zIndex: isMobile ? 1002 : 1000,
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    {selectedNode && (
                        <>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <button
                                    onClick={this.closeSidebar}
                                    style={{
                                        background: 'none',
                                        width: isMobile ? '40px' : '48px',
                                        height: isMobile ? '40px' : '48px',
                                        color: 'white',
                                        fontSize: isMobile ? '28px' : '32px',
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        border: '1px solid #ffffff',
                                        padding: '10px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        transition: 'background-color 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        target.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Photo */}
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                {selectedNode.photo ? (
                                    <img
                                        src={selectedNode.photo}
                                        alt={selectedNode.name}
                                        style={{
                                            width: isMobile ? '120px' : '165px',
                                            height: isMobile ? '160px' : '220px',
                                            objectFit: 'cover',
                                            borderRadius: '16px',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: isMobile ? '120px' : '165px',
                                        height: isMobile ? '160px' : '220px',
                                        backgroundColor: '#3f3f46',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto',
                                        border: `3px solid ${selectedNode.gender === 'male' ? '#7DACFF' : '#60EDF7'}`
                                    }}>
                                        <svg
                                            width={isMobile ? "60" : "80"}
                                            height={isMobile ? "60" : "80"}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                                                stroke="#9CA3AF"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px',
                                fontSize: isMobile ? '24px' : '32px',
                                fontWeight: 'bold',
                                color: '#F8F8F8',
                                textTransform: 'uppercase',
                                lineHeight: isMobile ? '1.2' : '1'
                            }}>
                                {selectedNode.name}
                            </div>

                            {/* Note */}
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px',
                                fontSize: isMobile ? '14px' : '16px',
                                color: '#F8F8F8',
                                fontStyle: 'italic',
                                maxWidth: isMobile ? '280px' : '400px',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                lineHeight: '1.4'
                            }}>
                                {selectedNode.note || 'Tidak ada catatan tambahan.'}
                            </div>

                            {/* Information */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isMobile ? '16px' : '20px',
                                fontSize: isMobile ? '14px' : '16px',
                                fontWeight: '500',
                            }}>
                                <div style={{
                                    width: '100%',
                                    border: '1px solid #3f3f46',
                                    borderRadius: '12px',
                                    padding: isMobile ? '12px' : '16px'
                                }}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '10px' }}>
                                        <li style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: isMobile ? '4px' : '0' }}>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 'bold' }}>Kelamin</div>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 300, color: '#f8f8f8' }}>{selectedNode.gender || "-"}</div>
                                        </li>
                                        <li style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: isMobile ? '4px' : '0' }}>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 'bold' }}>Pekerjaan</div>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 300, color: '#f8f8f8' }}>{selectedNode.occupation || "-"}</div>
                                        </li>
                                        <li style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: isMobile ? '4px' : '0' }}>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 'bold' }}>Alamat</div>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 300, color: '#f8f8f8', wordBreak: 'break-word' }}>{selectedNode.address || "-"}</div>
                                        </li>
                                        <li style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: isMobile ? '4px' : '0' }}>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 'bold' }}>Tanggal Lahir</div>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 300, color: '#f8f8f8' }}>{selectedNode.birthDate || "-"}</div>
                                        </li>
                                        <li style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: isMobile ? '4px' : '0' }}>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 'bold' }}>Kematian</div>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 300, color: '#f8f8f8' }}>{selectedNode.deathDate || "-"}</div>
                                        </li>
                                    </ul>
                                </div>

                                <div style={{
                                    width: '100%',
                                    border: '1px solid #3f3f46',
                                    borderRadius: '12px',
                                    padding: isMobile ? '12px' : '16px'
                                }}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '10px' }}>
                                        <li style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: isMobile ? '4px' : '0' }}>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 'bold' }}>Email</div>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'none', fontWeight: 300, color: '#f8f8f8', wordBreak: 'break-all' }}>{selectedNode.email || "-"}</div>
                                        </li>
                                        <li style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: isMobile ? '4px' : '0' }}>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 'bold' }}>Nomor Telepon</div>
                                            <div style={{ width: isMobile ? '100%' : '50%', textTransform: 'uppercase', fontWeight: 300, color: '#f8f8f8' }}>{selectedNode.phone || "-"}</div>
                                        </li>
                                    </ul>
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
                        marginLeft: treeMarginLeft,
                        transition: 'margin-left 0.3s ease-in-out'
                    }}
                />

                {/* Overlay for closing sidebar */}
                {sidebarOpen && isMobile && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1001,
                            backdropFilter: 'blur(2px)'
                        }}
                        onClick={this.closeSidebar}
                    />
                )}
            </div>
        );
    }
}