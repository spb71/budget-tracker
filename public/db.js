let db;

const pendingObjectStoreName = "pending";

// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
  let db = event.target.result;

  console.log(event);

  if (!db.objectStoreNames.contains(pendingObjectStoreName)) {
    db.createObjectStore(pendingObjectStoreName, {
      autoIncrement: true,
    });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  console.log(db);
  console.log(`Excellent! ${event.type}`);
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = (event) => console.error(event);

function checkDatabase() {
  let transaction = db.transaction([pendingObjectStoreName], "readwrite");

  let store = transaction.objectStore(pendingObjectStoreName);

  const getAll = store.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          transaction = db.transaction([pendingObjectStoreName], "readwrite");

          // access your pending object store
          store = transaction.objectStore(pendingObjectStoreName);

          // clear all items in your store
          store.clear();
        });
    }
  };
}

// eslint-disable-next-line no-unused-vars
function saveRecord(record) {
  const db = request.result;

  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction([pendingObjectStoreName], "readwrite");

  // access your pending object store
  const store = transaction.objectStore(pendingObjectStoreName);

  // add record to your store with add method.
  store.add(record);
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
