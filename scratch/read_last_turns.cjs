const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:/Users/ADMIN/.gemini/antigravity-ide/brain/405dea5e-fd75-4356-bdf4-e6e0e5cf3a8d/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const steps = [];
  for await (const line of rl) {
    if (line.trim()) {
      const step = JSON.parse(line);
      if (step.type === 'USER_INPUT') {
        steps.push(step);
      }
    }
  }

  // Print all user input steps
  for (const step of steps) {
    console.log(`Step ${step.step_index} (${step.source}):`);
    console.log(step.content);
    console.log('--------------------------------------------------');
  }
}

main();
