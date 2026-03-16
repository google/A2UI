const fs = require('fs');
const file = 'page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    messages: (scenarios[selectedScenario] as any) || [],
    autoPlay: false,
    baseIntervalMs: 1000
  });`;

const replacement = `    messages: (scenarios[selectedScenario] as any) || [],
    autoPlay: false,
    baseIntervalMs: 1000
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step) {
      seek(parseInt(step, 10));
    }
  }, []);`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Patched page.tsx with basic ?step=N support.");
