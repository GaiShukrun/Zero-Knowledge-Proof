const express = require('express');
const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

const originalGraph = {
  nodes: [
    { id: 1, label: 'A', x: 100, y: 100 },
    { id: 2, label: 'B', x: 200, y: 100 },
    { id: 3, label: 'C', x: 300, y: 100 },
    { id: 4, label: 'D', x: 100, y: 200 },
    { id: 5, label: 'E', x: 200, y: 200 },
    { id: 6, label: 'F', x: 300, y: 200 },
    { id: 7, label: 'G', x: 100, y: 300 },
    { id: 8, label: 'H', x: 200, y: 300 },
    { id: 9, label: 'I', x: 300, y: 300 },
    { id: 10, label: 'J', x: 400, y: 200 }
  ],
  edges: [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 5 },
    { from: 3, to: 6 },
    { from: 4, to: 7 },
    { from: 5, to: 8 },
    { from: 6, to: 9 },
    { from: 4, to: 5 },
    { from: 5, to: 6 },
    { from: 7, to: 8 },
    { from: 8, to: 9 },
    { from: 6, to: 10 },
    { from: 10, to: 3 }
  ]
};

// Get adjacent nodes for a given node
function getAdjacentNodes(nodeId, edges) {
  const adjacentNodes = new Set();
  edges.forEach(edge => {
    if (edge.from === nodeId) {
      adjacentNodes.add(edge.to);
    }
    if (edge.to === nodeId) {
      adjacentNodes.add(edge.from);
    }
  });
  return Array.from(adjacentNodes);
}

// Check if adjacency patterns match between original and proof graphs
function checkAdjacencyMatch(selectedNode, matchingNode, proofGraph, matchedNodes, matchedOriginalNodes) {
  const proofAdjacent = getAdjacentNodes(selectedNode, proofGraph.edges);
  const originalAdjacent = getAdjacentNodes(matchingNode, originalGraph.edges);
  
  // Create mapping between matched nodes
  const nodeMapping = {};
  matchedNodes.forEach((proofNode, index) => {
    nodeMapping[proofNode] = Array.from(matchedOriginalNodes)[index];
  });
  
  // Check if already matched adjacent nodes have corresponding matches
  for (const proofAdj of proofAdjacent) {
    if (matchedNodes.has(proofAdj)) {
      const originalMatchedAdj = nodeMapping[proofAdj];
      if (!originalAdjacent.includes(originalMatchedAdj)) {
        return false;
      }
    }
  }
  
  return true;
}

function calculateDegree(nodeId, edges) {
  return edges.filter(edge => edge.from === nodeId || edge.to === nodeId).length;
}

app.post('/api/verify/:nodeId', async (req, res) => {
  try {
    const selectedNode = parseInt(req.params.nodeId);
    const proofGraph = {
      nodes: req.body.nodes,
      edges: req.body.edges
    };
    const matchedNodes = new Set(req.body.matchedNodes || []);
    const matchedOriginalNodes = new Set(req.body.matchedOriginalNodes || []);

    const selectedDegree = calculateDegree(selectedNode, proofGraph.edges);
    
    // Find matching nodes with same degree that haven't been matched yet
    const potentialMatches = originalGraph.nodes.filter(node => 
      calculateDegree(node.id, originalGraph.edges) === selectedDegree &&
      !matchedOriginalNodes.has(node.id)
    );

    if (potentialMatches.length === 0) {
      return res.status(200).json({
        isValid: false,
        message: 'No matching node found with the same degree',
        successRate: (matchedOriginalNodes.size * 10)
      });
    }

    // Find a matching node that satisfies adjacency requirements
    const matchingNode = potentialMatches.find(node => 
      checkAdjacencyMatch(selectedNode, node.id, proofGraph, matchedNodes, matchedOriginalNodes)
    );

    if (!matchingNode) {
      return res.status(200).json({
        isValid: false,
        message: 'No matching node found with compatible adjacency pattern',
        successRate: (matchedOriginalNodes.size * 10)
      });
    }

    const newSuccessRate = (matchedOriginalNodes.size + 1) * 10;
    const remainingNodes = originalGraph.nodes.length - (matchedOriginalNodes.size + 1);

    let progressMessage = `Match found! Node ${selectedNode} corresponds to Node ${matchingNode.label}. `;
    if (remainingNodes > 0) {
      progressMessage += `Progress: ${newSuccessRate}%. ${remainingNodes} nodes remaining.`;
    } else {
      progressMessage += 'Congratulations! You have successfully matched all nodes!';
    }

    res.status(200).json({
      isValid: true,
      message: progressMessage,
      matchedNode: matchingNode.id,
      successRate: newSuccessRate,
      remainingNodes: remainingNodes
    });

  } catch (error) {
    console.error('Error verifying isomorphism:', error);
    res.status(500).json({ 
      isValid: false,
      message: 'Internal server error',
      successRate: 0
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Verifier server running on port ${PORT}`);
});