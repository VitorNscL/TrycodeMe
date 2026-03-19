import vm from 'node:vm';

// This local runner is intentionally limited to JavaScript for safe local demos.
// For production and multi-language support, swap this adapter for Judge0 or Piston.
export function runJavaScript(source: string) {
  const logs: string[] = [];
  const sandbox = {
    console: {
      log: (...args: unknown[]) => logs.push(args.map((item) => String(item)).join(' '))
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 1500 });
  return { output: logs.join('\n') };
}
