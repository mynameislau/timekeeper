const path = require("path");
const jsonServer = require("json-server");
const jsonServerApp = jsonServer.create();
const db = require("./db.json");
const router = jsonServer.router(db);

const middlewares = jsonServer.defaults({
  static: path.join(__dirname, "../front/dist"),
});

jsonServerApp.use(middlewares);

jsonServerApp.use((_req, res, next) => {
  setTimeout(() => {
    if (Math.random() < 0) {
      // editer pour tester les erreurs
      res.status(500).jsonp({
        Message: "test server error",
      });
    } else {
      next();
    }
  }, 500 + Math.random() * 500);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
jsonServerApp.use(jsonServer.bodyParser);
jsonServerApp.post("/api/v3/timers/start", (req, res) => {
  // if (req.method === 'POST') {
  //   req.body.createdAt = Date.now()
  // }
  const id = 10000000 + db.timeentries.data.items.length;
  db.timeentries.data.items.push({
    id,
    startsAt: req.body.date,
    endsAt: null,
  });
  res.send(
    JSON.stringify({
      data: {
        id,
      },
    })
  );
});

jsonServerApp.post("/api/v3/timers/stop", (req, res) => {
  // if (req.method === 'POST') {
  //   req.body.createdAt = Date.now()
  // }
  const entry = db.timeentries.data.items.find(
    (entry) => entry.endsAt === null
  );

  if (!entry) {
    res.status(500).jsonp({
      Message: "server error",
    });
  }

  db.timeentries.data.items = db.timeentries.data.items.map((entry) =>
    entry.endsAt === null ? { ...entry, endsAt: req.body.date } : entry
  );

  res.send(
    JSON.stringify({
      data: {
        id: entry.id,
      },
    })
  );
});

jsonServerApp.use("/api/v3/", router);

const port = 3001;
jsonServerApp.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});
