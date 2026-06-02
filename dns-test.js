const dns = require("dns").promises;

dns.resolveSrv("_mongodb._tcp.cluster0.iq43lin.mongodb.net")
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.error(err);
  });