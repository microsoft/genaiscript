#!/usr/bin/env node

/**
 * Simple Weather MCP Server using HTTP transport
 * This server exposes weather-related tools via the Model Context Protocol
 */

// For now, let's use a simpler approach without external dependencies
// We'll create a basic HTTP server that implements the MCP protocol manually

import { createServer } from 'http';
import { randomUUID } from 'node:crypto';

// Mock weather data for different cities
const weatherData = {
    'paris': { temperature: 18, condition: 'sunny', humidity: 45, windSpeed: 12 },
    'london': { temperature: 12, condition: 'cloudy', humidity: 78, windSpeed: 8 },
    'new york': { temperature: 22, condition: 'partly cloudy', humidity: 55, windSpeed: 15 },
    'tokyo': { temperature: 25, condition: 'sunny', humidity: 60, windSpeed: 7 },
    'sydney': { temperature: 20, condition: 'rainy', humidity: 85, windSpeed: 18 },
    'berlin': { temperature: 15, condition: 'overcast', humidity: 70, windSpeed: 10 },
    'moscow': { temperature: 8, condition: 'snowy', humidity: 90, windSpeed: 20 },
    'mumbai': { temperature: 32, condition: 'humid', humidity: 92, windSpeed: 5 },
    'cairo': { temperature: 35, condition: 'sunny', humidity: 25, windSpeed: 6 },
    'vancouver': { temperature: 16, condition: 'rainy', humidity: 80, windSpeed: 14 }
};

// Simple MCP protocol handler
class SimpleMCPServer {
    constructor() {
        this.tools = new Map();
        this.sessions = new Map();
        this.setupTools();
    }

