const queue: any[] = [];
const pResolve = Promise.resolve();

export function nextTick(callback) {
  return callback ? pResolve.then(callback) : pResolve;
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  
  queueFlush();
}

function queueFlush() {
  nextTick(() => {
    let job;
    while ((job = queue.shift())) {
      job && job();
    }
  });
}
