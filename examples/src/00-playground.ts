import {
  defineTool,
  withApproval,
  createMemoryApprovalHandler,
  createAutoApprovalHandler,
} from '@seashorelab/tool';
import { z } from 'zod';

const weatherTool = defineTool({
  name: 'getWeather',
  description: 'Get the current weather for a given city.',
  inputSchema: z.object({
    city: z.string().describe('The city to get the weather for.'),
  }),
  execute: async ({ city }) => {
    // Simulated data
    return {
      city,
      temperature: '22°C',
      condition: 'Cloudy',
    };
  },
});

const approvalHandler = createMemoryApprovalHandler();

const weatherToolWithApproval = withApproval(weatherTool, {
  reason: 'Fetching weather data requires approval.',
  handler: approvalHandler,
});

const weatherToolExecution = weatherToolWithApproval.execute({ city: 'San Francisco' });

// Simulates an asynchronous approval process that approves or rejects after some time
setInterval(() => {
  const { pendingRequests } = approvalHandler;
  const [requestId] = pendingRequests.keys();

  if (requestId) {
    console.log('Approving Request ID:', requestId);
    // approvalHandler.approve(requestId); // approve
    approvalHandler.reject(requestId, 'No reason.'); // or reject
  }
}, 1000);

await weatherToolExecution.then((result) => {
  console.log('Tool Execution Result:', result);
});
