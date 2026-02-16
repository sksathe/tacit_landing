import 'dotenv/config';
import express from 'express';
import { MCP_TOOLS, executeTool } from './tools/index.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List available tools (MCP protocol: tools/list)
app.get('/tools', (req, res) => {
  res.json({
    tools: MCP_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema._def,
    })),
  });
});

// Execute a tool (MCP protocol: tools/call)
app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name || !args) {
      res.status(400).json({ error: 'Missing tool name or arguments' });
      return;
    }

    const result = await executeTool(name, args);
    res.json({ result });
  } catch (error: any) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      error: error.message || 'Tool execution failed',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// MCP protocol endpoint (for ElevenLabs compatibility)
app.post('/mcp', async (req, res) => {
  try {
    const { method, params } = req.body;

    if (method === 'tools/list') {
      res.json({
        tools: MCP_TOOLS.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema._def,
        })),
      });
      return;
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      if (!name || !args) {
        res.status(400).json({ error: 'Missing tool name or arguments' });
        return;
      }

      const result = await executeTool(name, args);
      res.json({ result });
      return;
    }

    res.status(400).json({ error: `Unknown method: ${method}` });
  } catch (error: any) {
    console.error('MCP protocol error:', error);
    res.status(500).json({
      error: error.message || 'MCP protocol error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`MCP Agent Server running on port ${PORT}`);
  console.log(`Available tools: ${MCP_TOOLS.map(t => t.name).join(', ')}`);
});
