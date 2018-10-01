use infoq_news

db.createCollection("development")

db.development.createIndex({title: 1},{unique: true})


