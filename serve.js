import http from "node:http";
import serve from "serve-handler";
import { PUBLIC_DIR } from "./constants.js";

const server = http.createServer((request, response) => {
  return serve(request, response, { public: PUBLIC_DIR });
});

server.listen(3000, () => {
  console.log("Running at http://localhost:3000");
});
