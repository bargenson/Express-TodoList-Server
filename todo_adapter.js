var todos = [];

var redis = require('redis'),
	url = require("url"),
	redisClient = buildRedisClient(),
	redisKey = "todos";

redisClient.on("error", function (err) {
	console.log("Redis Client Error: " + err);
});

var todoAdapter = {

	addTodo: function(todo, callback) {
		if(todo.isValid()) {
			redisClient.rpush(redisKey, JSON.stringify(todo), function(err, index) {
				callback(err, index);
			});
		} else {
			callback({
				message: "The todo is not valid"
			}, null);
		}
	},

	getTodos: function(callback) {
		redisClient.lrange(redisKey, 0, -1, function(err, result) {
			var todos = result.map(function(json) {
				return JSON.parse(json);
			});
			callback(err, todos);
		});
	},

	getTodo: function(todoId, callback) {
		if(todoId > 0) {
			var todo = redisClient.lindex(redisKey, todoId - 1, function(err, todo) {
				callback(err, JSON.parse(todo));
			});
		} else {
			callback(null, null);
		}
	}

};

function buildRedisClient() {
	var redisUrl, client;
	if(process.env.REDISTOGO_URL) {
		redisUrl = url.parse(process.env.REDISTOGO_URL);
		client = redis.createClient(redisUrl.port, redisUrl.hostname);
		client.auth(redisUrl.auth.split(":")[1]);
	} else {
		client = redis.createClient();
	}
	return client;
}

exports.todoAdapter = todoAdapter;