    setupTools() {
        // Register weather tools
        this.tools.set('get_current_weather', {
            name: 'get_current_weather',
            description: 'Get the current weather information for a specified location',
            inputSchema: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'The city name, e.g. "Paris", "London", "New York"'
                    }
                },
                required: ['location']
            }
        });

        this.tools.set('get_weather_forecast', {
            name: 'get_weather_forecast',
            description: 'Get a 3-day weather forecast for a specified location',
            inputSchema: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'The city name, e.g. "Paris", "London", "New York"'
                    }
                },
                required: ['location']
            }
        });

        this.tools.set('compare_weather', {
            name: 'compare_weather',
            description: 'Compare current weather between two cities',
            inputSchema: {
                type: 'object',
                properties: {
                    city1: { type: 'string', description: 'First city name' },
                    city2: { type: 'string', description: 'Second city name' }
                },
                required: ['city1', 'city2']
            }
        });
    }

    handleRequest(request) {
        const { method, params, id } = request;

        switch (method) {
            case 'initialize':
                return this.handleInitialize(params, id);
            case 'tools/list':
                return this.handleListTools(id);
            case 'tools/call':
                return this.handleCallTool(params, id);
            default:
                return {
                    jsonrpc: '2.0',
                    error: {
                        code: -32601,
                        message: `Method not found: ${method}`
                    },
                    id
                };
        }
    }

    handleInitialize(params, id) {
        const sessionId = randomUUID();
        this.sessions.set(sessionId, { clientInfo: params.clientInfo });
        
        return {
            jsonrpc: '2.0',
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {
                        listChanged: false
                    }
                },
                serverInfo: {
                    name: 'weather-mcp-server',
                    version: '1.0.0'
                }
            },
            id
        };
    }

    handleListTools(id) {
        return {
            jsonrpc: '2.0',
            result: {
                tools: Array.from(this.tools.values())
            },
            id
        };
    }

    handleCallTool(params, id) {
        const { name, arguments: args } = params;
        
        try {
            let result;
            switch (name) {
                case 'get_current_weather':
                    result = this.getCurrentWeather(args.location);
                    break;
                case 'get_weather_forecast':
                    result = this.getWeatherForecast(args.location);
                    break;
                case 'compare_weather':
                    result = this.compareWeather(args.city1, args.city2);
                    break;
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }

            return {
                jsonrpc: '2.0',
                result: {
                    content: [{
                        type: 'text',
                        text: result
                    }]
                },
                id
            };
        } catch (error) {
            return {
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: error.message
                },
                id
            };
        }
    }

    getCurrentWeather(location) {
        const normalizedLocation = location.toLowerCase().trim();
        const weather = weatherData[normalizedLocation];
        
        if (!weather) {
            return `Weather data not available for "${location}". Available cities: ${Object.keys(weatherData).join(', ')}`;
        }

        return `Current weather in ${location}:
Temperature: ${weather.temperature}°C
Condition: ${weather.condition}
Humidity: ${weather.humidity}%
Wind Speed: ${weather.windSpeed} km/h`;
    }

    getWeatherForecast(location) {
        const normalizedLocation = location.toLowerCase().trim();
        const baseWeather = weatherData[normalizedLocation];
        
        if (!baseWeather) {
            return `Weather forecast not available for "${location}". Available cities: ${Object.keys(weatherData).join(', ')}`;
        }

        // Generate mock forecast data
        const generateForecast = (day, baseTemp, baseCondition) => {
            const tempVariation = Math.floor(Math.random() * 6) - 3;
            const conditions = ['sunny', 'cloudy', 'partly cloudy', 'rainy', 'overcast'];
            const condition = Math.random() > 0.7 ? conditions[Math.floor(Math.random() * conditions.length)] : baseCondition;
            
            return {
                day,
                temperature: baseTemp + tempVariation,
                condition,
                humidity: Math.max(20, Math.min(95, baseWeather.humidity + Math.floor(Math.random() * 20) - 10))
            };
        };

        const forecast = [
            generateForecast('Today', baseWeather.temperature, baseWeather.condition),
            generateForecast('Tomorrow', baseWeather.temperature, baseWeather.condition),
            generateForecast('Day after tomorrow', baseWeather.temperature, baseWeather.condition)
        ];

        const forecastText = forecast.map(day => 
            `${day.day}: ${day.temperature}°C, ${day.condition}, humidity ${day.humidity}%`
        ).join('\n');

        return `3-day weather forecast for ${location}:\n${forecastText}`;
    }

    compareWeather(city1, city2) {
        const weather1 = weatherData[city1.toLowerCase().trim()];
        const weather2 = weatherData[city2.toLowerCase().trim()];
        
        if (!weather1 || !weather2) {
            const missing = [];
            if (!weather1) missing.push(city1);
            if (!weather2) missing.push(city2);
            
            return `Weather data not available for: ${missing.join(', ')}. Available cities: ${Object.keys(weatherData).join(', ')}`;
        }

        const tempDiff = weather1.temperature - weather2.temperature;
        const warmerCity = tempDiff > 0 ? city1 : city2;
        
        return `Weather comparison between ${city1} and ${city2}:

${city1}: ${weather1.temperature}°C, ${weather1.condition}, humidity ${weather1.humidity}%
${city2}: ${weather2.temperature}°C, ${weather2.condition}, humidity ${weather2.humidity}%

${warmerCity} is warmer by ${Math.abs(tempDiff)}°C`;
    }
}

// Create HTTP server
const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;
const mcpServer = new SimpleMCPServer();

const server = createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            server: 'weather-mcp-server',
            version: '1.0.0',
            activeSessions: mcpServer.sessions.size
        }));
        return;
    }

    if (req.method === 'POST' && req.url === '/mcp') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const request = JSON.parse(body);
                console.log(`[Weather MCP] Request: ${request.method}`);
                
                const response = mcpServer.handleRequest(request);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            } catch (error) {
                console.error('[Weather MCP] Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error'
                    },
                    id: null
                }));
            }
        });
        return;
    }

    // 404 for other paths
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(MCP_PORT, () => {
    console.log(`🌤️  Weather MCP Server listening on port ${MCP_PORT}`);
    console.log(`Available tools: get_current_weather, get_weather_forecast, compare_weather`);
    console.log(`Health check: http://localhost:${MCP_PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${MCP_PORT}/mcp`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🌤️  Shutting down Weather MCP Server...');
    server.close(() => {
        console.log('Weather MCP Server shutdown complete');
        process.exit(0);
    });
});