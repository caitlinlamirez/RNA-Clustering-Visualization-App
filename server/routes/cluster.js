import cluster from 'cluster';
import { availableParallelism } from 'node:os';
import process from 'node:process';

// Determine the number of CPUs available
const numCPUs = 2;

// Function to start a cluster
function startCluster() {
  if (cluster.isPrimary && process.pid !== 3005) {
    console.log(`PRIMARY ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Listen for worker exit events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`WORKER ${worker.process.pid} died`);
    });

  }
}


export default startCluster;
