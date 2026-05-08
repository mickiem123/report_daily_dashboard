window.tests = [];

window.test = function (name, fn) {
  window.tests.push({ name, fn });
};

window.assert = function (cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
};

window.assertEq = function (got, want, msg) {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) throw new Error(`${msg || "not equal"}: expected ${b}, got ${a}`);
};

window.runTests = function () {
  const results = document.getElementById("results");
  let pass = 0;
  let fail = 0;
  for (const t of window.tests) {
    try {
      t.fn();
      pass += 1;
      results.innerHTML += `<div style="color:#5fc992">PASS ${t.name}</div>`;
    } catch (err) {
      fail += 1;
      results.innerHTML += `<div style="color:#ff6363">FAIL ${t.name}: ${err.message}</div>`;
    }
  }
  results.innerHTML += `<hr><div><strong>${pass} passed, ${fail} failed</strong></div>`;
  console.log(`${pass} passed, ${fail} failed`);
};
