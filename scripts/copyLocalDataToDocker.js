import { readFile } from 'node:fs/promises';
import { MongoClient } from 'mongodb';

// Copy records directly between local databases without writing credentials or
// user data to files or images. Existing Docker records are never overwritten.
const config = JSON.parse(await readFile(new URL('../ml/db_config.json', import.meta.url), 'utf8'));
const source = new MongoClient(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
const destination = new MongoClient(process.env.DOCKER_MONGO_URI || 'mongodb://127.0.0.1:27018', { serverSelectionTimeoutMS: 5000 });
try {
  await source.connect();
  await destination.connect();
  const sourceDB = source.db(config.DB_NAME || 'clothing_assistant_db');
  const destinationDB = destination.db('clothing_assistant_db');
  const existing = await destinationDB.listCollections({ type: 'collection' }).toArray();
  for (const collection of existing) {
    if (await destinationDB.collection(collection.name).countDocuments() > 0) {
      throw new Error('The Docker database already contains records. No data was copied or overwritten.');
    }
  }
  const collections = await sourceDB.listCollections({ type: 'collection' }).toArray();
  let total = 0;
  for (const { name, options } of collections) {
    if (!existing.some((collection) => collection.name === name)) await destinationDB.createCollection(name, options);
    const sourceCollection = sourceDB.collection(name);
    const targetCollection = destinationDB.collection(name);
    const cursor = sourceCollection.find({});
    let batch = [];
    let count = 0;
    for await (const document of cursor) {
      batch.push(document);
      if (batch.length === 500) {
        await targetCollection.insertMany(batch);
        count += batch.length;
        batch = [];
      }
    }
    if (batch.length) { await targetCollection.insertMany(batch); count += batch.length; }
    const indexes = (await sourceCollection.listIndexes().toArray()).filter((index) => index.name !== '_id_');
    for (const index of indexes) {
      const indexOptions = { name: index.name };
      for (const key of ['unique', 'sparse', 'expireAfterSeconds', 'partialFilterExpression', 'collation', 'hidden']) {
        if (index[key] !== undefined) indexOptions[key] = index[key];
      }
      await targetCollection.createIndex(index.key, indexOptions);
    }
    total += count;
    console.log(`${name}: copied ${count} records`);
  }
  console.log(`Copied ${total} records to Docker. The original local database is unchanged.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await Promise.all([source.close(), destination.close()]);
}
