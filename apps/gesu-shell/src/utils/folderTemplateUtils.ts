// Folder Template Utilities
// Conversion between flat and hierarchical folder structures

import { FolderNode, FolderTemplate, FolderTemplateExtended } from '../types/workflowBlueprints';

// Generate unique ID for folder nodes
let nodeIdCounter = 0;
export function generateNodeId(): string {
    return `folder-${Date.now()}-${nodeIdCounter++}`;
}

// Convert flat paths to hierarchical tree
// Example: ['01. Brief', '02. Assets/Images', '02. Assets/Icons'] 
// → Tree with '02. Assets' having children 'Images' and 'Icons'
export function flatToHierarchical(flatPaths: string[]): FolderNode[] {
    const root: FolderNode[] = [];
    const nodeMap = new Map<string, FolderNode>();

    flatPaths.forEach(path => {
        const parts = path.split('/');
        let currentLevel = root;
        let currentPath = '';

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            // Check if node already exists at this level
            let existingNode = currentLevel.find(n => n.name === part);

            if (!existingNode) {
                // Create new node
                const newNode: FolderNode = {
                    id: generateNodeId(),
                    name: part,
                    children: index < parts.length - 1 ? [] : undefined
                };

                currentLevel.push(newNode);
                nodeMap.set(currentPath, newNode);
                existingNode = newNode;
            }

            // Move to next level
            if (index < parts.length - 1) {
                if (!existingNode.children) {
                    existingNode.children = [];
                }
                currentLevel = existingNode.children;
            }
        });
    });

    return root;
}

// Convert hierarchical tree back to flat paths
export function hierarchicalToFlat(nodes: FolderNode[], prefix: string = ''): string[] {
    const paths: string[] = [];

    nodes.forEach(node => {
        const currentPath = prefix ? `${prefix}/${node.name}` : node.name;

        if (node.children && node.children.length > 0) {
            // Has children - recurse
            paths.push(...hierarchicalToFlat(node.children, currentPath));
        } else {
            // Leaf node
            paths.push(currentPath);
        }
    });

    return paths;
}

// Migrate flat template to extended format with hierarchical structure
export function migrateFlatTemplate(template: FolderTemplate): FolderTemplateExtended {
    return {
        ...template,
        hierarchicalFolders: flatToHierarchical(template.folders),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isUserCreated: false
    };
}

// Create new empty template
export function createEmptyTemplate(name: string): FolderTemplateExtended {
    return {
        id: `user-${Date.now()}`,
        name,
        folders: [],
        hierarchicalFolders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isUserCreated: true
    };
}

// Update template when hierarchical structure changes
export function syncTemplateStructure(template: FolderTemplateExtended): FolderTemplateExtended {
    return {
        ...template,
        folders: template.hierarchicalFolders
            ? hierarchicalToFlat(template.hierarchicalFolders)
            : template.folders,
        updatedAt: new Date().toISOString()
    };
}

// Count total folders (including nested)
export function countFolders(nodes: FolderNode[]): number {
    let count = 0;
    nodes.forEach(node => {
        count += 1;
        if (node.children) {
            count += countFolders(node.children);
        }
    });
    return count;
}

// Find node by ID in tree
export function findNodeById(nodes: FolderNode[], id: string): FolderNode | null {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
}

// Add folder to tree at specific location
export function addFolderToTree(
    nodes: FolderNode[],
    parentId: string | null,
    folderName: string
): FolderNode[] {
    const newNode: FolderNode = {
        id: generateNodeId(),
        name: folderName
    };

    if (parentId === null) {
        // Add to root
        return [...nodes, newNode];
    }

    // Add as child of parent
    return nodes.map(node => {
        if (node.id === parentId) {
            return {
                ...node,
                children: [...(node.children || []), newNode]
            };
        }
        if (node.children) {
            return {
                ...node,
                children: addFolderToTree(node.children, parentId, folderName)
            };
        }
        return node;
    });
}

// Remove folder from tree
export function removeFolderFromTree(nodes: FolderNode[], folderId: string): FolderNode[] {
    return nodes
        .filter(node => node.id !== folderId)
        .map(node => ({
            ...node,
            children: node.children ? removeFolderFromTree(node.children, folderId) : undefined
        }));
}

// Rename folder in tree
export function renameFolderInTree(
    nodes: FolderNode[],
    folderId: string,
    newName: string
): FolderNode[] {
    return nodes.map(node => {
        if (node.id === folderId) {
            return { ...node, name: newName };
        }
        if (node.children) {
            return {
                ...node,
                children: renameFolderInTree(node.children, folderId, newName)
            };
        }
        return node;
    });
}
