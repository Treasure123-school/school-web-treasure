/**
 * Load Test Runner Script
 * Simulates concurrent users to test system performance
 * Run with: npx tsx scripts/run-load-test.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

interface LoadTestResult {
  scenario: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  minResponseTime: number;
  maxResponseTime: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  duration: number;
}

interface RequestTiming {
  success: boolean;
  responseTime: number;
  status?: number;
  error?: string;
}

async function makeRequest(
  url: string, 
  options: RequestInit = {},
  token?: string
): Promise<RequestTiming> {
  const start = performance.now();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    const responseTime = performance.now() - start;
    
    return {
      success: response.ok,
      responseTime,
      status: response.status
    };
  } catch (error: any) {
    return {
      success: false,
      responseTime: performance.now() - start,
      error: error.message
    };
  }
}

function calculatePercentile(sortedTimes: number[], percentile: number): number {
  if (sortedTimes.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1;
  return sortedTimes[Math.max(0, index)];
}

async function loginUser(username: string, password: string, retries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log(`    Login successful for ${username} (attempt ${attempt})`);
          return data.token;
        }
      }
      
      const errorText = await response.text();
      console.log(`    Login attempt ${attempt}/${retries} for ${username} failed: ${response.status} - ${errorText.substring(0, 100)}`);
      
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    } catch (err: any) {
      console.log(`    Login attempt ${attempt}/${retries} for ${username} error: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  return null;
}

async function waitForServer(maxWait = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        console.log('  Server is ready.');
        return true;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('  Server not responding within timeout.');
  return false;
}

async function runScenario(
  name: string,
  concurrency: number,
  duration: number,
  requestFn: () => Promise<RequestTiming>
): Promise<LoadTestResult> {
  const results: RequestTiming[] = [];
  const startTime = Date.now();
  const endTime = startTime + duration * 1000;
  
  console.log(`\n  Starting scenario: ${name}`);
  console.log(`  Concurrency: ${concurrency}, Duration: ${duration}s`);
  
  const workers: Promise<void>[] = [];
  
  for (let i = 0; i < concurrency; i++) {
    workers.push((async () => {
      while (Date.now() < endTime) {
        const result = await requestFn();
        results.push(result);
        await new Promise(r => setTimeout(r, 10));
      }
    })());
  }
  
  await Promise.all(workers);
  
  const actualDuration = (Date.now() - startTime) / 1000;
  const sortedTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
  const successfulRequests = results.filter(r => r.success).length;
  
  const result: LoadTestResult = {
    scenario: name,
    totalRequests: results.length,
    successfulRequests,
    failedRequests: results.length - successfulRequests,
    minResponseTime: Math.min(...sortedTimes),
    maxResponseTime: Math.max(...sortedTimes),
    avgResponseTime: sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length,
    p50ResponseTime: calculatePercentile(sortedTimes, 50),
    p95ResponseTime: calculatePercentile(sortedTimes, 95),
    p99ResponseTime: calculatePercentile(sortedTimes, 99),
    requestsPerSecond: results.length / actualDuration,
    errorRate: ((results.length - successfulRequests) / results.length) * 100,
    duration: actualDuration
  };
  
  console.log(`  Completed: ${results.length} requests, ${successfulRequests} successful`);
  console.log(`  Avg response: ${result.avgResponseTime.toFixed(2)}ms, P95: ${result.p95ResponseTime.toFixed(2)}ms`);
  
  return result;
}

async function runLoadTests() {
  console.log('='.repeat(60));
  console.log('  LOAD TEST SUITE - Treasure-Home School Portal');
  console.log('='.repeat(60));
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Started at: ${new Date().toISOString()}`);
  
  const allResults: LoadTestResult[] = [];
  
  console.log('\n  Waiting for server to be ready...');
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('  ERROR: Server not available. Exiting.');
    process.exit(1);
  }
  
  console.log('\n  Obtaining authentication tokens...');
  const studentToken = await loginUser('student', 'Student@123');
  const teacherToken = await loginUser('teacher', 'Teacher@123');
  const adminToken = await loginUser('admin', 'Admin@123');
  
  console.log(`  Tokens obtained: Student=${!!studentToken}, Teacher=${!!teacherToken}, Admin=${!!adminToken}`);

  console.log('\n--- Scenario 1: Health Check (Low Load) ---');
  allResults.push(await runScenario(
    'Health Check - 10 concurrent',
    10, 10,
    () => makeRequest(`${BASE_URL}/api/health`)
  ));

  console.log('\n--- Scenario 2: Public Homepage (Medium Load) ---');
  allResults.push(await runScenario(
    'Homepage Content - 50 concurrent',
    50, 15,
    () => makeRequest(`${BASE_URL}/api/public/homepage-content`)
  ));

  console.log('\n--- Scenario 3: Class List (Authenticated) ---');
  if (adminToken) {
    allResults.push(await runScenario(
      'Class List - 30 concurrent',
      30, 15,
      () => makeRequest(`${BASE_URL}/api/classes`, {}, adminToken)
    ));
  }

  console.log('\n--- Scenario 4: Announcements (High Load) ---');
  allResults.push(await runScenario(
    'Announcements - 100 concurrent',
    100, 20,
    () => makeRequest(`${BASE_URL}/api/announcements`)
  ));

  console.log('\n--- Scenario 5: Mixed Workload Simulation ---');
  const mixedEndpoints = [
    { url: '/api/health', auth: false },
    { url: '/api/public/homepage-content', auth: false },
    { url: '/api/announcements', auth: false },
    { url: '/api/classes', auth: true, token: adminToken },
    { url: '/api/subjects', auth: true, token: adminToken }
  ];
  
  allResults.push(await runScenario(
    'Mixed Workload - 75 concurrent',
    75, 20,
    async () => {
      const endpoint = mixedEndpoints[Math.floor(Math.random() * mixedEndpoints.length)];
      return makeRequest(
        `${BASE_URL}${endpoint.url}`,
        {},
        endpoint.auth ? endpoint.token || undefined : undefined
      );
    }
  ));

  console.log('\n--- Scenario 6: High Concurrency Stress Test ---');
  allResults.push(await runScenario(
    'Stress Test - 200 concurrent',
    200, 15,
    () => makeRequest(`${BASE_URL}/api/health`)
  ));

  console.log('\n\n' + '='.repeat(60));
  console.log('  LOAD TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n  | Scenario                    | Requests | RPS   | Avg(ms) | P95(ms) | P99(ms) | Errors |');
  console.log('  |' + '-'.repeat(28) + '|' + '-'.repeat(10) + '|' + '-'.repeat(7) + '|' + '-'.repeat(9) + '|' + '-'.repeat(9) + '|' + '-'.repeat(9) + '|' + '-'.repeat(8) + '|');
  
  for (const r of allResults) {
    const name = r.scenario.substring(0, 26).padEnd(26);
    const requests = r.totalRequests.toString().padStart(8);
    const rps = r.requestsPerSecond.toFixed(1).padStart(5);
    const avg = r.avgResponseTime.toFixed(1).padStart(7);
    const p95 = r.p95ResponseTime.toFixed(1).padStart(7);
    const p99 = r.p99ResponseTime.toFixed(1).padStart(7);
    const errors = (r.errorRate.toFixed(1) + '%').padStart(6);
    console.log(`  | ${name} | ${requests} | ${rps} | ${avg} | ${p95} | ${p99} | ${errors} |`);
  }

  const totalRequests = allResults.reduce((sum, r) => sum + r.totalRequests, 0);
  const avgRps = allResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / allResults.length;
  const avgP95 = allResults.reduce((sum, r) => sum + r.p95ResponseTime, 0) / allResults.length;
  const avgErrorRate = allResults.reduce((sum, r) => sum + r.errorRate, 0) / allResults.length;

  console.log('\n' + '='.repeat(60));
  console.log('  AGGREGATE METRICS');
  console.log('='.repeat(60));
  console.log(`  Total Requests:        ${totalRequests.toLocaleString()}`);
  console.log(`  Average RPS:           ${avgRps.toFixed(1)}`);
  console.log(`  Average P95 Latency:   ${avgP95.toFixed(1)}ms`);
  console.log(`  Average Error Rate:    ${avgErrorRate.toFixed(2)}%`);

  console.log('\n' + '='.repeat(60));
  console.log('  PERFORMANCE ASSESSMENT');
  console.log('='.repeat(60));
  
  const issues: string[] = [];
  const strengths: string[] = [];
  
  for (const r of allResults) {
    if (r.p95ResponseTime > 500) {
      issues.push(`${r.scenario}: P95 latency ${r.p95ResponseTime.toFixed(0)}ms exceeds 500ms target`);
    } else if (r.p95ResponseTime < 100) {
      strengths.push(`${r.scenario}: Excellent P95 latency ${r.p95ResponseTime.toFixed(0)}ms`);
    }
    
    if (r.errorRate > 1) {
      issues.push(`${r.scenario}: Error rate ${r.errorRate.toFixed(1)}% exceeds 1% target`);
    } else if (r.errorRate === 0) {
      strengths.push(`${r.scenario}: Zero errors`);
    }
  }
  
  if (strengths.length > 0) {
    console.log('\n  STRENGTHS:');
    strengths.forEach(s => console.log(`    + ${s}`));
  }
  
  if (issues.length > 0) {
    console.log('\n  ISSUES FOUND:');
    issues.forEach(i => console.log(`    - ${i}`));
  }
  
  if (issues.length === 0) {
    console.log('\n  STATUS: All scenarios passed performance targets');
  }

  console.log('\n' + '='.repeat(60));
  console.log('  RECOMMENDATIONS');
  console.log('='.repeat(60));
  console.log('  1. Monitor P95 latency during peak hours');
  console.log('  2. Consider Redis caching for session data at >500 users');
  console.log('  3. Enable connection pooling for database if not already');
  console.log('  4. Use CDN for static assets in production');
  console.log('  5. Implement rate limiting for public endpoints');
  
  console.log('\n  Completed at: ' + new Date().toISOString());
  console.log('='.repeat(60));
  
  return {
    summary: {
      totalRequests,
      avgRps,
      avgP95,
      avgErrorRate,
      scenarioCount: allResults.length
    },
    results: allResults,
    issues,
    strengths
  };
}

runLoadTests()
  .then(report => {
    console.log('\n  Load test completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('  Load test failed:', error);
    process.exit(1);
  });
