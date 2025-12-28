// Animated Neural Network Background
(function() {
  // Wait for DOM to be ready
  function initNeuralBackground() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) {
      console.log('Neural canvas not found');
      return;
    }
  
  const ctx = canvas.getContext('2d');
  let animationId;
  
  // Neural network configuration
  const config = {
    nodeCount: window.innerWidth > 768 ? 500 : 55, // More nodes for denser network
    connectionCount: 60,
    animationSpeed: 0.002,
    pulseSpeed: 0.01,
    nodeRadius: 3,
    connectionWidth: 1.2,
    opacity: 0.4
  };
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return; // Exit if user prefers reduced motion
  }
  
  // Resize canvas to match window
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  // Generate neural network nodes
  const nodes = [];
  function generateNodes() {
    nodes.length = 0;
    for (let i = 0; i < config.nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        pulse: Math.random() * Math.PI * 2,
        connections: []
      });
    }
  }
  
  // Generate connections between nearby nodes
  function generateConnections() {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].connections = [];
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          nodes[i].connections.push({
            target: j,
            distance: distance,
            strength: 1 - (distance / 150)
          });
        }
      }
    }
  }
  
  // Update node positions
  function updateNodes() {
    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      node.pulse += config.pulseSpeed;
      
      // Bounce off edges
      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      
      // Keep nodes in bounds
      node.x = Math.max(0, Math.min(canvas.width, node.x));
      node.y = Math.max(0, Math.min(canvas.height, node.y));
    });
  }
  
  // Draw the neural network
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get theme colors - much clearer connections
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const connectionColor = isDark ? 'rgba(154, 160, 255, 0.7)' : 'rgba(122, 122, 196, 0.7)';
    const nodeColor = isDark ? 'rgba(154, 160, 255, 0.7)' : 'rgba(122, 122, 196, 0.7)';
    const pulseColor = isDark ? 'rgba(154, 160, 255, 0.5)' : 'rgba(122, 122, 196, 0.5)';
    
    // Draw connections
    ctx.strokeStyle = connectionColor;
    ctx.lineWidth = config.connectionWidth;
    
    nodes.forEach(node => {
      node.connections.forEach(conn => {
        const targetNode = nodes[conn.target];
        const alpha = conn.strength * config.opacity;
        
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
      });
    });
    
    // Draw nodes
    ctx.fillStyle = nodeColor;
    nodes.forEach(node => {
      const pulseRadius = config.nodeRadius + Math.sin(node.pulse) * 1;
      
      ctx.globalAlpha = config.opacity + Math.sin(node.pulse) * 0.1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw pulse effect
      ctx.globalAlpha = Math.sin(node.pulse) * 0.2;
      ctx.fillStyle = pulseColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = nodeColor;
    });
    
    ctx.globalAlpha = 1;
  }
  
  // Performance optimization: pause when tab is not visible
  let isVisible = true;
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible && !animationId) {
      animate();
    }
  });
  
  // Animation loop
  function animate() {
    if (!isVisible) {
      animationId = null;
      return;
    }
    
    updateNodes();
    draw();
    animationId = requestAnimationFrame(animate);
  }
  
  // Initialize
  function init() {
    resizeCanvas();
    generateNodes();
    generateConnections();
    animate();
  }
  
  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    generateNodes();
    generateConnections();
  });
  
  // Handle theme changes
  const observer = new MutationObserver(() => {
    // Theme changed, redraw with new colors
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  
    // Start the animation
    init();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNeuralBackground);
  } else {
    initNeuralBackground();
  }
})();
