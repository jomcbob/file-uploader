const { Client } = require("pg");

const SQL =  `
   SELECT 1 + 1 AS "one plus one";
`

async function main() {
  console.log("seeding...")
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect()
  await client.query(SQL)
  await client.end()
  console.log(SQL)
  console.log('seeded!')
}

main()
