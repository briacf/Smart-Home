from pymongo import *
import tensorflow as tf

client = MongoClient('mongodb://localhost:27017/deco3801-nonpc')

db = client['deco3801-nonpc']

users = db.users
devices = db.appliances


